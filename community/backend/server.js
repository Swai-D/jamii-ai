// ═══════════════════════════════════════════════════════════════════
//  JamiiAI Backend — Node.js / Express / PostgreSQL
//  File: server.js
//  Run: node server.js  (or: npx nodemon server.js)
// ═══════════════════════════════════════════════════════════════════

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const jwt        = require("jsonwebtoken");
const bcrypt     = require("bcryptjs");
const { Pool }   = require("pg");
const { v4: uuid } = require("uuid");
const cloudinary   = require("cloudinary").v2;
const multer       = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const nodemailer   = require("nodemailer");
const cron         = require("node-cron");
const axios        = require("axios");
const path         = require("path");
const fs           = require("fs");
require("dotenv").config();

// ── APP SETUP ───────────────────────────────────────────────────────
const app  = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.CLIENT_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));
app.use(express.json());

// ── LOCAL UPLOADS (dev) ─────────────────────────────────────────────
// Kama Laravel's public/storage — picha zinawekwa /uploads, zinapatikana
// kwa URL: http://localhost:4000/uploads/filename.jpg
// Production: badilisha USE_LOCAL_STORAGE=false, tumia Cloudinary
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === "true" ||
  (!process.env.CLOUDINARY_CLOUD_NAME && process.env.NODE_ENV !== "production");

const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
["avatars", "posts", "logos"].forEach(sub => {
  const d = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(d)) fs.mkdirSync(d);
});

// Serve local uploads kama static files
app.use("/uploads", express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Cache-Control", "public, max-age=31536000");
  }
}));

// ── DATABASE ────────────────────────────────────────────────────────
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

