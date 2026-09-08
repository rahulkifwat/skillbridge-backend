const mongoose = require("mongoose");
const { SpanishAttempt } = require("./schemas");

const attempts = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return {
    ...rest,
    answers: rest.answers && typeof rest.answers === "object" ? rest.answers : {},
    artifacts: rest.artifacts && typeof rest.artifacts === "object" ? rest.artifacts : {},
    form: Array.isArray(rest.form) ? rest.form : [],
  };
}

async function createAttempt(record) {
  const next = { ...record };
  if (useMongo()) {
    const created = await SpanishAttempt.create(next);
    return fromDoc(created.toObject());
  }
  attempts.set(next.id, next);
  return fromDoc(next);
}

async function getAttempt(id) {
  if (useMongo()) {
    const document = await SpanishAttempt.findOne({ id }).lean();
    return fromDoc(document);
  }
  return fromDoc(attempts.get(id));
}

async function updateAttempt(id, patch) {
  if (useMongo()) {
    const document = await SpanishAttempt.findOneAndUpdate(
      { id },
      { $set: { ...patch, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return fromDoc(document);
  }
  const current = attempts.get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  attempts.set(id, next);
  return fromDoc(next);
}

async function latestForUser(userId) {
  if (useMongo()) {
    const document = await SpanishAttempt.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    return fromDoc(document);
  }
  const matches = [...attempts.values()]
    .filter((record) => record.userId === userId)
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  return fromDoc(matches[0]);
}

async function usedItemIdsForUser(userId) {
  if (useMongo()) {
    const documents = await SpanishAttempt.find({ userId, status: "submitted" }).select("form").lean();
    return new Set(documents.flatMap((record) => (record.form || []).map((item) => item.itemId)));
  }
  return new Set(
    [...attempts.values()]
      .filter((record) => record.userId === userId && record.status === "submitted")
      .flatMap((record) => (record.form || []).map((item) => item.itemId))
  );
}

async function submittedForUser(userId) {
  if (useMongo()) {
    return SpanishAttempt.find({ userId, status: "submitted" }).sort({ updatedAt: -1 }).lean().then((rows) =>
      rows.map(fromDoc)
    );
  }
  return [...attempts.values()]
    .filter((record) => record.userId === userId && record.status === "submitted")
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

function resetStore() {
  attempts.clear();
}

module.exports = {
  createAttempt,
  getAttempt,
  updateAttempt,
  latestForUser,
  usedItemIdsForUser,
  submittedForUser,
  resetStore,
};
