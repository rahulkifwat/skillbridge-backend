const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const bank = require("../data/spanishQuestionBank");
const { curriculumForProfile } = require("../data/spanishCurriculum");
const { SCENARIOS, getScenario, publicNode } = require("../data/spanishSimulations");
const store = require("../models/spanishAttemptStore");
const purchases = require("../models/spanishPurchaseStore");
const simulations = require("../models/spanishSimulationStore");
const {
  SKILLS,
  buildForm,
  buildProfile,
  feedbackForAnswers,
  publicItem,
  skillScores,
} = require("../utils/spanishAssessment");
const userModel = require("../models/userModel");

const stripeCheckout = require("../utils/stripeCheckout");
const { PRODUCTS } = stripeCheckout;

async function ownedAttempt(req, id) {
  const attempt = await store.getAttempt(id);
  if (!attempt || attempt.userId !== req.user.id) {
    throw ApiError.notFound("Spanish assessment attempt not found.");
  }
  return attempt;
}

function sectionPayload(attempt, skill) {
  const savedAnswers = attempt.answers || {};
  const savedArtifacts = attempt.artifacts || {};
  const items = (attempt.form || []).filter((item) => item.domain === skill).map(publicItem);
  const answers = {};
  const artifacts = {};
  for (const item of items) {
    if (savedAnswers[item.itemId] !== undefined) answers[item.itemId] = savedAnswers[item.itemId];
    if (savedArtifacts[item.itemId]) artifacts[item.itemId] = savedArtifacts[item.itemId];
  }
  return { skill, items, answers, artifacts };
}

async function fulfillStripeSession(session) {
  if (!stripeCheckout.paidSession(session)) return null;
  const productKey = session.metadata?.product;
  const userId = session.metadata?.userId || session.client_reference_id;
  const catalog = PRODUCTS[productKey];
  if (!catalog || !userId) return null;
  return purchases.recordPurchase({
    userId,
    product: catalog.product,
    amountUsd: catalog.amountUsd,
    stripeSessionId: session.id,
  });
}

const billing = asyncHandler(async (req, res) => {
  const entitlements = await purchases.entitlements(req.user.id);
  res.json({
    success: true,
    data: {
      ...entitlements,
      stripeConfigured: stripeCheckout.isConfigured(),
      publishableKey: stripeCheckout.isConfigured() ? require("../config/env").stripe.publishableKey : null,
      catalog: [
        { ...PRODUCTS.diagnostic, note: "One-time. Required before the six-skill diagnostic." },
        { ...PRODUCTS.membership, note: "Monthly. Unlocks curriculum, simulations and credentials." },
      ],
    },
  });
});

const checkout = asyncHandler(async (req, res) => {
  const key = String(req.body?.product || "");
  const product = PRODUCTS[key];
  if (!product) throw ApiError.badRequest("Unknown Spanish Academy product.");

  if (stripeCheckout.isConfigured()) {
    const session = await stripeCheckout.createEmbeddedSession({
      productKey: key,
      user: req.user,
    });
    return res.status(201).json({
      success: true,
      data: {
        provider: "stripe",
        sessionId: session.sessionId,
        clientSecret: session.clientSecret,
        publishableKey: session.publishableKey,
      },
    });
  }

  if (require("../config/env").nodeEnv === "production") {
    throw ApiError.badRequest(
      "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to the API .env."
    );
  }

  const record = await purchases.recordPurchase({
    userId: req.user.id,
    product: product.product,
    amountUsd: product.amountUsd,
  });
  const entitlements = await purchases.entitlements(req.user.id);
  return res.status(201).json({
    success: true,
    data: { purchase: record, entitlements, provider: "sandbox" },
  });
});

