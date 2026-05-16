const { Pool } = require("pg");
require("dotenv").config();

// Create a new connection pool using the details from your .env file
const pool = new Pool({
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error acquiring client", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database!");
  }
  if (client) release();
});

module.exports = pool;
