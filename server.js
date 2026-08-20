require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET" || JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be set to a random value of at least 32 characters.");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function query(text, params = [], client = pool) {
  return client.query(text, params);
}
async function one(text, params = [], client = pool) {
  const result = await query(text, params, client);
  return result.rows[0] || null;
}
async function many(text, params = [], client = pool) {
  const result = await query(text, params, client);
  return result.rows;
}
async function exec(text, params = [], client = pool) {
  return query(text, params, client);
}
async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

async function initializeDatabase() {
  // Production database schema is managed in Supabase, not applied from files at every startup.
  // This keeps the public web repository from exposing database DDL and avoids schema changes
  // being executed implicitly during a web-service restart. The startup checks below are
  // additive/idempotent only.
  await exec(`ALTER TABLE owner_accounts
    ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS password_reset_used_at TIMESTAMPTZ`);

  // Seed only the fixed public membership plans if they do not already exist.
  await exec(`
    INSERT INTO membership_plans (duration, session_type, price)
    VALUES
      ('day','single',2000),
      ('day','double',3000),
      ('week','single',8000),
      ('week','double',10000),
      ('month','single',30000),
      ('month','double',35000)
    ON CONFLICT (duration, session_type) DO NOTHING
  `);

  // Manager/Staff password-reset fields are additive and safe for existing PostgreSQL data.
  // Bootstrap the primary owner from Render environment variables once.
  // Additional owners are stored securely in the database.
  if (process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD) {
    const existingPrimary = await one("SELECT id FROM owner_accounts WHERE is_primary=true LIMIT 1");
    if (!existingPrimary) {
      const hash = await bcrypt.hash(process.env.OWNER_PASSWORD, 12);
      await exec(`
        INSERT INTO owner_accounts (full_name, email, password_hash, role, status, is_primary)
        VALUES ($1, $2, $3, 'super_owner', 'active', true)
      `, ["Primary Owner", process.env.OWNER_EMAIL.trim().toLowerCase(), hash]);
    }
  }
}

const configuredOrigins = String(process.env.FRONTEND_ORIGIN || "").split(",").map(v => v.trim()).filter(Boolean);
const allowedOrigins = new Set(configuredOrigins.length ? configuredOrigins : ["http://localhost:3000"]);
if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
  console.error("FRONTEND_ORIGIN is required in production.");
  process.exit(1);
}
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, allowedOrigins.has(origin));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https:"]
    }
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());
app.use("/api/auth", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api/me", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api/owner", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

// Browser-side state changes must originate from the published VMC site.
// CORS controls reads, while this check adds a server-side CSRF boundary for
// credentialed POST/PATCH/PUT/DELETE requests. Non-browser clients without an
// Origin header are still allowed for operational/API tooling.
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("Origin");
    const expected = FRONTEND_ORIGIN;
    // Credentialed browser requests must identify the published origin. This
    // closes the CSRF gap for browsers that send no Origin header on some
    // navigation-like requests while preserving non-cookie operational calls.
    if (req.cookies?.vmc_session && origin !== expected) {
      return jsonError(res, 403, "Request origin is not allowed.");
    }
    if (origin && origin !== expected) return jsonError(res, 403, "Request origin is not allowed.");
  }
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please wait and try again." }
});
app.use("/api/auth", authLimiter);

function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

async function memberId(client = pool) {
  const row = await one("SELECT nextval('public.vmc_member_number_seq') AS next_id", [], client);
  return `VMC-${String(Number(row?.next_id || 1)).padStart(6, "0")}`;
}

function expiryDate(start, duration) {
  const d = new Date(`${start}T00:00:00`);
  if (duration === "day") return start;
  if (duration === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: process.env.COOKIE_SAMESITE || "none",
    // Production is intended to be same-origin: the Render service serves both
    // the public site and the API. This keeps the session cookie same-site.
    partitioned: process.env.COOKIE_PARTITIONED === "true",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/"
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h", issuer: "vmc-xtreme" });
}

function requireAuth(req, res, next) {
  const token = req.cookies.vmc_session;
  if (!token) return jsonError(res, 401, "Authentication required.");
  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: "vmc-xtreme" });
    next();
  } catch {
    return jsonError(res, 401, "Session expired or invalid.");
  }
}

