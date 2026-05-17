const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  try {
    await client.connect();
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (!files.length) {
      console.log('ℹ️ No migration files found.');
      return;
    }

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`📝 Running migration ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ Applied ${file}`);
    }

    console.log('✅ All migrations applied successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
