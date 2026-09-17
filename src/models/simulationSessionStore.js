const mongoose = require("mongoose");
const { SimulationSession } = require("./schemas");

const sessions = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return rest;
}

async function createSession(record) {
  if (useMongo()) {
    const created = await SimulationSession.create(record);
    return fromDoc(created.toObject());
  }
  sessions.set(record.id, record);
  return record;
}

async function getSession(id) {
  if (useMongo()) {
    return fromDoc(await SimulationSession.findOne({ id }).lean());
  }
  return sessions.get(id) || null;
}

async function updateSession(id, patch) {
  if (useMongo()) {
    return fromDoc(
      await SimulationSession.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean()
    );
  }
  const current = sessions.get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  sessions.set(id, next);
  return next;
}

async function listForUser(userId) {
  if (useMongo()) {
    return (await SimulationSession.find({ userId }).sort({ updatedAt: -1 }).lean()).map(fromDoc);
  }
  return [...sessions.values()]
    .filter((row) => row.userId === userId)
    .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
}

function resetStore() {
  sessions.clear();
}

module.exports = { createSession, getSession, updateSession, listForUser, resetStore };
