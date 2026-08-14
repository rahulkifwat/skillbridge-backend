const { pool } = require("../config/db");

// Columns safe to send to the client — password_hash is never in this list.
const PUBLIC_COLUMNS =
  "id, full_name, email, role, persona, avatar_url, is_active, last_login_at, created_at";

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ fullName, email, passwordHash, role = "student", persona = null }) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, persona)
     VALUES (?, ?, ?, ?, ?)`,
    [fullName, email, passwordHash, role, persona]
  );
  return findById(result.insertId);
}

async function touchLastLogin(id) {
  await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [id]);
}

// Strips password_hash and reshapes to the camelCase the frontend expects.
function toPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    persona: row.persona,
    avatarUrl: row.avatar_url,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

module.exports = { findByEmail, findById, create, touchLastLogin, toPublic };
