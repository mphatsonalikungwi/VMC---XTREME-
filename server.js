require("dotenv").config();

const path = require("path");
const fs = require("fs");
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
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET") {
  console.warn("WARNING: Set a strong JWT_SECRET before production.");
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
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  await exec(schema);
  await exec(seed);

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

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "https://mphatsonalikungwi.github.io",
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/auth", authLimiter);

function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

async function memberId(client = pool) {
  const row = await one("SELECT member_id FROM customers ORDER BY id DESC LIMIT 1", [], client);
  const next = row ? Number(String(row.member_id).replace("VMC-", "")) + 1 : 1;
  return `VMC-${String(next).padStart(6, "0")}`;
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
  requireAuth(req, res, () => {
    if (req.user.role !== "owner") return jsonError(res, 403, "Owner access required.");
    next();
  });
}

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

app.post("/api/auth/register", async (req, res, next) => {
  try {
    return jsonError(res, 503, "Customer registration is coming soon. Please contact VMC directly.");

    if (process.env.PUBLIC_REGISTRATION_ENABLED !== "true") {
      return jsonError(res, 503, "Customer Registration Coming Soon.");
    }
    const { fullName, dob, gender, phone, email, emergencyContact,
      duration, sessionType, paymentMethod, paymentReference,
      password, rulesAccepted, rulesVersion } = req.body;

    if (!fullName || !dob || !gender || !phone || !email || !emergencyContact ||
        !duration || !sessionType || !paymentMethod || !password || !rulesAccepted) {
      return jsonError(res, 400, "All required registration fields must be completed.");
    }
    if (password.length < 8) return jsonError(res, 400, "Password must be at least 8 characters.");
    if (!["day","week","month"].includes(duration)) return jsonError(res, 400, "Invalid membership duration.");
    if (!["single","double"].includes(sessionType)) return jsonError(res, 400, "Invalid session type.");
    if (!["Airtel Money","TNM Mpamba","National Bank","Cash"].includes(paymentMethod)) {
      return jsonError(res, 400, "Invalid payment method.");
    }

    const cleanEmail = String(email).trim().toLowerCase();
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
      `, [id, fullName.trim(), dob, gender, phone.trim(), cleanEmail, emergencyContact.trim(), passwordHash], client);
      const membership = await one(`
        INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status)
        VALUES ($1, $2, $3, $4, 'pending_payment')
        RETURNING id
      `, [customer.id, plan.id, startDate, expiry], client);
      await exec(`
        INSERT INTO payments
          (customer_id, membership_id, amount, method, reference, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
      `, [customer.id, membership.id, plan.price, paymentMethod, paymentReference || null], client);
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

app.post("/api/auth/login", async (req, res, next) => {
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

app.post("/api/auth/owner-login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return jsonError(res, 400, "Email and password are required.");
    const owner = await one(`SELECT id, full_name, email, password_hash, role, status FROM owner_accounts WHERE email=$1`, [email]);
    if (!owner || owner.status !== "active" || !(await bcrypt.compare(password, owner.password_hash))) return jsonError(res, 401, "Invalid owner credentials.");
    const token = signToken({ sub: owner.id, role: "owner", ownerRole: owner.role });
    res.cookie("vmc_session", token, authCookieOptions());
    await audit("owner", owner.id, "OWNER_LOGIN", "owner", owner.id, { role: owner.role });
    res.json({ role: "owner", ownerRole: owner.role, fullName: owner.full_name });
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
    const existing = await one("SELECT id FROM customers WHERE email=$1", [cleanEmail]);
    if (existing) return jsonError(res, 409, "A customer with this email already exists.");
    const expiry = expiryDate(start_date, duration);
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    const result = await withTransaction(async (client) => {
      const id = await memberId(client);
      const customer = await one(`INSERT INTO customers (member_id, full_name, dob, gender, phone, email, emergency_contact, password_hash, account_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING id, member_id`, [id, full_name.trim(), dob, gender, phone.trim(), cleanEmail, emergency_contact.trim(), placeholderPassword], client);
      const membership = await one(`INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status) VALUES ($1,$2,$3,$4,'active') RETURNING id`, [customer.id, plan.id, start_date, expiry], client);
      const payment = await one(`INSERT INTO payments (customer_id, membership_id, amount, method, reference, status, verified_at) VALUES ($1,$2,$3,$4,$5,'verified',CURRENT_TIMESTAMP) RETURNING id`, [customer.id, membership.id, Math.round(cleanAmount), method, reference ? String(reference).trim() : null], client);
      await audit("owner", null, "MANUAL_MEMBER_ADDED", "customer", customer.id, { membershipId: membership.id, paymentId: payment.id, method, amount: Math.round(cleanAmount) }, client);
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

app.get("/api/owner/accounts", requireSuperOwner, async (_req, res, next) => {
  try {
    res.json(await many("SELECT id, full_name, email, role, status, is_primary, created_at FROM owner_accounts ORDER BY is_primary DESC, id ASC"));
  } catch (error) { next(error); }
});

app.post("/api/owner/accounts", requireSuperOwner, async (req, res, next) => {
  try {
    const fullName = String(req.body.full_name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "manager");
    if (!fullName || !email || password.length < 8) return jsonError(res, 400, "Name, email and a password of at least 8 characters are required.");
    if (!["manager", "staff"].includes(role)) return jsonError(res, 400, "New accounts can only be Manager or Staff.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError(res, 400, "Enter a valid email address.");
    if (await one("SELECT id FROM owner_accounts WHERE email=$1", [email])) return jsonError(res, 409, "An owner/staff account with that email already exists.");
    const hash = await bcrypt.hash(password, 12);
    const result = await one("INSERT INTO owner_accounts (full_name, email, password_hash, role, status) VALUES ($1,$2,$3,$4,'active') RETURNING id", [fullName, email, hash, role]);
    await audit("owner", req.user.sub, "OWNER_ACCOUNT_CREATED", "owner", result.id, { role, email });
    res.status(201).json({ ok: true, id: result.id });
  } catch (error) { next(error); }
});

app.patch("/api/owner/accounts/:id/status", requireSuperOwner, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "");
    if (!Number.isInteger(id) || !["active", "inactive"].includes(status)) return jsonError(res, 400, "Invalid owner status.");
    const target = await one("SELECT id, is_primary, full_name FROM owner_accounts WHERE id=$1", [id]);
    if (!target) return jsonError(res, 404, "Owner account not found.");
    if (target.is_primary && status !== "active") return jsonError(res, 400, "The primary Super Owner cannot be deactivated.");
    if (id === Number(req.user.sub) && status !== "active") return jsonError(res, 400, "You cannot deactivate your own account.");
    await exec("UPDATE owner_accounts SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [status, id]);
    await audit("owner", req.user.sub, status === "active" ? "OWNER_ACCOUNT_ACTIVATED" : "OWNER_ACCOUNT_DEACTIVATED", "owner", id, { status });
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

app.post("/api/owner/payments/:paymentId/verify", requireOwner, async (req, res, next) => {
  try {
    const payment = await one("SELECT * FROM payments WHERE id=$1", [req.params.paymentId]);
    if (!payment) return jsonError(res, 404, "Payment not found.");
    await withTransaction(async (client) => {
      await exec("UPDATE payments SET status='verified', verified_at=CURRENT_TIMESTAMP WHERE id=$1", [payment.id], client);
      await exec("UPDATE memberships SET status='active', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [payment.membership_id], client);
      await audit("owner", null, "PAYMENT_VERIFIED", "payment", payment.id, { membershipId: payment.membership_id }, client);
    });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post("/api/owner/memberships/:membershipId/renew", requireOwner, async (req, res, next) => {
  try {
    const membership = await one("SELECT m.*, p.duration, p.price FROM memberships m JOIN membership_plans p ON p.id=m.plan_id WHERE m.id=$1", [req.params.membershipId]);
    if (!membership) return jsonError(res, 404, "Membership not found.");
    const startDate = new Date().toISOString().slice(0, 10);
    const expiry = expiryDate(startDate, membership.duration);
    await withTransaction(async (client) => {
      const created = await one("INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status) VALUES ($1,$2,$3,$4,'pending_payment') RETURNING id", [membership.customer_id, membership.plan_id, startDate, expiry], client);
      await audit("owner", null, "RENEWAL_CREATED", "membership", created.id, { startDate, expiry }, client);
    });
    res.status(201).json({ startDate, expiryDate: expiry, status: "pending_payment" });
  } catch (error) { next(error); }
});

app.use(express.static(path.join(__dirname, "public")));
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
