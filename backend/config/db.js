const { Pool } = require("pg");

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,

  // Performance settings
  max:              20,   // max connections in pool
  min:              4,    // keep 4 connections always alive
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("✅ DB connected");
});

module.exports = pool;