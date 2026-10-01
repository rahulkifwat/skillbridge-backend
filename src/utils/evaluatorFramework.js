const blueprint = require("../data/productionBlueprint");

/**
 * EVALUATOR Framework™ scorecard engine (blueprint §3).
 *
 * Ratings are 1–5. A module passes only when every dimension in
 * EVALUATION_DIMENSIONS meets its `minimumRatingRequired` — Fairness & Bias
 * Awareness ≥ 3 and Linguistic Accuracy ≥ 4.
 */

// Formal usted imperatives drawn from the Unit 1 command tables.
const USTED_CUES = [
  "usted", "salga", "mantenga", "apague", "ponga", "permanezca", "deme",
  "siga", "camine", "hable", "explique", "quédese", "quedese", "dígame",
  "digame", "comprende", "entiende", "necesito que", "por favor", "le explicaré",
  "le explicare", "no se mueva", "no haga", "no empiece", "no mueva",
];

// Tú forms and slang the blueprint's demo officer uses; these are the error.
// Matching is word-bounded, so "mantén" here never fires on "mantenga".
const INFORMAL_CUES = [
  "tú", "tu", "te", "dame", "sal del", "mantén", "manten", "apaga", "pon las",
  "haz", "mira", "ven", "oye", "entendiste", "muévete", "muevete",
  "no te muevas", "haz lo que te digo",
];

// Inference language Lessons 2 and 6 teach students to remove.
const INFERENCE_CUES = [
  "obviamente", "claramente", "seguro que", "sé que", "se que", "culpable",
  "miente", "mintiendo", "mentira", "peligroso", "quería escapar",
  "queria escapar", "parecía nervioso", "parecia nervioso", "estaba borracho",
];

// Spanish letters, so cue boundaries do not fall inside an accented word.
const LETTER = "a-záéíóúüñ";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-bounded cue match. Plain `includes` would score the formal "mantenga"
 * as the informal "mantén", and "te" would fire inside "permanente"; JS \b is
 * ASCII-only, so the boundaries are spelled out against the Spanish alphabet.
 */
function includesAny(text, cues) {
  const haystack = String(text || "").toLowerCase();
  if (!haystack) return false;
  return cues.some((cue) => {
    const pattern = new RegExp(`(?<![${LETTER}])${escapeRegex(cue)}(?![${LETTER}])`, "i");
    return pattern.test(haystack);
  });
}

function nonEmpty(value) {
  return String(value || "").trim().length > 0;
}

function clampRating(value) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

/**
 * ST-01 — did the learner spot the informal register and repair it in the
 * formal usted format? Scores the Linguistic Accuracy dimension.
 */
function scoreRegisterStage(submission = {}) {
  const identified = String(submission.registerAssessment || "").toLowerCase() === "informal";
  const correction = String(submission.correction || "").trim();
  const usesUsted = includesAny(correction, USTED_CUES);
  const usesInformal = includesAny(correction, INFORMAL_CUES);

  let rating;
  const notes = [];

  if (!identified && !correction) {
    rating = 1;
    notes.push("No analysis submitted for the officer's verbal register.");
  } else if (!identified) {
    rating = 2;
    notes.push(
      "The clip demonstrates an informal street register. Re-watch and compare it with the formal usted commands."
    );
  } else if (!correction) {
    rating = 3;
    notes.push("Register identified correctly. Now write the formal usted replacement command.");
  } else if (usesInformal && !usesUsted) {
    rating = 2;
    notes.push("The rewrite still uses tú forms. Level 1 requires the formal usted format.");
  } else if (usesUsted && !usesInformal) {
    rating = correction.split(/\s+/).length >= 4 ? 5 : 4;
    notes.push("Register identified and repaired in the formal usted format.");
  } else {
    rating = 3;
    notes.push("The rewrite mixes registers. Keep every command in the formal usted format.");
  }

  return {
    stageId: "ST-01",
    rating: clampRating(rating),
    dimension: "Linguistic Accuracy",
    advance: rating >= 4,
    notes,
  };
}

/**
 * ST-02 — the Appendix H Claim-Evidence-Decision matrix, policed by the
 * Appendix D Bias Gate. Any claim submitted without evidence freezes the
 * screen and locks the continue button until evidence is entered.
 */
