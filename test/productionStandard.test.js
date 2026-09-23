const test = require("node:test");
const assert = require("node:assert/strict");

const { listVideos } = require("../src/data/spanishVideos");
const { buildLayout, MIN_LESSON_SEC, MAX_LESSON_SEC } = require("../src/utils/videoLayoutEngine");
const { publicLesson, productionFlags } = require("../src/utils/videoProduction");
const { scorePronunciation } = require("../src/utils/pronunciation");
const { pickCurriculumCondition } = require("../src/utils/scenarioAi");
const { getScenario } = require("../src/data/simulationScenarios");
const { atmosphereFor } = require("../src/data/simulationAtmosphere");

test("Loop Core lessons stay inside the 2–3 minute cap with a one-second pause", () => {
  for (const video of listVideos()) {
    const layout = buildLayout(video);
    assert.ok(layout.durationSec >= MIN_LESSON_SEC);
    assert.ok(layout.durationSec <= MAX_LESSON_SEC);
    assert.ok(layout.items.some((row) => row.kind === "pause" && row.duration === 1));
    assert.ok(layout.items.some((row) => row.kind === "spanish"));
    assert.ok(layout.items.some((row) => row.kind === "english"));
    assert.ok(layout.forbidden.includes("clip-art"));
    assert.equal(publicLesson(video).src, null);
  }
});

test("pronunciation bands match the production feedback contract", () => {
  const script = ["Buenos días, ¿en qué puedo ayudarle?", "¿Me da el número de pedido, por favor?"];
  const green = scorePronunciation("Buenos días, ¿en qué puedo ayudarle?", script);
  const yellow = scorePronunciation("Buenos días puedo ayudarle", script);
  const red = scorePronunciation("hello I need my package", script);
  assert.equal(green.band, "green");
  assert.equal(yellow.band, "yellow");
  assert.equal(red.band, "red");
  assert.equal(red.rerun, true);
});

test("curriculum engine yields a new field condition without LLM keys", () => {
  const scenario = getScenario("med-l1-patient-intake");
  const first = pickCurriculumCondition(scenario, null);
  const second = pickCurriculumCondition(scenario, first.id);
  assert.ok(first.openingMessage);
  assert.ok(first.fieldCondition);
  assert.notEqual(second.id, first.id);
  assert.equal(productionFlags().openai, false);
  assert.equal(atmosphereFor("law").loops.includes("radio-static"), true);
});
