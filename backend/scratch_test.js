const { Pool } = require("pg");
require("dotenv").config();

console.log("DB_PASSWORD in env:", typeof process.env.DB_PASSWORD, JSON.stringify(process.env.DB_PASSWORD));

const pool = new Pool({
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

console.log("Pool password option:", typeof pool.options.password, JSON.stringify(pool.options.password));

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting:", err);
  } else {
    console.log("Connected successfully!");
  }
  if (client) release();
  pool.end();
});
