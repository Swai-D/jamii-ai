const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:davyswai1995@localhost:5432/jamii_ai'
});

async function seedAdmin() {
  console.log("🚀 Seeding Admin User...");
  
  try {
    const email = "admin@jamii.ai.com";
    const password = "davyswai@jamii.ai.2026";
    const handle = "admin";
    const name = "JamiiAI Admin";
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // 1. Ensure super_admin role exists
    const roleCheck = await db.query("SELECT id FROM roles WHERE name = 'super_admin'");
    let roleId;
    if (roleCheck.rows.length === 0) {
      const newRole = await db.query(
        "INSERT INTO roles (name, permissions, color) VALUES ($1, $2, $3) RETURNING id",
        ['super_admin', JSON.stringify(['all']), '#F5A623']
      );
      roleId = newRole.rows[0].id;
      console.log("✅ Created super_admin role");
    } else {
      roleId = roleCheck.rows[0].id;
    }

    // 2. Check if admin user already exists
    const userCheck = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    let userId;
    
    if (userCheck.rows.length === 0) {
      userId = uuid();
      await db.query(
        `INSERT INTO users (id, name, email, password_hash, handle, role, city, bio, onboarded, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())`,
        [userId, name, email, passwordHash, handle, "Super Admin", "Dar es Salaam", "Msimamizi mkuu wa JamiiAI."]
      );
      console.log("✅ Created admin user");
    } else {
      userId = userCheck.rows[0].id;
      // Update password just in case
      await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
      console.log("✅ Admin user already exists, updated password");
    }

    // 3. Assign super_admin role to user
    await db.query(
      "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
      [userId, roleId]
    );
    console.log("✅ Assigned super_admin role to admin user");

    console.log("\n✨ Admin seeding complete!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
  } finally {
    await db.end();
  }
}

seedAdmin();
