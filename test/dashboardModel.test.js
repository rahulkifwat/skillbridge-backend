const test = require("node:test");
const assert = require("node:assert/strict");

const { createDashboardModel } = require("../src/models/dashboardModel");

/**
 * Stands in for a Mongoose model. Records every call so the tests can assert
 * on the filters and limits the dashboard model builds, and returns the
 * chainable query object that find()/findOne() produce.
 */
function createMockCollection(name, results = {}) {
  const calls = [];

  function query(kind, filter) {
    const call = { name, kind, filter };
    calls.push(call);

    const chain = {
      sort(value) {
        call.sort = value;
        return chain;
      },
      select(value) {
        call.select = value;
        return chain;
      },
      skip(value) {
        call.skip = value;
        return chain;
      },
      limit(value) {
        call.limit = value;
        return chain;
      },
      async lean() {
        const value = results[kind];
        return typeof value === "function" ? value(call) : value;
      },
    };

    return chain;
  }

  return {
    calls,
    find: (filter) => query("find", filter),
    findOne: (filter) => query("findOne", filter),
    async countDocuments(filter) {
      const call = { name, kind: "countDocuments", filter };
      calls.push(call);
      const value = results.countDocuments;
      return typeof value === "function" ? value(call) : (value ?? 0);
    },
  };
}

test("student overview reads only the student's own assessment results", async () => {
  const AssessmentResult = createMockCollection("AssessmentResult", {
    countDocuments: 2,
    findOne: { careerReadinessScore: 81 },
  });
  const Notification = createMockCollection("Notification", { countDocuments: 1 });
  const dashboardModel = createDashboardModel({ AssessmentResult, Notification });

  const result = await dashboardModel.getOverview({ id: "u-12", role: "student" });

  assert.deepEqual(result.metrics, [
    { key: "assessmentsCompleted", value: 2 },
    { key: "careerReadinessScore", value: 81 },
    { key: "unreadNotifications", value: 1 },
  ]);

  for (const call of AssessmentResult.calls) {
    assert.deepEqual(call.filter, { userId: "u-12" });
  }
  const latest = AssessmentResult.calls.find(({ kind }) => kind === "findOne");
  assert.deepEqual(latest.sort, { completedAt: -1, _id: -1 });
});

test("student overview reports zero when the student has no assessment yet", async () => {
  const AssessmentResult = createMockCollection("AssessmentResult", {
    countDocuments: 0,
    findOne: null,
  });
  const Notification = createMockCollection("Notification", { countDocuments: 0 });
  const dashboardModel = createDashboardModel({ AssessmentResult, Notification });

  const result = await dashboardModel.getOverview({ id: "u-1", role: "student" });

  assert.deepEqual(result.metrics, [
    { key: "assessmentsCompleted", value: 0 },
    { key: "careerReadinessScore", value: 0 },
    { key: "unreadNotifications", value: 0 },
  ]);
});

test("unread notification counts exclude messages already read", async () => {
  const Notification = createMockCollection("Notification", { countDocuments: 3 });
  const ActivityEvent = createMockCollection("ActivityEvent", { countDocuments: 0 });
  const dashboardModel = createDashboardModel({ Notification, ActivityEvent });

  await dashboardModel.getOverview({ id: "u-5", role: "employer" });

  const count = Notification.calls.find(({ kind }) => kind === "countDocuments");
  assert.deepEqual(count.filter, { userId: "u-5", isRead: false });
});

test("notifications scope to the requesting user and map to public fields", async () => {
  const Notification = createMockCollection("Notification", {
    countDocuments: 0,
    find: [{ _id: "n-1", title: "Assessment complete", body: "Well done", isRead: 0 }],
  });
  const dashboardModel = createDashboardModel({ Notification });

  const rows = await dashboardModel.getNotifications({ id: "u-7", role: "student" }, 5);

  assert.deepEqual(rows, [
    {
      id: "n-1",
      title: "Assessment complete",
      body: "Well done",
      isRead: false,
      createdAt: undefined,
    },
  ]);
  const call = Notification.calls[0];
  assert.deepEqual(call.filter, { userId: "u-7" });
  assert.equal(call.limit, 5);
});

