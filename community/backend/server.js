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
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- Posts table enhancements
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'swali';
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

        -- Missing tables
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

// ── EMAIL ─────────────────────────────────────────────────────────
async function getEmailTransporter() {
  const host = await getSetting("smtp_host", "smtp.gmail.com");
  const port = parseInt(await getSetting("smtp_port", "587"));
  const user = await getSetting("smtp_user", "");
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure:port===465, auth:{ user, pass } });
}

async function sendEmail({ to, subject, html }) {
  const transporter = await getEmailTransporter();
  if (!transporter) { console.warn("⚠ SMTP haijawekwa"); return false; }
  try {
    const from = await getSetting("smtp_user", "noreply@jamii.ai");
    await transporter.sendMail({ from:`"JamiiAI" <${from}>`, to, subject, html });
    return true;
  } catch (err) { console.error("❌ Email error:", err.message); return false; }
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

// ── SOCKET.IO ─────────────────────────────────────────────────────
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials:true }
});
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
    const result = await db.query(
      `INSERT INTO users (id, name, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email`,
      [uuid(), name.trim(), email.toLowerCase(), hash]
    );
    const user = result.rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query(
      `SELECT u.*, r.name as role_name 
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1`, [email?.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Barua pepe au nywila si sahihi" });

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

    const result = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    
    if (!result.rows.length) {
      console.log("User not found for email:", email);
      return res.status(400).json({ error: "Barua pepe haijapatikana kwenye mfumo wetu." });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3600000);

    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expiry, email.toLowerCase()]
    );

    console.log(`[JAMII-AI] Password reset code for ${email}: ${token}`);
    res.json({ success: true, message: "Code imetumwa kwenye barua pepe yako.", debug_token: token });
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
      `SELECT u.*, r.name as role_name,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    const { password_hash, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
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
    res.json({ success: true });
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
    const params = type && type !== "Zote" ? [type] : [];
    const where  = params.length ? "WHERE type = $1" : "";
    const result = await db.query(
      `SELECT r.*, u.name AS author_name FROM resources r
       LEFT JOIN users u ON u.id = r.user_id
       ${where} ORDER BY r.stars DESC`,
      params
    );
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

app.get("/api/events", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS rsvp_count
       FROM events e WHERE e.date >= NOW() ORDER BY e.date ASC`
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

