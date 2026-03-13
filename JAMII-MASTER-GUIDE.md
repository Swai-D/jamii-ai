# 🇹🇿 JamiiAI — MASTER IMPLEMENTATION GUIDE
## Gemini: Fuata hatua kwa hatua. Usiruke hatua yoyote.
## Kila kitu kipo hapa — database → backend → frontend → deploy

---

```
MUUNDO WA GUIDE HII:

SEHEMU A — DATABASE (schema.sql)
SEHEMU B — NPM PACKAGES (install mara moja)
SEHEMU C — BACKEND (server.js — functions + routes)
SEHEMU D — FRONTEND (lib/api.js + components + pages)
SEHEMU E — ENVIRONMENT VARIABLES
SEHEMU F — DEPLOY CHECKLIST

Muda wa kutekeleza: ~3-5 masaa
Faili zinazobadilishwa: schema.sql, server.js, lib/api.js
Faili mpya: components/ × 4, pages/ × 3, hooks/ × 2
```

---

# ═══════════════════════════════════════════════════
# SEHEMU A — DATABASE (schema.sql)
# Fanya hizi KWANZA kabla ya kitu kingine chochote
# ═══════════════════════════════════════════════════

## A1 — Platform Settings Table

```sql
CREATE TABLE IF NOT EXISTS platform_settings (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(100) UNIQUE NOT NULL,
  value      TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('apify_schedule_hours',  '6'),
  ('apify_sources',         '{"techcrunch":true,"venturebeat":true,"techmoran":true,"disruptafrica":true}'),
  ('apify_keywords_tz',     'Tanzania AI, JamiiAI, UDSM AI, Sarufi, Neurotech Africa'),
  ('apify_keywords_af',     'Africa AI, East Africa tech, Kenya AI'),
  ('apify_keywords_gl',     'artificial intelligence, LLM, Claude, GPT, Gemini'),
  ('apify_auto_publish',    'false'),
  ('apify_summary_lang',    'Kiswahili'),
  ('platform_name',         'JamiiAI'),
  ('platform_url',          'https://jamii.ai'),
  ('registration_open',     'true'),
  ('maintenance_mode',      'false'),
  ('free_plan_messages',    '50'),
  ('smtp_host',             'smtp.gmail.com'),
  ('smtp_port',             '587'),
  ('smtp_user',             ''),
  ('challenges_fetch_kaggle',   'true'),
  ('challenges_fetch_aicrowd',  'true'),
  ('challenges_fetch_devpost',  'true'),
  ('challenges_fetch_zindi',    'true'),
  ('challenges_auto_approve',   'false'),
  ('challenges_min_prize_usd',  '0'),
  ('jobs_require_approval',         'true'),
  ('jobs_free_posts_per_month',     '3'),
  ('jobs_featured_price_tzs',       '50000'),
  ('jobs_max_active_per_employer',  '10'),
  ('jobs_default_deadline_days',    '30')
ON CONFLICT (key) DO NOTHING;
```

## A2 — Roles & Permissions

```sql
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  color       VARCHAR(20) DEFAULT '#94A3B8',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id     INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name, permissions, color) VALUES
  ('super_admin', '["all"]',                                          '#F5A623'),
  ('admin',       '["users","content","news","resources","billing"]', '#4ADE80'),
  ('moderator',   '["content","users.ban"]',                         '#60A5FA'),
  ('editor',      '["news","resources"]',                            '#C084FC'),
  ('analyst',     '["analytics","billing.view"]',                    '#94A3B8')
ON CONFLICT (name) DO NOTHING;
```

## A3 — Billing & Subscriptions

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free',
  status        VARCHAR(20) DEFAULT 'active',
  amount        INTEGER DEFAULT 0,
  stripe_sub_id VARCHAR(100),
  started_at    TIMESTAMP DEFAULT NOW(),
  next_billing  TIMESTAMP,
  cancelled_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  amount          INTEGER NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  invoice_num     VARCHAR(20) UNIQUE,
  paid_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

## A4 — Announcements

```sql
CREATE TABLE IF NOT EXISTS announcements (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  target       VARCHAR(50) DEFAULT 'all',
  channels     JSONB DEFAULT '["in-app"]',
  admin_id     INTEGER REFERENCES users(id),
  scheduled_at TIMESTAMP,
  sent_at      TIMESTAMP,
  reach        INTEGER DEFAULT 0,
  opens        INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

## A5 — Jobs (Kazi Board)

```sql
CREATE TYPE IF NOT EXISTS job_type   AS ENUM ('full_time','part_time','remote','internship','freelance','contract');
CREATE TYPE IF NOT EXISTS job_status AS ENUM ('inbox','active','closed','rejected');
CREATE TYPE IF NOT EXISTS app_status AS ENUM ('submitted','viewed','shortlisted','rejected','hired');

CREATE TABLE IF NOT EXISTS jobs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  company_name     VARCHAR(200) NOT NULL,
  company_logo     TEXT,
  title            VARCHAR(200) NOT NULL,
  type             job_type NOT NULL DEFAULT 'full_time',
  category         VARCHAR(100),
  description      TEXT NOT NULL,
  requirements     TEXT,
  benefits         TEXT,
  location         VARCHAR(100),
  country          VARCHAR(100) DEFAULT 'Tanzania',
  is_remote        BOOLEAN DEFAULT false,
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary_currency  VARCHAR(10) DEFAULT 'TZS',
  salary_visible   BOOLEAN DEFAULT true,
  apply_url        TEXT,
  apply_email      VARCHAR(200),
  apply_internal   BOOLEAN DEFAULT false,
  tags             JSONB DEFAULT '[]',
  status           job_status DEFAULT 'inbox',
  is_featured      BOOLEAN DEFAULT false,
  is_hot           BOOLEAN DEFAULT false,
  views            INTEGER DEFAULT 0,
  deadline         DATE,
  source           VARCHAR(50) DEFAULT 'direct',
  poster_name      VARCHAR(200),
  poster_email     VARCHAR(200),
  reviewed_by      INTEGER REFERENCES users(id),
  reviewed_at      TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  cover_letter  TEXT,
  cv_url        TEXT,
  linkedin_url  TEXT,
  portfolio_url TEXT,
  status        app_status DEFAULT 'submitted',
  employer_notes TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  job_id     UUID    REFERENCES jobs(id)  ON DELETE CASCADE,
  saved_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type      ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_country   ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline  ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_featured  ON jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created   ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_job       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_applicant ON job_applications(applicant_id);