const confirmCheckout = asyncHandler(async (req, res) => {
  const sessionId = String(req.query.sessionId || req.body?.sessionId || "");
  if (!sessionId) throw ApiError.badRequest("Missing Stripe session.");
  const session = await stripeCheckout.retrieveSession(sessionId);
  if (!session) throw ApiError.badRequest("Stripe session not found.");
  if (session.metadata?.userId && session.metadata.userId !== req.user.id) {
    throw ApiError.forbidden("This Stripe session belongs to another account.");
  }
  await fulfillStripeSession(session);
  const entitlements = await purchases.entitlements(req.user.id);
  res.json({ success: true, data: { entitlements, provider: "stripe" } });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  let event;
  try {
    event = stripeCheckout.constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch {
    throw ApiError.badRequest("Invalid Stripe webhook signature.");
  }
  if (event.type === "checkout.session.completed") {
    await fulfillStripeSession(event.data.object);
  }
  res.json({ received: true });
});

const start = asyncHandler(async (req, res) => {
  const access = await purchases.entitlements(req.user.id);
  if (!access.diagnosticPaid) {
    throw ApiError.forbidden("Purchase the USD $25 Spanish diagnostic to begin.");
  }

  await userModel.setAcademy(req.user.id, "spanish");

  const { backgroundId, goalId } = req.body || {};
  const excludeItemIds = await store.usedItemIdsForUser(req.user.id);
  const { startLevel, specialty, form } = buildForm(bank, { backgroundId, goalId, excludeItemIds });
  if (!form.length) throw ApiError.badRequest("Spanish question bank is empty.");

  const attempt = await store.createAttempt({
    id: crypto.randomUUID(),
    academyId: "spanish-academy",
    userId: req.user.id,
    backgroundId: backgroundId || "never",
    goalId: goalId || "growth",
    startLevel,
    specialty,
    form,
    answers: {},
    artifacts: {},
    status: "in_progress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt.id,
      startLevel,
      specialty,
      skills: SKILLS,
      sections: SKILLS.map((skill) => ({
        skill,
        itemCount: attempt.form.filter((item) => item.domain === skill).length,
      })),
    },
  });
});

const section = asyncHandler(async (req, res) => {
  const skill = String(req.params.skill || "").toLowerCase();
  if (!SKILLS.includes(skill)) throw ApiError.badRequest("Unknown Spanish assessment skill.");
  const attempt = await ownedAttempt(req, req.params.attemptId);
  res.json({ success: true, data: sectionPayload(attempt, skill) });
});

const saveAnswers = asyncHandler(async (req, res) => {
  const attempt = await ownedAttempt(req, req.params.attemptId);
  if (attempt.status === "submitted") throw ApiError.conflict("This Spanish assessment is already submitted.");
  const incoming = req.body?.answers || {};
  const incomingArtifacts = req.body?.artifacts || {};
  const allowed = new Set(attempt.form.map((item) => item.itemId));
  const answers = { ...(attempt.answers || {}) };
  const artifacts = { ...(attempt.artifacts || {}) };
  for (const [itemId, value] of Object.entries(incoming)) {
    if (allowed.has(itemId)) answers[itemId] = value;
  }
  for (const [itemId, value] of Object.entries(incomingArtifacts)) {
    if (!allowed.has(itemId) || !value || typeof value !== "object") continue;
    artifacts[itemId] = {
      recorded: Boolean(value.recorded),
      durationMs: Math.min(600000, Math.max(0, Number(value.durationMs) || 0)),
    };
  }
  await store.updateAttempt(attempt.id, { answers, artifacts, updatedAt: new Date().toISOString() });
  const feedback = feedbackForAnswers(
    attempt.form.filter((item) => Object.prototype.hasOwnProperty.call(incoming, item.itemId)),
    answers,
    artifacts
  );
  res.json({ success: true, data: { saved: true, feedback } });
});

const review = asyncHandler(async (req, res) => {
  const attempt = await ownedAttempt(req, req.params.attemptId);
  const completion = SKILLS.map((skill) => {
    const items = attempt.form.filter((item) => item.domain === skill);
    const answered = items.filter((item) => {
      const value = (attempt.answers || {})[item.itemId];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });
    return { skill, total: items.length, answered: answered.length, complete: answered.length === items.length };
  });
  res.json({ success: true, data: { completion } });
});

const submit = asyncHandler(async (req, res) => {
  const attempt = await ownedAttempt(req, req.params.attemptId);
  const { bySkill, details } = skillScores(attempt.form, attempt.answers || {}, attempt.artifacts || {});
  const profile = buildProfile({
    fullName: req.user.fullName,
    specialty: attempt.specialty,
    startLevel: attempt.startLevel,
    scores: bySkill,
    details,
  });
  const learningPath = curriculumForProfile(profile);
  profile.learningPath = learningPath;
  await store.updateAttempt(attempt.id, {
    status: "submitted",
    scores: bySkill,
    profile,
    credential: profile.credential,
    updatedAt: new Date().toISOString(),
  });
  res.json({ success: true, data: { profile } });
});

