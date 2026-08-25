/**
 * Applies the contact-message table used by the public "Contact Us" form.
 * The statements are intentionally idempotent so the command is safe to rerun.
 */
const mysql = require("mysql2/promise");
const env = require("../config/env");

const CONTACT_SCHEMA = `
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  organization VARCHAR(160) NULL,
  inquiry_type ENUM('student','employer','university','school','government','partner','other')
               NOT NULL DEFAULT 'other',
  subject VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  status ENUM('new','read','archived') NOT NULL DEFAULT 'new',
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_status_created (status, created_at),
  INDEX idx_contact_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function migrateContact() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    await connection.query(CONTACT_SCHEMA);
    console.log(`Contact schema applied to database "${env.db.database}".`);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrateContact().catch((error) => {
    console.error("Contact migration failed:", error.message);
    process.exit(1);
  });
}

module.exports = { CONTACT_SCHEMA, migrateContact };
