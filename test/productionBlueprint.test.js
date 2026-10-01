const test = require("node:test");
const assert = require("node:assert/strict");

const blueprint = require("../src/data/productionBlueprint");
const { phoneticGuide } = require("../src/utils/spanishPhonetics");
const { buildModule, listModules } = require("../src/utils/blueprintModule");
const {
  scoreRegisterStage,
  scoreBiasStage,
  reviewCompliance,
} = require("../src/utils/evaluatorFramework");
const { toScorm12, toXapiStatements, secondsToScormTime } = require("../src/utils/scormExport");

// ── §1 The core mathematical division rule ────────────────────────────────────

test("the 15/85 split resolves to 90 and 510 seconds of a 600 second module", () => {
  assert.equal(blueprint.TIME_ALLOCATION.totalSeconds, 600);
  assert.equal(blueprint.TIME_ALLOCATION.videoWeight, 0.15);
  assert.equal(blueprint.TIME_ALLOCATION.simulationWeight, 0.85);
  assert.equal(blueprint.VIDEO_MAX_SECONDS, 90);
  assert.equal(blueprint.SIMULATION_MIN_SECONDS, 510);
  assert.equal(blueprint.VIDEO_MAX_SECONDS + blueprint.SIMULATION_MIN_SECONDS, 600);
});

// ── §2 Phonetic guide ─────────────────────────────────────────────────────────

test("phonetic guides reproduce the teacher edition's hand-written examples", () => {
  assert.equal(phoneticGuide("Licencia de conducir"), "lee-SEN-syah deh kon-doo-SEER");
  assert.equal(phoneticGuide("Registro del vehículo"), "reh-HEES-troh del veh-EE-koo-loh");
});

test("phonetic guides stress polysyllables and leave unaccented monosyllables alone", () => {
  // Penultimate stress: ends in a vowel.
  assert.equal(phoneticGuide("manos"), "MAH-nos");
  // Final stress: ends in a consonant other than n or s.
  assert.equal(phoneticGuide("conducir"), "kon-doo-SEER");
  // Written accent wins over the default rule.
  assert.equal(phoneticGuide("bolígrafo"), "boh-LEE-grah-foh");
  // An unaccented monosyllable is not shouted.
  assert.equal(phoneticGuide("de"), "deh");
});

test("every video cue carries a phonetic guide anchored at the lower third", () => {
  const module = buildModule("l1");
  assert.ok(module.video.cues.length > 0);
  for (const cue of module.video.cues) {
    assert.ok(cue.phonetic.length > 0, `missing phonetic for ${cue.spanish}`);
    assert.equal(cue.anchor, "lower-third");
    assert.ok(cue.english, "parallel English block missing");
  }
});

test("the video cue track ends exactly at the hard stop", () => {
  const module = buildModule("l1");
  const last = module.video.cues[module.video.cues.length - 1];
  assert.equal(last.end, 90);
  assert.equal(module.video.maxDurationSec, 90);
  assert.equal(module.video.hardStop.atSecond, 90);
  assert.equal(module.video.hardStop.lockControls, true);
  assert.equal(module.video.hardStop.skippable, false);
});

// ── §3B Module configuration JSON ─────────────────────────────────────────────

test("module configuration matches the blueprint's sample for lesson 1", () => {
  const module = buildModule("l1");
  assert.deepEqual(module.moduleConfiguration, {
    moduleID: "LE-L1-U1",
    courseTitle: "Spanish for Law Enforcement Level 1",
    copyright: "© Gerardo Mosquera. All rights reserved.",
    timeAllocation: { totalSeconds: 600, videoWeight: 0.15, simulationWeight: 0.85 },
  });
  assert.deepEqual(module.scorecardEngine.evaluationDimensions, [
    { dimension: "Fairness & Bias Awareness", minimumRatingRequired: 3, appendixReference: "Appendix D" },
    { dimension: "Linguistic Accuracy", minimumRatingRequired: 4, targetRegister: "Formal Usted Format" },
  ]);
});

test("all eight Unit 1 lessons build a module", () => {
  const modules = listModules();
  assert.equal(modules.length, 8);
  assert.equal(modules[0].moduleID, "LE-L1-U1");
  assert.equal(modules[7].moduleID, "LE-L1-U8");
  for (const row of modules) assert.ok(buildModule(row.lessonId));
});