function requireOwner(req, res, next) {
  requireAuth(req, res, async () => {
    if (req.user.role !== "owner") return jsonError(res, 403, "Owner access required.");
    try {
      const owner = await one("SELECT id, role, status, is_primary FROM owner_accounts WHERE id=$1", [req.user.sub]);
      if (!owner || owner.status !== "active") return jsonError(res, 401, "Owner account is inactive or unavailable.");
      req.owner = owner;
      next();
    } catch (error) {
      console.error(error);
      return jsonError(res, 500, "Unexpected server error.");
    }
  });
}
function requireCustomer(req, res, next) {
  requireAuth(req, res, async () => {
    if (req.user.role !== "customer") return jsonError(res, 403, "Customer access required.");
    try {
      const customer = await one("SELECT id, account_status FROM customers WHERE id=$1", [req.user.sub]);
      if (!customer || customer.account_status !== "active") return jsonError(res, 401, "Customer account is inactive or unavailable.");
      req.customer = customer;
      next();
    } catch (error) {
      console.error(error);
      return jsonError(res, 500, "Unexpected server error.");
    }
  });
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please wait and try again." }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false
});

async function checkSuperOwner(req, res, next) {
  requireOwner(req, res, async () => {
    try {
      const owner = await one("SELECT id, role, status FROM owner_accounts WHERE id=$1", [req.user.sub]);
      if (!owner || owner.status !== "active" || owner.role !== "super_owner") {
        return jsonError(res, 403, "Super Owner access required.");
      }
      next();
    } catch (error) {
      console.error(error);
      return jsonError(res, 500, "Unexpected server error.");
    }
  });
}
const requireSuperOwner = checkSuperOwner;

async function audit(actorType, actorId, action, entityType, entityId, metadata = {}, client = pool) {
  await exec(`
    INSERT INTO audit_log
      (actor_type, actor_id, action, entity_type, entity_id, metadata_json)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [actorType, actorId || null, action, entityType, entityId || null, JSON.stringify(metadata)], client);
}

app.get("/api/health", async (_req, res) => {
  try {
    await one("SELECT 1 AS ok");
    res.json({ ok: true, service: "VMC Xtreme Membership Platform", version: "4.0.0", database: "postgresql" });
  } catch (error) {
    console.error(error);
    res.status(503).json({ ok: false, service: "VMC Xtreme Membership Platform", database: "unavailable" });
  }
});

app.get("/api/plans", async (_req, res, next) => {
  try {
    const plans = await many("SELECT id, duration, session_type, price FROM membership_plans WHERE active=true ORDER BY id");
    res.json(plans);
  } catch (error) { next(error); }
});

app.get("/api/public-registration-status", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ enabled: process.env.PUBLIC_REGISTRATION_ENABLED === "true" });
});

app.post("/api/auth/register", registrationLimiter, async (req, res, next) => {
  try {
    if (process.env.PUBLIC_REGISTRATION_ENABLED !== "true") {
      return jsonError(res, 503, "Customer registration is coming soon. Please contact VMC directly.");
    }
    const { fullName, dob, gender, phone, email, emergencyContact,
      duration, sessionType, paymentMethod, paymentReference,
      password, rulesAccepted, rulesVersion } = req.body;

    const cleanFullName = String(fullName || "").trim();
    const cleanDob = String(dob || "").trim();
    const cleanGender = String(gender || "").trim();
    const cleanPhone = String(phone || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanEmergency = String(emergencyContact || "").trim();
    const cleanReference = String(paymentReference || "").trim();

    if (!cleanFullName || !cleanDob || !cleanGender || !cleanPhone || !cleanEmail || !cleanEmergency ||
        !duration || !sessionType || !paymentMethod || !password || !rulesAccepted) {
      return jsonError(res, 400, "All required registration fields must be completed.");
    }
    if (cleanFullName.length > 120 || cleanPhone.length > 40 || cleanEmail.length > 254 || cleanEmergency.length > 120 || cleanReference.length > 120) {
      return jsonError(res, 400, "One or more fields are too long.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return jsonError(res, 400, "Enter a valid email address.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) return jsonError(res, 400, "Enter a valid date of birth.");
    const dobDate = new Date(`${cleanDob}T00:00:00Z`);
    if (Number.isNaN(dobDate.getTime()) || dobDate > new Date()) return jsonError(res, 400, "Date of birth cannot be in the future.");
    if (password.length < 8 || password.length > 128) return jsonError(res, 400, "Password must be between 8 and 128 characters.");
    if (rulesVersion && rulesVersion !== "VMC Rules v1.0") return jsonError(res, 400, "The current VMC rules must be accepted.");
    if (!["day","week","month"].includes(duration)) return jsonError(res, 400, "Invalid membership duration.");
    if (!["single","double"].includes(sessionType)) return jsonError(res, 400, "Invalid session type.");
    if (!["Airtel Money","TNM Mpamba","National Bank","Cash"].includes(paymentMethod)) {
      return jsonError(res, 400, "Invalid payment method.");
    }

    const existing = await one("SELECT id FROM customers WHERE email=$1", [cleanEmail]);
    if (existing) return jsonError(res, 409, "An account with that email already exists.");

    const plan = await one(`
      SELECT * FROM membership_plans
      WHERE duration=$1 AND session_type=$2 AND active=true
    `, [duration, sessionType]);
    if (!plan) return jsonError(res, 400, "Selected membership plan is unavailable.");

    const startDate = new Date().toISOString().slice(0, 10);
    const expiry = expiryDate(startDate, duration);
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await withTransaction(async (client) => {
      const id = await memberId(client);
      const customer = await one(`
        INSERT INTO customers
          (member_id, full_name, dob, gender, phone, email, emergency_contact, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [id, cleanFullName, cleanDob, cleanGender, cleanPhone, cleanEmail, cleanEmergency, passwordHash], client);
      const membership = await one(`
        INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status)
        VALUES ($1, $2, $3, $4, 'pending_payment')
        RETURNING id
      `, [customer.id, plan.id, startDate, expiry], client);
      await exec(`
        INSERT INTO payments
          (customer_id, membership_id, amount, method, reference, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
      `, [customer.id, membership.id, plan.price, paymentMethod, cleanReference || null], client);
      await exec(`
        INSERT INTO rules_acceptance (customer_id, rules_version, accepted)
        VALUES ($1, $2, true)
      `, [customer.id, rulesVersion || "VMC Rules v1.0"], client);
      await audit("customer", customer.id, "REGISTERED", "customer", customer.id, {}, client);
      return id;
    });

    return res.status(201).json({ memberId: result, membership: { duration, sessionType, amount: plan.price, startDate, expiryDate: expiry, status: "pending_payment" } });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return jsonError(res, 400, "Email and password are required.");
    const customer = await one(`SELECT * FROM customers WHERE email=$1 AND account_status='active'`, [String(email).trim().toLowerCase()]);
    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) return jsonError(res, 401, "Invalid email or password.");
    const token = signToken({ sub: customer.id, role: "customer" });
    res.cookie("vmc_session", token, authCookieOptions());
    res.json({ memberId: customer.member_id, role: "customer" });
  } catch (error) { next(error); }
});