const profile = asyncHandler(async (req, res) => {
  const attempt = await store.latestForUser(req.user.id);
  if (!attempt?.profile) throw ApiError.notFound("No Spanish profile found.");
  res.json({ success: true, data: { profile: attempt.profile, attemptId: attempt.id } });
});

const learning = asyncHandler(async (req, res) => {
  const attempt = await store.latestForUser(req.user.id);
  if (!attempt?.profile) throw ApiError.notFound("Complete the Spanish diagnostic first.");
  const access = await purchases.entitlements(req.user.id);
  const path = attempt.profile.learningPath || curriculumForProfile(attempt.profile);
  res.json({
    success: true,
    data: {
      membershipPaid: access.membershipPaid,
      curriculum: path,
      history: (await store.submittedForUser(req.user.id)).map((row) => ({
        attemptId: row.id,
        cefrLevel: row.profile?.cefrLevel,
        overallScore: row.profile?.overallScore,
        completedAt: row.updatedAt,
      })),
    },
  });
});

const listSimulations = asyncHandler(async (req, res) => {
  const attempt = await store.latestForUser(req.user.id);
  res.json({
    success: true,
    data: {
      engine: "master-simulation",
      recommendedSpecialty: attempt?.specialty || attempt?.profile?.specialty || null,
      scenarios: SCENARIOS.map((row) => ({
        scenarioId: row.scenarioId,
        trackId: row.trackId || row.specialty,
        title: row.title,
        specialty: row.specialty,
        objective: row.objective,
      })),
    },
  });
});

const startSimulation = asyncHandler(async (req, res) => {
  const access = await purchases.entitlements(req.user.id);
  if (!access.membershipPaid) throw ApiError.forbidden("Spanish Academy membership is required for simulations.");
  const scenario = getScenario(req.body?.scenarioId);
  const run = await simulations.createRun({
    id: crypto.randomUUID(),
    userId: req.user.id,
    scenarioId: scenario.scenarioId,
    nodeId: scenario.start,
    history: [],
    score: 0,
    status: "in_progress",
    updatedAt: new Date().toISOString(),
  });
  res.status(201).json({ success: true, data: { runId: run.id, ...publicNode(scenario, run.nodeId, 0) } });
});

const chooseSimulation = asyncHandler(async (req, res) => {
  const run = await simulations.getRun(req.params.runId);
  if (!run || run.userId !== req.user.id) throw ApiError.notFound("Simulation not found.");
  if (run.status === "complete") throw ApiError.conflict("This simulation is already complete.");
  const scenario = getScenario(run.scenarioId);
  const node = scenario.nodes[run.nodeId];
  const option = (node.options || []).find((entry) => entry.id === req.body?.optionId);
  if (!option) throw ApiError.badRequest("Unknown simulation choice.");
  const score = (run.score || 0) + option.score;
  const history = [...(run.history || []), { from: run.nodeId, optionId: option.id, score: option.score }];
  const complete = Boolean(scenario.nodes[option.next].complete);
  const updated = await simulations.updateRun(run.id, {
    nodeId: option.next,
    history,
    score,
    status: complete ? "complete" : "in_progress",
    updatedAt: new Date().toISOString(),
  });
  res.json({ success: true, data: { runId: updated.id, ...publicNode(scenario, updated.nodeId, score) } });
});

const credentials = asyncHandler(async (req, res) => {
  const rows = await store.submittedForUser(req.user.id);
  res.json({
    success: true,
    data: {
      credentials: rows.map((row) => row.credential || row.profile?.credential).filter(Boolean),
    },
  });
});

module.exports = {
  billing,
  checkout,
  start,
  section,
  saveAnswers,
  review,
  submit,
  profile,
  learning,
  listSimulations,
  startSimulation,
  chooseSimulation,
  credentials,
  confirmCheckout,
  stripeWebhook,
};