// ── §3A ST-01 register analysis ───────────────────────────────────────────────

test("ST-01 rewards spotting the informal register and repairing it with usted", () => {
  const result = scoreRegisterStage({
    registerAssessment: "informal",
    correction: "Salga del vehículo, por favor.",
  });
  assert.equal(result.rating, 5);
  assert.equal(result.advance, true);
  assert.equal(result.dimension, "Linguistic Accuracy");
});

test("ST-01 does not advance a rewrite that stays in tú forms", () => {
  const result = scoreRegisterStage({
    registerAssessment: "informal",
    correction: "Sal del carro y dame tu licencia.",
  });
  assert.equal(result.rating, 2);
  assert.equal(result.advance, false);
});

test("formal commands are not mistaken for their tú lookalikes", () => {
  // "mantenga" contains "manten"; "permanezca" contains "te". Substring
  // matching scored both of these correct answers as informal.
  for (const correction of [
    "Mantenga las manos donde pueda verlas.",
    "Permanezca aquí mientras verificamos.",
    "Apague el motor ahora mismo.",
    "Ponga las manos detrás de la espalda.",
  ]) {
    const result = scoreRegisterStage({ registerAssessment: "informal", correction });
    assert.ok(result.rating >= 4, `${correction} scored ${result.rating}`);
    assert.equal(result.advance, true);
  }
});

test("ST-01 scores a missed diagnosis below the advance threshold", () => {
  const result = scoreRegisterStage({ registerAssessment: "formal", correction: "" });
  assert.equal(result.advance, false);
  assert.ok(result.rating < 4);
});

// ── §3A ST-02 the Bias Gate ───────────────────────────────────────────────────

test("an unsupported claim trips the Bias Gate and locks the continue button", () => {
  const result = scoreBiasStage({
    matrix: [{ claim: "El conductor estaba nervioso.", evidence: "", decision: "" }],
  });
  assert.equal(result.biasGate.triggered, true);
  assert.equal(result.biasGate.freezeScreen, true);
  assert.equal(result.biasGate.continueLocked, true);
  assert.equal(result.biasGate.appendix, "Appendix D");
  assert.deepEqual(result.biasGate.unresolvedClaims, ["El conductor estaba nervioso."]);
  assert.equal(result.advance, false);
});

test("a fully evidenced matrix clears the gate and advances", () => {
  const result = scoreBiasStage({
    matrix: [
      { claim: "El registro no coincide.", evidence: "La placa no corresponde al documento.", decision: "Verificar con el sistema." },
      { claim: "La licencia está vencida.", evidence: "Fecha de vencimiento 2024-01-02.", decision: "Registrar en el informe." },
      { claim: "El idioma principal es español.", evidence: "La persona lo indicó.", decision: "Continuar en español." },
    ],
  });
  assert.equal(result.biasGate.triggered, false);
  assert.equal(result.rating, 5);
  assert.equal(result.advance, true);
});

test("evidenced but inferential wording is capped below exemplary", () => {
  const result = scoreBiasStage({
    matrix: [
      { claim: "El sujeto estaba obviamente borracho.", evidence: "Olor a alcohol.", decision: "Prueba de sobriedad." },
    ],
  });
  assert.equal(result.biasGate.triggered, false);
  assert.equal(result.rating, 3);
});

// ── §3A ST-03 compliance review and risk escalation ───────────────────────────

test("meeting both dimension minimums passes the compliance review", () => {
  const stages = [
    scoreRegisterStage({ registerAssessment: "informal", correction: "Mantenga las manos donde pueda verlas." }),
    scoreBiasStage({
      matrix: [
        { claim: "Registro verificado.", evidence: "Coincide con la placa.", decision: "Continuar." },
        { claim: "Identidad confirmada.", evidence: "Documento válido.", decision: "Registrar." },
        { claim: "Sin orden activa.", evidence: "El sistema no reporta ninguna.", decision: "Cerrar el control." },
      ],
    }),
  ];
  const review = reviewCompliance(stages, "LE-L1-U1");
  assert.equal(review.passed, true);
  assert.equal(review.riskEscalation, null);
  for (const row of review.scorecard) assert.equal(row.met, true);
});

