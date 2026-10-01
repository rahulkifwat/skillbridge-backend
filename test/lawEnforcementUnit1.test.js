const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");

const env = require("../src/config/env");
const userModel = require("../src/models/userModel");
const app = require("../src/app");
const forms = require("../src/models/lawUnitFormStore");
const { unit, LANGUAGE_BANK, LESSONS } = require("../src/data/lawEnforcementUnit1");
const { listPublished, getScenario } = require("../src/data/simulationScenarios");
const { videoForSimulation, listVideos } = require("../src/data/spanishVideos");
const { curriculumForProfile } = require("../src/data/spanishCurriculum");

const originalFindById = userModel.findById;
let currentUser = null;

function rawUser(overrides = {}) {
  return {
    id: "u-law-1",
    fullName: "Alex Rivera",
    email: "alex@example.test",
    role: "student",
    academy: "spanish",
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
  forms.resetStore();
});

test("Law Enforcement Unit 1 ships eight lessons, a language bank, and an academic notice", () => {
  const data = unit();
  assert.equal(data.lessonCount, 8);
  assert.equal(LESSONS.length, 8);
  assert.ok(data.academicNotice.includes("does not replace agency policy"));
  assert.ok(LANGUAGE_BANK.some((row) => row.es.includes("Licencia de conducir")));
  assert.equal(data.finalAssessment.totalPoints, 60);
  assert.equal(listPublished({ program: "law" }).length, 8);
  assert.equal(getScenario("law-l1-capstone").lessonId, "l8");
  assert.equal(videoForSimulation("law-l1-integrated").id, "vid-law-traffic");
  assert.ok(listVideos().some((row) => row.id === "vid-law-sfst"));
});

test("law specialty learning path opens Unit 1 first", () => {
  const path = curriculumForProfile({ cefrLevel: "A2", specialty: "law", specialtyLabel: "Law enforcement", priorities: [] });
  assert.match(path.units[0].title, /Unit 1/);
  assert.equal(path.units[0].href, "/spanish/programs/law");
});

test("Unit 1 API returns the curriculum and stores a classroom form", async () => {
  const user = rawUser();
  currentUser = user;
  const listed = await request("/api/v1/spanish/programs/law/units/1", { user });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.data.lessons.length, 8);
  assert.ok(listed.body.data.forms["patrol-f-card"]);

  const saved = await request("/api/v1/spanish/programs/law/units/1/forms", {
    user,
    method: "POST",
    body: { formId: "patrol-f-card", lessonId: "l1", fields: { plate: "ABC-123", driverName: "Luis Mora" } },
  });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.data.form.fields.plate, "ABC-123");
  assert.match(saved.body.data.notice, /not official/i);

  const unknown = await request("/api/v1/spanish/programs/law/units/1/forms", {
    user,
    method: "POST",
    body: { formId: "not-a-form", fields: {} },
  });
  assert.equal(unknown.status, 400);
});
