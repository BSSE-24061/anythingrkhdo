const db = require("./src/config/db");

async function run() {
  try {
    await db.query("ALTER TABLE medications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved'");
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