```

## A6 — Alter existing tables

```sql
-- posts — image uploads
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- resources — community submissions
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS status       VARCHAR(20) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS link         TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_by  INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMP;

-- news — Apify scraping fields
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS source      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_url  TEXT,
  ADD COLUMN IF NOT EXISTS raw_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary  TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at  TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status      VARCHAR(20) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_hot      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS region      VARCHAR(50) DEFAULT 'Global';

-- challenges — external sources
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS status         VARCHAR(20) DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS source         VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_url     TEXT,
  ADD COLUMN IF NOT EXISTS external_id    VARCHAR(200),
  ADD COLUMN IF NOT EXISTS prize_usd      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_display  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS deadline       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS difficulty     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS region         VARCHAR(100) DEFAULT 'Global',
  ADD COLUMN IF NOT EXISTS ai_summary     TEXT,
  ADD COLUMN IF NOT EXISTS raw_desc       TEXT,
  ADD COLUMN IF NOT EXISTS is_hot         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS participants   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scraped_at     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_by    INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_external
  ON challenges(source, external_id)
  WHERE external_id IS NOT NULL;

-- messages — DM additional fields
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- notifications — full fields
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type         VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS actor_id     INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS actor_name   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS actor_handle VARCHAR(100),
  ADD COLUMN IF NOT EXISTS actor_avatar TEXT,
  ADD COLUMN IF NOT EXISTS is_read      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS link         TEXT;
```

## A7 — Full-text Search Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(
  to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(handle,'') || ' ' ||
    coalesce(role,'') || ' '  || coalesce(bio,'')   || ' ' || coalesce(city,'')
  )
);

CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(
  to_tsvector('english', coalesce(content,''))
);

CREATE INDEX IF NOT EXISTS idx_resources_search ON resources USING gin(
  to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(tags::text,'')
  )
);

CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin(
  to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(company_name,'') || ' ' ||
    coalesce(description,'') || ' ' || coalesce(tags::text,'')
  )
);
```

---

# ═══════════════════════════════════════════════════
# SEHEMU B — NPM PACKAGES
# Run hizi kwenye backend directory
# ═══════════════════════════════════════════════════

```bash
npm install cloudinary multer multer-storage-cloudinary
npm install nodemailer
npm install node-cron
npm install axios
```

---

# ═══════════════════════════════════════════════════
# SEHEMU C — BACKEND (server.js)
# Ongeza kwa mpangilio huu — vitu vya juu vinatumika na vya chini
# ═══════════════════════════════════════════════════

## C1 — Requires mpya (ongeza juu ya server.js pamoja na require zilizopo)

```javascript
const cloudinary   = require("cloudinary").v2;
const multer       = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const nodemailer   = require("nodemailer");
const cron         = require("node-cron");
const axios        = require("axios");
```

## C2 — Cloudinary Config (baada ya require zote, kabla ya routes)

```javascript
// ── CLOUDINARY ────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const makeStorage = (folder, formats, transform) => new CloudinaryStorage({
  cloudinary,
  params: { folder:`jamii-ai/${folder}`, allowed_formats:formats, transformation:transform,
    public_id:(req) => `${folder}_${req.user?.id || "anon"}_${Date.now()}` }
});

const uploadAvatar = multer({
  storage: makeStorage("avatars",["jpg","jpeg","png","webp"],
    [{ width:400, height:400, crop:"fill", gravity:"face" },{ quality:"auto", fetch_format:"auto" }]),
  limits:{ fileSize: 2*1024*1024 }
}).single("avatar");

const uploadPostImage = multer({
  storage: makeStorage("posts",["jpg","jpeg","png","webp","gif"],
    [{ width:1200, height:630, crop:"limit" },{ quality:"auto", fetch_format:"auto" }]),
  limits:{ fileSize: 5*1024*1024 }
}).single("image");

const uploadCV = multer({
  storage: new CloudinaryStorage({ cloudinary, params:{ folder:"jamii-ai/cvs",
    allowed_formats:["pdf"], resource_type:"raw",
    public_id:(req) => `cv_${req.user?.id}_${Date.now()}` }}),
  limits:{ fileSize: 5*1024*1024 }
}).single("cv");

const uploadLogo = multer({
  storage: makeStorage("logos",["jpg","jpeg","png","webp","svg"],
    [{ width:200, height:200, crop:"pad", background:"transparent" }]),
  limits:{ fileSize: 2*1024*1024 }
}).single("logo");

function handleUpload(uploader, req, res) {
  return new Promise((resolve, reject) => uploader(req, res, e => e ? reject(e) : resolve()));
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
```

## C3 — Settings Helpers

```javascript
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
```

## C4 — Claude AI (Kiswahili Summary)

```javascript
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
```

## C5 — Email (SMTP)

```javascript
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
```

## C6 — Admin Auth Middleware

```javascript
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
```

## C7 — Socket.io Setup (replace au update existing)

