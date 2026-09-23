const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const purchases = require("../models/spanishPurchaseStore");
const sessions = require("../models/simulationSessionStore");
const assignments = require("../models/simulationAssignmentStore");
const userModel = require("../models/userModel");
const programs = require("../data/spanishPrograms");
const catalog = require("../data/simulationScenarios");
const { adaptOpening, nextCollected, pickReply } = require("../utils/simulationOrchestrator");
const { evaluateSession, studentFeedback } = require("../utils/simulationEvaluation");
const { videoForSimulation } = require("../data/spanishVideos");
const videoProgress = require("../models/spanishVideoProgressStore");
const { assertVideoUnlock } = require("../controllers/spanishVideoController");
const { generateScenarioVariation, llmConfigured } = require("../utils/scenarioAi");
const { productionFlags } = require("../utils/videoProduction");
const { scorePronunciation } = require("../utils/pronunciation");
const { atmosphereFor } = require("../data/simulationAtmosphere");

function publicSession(row, extra = {}) {
  return {
    session_id: row.id,
    status: row.status,
    simulation_id: row.simulationId,
    interaction_mode: "speech_text",
    turn_number: row.turnNumber,
    variation_id: row.variationId,
    variation: row.variationMeta || null,
    collected: row.collected,
    pronunciation: row.lastPronunciation || null,
    ...extra,
  };
}

async function requireMembership(userId) {
  const access = await purchases.entitlements(userId);
  if (!access.membershipPaid) {
    throw ApiError.forbidden("Spanish Academy membership is required for Simulation Master.");
  }
}

async function ownedSession(req, sessionId) {
  const row = await sessions.getSession(sessionId);
  if (!row || row.userId !== req.user.id) throw ApiError.notFound("Simulation session not found.");
  return row;
}

const listPrograms = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: programs.catalog() });
});

const listSimulations = asyncHandler(async (req, res) => {
  const assigned = await assignments.listForStudent(req.user.id);
  const assignedIds = new Set(assigned.map((row) => row.simulationId));
  const history = await sessions.listForUser(req.user.id);
  const masteryBySim = {};
  for (const row of history) {
    if (row.evaluation && !masteryBySim[row.simulationId]) {
      masteryBySim[row.simulationId] = row.evaluation.mastery_status;
    }
  }
  const items = catalog.listPublished({
    academy: req.query.academy,
    program: req.query.program,
    level: req.query.level,
  });
  const unlocked = new Set(await videoProgress.completedSimulationIds(req.user.id));
  res.json({
    success: true,
    data: {
      engine: "simulation-master",
      videoGate: true,
      production: productionFlags(),
      llm: llmConfigured() ? "live" : "curriculum-engine",
      simulations: items.map((row) => ({
        ...catalog.publicScenario(row),
        assigned: assignedIds.has(row.id),
        mastery_status: masteryBySim[row.id] || null,
        required_video_id: videoForSimulation(row.id)?.id || null,
        unlocked: unlocked.has(row.id),
        atmosphere: atmosphereFor(row.programId),
      })),
    },
  });
});

const getSimulation = asyncHandler(async (req, res) => {
  const row = catalog.getScenario(req.params.simulationId);
  if (!row) throw ApiError.notFound("Simulation not found.");
  res.json({ success: true, data: catalog.publicScenario(row) });
});

const startSimulation = asyncHandler(async (req, res) => {
  await requireMembership(req.user.id);
  const scenario = catalog.getScenario(req.params.simulationId);
  if (!scenario) throw ApiError.notFound("Simulation not found.");
  await assertVideoUnlock(req.user.id, scenario.id);
  const history = await sessions.listForUser(req.user.id);
  const previous = history.find((row) => row.simulationId === scenario.id);
  const variation = await generateScenarioVariation(scenario, previous?.variationId);
  const opening = adaptOpening(scenario, variation, req.body?.learnerLevel);
  const record = await sessions.createSession({
    id: crypto.randomUUID(),
    userId: req.user.id,
    simulationId: scenario.id,
    variationId: variation.id,
    variationMeta: variation,
    status: "active",
    turnNumber: 1,
    collected: [],
    turns: [{ role: "assistant", content: opening, at: new Date().toISOString() }],
    evaluation: null,
    feedback: null,
    previousSessionId: null,
    lastPronunciation: null,
    updatedAt: new Date().toISOString(),
  });
  res.status(201).json({
    success: true,
    data: publicSession(record, {
      initial_message: opening,
      atmosphere: atmosphereFor(scenario.programId),
      master_script: scenario.masterScript || [],
    }),
  });
});

