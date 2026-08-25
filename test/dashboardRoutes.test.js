const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const env = require("../src/config/env");
const userModel = require("../src/models/userModel");
const dashboardModel = require("../src/models/dashboardModel");
const app = require("../src/app");

const originalFindById = userModel.findById;
const originalDashboardMethods = {
  getOverview: dashboardModel.getOverview,
  getNotifications: dashboardModel.getNotifications,
  getActivity: dashboardModel.getActivity,
  getPlatformStatus: dashboardModel.getPlatformStatus,
};

let currentUser = null;
let lastActivityUser = null;

function rawUser(id, role) {
  return {
    id,
    full_name: `${role} user`,
    email: `${role}-${id}@example.test`,
    role,
    persona: null,
    avatar_url: null,
    is_active: 1,
    last_login_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "5m" });
}

async function request(path, user) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: user ? { Authorization: `Bearer ${tokenFor(user)}` } : {},
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test.before(() => {
  userModel.findById = async () => currentUser;
  dashboardModel.getOverview = async (user) => ({ role: user.role, metrics: [] });
  dashboardModel.getNotifications = async (user, limit) => [{ userId: user.id, limit }];
  dashboardModel.getActivity = async (user, limit) => {
    lastActivityUser = user;
    return [
      { actorUserId: user.id, subjectUserId: user.id, limit },
      { actorUserId: 99, subjectUserId: user.id, limit },
      { actorUserId: user.id, subjectUserId: 99, limit },
    ];
  };
  dashboardModel.getPlatformStatus = async () => ({ totalUsers: 2, activeUsers: 2, eventsLast24Hours: 1 });
});

test.after(() => {
  userModel.findById = originalFindById;
  Object.assign(dashboardModel, originalDashboardMethods);
});

test("overview rejects a missing token", async () => {
  const response = await request("/api/dashboard/overview");

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("status rejects a student token", async () => {
  const student = rawUser(11, "student");
  currentUser = student;
  const response = await request("/api/dashboard/status", student);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test("authorized endpoints return the standard success shape", async () => {
  const administrator = rawUser(12, "administrator");
  currentUser = administrator;

  for (const path of ["/api/dashboard/overview", "/api/dashboard/notifications", "/api/dashboard/activity", "/api/dashboard/status"]) {
    const response = await request(path, administrator);
    assert.equal(response.status, 200, path);
    assert.equal(response.body.success, true, path);
    assert.ok(Object.hasOwn(response.body, "data"), path);
  }
});

test("notifications and activity reject invalid limits", async () => {
  const student = rawUser(13, "student");
  currentUser = student;

  for (const path of [
    "/api/dashboard/notifications?limit=0",
    "/api/dashboard/activity?limit=51",
    "/api/dashboard/activity?limit=1.5",
    "/api/dashboard/notifications?limit=abc",
  ]) {
    const response = await request(path, student);
    assert.equal(response.status, 400, path);
    assert.equal(response.body.success, false, path);
  }
});

test("activity passes the authenticated account to the model and enforces role data isolation", async () => {
  const partner = rawUser(44, "partner");
  currentUser = partner;
  const response = await request("/api/dashboard/activity?limit=3", partner);

  assert.equal(response.status, 200);
  assert.equal(lastActivityUser.id, partner.id);
  assert.equal(lastActivityUser.role, "partner");
  assert.deepEqual(response.body.data, [{ actorUserId: 44, subjectUserId: 44, limit: 3 }]);

  const student = rawUser(45, "student");
  currentUser = student;
  const studentResponse = await request("/api/dashboard/activity?limit=3", student);

  assert.equal(studentResponse.status, 200);
  assert.deepEqual(studentResponse.body.data, [
    { actorUserId: 45, subjectUserId: 45, limit: 3 },
    { actorUserId: 99, subjectUserId: 45, limit: 3 },
  ]);
});