```javascript
// ── SOCKET.IO ─────────────────────────────────────────────────────
// MUHIMU: Tumia server.listen badala ya app.listen
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: [process.env.CLIENT_URL, process.env.ADMIN_URL, "http://localhost:3000","http://localhost:3001"], credentials:true }
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

// CHANGE server.listen badala ya app.listen (mwisho wa server.js)
// server.listen(PORT, ...)  ← LAZIMA iwe hii, si app.listen
```

## C8 — Upload Routes

```javascript
// ── UPLOAD ROUTES ─────────────────────────────────────────────────
app.post("/api/upload/avatar", auth, async (req, res) => {
  try {
    await handleUpload(uploadAvatar, req, res);
    if (!req.file) return res.status(400).json({ error:"Picha haikupokewa" });
    const { rows:[old] } = await db.query("SELECT avatar_url FROM users WHERE id=$1",[req.user.id]);
    if (old?.avatar_url) await deleteCloudinaryImage(old.avatar_url);
    await db.query("UPDATE users SET avatar_url=$1, updated_at=NOW() WHERE id=$2",[req.file.path, req.user.id]);
    res.json({ success:true, avatarUrl:req.file.path });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error:"Picha ni kubwa. Max 2MB" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/upload/post-image", auth, async (req, res) => {
  try {
    await handleUpload(uploadPostImage, req, res);
    if (!req.file) return res.status(400).json({ error:"Picha haikupokewa" });
    res.json({ success:true, imageUrl:req.file.path });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error:"Picha ni kubwa. Max 5MB" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/upload/cv", auth, async (req, res) => {
  try {
    await handleUpload(uploadCV, req, res);
    if (!req.file) return res.status(400).json({ error:"CV haikupokewa" });
    res.json({ success:true, cvUrl:req.file.path });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error:"CV ni kubwa. Max 5MB" });
    res.status(500).json({ error:err.message });
  }
});

app.post("/api/upload/logo", auth, async (req, res) => {
  try {
    await handleUpload(uploadLogo, req, res);
    if (!req.file) return res.status(400).json({ error:"Logo haikupokewa" });
    res.json({ success:true, logoUrl:req.file.path });
  } catch (err) { res.status(500).json({ error:err.message }); }
});
```

## C9 — Search Routes