async function finishSession(row, scenario) {
  const evaluation = evaluateSession(scenario, row.turns, row.collected);
  const feedback = studentFeedback(evaluation);
  return sessions.updateSession(row.id, {
    status: "complete",
    evaluation,
    feedback,
    updatedAt: new Date().toISOString(),
  });
}

const submitResponse = asyncHandler(async (req, res) => {
  const row = await ownedSession(req, req.params.sessionId);
  if (row.status === "complete") throw ApiError.conflict("This simulation session is already complete.");
  const scenario = catalog.getScenario(row.simulationId, { includeUnpublished: true });
  if (!scenario) throw ApiError.notFound("Scenario is no longer available.");
  const content = String(req.body?.content || "").trim();
  if (!content) throw ApiError.badRequest("Enter a Spanish response.");
  const pronunciation = scorePronunciation(content, scenario.masterScript || scenario.targetVocabulary || []);
  const collected = nextCollected(scenario, row.collected, content);
  const turnNumber = (row.turnNumber || 1) + 1;
  const orchestrated = pickReply(scenario, collected, content, turnNumber);
  const turns = [
    ...(row.turns || []),
    { role: "student", content, at: new Date().toISOString(), response_type: req.body?.response_type || "text" },
    { role: "assistant", content: orchestrated.assistant_message, at: new Date().toISOString() },
  ];
  let updated = await sessions.updateSession(row.id, {
    collected,
    turnNumber,
    turns,
    lastPronunciation: pronunciation,
    updatedAt: new Date().toISOString(),
  });
  if (orchestrated.completion_candidate || turnNumber >= (scenario.maxTurns || 8)) {
    updated = await finishSession(updated, scenario);
  }
  res.json({
    success: true,
    data: {
      ...publicSession(updated, {
        assistant_message: orchestrated.assistant_message,
        completion_candidate: orchestrated.completion_candidate,
        safety_flag: orchestrated.safety_flag,
        pronunciation,
      }),
      evaluation: updated.evaluation,
      feedback: updated.feedback,
    },
  });
});

const completeSession = asyncHandler(async (req, res) => {
  const row = await ownedSession(req, req.params.sessionId);
  const scenario = catalog.getScenario(row.simulationId, { includeUnpublished: true });
  const updated = row.status === "complete" ? row : await finishSession(row, scenario);
  res.json({ success: true, data: publicSession(updated, { evaluation: updated.evaluation, feedback: updated.feedback }) });
});

const retrySession = asyncHandler(async (req, res) => {
  await requireMembership(req.user.id);
  const row = await ownedSession(req, req.params.sessionId);
  const scenario = catalog.getScenario(row.simulationId);
  if (!scenario) throw ApiError.notFound("Simulation not found.");
  await assertVideoUnlock(req.user.id, scenario.id);
  const variation = await generateScenarioVariation(scenario, row.variationId);
  const opening = adaptOpening(scenario, variation, req.body?.learnerLevel);
  const created = await sessions.createSession({
    id: crypto.randomUUID(),
    userId: req.user.id,
    simulationId: scenario.id,
    variationId: variation.id,
    variationMeta: variation,
    status: "active",
    turnNumber: 1,
    collected: [],
    turns: [{ role: "assistant", content: opening, at: new Date().toISOString() }],
    evaluation: null,
    feedback: null,
    previousSessionId: row.id,
    lastPronunciation: null,
    updatedAt: new Date().toISOString(),
  });
  res.status(201).json({
    success: true,
    data: publicSession(created, {
      initial_message: opening,
      retry: true,
      atmosphere: atmosphereFor(scenario.programId),
      master_script: scenario.masterScript || [],
    }),
  });
});

const getSession = asyncHandler(async (req, res) => {
  const row = await ownedSession(req, req.params.sessionId);
  const transcript = (row.turns || []).map((turn) => ({ role: turn.role, content: turn.content }));
  res.json({ success: true, data: publicSession(row, { transcript }) });
});

const getResults = asyncHandler(async (req, res) => {
  const row = await ownedSession(req, req.params.sessionId);
  if (!row.evaluation) throw ApiError.notFound("Complete the simulation to view results.");
  res.json({
    success: true,
    data: {
      scores: row.evaluation,
      feedback: row.feedback,
      mastery_status: row.evaluation.mastery_status,
    },
  });
});

const history = asyncHandler(async (req, res) => {
  const rows = await sessions.listForUser(req.user.id);
  res.json({
    success: true,
    data: {
      sessions: rows.map((row) => ({
        session_id: row.id,
        simulation_id: row.simulationId,
        status: row.status,
        mastery_status: row.evaluation?.mastery_status || null,
        overall_score: row.evaluation?.overall_score || null,
        updated_at: row.updatedAt,
      })),
    },
  });
});

