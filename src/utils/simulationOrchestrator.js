function normalize(text) {
  return String(text || "").toLowerCase();
}

function matchCues(text, cues) {
  const haystack = normalize(text);
  return (cues || []).some((cue) => haystack.includes(String(cue).toLowerCase()));
}

function nextCollected(scenario, collected, studentText) {
  const next = new Set(collected || []);
  for (const item of scenario.requiredInformation || []) {
    if (matchCues(studentText, item.cues)) next.add(item.id);
  }
  return [...next];
}

function pickReply(scenario, collected, studentText, turnNumber) {
  const beats = scenario.conversationBeats || [];
  const collectedSet = new Set(collected);
  const pending = (scenario.requiredInformation || []).find((item) => !collectedSet.has(item.id));
  const closing = matchCues(studentText, ["gracias", "buen día", "que esté bien", "adiós", "hasta luego"]);
  const complete =
    (scenario.requiredInformation || []).every((item) => collectedSet.has(item.id)) &&
    (closing || turnNumber >= (scenario.maxTurns || 8));

  const beat =
    beats.find((row) => row.id === pending?.id) ||
    beats.find((row) => row.id === "progress") ||
    beats[Math.min(turnNumber, beats.length - 1)] ||
    { assistantMessage: "¿Puede decirme un poco más, por favor?" };

  return {
    assistant_message: complete
      ? scenario.closingMessage || "Gracias. Entendido. Que tenga un buen día."
      : beat.assistantMessage,
    scenario_state_update: { collected, pending: pending?.id || null, turnNumber },
    detected_objectives: (scenario.objectives || [])
      .filter((objective) => matchCues(studentText, objective.cues))
      .map((objective) => objective.id),
    escalation_flag: matchCues(studentText, scenario.escalationCues || ["policía", "abogado", "supervisor"]),
    completion_candidate: complete,
    safety_flag: (scenario.safetyRules || []).some((rule) => matchCues(studentText, rule.forbiddenCues)),
  };
}

function adaptOpening(scenario, variation, learnerLevel) {
  const opening = variation?.openingMessage || scenario.openingMessage;
  if (learnerLevel === "A0" || learnerLevel === "A1") {
    return opening;
  }
  return variation?.openingMessageAdvanced || opening;
}

module.exports = { nextCollected, pickReply, adaptOpening };
