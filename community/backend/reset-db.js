const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function reset() {
  const client = await pool.connect();
  try {
    console.log('--- Kuanza kufuta database... ---');
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ Database imefutwa (Schema public imesafishwa).');

    console.log('--- Kuweka schema mpya... ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✅ Schema imewekwa vizuri.');

    console.log('--- Kuanza seeding... ---');
    // We can run seed.js logic here or just require it if it's exportable
    // But seed.js is a standalone script, so we might just run it via shell
    // or copy its logic. Let's try running it as a separate process or just 
    // importing the fake data if possible.
    // For simplicity, I'll just finish this script and then run node seed.js.
  } catch (err) {
    console.error('❌ Hitilafu wakati wa kufuta database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

reset();
