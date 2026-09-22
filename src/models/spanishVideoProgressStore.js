const mongoose = require("mongoose");
const { SpanishVideoProgress } = require("./schemas");
const { emptyProgress, applyVideoEvent } = require("../utils/videoProgress");

const rows = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function key(userId, videoId) {
  return `${userId}:${videoId}`;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return rest;
}

async function getProgress(userId, videoId) {
  if (useMongo()) {
    return fromDoc(await SpanishVideoProgress.findOne({ userId, videoId }).lean()) || emptyProgress(userId, videoId);
  }
  return rows.get(key(userId, videoId)) || emptyProgress(userId, videoId);
}

async function listForUser(userId) {
  if (useMongo()) {
    return (await SpanishVideoProgress.find({ userId }).lean()).map(fromDoc);
  }
  return [...rows.values()].filter((row) => row.userId === userId);
}

async function saveProgress(userId, videoId, eventPayload) {
  const current = await getProgress(userId, videoId);
  const next = applyVideoEvent({ ...current, userId, videoId }, eventPayload);
  if (useMongo()) {
    return fromDoc(
      await SpanishVideoProgress.findOneAndUpdate(
        { userId, videoId },
        { $set: next },
        { new: true, upsert: true }
      ).lean()
    );
  }
  rows.set(key(userId, videoId), next);
  return next;
}

async function hasCompletedVideo(userId, videoId) {
  const row = await getProgress(userId, videoId);
  return Boolean(row.completed);
}

async function completedSimulationIds(userId) {
  const { listVideos } = require("../data/spanishVideos");
  const progress = await listForUser(userId);
  const done = new Set(progress.filter((row) => row.completed).map((row) => row.videoId));
  return listVideos()
    .filter((video) => done.has(video.id))
    .map((video) => video.simulationId);
}

function resetStore() {
  rows.clear();
}

module.exports = {
  getProgress,
  listForUser,
  saveProgress,
  hasCompletedVideo,
  completedSimulationIds,
  resetStore,
};
