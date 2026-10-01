const mongoose = require("mongoose");
const { BlueprintSession } = require("./schemas");

/**
 * Sessions for Production Master Blueprint modules. Mirrors the store pattern
 * used elsewhere: Mongo when connected, an in-process Map otherwise so the
 * offline test suite runs without a database.
 */
const sessions = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return {
    ...rest,
    stageResults: Array.isArray(rest.stageResults) ? rest.stageResults : [],
    review: rest.review || null,
  };
}

async function createSession(record) {
  if (useMongo()) {
    const created = await BlueprintSession.create(record);
    return fromDoc(created.toObject());
  }
  sessions.set(record.id, { ...record });
  return fromDoc(sessions.get(record.id));
}

async function getSession(id) {
  if (useMongo()) {
    return fromDoc(await BlueprintSession.findOne({ id }).lean());
  }
  return fromDoc(sessions.get(id));
}

async function updateSession(id, patch) {
  if (useMongo()) {
    return fromDoc(
      await BlueprintSession.findOneAndUpdate(
        { id },
        { $set: { ...patch, updatedAt: new Date() } },
        { new: true }
      ).lean()
    );
  }
  const current = sessions.get(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date() };
  sessions.set(id, next);
  return fromDoc(next);
}

async function listForUser(userId) {
  if (useMongo()) {
    const rows = await BlueprintSession.find({ userId }).sort({ updatedAt: -1 }).lean();
    return rows.map(fromDoc);
  }
  return [...sessions.values()]
    .filter((row) => row.userId === userId)
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
    .map(fromDoc);
}

/** Any module the learner is currently held on, keyed by module id. */
async function activeHolds(userId) {
  const rows = await listForUser(userId);
  const holds = new Map();
  for (const row of rows) {
    const hold = row.review?.riskEscalation?.remediationHold;
    if (!hold) continue;
    // Later sessions win, so a release or a re-pass clears an earlier hold.
    if (!holds.has(hold.moduleId)) holds.set(hold.moduleId, { ...hold, sessionId: row.id });
  }
  return [...holds.values()].filter((hold) => hold.status === "held");
}

function resetStore() {
  sessions.clear();
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  listForUser,
  activeHolds,
  resetStore,
};