function scoreBiasStage(submission = {}) {
  const rows = Array.isArray(submission.matrix) ? submission.matrix : [];
  const populated = rows.filter((row) => nonEmpty(row.claim));

  const unsupported = populated.filter((row) => !nonEmpty(row.evidence));
  const undecided = populated.filter((row) => !nonEmpty(row.decision));
  const inferential = populated.filter(
    (row) => includesAny(row.claim, INFERENCE_CUES) || includesAny(row.decision, INFERENCE_CUES)
  );

  // The gate is the blueprint's mandatory data-input validation loop.
  const biasGate = {
    triggered: unsupported.length > 0,
    appendix: blueprint.APPENDICES.D.id,
    title: blueprint.APPENDICES.D.title,
    freezeScreen: unsupported.length > 0,
    continueLocked: unsupported.length > 0,
    unresolvedClaims: unsupported.map((row) => String(row.claim).trim()),
    message:
      unsupported.length > 0
        ? "Every claim needs recorded evidence before the evaluation can continue."
        : null,
  };

  const notes = [];
  let rating;

  if (!populated.length) {
    rating = 1;
    notes.push("No claims recorded in the Claim-Evidence-Decision matrix.");
  } else if (unsupported.length) {
    rating = 2;
    notes.push(
      `${unsupported.length} claim(s) rely on unverified assumptions. Record the evidence for each one.`
    );
  } else if (inferential.length) {
    rating = 3;
    notes.push(
      "Evidence is present, but some wording states an interpretation rather than an observation."
    );
  } else if (undecided.length) {
    rating = 3;
    notes.push("Each supported claim still needs the decision it leads to.");
  } else {
    rating = populated.length >= 3 ? 5 : 4;
    notes.push("Claims, evidence and decisions are separated cleanly.");
  }

  return {
    stageId: "ST-02",
    rating: clampRating(rating),
    dimension: "Fairness & Bias Awareness",
    advance: !biasGate.triggered && rating >= 3,
    biasGate,
    notes,
  };
}

/** Rolls the per-stage ratings up into the dimension scorecard. */
function buildScorecard(stageResults) {
  return blueprint.EVALUATION_DIMENSIONS.map((dimension) => {
    const contributing = stageResults.filter((row) => row.dimension === dimension.dimension);
    const rating = contributing.length
      ? clampRating(
          contributing.reduce((sum, row) => sum + row.rating, 0) / contributing.length
        )
      : 1;
    return {
      ...dimension,
      rating,
      label: blueprint.RATING_LABELS[rating],
      met: rating >= dimension.minimumRatingRequired,
    };
  });
}

/**
 * ST-03 — compliance review. Failing validation triggers the automatic risk
 * escalation loop and a Rating 1 (Not Ready).
 *
 * The blueprint words the consequence as "System locks user profile". This
 * engine scopes the lock to the module rather than the account: a learner who
 * fails one compliance review is held for remediation on LE-L1-U*, not signed
 * out of the platform. Account-level lockout is a product decision that needs
 * an explicit owner, and it contradicts the Spanish Academy brief's rule that
 * assessment "is not designed to eliminate the student".
 */
function reviewCompliance(stageResults, moduleId) {
  const scorecard = buildScorecard(stageResults);
  const unmet = scorecard.filter((row) => !row.met);
  const openGate = stageResults.find((row) => row.biasGate?.triggered);
  const failures = [];

  if (openGate) failures.push("The Appendix D Bias Gate is still open.");
  for (const row of unmet) {
    failures.push(
      `${row.dimension} scored ${row.rating}; this module requires ${row.minimumRatingRequired}.`
    );
  }

  const passed = failures.length === 0;
  const rating = passed
    ? clampRating(scorecard.reduce((sum, row) => sum + row.rating, 0) / scorecard.length)
    : 1;

  return {
    stageId: "ST-03",
    passed,
    rating,
    label: blueprint.RATING_LABELS[rating],
    scorecard,
    failures,
    riskEscalation: passed
      ? null
      : {
          triggered: true,
          reason: failures,
          // Scoped hold — see the note on this function.
          remediationHold: {
            scope: "module",
            moduleId,
            status: "held",
            releasableBy: ["instructor", "administrator", "super_admin"],
          },
        },
  };
}

module.exports = {
  USTED_CUES,
  INFORMAL_CUES,
  INFERENCE_CUES,
  scoreRegisterStage,
  scoreBiasStage,
  buildScorecard,
  reviewCompliance,
};
