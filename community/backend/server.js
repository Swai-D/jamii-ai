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
require("dotenv").config();

// ── APP SETUP ───────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// ── DATABASE ────────────────────────────────────────────────────────
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

db.connect()
  .then(async () => {
    console.log("✅ Database imeunganishwa");
    // Auto-migration: Hakikisha column za reset password zipo
    try {
      await db.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
      `);
      console.log("✅ Database migration imekamilika");
    } catch (err) {
      console.error("❌ Migration error:", err.message);
    }
  })
  .catch(err => console.error("❌ DB error:", err.message));

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
    console.error(err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email?.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Barua pepe au nywila si sahihi" });

    const { password_hash, ...safe } = user;
    res.json({ token: signToken(user), user: safe });
  } catch (err) {
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
      `SELECT u.*, 
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    const { password_hash, ...user } = result.rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
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
    res.status(500).json({ error: "Hitilafu ya server" });
  }
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

// GET /api/users/:handle
app.get("/api/users/:handle", optionalAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.handle, u.avatar_url, u.role, u.city, u.bio,
              u.skills, u.interests, u.hourly_rate, u.available, u.rating,
              u.project_count, u.github_url, u.linkedin_url, u.website_url,
              u.created_at, u.is_verified,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
       FROM users u WHERE u.handle = $1`,
      [req.params.handle]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Mtumiaji hapatikani" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/users/:id/follow
app.post("/api/users/:id/follow", auth, async (req, res) => {
  try {
    const { id: followingId } = req.params;
    if (followingId === req.user.id) return res.status(400).json({ error: "Huwezi kufuata wewe mwenyewe" });

    const exists = await db.query(
      "SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2", [req.user.id, followingId]
    );
    if (exists.rows.length) {
      await db.query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2", [req.user.id, followingId]);
      return res.json({ following: false });
    }
    await db.query(
      "INSERT INTO follows (id, follower_id, following_id, created_at) VALUES ($1,$2,$3,NOW())",
      [uuid(), req.user.id, followingId]
    );
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// ════════════════════════════════════════════════════════════════════
//  POST ROUTES (Feed)
// ════════════════════════════════════════════════════════════════════

// GET /api/posts
app.get("/api/posts", optionalAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let queryParams = [limit, offset];
    let whereClause = "";
    
    if (category && category !== "all") {
      whereClause = `WHERE p.category = $3`;
      queryParams.push(category);
    }

    const userId = req.user?.id || null;

    const sql = `
      SELECT p.*, u.name AS author_name, u.handle AS author_handle,
              u.avatar_url, u.role AS author_role, u.city AS author_city,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
              (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id) AS bookmark_count,
              CASE WHEN $1::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) THEN true ELSE false END AS user_liked,
              CASE WHEN $1::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) THEN true ELSE false END AS user_bookmarked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`;

    // Note: Parameter mapping changed to $1=limit, $2=offset, $3=category
    // But logic above needs careful adjustment for the $1::uuid (userId)
    
    const finalSql = `
      SELECT p.*, u.name AS author_name, u.handle AS author_handle,
              u.avatar_url, u.role AS author_role, u.city AS author_city, u.is_verified,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
              (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id) AS bookmark_count,
              EXISTS (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) AS user_liked,
              EXISTS (SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $1) AS user_bookmarked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ${category && category !== "all" ? "WHERE p.category = $4" : ""}
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`;

    const result = await db.query(finalSql, [userId, limit, offset, ...(category && category !== "all" ? [category] : [])]);
    res.json({ posts: result.rows, page: +page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Hitilafu ya server" });
  }
});

// POST /api/posts
app.post("/api/posts", auth, async (req, res) => {
  try {
    const { content, category = "swali" } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Maudhui yanaitajika" });

    const result = await db.query(
      `INSERT INTO posts (id, user_id, content, category, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [uuid(), req.user.id, content.trim(), category]
    );
    res.status(201).json(result.rows[0]);
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

// ════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════════════════════

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", app: "JamiiAI", time: new Date().toISOString() })
);

app.use((_, res) => res.status(404).json({ error: "Route haipatikani" }));

app.listen(PORT, () => console.log(`🚀 JamiiAI Server inafanya kazi: http://localhost:${PORT}`));

module.exports = app;
