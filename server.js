
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
  const { email, password } = req.body;
  if (!process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD) {
    return jsonError(res, 503, "Owner credentials are not configured.");
  }
  if (email !== process.env.OWNER_EMAIL || password !== process.env.OWNER_PASSWORD) {
    return jsonError(res, 401, "Invalid owner credentials.");
  }
  const token = signToken({ sub: "owner", role: "owner" });
  res.cookie("vmc_session", token, authCookieOptions());
  res.json({ role: "owner" });
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
