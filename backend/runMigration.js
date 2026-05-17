const pg = require("pg");
const fs = require("fs");
require("dotenv").config();

const client = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    await client.connect();
    console.log("Running migration 002_add_doctor_availability.sql...");

    const sql = fs.readFileSync("./migrations/002_add_doctor_availability.sql", "utf8");
    await client.query(sql);

    console.log("Migration completed successfully.");

    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name='doctor_availability'"
    );

    if (result.rows.length > 0) {
      console.log("Table doctor_availability verified.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