test("a dimension below its minimum triggers the risk escalation loop at Rating 1", () => {
  const stages = [
    scoreRegisterStage({ registerAssessment: "formal", correction: "" }),
    scoreBiasStage({ matrix: [{ claim: "Parecía nervioso.", evidence: "", decision: "" }] }),
  ];
  const review = reviewCompliance(stages, "LE-L1-U1");
  assert.equal(review.passed, false);
  assert.equal(review.rating, 1);
  assert.equal(review.label, "Not Ready");
  assert.equal(review.riskEscalation.triggered, true);
  assert.ok(review.failures.length > 0);
});

test("the remediation hold is scoped to the module, never the account", () => {
  const stages = [
    scoreRegisterStage({ registerAssessment: "formal", correction: "" }),
    scoreBiasStage({ matrix: [] }),
  ];
  const { riskEscalation } = reviewCompliance(stages, "LE-L1-U3");
  assert.equal(riskEscalation.remediationHold.scope, "module");
  assert.equal(riskEscalation.remediationHold.moduleId, "LE-L1-U3");
  assert.equal(riskEscalation.remediationHold.status, "held");
  assert.ok(riskEscalation.remediationHold.releasableBy.includes("instructor"));
});

test("Linguistic Accuracy at 3 still fails — its minimum is 4", () => {
  const stages = [
    { stageId: "ST-01", rating: 3, dimension: "Linguistic Accuracy", advance: false },
    { stageId: "ST-02", rating: 4, dimension: "Fairness & Bias Awareness", advance: true },
  ];
  const review = reviewCompliance(stages, "LE-L1-U1");
  assert.equal(review.passed, false);
  const linguistic = review.scorecard.find((row) => row.dimension === "Linguistic Accuracy");
  assert.equal(linguistic.met, false);
});

// ── §4 SCORM 1.2 / xAPI ───────────────────────────────────────────────────────

test("SCORM 1.2 export carries the status, score bounds and per-dimension interactions", () => {
  const stages = [
    scoreRegisterStage({ registerAssessment: "informal", correction: "Salga del vehículo, por favor." }),
    scoreBiasStage({
      matrix: [
        { claim: "Registro verificado.", evidence: "Coincide.", decision: "Continuar." },
        { claim: "Identidad confirmada.", evidence: "Documento válido.", decision: "Registrar." },
        { claim: "Sin orden activa.", evidence: "Sistema sin reportes.", decision: "Cerrar." },
      ],
    }),
  ];
  const review = reviewCompliance(stages, "LE-L1-U1");
  const scorm = toScorm12({
    id: "s1",
    userId: "u1",
    moduleId: "LE-L1-U1",
    stageResults: stages,
    review,
    elapsedSeconds: 600,
    currentStageId: "ST-03",
  });

  assert.equal(scorm.version, "1.2");
  assert.equal(scorm["cmi.core.lesson_status"], "passed");
  assert.equal(scorm["cmi.core.score.min"], "1");
  assert.equal(scorm["cmi.core.score.max"], "5");
  assert.equal(scorm["cmi.core.session_time"], "0000:10:00.00");
  assert.equal(scorm.interactions.length, 2);
  assert.equal(scorm["cmi.comments"], "© Gerardo Mosquera. All rights reserved.");
});

test("SCORM session time formats as HHHH:MM:SS.SS", () => {
  assert.equal(secondsToScormTime(0), "0000:00:00.00");
  assert.equal(secondsToScormTime(90), "0000:01:30.00");
  assert.equal(secondsToScormTime(3671.5), "0001:01:11.50");
});

test("xAPI statements cover the video phase, each stage and the final verdict", () => {
  const stages = [
    scoreRegisterStage({ registerAssessment: "formal", correction: "" }),
    scoreBiasStage({ matrix: [] }),
  ];
  const review = reviewCompliance(stages, "LE-L1-U1");
  const statements = toXapiStatements({
    id: "s1",
    userId: "u1",
    moduleId: "LE-L1-U1",
    videoCompletedAt: new Date(),
    stageResults: stages,
    review,
  });

  assert.equal(statements.length, 4); // video + 2 stages + verdict
  assert.match(statements[0].verb.id, /experienced$/);
  assert.match(statements[statements.length - 1].verb.id, /failed$/);
  assert.equal(statements[statements.length - 1].result.success, false);
  for (const row of statements) {
    assert.equal(row.context.extensions["https://skillbridge.tech/xapi/spanish/law/moduleID"], "LE-L1-U1");
  }
});