app.post("/api/auth/change-password", requireCustomer, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    if (!currentPassword || !newPassword || !confirmPassword) return jsonError(res, 400, "All password fields are required.");
    if (newPassword.length < 8) return jsonError(res, 400, "New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return jsonError(res, 400, "New passwords do not match.");
    const customer = await one("SELECT id, password_hash, account_status FROM customers WHERE id=$1", [req.user.sub]);
    if (!customer || customer.account_status !== "active") return jsonError(res, 401, "Customer account is not active.");
    if (!(await bcrypt.compare(currentPassword, customer.password_hash))) return jsonError(res, 401, "Current password is incorrect.");
    if (await bcrypt.compare(newPassword, customer.password_hash)) return jsonError(res, 400, "New password must be different from your current password.");
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await exec("UPDATE customers SET password_hash=$1, password_reset_token_hash=NULL, password_reset_expires_at=NULL, password_reset_used_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [passwordHash, customer.id]);
    await audit("customer", customer.id, "PASSWORD_CHANGED", "customer", customer.id);
    const token = signToken({ sub: customer.id, role: "customer" });
    res.cookie("vmc_session", token, authCookieOptions());
    res.json({ ok: true, message: "Password changed successfully." });
  } catch (error) { next(error); }
});

app.post("/api/auth/staff-forgot-password", passwordResetLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const generic = "If the Manager or Staff account exists, a reset request has been sent to the Super Owner.";
    if (!email) return res.json({ ok: true, message: generic });
    const account = await one("SELECT id, role, status FROM owner_accounts WHERE email=$1", [email]);
    if (account && ["manager", "staff"].includes(account.role) && account.status === "active") {
      await exec("UPDATE owner_accounts SET password_reset_requested_at=CURRENT_TIMESTAMP, password_reset_token_hash=NULL, password_reset_expires_at=NULL, password_reset_used_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$1", [account.id]);
    }
    res.json({ ok: true, message: generic });
  } catch (error) { next(error); }
});

