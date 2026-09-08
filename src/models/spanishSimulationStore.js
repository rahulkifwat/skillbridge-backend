const mongoose = require("mongoose");
const { SpanishSimulation } = require("./schemas");

const runs = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return rest;
}

async function createRun(record) {
  if (useMongo()) {
    const created = await SpanishSimulation.create(record);
    return fromDoc(created.toObject());
  }
  runs.set(record.id, record);
  return record;
}

async function getRun(id) {
  if (useMongo()) {
    return fromDoc(await SpanishSimulation.findOne({ id }).lean());
  }
  return runs.get(id) || null;
}

async function updateRun(id, patch) {
  if (useMongo()) {
    return fromDoc(
      await SpanishSimulation.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean()
    );
  }
  const current = runs.get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  runs.set(id, next);
  return next;
}

async function latestForUser(userId) {
  if (useMongo()) {
    return fromDoc(await SpanishSimulation.findOne({ userId }).sort({ updatedAt: -1 }).lean());
  }
  return [...runs.values()]
    .filter((row) => row.userId === userId)
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))[0] || null;
}

function resetStore() {
  runs.clear();
}

module.exports = { createRun, getRun, updateRun, latestForUser, resetStore };
