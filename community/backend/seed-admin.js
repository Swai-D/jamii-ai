/**
 * ═══════════════════════════════════════════════════════════════
 *  JamiiAI — seed-admin.js
 *  Inaseti Admin user mmoja (Davy Swai) pekee.
 *
 *  Matumizi:
 *    cd community/backend
 *    node seed-admin.js
 * ═══════════════════════════════════════════════════════════════
 */

const { Pool }   = require("pg");
const bcrypt     = require("bcryptjs");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const db = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false 
});

async function seedAdmin() {
  console.log("👤 Inatengeneza Admin Account...");

  const name = "Davy Swai";
  const handle = "davyswai";
  const email = "davyswai53@gmail.com";
  const password = "davyswai1995";
  const role = "System Administrator";

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await db.query(
      `INSERT INTO users (
        id, name, handle, email, password_hash,
        role, city, bio, is_verified, is_admin, onboarded, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, true, 'active')
      ON CONFLICT (handle) DO UPDATE SET
        is_admin = true,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
      RETURNING id`,
      [uuid(), name, handle, email, passwordHash, role, "Dar es Salaam", "Lead Developer & Administrator wa JamiiAI Platform."]
    );

    const userId = user.rows[0].id;

    // Assign 'super_admin' role in user_roles table
    const roleRes = await db.query("SELECT id FROM roles WHERE name = 'super_admin'");
    if (roleRes.rows.length > 0) {
      const roleId = roleRes.rows[0].id;
      await db.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, roleId]
      );
      console.log("  ✅ Role ya 'super_admin' imekabidhiwa.");
    }

    console.log(`
═══════════════════════════════════════
  ✅ SUPER ADMIN ACCOUNT TAYARI!

  Handle:   ${handle}
  Password: ${password}
  Role:     Super Administrator (Full Access)
═══════════════════════════════════════
    `);
  } catch (err) {
    console.error("❌ Imeshindwa kumtengeneza admin:", err.message);
  } finally {
    await db.end();
  }
}

seedAdmin();
