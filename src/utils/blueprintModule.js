const blueprint = require("../data/productionBlueprint");
const { phoneticGuide } = require("./spanishPhonetics");
const { getLesson, unit } = require("../data/lawEnforcementUnit1");

/**
 * Builds a Production Master Blueprint module (SBS-2026-PRODUCTION-002) from a
 * Unit 1 lesson: the 90-second video observation phase and the 510-second
 * interactive simulation phase, plus the module configuration JSON the
 * blueprint specifies in §3B.
 */

const COURSE_TITLE = "Spanish for Law Enforcement Level 1";

/** LE-L1-U1 style module id, per the blueprint's own sample. */
function moduleIdFor(lessonNumber) {
  return `LE-L1-U${lessonNumber}`;
}

/**
 * Lays the lesson's command pairs across the 90-second observation window.
 *
 * Each cue carries the Spanish command, the parallel English block and the
 * phonetic guide, because §2 requires all three on screen simultaneously.
 * Cues are evenly spaced so the track always ends exactly at second 90 — the
 * hard stop is a fixed contract, not a consequence of how much script fits.
 */
function buildVideoPhase(lesson) {
  const pairs = (lesson.commands || []).filter((pair) => pair.es);
  const total = blueprint.VIDEO_MAX_SECONDS;
  const count = Math.max(pairs.length, 1);
  const slot = Number((total / count).toFixed(3));

  const cues = pairs.map((pair, index) => {
    const start = Number((index * slot).toFixed(3));
    return {
      index,
      start,
      end: Number(Math.min(total, start + slot).toFixed(3)),
      spanish: pair.es,
      english: pair.en,
      // §2 "Continuous Phonetic Guide": anchored at the lower third.
      phonetic: phoneticGuide(pair.es),
      anchor: blueprint.VIDEO_OVERLAYS.continuousPhoneticGuide.anchor,
    };
  });

  return {
    phase: "video-observation",
    weight: blueprint.TIME_ALLOCATION.videoWeight,
    maxDurationSec: total,
    // The scenario the blueprint's production master sample calls for: the
    // on-screen officer deliberately uses a weak informal register so the
    // learner has something to diagnose in ST-01.
    demonstrationRegister: "informal-street-register",
    targetRegister: "Formal Usted Format",
    overlays: blueprint.VIDEO_OVERLAYS,
    hardStop: blueprint.VIDEO_OVERLAYS.hardCodedSystemStop,
    cues,
  };
}

/** The 510-second interactive phase: the three blueprint stages in order. */
function buildSimulationPhase(lesson) {
  return {
    phase: "interactive-simulation",
    weight: blueprint.TIME_ALLOCATION.simulationWeight,
    minDurationSec: blueprint.SIMULATION_MIN_SECONDS,
    workbook: {
      appendix: blueprint.APPENDICES.H.id,
      title: blueprint.APPENDICES.H.title,
      columns: ["claim", "evidence", "decision"],
    },
    stages: blueprint.STAGES.map((stage) => ({
      id: stage.id,
      prompt: stage.prompt,
      promptEs: stage.promptEs,
      branching: stage.branching,
      dimension: stage.dimension || null,
      appendix: stage.appendix || null,
      targetRatings: stage.targetRatings || null,
      targetLabel: stage.targetLabel || null,
      outcome: stage.outcome,
    })),
    referenceCommands: (lesson.commands || []).map((pair) => ({
      spanish: pair.es,
      english: pair.en,
      phonetic: phoneticGuide(pair.es),
    })),
  };
}

/** §3B module configuration — the JSON shape the blueprint prints verbatim. */
function moduleConfiguration(lesson) {
  return {
    moduleID: moduleIdFor(lesson.number),
    courseTitle: COURSE_TITLE,
    copyright: blueprint.COPYRIGHT,
    timeAllocation: blueprint.TIME_ALLOCATION,
  };
}

function scorecardEngine() {
  return {
    frameworkName: `${blueprint.FRAMEWORK} Scorecard`,
    evaluationDimensions: blueprint.EVALUATION_DIMENSIONS,
  };
}

/** The full module payload the player consumes. */
function buildModule(lessonId) {
  const lesson = getLesson(lessonId);
  if (!lesson) return null;
  const meta = unit();

  return {
    documentId: blueprint.DOCUMENT_ID,
    author: blueprint.AUTHOR,
    company: blueprint.COMPANY,
    framework: blueprint.FRAMEWORK,
    copyright: blueprint.COPYRIGHT,
    moduleConfiguration: moduleConfiguration(lesson),
    scorecardEngine: scorecardEngine(),
    lesson: {
      id: lesson.id,
      number: lesson.number,
      title: lesson.title,
      titleEs: lesson.titleEs,
      focus: lesson.focus,
      teacherCue: lesson.teacherCue,
      formId: lesson.formId,
    },
    academicNotice: meta.academicNotice,
    video: buildVideoPhase(lesson),
    simulation: buildSimulationPhase(lesson),
    deploymentChecklist: blueprint.DEPLOYMENT_CHECKLIST,
  };
}

/** Lightweight listing for the module index screen. */
function listModules() {
  return unit().lessons.map((lesson) => ({
    moduleID: moduleIdFor(lesson.number),
    lessonId: lesson.id,
    number: lesson.number,
    title: lesson.title,
    focus: lesson.focus,
    totalSeconds: blueprint.TIME_ALLOCATION.totalSeconds,
    videoSeconds: blueprint.VIDEO_MAX_SECONDS,
    simulationSeconds: blueprint.SIMULATION_MIN_SECONDS,
  }));
}

module.exports = {
  COURSE_TITLE,
  moduleIdFor,
  buildVideoPhase,
  buildSimulationPhase,
  moduleConfiguration,
  scorecardEngine,
  buildModule,
  listModules,
};