test("non-administrators only see activity they took part in", async () => {
  const ActivityEvent = createMockCollection("ActivityEvent", { find: [] });
  const dashboardModel = createDashboardModel({ ActivityEvent });

  await dashboardModel.getActivity({ id: "u-12", role: "student" }, 4);
  await dashboardModel.getActivity({ id: "u-44", role: "partner" }, 4);

  assert.deepEqual(ActivityEvent.calls[0].filter, {
    $or: [{ actorUserId: "u-12" }, { subjectUserId: "u-12" }],
  });
  assert.deepEqual(ActivityEvent.calls[1].filter, {
    $or: [{ actorUserId: "u-44" }, { subjectUserId: "u-44" }],
  });
});

test("administrators retrieve global activity with a bounded limit", async () => {
  const ActivityEvent = createMockCollection("ActivityEvent", {
    find: [{ _id: "e-3", eventType: "user.created", actorUserId: "u-1", subjectUserId: null }],
  });
  const dashboardModel = createDashboardModel({ ActivityEvent });

  const activity = await dashboardModel.getActivity({ id: "u-4", role: "administrator" }, 6);

  assert.equal(activity.length, 1);
  assert.equal(activity[0].subjectUserId, null);
  assert.deepEqual(ActivityEvent.calls[0].filter, {});
  assert.equal(ActivityEvent.calls[0].limit, 6);
});

test("activity ids are returned as strings, never raw ObjectIds", async () => {
  const objectIdLike = { toString: () => "64b7f0c2e1a2b3c4d5e6f7a8" };
  const ActivityEvent = createMockCollection("ActivityEvent", {
    find: [{ _id: objectIdLike, actorUserId: objectIdLike, subjectUserId: objectIdLike }],
  });
  const dashboardModel = createDashboardModel({ ActivityEvent });

  const [event] = await dashboardModel.getActivity({ id: "u-1", role: "administrator" }, 5);

  assert.equal(typeof event.id, "string");
  assert.equal(event.actorUserId, "64b7f0c2e1a2b3c4d5e6f7a8");
  assert.equal(event.subjectUserId, "64b7f0c2e1a2b3c4d5e6f7a8");
});

test("limits normalize invalid, zero, negative, and over-limit values", async () => {
  const Notification = createMockCollection("Notification", { find: [] });
  const dashboardModel = createDashboardModel({ Notification });
  const user = { id: "u-19", role: "student" };

  await dashboardModel.getNotifications(user, "not-a-number");
  await dashboardModel.getNotifications(user, 0);
  await dashboardModel.getNotifications(user, -4);
  await dashboardModel.getNotifications(user, 101);

  assert.deepEqual(
    Notification.calls.map(({ limit }) => limit),
    [20, 20, 20, 100]
  );
});

test("platform status returns zero-valued aggregates when no records exist", async () => {
  const User = createMockCollection("User", { countDocuments: 0 });
  const ActivityEvent = createMockCollection("ActivityEvent", { countDocuments: 0 });
  const dashboardModel = createDashboardModel({ User, ActivityEvent });

  const result = await dashboardModel.getPlatformStatus();

  assert.deepEqual(result, { totalUsers: 0, activeUsers: 0, eventsLast24Hours: 0 });
});

test("platform status counts active users separately from the total", async () => {
  const User = createMockCollection("User", {
    countDocuments: (call) => (call.filter.isActive === true ? 4 : 6),
  });
  const ActivityEvent = createMockCollection("ActivityEvent", { countDocuments: 2 });
  const dashboardModel = createDashboardModel({ User, ActivityEvent });

  const result = await dashboardModel.getPlatformStatus();

  assert.deepEqual(result, { totalUsers: 6, activeUsers: 4, eventsLast24Hours: 2 });
  const recent = ActivityEvent.calls[0];
  assert.ok(recent.filter.createdAt.$gte instanceof Date);
});