// ── ADMIN DASHBOARD ──────────────────────────────────────────────
app.get("/api/admin/stats", adminAuth, async (req, res) => {
  try {
    const [u, p, j, c, m] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users"),
      db.query("SELECT COUNT(*) FROM posts"),
      db.query("SELECT COUNT(*) FROM jobs WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM challenges WHERE status='open'"),
      db.query("SELECT COUNT(*) FROM messages")
    ]);
    const { rows:recentUsers } = await db.query("SELECT name,handle,avatar_url,created_at FROM users ORDER BY created_at DESC LIMIT 5");
    res.json({
      counts:{ users:u.rows[0].count, posts:p.rows[0].count, jobs:j.rows[0].count, challenges:c.rows[0].count, messages:m.rows[0].count },
      recentUsers
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

// ── CRON JOBS ─────────────────────────────────────────────────────
const scheduleHrs = 6; // should fetch from settings
cron.schedule(`0 */${scheduleHrs} * * *`, () => {
  console.log("⏰ Inarun Cron: Fetching News & Challenges...");
  fetchLatestNews();
});

// ════════════════════════════════════════════════════════════════════
//  ADMIN: USERS MANAGEMENT
// ════════════════════════════════════════════════════════════════════

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
              u.status, u.is_verified, u.onboarded, u.created_at, u.updated_at,
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

// ════════════════════════════════════════════════════════════════════
//  ADMIN: CONTENT MODERATION
// ════════════════════════════════════════════════════════════════════

app.get("/api/admin/flagged", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.id, p.content, p.image_url, p.created_at, p.is_flagged,
              u.name AS author_name, u.handle AS author_handle, u.avatar_url,
              'Flagged' AS reason,
              (SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) AS reports
       FROM posts p JOIN users u ON u.id=p.user_id
       WHERE p.is_flagged=true AND p.is_deleted=false
       ORDER BY p.created_at DESC`
    );
    res.json({ posts: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/posts/:id/approve", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE posts SET is_flagged=false WHERE id=$1", [req.params.id]);
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
    const keywordsTz = await getSetting("apify_keywords_tz", "Tanzania AI");

    if (!apiToken) {
      // Simulate for dev without real token
      const simulated = {
        id: uuid(), title: `Tanzania AI Roundup — ${new Date().toLocaleDateString()}`,
        summary: "Muhtasari wa habari za AI Tanzania — imeandaliwa na JamiiAI.",
        ai_summary: "Muhtasari wa habari za AI Tanzania — imeandaliwa na JamiiAI.",
        category: "Tanzania", source: "JamiiAI Bot", is_hot: false, status: "inbox",
      };
      await db.query(
        `INSERT INTO news (id,title,summary,ai_summary,category,source,status,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [simulated.id, simulated.title, simulated.summary, simulated.ai_summary,
         simulated.category, simulated.source, simulated.status]
      );
      return res.json({ success: true, inserted: 1, message: "Simulated (no Apify token)" });
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
    const { title, org="JamiiAI", prize_display, deadline, description, difficulty="Kati", tags=[] } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Jina linahitajika" });
    const { rows:[ch] } = await db.query(
      `INSERT INTO challenges (id,title,org,prize_display,deadline,description,difficulty,tags,status,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,'open',NOW()) RETURNING *`,
      [title.trim(), org, prize_display||"", deadline||null, description||"", difficulty, JSON.stringify(tags)]
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
      `INSERT INTO events (id,name,date,type,location,is_online,description,color,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
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
      `SELECT r.*, u.name AS submitted_by_name
       FROM resources r LEFT JOIN users u ON u.id=r.user_id
       ORDER BY r.created_at DESC`
    );
    res.json({ resources: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/resources", adminAuth, async (req, res) => {
  try {
    const { title, type="Dataset", link, tags=[], description, author } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Jina linahitajika" });
    const { rows:[r] } = await db.query(
      `INSERT INTO resources (id,title,type,link,tags,description,author_name,status,source,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,'approved','admin',NOW()) RETURNING *`,
      [title.trim(), type, link||"", JSON.stringify(Array.isArray(tags)?tags:tags.split(",").map(t=>t.trim()).filter(Boolean)),
       description||"", author||"JamiiAI"]
    );
    res.status(201).json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/resources/:id/approve", adminAuth, async (req, res) => {
  try {
    await db.query("UPDATE resources SET status='approved' WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/resources/:id", adminAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM resources WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Community submit resource
app.post("/api/resources/submit", auth, async (req, res) => {
  try {
    const { title, type, link, tags=[], description } = req.body;
    if (!title?.trim() || !link?.trim()) return res.status(400).json({ error: "Jina na link vinahitajika" });
    const { rows:[r] } = await db.query(
      `INSERT INTO resources (id,user_id,title,type,link,tags,description,status,source,created_at)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,'pending','community',NOW()) RETURNING *`,
      [req.user.id, title.trim(), type||"Tutorial", link.trim(),
       JSON.stringify(Array.isArray(tags)?tags:tags.split(",").map(t=>t.trim()).filter(Boolean)),
       description||""]
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
    const [users, posts, jobs, messages, daily] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users"),
      db.query("SELECT COUNT(*) FROM posts WHERE is_deleted=false"),
      db.query("SELECT COUNT(*) FROM jobs WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM messages"),
      db.query(`
        SELECT DATE(created_at) AS day, COUNT(*) AS users
        FROM users
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY day ASC
      `),
    ]);
    const postsDaily = await db.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS posts
      FROM posts WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY day ASC
    `);

    // Build 7-day chart (fill missing days)
    const days = ["Jum","Alh","Ijm","Alm","Jtn","Jmt","Leo"];
    const weekly = days.map((day, i) => {
      const d = daily.rows[i] || {};
      const p = postsDaily.rows[i] || {};
      return { day, users: parseInt(d.users||0), posts: parseInt(p.posts||0) };
    });

    res.json({
      counts: {
        users: parseInt(users.rows[0].count),
        posts: parseInt(posts.rows[0].count),
        jobs: parseInt(jobs.rows[0].count),
        messages: parseInt(messages.rows[0].count),
      },
      weekly,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
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