app.post("/api/auth/staff-reset-password", passwordResetLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    if (!email || !code || !newPassword || !confirmPassword) return jsonError(res, 400, "Email, reset code and all password fields are required.");
    if (newPassword.length < 8) return jsonError(res, 400, "New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return jsonError(res, 400, "New passwords do not match.");
    const account = await one("SELECT id, full_name, role, status, password_hash, password_reset_token_hash, password_reset_expires_at, password_reset_used_at FROM owner_accounts WHERE email=$1", [email]);
    if (!account || !["manager", "staff"].includes(account.role) || account.status !== "active" || !account.password_reset_token_hash || account.password_reset_used_at || !account.password_reset_expires_at || new Date(account.password_reset_expires_at).getTime() < Date.now()) return jsonError(res, 400, "The reset code is invalid or has expired. Please request a new reset.");
    if (hashResetToken(code) !== account.password_reset_token_hash) return jsonError(res, 400, "The reset code is invalid or has expired. Please request a new reset.");
    if (await bcrypt.compare(newPassword, account.password_hash)) return jsonError(res, 400, "New password must be different from your previous password.");
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await exec("UPDATE owner_accounts SET password_hash=$1, password_reset_token_hash=NULL, password_reset_expires_at=NULL, password_reset_used_at=CURRENT_TIMESTAMP, password_reset_requested_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [passwordHash, account.id]);
    await audit("owner", account.id, "STAFF_PASSWORD_RESET_COMPLETED", "owner", account.id, { role: account.role });
    res.json({ ok: true, message: "Password reset successfully. You can now sign in." });
  } catch (error) { next(error); }
});

app.post("/api/auth/owner-login", loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return jsonError(res, 400, "Email and password are required.");
    const owner = await one(`SELECT id, full_name, email, password_hash, role, status, is_primary FROM owner_accounts WHERE email=$1`, [email]);
    if (!owner || owner.status !== "active" || !(await bcrypt.compare(password, owner.password_hash))) return jsonError(res, 401, "Invalid owner credentials.");
    const token = signToken({ sub: owner.id, role: "owner", ownerRole: owner.role, isPrimary: owner.is_primary === true });
    res.cookie("vmc_session", token, authCookieOptions());
    await audit("owner", owner.id, "OWNER_LOGIN", "owner", owner.id, { role: owner.role });
    res.json({ role: "owner", ownerRole: owner.role, fullName: owner.full_name });
  } catch (error) { next(error); }
});

app.post("/api/auth/owner-change-password", requireOwner, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    if (!currentPassword || !newPassword || !confirmPassword) return jsonError(res, 400, "All password fields are required.");
    if (newPassword.length < 8) return jsonError(res, 400, "New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return jsonError(res, 400, "New passwords do not match.");
    const account = await one("SELECT id, role, status, password_hash FROM owner_accounts WHERE id=$1", [req.user.sub]);
    if (!account || account.status !== "active") return jsonError(res, 401, "Account is inactive.");
    if (!(await bcrypt.compare(currentPassword, account.password_hash))) return jsonError(res, 401, "Current password is incorrect.");
    if (await bcrypt.compare(newPassword, account.password_hash)) return jsonError(res, 400, "New password must be different from your current password.");
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await exec("UPDATE owner_accounts SET password_hash=$1, password_reset_token_hash=NULL, password_reset_expires_at=NULL, password_reset_used_at=NULL, password_reset_requested_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [passwordHash, account.id]);
    await audit("owner", account.id, "OWNER_PASSWORD_CHANGED", "owner", account.id, { role: account.role });
    res.json({ ok: true, message: "Password changed successfully." });
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("vmc_session", authCookieOptions());
  res.status(204).end();
});

app.get("/api/me", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === "owner") return res.json({ role: "owner" });
    const customer = await one(`
      SELECT id, member_id, full_name, dob, gender, phone, email, emergency_contact, created_at
      FROM customers WHERE id=$1
    `, [req.user.sub]);
    if (!customer) return jsonError(res, 404, "Customer not found.");
    const membership = await one(`
      SELECT m.id, p.duration, p.session_type, p.price, m.start_date, m.expiry_date, m.status,
             pay.id AS payment_id, pay.method, pay.reference, pay.status AS payment_status
      FROM memberships m
      JOIN membership_plans p ON p.id=m.plan_id
      LEFT JOIN payments pay ON pay.membership_id=m.id
      WHERE m.customer_id=$1
      ORDER BY m.id DESC LIMIT 1
    `, [req.user.sub]);
    res.json({ role: "customer", customer, membership: membership || null });
  } catch (error) { next(error); }
});

