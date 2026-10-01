/**
 * SKILLBRIDGE PRODUCTION MASTER BLUEPRINT — SBS-2026-PRODUCTION-002
 * The 15% / 85% video & interactive simulation architecture.
 *
 * Every value here is taken verbatim from the blueprint. Treat this file as the
 * single source of truth for the split rule, the EVALUATOR Framework™ scorecard
 * and the stage-branching map; nothing downstream should hard-code these.
 */

const DOCUMENT_ID = "SBS-2026-PRODUCTION-002";
const AUTHOR = "Gerardo Mosquera";
const COMPANY = "Skillbridge Academic Resources";
const FRAMEWORK = "EVALUATOR Framework™";
const COPYRIGHT = "© Gerardo Mosquera. All rights reserved.";

/**
 * §1 The core mathematical division rule.
 * 10 minutes total: 90 seconds of video observation, 510 seconds of simulation.
 */
const TIME_ALLOCATION = {
  totalSeconds: 600,
  videoWeight: 0.15,
  simulationWeight: 0.85,
};

const VIDEO_MAX_SECONDS = Math.round(TIME_ALLOCATION.totalSeconds * TIME_ALLOCATION.videoWeight); // 90
const SIMULATION_MIN_SECONDS = Math.round(
  TIME_ALLOCATION.totalSeconds * TIME_ALLOCATION.simulationWeight
); // 510

/**
 * §2 Mandatory screen overlays. The hard stop is the load-bearing one: at
 * exactly second 90 the player freezes and locks, so the video cannot be
 * skipped and the learner is pushed into the simulation.
 */
const VIDEO_OVERLAYS = {
  continuousPhoneticGuide: { anchor: "lower-third", required: true },
  parallelTextBlocks: { left: "english-operational-metrics", right: "formal-spanish-commands" },
  hardCodedSystemStop: {
    atSecond: VIDEO_MAX_SECONDS,
    action: "freeze",
    lockControls: true,
    skippable: false,
    thenTransitTo: "simulation",
  },
};

/** §3 Appendix references used by the branching logic. */
const APPENDICES = {
  D: { id: "Appendix D", title: "The Bias Gate" },
  H: { id: "Appendix H", title: "Claim-Evidence-Decision Matrix" },
};

/**
 * §3A Technical stage mapping architecture.
 * `outcome` is what the engine does; the controller never invents its own.
 */
const STAGES = [
  {
    id: "ST-01",
    prompt: "Analyse the officer's verbal register in the traffic stop clip.",
    promptEs: "Analice el registro verbal del oficial en el video del control de tráfico.",
    branching:
      "If the command register matches 'Usted' formal guidelines, advance to the next node.",
    targetRatings: [4, 5],
    targetLabel: "Strong / Exemplary compliance standard",
    dimension: "Linguistic Accuracy",
    outcome: "advance",
  },
  {
    id: "ST-02",
    prompt:
      "Record the claim, the evidence behind it, and the decision it supports. Unverified assumptions trigger the Bias Gate.",
    promptEs:
      "Registre la afirmación, la evidencia que la respalda y la decisión resultante. Las suposiciones sin verificar activan la Puerta de Sesgo.",
    branching:
      "Trigger 'The Bias Gate' (Appendix D pop-up). Freeze screen. Button locks until the user enters evidence.",
    metric: "Mandatory data input validation loop.",
    dimension: "Fairness & Bias Awareness",
    appendix: APPENDICES.D.id,
    outcome: "bias-gate",
  },
  {
    id: "ST-03",
    prompt: "Submit the completed evaluation for compliance review.",
    promptEs: "Envíe la evaluación completa para la revisión de cumplimiento.",
    branching: "If validation checks fail, trigger the automatic risk escalation loop.",
    failRating: 1,
    failLabel: "Not Ready",
    outcome: "risk-escalation",
  },
];

/**
 * §3B Scorecard engine. `minimumRatingRequired` is a hard gate: a module is not
 * passed until every dimension meets its minimum.
 */
const EVALUATION_DIMENSIONS = [
  {
    dimension: "Fairness & Bias Awareness",
    minimumRatingRequired: 3,
    appendixReference: APPENDICES.D.id,
  },
  {
    dimension: "Linguistic Accuracy",
    minimumRatingRequired: 4,
    targetRegister: "Formal Usted Format",
  },
];

/** Rating vocabulary shared by the scorecard and the stage map. */
const RATING_LABELS = {
  5: "Exemplary",
  4: "Strong",
  3: "Proficient",
  2: "Developing",
  1: "Not Ready",
};

/**
 * §4 Deployment & SCORM compliance checklist. Surfaced through the API so the
 * admin console can show production readiness rather than it living in a doc.
 */
const DEPLOYMENT_CHECKLIST = [
  {
    id: "scorm-xapi",
    label: "SCORM 1.2 / xAPI integration",
    detail:
      "All dynamic scoring arrays from the EVALUATOR engine map directly into corporate LMS databases for institutional reporting.",
  },
  {
    id: "font-embedding",
    label: "Font embedding & vector locking",
    detail:
      "Typography assets stay hard-locked to preserve column boundaries on executive displays and administrative tables.",
  },
  {
    id: "ip-hardcoding",
    label: "Intellectual property hardcoding",
    detail: `The notice "${COPYRIGHT}" is rendered in the module UI header block.`,
  },
];

module.exports = {
  DOCUMENT_ID,
  AUTHOR,
  COMPANY,
  FRAMEWORK,
  COPYRIGHT,
  TIME_ALLOCATION,
  VIDEO_MAX_SECONDS,
  SIMULATION_MIN_SECONDS,
  VIDEO_OVERLAYS,
  APPENDICES,
  STAGES,
  EVALUATION_DIMENSIONS,
  RATING_LABELS,
  DEPLOYMENT_CHECKLIST,
};
