const { pool } = require("../config/db");

const ADMINISTRATIVE_ROLES = new Set(["administrator", "super_admin"]);
const MAX_LIMIT = 100;

function normaliseLimit(limit, fallback = 20) {
  const parsed = typeof limit === "string" && limit.trim() === "" ? Number.NaN : Number(limit);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_LIMIT);
}

function numeric(value) {
  return Number(value || 0);
}

async function firstRow(database, sql, params = []) {
  const [rows] = await database.query(sql, params);
  return rows[0] || {};
}

function createDashboardModel(database = pool) {
  async function getUnreadNotifications(userId) {
    const row = await firstRow(
      database,
      `SELECT COUNT(*) AS unreadNotifications
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return numeric(row.unreadNotifications);
  }

  async function getOverview(user) {
    const userId = user.id;
    const unreadNotifications = await getUnreadNotifications(userId);

    if (user.role === "student") {
      const row = await firstRow(
        database,
        `SELECT COUNT(*) AS completedAssessments,
                COALESCE((
                  SELECT career_readiness_score
                  FROM assessment_results
                  WHERE user_id = ?
                  ORDER BY completed_at DESC, id DESC
                  LIMIT 1
                ), 0) AS latestCareerReadinessScore
         FROM assessment_results
         WHERE user_id = ?`,
        [userId, userId]
      );
      return {
        role: user.role,
        metrics: [
          { key: "assessmentsCompleted", value: numeric(row.completedAssessments) },
          { key: "careerReadinessScore", value: numeric(row.latestCareerReadinessScore) },
          { key: "unreadNotifications", value: unreadNotifications },
        ],
      };
    }

    if (user.role === "instructor") {
      const row = await firstRow(
        database,
        `SELECT COUNT(*) AS recentActivityEvents
         FROM activity_events
         WHERE actor_user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      );
      return {
        role: user.role,
        metrics: [
          { key: "recentActivityEvents", value: numeric(row.recentActivityEvents) },
          { key: "unreadNotifications", value: unreadNotifications },
        ],
      };
    }

    if (user.role === "employer") {
      const row = await firstRow(
        database,
        `SELECT COUNT(*) AS recentActivityEvents
         FROM activity_events
         WHERE actor_user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      );
      return {
        role: user.role,
        metrics: [
          { key: "recentActivityEvents", value: numeric(row.recentActivityEvents) },
          { key: "unreadNotifications", value: unreadNotifications },
        ],
      };
    }

    if (user.role === "partner") {
      const row = await firstRow(
        database,
        `SELECT COUNT(*) AS recentActivityEvents
         FROM activity_events
         WHERE actor_user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      );
      return {
        role: user.role,
        metrics: [
          { key: "recentActivityEvents", value: numeric(row.recentActivityEvents) },
          { key: "unreadNotifications", value: unreadNotifications },
        ],
      };
    }

    if (ADMINISTRATIVE_ROLES.has(user.role)) {
      const status = await getPlatformStatus();
      return {
        role: user.role,
        metrics: [
          { key: "totalUsers", value: status.totalUsers },
          { key: "activeUsers", value: status.activeUsers },
          { key: "eventsLast24Hours", value: status.eventsLast24Hours },
          { key: "unreadNotifications", value: unreadNotifications },
        ],
      };
    }

    return {
      role: user.role,
      metrics: [{ key: "unreadNotifications", value: unreadNotifications }],
    };
  }

  async function getNotifications(user, limit) {
    const safeLimit = normaliseLimit(limit);
    const [rows] = await database.query(
      `SELECT id, title, body, is_read AS isRead, created_at AS createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [user.id, safeLimit]
    );
    return rows;
  }

  async function getActivity(user, limit) {
    const safeLimit = normaliseLimit(limit);
    const isAdministrative = ADMINISTRATIVE_ROLES.has(user.role);
    const query = isAdministrative
      ? `SELECT id, actor_user_id AS actorUserId, subject_user_id AS subjectUserId,
                event_type AS eventType, metadata, created_at AS createdAt
         FROM activity_events
         ORDER BY created_at DESC, id DESC
         LIMIT ?`
      : `SELECT id, actor_user_id AS actorUserId, subject_user_id AS subjectUserId,
                event_type AS eventType, metadata, created_at AS createdAt
         FROM activity_events
         WHERE actor_user_id = ? OR subject_user_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT ?`;
    const params = isAdministrative ? [safeLimit] : [user.id, user.id, safeLimit];
    const [rows] = await database.query(query, params);
    return rows;
  }

  async function getPlatformStatus() {
    const row = await firstRow(
      database,
      `SELECT
         COUNT(*) AS totalUsers,
         COALESCE(SUM(is_active = 1), 0) AS activeUsers,
         (SELECT COUNT(*) FROM activity_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) AS eventsLast24Hours
       FROM users`
    );
    return {
      totalUsers: numeric(row.totalUsers),
      activeUsers: numeric(row.activeUsers),
      eventsLast24Hours: numeric(row.eventsLast24Hours),
    };
  }

  return { getOverview, getNotifications, getActivity, getPlatformStatus };
}

module.exports = { createDashboardModel, ...createDashboardModel() };
