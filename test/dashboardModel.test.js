const test = require("node:test");
const assert = require("node:assert/strict");

const { createDashboardModel } = require("../src/models/dashboardModel");

function createMockDatabase(handler) {
  const calls = [];

  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      return [await handler(sql, params, calls.length)];
    },
  };
}

test("student overview reads only the student's assessment results", async () => {
  const database = createMockDatabase(async (sql, params) => {
    if (/assessment_results/i.test(sql)) {
      return [{ completedAssessments: 2, latestCareerReadinessScore: 81 }];
    }
    return [{ unreadNotifications: 1 }];
  });
  const dashboardModel = createDashboardModel(database);

  const result = await dashboardModel.getOverview({ id: 12, role: "student" });

  assert.deepEqual(result.metrics, [
    { key: "assessmentsCompleted", value: 2 },
    { key: "careerReadinessScore", value: 81 },
    { key: "unreadNotifications", value: 1 },
  ]);
  const assessmentCall = database.calls.find(({ sql }) => /assessment_results/i.test(sql));
  assert.deepEqual(assessmentCall.params, [12, 12]);
  assert.match(assessmentCall.sql, /ORDER BY completed_at DESC, id DESC/i);
});

test("notifications and activity use parameterized user and limit values", async () => {
  const database = createMockDatabase(async (_sql, _params, callNumber) =>
    callNumber === 1 ? [{ id: 1, title: "Assessment complete" }] : [{ id: 2, event_type: "assessment.completed" }]
  );
  const dashboardModel = createDashboardModel(database);

  const notifications = await dashboardModel.getNotifications({ id: 7, role: "student" }, 5);
  const activity = await dashboardModel.getActivity({ id: 7, role: "student" }, 3);

  assert.equal(notifications.length, 1);
  assert.equal(activity.length, 1);
  assert.deepEqual(database.calls[0].params, [7, 5]);
  assert.deepEqual(database.calls[1].params, [7, 7, 3]);
  assert.match(database.calls[0].sql, /user_id = \?/i);
  assert.match(database.calls[1].sql, /actor_user_id = \? OR subject_user_id = \?/i);
});

test("platform status returns zero-valued aggregates when no records exist", async () => {
  const database = createMockDatabase(async () => [{ totalUsers: 0, activeUsers: 0, eventsLast24Hours: 0 }]);
  const dashboardModel = createDashboardModel(database);

  const result = await dashboardModel.getPlatformStatus();

  assert.deepEqual(result, { totalUsers: 0, activeUsers: 0, eventsLast24Hours: 0 });
});

test("notification limits normalize invalid, zero, negative, and over-limit values", async () => {
  const database = createMockDatabase(async () => []);
  const dashboardModel = createDashboardModel(database);
  const user = { id: 19, role: "student" };

  await dashboardModel.getNotifications(user, "not-a-number");
  await dashboardModel.getNotifications(user, 0);
  await dashboardModel.getNotifications(user, -4);
  await dashboardModel.getNotifications(user, 101);

  assert.deepEqual(
    database.calls.map(({ params }) => params),
    [[19, 20], [19, 20], [19, 20], [19, 100]]
  );
});

test("administrators retrieve global activity with a bounded limit", async () => {
  const database = createMockDatabase(async () => [{ id: 3, eventType: "user.created" }]);
  const dashboardModel = createDashboardModel(database);

  const activity = await dashboardModel.getActivity({ id: 4, role: "administrator" }, 6);

  assert.equal(activity.length, 1);
  assert.deepEqual(database.calls[0].params, [6]);
  assert.doesNotMatch(database.calls[0].sql, /WHERE actor_user_id/i);
});

test("student and partner activity stays isolated to each requesting user", async () => {
  const database = createMockDatabase(async () => []);
  const dashboardModel = createDashboardModel(database);

  await dashboardModel.getActivity({ id: 12, role: "student" }, 4);
  await dashboardModel.getActivity({ id: 44, role: "partner" }, 4);

  assert.deepEqual(database.calls[0].params, [12, 12, 4]);
  assert.deepEqual(database.calls[1].params, [44, 44, 4]);
  assert.match(database.calls[0].sql, /WHERE actor_user_id = \? OR subject_user_id = \?/i);
  assert.match(database.calls[1].sql, /WHERE actor_user_id = \? OR subject_user_id = \?/i);
});
