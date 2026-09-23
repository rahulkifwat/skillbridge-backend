const SKIP_TOLERANCE_SEC = 1.5;
const COMPLETE_RATIO = 0.92;

function emptyProgress(userId, videoId) {
  return {
    userId,
    videoId,
    status: "in_progress",
    maxContinuousSec: 0,
    lastPositionSec: 0,
    durationSec: 0,
    seekResetCount: 0,
    completed: false,
    completedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function applyVideoEvent(progress, { event, position = 0, duration = 0 } = {}) {
  const next = { ...progress, updatedAt: new Date().toISOString() };
  const pos = Math.max(0, Number(position) || 0);
  const dur = Math.max(0, Number(duration) || next.durationSec || 0);
  if (dur) next.durationSec = dur;

  if (event === "seek-reset") {
    next.maxContinuousSec = 0;
    next.lastPositionSec = 0;
    next.completed = false;
    next.completedAt = null;
    next.status = "in_progress";
    next.seekResetCount = (next.seekResetCount || 0) + 1;
    return next;
  }

  if (event === "time" || event === "play") {
    const max = next.maxContinuousSec || 0;
    const jumpedAhead = pos > max + SKIP_TOLERANCE_SEC;
    const scrubbedBack = pos + SKIP_TOLERANCE_SEC < max && pos < next.lastPositionSec - 0.4;
    if (jumpedAhead || scrubbedBack) {
      return applyVideoEvent(next, { event: "seek-reset", position: 0, duration: dur });
    }
    next.maxContinuousSec = Math.max(max, pos);
    next.lastPositionSec = pos;
    next.status = "in_progress";
    return next;
  }

  if (event === "ended") {
    const max = next.maxContinuousSec || 0;
    if (pos > max + SKIP_TOLERANCE_SEC) {
      return applyVideoEvent(next, { event: "seek-reset", position: 0, duration: dur });
    }
    next.lastPositionSec = pos;
    const ready = dur > 0 && max >= dur * COMPLETE_RATIO;
    if (ready) {
      next.completed = true;
      next.status = "complete";
      next.completedAt = new Date().toISOString();
    }
    return next;
  }

  return next;
}

function publicProgress(row, video) {
  return {
    videoId: video.id,
    title: video.title,
    programId: video.programId,
    simulationId: video.simulationId,
    durationHintMin: video.durationHintMin,
    durationHintMax: video.durationHintMax,
    src: video.src || null,
    summary: video.summary,
    presenter: video.presenter || null,
    pipeline: video.pipeline || null,
    layout: video.layout || null,
    completed: Boolean(row?.completed),
    seekResetCount: row?.seekResetCount || 0,
    lastPositionSec: row?.lastPositionSec || 0,
    maxContinuousSec: row?.maxContinuousSec || 0,
    status: row?.status || "not_started",
  };
}

module.exports = {
  SKIP_TOLERANCE_SEC,
  COMPLETE_RATIO,
  emptyProgress,
  applyVideoEvent,
  publicProgress,
};
