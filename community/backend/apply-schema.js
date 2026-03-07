const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:davyswai1995@localhost:5432/jamii_ai'
});

async function applySchema() {
  console.log("🚀 Applying schema to database...");
  
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    
    // Split by semicolon, but be careful with functions/triggers
    // This is a simplified split; for complex schemas, it might need more logic
    // But JamiiAI schema is mostly standard CREATE TABLE
    
    // Better way: run the whole block
    await db.query(schemaSql);
    
    console.log("✅ Schema applied successfully!");
  } catch (err) {
    console.error("❌ Error applying schema:", err.message);
    if (err.hint) console.log("Hint:", err.hint);
  } finally {
    await db.end();
  }
}

applySchema();
