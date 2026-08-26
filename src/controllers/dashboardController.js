const asyncHandler = require("../utils/asyncHandler");
const dashboardModel = require("../models/dashboardModel");
const { parseDashboardLimit } = require("../utils/dashboardService");

// Mongo ids are ObjectId strings, so these comparisons are string-based.
// Numeric coercion would turn every id into NaN and silently hide all events.
function sameId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

function visibleActivity(user, events) {
  if (user.role === "student") {
    return events.filter((event) => sameId(event.subjectUserId, user.id));
  }

  if (user.role === "partner") {
    return events.filter(
      (event) =>
        sameId(event.actorUserId, user.id) &&
        (event.subjectUserId == null || sameId(event.subjectUserId, user.id))
    );
  }

  return events;
}

const overview = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await dashboardModel.getOverview(req.user),
  });
});

const notifications = asyncHandler(async (req, res) => {
  const limit = parseDashboardLimit(req.query.limit);
  res.json({
    success: true,
    data: await dashboardModel.getNotifications(req.user, limit),
  });
});

const activity = asyncHandler(async (req, res) => {
  const limit = parseDashboardLimit(req.query.limit);
  res.json({
    success: true,
    data: visibleActivity(req.user, await dashboardModel.getActivity(req.user, limit)),
  });
});

const status = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: await dashboardModel.getPlatformStatus(),
  });
});

module.exports = { overview, notifications, activity, status, visibleActivity };
