const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const env = require("../src/config/env");
const userModel = require("../src/models/userModel");
const store = require("../src/models/blueprintSessionStore");
const app = require("../src/app");

// Mongoose is not connected in the test process, so the store falls back to its
// in-memory map and these run without a database.

const originalFindById = userModel.findById;
const student = {
  id: "user-blueprint-1",
  fullName: "Test Student",
  email: "student@example.test",
  role: "student",
  persona: null,
  academy: "spanish",
  avatarUrl: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "5m" });
}

async function request(path, { method = "GET", body } = {}) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor(student)}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test.before(() => {
  userModel.findById = async () => student;
});

test.after(() => {
  userModel.findById = originalFindById;
  store.resetStore();
});

test.beforeEach(() => {
  store.resetStore();
});

/** Opens a session and clears the 90-second observation phase. */
async function openSimulation(lessonId = "l1") {
  const started = await request(`/api/blueprint/modules/${lessonId}/sessions`, { method: "POST" });
  const sessionId = started.body.data.session.id;
  await request(`/api/blueprint/sessions/${sessionId}/video-position`, {
    method: "POST",
    body: { positionSec: 90 },
  });
  return sessionId;
}

const EVIDENCED_ROW = {
  claim: "Registro verificado.",
  evidence: "La placa coincide con el documento.",
  decision: "Continuar.",
};

test("the simulation is unreachable until the 90 second hard stop", async () => {
  const started = await request("/api/blueprint/modules/l1/sessions", { method: "POST" });
  const sessionId = started.body.data.session.id;

  const early = await request(`/api/blueprint/sessions/${sessionId}/stages/ST-01`, {
    method: "POST",
    body: { registerAssessment: "informal", correction: "Salga del vehículo." },
  });
  assert.equal(early.status, 403);

  // 89 seconds is not 90.
  const short = await request(`/api/blueprint/sessions/${sessionId}/video-position`, {
    method: "POST",
    body: { positionSec: 89 },
  });
  assert.equal(short.body.data.session.status, "video");
  assert.equal(short.body.data.hardStop.reached, false);

  const done = await request(`/api/blueprint/sessions/${sessionId}/video-position`, {
    method: "POST",
    body: { positionSec: 90 },
  });
  assert.equal(done.body.data.session.status, "simulation");
  assert.equal(done.body.data.hardStop.reached, true);
});

test("an open Bias Gate blocks the compliance review instead of failing it", async () => {
  // Regression: submitting the review with the gate open used to run the
  // review, fail compliance and place a remediation hold — punishing the
  // learner the gate exists to redirect.
  const sessionId = await openSimulation();

  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-01`, {
    method: "POST",
    body: { registerAssessment: "informal", correction: "Mantenga las manos donde pueda verlas." },
  });
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-02`, {
    method: "POST",
    body: { matrix: [{ claim: "Parecía nervioso.", evidence: "", decision: "" }] },
  });

  const blocked = await request(`/api/blueprint/sessions/${sessionId}/review`, { method: "POST" });
  assert.equal(blocked.status, 400);
  assert.match(blocked.body.message, /Bias Gate/i);

  const session = await request(`/api/blueprint/sessions/${sessionId}`);
  assert.equal(session.body.data.session.status, "simulation");
  assert.equal(session.body.data.session.review, null);
});

test("a resubmitted matrix clears the gate and the review then runs", async () => {
  const sessionId = await openSimulation();
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-01`, {
    method: "POST",
    body: { registerAssessment: "informal", correction: "Mantenga las manos donde pueda verlas." },
  });
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-02`, {
    method: "POST",
    body: { matrix: [{ claim: "Parecía nervioso.", evidence: "", decision: "" }] },
  });
  const cleared = await request(`/api/blueprint/sessions/${sessionId}/stages/ST-02`, {
    method: "POST",
    body: { matrix: [EVIDENCED_ROW, { ...EVIDENCED_ROW, claim: "Identidad confirmada." }, { ...EVIDENCED_ROW, claim: "Sin orden activa." }] },
  });
  assert.equal(cleared.body.data.result.biasGate.triggered, false);

  const review = await request(`/api/blueprint/sessions/${sessionId}/review`, { method: "POST" });
  assert.equal(review.status, 200);
  assert.equal(review.body.data.review.passed, true);
});

test("a weak ST-01 does not trap the learner on that stage", async () => {
  // Regression: gating progression on each stage's own minimum made ST-03 —
  // and therefore the risk escalation loop — unreachable.
  const sessionId = await openSimulation("l3");

  const weak = await request(`/api/blueprint/sessions/${sessionId}/stages/ST-01`, {
    method: "POST",
    body: { registerAssessment: "formal", correction: "" },
  });
  assert.equal(weak.body.data.result.advance, false);
  assert.equal(weak.body.data.session.currentStageId, "ST-02");

  const matrix = await request(`/api/blueprint/sessions/${sessionId}/stages/ST-02`, {
    method: "POST",
    body: { matrix: [EVIDENCED_ROW] },
  });
  assert.equal(matrix.status, 200);

  const review = await request(`/api/blueprint/sessions/${sessionId}/review`, { method: "POST" });
  assert.equal(review.status, 200);
  assert.equal(review.body.data.review.passed, false);
  assert.equal(review.body.data.review.rating, 1);
  assert.equal(review.body.data.review.riskEscalation.remediationHold.moduleId, "LE-L1-U3");
});

test("a held module blocks a retry while every other module stays open", async () => {
  const sessionId = await openSimulation("l3");
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-01`, {
    method: "POST",
    body: { registerAssessment: "formal", correction: "" },
  });
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-02`, {
    method: "POST",
    body: { matrix: [EVIDENCED_ROW] },
  });
  await request(`/api/blueprint/sessions/${sessionId}/review`, { method: "POST" });

  const retry = await request("/api/blueprint/modules/l3/sessions", { method: "POST" });
  assert.equal(retry.status, 403);

  const other = await request("/api/blueprint/modules/l5/sessions", { method: "POST" });
  assert.equal(other.status, 201);

  const catalogue = await request("/api/blueprint/modules");
  const held = catalogue.body.data.modules.filter((row) => row.held).map((row) => row.moduleID);
  assert.deepEqual(held, ["LE-L1-U3"]);
});

test("a student cannot release their own remediation hold", async () => {
  const sessionId = await openSimulation("l3");
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-01`, {
    method: "POST",
    body: { registerAssessment: "formal", correction: "" },
  });
  await request(`/api/blueprint/sessions/${sessionId}/stages/ST-02`, {
    method: "POST",
    body: { matrix: [EVIDENCED_ROW] },
  });
  await request(`/api/blueprint/sessions/${sessionId}/review`, { method: "POST" });

  const attempt = await request(`/api/blueprint/sessions/${sessionId}/release-hold`, {
    method: "POST",
    body: { note: "let me through" },
  });
  assert.equal(attempt.status, 403);
});

test("a session belongs to its owner", async () => {
  const sessionId = await openSimulation();
  const previous = student.id;
  student.id = "someone-else";
  try {
    const response = await request(`/api/blueprint/sessions/${sessionId}`);
    assert.equal(response.status, 403);
  } finally {
    student.id = previous;
  }
});
