/**
 * Creates the `skillbridge` database if it is missing, then applies schema.sql.
 * Safe to run repeatedly — every statement is CREATE ... IF NOT EXISTS.
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const env = require("../config/env");
const { migrateDashboard } = require("./dashboardMigrate");
const { migrateContact } = require("./contactMigrate");

async function migrate() {
  // Connect without a database first so we can create it if needed.
  const root = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` ` +
      `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await root.changeUser({ database: env.db.database });

  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await root.query(sql);

  // `CREATE TABLE IF NOT EXISTS` does not update existing ENUM columns. Keep
  // this explicit, idempotent migration next to the bootstrap schema.
  await root.query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('student','professional','employer','institution','admin','instructor','administrator','partner','super_admin') NOT NULL DEFAULT 'student'"
  );
  await root.query("UPDATE users SET role = 'administrator' WHERE role = 'admin'");
  await root.query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('student','instructor','employer','administrator','partner','super_admin') NOT NULL DEFAULT 'student'"
  );
  await root.end();

  // Keep the base and dashboard schemas together for fresh installations.
  // This function call avoids platform-specific shell sequencing.
  await migrateDashboard();
  await migrateContact();

  console.log(`✔ Schema applied to database "${env.db.database}".`);
}

migrate().catch((error) => {
  console.error("✖ Migration failed:", error.message);
  process.exit(1);
});
