const crypto = require("node:crypto");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const blueprint = require("../data/productionBlueprint");
const { buildModule, listModules, moduleIdFor } = require("../utils/blueprintModule");
const {
  scoreRegisterStage,
  scoreBiasStage,
  reviewCompliance,
} = require("../utils/evaluatorFramework");
const { toScorm12, toXapiStatements } = require("../utils/scormExport");
const store = require("../models/blueprintSessionStore");
const { getLesson } = require("../data/lawEnforcementUnit1");

const STAGE_ORDER = blueprint.STAGES.map((stage) => stage.id);

function nextStageAfter(stageId) {
  const index = STAGE_ORDER.indexOf(stageId);
  return index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null;
}

/** Module catalogue plus the split rule, for the module index screen. */
const listAll = asyncHandler(async (req, res) => {
  const holds = await store.activeHolds(req.user.id);
  const heldIds = new Set(holds.map((hold) => hold.moduleId));
  res.json({
    success: true,
    data: {
      documentId: blueprint.DOCUMENT_ID,
      framework: blueprint.FRAMEWORK,
      copyright: blueprint.COPYRIGHT,
      timeAllocation: blueprint.TIME_ALLOCATION,
      modules: listModules().map((row) => ({ ...row, held: heldIds.has(row.moduleID) })),
      deploymentChecklist: blueprint.DEPLOYMENT_CHECKLIST,
    },
  });
});

const getModule = asyncHandler(async (req, res) => {
  const module = buildModule(req.params.lessonId);
  if (!module) throw ApiError.notFound("Module not found.");
  res.json({ success: true, data: module });
});

