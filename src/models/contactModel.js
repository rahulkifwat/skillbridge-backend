const { pool } = require("../config/db");

const PUBLIC_COLUMNS =
  "id, name, email, organization, inquiry_type, subject, message, locale, status, created_at";

async function create({
  name,
  email,
  organization = null,
  inquiryType = "other",
  subject,
  message,
  locale = "en",
  ipAddress = null,
  userAgent = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO contact_messages
       (name, email, organization, inquiry_type, subject, message, locale, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, organization, inquiryType, subject, message, locale, ipAddress, userAgent]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM contact_messages WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function list({ status = null, limit = 50, offset = 0 } = {}) {
  const where = status ? "WHERE status = ?" : "";
  const params = status ? [status] : [];
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM contact_messages ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

// How many messages this email/IP pair sent since `since` — the spam guard.
async function countRecent({ email, ipAddress, since }) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM contact_messages
     WHERE created_at >= ? AND (email = ? OR (ip_address IS NOT NULL AND ip_address = ?))`,
    [since, email, ipAddress]
  );
  return Number(rows[0]?.total || 0);
}

// Reshapes to the camelCase the frontend expects.
function toPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    organization: row.organization,
    inquiryType: row.inquiry_type,
    subject: row.subject,
    message: row.message,
    locale: row.locale,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = { create, findById, list, countRecent, toPublic };
