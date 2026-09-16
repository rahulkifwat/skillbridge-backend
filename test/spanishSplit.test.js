const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../src/data/spanishQuestionBank");
const { resolveAcademy } = require("../src/utils/spanishSplit");
const { SCENARIOS } = require("../src/data/spanishSimulations");
const {
  buildForm,
  encouragingFeedback,
  feedbackForAnswers,
} = require("../src/utils/spanishAssessment");

test("Spanish academy tag never downgrades to global", () => {
  assert.equal(resolveAcademy("spanish", "global"), "spanish");
  assert.equal(resolveAcademy("global", "spanish"), "spanish");
  assert.equal(resolveAcademy("global", "global"), "global");
});

test("law-enforcement beginners load the law pool, not generic theory first", () => {
  const { startLevel, specialty, form } = buildForm(bank, {
    backgroundId: "never",
    goalId: "lawEnforcement",
  });
  assert.equal(startLevel, "A0");
  assert.equal(specialty, "law");
  const lawCount = form.filter((item) => item.category === "law").length;
  const generalCount = form.filter((item) => item.category === "general").length;
  assert.ok(lawCount >= generalCount, `expected law-heavy form, got law=${lawCount} general=${generalCount}`);
});

test("growth-mindset feedback never uses Wrong, Incorrect, or False", () => {
  const item = bank.find((entry) => entry.itemId === "es-a0-gr-001");
  const miss = encouragingFeedback(item, 0);
  const hit = encouragingFeedback(item, 100);
  assert.equal(/\b(wrong|incorrect|false)\b/i.test(`${miss} ${hit}`), false);
  const map = feedbackForAnswers([item], { [item.itemId]: 3 });
  assert.match(map[item.itemId].message, /Keep going|starting point|Nice work/i);
});

test("simulation engine exposes specialty tracks including law enforcement", () => {
  const tracks = new Set(SCENARIOS.map((row) => row.specialty));
  assert.ok(tracks.has("law"));
  assert.ok(tracks.has("medical"));
  assert.ok(tracks.has("business"));
});
