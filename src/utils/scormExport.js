const blueprint = require("../data/productionBlueprint");

/**
 * §4 "SCORM 1.2 / xAPI Integration: All dynamic scoring arrays from the
 * EVALUATOR engine must map directly into corporate LMS databases."
 *
 * Two shapes are produced from one session: a SCORM 1.2 `cmi` data model for
 * legacy LMS imports, and xAPI statements for anything modern. Neither is
 * transmitted from here — the controller hands them to the caller so the LMS
 * connector owns delivery.
 */

const XAPI_VERBS = {
  experienced: { id: "http://adlnet.gov/expapi/verbs/experienced", display: "experienced" },
  answered: { id: "http://adlnet.gov/expapi/verbs/answered", display: "answered" },
  scored: { id: "http://adlnet.gov/expapi/verbs/scored", display: "scored" },
  passed: { id: "http://adlnet.gov/expapi/verbs/passed", display: "passed" },
  failed: { id: "http://adlnet.gov/expapi/verbs/failed", display: "failed" },
};

const ACTIVITY_BASE = "https://skillbridge.tech/xapi/spanish/law";

/** Normalises a 1–5 EVALUATOR rating onto the 0–1 scale both standards use. */
function scaled(rating) {
  return Number(((Math.max(1, Math.min(5, rating)) - 1) / 4).toFixed(4));
}

function scormLessonStatus(review) {
  if (!review) return "incomplete";
  return review.passed ? "passed" : "failed";
}

/**
 * SCORM 1.2 cmi data model. Dimension ratings ride in cmi.interactions so the
 * LMS keeps the per-dimension detail, not just one roll-up score.
 */
function toScorm12(session) {
  const review = session.review || null;
  const raw = review ? review.rating : 0;

  const interactions = (review?.scorecard || []).map((row, index) => ({
    id: `cmi.interactions.${index}`,
    "cmi.interactions.n.id": row.dimension.replace(/\s+/g, "_").toLowerCase(),
    "cmi.interactions.n.type": "numeric",
    "cmi.interactions.n.student_response": String(row.rating),
    "cmi.interactions.n.result": row.met ? "correct" : "wrong",
    "cmi.interactions.n.weighting": String(row.minimumRatingRequired),
  }));

  return {
    version: "1.2",
    "cmi.core.student_id": session.userId,
    "cmi.core.lesson_location": session.currentStageId || "ST-01",
    "cmi.core.lesson_status": scormLessonStatus(review),
    "cmi.core.score.raw": String(raw),
    "cmi.core.score.min": "1",
    "cmi.core.score.max": "5",
    "cmi.core.session_time": secondsToScormTime(session.elapsedSeconds || 0),
    "cmi.suspend_data": JSON.stringify({
      moduleID: session.moduleId,
      stages: (session.stageResults || []).map((row) => ({ id: row.stageId, rating: row.rating })),
    }),
    "cmi.comments": blueprint.COPYRIGHT,
    interactions,
  };
}

/** SCORM 1.2 wants HHHH:MM:SS.SS. */
function secondsToScormTime(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = (seconds % 60).toFixed(2).padStart(5, "0");
  return `${String(hours).padStart(4, "0")}:${String(minutes).padStart(2, "0")}:${rest}`;
}

function actorFor(session) {
  return { objectType: "Agent", account: { homePage: "https://skillbridge.tech", name: String(session.userId) } };
}

function statement(session, verb, object, result) {
  return {
    actor: actorFor(session),
    verb: { id: verb.id, display: { "en-US": verb.display } },
    object,
    ...(result ? { result } : {}),
    context: {
      registration: session.id,
      extensions: {
        [`${ACTIVITY_BASE}/framework`]: blueprint.FRAMEWORK,
        [`${ACTIVITY_BASE}/blueprint`]: blueprint.DOCUMENT_ID,
        [`${ACTIVITY_BASE}/moduleID`]: session.moduleId,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/** One statement per phase, plus one per stage and a final pass/fail. */
function toXapiStatements(session) {
  const statements = [];

  if (session.videoCompletedAt) {
    statements.push(
      statement(session, XAPI_VERBS.experienced, {
        objectType: "Activity",
        id: `${ACTIVITY_BASE}/${session.moduleId}/video`,
        definition: {
          name: { "en-US": "Video observation phase (15%)" },
          type: "http://adlnet.gov/expapi/activities/media",
        },
      }, { duration: `PT${blueprint.VIDEO_MAX_SECONDS}S`, completion: true })
    );
  }

  for (const row of session.stageResults || []) {
    statements.push(
      statement(session, XAPI_VERBS.answered, {
        objectType: "Activity",
        id: `${ACTIVITY_BASE}/${session.moduleId}/stage/${row.stageId}`,
        definition: {
          name: { "en-US": `${row.stageId} — ${row.dimension || "compliance"}` },
          type: "http://adlnet.gov/expapi/activities/cmi.interaction",
        },
      }, { score: { raw: row.rating, min: 1, max: 5, scaled: scaled(row.rating) } })
    );
  }

  if (session.review) {
    const verb = session.review.passed ? XAPI_VERBS.passed : XAPI_VERBS.failed;
    statements.push(
      statement(session, verb, {
        objectType: "Activity",
        id: `${ACTIVITY_BASE}/${session.moduleId}`,
        definition: {
          name: { "en-US": session.courseTitle || session.moduleId },
          type: "http://adlnet.gov/expapi/activities/module",
        },
      }, {
        success: session.review.passed,
        completion: true,
        score: {
          raw: session.review.rating,
          min: 1,
          max: 5,
          scaled: scaled(session.review.rating),
        },
      })
    );
  }

  return statements;
}

module.exports = { XAPI_VERBS, ACTIVITY_BASE, scaled, secondsToScormTime, toScorm12, toXapiStatements };
