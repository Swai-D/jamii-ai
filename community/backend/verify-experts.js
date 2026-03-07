const { Pool } = require("pg");
require("dotenv").config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:davyswai1995@localhost:5432/jamii_ai'
});

async function verifyUsers() {
  try {
    // Verify test_user and 3 more random users
    await db.query("UPDATE users SET is_verified = true WHERE handle = 'test_user' OR id IN (SELECT id FROM users WHERE onboarded = true LIMIT 3)");
    console.log("✅ Baadhi ya watumiaji wamepewa verification badge!");
  } catch (err) {
    console.error("❌ Makosa:", err);
  } finally {
    await db.end();
  }
}

verifyUsers();
