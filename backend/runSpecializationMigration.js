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

async function runSpecializationMigration() {
  try {
    await client.connect();
    const sql = fs.readFileSync("./migrations/005_add_medical_specializations.sql", "utf8");
    await client.query(sql);
    console.log("Medical specializations migration completed successfully.");
  } catch (error) {
    console.error("Medical specializations migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSpecializationMigration();
