const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");

const env = require("../src/config/env");
const userModel = require("../src/models/userModel");
const app = require("../src/app");
const purchases = require("../src/models/spanishPurchaseStore");
const sessions = require("../src/models/simulationSessionStore");
const videoProgress = require("../src/models/spanishVideoProgressStore");
const { catalog } = require("../src/data/spanishPrograms");
const { listPublished, publicScenario, getScenario } = require("../src/data/simulationScenarios");
const { evaluateSession } = require("../src/utils/simulationEvaluation");
const { masteryStatus } = require("../src/utils/simulationMastery");
const { nextCollected, pickReply } = require("../src/utils/simulationOrchestrator");

const originalFindById = userModel.findById;
let currentUser = null;

function rawUser(overrides = {}) {
  return {
    id: "u-sim-1",
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
  purchases.resetStore();
  sessions.resetStore();
  videoProgress.resetStore();
});

test("master program catalog has 42 programs and flagship IDs", () => {
  const data = catalog();
  const count = data.groups.reduce((sum, group) => sum + group.programs.length, 0);
  assert.equal(count, 42);
  assert.ok(data.flagshipProgramIds.includes("medical"));
  assert.ok(data.flagshipProgramIds.includes("construction"));
});

test("published scenarios never leak AI rules to the public payload", () => {
  const row = getScenario("cs-l1-order-delay");
  const published = publicScenario(row);
  assert.equal(published.title.includes("Order"), true);
  assert.equal("conversationBeats" in published, false);
  assert.equal("safetyRules" in published, false);
  assert.equal("requiredInformation" in published, false);
  assert.ok(listPublished({ program: "customer_service" }).length >= 1);
});

test("mastery requires task completion and blocks critical errors", () => {
  assert.equal(masteryStatus(90, { taskComplete: true, criticalErrors: [] }), "Mastered");
  assert.equal(masteryStatus(90, { taskComplete: false, criticalErrors: [] }), "Developing");
  assert.equal(masteryStatus(90, { taskComplete: true, criticalErrors: ["English only"] }), "Developing");
});

test("customer-service orchestrator collects order details from Spanish turns", () => {
  const scenario = getScenario("cs-l1-order-delay");
  const collected = nextCollected(scenario, [], "Buenos días, ¿me da el número de pedido?");
  assert.ok(collected.includes("greet"));
  assert.ok(collected.includes("ask_order"));
  const reply = pickReply(scenario, collected, "Reviso el envío y le mando el seguimiento.", 4);
  assert.equal(typeof reply.assistant_message, "string");
});

test("evaluation scores the spec customer-service example without punitive copy", () => {
  const scenario = getScenario("cs-l1-order-delay");
  const turns = [
    { role: "student", content: "Buenos días, ¿en qué puedo ayudarle? ¿Cuál es el número de pedido?" },
    { role: "student", content: "Entiendo el retraso. Reviso el envío y le mando el seguimiento por correo. Gracias." },
  ];
  const result = evaluateSession(scenario, turns, ["greet", "ask_order", "next_step"]);
  assert.equal(typeof result.overall_score, "number");
  assert.ok(result.strengths.join(" ").length > 10);
  assert.equal(/\b(wrong|incorrect|false)\b/i.test(JSON.stringify(result)), false);
});

test("Simulation Master start, turn, complete, and retry work for a member", async () => {
  const user = rawUser();
  currentUser = user;
  const blocked = await request("/api/v1/simulations/cs-l1-order-delay/start", { user, method: "POST", body: {} });
  assert.equal(blocked.status, 403);

  await purchases.recordPurchase({ userId: user.id, product: "membership", amountUsd: 29 });
  const videoLocked = await request("/api/v1/simulations/cs-l1-order-delay/start", { user, method: "POST", body: {} });
  assert.equal(videoLocked.status, 403);
  assert.match(videoLocked.body.message || "", /Video Master/i);

  for (const position of [1.2, 2.4, 3.6, 4.8, 6, 7.2, 8.4, 9.6, 10]) {
    const watched = await request("/api/spanish/videos/vid-customer-order/progress", {
      user,
      method: "POST",
      body: { event: "time", position, duration: 10 },
    });
    assert.equal(watched.status, 200);
  }
  const finished = await request("/api/spanish/videos/vid-customer-order/progress", {
    user,
    method: "POST",
    body: { event: "ended", position: 10, duration: 10 },
  });
  assert.equal(finished.body.data.progress.completed, true);

  const started = await request("/api/v1/simulations/cs-l1-order-delay/start", { user, method: "POST", body: {} });
  assert.equal(started.status, 201);
  assert.ok(started.body.data.initial_message);
  assert.ok(started.body.data.variation.fieldCondition);
  const sessionId = started.body.data.session_id;

  const listed = await request("/api/v1/simulations?program=customer_service", { user });
  assert.equal(listed.status, 200);
  assert.ok(listed.body.data.simulations.length >= 1);
  const customer = listed.body.data.simulations.find((row) => row.simulation_id === "cs-l1-order-delay");
  assert.equal(customer.unlocked, true);
  assert.ok(customer.atmosphere.loops.length >= 1);
  assert.ok(customer.master_script.length >= 1);

  const turned = await request(`/api/v1/simulation-sessions/${sessionId}/responses`, {
    user,
    method: "POST",
    body: { content: "Buenos días, ¿cuál es el número de pedido? Reviso el envío y el seguimiento." },
  });
  assert.equal(turned.status, 200);
  assert.ok(turned.body.data.assistant_message);
  assert.ok(["green", "yellow", "red"].includes(turned.body.data.pronunciation.band));

  const completed = await request(`/api/v1/simulation-sessions/${sessionId}/complete`, { user, method: "POST", body: {} });
  assert.equal(completed.status, 200);
  assert.ok(completed.body.data.evaluation.overall_score >= 0);

  const retried = await request(`/api/v1/simulation-sessions/${sessionId}/retry`, { user, method: "POST", body: {} });
  assert.equal(retried.status, 201);
  assert.equal(retried.body.data.retry, true);
});

test("instructors can assign a published simulation", async () => {
  const student = rawUser();
  currentUser = student;
  const forbidden = await request("/api/v1/teacher/assignments", {
    user: student,
    method: "POST",
    body: { studentId: "u-sim-1", simulationId: "cs-l1-order-delay" },
  });
  assert.equal(forbidden.status, 403);

  const instructor = rawUser({ id: "u-teacher-1", role: "instructor", email: "teacher@example.test" });
  currentUser = instructor;
  const created = await request("/api/v1/teacher/assignments", {
    user: instructor,
    method: "POST",
    body: { studentId: "u-sim-1", simulationId: "cs-l1-order-delay" },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.assignment.simulationId, "cs-l1-order-delay");
});
