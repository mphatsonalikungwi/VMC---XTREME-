
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
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET") {
  console.warn("WARNING: Set a strong JWT_SECRET before production.");
}

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "vmc.sqlite"));
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
db.exec(schema);
db.exec(seed);

// Bootstrap the primary owner from Render environment variables once.
// Additional owners are stored securely in the database.
if (process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD) {
  const existingPrimary = db.prepare("SELECT id FROM owner_accounts WHERE is_primary=1 LIMIT 1").get();
  if (!existingPrimary) {
    const hash = bcrypt.hashSync(process.env.OWNER_PASSWORD, 12);
    db.prepare(`
      INSERT INTO owner_accounts (full_name, email, password_hash, role, status, is_primary)
      VALUES (?, ?, ?, 'super_owner', 'active', 1)
    `).run("Primary Owner", process.env.OWNER_EMAIL.trim().toLowerCase(), hash);
  }
}

app.use(cors({
  origin: "https://mphatsonalikungwi.github.io",
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false
}));
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

function memberId() {
  const row = db.prepare("SELECT member_id FROM customers ORDER BY id DESC LIMIT 1").get();
  const next = row ? Number(row.member_id.replace("VMC-", "")) + 1 : 1;
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
    secure: true,
    sameSite: "none",
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

function requireSuperOwner(req, res, next) {
  requireOwner(req, res, () => {
    const owner = db.prepare("SELECT id, role, status FROM owner_accounts WHERE id=?").get(req.user.sub);
    if (!owner || owner.status !== "active" || owner.role !== "super_owner") {
      return jsonError(res, 403, "Super Owner access required.");
    }
    next();
  });
}

function audit(actorType, actorId, action, entityType, entityId, metadata = {}) {
  db.prepare(`
    INSERT INTO audit_log
      (actor_type, actor_id, action, entity_type, entity_id, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(actorType, actorId || null, action, entityType, entityId || null, JSON.stringify(metadata));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "VMC Xtreme Membership Platform", version: "4.0.0" });
});

app.get("/api/plans", (_req, res) => {
  const plans = db.prepare("SELECT id, duration, session_type, price FROM membership_plans WHERE active=1 ORDER BY id").all();
  res.json(plans);
});

app.post("/api/auth/register", async (req, res) => {
  return jsonError(res, 503, "Customer registration is coming soon. Please contact VMC directly.");

  if (process.env.PUBLIC_REGISTRATION_ENABLED !== "true") {
    return jsonError(res, 503, "Customer Registration Coming Soon.");
  }
  const {
    fullName, dob, gender, phone, email, emergencyContact,
    duration, sessionType, paymentMethod, paymentReference,
    password, rulesAccepted, rulesVersion
  } = req.body;

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
  const existing = db.prepare("SELECT id FROM customers WHERE email=?").get(cleanEmail);
  if (existing) return jsonError(res, 409, "An account with that email already exists.");

  const plan = db.prepare(`
    SELECT * FROM membership_plans
    WHERE duration=? AND session_type=? AND active=1
  `).get(duration, sessionType);

  if (!plan) return jsonError(res, 400, "Selected membership plan is unavailable.");

  const startDate = new Date().toISOString().slice(0, 10);
  const expiry = expiryDate(startDate, duration);
  const passwordHash = await bcrypt.hash(password, 12);
  const id = memberId();

  const tx = db.transaction(() => {
    const customer = db.prepare(`
      INSERT INTO customers
        (member_id, full_name, dob, gender, phone, email, emergency_contact, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, fullName.trim(), dob, gender, phone.trim(), cleanEmail, emergencyContact.trim(), passwordHash);

    const membership = db.prepare(`
      INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status)
      VALUES (?, ?, ?, ?, 'pending_payment')
    `).run(customer.lastInsertRowid, plan.id, startDate, expiry);

    db.prepare(`
      INSERT INTO payments
        (customer_id, membership_id, amount, method, reference, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(customer.lastInsertRowid, membership.lastInsertRowid, plan.price, paymentMethod, paymentReference || null);

    db.prepare(`
      INSERT INTO rules_acceptance (customer_id, rules_version, accepted)
      VALUES (?, ?, 1)
    `).run(customer.lastInsertRowid, rulesVersion || "VMC Rules v1.0");

    audit("customer", customer.lastInsertRowid, "REGISTERED", "customer", customer.lastInsertRowid);
    return customer.lastInsertRowid;
  });

  return res.status(201).json({
    memberId: id,
    membership: {
      duration,
      sessionType,
      amount: plan.price,
      startDate,
      expiryDate: expiry,
      status: "pending_payment"
    }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return jsonError(res, 400, "Email and password are required.");

  const customer = db.prepare(`
    SELECT * FROM customers WHERE email=? AND account_status='active'
  `).get(String(email).trim().toLowerCase());

  if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
    return jsonError(res, 401, "Invalid email or password.");
  }

  const token = signToken({ sub: customer.id, role: "customer" });
  res.cookie("vmc_session", token, authCookieOptions());
  res.json({ memberId: customer.member_id, role: "customer" });
});

app.post("/api/auth/owner-login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return jsonError(res, 400, "Email and password are required.");

  const owner = db.prepare(`
    SELECT id, full_name, email, password_hash, role, status
    FROM owner_accounts WHERE email=?
  `).get(email);

  if (!owner || owner.status !== "active" || !(await bcrypt.compare(password, owner.password_hash))) {
    return jsonError(res, 401, "Invalid owner credentials.");
  }

  const token = signToken({ sub: owner.id, role: "owner", ownerRole: owner.role });
  res.cookie("vmc_session", token, authCookieOptions());
  audit("owner", owner.id, "OWNER_LOGIN", "owner", owner.id, { role: owner.role });
  res.json({ role: "owner", ownerRole: owner.role, fullName: owner.full_name });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("vmc_session", { httpOnly: true, secure: true, sameSite: "none", path: "/" });
  res.status(204).end();
});

app.get("/api/me", requireAuth, (req, res) => {
  if (req.user.role === "owner") return res.json({ role: "owner" });

  const customer = db.prepare(`
    SELECT id, member_id, full_name, dob, gender, phone, email, emergency_contact, created_at
    FROM customers WHERE id=?
  `).get(req.user.sub);

  if (!customer) return jsonError(res, 404, "Customer not found.");

  const membership = db.prepare(`
    SELECT m.id, p.duration, p.session_type, p.price, m.start_date, m.expiry_date, m.status,
           pay.id AS payment_id, pay.method, pay.reference, pay.status AS payment_status
    FROM memberships m
    JOIN membership_plans p ON p.id=m.plan_id
    LEFT JOIN payments pay ON pay.membership_id=m.id
    WHERE m.customer_id=?
    ORDER BY m.id DESC LIMIT 1
  `).get(req.user.sub);

  res.json({ role: "customer", customer, membership: membership || null });
});


app.get("/api/owner/migration/export", requireSuperOwner, (req, res) => {
  // Read-only, owner-authenticated export of the live SQLite data.
  // This endpoint never modifies the database. It exists only for the controlled
  // SQLite -> PostgreSQL migration and should be removed after migration.
  const tables = [
    "customers",
    "membership_plans",
    "memberships",
    "payments",
    "rules_acceptance",
    "notification_log",
    "audit_log",
    "owner_accounts"
  ];

  const data = {};
  const counts = {};
  for (const table of tables) {
    data[table] = db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
    counts[table] = data[table].length;
  }

  audit("owner", req.user.sub, "MIGRATION_EXPORT", "database", null, { counts });

  const payload = {
    format: "vmc-xtreme-sqlite-export",
    version: 1,
    exported_at: new Date().toISOString(),
    counts,
    data
  };

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="vmc-sqlite-export.json"');
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.status(200).send(JSON.stringify(payload));
});

app.get("/api/owner/dashboard/stats", requireOwner, (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS count FROM customers").get().count;
  const active = db.prepare("SELECT COUNT(*) AS count FROM memberships WHERE LOWER(status)='active' AND (expiry_date IS NULL OR date(expiry_date) >= date('now'))").get().count;
  const expired = db.prepare("SELECT COUNT(*) AS count FROM memberships WHERE LOWER(status)='expired' OR (expiry_date IS NOT NULL AND date(expiry_date) < date('now'))").get().count;
  const expiringSoon = db.prepare("SELECT COUNT(*) AS count FROM memberships WHERE expiry_date IS NOT NULL AND date(expiry_date) >= date('now') AND date(expiry_date) <= date('now','+30 day') AND LOWER(status)='active'").get().count;
  const paymentsToday = db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE date(created_at)=date('now') AND LOWER(COALESCE(status,''))='verified'").get().total;
  const paymentsMonth = db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE strftime('%Y-%m',created_at)=strftime('%Y-%m','now') AND LOWER(COALESCE(status,''))='verified'").get().total;
  const paymentMethods = db.prepare("SELECT COALESCE(method,'Other') AS method, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count FROM payments WHERE LOWER(COALESCE(status,''))='verified' GROUP BY method ORDER BY total DESC").all();
  const recentMembers = db.prepare(`
    SELECT c.id, c.full_name, c.phone, c.member_id AS membership_id,
           COALESCE(m.status,'No membership') AS status,
           m.start_date, m.expiry_date
    FROM customers c
    LEFT JOIN memberships m ON m.id = (
      SELECT m2.id FROM memberships m2
      WHERE m2.customer_id=c.id
      ORDER BY m2.id DESC LIMIT 1
    )
    ORDER BY c.id DESC
    LIMIT 8
  `).all();
  res.json({ok:true,stats:{total,active,expired,expiringSoon,paymentsToday,paymentsMonth},paymentMethods,recentMembers});
});

app.post("/api/owner/members", requireOwner, (req, res) => {
  const {
    full_name, dob, gender, phone, email, emergency_contact,
    duration, session_type, start_date, amount, method, reference
  } = req.body;

  const allowedMethods = ["Airtel Money", "TNM Mpamba", "National Bank", "Cash"];
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanAmount = Number(amount);

  if (!full_name || !dob || !gender || !phone || !cleanEmail || !emergency_contact ||
      !duration || !session_type || !start_date || !method || !Number.isFinite(cleanAmount) ||
      cleanAmount < 0) {
    return jsonError(res, 400, "Please complete all required customer, membership and payment fields.");
  }

  if (!["day", "week", "month"].includes(duration) ||
      !["single", "double"].includes(session_type) ||
      !allowedMethods.includes(method)) {
    return jsonError(res, 400, "Invalid membership or payment option.");
  }

  const plan = db.prepare(`
    SELECT id, price FROM membership_plans
    WHERE duration=? AND session_type=? AND active=1
  `).get(duration, session_type);

  if (!plan) return jsonError(res, 400, "Selected membership plan is unavailable.");

  const existing = db.prepare("SELECT id FROM customers WHERE email=?").get(cleanEmail);
  if (existing) return jsonError(res, 409, "A customer with this email already exists.");

  const expiry = expiryDate(start_date, duration);
  const placeholderPassword = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);

  const tx = db.transaction(() => {
    const customer = db.prepare(`
      INSERT INTO customers
        (member_id, full_name, dob, gender, phone, email, emergency_contact, password_hash, account_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      memberId(), full_name.trim(), dob, gender, phone.trim(),
      cleanEmail, emergency_contact.trim(), placeholderPassword
    );

    const membership = db.prepare(`
      INSERT INTO memberships
        (customer_id, plan_id, start_date, expiry_date, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(customer.lastInsertRowid, plan.id, start_date, expiry);

    const payment = db.prepare(`
      INSERT INTO payments
        (customer_id, membership_id, amount, method, reference, status, verified_at)
      VALUES (?, ?, ?, ?, ?, 'verified', CURRENT_TIMESTAMP)
    `).run(
      customer.lastInsertRowid, membership.lastInsertRowid,
      Math.round(cleanAmount), method, reference ? String(reference).trim() : null
    );

    audit("owner", null, "MANUAL_MEMBER_ADDED", "customer", customer.lastInsertRowid, {
      membershipId: membership.lastInsertRowid,
      paymentId: payment.lastInsertRowid,
      method,
      amount: Math.round(cleanAmount)
    });

    return {
      memberId: db.prepare("SELECT member_id FROM customers WHERE id=?")
        .get(customer.lastInsertRowid).member_id,
      expiryDate: expiry
    };
  });

  const result = tx();
  res.status(201).json({ ok: true, ...result });
});


app.get("/api/owner/profile", requireOwner, (req, res) => {
  const owner = db.prepare(`
    SELECT id, full_name, email, role, status, is_primary, created_at
    FROM owner_accounts WHERE id=?
  `).get(req.user.sub);
  if (!owner) return jsonError(res, 404, "Owner account not found.");
  res.json(owner);
});

app.get("/api/owner/accounts", requireSuperOwner, (_req, res) => {
  const rows = db.prepare(`
    SELECT id, full_name, email, role, status, is_primary, created_at
    FROM owner_accounts ORDER BY is_primary DESC, id ASC
  `).all();
  res.json(rows);
});

app.post("/api/owner/accounts", requireSuperOwner, async (req, res) => {
  const fullName = String(req.body.full_name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "manager");

  if (!fullName || !email || password.length < 8) {
    return jsonError(res, 400, "Name, email and a password of at least 8 characters are required.");
  }
  if (!["manager", "staff"].includes(role)) {
    return jsonError(res, 400, "New accounts can only be Manager or Staff.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError(res, 400, "Enter a valid email address.");
  }
  if (db.prepare("SELECT id FROM owner_accounts WHERE email=?").get(email)) {
    return jsonError(res, 409, "An owner/staff account with that email already exists.");
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare(`
    INSERT INTO owner_accounts (full_name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(fullName, email, hash, role);

  audit("owner", req.user.sub, "OWNER_ACCOUNT_CREATED", "owner", result.lastInsertRowid, { role, email });
  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

app.patch("/api/owner/accounts/:id/status", requireSuperOwner, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || "");
  if (!Number.isInteger(id) || !["active", "inactive"].includes(status)) {
    return jsonError(res, 400, "Invalid owner status.");
  }
  const target = db.prepare("SELECT id, is_primary, full_name FROM owner_accounts WHERE id=?").get(id);
  if (!target) return jsonError(res, 404, "Owner account not found.");
  if (target.is_primary && status !== "active") {
    return jsonError(res, 400, "The primary Super Owner cannot be deactivated.");
  }
  if (id === Number(req.user.sub) && status !== "active") {
    return jsonError(res, 400, "You cannot deactivate your own account.");
  }

  db.prepare("UPDATE owner_accounts SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, id);
  audit("owner", req.user.sub, status === "active" ? "OWNER_ACCOUNT_ACTIVATED" : "OWNER_ACCOUNT_DEACTIVATED", "owner", id, { status });
  res.json({ ok: true });
});

app.get("/api/owner/members", requireOwner, (_req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.member_id, c.full_name, c.phone, c.email,
           m.id AS membership_id, p.duration, p.session_type, p.price,
           m.start_date, m.expiry_date, m.status,
           pay.id AS payment_id, pay.method, pay.reference, pay.status AS payment_status
    FROM customers c
    LEFT JOIN memberships m ON m.id = (
      SELECT id FROM memberships WHERE customer_id=c.id ORDER BY id DESC LIMIT 1
    )
    LEFT JOIN membership_plans p ON p.id=m.plan_id
    LEFT JOIN payments pay ON pay.id = (
      SELECT id FROM payments WHERE membership_id=m.id ORDER BY id DESC LIMIT 1
    )
    ORDER BY c.id DESC
  `).all();
  res.json(rows);
});

app.post("/api/owner/payments/:paymentId/verify", requireOwner, (req, res) => {
  const payment = db.prepare(`
    SELECT * FROM payments WHERE id=?
  `).get(req.params.paymentId);
  if (!payment) return jsonError(res, 404, "Payment not found.");

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE payments SET status='verified', verified_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(payment.id);
    db.prepare(`
      UPDATE memberships SET status='active', updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(payment.membership_id);
    audit("owner", null, "PAYMENT_VERIFIED", "payment", payment.id, { membershipId: payment.membership_id });
  });
  tx();

  res.json({ ok: true });
});

app.post("/api/owner/memberships/:membershipId/renew", requireOwner, (req, res) => {
  const membership = db.prepare(`
    SELECT m.*, p.duration, p.price
    FROM memberships m JOIN membership_plans p ON p.id=m.plan_id
    WHERE m.id=?
  `).get(req.params.membershipId);
  if (!membership) return jsonError(res, 404, "Membership not found.");

  const startDate = new Date().toISOString().slice(0, 10);
  const expiry = expiryDate(startDate, membership.duration);

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO memberships (customer_id, plan_id, start_date, expiry_date, status)
      VALUES (?, ?, ?, ?, 'pending_payment')
    `).run(membership.customer_id, membership.plan_id, startDate, expiry);
    audit("owner", null, "RENEWAL_CREATED", "membership", membership.id, { startDate, expiry });
  });
  tx();

  res.status(201).json({ startDate, expiryDate: expiry, status: "pending_payment" });
});

app.use(express.static(path.join(__dirname, "public")));

app.use((err, _req, res, _next) => {
  console.error(err);
  return jsonError(res, 500, "Unexpected server error.");
});

app.listen(PORT, () => {
  console.log(`VMC Xtreme platform running at http://localhost:${PORT}`);
});