/** Opens a session. A held module cannot be restarted until an instructor releases it. */
const startSession = asyncHandler(async (req, res) => {
  const lesson = getLesson(req.params.lessonId);
  if (!lesson) throw ApiError.notFound("Module not found.");
  const moduleId = moduleIdFor(lesson.number);

  const holds = await store.activeHolds(req.user.id);
  if (holds.some((hold) => hold.moduleId === moduleId)) {
    throw ApiError.forbidden(
      "This module is held for remediation. An instructor must release it before you retry."
    );
  }

  const session = await store.createSession({
    id: crypto.randomUUID(),
    userId: req.user.id,
    moduleId,
    lessonId: lesson.id,
    courseTitle: buildModule(lesson.id).moduleConfiguration.courseTitle,
    status: "video",
    currentStageId: STAGE_ORDER[0],
    videoCompletedAt: null,
    elapsedSeconds: 0,
    stageResults: [],
    review: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  res.status(201).json({ success: true, data: { session, module: buildModule(lesson.id) } });
});

async function loadOwnedSession(req) {
  const session = await store.getSession(req.params.sessionId);
  if (!session) throw ApiError.notFound("Session not found.");
  if (session.userId !== req.user.id) throw ApiError.forbidden("Not your session.");
  return session;
}

/**
 * The hard-coded system stop. The client reports playback position; the server
 * decides when the observation phase is satisfied. Anything at or past second
 * 90 completes the phase, and nothing short of it does — a client that claims
 * an early finish is rejected rather than trusted.
 */
const recordVideoPosition = asyncHandler(async (req, res) => {
  const session = await loadOwnedSession(req);
  if (session.status !== "video") {
    return res.json({ success: true, data: { session, hardStop: null } });
  }

  const position = Number(req.body?.positionSec);
  if (!Number.isFinite(position) || position < 0) {
    throw ApiError.badRequest("positionSec must be a number of seconds.");
  }

  const limit = blueprint.VIDEO_MAX_SECONDS;
  const reached = position >= limit;
  const clamped = Math.min(position, limit);

  const patch = { elapsedSeconds: Math.max(session.elapsedSeconds || 0, clamped) };
  if (reached) {
    patch.status = "simulation";
    patch.videoCompletedAt = new Date();
  }
  const updated = await store.updateSession(session.id, patch);

  res.json({
    success: true,
    data: {
      session: updated,
      hardStop: reached
        ? {
            ...blueprint.VIDEO_OVERLAYS.hardCodedSystemStop,
            reached: true,
            message: "Observation phase complete. Continue into the simulation.",
          }
        : { ...blueprint.VIDEO_OVERLAYS.hardCodedSystemStop, reached: false },
    },
  });
});

/** ST-01 and ST-02 submissions. */
const submitStage = asyncHandler(async (req, res) => {
  const session = await loadOwnedSession(req);
  const stageId = String(req.params.stageId || "").toUpperCase();

  if (session.status === "video") {
    throw ApiError.forbidden("Finish the 90-second observation phase before the simulation.");
  }
  if (session.status === "complete") throw ApiError.badRequest("This session is already complete.");
  if (!STAGE_ORDER.includes(stageId)) throw ApiError.notFound("Unknown stage.");
  if (stageId === "ST-03") {
    throw ApiError.badRequest("ST-03 is the compliance review; submit it to /review.");
  }

  const result =
    stageId === "ST-01" ? scoreRegisterStage(req.body) : scoreBiasStage(req.body);

  const stageResults = [
    ...(session.stageResults || []).filter((row) => row.stageId !== stageId),
    result,
  ].sort((left, right) => STAGE_ORDER.indexOf(left.stageId) - STAGE_ORDER.indexOf(right.stageId));

  // The Bias Gate is the blueprint's only hard lock — it freezes the screen and
  // locks the button until evidence is entered. A weak ST-01 does not trap the
  // learner: they may revise any stage and move on, and ST-03 is where the
  // dimension minimums are enforced and the risk escalation loop fires. Gating
  // every stage on its own minimum would make ST-03 unreachable.
  const gateOpen = stageResults.some((row) => row.biasGate?.triggered);
  const furthest = gateOpen ? "ST-02" : nextStageAfter(stageId) || stageId;

  const updated = await store.updateSession(session.id, {
    stageResults,
    currentStageId: furthest,
  });

  res.json({ success: true, data: { session: updated, result } });
});

/** ST-03 — compliance review, risk escalation, and the LMS payloads. */
const submitReview = asyncHandler(async (req, res) => {
  const session = await loadOwnedSession(req);
  if (session.status === "video") {
    throw ApiError.forbidden("Finish the 90-second observation phase before the simulation.");
  }

  if (session.status === "complete") throw ApiError.badRequest("This session is already complete.");

  const done = new Set((session.stageResults || []).map((row) => row.stageId));
  const missing = STAGE_ORDER.filter((id) => id !== "ST-03" && !done.has(id));
  if (missing.length) throw ApiError.badRequest(`Complete ${missing.join(", ")} first.`);

  // Appendix D: the continue button stays locked until evidence is entered, so
  // an open Bias Gate blocks the review rather than failing it. Escalating here
  // would punish a learner the gate is meant to stop and redirect.
  const openGate = (session.stageResults || []).find((row) => row.biasGate?.triggered);
  if (openGate) {
    throw ApiError.badRequest(
      "The Appendix D Bias Gate is open. Record evidence for every claim before submitting for review."
    );
  }

  const review = reviewCompliance(session.stageResults, session.moduleId);
  const updated = await store.updateSession(session.id, {
    review,
    status: "complete",
    currentStageId: "ST-03",
  });

  res.json({
    success: true,
    data: {
      session: updated,
      review,
      lms: { scorm12: toScorm12(updated), xapi: toXapiStatements(updated) },
    },
  });
});

const getSession = asyncHandler(async (req, res) => {
  const session = await loadOwnedSession(req);
  res.json({ success: true, data: { session, module: buildModule(session.lessonId) } });
});

/** LMS export for one finished session. */
const exportLms = asyncHandler(async (req, res) => {
  const session = await loadOwnedSession(req);
  if (!session.review) throw ApiError.badRequest("Session has no compliance review yet.");
  res.json({
    success: true,
    data: { scorm12: toScorm12(session), xapi: toXapiStatements(session) },
  });
});

/** Instructors release a remediation hold so the learner can retry. */
const releaseHold = asyncHandler(async (req, res) => {
  const session = await store.getSession(req.params.sessionId);
  if (!session) throw ApiError.notFound("Session not found.");
  if (!session.review?.riskEscalation?.remediationHold) {
    throw ApiError.badRequest("This session has no remediation hold.");
  }

  const review = {
    ...session.review,
    riskEscalation: {
      ...session.review.riskEscalation,
      remediationHold: {
        ...session.review.riskEscalation.remediationHold,
        status: "released",
        releasedBy: req.user.id,
        releasedAt: new Date().toISOString(),
        note: String(req.body?.note || "").slice(0, 500) || null,
      },
    },
  };

  const updated = await store.updateSession(session.id, { review });
  res.json({ success: true, data: { session: updated } });
});

module.exports = {
  listAll,
  getModule,
  startSession,
  recordVideoPosition,
  submitStage,
  submitReview,
  getSession,
  exportLms,
  releaseHold,
};