const teacherStudents = asyncHandler(async (_req, res) => {
  const students = await userModel.listStudents();
  const all = await Promise.all(
    students.map(async (student) => {
      const rows = await sessions.listForUser(student.id);
      const complete = rows.filter((row) => row.evaluation);
      return {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        academy: student.academy,
        simulationsCompleted: complete.length,
        latestMastery: complete[0]?.evaluation?.mastery_status || null,
        needsIntervention: complete.some((row) => row.evaluation.mastery_status === "Needs Practice"),
      };
    })
  );
  res.json({ success: true, data: { students: all } });
});

const teacherStudentResults = asyncHandler(async (req, res) => {
  const rows = await sessions.listForUser(req.params.id);
  res.json({
    success: true,
    data: {
      results: rows
        .filter((row) => row.evaluation)
        .map((row) => ({
          session_id: row.id,
          simulation_id: row.simulationId,
          overall_score: row.evaluation.overall_score,
          mastery_status: row.evaluation.mastery_status,
          improvement_areas: row.evaluation.improvement_areas,
        })),
    },
  });
});

const createAssignment = asyncHandler(async (req, res) => {
  const simulationId = String(req.body?.simulationId || "");
  const studentId = String(req.body?.studentId || "");
  if (!catalog.getScenario(simulationId) || !studentId) {
    throw ApiError.badRequest("Provide a published simulation and student.");
  }
  const record = await assignments.createAssignment({
    id: crypto.randomUUID(),
    teacherId: req.user.id,
    studentId,
    simulationId,
    dueAt: req.body?.dueAt || null,
  });
  res.status(201).json({ success: true, data: { assignment: record } });
});

const teacherAnalytics = asyncHandler(async (_req, res) => {
  const students = await userModel.listStudents();
  let completed = 0;
  const mastery = {};
  for (const student of students) {
    const rows = await sessions.listForUser(student.id);
    for (const row of rows) {
      if (!row.evaluation) continue;
      completed += 1;
      const key = row.evaluation.mastery_status;
      mastery[key] = (mastery[key] || 0) + 1;
    }
  }
  res.json({
    success: true,
    data: { students: students.length, simulationsCompleted: completed, mastery },
  });
});

const createScenario = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.id || !payload.title) throw ApiError.badRequest("Scenario id and title are required.");
  const saved = catalog.upsertDraft({ ...payload, status: "draft", author: req.user.id });
  res.status(201).json({ success: true, data: catalog.publicScenario(saved) });
});

const updateScenario = asyncHandler(async (req, res) => {
  const current = catalog.getScenario(req.params.id, { includeUnpublished: true });
  if (!current) throw ApiError.notFound("Scenario not found.");
  if (current.status === "published") throw ApiError.conflict("Published scenarios are immutable. Create a new version.");
  const saved = catalog.upsertDraft({ ...current, ...req.body, id: current.id });
  res.json({ success: true, data: catalog.publicScenario(saved) });
});

const publishScenario = asyncHandler(async (req, res) => {
  const saved = catalog.publishScenario(req.params.id);
  if (!saved) throw ApiError.notFound("Scenario not found.");
  res.json({ success: true, data: catalog.publicScenario(saved) });
});

const archiveScenario = asyncHandler(async (req, res) => {
  const saved = catalog.archiveScenario(req.params.id);
  if (!saved) throw ApiError.notFound("Scenario not found.");
  res.json({ success: true, data: catalog.publicScenario(saved) });
});

const generateLayout = asyncHandler(async (req, res) => {
  const simulationId = String(req.body?.simulationId || req.body?.scenarioId || "").trim();
  const scenario = catalog.getScenario(simulationId);
  if (!scenario) throw ApiError.notFound("Simulation not found.");
  await requireMembership(req.user.id);
  await assertVideoUnlock(req.user.id, scenario.id);
  const variation = await generateScenarioVariation(scenario, req.body?.previousVariationId);
  res.json({
    success: true,
    data: {
      engine: llmConfigured() ? "openai-claude" : "curriculum-engine",
      production: productionFlags(),
      simulation_id: scenario.id,
      curriculum: {
        program_id: scenario.programId,
        cefr: scenario.cefr,
        target_vocabulary: scenario.targetVocabulary,
        objectives: (scenario.objectives || []).map((item) => item.label),
      },
      variation,
      atmosphere: atmosphereFor(scenario.programId),
    },
  });
});

module.exports = {
  listPrograms,
  listSimulations,
  getSimulation,
  startSimulation,
  submitResponse,
  completeSession,
  retrySession,
  getSession,
  getResults,
  history,
  teacherStudents,
  teacherStudentResults,
  createAssignment,
  teacherAnalytics,
  createScenario,
  updateScenario,
  publishScenario,
  archiveScenario,
  generateLayout,
};