db.connect()
  .then(async () => {
    console.log("✅ Database imeunganishwa");
    // Auto-migration: Hakikisha column na table zote zipo
    try {
      await db.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- Users table enhancements
        ALTER TABLE users ADD COLUMN IF NOT EXISTS handle VARCHAR(50) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS project_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- Hakikisha is_verified ni true kwa users waliokuwepo kabla ya feature hii
        UPDATE users SET is_verified = true WHERE is_verified IS NULL;

        -- Posts table enhancements
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'swali';
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

        -- Resources table enhancements
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved';
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'admin';
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS link TEXT;
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#F5A623';
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS github_data JSONB DEFAULT '{}';
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 0;
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
        ALTER TABLE resources ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

        -- Challenges table enhancements
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS source_url TEXT;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS external_id VARCHAR(200);
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS prize_usd INTEGER DEFAULT 0;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS prize_display VARCHAR(100);
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'Kati';
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'Global';
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS ai_summary TEXT;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raw_desc TEXT;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_hot BOOLEAN DEFAULT false;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS participants INTEGER DEFAULT 0;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP;
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
        ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_external
          ON challenges(source, external_id)
          WHERE external_id IS NOT NULL;

        -- Missing tables
        CREATE TABLE IF NOT EXISTS events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255),
          date TIMESTAMPTZ,
          type VARCHAR(50),
          location TEXT,
          is_online BOOLEAN DEFAULT false,
          description TEXT,
          color VARCHAR(20) DEFAULT '#F5A623',
          status VARCHAR(20) DEFAULT 'upcoming',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS challenges (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255),
          org VARCHAR(255) DEFAULT 'JamiiAI',
          prize_display VARCHAR(255),
          deadline TIMESTAMPTZ,
          description TEXT,
          difficulty VARCHAR(20) DEFAULT 'Kati',
          tags JSONB DEFAULT '[]',
          status VARCHAR(20) DEFAULT 'open',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS resources (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          title VARCHAR(255),
          type VARCHAR(50) DEFAULT 'Dataset',
          link TEXT,
          tags JSONB DEFAULT '[]',
          description TEXT,
          author_name VARCHAR(255),
          status VARCHAR(20) DEFAULT 'approved',
          source VARCHAR(20) DEFAULT 'admin',
          downloads INTEGER DEFAULT 0,
          stars INTEGER DEFAULT 0,
          color VARCHAR(20) DEFAULT '#F5A623',
          is_free BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS news (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255),
          summary TEXT,
          ai_summary TEXT,
          category VARCHAR(50) DEFAULT 'Tanzania',
          source VARCHAR(100) DEFAULT 'JamiiAI',
          source_url TEXT,
          is_hot BOOLEAN DEFAULT false,
          reads INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'published',
          published_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          posted_by UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255),
          type VARCHAR(50) DEFAULT 'full_time',
          company_name VARCHAR(100),
          company_logo TEXT,
          description TEXT,
          requirements TEXT,
          benefits TEXT,
          location VARCHAR(100),
          country VARCHAR(100) DEFAULT 'Tanzania',
          is_remote BOOLEAN DEFAULT false,
          salary_min INTEGER,
          salary_max INTEGER,
          salary_currency VARCHAR(10) DEFAULT 'TZS',
          salary_visible BOOLEAN DEFAULT true,
          apply_url TEXT,
          apply_email VARCHAR(255),
          apply_internal BOOLEAN DEFAULT false,
          tags JSONB DEFAULT '[]',
          deadline TIMESTAMPTZ,
          status VARCHAR(20) DEFAULT 'active',
          views INTEGER DEFAULT 0,
          poster_name VARCHAR(100),
          poster_email VARCHAR(255),
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          plan VARCHAR(50) DEFAULT 'free',
          status VARCHAR(20) DEFAULT 'active',
          amount INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS platform_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(50) UNIQUE,
          permissions JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_roles (
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, role_id)
        );

        INSERT INTO roles (name, permissions) VALUES ('super_admin', '["*"]') ON CONFLICT DO NOTHING;
        INSERT INTO roles (name, permissions) VALUES ('admin', '["manage_users", "manage_content"]') ON CONFLICT DO NOTHING;

        CREATE TABLE IF NOT EXISTS follows (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
          following_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(follower_id, following_id)
        );

        CREATE TABLE IF NOT EXISTS post_likes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(post_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(post_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          text TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS event_registrations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(event_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS challenge_registrations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          registered_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(challenge_id, user_id)
        );
      `);
      console.log("✅ Database migration imekamilika");
    } catch (err) {
      console.error("❌ Migration error:", err.message);
    }
  })
  .catch(err => console.error("❌ DB error:", err.message));

// ── STORAGE ENGINE (local dev ↔ cloudinary prod) ──────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// LOCAL storage (diskStorage) — like Laravel public/storage
function makeLocalStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, subfolder)),
    filename:    (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase() || ".jpg";
      const name = `${subfolder}_${req.user?.id || "anon"}_${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

// CLOUDINARY storage
const makeStorage = (folder, formats, transform) => new CloudinaryStorage({
  cloudinary,
  params: { folder:`jamii-ai/${folder}`, allowed_formats:formats, transformation:transform,
    public_id:(req) => `${folder}_${req.user?.id || "anon"}_${Date.now()}` }
});

// Helper: build public URL for local file
const localUrl = (subfolder, filename) =>
  `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/uploads/${subfolder}/${filename}`;

// Select storage based on env
const uploadAvatar = multer({
  storage: USE_LOCAL_STORAGE
    ? makeLocalStorage("avatars")
    : makeStorage("avatars",["jpg","jpeg","png","webp"],
        [{ width:400, height:400, crop:"fill", gravity:"face" },{ quality:"auto", fetch_format:"auto" }]),
  limits:{ fileSize: 2*1024*1024 },
  fileFilter: (req, file, cb) => cb(null, /image\/(jpeg|png|webp|gif)/.test(file.mimetype)),
}).single("avatar");

const uploadPostImage = multer({
  storage: USE_LOCAL_STORAGE
    ? makeLocalStorage("posts")
    : makeStorage("posts",["jpg","jpeg","png","webp","gif"],
        [{ width:1200, height:630, crop:"limit" },{ quality:"auto", fetch_format:"auto" }]),
  limits:{ fileSize: 5*1024*1024 },
  fileFilter: (req, file, cb) => cb(null, /image\//.test(file.mimetype)),
}).single("image");

const uploadCV = multer({
  storage: USE_LOCAL_STORAGE
    ? makeLocalStorage("cvs")
    : new CloudinaryStorage({ cloudinary, params:{ folder:"jamii-ai/cvs",
        allowed_formats:["pdf"], resource_type:"raw",
        public_id:(req) => `cv_${req.user?.id}_${Date.now()}` }}),
  limits:{ fileSize: 5*1024*1024 }
}).single("cv");

const uploadLogo = multer({
  storage: USE_LOCAL_STORAGE
    ? makeLocalStorage("logos")
    : makeStorage("logos",["jpg","jpeg","png","webp","svg"],
        [{ width:200, height:200, crop:"pad", background:"transparent" }]),
  limits:{ fileSize: 2*1024*1024 },
  fileFilter: (req, file, cb) => cb(null, /image\//.test(file.mimetype)),
}).single("logo");

function handleUpload(uploader, req, res) {
  return new Promise((resolve, reject) => uploader(req, res, e => e ? reject(e) : resolve()));
}

// Returns the public URL regardless of storage mode
function getUploadedUrl(req, subfolder) {
  if (USE_LOCAL_STORAGE) {
    return localUrl(subfolder, req.file.filename);
  }
  return req.file.path; // Cloudinary returns full URL in req.file.path
}

async function deleteCloudinaryImage(url) {
  if (!url || !url.includes("cloudinary")) return;
  try {
    const parts    = url.split("/");
    const filename = parts[parts.length-1].split(".")[0];
    const folder   = parts[parts.length-2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`);
  } catch (e) { console.warn("Cloudinary delete:", e.message); }
}

// ── SETTINGS ─────────────────────────────────────────────────────
async function getSetting(key, fallback = null) {
  try {
    const { rows } = await db.query(
      "SELECT value FROM platform_settings WHERE key = $1", [key]
    );
    return rows[0]?.value ?? fallback;
  } catch { return fallback; }
}

async function setSetting(key, value, adminId) {
  await db.query(
    `INSERT INTO platform_settings (key, value, updated_by, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT (key) DO UPDATE SET value=$2, updated_by=$3, updated_at=NOW()`,
    [key, value, adminId]
  );
}

// ── ANTHROPIC / CLAUDE ────────────────────────────────────────────
async function generateSwahiliSummary(title, rawContent) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 250,
        messages: [{
          role: "user",
          content: `Fupisha habari hii kwa Kiswahili rahisi, mistari 2-3 tu.
Usiandike utangulizi kama "Habari hii inaeleza..." — anza moja kwa moja.

Kichwa: ${title}
Habari: ${(rawContent || "").slice(0, 1200)}

Jibu kwa Kiswahili tu.`
        }]
      },
      { headers:{
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
      }}
    );
    return response.data.content[0]?.text || null;
  } catch (err) {
    console.error("❌ Claude error:", err.message);
    return null;
  }
}

// ── EMAIL (BREVO / NODEMAILER) ────────────────────────────────────
const SibApiV3Sdk = require('sib-api-v3-sdk');

async function sendEmail({ to, subject, html, text }) {
  const brevoKey = process.env.BREVO_API_KEY;
  
  // Njia ya 1: BREVO API (Inapendekezwa)
  if (brevoKey && brevoKey.startsWith('xkeysib-')) {
    try {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = brevoKey;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.sender = { 
        name: "JamiiAI", 
        email: process.env.SENDER_EMAIL || "davyswai53@gmail.com" 
      };
      sendSmtpEmail.to = [{ email: to }];
      if (text) sendSmtpEmail.textContent = text;

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log("📧 Brevo Email imetumwa kikamilifu:", data.messageId);
      return true;
    } catch (err) {
      // Kama ni kosa la API Key, itatuambia hapa
      const errorMsg = err.response?.body?.message || err.message || "Unknown Brevo Error";
      console.error("❌ Brevo API Error:", errorMsg);
      // Ikishindikana Brevo, jaribu kuendelea na SMTP hapa chini
    }
  }

  // Njia ya 2: SMTP FALLBACK (Nodemailer)
  console.log("🔄 Inajaribu kutuma kupitia SMTP Fallback...");
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const fromEmail = process.env.SENDER_EMAIL || "davyswai53@gmail.com";
    await transporter.sendMail({
      from: `"JamiiAI" <${fromEmail}>`,
      to,
      subject,
      html,
      text
    });
    console.log("✅ Email imetumwa kupitia SMTP Fallback");
    return true;
  } catch (err) {
    console.error("❌ SMTP Fallback Error:", err.message);
    return false;
  }
}

// ── MIDDLEWARE ──────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inahitajika" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token si sahihi au imekwisha" });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
};

// ── ADMIN AUTH MIDDLEWARE ─────────────────────────────────────────
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      `SELECT u.*, r.name as role_name, r.permissions
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`, [decoded.id]
    );
    if (!rows[0]) return res.status(401).json({ error: "User not found" });
    const adminRoles = ["super_admin","admin","moderator","editor","analyst"];
    if (!adminRoles.includes(rows[0].role_name)) {
      return res.status(403).json({ error: "Admin access inahitajika" });
    }
    req.user = rows[0];
    next();
  } catch { res.status(401).json({ error: "Token batili" }); }
};

// ── ADMIN: EMAIL TEST ROUTE ────────────────────────────────────────
app.post("/api/admin/test-email", adminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Toa email ya kupokea jaribio" });
    
    const success = await sendEmail({
      to: email,
      subject: "JamiiAI — Email Test 🚀",
      html: `
        <div style="font-family:sans-serif; max-width:600px; padding:20px; border:1px solid #eee; border-radius:10px;">
          <h2 style="color:#F5A623;">JamiiAI Connected!</h2>
          <p>Hongera! Mfumo wako wa email kupitia <b>Brevo</b> umefanikiwa kuunganishwa.</p>
          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
          <p style="font-size:12px; color:#999;">Ujumbe huu umetolewa na JamiiAI Admin Test Tool.</p>
        </div>
      `
    });
    
    if (success) res.json({ success: true, message: "Email ya jaribio imetumwa!" });
    else res.status(500).json({ error: "Imeshindikana kutuma email. Angalia logs za server." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SOCKET.IO ─────────────────────────────────────────────────────
global.io = io;

io.on("connection", (socket) => {
  socket.on("join",       (userId)      => { socket.userId = userId; socket.join(`user:${userId}`); });
  socket.on("join:admin", ()            => socket.join("admin:room"));
  socket.on("join:dm",    (otherId)     => socket.join(`dm:${[socket.userId, otherId].sort().join("_")}`));
  socket.on("leave:dm",   (otherId)     => socket.leave(`dm:${[socket.userId, otherId].sort().join("_")}`));
  socket.on("typing:start", ({toUserId})=> io.to(`user:${toUserId}`).emit("typing:start",{ fromUserId:socket.userId }));
  socket.on("typing:stop",  ({toUserId})=> io.to(`user:${toUserId}`).emit("typing:stop", { fromUserId:socket.userId }));
});

function notifyUser(userId, data) { io.to(`user:${userId}`).emit("notification", data); }
function notifyAdmin(data)        { io.to("admin:room").emit("admin:alert", data); }

// ── HELPERS ─────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, handle: user.handle }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════════════
const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Fields zote zinahitajika" });

    const exists = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: "Barua pepe tayari inatumika" });

    const hash = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Tengeneza handle ya mwanzo kutokana na jina
    const baseHandle = name.toLowerCase().replace(/\s+/g, '').substring(0, 15);
    const handle = `${baseHandle}${Math.floor(Math.random() * 1000)}`;

    const result = await db.query(
      `INSERT INTO users (id, name, email, handle, password_hash, verification_code, is_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) RETURNING id, name, email, handle`,
      [uuid(), name.trim(), email.toLowerCase(), handle, hash, verificationCode]
    );

    const user = result.rows[0];

    // Tuma Email ya Verification
    await sendEmail({
      to: email.toLowerCase(),
      subject: "JamiiAI — Karibu! Thibitisha Email Yako 📧",
      html: `
        <div style="font-family:sans-serif; max-width:600px; padding:20px; border:1px solid #eee; border-radius:12px;">
          <h2 style="color:#F5A623; margin-bottom:20px;">Karibu JamiiAI, ${name}!</h2>
          <p>Asante kwa kujiunga na JamiiAI. Ili kukamilisha usajili wako, tafadhali tumia code ifuatayo kuthibitisha email yako:</p>
          <div style="background:#f9f9f9; padding:20px; text-align:center; border-radius:10px; margin:25px 0; border:1px solid #eee;">
            <span style="font-size:32px; font-weight:800; letter-spacing:8px; color:#0C0C0E; font-family:monospace;">${verificationCode}</span>
          </div>
          <p style="color:#666; font-size:14px;">Ingiza code hii kwenye app ili uweze kuanza kutumia huduma zetu.</p>
          <hr style="border:0; border-top:1px solid #eee; margin:30px 0;">
          <p style="font-size:12px; color:#999; text-align:center;">JamiiAI Community — Tanzania's AI Hub 🇹🇿</p>
        </div>
      `
    });

    res.status(201).json({ 
      success: true, 
      message: "Usajili umefanikiwa! Tafadhali thibitisha email yako kwa kutumia code tuliyokutumia.",
      email: user.email 
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email na code vinahitajika" });

    const result = await db.query(
      "SELECT id, email, handle FROM users WHERE email = $1 AND verification_code = $2",
      [email.toLowerCase(), code]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "Code si sahihi au email haijapatikana." });
    }

    const user = result.rows[0];
    await db.query(
      "UPDATE users SET is_verified = true, verification_code = NULL WHERE id = $1",
      [user.id]
    );

    // Rudisha token na user object kamili (bila password)
    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, message: "Email imethibitishwa!", token, user: safeUser });
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await db.query("SELECT id, name, is_verified FROM users WHERE email = $1", [email.toLowerCase()]);
    
    if (!result.rows.length) return res.status(404).json({ error: "Email haikupatikana" });
    if (result.rows[0].is_verified) return res.status(400).json({ error: "Email tayari imethibitishwa" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query("UPDATE users SET verification_code = $1 WHERE email = $2", [verificationCode, email.toLowerCase()]);

    await sendEmail({
      to: email.toLowerCase(),
      subject: "JamiiAI — Code Mpya ya Verification 📧",
      html: `<p>Code yako mpya ni: <b>${verificationCode}</b></p>`
    });

    res.json({ success: true, message: "Code mpya imetumwa kwenye email yako." });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, login, identifier, password } = req.body;
    let rawIden = identifier || login || email;

    if (!rawIden || !password) {
      return res.status(400).json({ error: "Ingiza barua pepe/handle na nywila" });
    }

    let iden = String(rawIden).trim().toLowerCase();
    if (iden.startsWith("@")) iden = iden.substring(1);

    const result = await db.query(
      `SELECT u.*, r.name as role_name 
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE LOWER(TRIM(u.email)) = $1 OR LOWER(TRIM(u.handle)) = $1`, [iden]
    );
    
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Barua pepe/handle au nywila si sahihi" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Barua pepe/handle au nywila si sahihi" });

    if (user.status === "banned") {
      return res.status(403).json({ error: "Akaunti yako imezuiwa (banned)." });
    }

    // ZUIA LOGIN KAMA HAIJAVERIFIWA
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: "Tafadhali thibitisha email yako kwanza.", 
        requiresVerification: true,
        email: user.email 
      });
    }

    const { password_hash, ...safe } = user;
    res.json({ token: signToken(user), user: safe });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/forgot-password", async (req, res) => {
  console.log("POST /api/auth/forgot-password - Email:", req.body.email);
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Barua pepe inahitajika" });

    const result = await db.query("SELECT id, status FROM users WHERE email = $1", [email.toLowerCase()]);
    
    if (!result.rows.length) {
      console.log("User not found for email:", email);
      return res.status(400).json({ error: "Barua pepe haijapatikana kwenye mfumo wetu." });
    }

    const user = result.rows[0];

    // Zuia reset kama mtumiaji amebaniwa
    if (user.status === "banned") {
      console.log(`[AUTH] Password reset imekataliwa: Mtumiaji ${email} amebaniwa.`);
      return res.status(403).json({ 
        error: "Akaunti yako imezuiwa (banned). Huwezi kubadilisha nywila kwa sasa. Tafadhali wasiliana na usimamizi." 
      });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3600000);

    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expiry, email.toLowerCase()]
    );

    // Tuma Email
    await sendEmail({
      to: email.toLowerCase(),
      subject: "JamiiAI — Code ya Kubadili Nywila 🔐",
      html: `
        <div style="font-family:sans-serif; max-width:600px; padding:20px; border:1px solid #eee; border-radius:12px;">
          <h2 style="color:#F5A623; margin-bottom:20px;">Badili Nywila yako JamiiAI</h2>
          <p>Habari,</p>
          <p>Tumepokea ombi la kubadili nywila (password) ya akaunti yako. Tumia code ifuatayo kukamilisha mchakato huu:</p>
          <div style="background:#f9f9f9; padding:20px; text-align:center; border-radius:10px; margin:25px 0; border:1px solid #eee;">
            <span style="font-size:32px; font-weight:800; letter-spacing:8px; color:#0C0C0E; font-family:monospace;">${token}</span>
          </div>
          <p style="color:#666; font-size:14px;">Code hii itakwisha muda wake baada ya saa 1.</p>
          <p style="color:#666; font-size:14px;">Ikiwa hukuomba kubadili nywila, tafadhali puuza ujumbe huu.</p>
          <hr style="border:0; border-top:1px solid #eee; margin:30px 0;">
          <p style="font-size:12px; color:#999; text-align:center;">JamiiAI Community — Tanzania's AI Hub 🇹🇿</p>
        </div>
      `
    });

    res.json({ success: true, message: "Code imetumwa kwenye barua pepe yako." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  try {
    const { email, token, password } = req.body;
    const result = await db.query(
      "SELECT id FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()",
      [email.toLowerCase(), token]
    );

    if (!result.rows.length) return res.status(400).json({ error: "Code si sahihi au imekwisha muda wake." });

    const hash = await bcrypt.hash(password, 12);
    await db.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2",
      [hash, email.toLowerCase()]
    );

    res.json({ success: true, message: "Nywila imebadilishwa kikamilifu." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.get("/me", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.handle, u.email, u.avatar_url, u.cover_image,
              u.role, u.city, u.bio, u.skills, u.interests, u.hourly_rate,
              u.available, u.rating, u.project_count, u.github_url,
              u.linkedin_url, u.website_url, u.notification_prefs,
              u.is_verified, u.onboarded, u.plan, u.status, u.created_at,
              r.name as role_name,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_deleted=false) AS post_count,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "Mtumiaji hajapatikana" });
    
    const { password_hash, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    console.error("❌ Auth Me Error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.patch("/profile", auth, async (req, res) => {
  try {
    const { name, role, city, bio, skills, interests, hourly_rate, available, github, linkedin, website } = req.body;
    await db.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        city = COALESCE($3, city),
        bio  = COALESCE($4, bio),
        skills = COALESCE($5::jsonb, skills),
        interests = COALESCE($6::jsonb, interests),
        hourly_rate = COALESCE($7, hourly_rate),
        available = COALESCE($8, available),
        github_url = COALESCE($9, github_url),
        linkedin_url = COALESCE($10, linkedin_url),
        website_url = COALESCE($11, website_url),
        updated_at = NOW()
       WHERE id = $12`,
      [name, role, city, bio,
       skills ? JSON.stringify(skills) : null,
       interests ? JSON.stringify(interests) : null,
       hourly_rate, available, github, linkedin, website,
       req.user.id]
    );
    const result = await db.query(
      `SELECT u.*,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
       FROM users u WHERE u.id = $1`, [req.user.id]
    );
    const { password_hash, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.get("/projects", auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM user_projects WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch { res.json([]); }
});

authRouter.post("/projects", auth, async (req, res) => {
  try {
    const { title, desc, tech, status, link } = req.body;
    const result = await db.query(
      "INSERT INTO user_projects (user_id, title, description, tech_stack, status, link, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *",
      [req.user.id, title, desc, JSON.stringify(tech||[]), status||"active", link||""]
    );
    res.json(result.rows[0]);
  } catch { res.json({ id: Date.now(), title: req.body.title, desc: req.body.desc, tech: req.body.tech||[], status: req.body.status||"active", link: req.body.link||"" }); }
});

authRouter.patch("/projects/:id", auth, async (req, res) => {
  try {
    const { title, desc, tech, status, link } = req.body;
    await db.query(
      "UPDATE user_projects SET title=$1, description=$2, tech_stack=$3, status=$4, link=$5 WHERE id=$6 AND user_id=$7",
      [title, desc, JSON.stringify(tech||[]), status, link, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

authRouter.delete("/projects/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM user_projects WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

authRouter.patch("/onboard", auth, async (req, res) => {
  try {
    const { handle, role, city, bio, interests, notifications } = req.body;
    if (handle) {
      const taken = await db.query("SELECT id FROM users WHERE handle = $1 AND id != $2", [handle, req.user.id]);
      if (taken.rows.length) return res.status(409).json({ error: "Handle tayari inatumika" });
    }
    await db.query(
      `UPDATE users SET handle=$1, role=$2, city=$3, bio=$4, interests=$5,
       notification_prefs=$6, onboarded=true, updated_at=NOW() WHERE id=$7`,
       [handle, role, city, bio, JSON.stringify(interests), JSON.stringify(notifications), req.user.id]
       );

       // CHUKUA USER MPYA KWA UKAMILIFU (KAMA /ME)
       const fullUser = await db.query(
       `SELECT u.id, u.name, u.handle, u.email, u.avatar_url, u.cover_image,
              u.role, u.city, u.bio, u.skills, u.interests, u.hourly_rate,
              u.available, u.rating, u.project_count, u.github_url,
              u.linkedin_url, u.website_url, u.notification_prefs,
              u.is_verified, u.onboarded, u.plan, u.status, u.created_at,
              r.name as role_name,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_deleted=false) AS post_count,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`, [req.user.id]
       );

       const { password_hash, ...safeUser } = fullUser.rows[0];
       res.json({ success: true, user: safeUser });
       } catch (err) {
       console.error("❌ Onboard error:", err);
       res.status(500).json({ error: "Hitilafu ya server" });
       }
       });
// POST /api/auth/change-password
authRouter.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Nywila zote zinahitajika" });
    if (newPassword.length < 8) return res.status(400).json({ error: "Nywila mpya iwe na herufi 8+" });
    const { rows:[user] } = await db.query("SELECT password_hash FROM users WHERE id=$1", [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Nywila ya sasa si sahihi" });
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [newHash, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use("/api/auth", authRouter);

// ════════════════════════════════════════════════════════════════════
//  USER ROUTES
// ════════════════════════════════════════════════════════════════════

// GET /api/users — list (wataalamu)
app.get("/api/users", optionalAuth, async (req, res) => {
  try {
    const { role, city, available, q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ["u.onboarded = true"];
    const params = [];

    if (role)      { params.push(role);      conditions.push(`u.role = $${params.length}`); }
    if (city)      { params.push(city);      conditions.push(`u.city = $${params.length}`); }
    if (available) {                          conditions.push(`u.available = true`); }
    if (q)         { params.push(`%${q}%`);  conditions.push(`(u.name ILIKE $${params.length} OR u.handle ILIKE $${params.length} OR u.bio ILIKE $${params.length})`); }

    params.push(limit, offset);
    const sql = `
      SELECT u.id, u.name, u.handle, u.avatar_url, u.role, u.city, u.bio,
             u.skills, u.hourly_rate, u.available, u.rating, u.project_count, u.is_verified,
             (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers
      FROM users u
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.rating DESC NULLS LAST, u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(sql, params);
    res.json({ users: result.rows, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// GET /api/users/me — current logged-in user
app.get("/api/users/me", auth, async (req, res) => {
  try {
    const { rows:[user] } = await db.query(
      `SELECT u.id, u.name, u.handle, u.email, u.avatar_url, u.cover_image,
              u.role, u.city, u.bio, u.skills, u.interests, u.hourly_rate,
              u.available, u.rating, u.project_count, u.github_url,
              u.linkedin_url, u.website_url, u.notification_prefs,
              u.is_verified, u.onboarded, u.plan, u.status, u.created_at,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following,
              (SELECT COUNT(*) FROM posts   WHERE user_id = u.id AND is_deleted=false) AS post_count
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: "Mtumiaji hapatikani" });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:handle — accepts both handle (string) and UUID
app.get("/api/users/:handle", optionalAuth, async (req, res) => {
  try {
    const param = req.params.handle;
    // Detect if param looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const whereClause = isUUID ? "u.id = $1" : "u.handle = $1";

    const result = await db.query(
      `SELECT u.id, u.name, u.handle, u.avatar_url, u.cover_image, u.role, u.city, u.bio,
              u.skills, u.interests, u.hourly_rate, u.available, u.rating,
              u.project_count, u.github_url, u.linkedin_url, u.website_url,
              u.created_at, u.is_verified, u.plan, u.status,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following,
              (SELECT COUNT(*) FROM posts   WHERE user_id = u.id AND is_deleted=false) AS post_count
       FROM users u WHERE ${whereClause}`,
      [param]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Mtumiaji hapatikani" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// PUT /api/users/:id — update profile
app.put("/api/users/:id", auth, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) return res.status(403).json({ error: "Huna ruhusa" });
    const {
      name, handle, bio, role, city, hourly_rate, available,
      github_url, linkedin_url, website_url, skills, interests,
      cover_image, avatar_url,
    } = req.body;

    // Check handle uniqueness if changed
    if (handle && handle !== req.user.handle) {
      const { rows } = await db.query("SELECT id FROM users WHERE handle=$1 AND id!=$2", [handle, req.user.id]);
      if (rows.length) return res.status(409).json({ error: "Handle tayari inatumika" });
    }

    const { rows:[updated] } = await db.query(
      `UPDATE users SET
        name        = COALESCE($1, name),
        handle      = COALESCE($2, handle),
        bio         = COALESCE($3, bio),
        role        = COALESCE($4, role),
        city        = COALESCE($5, city),
        hourly_rate = COALESCE($6, hourly_rate),
        available   = COALESCE($7, available),
        github_url  = COALESCE($8, github_url),
        linkedin_url= COALESCE($9, linkedin_url),
        website_url = COALESCE($10, website_url),
        skills      = COALESCE($11::jsonb, skills),
        interests   = COALESCE($12::jsonb, interests),
        cover_image = COALESCE($13, cover_image),
        updated_at  = NOW()
       WHERE id = $14
       RETURNING id, name, handle, avatar_url, cover_image, role, city, bio,
                 skills, interests, hourly_rate, available, github_url,
                 linkedin_url, website_url, is_verified, plan`,
      [
        name || null,
        handle || null,
        bio !== undefined ? bio : null,
        role || null,
        city || null,
        hourly_rate || null,
        available !== undefined ? available : null,
        github_url !== undefined ? github_url : null,
        linkedin_url !== undefined ? linkedin_url : null,
        website_url !== undefined ? website_url : null,
        skills ? JSON.stringify(skills) : null,
        interests ? JSON.stringify(interests) : null,
        cover_image || null,
        req.user.id
      ]
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/users/me/settings — notification prefs, privacy, etc.
app.patch("/api/users/me/settings", auth, async (req, res) => {
  try {
    const { notifications, private: makePrivate } = req.body;
    if (notifications) {
      await db.query(
        "UPDATE users SET notification_prefs=$1, updated_at=NOW() WHERE id=$2",
        [JSON.stringify(notifications), req.user.id]
      );
    }
    if (makePrivate !== undefined) {
      // Store as part of notification_prefs or a dedicated field
      await db.query(
        "UPDATE users SET notification_prefs = notification_prefs || $1::jsonb, updated_at=NOW() WHERE id=$2",
        [JSON.stringify({ private: makePrivate }), req.user.id]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/me — delete own account
app.delete("/api/users/me", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=$1", [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PROJECTS ──────────────────────────────────────────────────────
// GET /api/projects/user/:userId
app.get("/api/projects/user/:userId", optionalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, description, tech_stack, status, link, stars, created_at
       FROM user_projects WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects
app.post("/api/projects", auth, async (req, res) => {
  try {
    const { title, description, tech_stack, status, link } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Jina la mradi linahitajika" });
    const { rows:[project] } = await db.query(
      `INSERT INTO user_projects (id, user_id, title, description, tech_stack, status, link, stars, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW()) RETURNING *`,
      [uuid(), req.user.id, title.trim(), description||"", tech_stack||"[]", status||"active", link||""]
    );
    await db.query("UPDATE users SET project_count=project_count+1 WHERE id=$1", [req.user.id]);
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/projects/:id
app.put("/api/projects/:id", auth, async (req, res) => {
  try {
    const { title, description, tech_stack, status, link } = req.body;
    const { rows:[project] } = await db.query(
      `UPDATE user_projects SET
        title       = COALESCE($1, title),
        description = COALESCE($2, description),
        tech_stack  = COALESCE($3::jsonb, tech_stack),
        status      = COALESCE($4, status),
        link        = COALESCE($5, link)
       WHERE id=$6 AND user_id=$7
       RETURNING *`,
      [title||null, description||null, tech_stack||null, status||null, link||null, req.params.id, req.user.id]
    );
    if (!project) return res.status(404).json({ error: "Mradi haupatikani" });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id
app.delete("/api/projects/:id", auth, async (req, res) => {
  try {
    const { rowCount } = await db.query(
      "DELETE FROM user_projects WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Mradi haupatikani" });
    await db.query("UPDATE users SET project_count=GREATEST(project_count-1,0) WHERE id=$1", [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// POST /api/users/:id/follow
app.post("/api/users/:id/follow", auth, async (req, res) => {
  try {
    const { id:targetId } = req.params;
    if (targetId === req.user.id) return res.status(400).json({ error:"Huwezi kujifuata mwenyewe" });
    const { rows:existing } = await db.query(
      "SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2",[req.user.id, targetId]
    );
    if (existing.length > 0) {
      await db.query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2",[req.user.id, targetId]);
    } else {
      await db.query("INSERT INTO follows (id,follower_id,following_id,created_at) VALUES ($1,$2,$3,NOW())",[uuid(), req.user.id, targetId]);
      // Notify mtumiaji aliyefuatwa
      await db.query(
        `INSERT INTO notifications (id,user_id,type,title,actor_id,actor_handle,is_read,created_at)
         VALUES($1,$2,'follow','Anakufuata',$3,$4,false,NOW())`,
        [uuid(), targetId, req.user.id, req.user.handle]
      );
      io.to(`user:${targetId}`).emit("notification",{
        type:"follow", title:`@${req.user.handle} anakufuata`,
        actorHandle:req.user.handle, actorAvatar:req.user.avatar_url
      });
    }
    const { rows:[counts] } = await db.query(
      `SELECT (SELECT COUNT(*) FROM follows WHERE following_id=$1) AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id=$1)  AS following`,
      [targetId]
    );
    res.json({ following: existing.length===0, ...counts });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  POST ROUTES (Feed)
// ════════════════════════════════════════════════════════════════════

// GET /api/posts
app.get("/api/posts", optionalAuth, async (req, res) => {
  try {
    const { feed="all", category, page=1, limit=20 } = req.query;
    const off = (page-1)*parseInt(limit);
    let whereClause = "WHERE p.is_deleted=false";

    if (feed==="following" && req.user) {
      whereClause += ` AND p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id='${req.user.id}'
      )`;
    }
    if (category && category !== "all") whereClause += ` AND p.category='${category}'`;

    const { rows } = await db.query(
      `SELECT p.*,
        u.name AS author_name, u.handle AS author_handle,
        u.avatar_url AS author_avatar, u.is_verified AS author_verified,
        (SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) AS like_count,
        (SELECT COUNT(*) FROM comments   WHERE post_id=p.id) AS comment_count
        ${req.user ? `,(SELECT COUNT(*)>0 FROM post_likes WHERE post_id=p.id AND user_id='${req.user.id}') AS user_liked` : ""}
       FROM posts p JOIN users u ON u.id=p.user_id
       ${whereClause}
       ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), off]
    );
    res.json({ posts:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// GET /api/posts/:id — single post (inatumiwa na bots na frontend)
app.get("/api/posts/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*,
        u.name AS author_name, u.handle AS author_handle,
        u.avatar_url AS author_avatar, u.role AS author_role,
        u.is_verified AS author_verified,
        (SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) AS like_count,
        (SELECT COUNT(*) FROM comments   WHERE post_id=p.id) AS comment_count
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.is_deleted = false`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Post haipatikani" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts
app.post("/api/posts", auth, async (req, res) => {
  try {
    const { content, category = "swali", image_url, source_url, source_title } = req.body;

    if (!content?.trim() && !image_url) {
      return res.status(400).json({ error: "Andika kitu au ongeza picha" });
    }

    const result = await db.query(
      `INSERT INTO posts (id, user_id, content, category, image_url, source_url, source_title, is_deleted, is_flagged, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, NOW(), NOW()) RETURNING *`,
      [uuid(), req.user.id, content?.trim() || "", category, image_url || null, source_url || null, source_title || null]
    );

    const post = result.rows[0];
    const authorRes = await db.query(
      "SELECT name AS author_name, handle AS author_handle, avatar_url AS author_avatar, is_verified AS author_verified FROM users WHERE id = $1",
      [req.user.id]
    );
    const fullPost = { 
      ...post, 
      ...authorRes.rows[0], 
      like_count: 0, 
      comment_count: 0, 
      user_liked: false 
    };

    // Broadcast to everyone
    io.emit("new_post", fullPost);

    res.status(201).json(fullPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/posts/:id/report
app.post("/api/posts/:id/report", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Flag the post
    await db.query(
      "UPDATE posts SET is_flagged = true, updated_at = NOW() WHERE id = $1",
      [id]
    );

    // Log the report in the reports table
    await db.query(
      "INSERT INTO reports (id, post_id, reporter_id, reason, created_at) VALUES ($1,$2,$3,$4,NOW())",
      [uuid(), id, req.user.id, reason || "Reported by user"]
    );

    res.json({ success: true, message: "Post imeripotiwa kwa usimamizi." });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// DELETE /api/posts/:id
app.delete("/api/posts/:id", auth, async (req, res) => {
  try {
    const post = await db.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
    if (!post.rows.length) return res.status(404).json({ error: "Post haipatikani" });
    if (post.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Huna ruhusa" });
    await db.query("DELETE FROM posts WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/posts/:id/like
app.post("/api/posts/:id/like", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const exists = await db.query(
      "SELECT id FROM post_likes WHERE post_id=$1 AND user_id=$2", [id, req.user.id]
    );
    if (exists.rows.length) {
      await db.query("DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2", [id, req.user.id]);
      return res.json({ liked: false });
    }
    await db.query(
      "INSERT INTO post_likes (id, post_id, user_id, created_at) VALUES ($1,$2,$3,NOW())",
      [uuid(), id, req.user.id]
    );
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/posts/:id/bookmark
app.post("/api/posts/:id/bookmark", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const exists = await db.query(
      "SELECT id FROM bookmarks WHERE post_id=$1 AND user_id=$2", [id, req.user.id]
    );
    if (exists.rows.length) {
      await db.query("DELETE FROM bookmarks WHERE post_id=$1 AND user_id=$2", [id, req.user.id]);
      return res.json({ bookmarked: false });
    }
    await db.query(
      "INSERT INTO bookmarks (id, post_id, user_id, created_at) VALUES ($1,$2,$3,NOW())",
      [uuid(), id, req.user.id]
    );
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  COMMENTS
// ════════════════════════════════════════════════════════════════════

// GET /api/posts/:id/comments
app.get("/api/posts/:id/comments", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name AS author_name, u.handle AS author_handle, u.avatar_url
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/posts/:id/comments
app.post("/api/posts/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Maoni hayawezi kuwa matupu" });

    const result = await db.query(
      `INSERT INTO comments (id, post_id, user_id, text, created_at)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [uuid(), req.params.id, req.user.id, text.trim()]
    );

    // Notify post author (si mwandishi mwenyewe)
    const { rows:[post] } = await db.query("SELECT user_id FROM posts WHERE id=$1", [req.params.id]);
    if (post && post.user_id !== req.user.id) {
      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, body, actor_id, actor_handle, link, is_read, created_at)
         VALUES ($1,$2,'comment',$3,$4,$5,$6,$7,false,NOW())
         ON CONFLICT DO NOTHING`,
        [
          uuid(), post.user_id,
          `@${req.user.handle} amecomment kwenye post yako`,
          text.trim().slice(0, 120),
          req.user.id, req.user.handle,
          `/posts/${req.params.id}`   // ← link ina post_id — ReactiveEngine inatumia hii
        ]
      );
      io.to(`user:${post.user_id}`).emit("notification", {
        type: "comment",
        title: `@${req.user.handle} amecomment`,
        body: text.trim().slice(0, 80),
        actorHandle: req.user.handle,
        link: `/posts/${req.params.id}`,
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  CHALLENGES
// ════════════════════════════════════════════════════════════════════

app.get("/api/challenges", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM challenge_registrations WHERE challenge_id = c.id) AS participant_count
       FROM challenges c ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

app.post("/api/challenges/:id/register", auth, async (req, res) => {
  try {
    const exists = await db.query(
      "SELECT id FROM challenge_registrations WHERE challenge_id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (exists.rows.length) return res.status(409).json({ error: "Tayari umejisajili" });
    await db.query(
      "INSERT INTO challenge_registrations (id,challenge_id,user_id,registered_at) VALUES ($1,$2,$3,NOW())",
      [uuid(), req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  RESOURCES
// ════════════════════════════════════════════════════════════════════

app.get("/api/resources", async (req, res) => {
  try {
    const { type } = req.query;
    let query = `SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar 
                 FROM resources r
                 LEFT JOIN users u ON u.id = r.user_id
                 WHERE r.status = 'approved'`;
    const params = [];
    if (type && type !== "Zote") {
      query += " AND r.type = $1";
      params.push(type);
    }
    query += " ORDER BY r.stars DESC";
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

app.post("/api/resources/:id/download", auth, async (req, res) => {
  try {
    await db.query("UPDATE resources SET downloads = downloads + 1 WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  NEWS
// ════════════════════════════════════════════════════════════════════

app.get("/api/news", async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let where = "";
    if (category && category !== "Zote") {
      params.unshift(category); where = "WHERE category=$1";
    }
    const result = await db.query(
      `SELECT * FROM news ${where} ORDER BY published_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  STARTUPS & INSTITUTIONS
// ════════════════════════════════════════════════════════════════════

app.get("/api/startups", async (req, res) => {
  try {
    const { sector } = req.query;
    const params = sector && sector !== "Zote" ? [sector] : [];
    const where  = params.length ? "WHERE sector=$1" : "";
    const result = await db.query(`SELECT * FROM startups ${where} ORDER BY founded DESC`, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

app.get("/api/institutions", async (req, res) => {
  try {
    const { type } = req.query;
    const params = type && type !== "Zote" ? [type] : [];
    const where  = params.length ? "WHERE type=$1" : "";
    const result = await db.query(`SELECT * FROM institutions ${where} ORDER BY name ASC`, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  EVENTS
// ════════════════════════════════════════════════════════════════════

app.get("/api/events", optionalAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS rsvp_count,
              EXISTS(SELECT 1 FROM event_registrations WHERE event_id = e.id AND user_id = $1) AS user_rsvpd
       FROM events e 
       WHERE e.date >= NOW() AND e.status = 'upcoming'
       ORDER BY e.date ASC`,
      [req.user?.id || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

app.post("/api/events/:id/rsvp", auth, async (req, res) => {
  try {
    const exists = await db.query(
      "SELECT id FROM event_registrations WHERE event_id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (exists.rows.length) {
      await db.query("DELETE FROM event_registrations WHERE event_id=$1 AND user_id=$2", [req.params.id, req.user.id]);
      return res.json({ rsvp: false });
    }
    await db.query(
      "INSERT INTO event_registrations (id,event_id,user_id,created_at) VALUES ($1,$2,$3,NOW())",
      [uuid(), req.params.id, req.user.id]
    );
    res.json({ rsvp: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  MESSAGES
// ════════════════════════════════════════════════════════════════════

// GET /api/messages/conversations
app.get("/api/messages/conversations", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (u.id)
              u.id, u.name, u.handle, u.avatar_url,
              m.text AS last_message, m.created_at AS last_message_at,
              (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND sender_id = u.id AND is_read = false) AS unread_count
       FROM users u
       JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = u.id)
       WHERE u.id != $1
       ORDER BY u.id, m.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// GET /api/messages/:userId
app.get("/api/messages/:userId", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [req.user.id, req.params.userId]
    );
    // Mark as read
    await db.query(
      "UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2",
      [req.user.id, req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/messages
app.post("/api/messages", auth, async (req, res) => {
  try {
    const { receiver_id, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Ujumbe hauwezi kuwa mtupu" });
    const result = await db.query(
      `INSERT INTO messages (id, sender_id, receiver_id, text, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [uuid(), req.user.id, receiver_id, text.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// GET /api/sidebar — Summary data for right sidebar
app.get("/api/sidebar", async (req, res) => {
  try {
    const trending = ["#SwahiliNLP", "#TanzaniaAI", "#ClaudeAPI", "#Hackathon2025", "#ZanzibarTech"];
    
    const upcomingEvents = await db.query(
      "SELECT id, name, date, color FROM events WHERE date >= NOW() ORDER BY date ASC LIMIT 3"
    );

    const newSections = [
      { id: "v1", label: "AI Job Board", is_new: true },
      { id: "v2", label: "Swahili Dataset Hub", is_new: true },
    ];

    const onlineCount = Math.floor(Math.random() * 20) + 5; // Fake online count

    res.json({
      trending,
      upcoming_events: upcomingEvents.rows,
      new_sections: newSections,
      online_count: onlineCount
    });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ── NEW: GET /api/users/suggestions ──────────────────────────────
app.get("/api/users/suggestions", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id,u.name,u.handle,u.avatar_url,u.role,u.is_verified,
        (SELECT COUNT(*) FROM follows WHERE following_id=u.id) AS followers
       FROM users u
       WHERE u.id != $1
         AND u.onboarded=true
         AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id=$1)
       ORDER BY followers DESC, u.created_at DESC
       LIMIT 6`,
      [req.user.id]
    );
    res.json({ suggestions:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── NEW: GET /api/users/:id/followers + /following ───────────────
app.get("/api/users/:id/followers", optionalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id,u.name,u.handle,u.avatar_url,u.role,u.is_verified
       FROM users u JOIN follows f ON u.id=f.follower_id WHERE f.following_id=$1`,
      [req.params.id]
    );
    res.json({ followers:rows, count:rows.length });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/users/:id/following", optionalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id,u.name,u.handle,u.avatar_url,u.role,u.is_verified
       FROM users u JOIN follows f ON u.id=f.following_id WHERE f.follower_id=$1`,
      [req.params.id]
    );
    res.json({ following:rows, count:rows.length });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT n.*, u.name AS actor_name, u.avatar_url AS actor_avatar, u.handle AS actor_handle
       FROM notifications n
       LEFT JOIN users u ON u.id=n.actor_id
       WHERE n.user_id=$1
       ORDER BY n.created_at DESC LIMIT 30`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    res.json({ notifications:rows, unread });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/notifications/:id/read", auth, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2",[req.params.id, req.user.id]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/notifications/read-all", auth, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read=true WHERE user_id=$1",[req.user.id]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── KAZI BOARD ────────────────────────────────────────────────────
app.get("/api/jobs", optionalAuth, async (req, res) => {
  try {
    const { type, location, search, page=1, limit=20, featured } = req.query;
    const off = (page-1)*parseInt(limit);
    const conditions = ["j.status='active'","(j.deadline IS NULL OR j.deadline > NOW())"];
    const params = [];
    let pi = 1;

    if (type && type!=="all") { conditions.push(`j.type=$${pi++}`); params.push(type); }
    if (location === "remote") { conditions.push("j.is_remote=true"); }
    else if (location && location!=="all") { conditions.push(`j.location=$${pi++}`); params.push(location); }
    if (featured==="true") { conditions.push("j.is_featured=true"); }
    if (search) { conditions.push(`(j.title ILIKE $${pi} OR j.company_name ILIKE $${pi} OR j.description ILIKE $${pi} OR j.tags::text ILIKE $${pi})`); params.push(`%${search}%`); pi++; }

    const where = "WHERE " + conditions.join(" AND ");
    const { rows } = await db.query(
      `SELECT j.*,
        ${req.user ? `(SELECT COUNT(*)>0 FROM job_applications WHERE job_id=j.id AND applicant_id='${req.user.id}') AS has_applied,
        (SELECT COUNT(*)>0 FROM saved_jobs WHERE job_id=j.id AND user_id='${req.user.id}') AS is_saved,` : ""}
        (SELECT COUNT(*) FROM job_applications WHERE job_id=j.id) AS applications_count
       FROM jobs j ${where}
       ORDER BY j.is_featured DESC, j.is_hot DESC, j.created_at DESC
       LIMIT $${pi} OFFSET $${pi+1}`,
      [...params, parseInt(limit), off]
    );
    res.json({ jobs:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/jobs/:id", optionalAuth, async (req, res) => {
  try {
    await db.query("UPDATE jobs SET views=views+1 WHERE id=$1",[req.params.id]);
    const { rows:[job] } = await db.query(
      `SELECT j.*,
        ${req.user ? `(SELECT COUNT(*)>0 FROM job_applications WHERE job_id=j.id AND applicant_id='${req.user.id}') AS has_applied,
        (SELECT COUNT(*)>0 FROM saved_jobs WHERE job_id=j.id AND user_id='${req.user.id}') AS is_saved,` : ""}
        (SELECT COUNT(*) FROM job_applications WHERE job_id=j.id) AS applications_count
       FROM jobs j WHERE j.id=$1`,
      [req.params.id]
    );
    if (!job) return res.status(404).json({ error:"Kazi haikupatikana" });
    res.json(job);
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.post("/api/jobs", auth, async (req, res) => {
  try {
    const { title,type,company_name,company_logo,description,requirements,benefits,
            location,country,is_remote,salary_min,salary_max,salary_currency,salary_visible,
            apply_url,apply_email,apply_internal,tags,deadline,poster_name,poster_email } = req.body;
    const requiresApproval = await getSetting("jobs_require_approval","true");
    const status = requiresApproval==="true" ? "inbox" : "active";
    const { rows:[job] } = await db.query(
      `INSERT INTO jobs (id,posted_by,title,type,company_name,company_logo,description,requirements,benefits,
        location,country,is_remote,salary_min,salary_max,salary_currency,salary_visible,
        apply_url,apply_email,apply_internal,tags,deadline,status,poster_name,poster_email,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,NOW())
       RETURNING *`,
      [uuid(),req.user.id,title,type||"full_time",company_name,company_logo,description,requirements,benefits,
       location,country||"Tanzania",is_remote||false,salary_min,salary_max,salary_currency||"TZS",salary_visible!==false,
       apply_url,apply_email,apply_internal||false,JSON.stringify(tags||[]),deadline,status,poster_name,poster_email]
    );
    notifyAdmin({ type:"new_job", message:`Kazi mpya: ${title} — ${company_name}`, jobId:job.id });
    res.status(201).json(job);
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.post("/api/jobs/:id/apply", auth, async (req, res) => {
  try {
    const { cover_letter,cv_url,linkedin_url,portfolio_url } = req.body;
    const { rows:[app] } = await db.query(
      `INSERT INTO job_applications (id,job_id,applicant_id,cover_letter,cv_url,linkedin_url,portfolio_url,created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [uuid(), req.params.id, req.user.id, cover_letter, cv_url, linkedin_url, portfolio_url]
    );
    res.status(201).json({ success:true, application:app });
  } catch (err) {
    if (err.code==="23505") return res.status(400).json({ error:"Tayari umeapply kwa kazi hii" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/jobs/:id/save", auth, async (req, res) => {
  try {
    const { rows:exist } = await db.query("SELECT 1 FROM saved_jobs WHERE job_id=$1 AND user_id=$2",[req.params.id, req.user.id]);
    if (exist.length > 0) {
      await db.query("DELETE FROM saved_jobs WHERE job_id=$1 AND user_id=$2",[req.params.id, req.user.id]);
      res.json({ saved:false });
    } else {
      await db.query("INSERT INTO saved_jobs (job_id,user_id,saved_at) VALUES ($1,$2,NOW())",[req.params.id, req.user.id]);
      res.json({ saved:true });
    }
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ADMIN: Job management
app.get("/api/admin/jobs", adminAuth, async (req, res) => {
  try {
    const { status="inbox" } = req.query;
    const { rows } = await db.query(
      `SELECT j.*, (SELECT COUNT(*) FROM job_applications WHERE job_id=j.id) AS applications_count
       FROM jobs j WHERE j.status=$1 ORDER BY j.created_at DESC`,
      [status]
    );
    res.json({ jobs:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/admin/jobs/:id/approve", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE jobs SET status='active',reviewed_by=$1,reviewed_at=NOW() WHERE id=$2",[req.user.id, req.params.id]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/admin/jobs/:id/feature", adminAuth, async (req, res) => {
  try {
    const { rows:[j] } = await db.query("SELECT is_featured FROM jobs WHERE id=$1",[req.params.id]);
    await db.query("UPDATE jobs SET is_featured=$1 WHERE id=$2",[!j.is_featured, req.params.id]);
    res.json({ success:true, is_featured:!j.is_featured });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.delete("/api/admin/jobs/:id", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE jobs SET status='rejected' WHERE id=$1",[req.params.id]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── UPLOAD ROUTES ─────────────────────────────────────────────────
app.post("/api/upload/avatar", auth, async (req, res) => {
  try {
    await handleUpload(uploadAvatar, req, res);
    if (!req.file) return res.status(400).json({ error:"Picha haikupokewa" });
    const url = getUploadedUrl(req, "avatars");
    const { rows:[old] } = await db.query("SELECT avatar_url FROM users WHERE id=$1",[req.user.id]);
    if (old?.avatar_url && !USE_LOCAL_STORAGE) await deleteCloudinaryImage(old.avatar_url);
    await db.query("UPDATE users SET avatar_url=$1, updated_at=NOW() WHERE id=$2",[url, req.user.id]);
    res.json({ success:true, avatarUrl: url });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error:"Picha ni kubwa. Max 2MB" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/upload/post-image", auth, async (req, res) => {
  try {
    await handleUpload(uploadPostImage, req, res);
    if (!req.file) return res.status(400).json({ error:"Picha haikupokewa" });
    const url = getUploadedUrl(req, "posts");
    res.json({ success:true, imageUrl: url, url });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error:"Picha ni kubwa. Max 5MB" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/upload/cv", auth, async (req, res) => {
  try {
    await handleUpload(uploadCV, req, res);
    if (!req.file) return res.status(400).json({ error:"CV haikupokewa" });
    const url = getUploadedUrl(req, "cvs");
    res.json({ success:true, cvUrl: url });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error:"CV ni kubwa. Max 5MB" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/upload/logo", auth, async (req, res) => {
  try {
    await handleUpload(uploadLogo, req, res);
    if (!req.file) return res.status(400).json({ error:"Logo haikupokewa" });
    const url = getUploadedUrl(req, "logos");
    res.json({ success:true, logoUrl: url });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── SEARCH ────────────────────────────────────────────────────────
app.get("/api/search", optionalAuth, async (req, res) => {
  try {
    const { q, type="all", page=1, limit=10 } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error:"Andika maneno angalau 2" });
    const term = q.trim(), likeQ = `%${term}%`, off = (page-1)*parseInt(limit);

    const [users, posts, resources, jobs, challenges] = await Promise.all([
      (type==="all"||type==="users") ? db.query(
        `SELECT id,name,handle,avatar_url,role,city,is_verified,
          (SELECT COUNT(*) FROM follows WHERE following_id=users.id) AS followers
         FROM users WHERE onboarded=true
           AND (name ILIKE $1 OR handle ILIKE $1 OR role ILIKE $1 OR bio ILIKE $1)
         ORDER BY is_verified DESC LIMIT $2 OFFSET $3`,
        [likeQ, parseInt(limit), off]
      ) : { rows:[] },

      (type==="all"||type==="posts") ? db.query(
        `SELECT p.id,p.content,p.image_url,p.source_url,p.source_title,p.created_at,
          u.name AS author_name, u.handle AS author_handle, u.avatar_url AS author_avatar,
          (SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) AS like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comment_count
         FROM posts p JOIN users u ON u.id=p.user_id
         WHERE p.content ILIKE $1
         ORDER BY like_count DESC LIMIT $2 OFFSET $3`,
        [likeQ, parseInt(limit), off]
      ) : { rows:[] },

      (type==="all"||type==="resources") ? db.query(
        `SELECT id,title,type,link,tags,description FROM resources
         WHERE status='approved' AND (title ILIKE $1 OR description ILIKE $1)
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [likeQ, parseInt(limit), off]
      ) : { rows:[] },

      (type==="all"||type==="jobs") ? db.query(
        `SELECT id,title,type,company_name,location,is_remote,salary_min,salary_max,
          salary_currency,salary_visible,tags,is_featured,deadline
         FROM jobs WHERE status='active'
           AND (title ILIKE $1 OR company_name ILIKE $1 OR description ILIKE $1)
           AND (deadline IS NULL OR deadline > NOW())
         ORDER BY is_featured DESC LIMIT $2 OFFSET $3`,
        [likeQ, parseInt(limit), off]
      ) : { rows:[] },

      (type==="all"||type==="challenges") ? db.query(
        `SELECT id,title,source,prize_display,deadline,tags,region,is_hot,participants
         FROM challenges WHERE status='open'
           AND (title ILIKE $1 OR tags::text ILIKE $1)
           AND (deadline IS NULL OR deadline > NOW())
         ORDER BY is_hot DESC LIMIT $2 OFFSET $3`,
        [likeQ, parseInt(limit), off]
      ) : { rows:[] },
    ]);

    res.json({
      query:term, total: users.rows.length+posts.rows.length+resources.rows.length+jobs.rows.length+challenges.rows.length,
      results:{ users:users.rows, posts:posts.rows, resources:resources.rows, jobs:jobs.rows, challenges:challenges.rows }
    });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/search/suggestions", optionalAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ suggestions:[] });
    const likeQ = `%${q.trim()}%`;
    const [users, posts] = await Promise.all([
      db.query(`SELECT id,name,handle,avatar_url,role,'user' AS type FROM users WHERE onboarded=true AND (name ILIKE $1 OR handle ILIKE $1) LIMIT 3`, [likeQ]),
      db.query(`SELECT p.id, LEFT(p.content,60) AS name, 'post' AS type, u.handle AS author_handle FROM posts p JOIN users u ON u.id=p.user_id WHERE p.content ILIKE $1 LIMIT 3`, [likeQ]),
    ]);
    res.json({ suggestions:[...users.rows, ...posts.rows] });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── DIRECT MESSAGES ───────────────────────────────────────────────
app.get("/api/messages", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT ON (other_user_id)
         CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS other_user_id,
         m.id, m.text, m.is_read, m.sender_id, m.created_at,
         u.name AS other_name, u.handle AS other_handle,
         u.avatar_url AS other_avatar, u.is_verified AS other_verified,
         (SELECT COUNT(*) FROM messages
          WHERE sender_id=CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
          AND receiver_id=$1 AND is_read=false) AS unread_count
       FROM messages m
       JOIN users u ON u.id=CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
       WHERE (m.sender_id=$1 OR m.receiver_id=$1) AND m.deleted_at IS NULL
       ORDER BY other_user_id, m.created_at DESC`,
      [req.user.id]
    );
    rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ conversations:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/messages/unread/count", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=false AND deleted_at IS NULL",
      [req.user.id]
    );
    res.json({ count:parseInt(rows[0].count) });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/messages/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page=1, limit=50 } = req.query;
    await db.query("UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false",[userId, req.user.id]);
    const { rows } = await db.query(
      `SELECT m.*, s.name AS sender_name, s.handle AS sender_handle, s.avatar_url AS sender_avatar
       FROM messages m JOIN users s ON s.id=m.sender_id
       WHERE ((m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1))
         AND m.deleted_at IS NULL
       ORDER BY m.created_at ASC LIMIT $3 OFFSET $4`,
      [req.user.id, userId, parseInt(limit), (page-1)*parseInt(limit)]
    );
    const { rows:[otherUser] } = await db.query(
      "SELECT id,name,handle,avatar_url,role,is_verified FROM users WHERE id=$1", [userId]
    );
    res.json({ messages:rows, otherUser });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.post("/api/messages/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { text, image_url } = req.body;
    if (!text?.trim() && !image_url) return res.status(400).json({ error:"Andika kitu kwanza" });

    const { rows:[msg] } = await db.query(
      "INSERT INTO messages (sender_id,receiver_id,text,image_url,created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING *",
      [req.user.id, userId, text?.trim()||"", image_url||null]
    );
    const { rows:[sender] } = await db.query("SELECT name,handle,avatar_url FROM users WHERE id=$1",[req.user.id]);
    const full = { ...msg, sender_name:sender.name, sender_handle:sender.handle, sender_avatar:sender.avatar_url };

    io.to(`user:${userId}`).emit("new_message", full);
    io.to(`user:${userId}`).emit("notification", {
      type:"message", title:`Ujumbe kutoka @${sender.handle}`,
      body:text?.slice(0,60)||"📷", actorHandle:sender.handle, actorAvatar:sender.avatar_url
    });
    res.json({ success:true, message:full });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.delete("/api/messages/:messageId", auth, async (req, res) => {
  try {
    await db.query("UPDATE messages SET deleted_at=NOW() WHERE id=$1 AND sender_id=$2",[req.params.messageId, req.user.id]);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── ADMIN DASHBOARD ───────────────────────────────────────────────
app.get("/api/admin/stats", adminAuth, async (req, res) => {
  try {
    const [users,postsToday,flagged,mrr,jobs,newToday,totalPosts,challenges,events,resources,news] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users"),
      db.query("SELECT COUNT(*) FROM posts WHERE created_at>NOW()-INTERVAL '1 day' AND is_deleted=false"),
      db.query("SELECT COUNT(*) FROM posts WHERE is_flagged=true AND is_deleted=false"),
      db.query("SELECT COALESCE(SUM(amount),0) AS mrr FROM subscriptions WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM jobs WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM users WHERE created_at>NOW()-INTERVAL '1 day'"),
      db.query("SELECT COUNT(*) FROM posts WHERE is_deleted=false"),
      db.query("SELECT COUNT(*) FROM challenges WHERE status='open'"),
      db.query("SELECT COUNT(*) FROM events WHERE date > NOW()"),
      db.query("SELECT COUNT(*) FROM resources WHERE status='approved'"),
      db.query("SELECT COUNT(*) FROM news WHERE status='published'"),
    ]);
    res.json({
      totalUsers:    parseInt(users.rows[0].count),
      postsToday:    parseInt(postsToday.rows[0].count),
      totalPosts:    parseInt(totalPosts.rows[0].count),
      flaggedContent:parseInt(flagged.rows[0].count),
      mrr:           parseInt(mrr.rows[0].mrr),
      activeJobs:    parseInt(jobs.rows[0].count),
      newToday:      parseInt(newToday.rows[0].count),
      challenges:    parseInt(challenges.rows[0].count),
      events:        parseInt(events.rows[0].count),
      resources:     parseInt(resources.rows[0].count),
      news:          parseInt(news.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/admin/settings", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT key, value FROM platform_settings");
    const settings = rows.reduce((acc, s) => ({ ...acc, [s.key]:s.value }), {});
    res.json(settings);
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/admin/settings", adminAuth, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, val] of entries) {
      await setSetting(key, typeof val === "object" ? JSON.stringify(val) : String(val), req.user.id);
    }
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── AUTOMATION (Apify & Kaggle) ───────────────────────────────────
async function fetchLatestNews() {
  console.log("🔄 Inaanza kuchakata habari mpya...");
  try {
    const sourcesStr = await getSetting("apify_sources", '{"techcrunch":true}');
    const sources    = JSON.parse(sourcesStr);
    const keywords   = await getSetting("apify_keywords_tz", "Tanzania AI");
    
    // Simulating Apify call or actual axios call if you have actor ID
    // For now, logic logic only as per guide structure
    console.log("✅ Habari zimechakatwa (Simulated)");
  } catch (err) { console.error("❌ News fetch error:", err.message); }
}

// ─── CHALLENGES AUTOMATION ──────────────────────────────────────
async function fetchAndSaveAllChallenges() {
  console.log("🔄 Starting Deep Challenge Fetch (Kaggle, AIcrowd, Zindi)...");
  try {
    const autoApprove = await getSetting("challenges_auto_approve", "false");
    const status      = autoApprove === "true" ? "open" : "pending";
    let saved = 0;

    // 1. KAGGLE
    if (process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY) {
      try {
        const auth = Buffer.from(`${process.env.KAGGLE_USERNAME}:${process.env.KAGGLE_KEY}`).toString('base64');
        const kaggleRes = await axios.get("https://www.kaggle.com/api/v1/competitions/list?sortBy=latestDeadline", {
          headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'JamiiAI' }
        });
        const comps = Array.isArray(kaggleRes.data) ? kaggleRes.data : [];
        console.log(`📦 Kaggle: Found ${comps.length} competitions`);
        for (const comp of comps) {
          const { rows: exist } = await db.query("SELECT id FROM challenges WHERE source='kaggle' AND external_id=$1", [comp.ref]);
          
          const rawPrize = comp.reward || "Knowledge";
          const prize = (rawPrize.toLowerCase() === "knowledge") ? "Elimu & Ujuzi 🎓" : rawPrize;

          if (exist.length > 0) {
            // Update existing record with new prize/deadline
            await db.query(
              `UPDATE challenges SET prize_display=$1, deadline=$2, source_url=$3 WHERE id=$4`,
              [prize, comp.deadline, comp.url, exist[0].id]
            );
            continue;
          }

          await db.query(
            `INSERT INTO challenges (id,title,org,prize_display,description,difficulty,tags,status,source,source_url,external_id,region,color,deadline,created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'kaggle',$9,$10,'Global','#20BEFF',$11,NOW())`,
            [uuid(), comp.title, "Kaggle", prize, comp.description || comp.title, "Kati", JSON.stringify(comp.categories || []), status, comp.url, comp.ref, comp.deadline]
          );
          saved++;
        }
      } catch (e) { console.error("❌ Kaggle Error:", e.message); }
    }

    // 2. AICROWD (Using resilient JSON endpoint)
    if (process.env.AICROWD_API_KEY) {
      try {
        const aiRes = await axios.get("https://www.aicrowd.com/api/v1/challenges.json", {
          headers: { 'Authorization': `Token ${process.env.AICROWD_API_KEY}`, 'User-Agent': 'JamiiAI' }
        });
        const aic = Array.isArray(aiRes.data) ? aiRes.data : (aiRes.data?.challenges || []);
        console.log(`📦 AIcrowd: Found ${aic.length} challenges`);
        for (const ch of aic.slice(0, 15)) {
          const { rows: exist } = await db.query("SELECT id FROM challenges WHERE source='aicrowd' AND external_id=$1", [ch.id?.toString()]);
          if (exist.length > 0) continue;
          await db.query(
            `INSERT INTO challenges (id,title,org,prize_display,description,difficulty,tags,status,source,source_url,external_id,region,color,created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'aicrowd',$9,$10,'Global','#4ECDC4',NOW())`,
            [uuid(), ch.title, "AIcrowd", ch.prize || "Knowledge", ch.description || "", "Ngumu", JSON.stringify([]), status, `https://www.aicrowd.com/challenges/${ch.slug}`, ch.id?.toString()]
          );
          saved++;
        }
      } catch (e) { console.error("❌ AIcrowd Error:", e.message); }
    }

    // 3. ZINDI (Africa Focused - Public Listing)
    try {
      console.log("📡 Fetching Zindi Africa challenges...");
      const zindiRes = await axios.get("https://zindi.africa/api/v1/competitions", { timeout: 6000 });
      const zdata = Array.isArray(zindiRes.data) ? zindiRes.data : [];
      console.log(`📦 Zindi: Found ${zdata.length} challenges`);
      for (const z of zdata) {
        const { rows: exist } = await db.query("SELECT id FROM challenges WHERE source='zindi' AND external_id=$1", [z.id?.toString()]);
        if (exist.length > 0) continue;
        await db.query(
          `INSERT INTO challenges (id,title,org,prize_display,description,difficulty,tags,status,source,source_url,external_id,region,color,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'zindi',$9,$10,'Africa','#F5A623',NOW())`,
          [uuid(), z.title, "Zindi", z.reward || "Prize", z.description || "", "Kati", JSON.stringify([]), status, `https://zindi.africa/competitions/${z.slug}`, z.id?.toString()]
        );
        saved++;
      }
    } catch (e) { console.warn("⚠️ Zindi skip:", e.message); }

    // 4. SMART FALLBACK (If still 0, add guaranteed active ones)
    if (saved === 0) {
      console.log("💡 Using smart fallbacks...");
      const fallbacks = [
        { id:"titanic-fb", title:"Titanic - ML from Disaster", org:"Kaggle", source:"kaggle", url:"https://www.kaggle.com/competitions/titanic", prize:"Knowledge", color:"#20BEFF" },
        { id:"swahili-fb", title:"Swahili News Classification", org:"Zindi", source:"zindi", url:"https://zindi.africa/competitions/swahili-news-classification", prize:"$500 USD", color:"#F5A623" }
      ];
      for (const f of fallbacks) {
        const { rows: exist } = await db.query("SELECT id FROM challenges WHERE external_id=$1", [f.id]);
        if (exist.length === 0) {
          await db.query(
            `INSERT INTO challenges (id,title,org,prize_display,description,status,source,source_url,external_id,region,color,created_at)
             VALUES ($1,$2,$3,$4,'Guaranteed active challenge','open',$5,$6,$7,'Global',$8,NOW())`,
            [uuid(), f.title, f.org, f.prize, f.source, f.url, f.id, f.color]
          );
          saved++;
        }
      }
    }

    console.log(`✅ Fetch Complete. Total new: ${saved}`);
    return saved;
  } catch (err) {
    console.error("❌ CRITICAL Fetch Error:", err.message);
    return 0;
  }
}

// Fixed Route Mounting (Ensure it's correctly placed)
app.post("/api/admin/challenges/fetch", adminAuth, async (req, res) => {
  try {
    const count = await fetchAndSaveAllChallenges();
    res.json({ success: true, message: `Mchakato umekamilika. Changamoto ${count} mpya zimepatikana.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CRON JOBS (mwisho wa server.js, kabla ya server.listen) ───────
// Challenges fetch — kila siku saa 9 asubuhi (06:00 EAT)
cron.schedule("0 3 * * *", async () => {
  await fetchAndSaveAllChallenges();
});

// News summary cleanup — delete drafts za zaidi ya siku 30
cron.schedule("0 2 * * 0", async () => {
  await db.query("DELETE FROM news WHERE status='inbox' AND created_at < NOW() - INTERVAL '30 days'");
  console.log("🧹 Old news inbox cleaned");
});

app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const { search, status, page=1, limit=50 } = req.query;
    const conditions = [];
    const params = [];
    let pi = 1;
    if (search) {
      conditions.push(`(u.name ILIKE $${pi} OR u.handle ILIKE $${pi} OR u.email ILIKE $${pi})`);
      params.push(`%${search}%`); pi++;
    }
    if (status && status !== "Wote") {
      if (status === "Verified") conditions.push("u.is_verified = true");
      else { conditions.push(`u.status = $${pi}`); params.push(status.toLowerCase()); pi++; }
    }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.handle, u.email, u.avatar_url, u.role, u.city,
              u.status, u.is_verified, u.onboarded, u.plan, u.created_at, u.updated_at,
              r.name AS role_name,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${pi} OFFSET $${pi+1}`,
      [...params, parseInt(limit), (parseInt(page)-1)*parseInt(limit)]
    );
    const { rows:[{count}] } = await db.query(`SELECT COUNT(*) FROM users u ${where}`, params);
    res.json({ users: rows, total: parseInt(count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/users/:id/ban", adminAuth, async (req, res) => {
  try {
    const { rows:[u] } = await db.query("SELECT status FROM users WHERE id=$1", [req.params.id]);
    if (!u) return res.status(404).json({ error: "User not found" });
    const newStatus = u.status === "banned" ? "active" : "banned";
    await db.query("UPDATE users SET status=$1 WHERE id=$2", [newStatus, req.params.id]);
    res.json({ success: true, status: newStatus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/users/:id/verify", adminAuth, async (req, res) => {
  try {
    const { rows:[u] } = await db.query("SELECT is_verified FROM users WHERE id=$1", [req.params.id]);
    if (!u) return res.status(404).json({ error: "User not found" });
    await db.query("UPDATE users SET is_verified=$1 WHERE id=$2", [!u.is_verified, req.params.id]);
    res.json({ success: true, is_verified: !u.is_verified });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE USER (Super Admin Only)
app.delete("/api/admin/users/:id", adminAuth, async (req, res) => {
  try {
    // 1. Hakikisha anayefuta ni Super Admin
    if (req.user.role_name !== 'super_admin') {
      return res.status(403).json({ error: "Ruhusa inahitajika: Super Admin pekee anaweza kufuta mtumiaji." });
    }

    const userIdToDelete = req.params.id;

    // 2. Zuia Super Admin asijifute mwenyewe
    if (userIdToDelete === req.user.id) {
      return res.status(400).json({ error: "Huwezi kufuta akaunti yako mwenyewe ukiwa ndani ya mfumo." });
    }

    // 3. Futa mtumiaji (Cascade itashughulikia posts/comments kama zipo kwenye schema)
    const { rowCount } = await db.query("DELETE FROM users WHERE id = $1", [userIdToDelete]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Mtumiaji hajapatikana." });
    }

    console.log(`[ADMIN] Mtumiaji ${userIdToDelete} amefutwa na Super Admin @${req.user.handle}`);
    res.json({ success: true, message: "Mtumiaji amefutwa kikamilifu kwenye mfumo." });
  } catch (err) {
    console.error("❌ Delete user error:", err);
    res.status(500).json({ error: "Imeshindikana kufuta mtumiaji. Huenda ana data zilizofungwa (foreign keys)." });
  }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: CONTENT MODERATION
// ════════════════════════════════════════════════════════════════════

// Ensure reports table exists
db.query(`
  CREATE TABLE IF NOT EXISTS reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    details     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports(post_id);
`).catch(err => console.error("❌ Error creating reports table:", err));

app.get("/api/admin/flagged", adminAuth, async (req, res) => {
  try {
    const { page=1, limit=20 } = req.query;
    const off = (parseInt(page)-1) * parseInt(limit);

    const { rows } = await db.query(
      `SELECT DISTINCT ON (p.id) 
              p.id, p.content, p.image_url, p.created_at, p.is_flagged,
              u.name AS author_name, u.handle AS author_handle, u.avatar_url,
              r.reason, r.created_at AS reported_at,
              rep.name AS reporter_name, rep.handle AS reporter_handle, rep.avatar_url AS reporter_avatar,
              (SELECT COUNT(*) FROM reports WHERE post_id=p.id) AS report_count
       FROM posts p 
       JOIN users u ON u.id=p.user_id
       LEFT JOIN reports r ON r.post_id = p.id
       LEFT JOIN users rep ON rep.id = r.reporter_id
       WHERE p.is_flagged=true AND p.is_deleted=false
       ORDER BY p.id, r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), off]
    );

    // Re-sort in memory if needed or use a subquery to sort by reported_at correctly across distinct posts
    const sortedPosts = rows.sort((a,b) => new Date(b.reported_at || 0) - new Date(a.reported_at || 0));

    const { rows:[{count}] } = await db.query(
      "SELECT COUNT(*) FROM posts WHERE is_flagged=true AND is_deleted=false"
    );

    res.json({ posts: sortedPosts, total: parseInt(count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/posts/:id/approve", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE posts SET is_flagged=false WHERE id=$1", [req.params.id]);
    await db.query("DELETE FROM reports WHERE post_id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/posts/:id", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE posts SET is_deleted=true, is_flagged=false WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: NEWS (HABARI)
// ════════════════════════════════════════════════════════════════════

app.get("/api/admin/news", adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const params = status ? [status] : [];
    const where  = status ? "WHERE status=$1" : "";
    const { rows } = await db.query(
      `SELECT * FROM news ${where} ORDER BY created_at DESC LIMIT 100`, params
    );
    res.json({ news: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/news", adminAuth, async (req, res) => {
  try {
    const { title, summary, category="Tanzania", source="JamiiAI", source_url, is_hot=false, status="published" } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Kichwa kinahitajika" });
    const { rows:[item] } = await db.query(
      `INSERT INTO news (id,title,summary,ai_summary,category,source,source_url,is_hot,status,published_at,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *`,
      [title.trim(), summary||"", category, source, source_url||"", is_hot, status]
    );
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/news/:id/publish", adminAuth, async (req, res) => {
  try {
    const { summary } = req.body;
    const updates = ["status='published'", "published_at=NOW()"];
    const params = [req.params.id];
    if (summary) { updates.push(`ai_summary=$${params.length+1}`); params.push(summary); }
    await db.query(`UPDATE news SET ${updates.join(",")} WHERE id=$1`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/news/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM news WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/apify/run", adminAuth, async (req, res) => {
  // Runs the scraper and returns any new items found
  try {
    const apiToken   = process.env.APIFY_API_TOKEN;
    const actorId    = process.env.APIFY_ACTOR_ID || "apify~cheerio-scraper";
    const sources    = JSON.parse(await getSetting("apify_sources", '{"techcrunch":true}'));

    if (!apiToken) {
      // Simulate for dev without real token
      const items = [
        {
          id: uuid(), title: `Google yazindua toleo jipya la Gemini 1.5 Pro nchini Tanzania`,
          summary: "Google imeanza kutoa ufikiaji wa Gemini 1.5 Pro kwa watengenezaji wa programu nchini Tanzania, ikiahidi maboresho makubwa katika uchakataji wa lugha ya Kiswahili.",
          ai_summary: "Google imeanza kutoa ufikiaji wa Gemini 1.5 Pro kwa watengenezaji wa programu nchini Tanzania, ikiahidi maboresho makubwa katika uchakataji wa lugha ya Kiswahili.",
          category: "Tanzania", source: "Tech News TZ", is_hot: true, status: "inbox",
        },
        {
          id: uuid(), title: `Mkutano wa AI Afrika Mashariki kufanyika Arusha mwezi ujao`,
          summary: "Arusha inatarajia kuwa kitovu cha teknolojia mwezi ujao wakati wataalamu wa AI kutoka kote Afrika Mashariki watakapokutana kujadili mustakabali wa akili mnemba.",
          ai_summary: "Arusha inatarajia kuwa kitovu cha teknolojia mwezi ujao wakati wataalamu wa AI kutoka kote Afrika Mashariki watakapokutana kujadili mustakabali wa akili mnemba.",
          category: "Tanzania", source: "Habari Leo", is_hot: false, status: "inbox",
        },
        {
          id: uuid(), title: `OpenAI yafungua ofisi ya kwanza barani Afrika mjini Nairobi`,
          summary: "Katika hatua ya kihistoria, OpenAI imetangaza kufungua kituo cha utafiti mjini Nairobi ili kuimarisha ushirikiano na wabunifu wa Kiafrika.",
          ai_summary: "Katika hatua ya kihistoria, OpenAI imetangaza kufungua kituo cha utafiti mjini Nairobi ili kuimarisha ushirikiano na wabunifu wa Kiafrika.",
          category: "Global", source: "Global Tech", is_hot: true, status: "inbox",
        }
      ];

      for (const item of items) {
        await db.query(
          `INSERT INTO news (id,title,summary,ai_summary,category,source,is_hot,status,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
          [item.id, item.title, item.summary, item.ai_summary, item.category, item.source, item.is_hot, item.status]
        );
      }
      return res.json({ success: true, inserted: items.length, message: "Simulated (no Apify token)" });
    }

    // Real Apify call
    const run = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
      { startUrls: Object.entries(sources).filter(([,v])=>v).map(([k])=>({url:`https://${k}.com/tag/ai`})) }
    );
    res.json({ success: true, runId: run.data.data?.id, message: "Scraper imeanza" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: CHALLENGES
// ════════════════════════════════════════════════════════════════════

app.get("/api/admin/challenges", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM challenge_registrations WHERE challenge_id=c.id) AS participant_count
       FROM challenges c ORDER BY c.created_at DESC`
    );
    res.json({ challenges: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/challenges", adminAuth, async (req, res) => {
  try {
    const { title, org="JamiiAI", prize_display, deadline, description, difficulty="Kati", tags=[], source_url, region="Global" } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Jina linahitajika" });
    const { rows:[ch] } = await db.query(
      `INSERT INTO challenges (id,title,org,prize_display,deadline,description,difficulty,tags,status,source,source_url,region,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,'open','manual',$8,$9,NOW()) RETURNING *`,
      [title.trim(), org, prize_display||"", deadline||null, description||"", difficulty, JSON.stringify(tags), source_url||"", region]
    );
    res.status(201).json(ch);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/challenges/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open","judging","completed","closed"].includes(status))
      return res.status(400).json({ error: "Status batili" });
    await db.query("UPDATE challenges SET status=$1 WHERE id=$2", [status, req.params.id]);
    res.json({ success: true, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/challenges/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM challenges WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: EVENTS (MATUKIO)
// ════════════════════════════════════════════════════════════════════

app.get("/api/admin/events", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM event_registrations WHERE event_id=e.id) AS rsvp_count
       FROM events e ORDER BY e.date DESC`
    );
    res.json({ events: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/events", adminAuth, async (req, res) => {
  try {
    const { name, date, type="Webinar", location, is_online=false, description, color="#F5A623" } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Jina linahitajika" });
    const { rows:[ev] } = await db.query(
      `INSERT INTO events (id,name,date,type,location,is_online,description,color,status,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,'draft',NOW()) RETURNING *`,
      [name.trim(), date||null, type, location||"", is_online, description||"", color]
    );
    res.status(201).json(ev);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/events/:id/publish", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE events SET status='upcoming' WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/events/:id", adminAuth, async (req, res) => {
  try {
    const { name, date, type, location, is_online, description, color, status } = req.body;
    const updates = [];
    const values = [];
    let pi = 1;

    if (name !== undefined) { updates.push(`name=$${pi++}`); values.push(name.trim()); }
    if (date !== undefined) { updates.push(`date=$${pi++}`); values.push(date || null); }
    if (type !== undefined) { updates.push(`type=$${pi++}`); values.push(type); }
    if (location !== undefined) { updates.push(`location=$${pi++}`); values.push(location || ""); }
    if (is_online !== undefined) { updates.push(`is_online=$${pi++}`); values.push(is_online); }
    if (description !== undefined) { updates.push(`description=$${pi++}`); values.push(description || ""); }
    if (color !== undefined) { updates.push(`color=$${pi++}`); values.push(color); }
    if (status !== undefined) { updates.push(`status=$${pi++}`); values.push(status); }

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows:[ev] } = await db.query(
      `UPDATE events SET ${updates.join(", ")} WHERE id=$${pi} RETURNING *`,
      values
    );
    res.json(ev);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/events/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM events WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: RESOURCES (RASILIMALI)
// ════════════════════════════════════════════════════════════════════

app.get("/api/admin/resources", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name AS submitted_by_name, u.avatar_url AS submitted_by_avatar
       FROM resources r LEFT JOIN users u ON u.id=r.user_id
       ORDER BY r.created_at DESC`
    );
    res.json({ resources: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/resources", adminAuth, async (req, res) => {
  try {
    const { title, type="Dataset", link, tags, description, desc, author, color="#F5A623", is_free=true } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Jina linahitajika" });
    
    // Auto-fetch GitHub Metadata
    const gh = await getGithubStats(link);
    const finalStars = gh ? gh.stars : 0;
    const finalDownloads = gh ? gh.downloads : 0;
    
    // Support both 'desc' (from admin form) and 'description'
    const finalDesc = description || desc || (gh ? gh.description : "");
    
    // Safe tags handling
    let finalTags = [];
    if (Array.isArray(tags)) finalTags = tags;
    else if (typeof tags === 'string') finalTags = tags.split(",").map(t=>t.trim()).filter(Boolean);
    
    // Merge GitHub topics if available
    if (gh && Array.isArray(gh.topics)) {
      finalTags = [...new Set([...finalTags, ...gh.topics])];
    }

    const { rows:[r] } = await db.query(
      `INSERT INTO resources (id,title,type,link,tags,description,author_name,status,source,color,is_free,stars,downloads,github_data,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'approved','admin',$8,$9,$10,$11,$12,NOW()) RETURNING *`,
      [uuid(), title.trim(), type, link||"", JSON.stringify(finalTags),
       finalDesc, author||"JamiiAI", color, is_free, finalStars, finalDownloads, JSON.stringify(gh || {})]
    );
    res.status(201).json(r);
  } catch (err) { 
    console.error("❌ Resource Create Error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

app.patch("/api/admin/resources/:id/approve", adminAuth, async (req, res) => {
  try {
    const { rows: [resObj] } = await db.query("SELECT link FROM resources WHERE id=$1", [req.params.id]);
    
    let updateQuery = "UPDATE resources SET status='approved', reviewed_at=NOW(), reviewed_by=$2 WHERE id=$1";
    let params = [req.params.id, req.user.id];

    if (resObj?.link?.includes("github.com")) {
      const gh = await getGithubStats(resObj.link);
      if (gh) {
        updateQuery = `UPDATE resources SET 
          status='approved', 
          reviewed_at=NOW(), 
          reviewed_by=$2,
          stars=$3,
          downloads=$4,
          github_data=$5
          WHERE id=$1`;
        params.push(gh.stars, gh.downloads, JSON.stringify(gh));
      }
    }

    await db.query(updateQuery, params);
    res.json({ success: true });
  } catch (err) { 
    console.error("Approve Error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

app.patch("/api/admin/resources/:id/update", adminAuth, async (req, res) => {
  try {
    const { title, type, link, tags, description, author_name, color, is_free } = req.body;

    let finalTagsJson = null;
    if (Array.isArray(tags)) finalTagsJson = JSON.stringify(tags);
    else if (typeof tags === 'string') finalTagsJson = JSON.stringify(tags.split(",").map(t=>t.trim()).filter(Boolean));

    const { rows:[r] } = await db.query(
      `UPDATE resources SET
        title       = COALESCE($1, title),
        type        = COALESCE($2, type),
        link        = COALESCE($3, link),
        tags        = COALESCE($4::jsonb, tags),
        description = COALESCE($5, description),
        author_name = COALESCE($6, author_name),
        color       = COALESCE($7, color),
        is_free     = COALESCE($8, is_free),
        updated_at  = NOW()
       WHERE id = $9 RETURNING *`,
      [title?.trim()||null, type||null, link?.trim()||null, finalTagsJson, description||null, author_name||null, color||null, is_free, req.params.id]
    );

    if (!r) return res.status(404).json({ error: "Rasilimali haipatikani" });
    res.json(r);
  } catch (err) {
    console.error("❌ Resource Update Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/admin/resources/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM resources WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GITHUB API HELPER ──────────────────────────────────────────
async function getGithubStats(url) {
  if (!url || !url.includes("github.com/")) return null;
  try {
    const parts = url.split("github.com/")[1].split("/");
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    if (!owner || !repo) return null;
    
    // Use token from platform_settings or .env for higher rate limits
    const dbToken = await getSetting("github");
    const token = dbToken || process.env.GITHUB_TOKEN;
    
    const headers = { 'User-Agent': 'JamiiAI-Community' };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    // Fetch repo info and releases (for downloads)
    const [repoRes, releaseRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers }).catch(() => ({ data: [] }))
    ]);
    
    let downloads = 0;
    if (Array.isArray(releaseRes.data)) {
      releaseRes.data.forEach(rel => {
        if (rel.assets) {
          rel.assets.forEach(asset => {
            downloads += (asset.download_count || 0);
          });
        }
      });
    }

    return {
      stars: repoRes.data.stargazers_count,
      forks: repoRes.data.forks_count,
      language: repoRes.data.language,
      description: repoRes.data.description,
      topics: repoRes.data.topics || [],
      downloads: downloads
    };
  } catch (err) {
    console.error("GitHub API Error:", err.message);
    return null;
  }
}

// Community submit resource
app.post("/api/resources/submit", auth, async (req, res) => {
  try {
    const { title, type, link, tags=[], description } = req.body;
    if (!title?.trim() || !link?.trim()) return res.status(400).json({ error: "Jina na link vinahitajika" });

    // Auto-fetch GitHub Metadata
    const gh = await getGithubStats(link);
    const finalStars = gh ? gh.stars : 0;
    const finalDownloads = gh ? gh.downloads : 0;
    const finalDesc = description || (gh ? gh.description : "");
    const finalTags = gh && gh.topics.length ? [...new Set([...(Array.isArray(tags)?tags:[]), ...gh.topics])] : tags;

    const { rows:[r] } = await db.query(
      `INSERT INTO resources (id,user_id,title,type,link,tags,description,status,source,stars,downloads,github_data,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','community',$8,$9,$10,NOW()) RETURNING *`,
      [uuid(), req.user.id, title.trim(), type||"Tutorial", link.trim(),
       JSON.stringify(Array.isArray(finalTags)?finalTags:finalTags.split(",").map(t=>t.trim()).filter(Boolean)),
       finalDesc, finalStars, finalDownloads, JSON.stringify(gh || {})]
    );
    res.status(201).json({ success: true, resource: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════════════

app.post("/api/admin/announcements", adminAuth, async (req, res) => {
  try {
    const { title, body, target="Wote", channels={inapp:true}, schedule="now" } = req.body;
    if (!title?.trim() || !body?.trim()) return res.status(400).json({ error: "Kichwa na ujumbe vinahitajika" });

    // Save to DB
    const { rows:[ann] } = await db.query(
      `INSERT INTO announcements (id,title,body,target,channels,sent_by,sent_at,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
      [title.trim(), body.trim(), target, JSON.stringify(channels), req.user.id]
    );

    // Send in-app notifications
    if (channels.inapp) {
      const { rows: targetUsers } = await db.query(
        target === "Wote" ? "SELECT id FROM users WHERE status='active'" :
        target === "Pro" ? `SELECT u.id FROM users u JOIN subscriptions s ON s.user_id=u.id WHERE s.plan='pro' AND s.status='active'` :
        "SELECT id FROM users WHERE status='active' LIMIT 100"
      );
      for (const u of targetUsers.slice(0, 200)) {
        await db.query(
          `INSERT INTO notifications (id,user_id,type,title,is_read,created_at)
           VALUES (uuid_generate_v4(),$1,'announcement',$2,false,NOW())`,
          [u.id, title]
        );
        io.to(`user:${u.id}`).emit("notification", { type:"announcement", title, body });
      }
    }

    // Send email if requested
    if (channels.email) {
      const { rows: emailUsers } = await db.query("SELECT email, name FROM users WHERE status='active' LIMIT 500");
      for (const u of emailUsers) {
        await sendEmail({ to: u.email, subject: title, html: `<h2>${title}</h2><p>${body}</p><hr><p>JamiiAI Community</p>` });
      }
    }

    res.status(201).json({ success: true, announcement: ann });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: ANALYTICS
// ════════════════════════════════════════════════════════════════════

app.get("/api/admin/analytics", adminAuth, async (req, res) => {
  try {
    const { range = "wiki" } = req.query;
    
    // Determine date range
    let interval, days;
    if (range === "leo") {
      interval = "1 day";
      days = ["Leo"];
    } else if (range === "mwezi") {
      interval = "30 days";
      days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toLocaleDateString("sw-TZ", { weekday: "short" });
      });
    } else {
      interval = "7 days";
      days = ["Jum","Alh","Ijm","Alm","Jtn","Jmt","Leo"];
    }

    // KPIs - Daily Active Users (users who posted, commented, or liked today)
    const dauQuery = await db.query(`
      SELECT COUNT(DISTINCT u.id) as dau
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT user_id FROM posts WHERE created_at >= NOW() - INTERVAL '1 day' AND is_deleted=false
        UNION
        SELECT DISTINCT user_id FROM comments WHERE created_at >= NOW() - INTERVAL '1 day'
        UNION
        SELECT DISTINCT user_id FROM post_likes WHERE created_at >= NOW() - INTERVAL '1 day'
      )
    `);
    const dau = parseInt(dauQuery.rows[0]?.dau || 0);

    // Retention (30-day) - Users who registered 30+ days ago and are still active
    const retentionQuery = await db.query(`
      WITH registered_30d_ago AS (
        SELECT id FROM users 
        WHERE created_at >= NOW() - INTERVAL '60 days' 
        AND created_at < NOW() - INTERVAL '30 days'
      ),
      active_last_30d AS (
        SELECT DISTINCT user_id FROM posts WHERE created_at >= NOW() - INTERVAL '30 days' AND is_deleted=false
        UNION
        SELECT DISTINCT user_id FROM comments WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT DISTINCT user_id FROM post_likes WHERE created_at >= NOW() - INTERVAL '30 days'
      )
      SELECT 
        COUNT(DISTINCT r.id) as total_registered,
        COUNT(DISTINCT a.user_id) as still_active,
        CASE 
          WHEN COUNT(DISTINCT r.id) > 0 
          THEN ROUND((COUNT(DISTINCT a.user_id)::numeric / COUNT(DISTINCT r.id)::numeric) * 100, 1)
          ELSE 0 
        END as retention_rate
      FROM registered_30d_ago r
      LEFT JOIN active_last_30d a ON r.id = a.user_id
    `);
    const retention30d = retentionQuery.rows[0]?.retention_rate || 0;

    // Conversion Rate (Free to Paid)
    const conversionQuery = await db.query(`
      SELECT 
        COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_users,
        COUNT(CASE WHEN plan IN ('basic', 'pro') THEN 1 END) as paid_users,
        CASE 
          WHEN COUNT(CASE WHEN plan = 'free' THEN 1 END) > 0
          THEN ROUND((COUNT(CASE WHEN plan IN ('basic', 'pro') THEN 1 END)::numeric / 
                     COUNT(*)::numeric) * 100, 1)
          ELSE 0
        END as conversion_rate
      FROM users
      WHERE status = 'active'
    `);
    const conversion = conversionQuery.rows[0]?.conversion_rate || 0;

    // Average Session (estimated from posts/comments per user per day)
    const avgSessionQuery = await db.query(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as active_users,
        CASE 
          WHEN COUNT(DISTINCT user_id) > 0
          THEN ROUND((COUNT(*)::numeric / COUNT(DISTINCT user_id)::numeric), 1)
          ELSE 0
        END as avg_actions_per_user
      FROM (
        SELECT user_id, created_at FROM posts WHERE created_at >= NOW() - INTERVAL '1 day' AND is_deleted=false
        UNION ALL
        SELECT user_id, created_at FROM comments WHERE created_at >= NOW() - INTERVAL '1 day'
        UNION ALL
        SELECT user_id, created_at FROM post_likes WHERE created_at >= NOW() - INTERVAL '1 day'
      ) daily_activity
    `);
    const avgSession = avgSessionQuery.rows[0]?.avg_actions_per_user || 0;

    // Daily Users and Posts
    const dailyUsersQuery = await db.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE(created_at) ORDER BY day ASC
    `);
    
    const dailyPostsQuery = await db.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS posts
      FROM posts 
      WHERE created_at >= NOW() - INTERVAL '${interval}' AND is_deleted=false
      GROUP BY DATE(created_at) ORDER BY day ASC
    `);

    // Build daily data array (fill missing days)
    const dailyDataMap = new Map();
    dailyUsersQuery.rows.forEach(row => {
      const dayKey = row.day instanceof Date ? row.day.toISOString().split('T')[0] : String(row.day).split('T')[0];
      dailyDataMap.set(dayKey, { users: parseInt(row.users || 0), posts: 0 });
    });
    dailyPostsQuery.rows.forEach(row => {
      const dayKey = row.day instanceof Date ? row.day.toISOString().split('T')[0] : String(row.day).split('T')[0];
      if (dailyDataMap.has(dayKey)) {
        dailyDataMap.get(dayKey).posts = parseInt(row.posts || 0);
      } else {
        dailyDataMap.set(dayKey, { users: 0, posts: parseInt(row.posts || 0) });
      }
    });

    const dailyUsers = days.map((dayLabel, idx) => {
      const targetDate = new Date();
      if (range === "leo") {
        targetDate.setDate(targetDate.getDate());
      } else if (range === "mwezi") {
        targetDate.setDate(targetDate.getDate() - (29 - idx));
      } else {
        targetDate.setDate(targetDate.getDate() - (6 - idx));
      }
      const dateKey = targetDate.toISOString().split('T')[0];
      const data = dailyDataMap.get(dateKey) || { users: 0, posts: 0 };
      return { 
        d: dayLabel, 
        day: dayLabel,
        u: data.users, 
        users: data.users, 
        p: data.posts, 
        posts: data.posts 
      };
    });

    // Top Content (Posts with most engagement this week)
    const topContentQuery = await db.query(`
      SELECT 
        p.id,
        LEFT(p.content, 60) as title,
        p.content,
        'Posts' as section,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as views,
        p.created_at
      FROM posts p
      WHERE p.created_at >= NOW() - INTERVAL '${interval}' 
        AND p.is_deleted = false
      ORDER BY 
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) DESC,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) DESC
      LIMIT 5
    `);
    const topContent = topContentQuery.rows.map(row => ({
      title: row.title || row.content?.slice(0, 60) || "Post",
      section: "Posts",
      likes: parseInt(row.likes || 0),
      views: parseInt(row.views || 0),
      id: row.id
    }));

    // Traffic Sources (simulated based on content types)
    const trafficQuery = await db.query(`
      SELECT 
        'Direct' as source,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      UNION ALL
      SELECT 
        'Social' as source,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= NOW() - INTERVAL '${interval}' AND is_deleted=false
      UNION ALL
      SELECT 
        'Search' as source,
        COUNT(*) as count
      FROM resources
      WHERE created_at >= NOW() - INTERVAL '${interval}' AND status='approved'
    `);
    
    const totalTraffic = trafficQuery.rows.reduce((sum, r) => sum + parseInt(r.count || 0), 0);
    const traffic = trafficQuery.rows.map((row, idx) => {
      const colors = ["#F5A623", "#4ECDC4", "#34D399", "#A78BFA"];
      const pct = totalTraffic > 0 ? Math.round((parseInt(row.count || 0) / totalTraffic) * 100) : 0;
      return {
        source: row.source,
        pct: pct,
        color: colors[idx % colors.length]
      };
    });

    // Retention by Week (last 4 weeks)
    const retentionWeeks = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w * 7 + 7));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (w * 7));
      
      const weekRetention = await db.query(`
        WITH registered_in_week AS (
          SELECT id FROM users 
          WHERE created_at >= $1 AND created_at < $2
        ),
        active_after_week AS (
          SELECT DISTINCT user_id FROM posts 
          WHERE created_at >= $2 AND is_deleted=false
          UNION
          SELECT DISTINCT user_id FROM comments WHERE created_at >= $2
        )
        SELECT 
          COUNT(DISTINCT r.id) as total,
          COUNT(DISTINCT a.user_id) as active,
          CASE 
            WHEN COUNT(DISTINCT r.id) > 0 
            THEN ROUND((COUNT(DISTINCT a.user_id)::numeric / COUNT(DISTINCT r.id)::numeric) * 100, 0)
            ELSE 0 
          END as rate
        FROM registered_in_week r
        LEFT JOIN active_after_week a ON r.id = a.user_id
      `, [weekStart, weekEnd]);
      
      retentionWeeks.push({
        week: `Wiki ${4 - w}`,
        rate: parseInt(weekRetention.rows[0]?.rate || 0)
      });
    }

    res.json({
      kpis: {
        dau: dau,
        dailyActiveUsers: dau,
        retention30d: retention30d,
        retention: retention30d,
        conversion: conversion,
        conversionRate: conversion,
        avgSession: `${avgSession} min`,
        avg_session: `${avgSession} min`
      },
      dailyUsers: dailyUsers,
      daily_users: dailyUsers,
      topContent: topContent,
      top_content: topContent,
      traffic: traffic,
      retention: retentionWeeks,
      weekly: dailyUsers, // For backward compatibility
      counts: {
        users: parseInt((await db.query("SELECT COUNT(*) FROM users")).rows[0].count),
        posts: parseInt((await db.query("SELECT COUNT(*) FROM posts WHERE is_deleted=false")).rows[0].count),
        jobs: parseInt((await db.query("SELECT COUNT(*) FROM jobs WHERE status='active'")).rows[0].count),
        messages: parseInt((await db.query("SELECT COUNT(*) FROM messages")).rows[0].count),
      }
    });
  } catch (err) { 
    console.error("Analytics error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: ROLES & PERMISSIONS
// ════════════════════════════════════════════════════════════════════

// GET all roles with member counts
app.get("/api/admin/roles", adminAuth, async (req, res) => {
  try {
    const { rows: roles } = await db.query(`
      SELECT 
        r.id,
        r.name,
        r.permissions,
        r.color,
        r.created_at,
        COUNT(DISTINCT ur.user_id) as member_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.name, r.permissions, r.color, r.created_at
      ORDER BY r.created_at ASC
    `);

    // Get members for each role
    const rolesWithMembers = await Promise.all(roles.map(async (role) => {
      const { rows: members } = await db.query(`
        SELECT u.id, u.name, u.handle, u.email, u.avatar_url, u.is_verified
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id = $1
        ORDER BY u.name ASC
      `, [role.id]);

      return {
        id: role.id,
        name: role.name,
        label: role.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        permissions: Array.isArray(role.permissions) ? role.permissions : JSON.parse(role.permissions || '[]'),
        color: role.color || '#94A3B8',
        icon: role.name === 'super_admin' ? '👑' : 
              role.name === 'admin' ? '🛡' :
              role.name === 'moderator' ? '⚖' :
              role.name === 'editor' ? '✏' :
              role.name === 'analyst' ? '📊' : '🎭',
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          handle: m.handle,
          email: m.email,
          avatar: m.avatar_url,
          verified: m.is_verified
        })),
        member_count: parseInt(role.member_count || 0),
        desc: role.name === 'super_admin' ? 'Ufikiaji kamili wa kila kitu — admin ya admin' :
              role.name === 'admin' ? 'Manage community yote isipokuwa billing na settings' :
              role.name === 'moderator' ? 'Pitiwa content iliyoflagiwa, ban watu wahalifu' :
              role.name === 'editor' ? 'Chapisha habari na approve resources' :
              role.name === 'analyst' ? 'Angalia analytics na reports tu' : 'Custom role'
      };
    }));

    res.json({ roles: rolesWithMembers });
  } catch (err) {
    console.error("Roles fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single role
app.get("/api/admin/roles/:id", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM roles WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Role haikupatikana" });
    res.json({ role: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new role
app.post("/api/admin/roles", adminAuth, async (req, res) => {
  try {
    const { name, permissions, color, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Jina la role linahitajika" });

    const { rows } = await db.query(
      `INSERT INTO roles (name, permissions, color, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [
        name.trim().toLowerCase().replace(/\s+/g, '_'),
        JSON.stringify(permissions || []),
        color || '#94A3B8'
      ]
    );
    res.status(201).json({ role: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: "Role yenye jina hilo tayari ipo" });
    res.status(500).json({ error: err.message });
  }
});

// PATCH update role
app.patch("/api/admin/roles/:id", adminAuth, async (req, res) => {
  try {
    const { permissions, color, name } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (permissions !== undefined) {
      updates.push(`permissions = $${paramCount}`);
      values.push(JSON.stringify(permissions));
      paramCount++;
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount}`);
      values.push(color);
      paramCount++;
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim().toLowerCase().replace(/\s+/g, '_'));
      paramCount++;
    }

    if (updates.length === 0) return res.status(400).json({ error: "Hakuna mabadiliko" });

    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: "Role haikupatikana" });
    res.json({ role: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE role
app.delete("/api/admin/roles/:id", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT name FROM roles WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Role haikupatikana" });
    
    // Prevent deleting system roles
    const systemRoles = ['super_admin', 'admin', 'moderator', 'editor', 'analyst'];
    if (systemRoles.includes(rows[0].name)) {
      return res.status(400).json({ error: "Huwezi kufuta system role" });
    }

    await db.query("DELETE FROM roles WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST assign role to user
app.post("/api/admin/roles/:roleId/assign", adminAuth, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { userId, userHandle, userEmail } = req.body;

    let targetUserId = userId;

    // If userId not provided, find by handle or email
    if (!targetUserId) {
      if (userHandle) {
        const { rows } = await db.query("SELECT id FROM users WHERE handle = $1 OR LOWER(handle) = $1", [userHandle.replace('@', '').toLowerCase()]);
        if (rows.length === 0) return res.status(404).json({ error: "Mtumiaji hajapatikana" });
        targetUserId = rows[0].id;
      } else if (userEmail) {
        const { rows } = await db.query("SELECT id FROM users WHERE email = $1", [userEmail.toLowerCase()]);
        if (rows.length === 0) return res.status(404).json({ error: "Mtumiaji hajapatikana" });
        targetUserId = rows[0].id;
      } else {
        return res.status(400).json({ error: "Tafadhali toa userId, userHandle, au userEmail" });
      }
    }

    // Check if assignment already exists
    const { rows: existing } = await db.query(
      "SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2",
      [targetUserId, roleId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Mtumiaji tayari ana role hii" });
    }

    await db.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())`,
      [targetUserId, roleId, req.user.id]
    );

    const { rows: user } = await db.query("SELECT name, handle FROM users WHERE id = $1", [targetUserId]);
    res.json({ success: true, user: user[0] });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: "User au Role haipo" });
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove role from user
app.delete("/api/admin/roles/:roleId/users/:userId", adminAuth, async (req, res) => {
  try {
    const { roleId, userId } = req.params;

    // Check if it's a system role and prevent removing from super_admin
    const { rows: role } = await db.query("SELECT name FROM roles WHERE id = $1", [roleId]);
    if (role.length > 0 && role[0].name === 'super_admin') {
      const { rows: userRoles } = await db.query(
        "SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1",
        [roleId]
      );
      if (parseInt(userRoles[0].count) <= 1) {
        return res.status(400).json({ error: "Huwezi kuondoa super_admin pekee" });
      }
    }

    await db.query(
      "DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2",
      [userId, roleId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET users with their roles
app.get("/api/admin/users/roles", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.handle,
        u.email,
        u.avatar_url,
        u.is_verified,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'name', r.name,
              'color', r.color
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.name, u.handle, u.email, u.avatar_url, u.is_verified
      ORDER BY u.name ASC
    `);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════════════════════

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", app: "JamiiAI", time: new Date().toISOString() })
);

app.use((_, res) => res.status(404).json({ error: "Route haipatikani" }));

server.listen(PORT, () => console.log(`🚀 JamiiAI Server inafanya kazi: http://localhost:${PORT}`));

module.exports = app;