app.get("/api/owner/password-reset-requests", requireSuperOwner, async (_req, res, next) => {
  try {
    const rows = await many(`SELECT id, full_name, email, role, password_reset_requested_at FROM owner_accounts WHERE role IN ('manager','staff') AND status='active' AND password_reset_requested_at IS NOT NULL AND password_reset_used_at IS NULL ORDER BY password_reset_requested_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

app.post("/api/owner/password-reset-requests/:accountId/approve", requireSuperOwner, async (req, res, next) => {
  try {
    const id = Number(req.params.accountId);
    if (!Number.isInteger(id)) return jsonError(res, 400, "Invalid staff account.");
    const account = await one("SELECT id, full_name, email, role, status FROM owner_accounts WHERE id=$1 AND role IN ('manager','staff')", [id]);
    if (!account || account.status !== 'active') return jsonError(res, 404, "Active Manager/Staff account not found.");
    const pending = await one("SELECT password_reset_requested_at FROM owner_accounts WHERE id=$1 AND password_reset_requested_at IS NOT NULL AND password_reset_used_at IS NULL", [id]);
    if (!pending) return jsonError(res, 400, "No pending password reset request exists for this account.");
    const code = crypto.randomBytes(5).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await exec("UPDATE owner_accounts SET password_reset_token_hash=$1, password_reset_expires_at=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3", [hashResetToken(code), expiresAt, id]);
    await audit("owner", req.user.sub, "STAFF_PASSWORD_RESET_APPROVED", "owner", id, { role: account.role, expiresAt: expiresAt.toISOString() });
    res.json({ ok: true, fullName: account.full_name, email: account.email, role: account.role, code, expiresAt: expiresAt.toISOString() });
  } catch (error) { next(error); }
});

app.get("/api/owner/dashboard/stats", requireOwner, async (_req, res, next) => {
  try {
    const total = Number((await one("SELECT COUNT(*)::int AS count FROM customers")).count);
    const active = Number((await one("SELECT COUNT(*)::int AS count FROM memberships WHERE LOWER(status)='active' AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)")).count);
    const expired = Number((await one("SELECT COUNT(*)::int AS count FROM memberships WHERE LOWER(status)='expired' OR (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE)")).count);
    const expiringSoon = Number((await one("SELECT COUNT(*)::int AS count FROM memberships WHERE expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND LOWER(status)='active'")).count);
    const paymentsToday = Number((await one("SELECT COALESCE(SUM(amount),0)::int AS total FROM payments WHERE created_at::date=CURRENT_DATE AND LOWER(COALESCE(status,''))='verified'")).total);
    const paymentsMonth = Number((await one("SELECT COALESCE(SUM(amount),0)::int AS total FROM payments WHERE date_trunc('month', created_at)=date_trunc('month', CURRENT_TIMESTAMP) AND LOWER(COALESCE(status,''))='verified'")).total);
    const paymentMethods = await many("SELECT COALESCE(method,'Other') AS method, COALESCE(SUM(amount),0)::int AS total, COUNT(*)::int AS count FROM payments WHERE LOWER(COALESCE(status,''))='verified' GROUP BY method ORDER BY total DESC");
    const recentMembers = await many(`
      SELECT c.id, c.full_name, c.phone, c.member_id AS membership_id,
             COALESCE(m.status,'No membership') AS status,
             m.start_date, m.expiry_date
      FROM customers c
      LEFT JOIN memberships m ON m.id = (
        SELECT m2.id FROM memberships m2 WHERE m2.customer_id=c.id ORDER BY m2.id DESC LIMIT 1
      )
      ORDER BY c.id DESC LIMIT 8
    `);
    res.json({ok:true,stats:{total,active,expired,expiringSoon,paymentsToday,paymentsMonth},paymentMethods,recentMembers});
  } catch (error) { next(error); }
});

app.post("/api/owner/members", requireOwner, async (req, res, next) => {
  try {
    const { full_name, dob, gender, phone, email, emergency_contact, duration, session_type, start_date, amount, method, reference } = req.body;
    const allowedMethods = ["Airtel Money", "TNM Mpamba", "National Bank", "Cash"];
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanAmount = Number(amount);
    if (!full_name || !dob || !gender || !phone || !cleanEmail || !emergency_contact || !duration || !session_type || !start_date || !method || !Number.isFinite(cleanAmount) || cleanAmount < 0) {
      return jsonError(res, 400, "Please complete all required customer, membership and payment fields.");
    }
    if (!["day", "week", "month"].includes(duration) || !["single", "double"].includes(session_type) || !allowedMethods.includes(method)) return jsonError(res, 400, "Invalid membership or payment option.");
    const plan = await one("SELECT id, price FROM membership_plans WHERE duration=$1 AND session_type=$2 AND active=true", [duration, session_type]);
    if (!plan) return jsonError(res, 400, "Selected membership plan is unavailable.");
    if (Math.round(cleanAmount) !== Number(plan.price)) return jsonError(res, 400, "Payment amount must match the selected membership plan.");
    const existing = await one("SELECT id FROM customers WHERE email=$1", [cleanEmail]);
    if (existing) return jsonError(res, 409, "A customer with this email already exists.");
    const expiry = expiryDate(start_date, duration);
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    const result = await withTransaction(async (client) => {
      const id = await memberId(client);
      const customer = await one(`INSERT INTO customers (member_id, full_name, dob, gender, phone, email, emergency_contact, password_hash, account_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING id, member_id`, [id, full_name.trim(), dob, gender, phone.trim(), cleanEmail, emergency_contact.trim(), placeholderPassword], client);
      const membership = await one(`INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status) VALUES ($1,$2,$3,$4,'active') RETURNING id`, [customer.id, plan.id, start_date, expiry], client);
      const payment = await one(`INSERT INTO payments (customer_id, membership_id, amount, method, reference, status, verified_at) VALUES ($1,$2,$3,$4,$5,'verified',CURRENT_TIMESTAMP) RETURNING id`, [customer.id, membership.id, Math.round(cleanAmount), method, reference ? String(reference).trim() : null], client);
      await audit("owner", req.user.sub, "MANUAL_MEMBER_ADDED", "customer", customer.id, { membershipId: membership.id, paymentId: payment.id, method, amount: Math.round(cleanAmount) }, client);
      return { memberId: customer.member_id, expiryDate: expiry };
    });
    res.status(201).json({ ok: true, ...result });
  } catch (error) { next(error); }
});

app.get("/api/owner/profile", requireOwner, async (req, res, next) => {
  try {
    const owner = await one("SELECT id, full_name, email, role, status, is_primary, created_at FROM owner_accounts WHERE id=$1", [req.user.sub]);
    if (!owner) return jsonError(res, 404, "Owner account not found.");
    res.json(owner);
  } catch (error) { next(error); }
});

app.get("/api/owner/accounts", requireSuperOwner, async (req, res, next) => {
  try {
    const sql = req.user.isPrimary
      ? "SELECT id, full_name, email, role, status, is_primary, created_at FROM owner_accounts ORDER BY is_primary DESC, id ASC"
      : "SELECT id, full_name, email, role, status, is_primary, created_at FROM owner_accounts WHERE is_primary=false ORDER BY role, id ASC";
    res.json(await many(sql));
  } catch (error) { next(error); }
});

app.post("/api/owner/accounts", requireSuperOwner, async (req, res, next) => {
  try {
    const fullName = String(req.body.full_name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "manager");
    if (!fullName || !email || password.length < 8) return jsonError(res, 400, "Name, email and a password of at least 8 characters are required.");
    if (!["manager", "staff", "super_owner"].includes(role)) return jsonError(res, 400, "Invalid account role.");
    if (role === "super_owner" && !req.user.isPrimary) return jsonError(res, 403, "Only the Primary Super Owner can create another Super Owner.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError(res, 400, "Enter a valid email address.");
    if (await one("SELECT id FROM owner_accounts WHERE email=$1", [email])) return jsonError(res, 409, "An owner/staff account with that email already exists.");
    const hash = await bcrypt.hash(password, 12);
    const result = await one("INSERT INTO owner_accounts (full_name, email, password_hash, role, status, is_primary) VALUES ($1,$2,$3,$4,'active',false) RETURNING id", [fullName, email, hash, role]);
    await audit("owner", req.user.sub, "OWNER_ACCOUNT_CREATED", "owner", result.id, { role, email });
    res.status(201).json({ ok: true, id: result.id });
  } catch (error) { next(error); }
});

app.patch("/api/owner/accounts/:id/status", requireSuperOwner, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "");
    if (!Number.isInteger(id) || !["active", "inactive"].includes(status)) return jsonError(res, 400, "Invalid owner status.");
    const target = await one("SELECT id, is_primary, role, full_name FROM owner_accounts WHERE id=$1", [id]);
    if (!target || (target.is_primary && !req.user.isPrimary)) return jsonError(res, 404, "Owner account not found.");
    if (target.is_primary && status !== "active") return jsonError(res, 400, "The primary Super Owner cannot be deactivated.");
    if (id === Number(req.user.sub) && status !== "active") return jsonError(res, 400, "You cannot deactivate your own account.");
    if (target.role === "super_owner" && !req.user.isPrimary) return jsonError(res, 403, "Only the Primary Super Owner can manage Super Owner accounts.");
    await exec("UPDATE owner_accounts SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [status, id]);
    await audit("owner", req.user.sub, status === "active" ? "OWNER_ACCOUNT_ACTIVATED" : "OWNER_ACCOUNT_DEACTIVATED", "owner", id, { status });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.delete("/api/owner/accounts/:id", requireSuperOwner, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return jsonError(res, 400, "Invalid account.");
    if (id === Number(req.user.sub)) return jsonError(res, 400, "You cannot delete your own account.");

    const target = await one("SELECT id, full_name, role, is_primary FROM owner_accounts WHERE id=$1", [id]);
    if (!target || (target.is_primary && !req.user.isPrimary)) return jsonError(res, 404, "Owner account not found.");
    if (target.is_primary) return jsonError(res, 400, "The primary Super Owner cannot be deleted.");

    if (target.role === "super_owner") {
      if (!req.user.isPrimary) return jsonError(res, 403, "Only the Primary Super Owner can manage Super Owner accounts.");
      const count = await one("SELECT COUNT(*)::int AS count FROM owner_accounts WHERE role='super_owner' AND status='active'");
      if (Number(count?.count || 0) <= 1) return jsonError(res, 400, "At least one active Super Owner must remain.");
    }

    await withTransaction(async (client) => {
      await audit("owner", req.user.sub, "OWNER_ACCOUNT_DELETED", "owner", target.id, { role: target.role, fullName: target.full_name }, client);
      await exec("DELETE FROM owner_accounts WHERE id=$1", [target.id], client);
    });

    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/owner/members", requireOwner, async (_req, res, next) => {
  try {
    const rows = await many(`
      SELECT c.id, c.member_id, c.full_name, c.phone, c.email,
             m.id AS membership_id, p.duration, p.session_type, p.price,
             m.start_date, m.expiry_date, m.status,
             pay.id AS payment_id, pay.method, pay.reference, pay.status AS payment_status
      FROM customers c
      LEFT JOIN memberships m ON m.id = (SELECT id FROM memberships WHERE customer_id=c.id ORDER BY id DESC LIMIT 1)
      LEFT JOIN membership_plans p ON p.id=m.plan_id
      LEFT JOIN payments pay ON pay.id = (SELECT id FROM payments WHERE membership_id=m.id ORDER BY id DESC LIMIT 1)
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (error) { next(error); }
});


app.delete("/api/owner/members/:id", requireSuperOwner, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return jsonError(res, 400, "Invalid customer.");
    const customer = await one("SELECT id, member_id, full_name FROM customers WHERE id=$1", [id]);
    if (!customer) return jsonError(res, 404, "Customer not found.");

    await withTransaction(async (client) => {
      await audit("owner", req.user.sub, "CUSTOMER_DELETED", "customer", customer.id, { memberId: customer.member_id, fullName: customer.full_name }, client);
      await exec("DELETE FROM rules_acceptance WHERE customer_id=$1", [customer.id], client);
      await exec("DELETE FROM payments WHERE customer_id=$1", [customer.id], client);
      await exec("DELETE FROM memberships WHERE customer_id=$1", [customer.id], client);
      await exec("DELETE FROM customers WHERE id=$1", [customer.id], client);
    });

    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post("/api/owner/memberships/:membershipId/payment", requireSuperOwner, async (req, res, next) => {
  try {
    const membership = await one(`
      SELECT m.id, m.customer_id, m.status, p.price
      FROM memberships m
      JOIN membership_plans p ON p.id=m.plan_id
      WHERE m.id=$1
    `, [req.params.membershipId]);

    if (!membership) return jsonError(res, 404, "Membership not found.");
    if (membership.status !== "pending_payment") {
      return jsonError(res, 400, "This membership is not awaiting payment.");
    }

    const existingPayment = await one(
      "SELECT id FROM payments WHERE membership_id=$1 ORDER BY id DESC LIMIT 1",
      [membership.id]
    );
    if (existingPayment) {
      return jsonError(res, 409, "A payment already exists for this membership.");
    }

    const method = String(req.body?.method || "").trim();
    const reference = String(req.body?.reference || "").trim() || null;
    const allowedMethods = new Set(["Airtel Money", "TNM Mpamba", "National Bank", "Cash"]);
    if (!allowedMethods.has(method)) {
      return jsonError(res, 400, "A valid payment method is required.");
    }

    const amount = Number(membership.price);
    if (!Number.isFinite(amount) || amount < 0) {
      return jsonError(res, 400, "Invalid membership plan price.");
    }

    let payment;
    await withTransaction(async (client) => {
      payment = await one(`
        INSERT INTO payments
          (customer_id, membership_id, amount, method, reference, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id
      `, [membership.customer_id, membership.id, amount, method, reference], client);

      await audit("owner", req.user.sub, "PAYMENT_ADDED", "payment", payment.id, {
        membershipId: membership.id, amount, method, reference
      }, client);
    });

    res.status(201).json({
      ok: true,
      paymentId: payment.id,
      membershipId: membership.id,
      status: "pending"
    });
  } catch (error) { next(error); }
});

app.post("/api/owner/payments/:paymentId/verify", requireSuperOwner, async (req, res, next) => {
  try {
    const paymentId = Number(req.params.paymentId);
    if (!Number.isInteger(paymentId)) return jsonError(res, 400, "Invalid payment.");
    await withTransaction(async (client) => {
      const payment = await one("SELECT id, membership_id, status FROM payments WHERE id=$1 FOR UPDATE", [paymentId], client);
      if (!payment) throw Object.assign(new Error("Payment not found."), { statusCode: 404 });
      if (payment.status !== "pending") throw Object.assign(new Error("Only pending payments can be verified."), { statusCode: 400 });
      const membership = await one("SELECT id, status FROM memberships WHERE id=$1 FOR UPDATE", [payment.membership_id], client);
      if (!membership) throw Object.assign(new Error("Membership not found."), { statusCode: 404 });
      if (membership.status !== "pending_payment") throw Object.assign(new Error("This membership is no longer awaiting payment."), { statusCode: 400 });
      await exec("UPDATE payments SET status='verified', verified_at=CURRENT_TIMESTAMP WHERE id=$1", [payment.id], client);
      await exec("UPDATE memberships SET status='active', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [payment.membership_id], client);
      await audit("owner", req.user.sub, "PAYMENT_VERIFIED", "payment", payment.id, { membershipId: payment.membership_id }, client);
    });
    res.json({ ok: true });
  } catch (error) {
    if (error?.statusCode) return jsonError(res, error.statusCode, error.message);
    next(error);
  }
});

app.post("/api/owner/memberships/:membershipId/renew", requireSuperOwner, async (req, res, next) => {
  try {
    const membership = await one("SELECT m.*, p.duration, p.price FROM memberships m JOIN membership_plans p ON p.id=m.plan_id WHERE m.id=$1", [req.params.membershipId]);
    if (!membership) return jsonError(res, 404, "Membership not found.");
    const startDate = new Date().toISOString().slice(0, 10);
    const expiry = expiryDate(startDate, membership.duration);
    const method = String(req.body?.method || "").trim();
    const reference = String(req.body?.reference || "").trim() || null;
    const allowedMethods = new Set(["Airtel Money","TNM Mpamba","National Bank","Cash"]);
    if (!allowedMethods.has(method)) {
      return jsonError(res, 400, "A valid payment method is required.");
    }
    const amount = Number(membership.price);
    if (!Number.isFinite(amount) || amount < 0) {
      return jsonError(res, 400, "Invalid membership plan price.");
    }
    let created;
    let payment;
    await withTransaction(async (client) => {
      created = await one(
        "INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status) VALUES ($1,$2,$3,$4,'pending_payment') RETURNING id",
        [membership.customer_id, membership.plan_id, startDate, expiry],
        client
      );
      payment = await one(
        "INSERT INTO payments (customer_id, membership_id, amount, method, reference, status) VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id",
        [membership.customer_id, created.id, amount, method, reference],
        client
      );
      await audit("owner", req.user.sub, "RENEWAL_CREATED", "membership", created.id, {
        startDate, expiry, paymentId: payment.id, amount, method, reference
      }, client);
    });
    res.status(201).json({
      membershipId: created.id,
      paymentId: payment.id,
      startDate,
      expiryDate: expiry,
      status: "pending_payment",
      paymentStatus: "pending"
    });
  } catch (error) { next(error); }
});

// Serve the same app from Render when deployed as a single-origin service.
// This lets the frontend and API share one site, so authentication cookies can
// use normal same-site protections instead of relying on cross-site cookies.
app.use(express.static(__dirname, {
  index: "index.html",
  dotfiles: "deny",
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));
app.use((err, _req, res, _next) => {
  console.error(err);
  return jsonError(res, 500, "Unexpected server error.");
});

async function start() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is required for the PostgreSQL backend.");
    process.exit(1);
  }
  await initializeDatabase();
  app.listen(PORT, () => console.log(`VMC Xtreme platform running at http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error("Failed to start VMC Xtreme:", error);
  process.exit(1);
});
