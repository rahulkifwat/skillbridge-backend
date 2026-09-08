const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../src/data/spanishQuestionBank");
const { curriculumForProfile } = require("../src/data/spanishCurriculum");
const {
  buildForm,
  buildProfile,
  publicItem,
  scoreItem,
  scoreWriting,
  skillScores,
} = require("../src/utils/spanishAssessment");

test("public items never include the answer key", () => {
  const item = bank.find((entry) => entry.itemId === "es-a1-gr-001");
  const published = publicItem(item);
  assert.equal(published.prompt.includes("Colombia"), true);
  assert.equal("answerKey" in published, false);
  assert.equal("explanation" in published, false);
});

test("A1 grammar key from the v1.3 bank scores soy as correct", () => {
  const item = bank.find((entry) => entry.itemId === "es-a1-gr-001");
  assert.equal(scoreItem(item, 1), 100);
  assert.equal(scoreItem(item, 0), 0);
});

test("beginners receive A0 core items, not mixed English career prompts", () => {
  const { startLevel, form } = buildForm(bank, { backgroundId: "never", goalId: "healthcare" });
  assert.equal(startLevel, "A0");
  assert.ok(form.every((item) => item.bankId.startsWith("spanish-")));
  const domains = new Set(form.map((item) => item.domain));
  for (const skill of ["grammar", "vocabulary", "reading", "listening", "writing", "speaking"]) {
    assert.ok(domains.has(skill), `missing ${skill}`);
  }
  assert.ok(form.some((item) => item.category === "medical"));
});

test("C2 bank items exist and writing rubric uses the published weights", () => {
  assert.ok(bank.some((item) => item.cefrLevel === "C2" && item.domain === "grammar"));
  const result = scoreWriting("Hoy trabajo en el equipo y envío el informe con claridad y respeto.", 10);
  assert.equal(typeof result.score, "number");
  assert.ok(result.breakdown.task >= 0);
  assert.ok("register" in result.breakdown);
});

test("profile is evidence-based and does not claim job qualification", () => {
  const { form, startLevel, specialty } = buildForm(bank, { backgroundId: "studied", goalId: "business" });
  const answers = {};
  for (const item of form) {
    answers[item.itemId] = item.questionType === "mcq" ? item.answerKey : "Hoy trabajo en equipo y envío el informe.";
  }
  const { bySkill, details } = skillScores(form, answers);
  const profile = buildProfile({
    fullName: "Alex Rivera",
    specialty,
    startLevel,
    scores: bySkill,
    details,
  });
  assert.equal(profile.academyId, "spanish-academy");
  assert.match(profile.greeting, /Alex/);
  assert.ok(profile.overallScore >= 0);
  assert.equal(typeof profile.skillScores.grammar, "number");
  assert.match(profile.specialtyNote, /do not imply licensure/i);
  assert.ok(Array.isArray(profile.evidence));
  assert.ok(profile.evidence[0].recommendation);
  const path = curriculumForProfile(profile);
  assert.equal(path.units.length, 12);
});
