const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const env = require("../src/config/env");
const userModel = require("../src/models/userModel");
const app = require("../src/app");
const store = require("../src/models/spanishAttemptStore");
const purchases = require("../src/models/spanishPurchaseStore");
const simulations = require("../src/models/spanishSimulationStore");

const originalFindById = userModel.findById;

function rawUser() {
  return {
    id: "u-spanish-1",
    fullName: "Alex Rivera",
    email: "alex@example.test",
    role: "student",
    persona: null,
    avatarUrl: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "5m" });
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
  userModel.findById = async () => rawUser();
});

test.after(() => {
  userModel.findById = originalFindById;
  store.resetStore();
  purchases.resetStore();
  simulations.resetStore();
});

test("Spanish assessment rejects a missing token", async () => {
  const response = await request("/api/spanish/assessment/start", { method: "POST", body: {} });
  assert.equal(response.status, 401);
});

test("Spanish diagnostic requires checkout then hides answer keys", async () => {
  const user = rawUser();
  const blocked = await request("/api/spanish/assessment/start", {
    user,
    method: "POST",
    body: { backgroundId: "never", goalId: "healthcare" },
  });
  assert.equal(blocked.status, 403);

  const paid = await request("/api/spanish/billing/checkout", {
    user,
    method: "POST",
    body: { product: "diagnostic" },
  });
  assert.equal(paid.status, 201);
  if (paid.body.data.provider === "stripe") {
    await purchases.recordPurchase({ userId: user.id, product: "diagnostic", amountUsd: 25 });
  } else {
    assert.equal(paid.body.data.entitlements.diagnosticPaid, true);
  }

  const started = await request("/api/spanish/assessment/start", {
    user,
    method: "POST",
    body: { backgroundId: "never", goalId: "healthcare" },
  });
  assert.equal(started.status, 201);
  const attemptId = started.body.data.attemptId;

  const grammar = await request(`/api/spanish/assessment/${attemptId}/section/grammar`, { user });
  assert.equal(grammar.status, 200);
  assert.ok(grammar.body.data.items.length >= 1);
  for (const item of grammar.body.data.items) {
    assert.equal("answerKey" in item, false);
  }

  const listening = await request(`/api/spanish/assessment/${attemptId}/section/listening`, { user });
  assert.ok(listening.body.data.items.some((item) => item.audioScript));

  const answers = {};
  for (const item of grammar.body.data.items) answers[item.itemId] = 0;
  const saved = await request(`/api/spanish/assessment/${attemptId}/answers`, {
    user,
    method: "POST",
    body: { answers },
  });
  assert.equal(saved.status, 200);
  assert.equal(typeof saved.body.data.feedback, "object");

  const submitted = await request(`/api/spanish/assessment/${attemptId}/submit`, { user, method: "POST" });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.data.profile.academyId, "spanish-academy");
  assert.equal(typeof submitted.body.data.profile.skillScores.grammar, "number");
  assert.ok(submitted.body.data.profile.evidence.length >= 1);
  assert.equal(submitted.body.data.profile.learningPath.units.length, 12);
});

test("OAuth providers endpoint lists only configured integrations", async () => {
  const response = await request("/api/auth/oauth/providers");
  assert.equal(response.status, 200);
  assert.equal(response.body.data.providers.google, false);
  assert.equal(response.body.data.providers.microsoft, false);
});
