const db = require("./src/config/db");

async function test() {
  const res = await db.query("SELECT user_id, role, full_name, email FROM users");
  console.log("Users:");
  console.log(JSON.stringify(res.rows, null, 2));
}

test().catch(console.error).finally(() => process.exit(0));