```javascript
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
         FROM users WHERE status='active'
           AND (name ILIKE $1 OR handle ILIKE $1 OR role ILIKE $1 OR bio ILIKE $1)
         ORDER BY is_verified DESC LIMIT $2 OFFSET $3`,
        [likeQ, parseInt(limit), off]
      ) : { rows:[] },

      (type==="all"||type==="posts") ? db.query(
        `SELECT p.id,p.content,p.image_url,p.created_at,
          u.name AS author_name, u.handle AS author_handle, u.avatar_url AS author_avatar,
          (SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) AS like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comment_count
         FROM posts p JOIN users u ON u.id=p.user_id
         WHERE p.is_deleted=false AND p.content ILIKE $1
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
      db.query(`SELECT id,name,handle,avatar_url,role,'user' AS type FROM users WHERE status='active' AND (name ILIKE $1 OR handle ILIKE $1) LIMIT 3`, [likeQ]),
      db.query(`SELECT p.id, LEFT(p.content,60) AS name, 'post' AS type, u.handle AS author_handle FROM posts p JOIN users u ON u.id=p.user_id WHERE p.is_deleted=false AND p.content ILIKE $1 LIMIT 3`, [likeQ]),
    ]);
    res.json({ suggestions:[...users.rows, ...posts.rows] });
  } catch (err) { res.status(500).json({ error:err.message }); }
});
```

## C10 — Direct Messages Routes

```javascript
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
```

## C11 — Follow System (fix existing + add new)

```javascript
// ── FIX: GET /api/posts — add feed=following ─────────────────────
// Badilisha route iliyopo GET /api/posts — ongeza logic hii:
// (Badilisha query yote ya posts)
app.get("/api/posts", optionalAuth, async (req, res) => {
  try {
    const { feed="all", category, page=1, limit=20 } = req.query;
    const off = (page-1)*parseInt(limit);
    let whereClause = "WHERE p.is_deleted=false";

    if (feed==="following" && req.user) {
      whereClause += ` AND p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id=${req.user.id}
      )`;
    }
    if (category && category !== "all") whereClause += ` AND p.category='${category}'`;

    const { rows } = await db.query(
      `SELECT p.*,
        u.name AS author_name, u.handle AS author_handle,
        u.avatar_url AS author_avatar, u.is_verified AS author_verified,
        (SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) AS like_count,
        (SELECT COUNT(*) FROM comments   WHERE post_id=p.id) AS comment_count
        ${req.user ? `,(SELECT COUNT(*)>0 FROM post_likes WHERE post_id=p.id AND user_id=${req.user.id}) AS user_liked` : ""}
       FROM posts p JOIN users u ON u.id=p.user_id
       ${whereClause}
       ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), off]
    );
    res.json({ posts:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── FIX: POST /api/users/:id/follow — add notification ───────────
// Badilisha route iliyopo:
app.post("/api/users/:id/follow", auth, async (req, res) => {
  try {
    const { id:targetId } = req.params;
    if (parseInt(targetId) === req.user.id) return res.status(400).json({ error:"Huwezi kujifuata mwenyewe" });
    const { rows:existing } = await db.query(
      "SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2",[req.user.id, targetId]
    );
    if (existing.length > 0) {
      await db.query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2",[req.user.id, targetId]);
    } else {
      await db.query("INSERT INTO follows (follower_id,following_id,created_at) VALUES($1,$2,NOW())",[req.user.id, targetId]);
      // Notify mtumiaji aliyefuatwa
      await db.query(
        `INSERT INTO notifications (user_id,type,title,actor_id,actor_handle,is_read,created_at)
         VALUES($1,'follow','Anakufuata',$2,$3,false,NOW())`,
        [targetId, req.user.id, req.user.handle]
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

// ── NEW: GET /api/users/suggestions ──────────────────────────────
app.get("/api/users/suggestions", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id,u.name,u.handle,u.avatar_url,u.role,u.is_verified,
        (SELECT COUNT(*) FROM follows WHERE following_id=u.id) AS followers
       FROM users u
       WHERE u.id != $1
         AND u.status='active'
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
```

## C12 — Notifications Routes

```javascript
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
```

## C13 — Jobs (Kazi Board) Routes

```javascript
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
        ${req.user ? `(SELECT COUNT(*)>0 FROM job_applications WHERE job_id=j.id AND applicant_id=${req.user.id}) AS has_applied,
        (SELECT COUNT(*)>0 FROM saved_jobs WHERE job_id=j.id AND user_id=${req.user.id}) AS is_saved,` : ""}
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
        ${req.user ? `(SELECT COUNT(*)>0 FROM job_applications WHERE job_id=j.id AND applicant_id=${req.user.id}) AS has_applied,
        (SELECT COUNT(*)>0 FROM saved_jobs WHERE job_id=j.id AND user_id=${req.user.id}) AS is_saved,` : ""}
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
      `INSERT INTO jobs (posted_by,title,type,company_name,company_logo,description,requirements,benefits,
        location,country,is_remote,salary_min,salary_max,salary_currency,salary_visible,
        apply_url,apply_email,apply_internal,tags,deadline,status,poster_name,poster_email,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW())
       RETURNING *`,
      [req.user.id,title,type||"full_time",company_name,company_logo,description,requirements,benefits,
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
      `INSERT INTO job_applications (job_id,applicant_id,cover_letter,cv_url,linkedin_url,portfolio_url,created_at)
       VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [req.params.id, req.user.id, cover_letter, cv_url, linkedin_url, portfolio_url]
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
      await db.query("INSERT INTO saved_jobs (job_id,user_id,saved_at) VALUES($1,$2,NOW())",[req.params.id, req.user.id]);
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
```

## C14 — Admin Routes (Dashboard, Users, Content, Settings)

```javascript
// ── ADMIN DASHBOARD ───────────────────────────────────────────────
app.get("/api/admin/stats", adminAuth, async (req, res) => {
  try {
    const [users,postsToday,flagged,mrr,jobs,newToday] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users"),
      db.query("SELECT COUNT(*) FROM posts WHERE created_at>NOW()-INTERVAL '1 day' AND is_deleted=false"),
      db.query("SELECT COUNT(*) FROM posts WHERE is_flagged=true AND status='pending'"),
      db.query("SELECT COALESCE(SUM(amount),0) AS mrr FROM subscriptions WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM jobs WHERE status='active'"),
      db.query("SELECT COUNT(*) FROM users WHERE created_at>NOW()-INTERVAL '1 day'"),
    ]);
    res.json({
      totalUsers:    parseInt(users.rows[0].count),
      postsToday:    parseInt(postsToday.rows[0].count),
      flaggedContent:parseInt(flagged.rows[0].count),
      mrr:           parseInt(mrr.rows[0].mrr),
      activeJobs:    parseInt(jobs.rows[0].count),
      newUsersToday: parseInt(newToday.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── ADMIN USERS ───────────────────────────────────────────────────
app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const { search, page=1, limit=20 } = req.query;
    const conds = []; const params = [];
    if (search) { conds.push(`(name ILIKE $${params.length+1} OR email ILIKE $${params.length+1} OR handle ILIKE $${params.length+1})`); params.push(`%${search}%`); }
    const where = conds.length ? "WHERE "+conds.join(" AND ") : "";
    const { rows } = await db.query(
      `SELECT u.*, r.name AS role_name
       FROM users u LEFT JOIN user_roles ur ON u.id=ur.user_id LEFT JOIN roles r ON ur.role_id=r.id
       ${where} ORDER BY u.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, parseInt(limit), (page-1)*parseInt(limit)]
    );
    res.json({ users:rows });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/admin/users/:id/ban", adminAuth, async (req, res) => {
  try {
    const { rows:[u] } = await db.query("SELECT status FROM users WHERE id=$1",[req.params.id]);
    const newStatus = u.status==="banned" ? "active" : "banned";
    await db.query("UPDATE users SET status=$1 WHERE id=$2",[newStatus, req.params.id]);
    res.json({ success:true, status:newStatus });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/admin/users/:id/verify", adminAuth, async (req, res) => {
  try {
    const { rows:[u] } = await db.query("SELECT is_verified FROM users WHERE id=$1",[req.params.id]);
    await db.query("UPDATE users SET is_verified=$1 WHERE id=$2",[!u.is_verified, req.params.id]);
    res.json({ success:true, is_verified:!u.is_verified });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── ADMIN SETTINGS ────────────────────────────────────────────────
app.get("/api/admin/settings", adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT key,value FROM platform_settings ORDER BY key");
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.patch("/api/admin/settings/:key", adminAuth, async (req, res) => {
  try {
    await setSetting(req.params.key, req.body.value, req.user.id);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── APIFY WEBHOOK + TRIGGER ───────────────────────────────────────
app.post("/api/webhooks/apify", async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.items || [];
    if (!items.length) return res.json({ received:0 });
    const autoPublish = await getSetting("apify_auto_publish","false");
    const status = autoPublish==="true" ? "published" : "inbox";
    let saved = 0;
    for (const item of items) {
      if (!item.title || item.title.length < 10) continue;
      const { rows:ex } = await db.query("SELECT id FROM news WHERE source_url=$1",[item.url||""]);
      if (ex.length > 0) continue;
      const aiSummary = await generateSwahiliSummary(item.title, item.text||item.excerpt);
      const title = item.title.toLowerCase();
      const category = title.includes("tanzania")||title.includes("udsm") ? "Tanzania"
                     : title.includes("africa")||title.includes("kenya") ? "Africa" : "Global";
      await db.query(
        `INSERT INTO news (title,source,source_url,raw_summary,ai_summary,status,category,is_hot,scraped_at,created_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,false,NOW(),NOW())`,
        [item.title, item.domain||item.source||"Unknown", item.url||"",
         (item.text||item.excerpt||"").slice(0,800), aiSummary, status, category]
      );
      saved++;
    }
    if (saved > 0) notifyAdmin({ type:"news_inbox", message:`Habari ${saved} mpya zinasubiri review`, count:saved });
    res.json({ received:items.length, saved });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.post("/api/admin/apify/run", adminAuth, async (req, res) => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return res.status(400).json({ error:"APIFY_API_TOKEN haipo" });
  try {
    const sources = JSON.parse(await getSetting("apify_sources","{}"));
    const startUrls = [];
    if (sources.techmoran)     startUrls.push({ url:"https://techmoran.com/?s=AI" });
    if (sources.disruptafrica) startUrls.push({ url:"https://disrupt-africa.com/?s=AI" });
    if (sources.venturebeat)   startUrls.push({ url:"https://venturebeat.com/category/ai/" });
    if (sources.techcrunch)    startUrls.push({ url:"https://techcrunch.com/category/artificial-intelligence/" });
    const resp = await axios.post(
      `https://api.apify.com/v2/acts/${process.env.APIFY_ACTOR_ID||"apify/cheerio-scraper"}/runs?token=${token}`,
      { startUrls, maxPagesPerCrawl:5,
        webhooks:[{ eventTypes:["ACTOR.RUN.SUCCEEDED"], requestUrl:`${process.env.BACKEND_URL}/api/webhooks/apify` }] }
    );
    res.json({ success:true, runId:resp.data?.data?.id });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────
app.post("/api/admin/announcements", adminAuth, async (req, res) => {
  try {
    const { title, body, target="all", channels=["in-app"] } = req.body;
    const { rows:[ann] } = await db.query(
      "INSERT INTO announcements(title,body,target,channels,admin_id,sent_at,created_at) VALUES($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *",
      [title, body, target, JSON.stringify(channels), req.user.id]
    );
    let usersQ = "SELECT id,email,name FROM users WHERE status='active'";
    if (target==="Pro")   usersQ += " AND plan='pro'";
    if (target==="Basic") usersQ += " AND plan='basic'";
    if (target==="Free")  usersQ += " AND plan='free'";
    const { rows:targets } = await db.query(usersQ);
    let reach = 0;
    for (const user of targets) {
      if (channels.includes("in-app")||channels.includes("inapp")) {
        await db.query("INSERT INTO notifications(user_id,type,title,body,is_read,created_at) VALUES($1,'announcement',$2,$3,false,NOW())",[user.id,title,body]);
        notifyUser(user.id, { type:"announcement", title, body });
        reach++;
      }
    }
    if (channels.includes("email")) {
      const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#0C0C0E;padding:20px;text-align:center"><h1 style="color:#F5A623;margin:0">🌍 JamiiAI</h1></div><div style="padding:30px"><h2>${title}</h2><p style="color:#555;line-height:1.7">${body}</p><a href="${process.env.CLIENT_URL}" style="background:#F5A623;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px">Tembelea JamiiAI →</a></div></div>`;
      for (const user of targets) await sendEmail({ to:user.email, subject:title, html });
    }
    await db.query("UPDATE announcements SET reach=$1 WHERE id=$2",[reach, ann.id]);
    res.json({ success:true, reach, announcement:ann });
  } catch (err) { res.status(500).json({ error:err.message }); }
});
```

## C15 — Daily Schedulers (Cron)

```javascript
// ── CRON JOBS (mwisho wa server.js, kabla ya server.listen) ───────
// Challenges fetch — kila siku saa 9 asubuhi (06:00 EAT)
cron.schedule("0 3 * * *", async () => {
  console.log("⏰ Daily challenges fetch imeanza...");
  // Implement fetchAndSaveAllChallenges() kutoka JAMII-CHALLENGES-INTEGRATION.md
});

// News summary cleanup — delete drafts za zaidi ya siku 30
cron.schedule("0 2 * * 0", async () => {
  await db.query("DELETE FROM news WHERE status='inbox' AND created_at < NOW() - INTERVAL '30 days'");
  console.log("🧹 Old news inbox cleaned");
});
```

---

# ═══════════════════════════════════════════════════
# SEHEMU D — FRONTEND
# ═══════════════════════════════════════════════════

## D1 — lib/api.js (ongeza objects hizi zote)

```javascript
// ── Axios instance (msingi) ───────────────────────────────────────
import axios from "axios";
const BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return document.cookie.split("; ").find(r=>r.startsWith("jamii_token="))?.split("=")[1];
}

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use(cfg => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ── EXPORT zote ───────────────────────────────────────────────────
export const authAPI = {
  login:    data => api.post("/api/auth/login",   data),
  register: data => api.post("/api/auth/register",data),
  me:       ()   => api.get("/api/auth/me"),
  onboard:  data => api.patch("/api/auth/onboard",data),
};

export const postsAPI = {
  list:     (p)  => api.get("/api/posts",        { params:p }),
  create:   data => api.post("/api/posts",        data),
  delete:   id   => api.delete(`/api/posts/${id}`),
  like:     id   => api.post(`/api/posts/${id}/like`),
  bookmark: id   => api.post(`/api/posts/${id}/bookmark`),
  comments: id   => api.get(`/api/posts/${id}/comments`),
  comment:  (id,data) => api.post(`/api/posts/${id}/comments`, data),
};

export const usersAPI = {
  list:        p    => api.get("/api/users",            { params:p }),
  profile:     handle => api.get(`/api/users/${handle}`),
  follow:      id   => api.post(`/api/users/${id}/follow`),
  followers:   id   => api.get(`/api/users/${id}/followers`),
  following:   id   => api.get(`/api/users/${id}/following`),
  suggestions: ()   => api.get("/api/users/suggestions"),
};

export const notificationsAPI = {
  list:    ()  => api.get("/api/notifications"),
  read:    id  => api.patch(`/api/notifications/${id}/read`),
  readAll: ()  => api.patch("/api/notifications/read-all"),
};

export const messagesAPI = {
  conversations: ()    => api.get("/api/messages"),
  getMessages:   (id,p=1) => api.get(`/api/messages/${id}?page=${p}`),
  send:          (id,data) => api.post(`/api/messages/${id}`, data),
  delete:        id    => api.delete(`/api/messages/${id}`),
  unreadCount:   ()    => api.get("/api/messages/unread/count"),
};

export const searchAPI = {
  search:      (q,type) => api.get(`/api/search?q=${encodeURIComponent(q)}&type=${type||"all"}`),
  suggestions: q        => api.get(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
};

export const jobsAPI = {
  list:     p    => api.get("/api/jobs",           { params:p }),
  get:      id   => api.get(`/api/jobs/${id}`),
  create:   data => api.post("/api/jobs",           data),
  apply:    (id,data) => api.post(`/api/jobs/${id}/apply`, data),
  save:     id   => api.post(`/api/jobs/${id}/save`),
  saved:    ()   => api.get("/api/jobs/saved"),
  mine:     ()   => api.get("/api/jobs/my"),
};

export const uploadAPI = {
  avatar:    file => { const f=new FormData(); f.append("avatar",file);     return api.post("/api/upload/avatar",    f, { headers:{"Content-Type":"multipart/form-data"} }); },
  postImage: file => { const f=new FormData(); f.append("image",file);      return api.post("/api/upload/post-image",f, { headers:{"Content-Type":"multipart/form-data"} }); },
  cv:        file => { const f=new FormData(); f.append("cv",file);         return api.post("/api/upload/cv",        f, { headers:{"Content-Type":"multipart/form-data"} }); },
  logo:      file => { const f=new FormData(); f.append("logo",file);       return api.post("/api/upload/logo",      f, { headers:{"Content-Type":"multipart/form-data"} }); },
};

export const challengesAPI = {
  list: p => api.get("/api/challenges", { params:p }),
  register: id => api.post(`/api/challenges/${id}/register`),
};

export const resourcesAPI = {
  list:     p    => api.get("/api/resources",       { params:p }),
  submit:   data => api.post("/api/resources/submit",data),
  download: id   => api.post(`/api/resources/${id}/download`),
};

export const adminAPI = {
  stats:              ()        => api.get("/api/admin/stats"),
  users:              p         => api.get("/api/admin/users",     { params:p }),
  banUser:            id        => api.patch(`/api/admin/users/${id}/ban`),
  verifyUser:         id        => api.patch(`/api/admin/users/${id}/verify`),
  getSettings:        ()        => api.get("/api/admin/settings"),
  saveSetting:        (k,v)     => api.patch(`/api/admin/settings/${k}`, { value:v }),
  runScraper:         ()        => api.post("/api/admin/apify/run"),
  announce:           data      => api.post("/api/admin/announcements", data),
  jobs:               s         => api.get("/api/admin/jobs",      { params:{ status:s } }),
  approveJob:         id        => api.patch(`/api/admin/jobs/${id}/approve`),
  featureJob:         id        => api.patch(`/api/admin/jobs/${id}/feature`),
  rejectJob:          id        => api.delete(`/api/admin/jobs/${id}`),
};

export default api;
```

## D2 — components/SearchBar.jsx

```
Tumia code kamili kutoka: JAMII-SEARCH-DM.md → Sehemu S3
(SearchBar component na suggestions dropdown)
```

## D3 — components/ImageUpload.jsx

```
Tumia code kamili kutoka: JAMII-CLOUDINARY-UPLOADS.md → Hatua 4
(ImageUpload component na progress bar)
```

## D4 — components/FollowButton.jsx

```javascript
// components/FollowButton.jsx
import { useState } from "react";
import { usersAPI } from "../lib/api";

export default function FollowButton({ userId, initialFollowing=false, onToggle }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading,   setLoading]   = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const { data } = await usersAPI.follow(userId);
      setFollowing(data.following);
      onToggle?.(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <button onClick={toggle} disabled={loading} style={{
      padding:"6px 16px", borderRadius:20, border:"none", cursor:loading?"default":"pointer",
      background: following ? "transparent" : "linear-gradient(135deg,#F5A623,#e8961a)",
      color: following ? "rgba(242,242,245,0.5)" : "#000",
      border: following ? "1px solid #2a2a2c" : "none",
      fontWeight:700, fontSize:12, fontFamily:"DM Sans, sans-serif",
      transition:"all 0.2s", opacity:loading?0.6:1,
    }}>
      {loading ? "..." : following ? "Unafuata" : "+ Fuata"}
    </button>
  );
}
```

## D5 — pages/search.jsx (SearchResultsPage)

```
Tumia code kamili kutoka: JAMII-SEARCH-DM.md → Sehemu S4
```

## D6 — pages/mazungumzo.jsx (Direct Messages)

```
Tumia code kamili kutoka: JAMII-SEARCH-DM.md → Sehemu DM5
```

## D7 — Community App — Sidebar updates

```javascript
// Ongeza kwenye NAV_ITEMS (community app):
{ id:"kazi",    icon:"💼", label:"Kazi",         badge:null },
{ id:"search",  icon:"🔍", label:"Tafuta",        badge:null },

// Ongeza SearchBar kwenye Navbar (kila ukurasa unaonekana):
import SearchBar from "../components/SearchBar";
// Ndani ya header:
<SearchBar onNavigate={(page, params) => { setActiveNav(page); setNavParams(params); }} />

// Ongeza kwenye render switch:
{activeNav === "kazi"      && <KaziPage />}
{activeNav === "search"    && <SearchResultsPage query={navParams?.q} onNavigate={...} />}
{activeNav === "ujumbe"    && <MazungumzoPage socket={socket} currentUser={user} />}
```

## D8 — Notifications Bell (ongeza kwenye Navbar)

```javascript
// Kwenye community app Navbar — ongeza bell icon
import { useState, useEffect } from "react";
import { notificationsAPI } from "../lib/api";

function NotificationBell({ socket }) {
  const [notifs,  setNotifs]  = useState([]);
  const [open,    setOpen]    = useState(false);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    notificationsAPI.list().then(r => setNotifs(r.data.notifications || []));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("notification", n => setNotifs(p => [n, ...p]));
    return () => socket.off("notification");
  }, [socket]);

  const markAllRead = async () => {
    await notificationsAPI.readAll();
    setNotifs(p => p.map(n => ({ ...n, is_read:true })));
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", padding:6 }}>
        <span style={{ fontSize:18 }}>🔔</span>
        {unread > 0 && (
          <span style={{ position:"absolute", top:0, right:0, background:"#F5A623", color:"#000", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900 }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:320, background:"#161618", border:"1px solid #232325", borderRadius:14, zIndex:999, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid #1e1e20", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#F2F2F5" }}>🔔 Arifa</span>
            {unread > 0 && <button onClick={markAllRead} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#F5A623", fontWeight:700 }}>Soma zote</button>}
          </div>
          <div style={{ maxHeight:360, overflowY:"auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding:"30px", textAlign:"center", color:"rgba(242,242,245,0.2)", fontSize:13 }}>Hakuna arifa mpya</div>
            ) : notifs.slice(0,15).map((n,i) => (
              <div key={n.id||i} style={{ padding:"12px 16px", borderBottom:"1px solid #1a1a1c", background:n.is_read?"transparent":"rgba(245,166,35,0.04)", cursor:"pointer" }}
                onClick={() => { notificationsAPI.read(n.id); setNotifs(p => p.map(x => x.id===n.id ? {...x, is_read:true} : x)); }}
              >
                <div style={{ fontSize:13, fontWeight:n.is_read?400:700, color:n.is_read?"rgba(242,242,245,0.6)":"#F2F2F5" }}>{n.title}</div>
                {n.body && <div style={{ fontSize:11, color:"rgba(242,242,245,0.35)", marginTop:3 }}>{n.body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## D9 — Admin Panel Updates

```javascript
// jamii-ai-admin.jsx — mabadiliko 4:

// 1. Ongeza JOBS_INBOX na JOBS_ACTIVE data (kutoka JAMII-ADMIN-KAZI-SECTION.md → Badiliko 1)

// 2. Ongeza KaziAdminPage() function (kutoka JAMII-ADMIN-KAZI-SECTION.md → Badiliko 2)

// 3. Badilisha NAV array:
//    Ongeza: { id:"kazi", icon:"💼", label:"Kazi", badge:"3" }
//    Weka kati ya "rasilimali" na "habari"

// 4. Badilisha PAGES na PAGE_TITLE:
//    kazi: <KaziAdminPage />
//    "kazi":"Kazi Board 💼"

// 5. Admin Settings page — ongeza load/save via API:
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
    headers:{ Authorization:`Bearer ${getToken()}` }
  }).then(r=>r.json()).then(data => {
    // Weka values kwenye state kama ilivyoelezwa JAMII-GEMINI-INTEGRATIONS.md → Hatua 3
  });
}, []);
```

---

# ═══════════════════════════════════════════════════
# SEHEMU E — ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════

## E1 — Railway (Backend) — Variables zote

```bash
# ── LAZIMA (app haitafanya kazi bila hizi) ──
DATABASE_URL          = [auto kutoka Railway PostgreSQL plugin]
JWT_SECRET            = 1d2048f863621eea68b5834b75b63227b7804f918064f997d77c4766006a3d8852aeef13169ccd257443d1c0af6c4bbe619dd46756db669a5fc62a794be755fd
PORT                  = 4000
NODE_ENV              = production

# ── URLS ──
CLIENT_URL            = https://jamii.ai
ADMIN_URL             = https://admin.jamii.ai
BACKEND_URL           = https://jamii-ai-backend.up.railway.app

# ── ANTHROPIC ──
ANTHROPIC_API_KEY     = sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx

# ── APIFY ──
APIFY_API_TOKEN       = apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
APIFY_ACTOR_ID        = apify~cheerio-scraper

# ── CLOUDINARY ──
CLOUDINARY_CLOUD_NAME = jina_lako
CLOUDINARY_API_KEY    = xxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_API_SECRET = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── EMAIL ──
SMTP_PASSWORD         = xxxx_xxxx_xxxx_xxxx   # Gmail App Password

# ── CHALLENGES ──
KAGGLE_USERNAME       = username_yako_kaggle
KAGGLE_API_KEY        = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AICROWD_API_KEY       = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── BILLING (baadaye) ──
STRIPE_SECRET_KEY     = sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## E2 — Vercel Community App (.env.local)

```bash
NEXT_PUBLIC_API_URL              = https://jamii-ai-backend.up.railway.app
NEXT_PUBLIC_SOCKET_URL           = https://jamii-ai-backend.up.railway.app
NEXT_PUBLIC_APP_NAME             = JamiiAI
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME= jina_lako
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = jamii_uploads
```

## E3 — Vercel Admin App (.env.local)

```bash
NEXT_PUBLIC_API_URL   = https://jamii-ai-backend.up.railway.app
NEXT_PUBLIC_SOCKET_URL= https://jamii-ai-backend.up.railway.app
NEXT_PUBLIC_IS_ADMIN  = true
```

---

# ═══════════════════════════════════════════════════
# SEHEMU F — DEPLOY CHECKLIST
# Fanya kwa mpangilio huu ukideploy
# ═══════════════════════════════════════════════════

```
HATUA 1 — Railway Setup:
  ☐ Unda project mpya Railway
  ☐ Ongeza PostgreSQL plugin → DATABASE_URL inajaza auto
  ☐ Connect GitHub repo (backend)
  ☐ Weka ENV variables zote (Sehemu E1)
  ☐ Run schema.sql (Railway → PostgreSQL → Query)

HATUA 2 — Cloudinary Setup:
  ☐ cloudinary.com → Sign Up
  ☐ Settings → Upload → Add Preset → "jamii_uploads" (Unsigned)
  ☐ Copy Cloud Name, API Key, API Secret → Railway vars

HATUA 3 — Backend Deploy:
  ☐ npm install (ongeza packages mpya)
  ☐ server.js — badilisha app.listen → server.listen
  ☐ Push to GitHub → Railway itadeploy auto
  ☐ Test: GET https://your-backend.railway.app/api/health

HATUA 4 — Apify Setup:
  ☐ console.apify.com → Sign Up
  ☐ Actors → Search "cheerio-scraper" → Use Actor
  ☐ Copy Actor ID → APIFY_ACTOR_ID env var
  ☐ Schedules → Add Schedule → Cron: 0 */6 * * * → Connect Actor
  ☐ Webhook URL: https://your-backend.railway.app/api/webhooks/apify

HATUA 5 — Vercel Deploy:
  ☐ vercel.com → Import community app repo → Add env vars (E2)
  ☐ vercel.com → Import admin app repo → Add env vars (E3)
  ☐ Custom domain: jamii.ai → community, admin.jamii.ai → admin

HATUA 6 — DNS:
  ☐ Domain registrar → CNAME: @ → cname.vercel-dns.com (community)
  ☐ Domain registrar → CNAME: admin → cname.vercel-dns.com (admin)

HATUA 7 — Admin Account:
  ☐ Register account kwenye jamii.ai
  ☐ DB query: INSERT INTO user_roles SELECT id, 1, id FROM users WHERE email='admin@jamii.ai';
  ☐ Login kwenye admin.jamii.ai na credentials hizo

HATUA 8 — Test kila kitu:
  ☐ Register + Login
  ☐ Post kwenye feed
  ☐ Follow mtu
  ☐ Tuma DM
  ☐ Search
  ☐ Upload avatar (Cloudinary)
  ☐ Admin: approve kazi
  ☐ Admin: publish habari
  ☐ Admin: tuma announcement

HATUA 9 — Apify test:
  ☐ Admin panel → Settings → Apify → "Scrape Sasa"
  ☐ Admin panel → Habari → Inbox (unapaswa kuona habari)
  ☐ Approve habari moja → inaonekana community
```

---

# ═══════════════════════════════════════════════════
# MUHTASARI WA FAILI ZOTE ZINAZOTUMIKA
# ═══════════════════════════════════════════════════

```
Kila feature ina guide yake — rejelea hapa:

JAMII-CONNECTION-GUIDE.md        → Architecture + Admin routes
JAMII-GEMINI-INTEGRATIONS.md     → Apify + Claude + SMTP + Settings
JAMII-FOLLOW-FEATURE.md          → Follow system + Feed filtering
JAMII-CHALLENGES-INTEGRATION.md  → Kaggle + AIcrowd + Zindi + Devpost
JAMII-KAZI-BOARD.md              → Job board complete guide
JAMII-CLOUDINARY-UPLOADS.md      → Image uploads (avatar, posts, CV, logo)
JAMII-SEARCH-DM.md               → Search (unified) + Direct Messages
JAMII-ADMIN-KAZI-SECTION.md      → Admin Kazi section (4 changes only)
```

---

## SEHEMU G — CHALLENGES (CHANGAMOTO)
Sehemu hii inasimamiwa kwa njia mbili: **Auto-fetch** na **Manual Entry**.

### 1. Automation (Auto-fetch)
Mfumo unachukua changamoto mpya automaticamente kutoka Kaggle na AIcrowd.
- **Vyanzo:** Kaggle (API v1), AIcrowd (v1).
- **Usajili:** Kila siku saa 9 asubuhi (Cron: `0 3 * * *`).
- **Trigger:** Admin anaweza kubonyeza "Fetch Vyanzo" wakati wowote upande wa Admin Panel.
- **Config:** Hakikisha `.env` ina:
  - `KAGGLE_USERNAME`
  - `KAGGLE_KEY`
  - `AICROWD_API_KEY`

### 2. Manual Management
- Admin anaweza kuongeza changamoto za ndani (JamiiAI) au vyanzo vingine ambavyo havina API.
- **Fields:** Title, Org, Prize (Tuzo), Deadline, Region (Global/Africa/Tanzania), Source URL.
- **Status:** `open` (inaonekana kwa community), `judging`, `completed`, `closed`.

### 3. Community View
- Kadi za changamoto zinaonyesha nembo ya chanzo (Kaggle/Zindi/JamiiAI).
- Kitufe cha **Apply** kinabadilika kulingana na chanzo:
  - Kama ni chanzo cha nje (Kaggle), kinampeleka mtumiaji moja kwa moja kwenye link ya nje.
  - Kama ni cha ndani, kinatayarisha usajili wa ndani.

---

**JamiiAI — Inafanya kazi sasa hivi. Endelea na sehemu inayofuata.**
