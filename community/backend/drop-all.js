const { Pool } = require("pg");
require("dotenv").config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:davyswai1995@localhost:5432/jamii_ai'
});

async function dropAll() {
  console.log("🔥 Cleaning database: dropping all tables, types and extensions...");
  
  try {
    // Drop tables with CASCADE
    await db.query(`
      DROP TABLE IF EXISTS 
        platform_settings, roles, user_roles, subscriptions, invoices, 
        announcements, jobs, job_applications, saved_jobs, posts, 
        resources, news, challenges, messages, notifications, 
        users, follows, startups, institutions, comments, 
        post_likes, bookmarks, challenge_registrations, 
        events, event_registrations CASCADE;
    `);

    // Drop types
    await db.query(`
      DROP TYPE IF EXISTS job_type, job_status, app_status, 
        post_category, challenge_status, challenge_difficulty, 
        resource_type, news_category, event_type, notif_type CASCADE;
    `);

    console.log("✅ Database cleaned successfully!");
  } catch (err) {
    console.error("❌ Error cleaning database:", err.message);
  } finally {
    await db.end();
  }
}

dropAll();
