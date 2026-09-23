const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { listVideos, getVideo, videoForSimulation } = require("../data/spanishVideos");
const { publicProgress } = require("../utils/videoProgress");
const { publicLesson, productionFlags } = require("../utils/videoProduction");
const store = require("../models/spanishVideoProgressStore");

const list = asyncHandler(async (req, res) => {
  const progressRows = await store.listForUser(req.user.id);
  const byId = new Map(progressRows.map((row) => [row.videoId, row]));
  const videos = listVideos().map((video) => publicProgress(byId.get(video.id), publicLesson(video)));
  const unlockedSimulationIds = videos.filter((row) => row.completed).map((row) => row.simulationId);
  res.json({
    success: true,
    data: {
      engine: "video-master",
      production: productionFlags(),
      videos,
      simulationUnlocked: unlockedSimulationIds.length > 0,
      unlockedSimulationIds,
    },
  });
});

const recordProgress = asyncHandler(async (req, res) => {
  const video = getVideo(req.params.videoId);
  if (!video) throw ApiError.notFound("Video lesson not found.");
  const event = String(req.body?.event || "");
  if (!["play", "time", "seek-reset", "ended"].includes(event)) {
    throw ApiError.badRequest("Unknown video playback event.");
  }
  const lesson = publicLesson(video);
  const saved = await store.saveProgress(req.user.id, video.id, {
    event,
    position: req.body?.position,
    duration: req.body?.duration || lesson.layout.durationSec,
  });
  res.json({
    success: true,
    data: {
      progress: publicProgress(saved, lesson),
      completionToken: saved.completed
        ? { type: "video.completed", videoId: video.id, simulationId: video.simulationId }
        : null,
    },
  });
});

async function assertVideoUnlock(userId, simulationId) {
  const video = videoForSimulation(simulationId);
  if (!video) return;
  const done = await store.hasCompletedVideo(userId, video.id);
  if (!done) {
    throw ApiError.forbidden("Complete the matching 2–3 minute Video Master lesson before this simulation.");
  }
}

module.exports = { list, recordProgress, assertVideoUnlock };
