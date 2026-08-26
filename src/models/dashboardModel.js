const { User, Notification, ActivityEvent, AssessmentResult } = require("./schemas");

const ADMINISTRATIVE_ROLES = new Set(["administrator", "super_admin"]);
const MAX_LIMIT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

function normaliseLimit(limit, fallback = 20) {
  const parsed = typeof limit === "string" && limit.trim() === "" ? Number.NaN : Number(limit);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_LIMIT);
}

function numeric(value) {
  return Number(value || 0);
}

// ObjectIds must not reach the API surface — the controller compares ids and
// the client stores them as strings.
function idString(value) {
  return value == null ? null : String(value);
}

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS);
}

/**
 * Collections are injected so the unit tests can drive the query logic
 * without a live MongoDB.
 */
function createDashboardModel(collections = {}) {
  const users = collections.User || User;
  const notifications = collections.Notification || Notification;
  const activityEvents = collections.ActivityEvent || ActivityEvent;
  const assessmentResults = collections.AssessmentResult || AssessmentResult;

  async function getUnreadNotifications(userId) {
    return numeric(await notifications.countDocuments({ userId, isRead: false }));
  }

  async function countRecentActorEvents(userId) {
    return numeric(
      await activityEvents.countDocuments({
        actorUserId: userId,
        createdAt: { $gte: daysAgo(7) },
      })
    );
  }

  async function getOverview(user) {
    const userId = user.id;
    const unreadNotifications = await getUnreadNotifications(userId);

    if (user.role === "student") {
      const [completedAssessments, latest] = await Promise.all([
        assessmentResults.countDocuments({ userId }),
        assessmentResults
          .findOne({ userId })
          .sort({ completedAt: -1, _id: -1 })
          .select("careerReadinessScore")
          .lean(),
      ]);

      return {
        role: user.role,
        metrics: [
          { key: "assessmentsCompleted", value: numeric(completedAssessments) },
          { key: "careerReadinessScore", value: numeric(latest?.careerReadinessScore) },
          { key: "unreadNotifications", value: unreadNotifications },
        ],
      };
    }

    if (user.role === "instructor" || user.role === "employer" || user.role === "partner") {
      return {
        role: user.role,
        metrics: [
          { key: "recentActivityEvents", value: await countRecentActorEvents(userId) },
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
    const rows = await notifications
      .find({ userId: user.id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(normaliseLimit(limit))
      .lean();

    return rows.map((row) => ({
      id: idString(row._id),
      title: row.title,
      body: row.body,
      isRead: Boolean(row.isRead),
      createdAt: row.createdAt,
    }));
  }

  async function getActivity(user, limit) {
    // Administrators see the whole platform; everyone else sees only events
    // they took part in.
    const filter = ADMINISTRATIVE_ROLES.has(user.role)
      ? {}
      : { $or: [{ actorUserId: user.id }, { subjectUserId: user.id }] };

    const rows = await activityEvents
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(normaliseLimit(limit))
      .lean();

    return rows.map((row) => ({
      id: idString(row._id),
      actorUserId: idString(row.actorUserId),
      subjectUserId: idString(row.subjectUserId),
      eventType: row.eventType,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt,
    }));
  }

  async function getPlatformStatus() {
    const [totalUsers, activeUsers, eventsLast24Hours] = await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ isActive: true }),
      activityEvents.countDocuments({ createdAt: { $gte: daysAgo(1) } }),
    ]);

    return {
      totalUsers: numeric(totalUsers),
      activeUsers: numeric(activeUsers),
      eventsLast24Hours: numeric(eventsLast24Hours),
    };
  }

  return { getOverview, getNotifications, getActivity, getPlatformStatus };
}

module.exports = { createDashboardModel, ...createDashboardModel() };
