const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");

const env = require("../src/config/env");
const userModel = require("../src/models/userModel");
const app = require("../src/app");
const videoProgress = require("../src/models/spanishVideoProgressStore");
const { applyVideoEvent, emptyProgress } = require("../src/utils/videoProgress");
const { listVideos } = require("../src/data/spanishVideos");

const originalFindById = userModel.findById;
let currentUser = null;

function rawUser(overrides = {}) {
  return {
    id: "u-video-1",
    fullName: "Alex Rivera",
    email: "alex@example.test",
    role: "student",
    academy: "spanish",
    persona: null,
    avatarUrl: null,
    isActive: true,
    ...overrides,
  };
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role, academy: user.academy }, env.jwtSecret, { expiresIn: "5m" });
}

async function request(path, { user, method = "GET", body } = {}) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const headers = { "Content-Type": "application/json" };
    if (user) headers.Authorization = `Bearer ${tokenFor(user)}`;
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test.before(() => {
  currentUser = rawUser();
  userModel.findById = async () => currentUser;
});

test.after(() => {
  userModel.findById = originalFindById;
  videoProgress.resetStore();
});

test("Video Master catalog maps flagship programs to simulations", () => {
  const videos = listVideos();
  assert.equal(videos.length, 4);
  assert.ok(videos.every((row) => row.src && row.simulationId && row.durationHintMin === 2));
});

function watchThrough(row, duration = 10, step = 1.2) {
  let next = row;
  for (let position = step; position <= duration; position += step) {
    next = applyVideoEvent(next, { event: "time", position, duration });
  }
  return next;
}

test("skipping ahead or scrubbing back resets continuous watch time", () => {
  const watching = watchThrough(emptyProgress("u-video-1", "vid-customer-order"), 4, 1);
  const skipped = applyVideoEvent(watching, { event: "time", position: 9, duration: 10 });
  assert.equal(skipped.maxContinuousSec, 0);
  assert.equal(skipped.completed, false);
  assert.ok(skipped.seekResetCount >= 1);

  const jumpedEnd = applyVideoEvent(watching, { event: "ended", position: 10, duration: 10 });
  assert.equal(jumpedEnd.completed, false);
});

test("continuous watch then ended marks the lesson complete", () => {
  let row = watchThrough(emptyProgress("u-video-1", "vid-customer-order"), 10, 1.2);
  row = applyVideoEvent(row, { event: "ended", position: 10, duration: 10 });
  assert.equal(row.completed, true);
  assert.equal(row.status, "complete");
});

test("video progress API rejects skip-complete and unlocks after a full watch", async () => {
  const user = rawUser();
  currentUser = user;
  videoProgress.resetStore();

  const listed = await request("/api/spanish/videos", { user });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.data.engine, "video-master");
  assert.equal(listed.body.data.simulationUnlocked, false);

  const skipped = await request("/api/spanish/videos/vid-customer-order/progress", {
    user,
    method: "POST",
    body: { event: "ended", position: 10, duration: 10 },
  });
  assert.equal(skipped.status, 200);
  assert.equal(skipped.body.data.progress.completed, false);
  assert.equal(skipped.body.data.completionToken, null);

  for (const position of [1.2, 2.4, 3.6, 4.8, 6, 7.2, 8.4, 9.6, 10]) {
    await request("/api/spanish/videos/vid-customer-order/progress", {
      user,
      method: "POST",
      body: { event: "time", position, duration: 10 },
    });
  }
  const finished = await request("/api/spanish/videos/vid-customer-order/progress", {
    user,
    method: "POST",
    body: { event: "ended", position: 10, duration: 10 },
  });
  assert.equal(finished.body.data.progress.completed, true);
  assert.equal(finished.body.data.completionToken.simulationId, "cs-l1-order-delay");

  const after = await request("/api/spanish/videos", { user });
  assert.equal(after.body.data.simulationUnlocked, true);
  assert.ok(after.body.data.unlockedSimulationIds.includes("cs-l1-order-delay"));
});
