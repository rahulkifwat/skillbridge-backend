const { masteryStatus } = require("./simulationMastery");

const EVALUATOR_VERSION = "sim-eval-v1";

function includesAny(text, cues) {
  const haystack = String(text || "").toLowerCase();
  return (cues || []).some((cue) => haystack.includes(String(cue).toLowerCase()));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function evaluateSession(scenario, turns, collected) {
  const studentTurns = (turns || []).filter((turn) => turn.role === "student");
  const transcript = studentTurns.map((turn) => turn.content).join("\n");
  const required = scenario.requiredInformation || [];
  const collectedSet = new Set(collected || []);
  const objectives = scenario.objectives || [];
  const objectivesMet = objectives.filter((objective) =>
    includesAny(transcript, objective.cues || [])
  );
  const objectivesMissed = objectives.filter((objective) => !objectivesMet.includes(objective));

  const greeting = includesAny(transcript, ["buenos", "buenas", "hola", "bienvenid"]);
  const spanishMarks = /[áéíóúñ¿¡]/i.test(transcript);
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const englishHeavy = /\b(the|and|you|please|sorry|order)\b/i.test(transcript) && wordCount < 12;
  const formal = includesAny(transcript, ["usted", "por favor", "le", "su "]);
  const taskComplete = required.every((item) => collectedSet.has(item.id));
  const criticalErrors = [];
  if (englishHeavy) criticalErrors.push("Responded mainly in English instead of Spanish.");
  if ((scenario.safetyRules || []).some((rule) => includesAny(transcript, rule.forbiddenCues || []))) {
    criticalErrors.push("Used language that breaks a safety or professional constraint.");
  }

  const categoryScores = {
    comprehension: clamp(50 + objectivesMet.length * 12),
    grammar: clamp(spanishMarks ? 82 : wordCount > 20 ? 68 : 52),
    vocabulary: clamp(40 + (scenario.targetVocabulary || []).filter((word) => includesAny(transcript, [word])).length * 10),
    fluency: clamp(Math.min(92, wordCount * 4)),
    professional_terminology: clamp(formal ? 86 : 62),
    communication_effectiveness: clamp(greeting && taskComplete ? 88 : greeting ? 70 : 48),
    cultural_appropriateness: clamp(formal || greeting ? 84 : 60),
    task_completion: clamp((collectedSet.size / Math.max(required.length, 1)) * 100),
  };

  const values = Object.values(categoryScores);
  const overallScore = clamp(values.reduce((sum, value) => sum + value, 0) / values.length);
  const status = masteryStatus(overallScore, { taskComplete, criticalErrors });

  const strengths = [];
  const improvementAreas = [];
  if (greeting) strengths.push("You opened the interaction clearly.");
  if (formal) strengths.push("You used a respectful register.");
  if (taskComplete) strengths.push("You covered the required professional steps.");
  if (!greeting) improvementAreas.push("Start with a calm professional greeting in Spanish.");
  if (objectivesMissed[0]) improvementAreas.push(`Practice: ${objectivesMissed[0].label}`);
  if (!taskComplete) improvementAreas.push("Collect every required piece of information before closing.");

  return {
    overall_score: overallScore,
    category_scores: categoryScores,
    objectives_met: objectivesMet.map((row) => row.id),
    objectives_missed: objectivesMissed.map((row) => row.id),
    critical_errors: criticalErrors,
    language_examples: studentTurns.slice(0, 3).map((turn) => turn.content),
    strengths: strengths.length ? strengths : ["You stayed in the scenario and kept trying."],
    improvement_areas: improvementAreas,
    recommended_practice: improvementAreas[0]
      ? `Review ${improvementAreas[0].toLowerCase()} then retry this simulation with a new variation.`
      : "Retry with a new customer or complication to lock in mastery.",
    mastery_status: status,
    task_complete: taskComplete,
    evaluator_version: EVALUATOR_VERSION,
    rubric_id: scenario.rubricId,
    rubric_version: scenario.rubricVersion || "v1",
  };
}

function studentFeedback(evaluation) {
  return {
    well: evaluation.strengths,
    improve: evaluation.improvement_areas,
    alternatives: [
      "Buenos días, ¿en qué puedo ayudarle?",
      "¿Me puede confirmar el número, por favor?",
      "El siguiente paso es… ¿tiene alguna pregunta?",
    ],
    vocabularyReview: "Reuse the target vocabulary from this scenario in full sentences.",
    grammarReview: "Keep present-tense verbs aligned with usted when the role is professional.",
    communication: evaluation.recommended_practice,
    tone: "encouraging",
  };
}

module.exports = { EVALUATOR_VERSION, evaluateSession, studentFeedback };
