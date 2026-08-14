const mysql = require("mysql2/promise");
const env = require("./env");

// Single shared pool for the whole process.
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: false,
});

// Called at boot so a bad DB config fails loudly instead of on the first request.
async function assertConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = { pool, assertConnection };
