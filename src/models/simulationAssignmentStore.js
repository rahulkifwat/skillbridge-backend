const mongoose = require("mongoose");
const { SimulationAssignment } = require("./schemas");

const rows = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return rest;
}

async function createAssignment(record) {
  if (useMongo()) {
    const created = await SimulationAssignment.create(record);
    return fromDoc(created.toObject());
  }
  rows.set(record.id, record);
  return record;
}

async function listForStudent(userId) {
  if (useMongo()) {
    return (await SimulationAssignment.find({ studentId: userId }).lean()).map(fromDoc);
  }
  return [...rows.values()].filter((row) => row.studentId === userId);
}

async function listAll() {
  if (useMongo()) {
    return (await SimulationAssignment.find().lean()).map(fromDoc);
  }
  return [...rows.values()];
}

function resetStore() {
  rows.clear();
}

module.exports = { createAssignment, listForStudent, listAll, resetStore };
