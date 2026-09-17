const DEFAULT_THRESHOLDS = {
  mastered: 85,
  proficient: 75,
  developing: 60,
};

function masteryStatus(overallScore, { taskComplete = false, criticalErrors = [] } = {}, thresholds = DEFAULT_THRESHOLDS) {
  if (!taskComplete || (criticalErrors && criticalErrors.length)) {
    if (overallScore < thresholds.developing) return "Needs Practice";
    return "Developing";
  }
  if (overallScore >= thresholds.mastered) return "Mastered";
  if (overallScore >= thresholds.proficient) return "Proficient";
  if (overallScore >= thresholds.developing) return "Developing";
  return "Needs Practice";
}

module.exports = { DEFAULT_THRESHOLDS, masteryStatus };
