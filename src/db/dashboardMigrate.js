/**
 * Applies the dashboard tables after the base users schema has been created.
 * The statements are intentionally idempotent so the command is safe to rerun.
 */
const mysql = require("mysql2/promise");
const env = require("../config/env");

const DASHBOARD_SCHEMA = `
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT UNSIGNED NOT NULL,
  subject_user_id INT UNSIGNED NULL,
  event_type VARCHAR(120) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_actor_created (actor_user_id, created_at),
  INDEX idx_activity_subject_created (subject_user_id, created_at),
  INDEX idx_activity_type_created (event_type, created_at),
  CONSTRAINT fk_activity_actor_user FOREIGN KEY (actor_user_id) REFERENCES users(id),
  CONSTRAINT fk_activity_subject_user FOREIGN KEY (subject_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_results (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  english_level VARCHAR(60) NULL,
  career_readiness_score DECIMAL(5,2) NULL,
  strengths JSON NULL,
  improvement_areas JSON NULL,
  recommended_academies JSON NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assessment_results_user_completed (user_id, completed_at),
  CONSTRAINT fk_assessment_results_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function migrateDashboard() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    await connection.query(DASHBOARD_SCHEMA);
    console.log(`Dashboard schema applied to database "${env.db.database}".`);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrateDashboard().catch((error) => {
    console.error("Dashboard migration failed:", error.message);
    process.exit(1);
  });
}

module.exports = { DASHBOARD_SCHEMA, migrateDashboard };
