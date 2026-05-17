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
    const migrationFiles = [
      "005_add_medical_specializations.sql",
      "006_add_medication_dose_timings.sql",
    ];

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(`./migrations/${file}`, "utf8");
      await client.query(sql);
      console.log(`${file} completed successfully.`);
    }
  } catch (error) {
    console.error("Medical migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSpecializationMigration();
