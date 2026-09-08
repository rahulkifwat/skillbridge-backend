const SCENARIOS = [
  {
    scenarioId: "medical-intake",
    title: "Patient check-in",
    specialty: "medical",
    objective: "Greet a patient, confirm identity, and collect a basic symptom description.",
    start: "greet",
    nodes: {
      greet: {
        prompt: "A patient approaches the desk. What do you say first?",
        options: [
          { id: "formal", label: "Buenos días, ¿me puede dar su nombre, por favor?", score: 2, next: "symptom" },
          { id: "abrupt", label: "¿Qué le pasa?", score: 1, next: "symptom" },
          { id: "english", label: "What's your name?", score: 0, next: "end-low" },
        ],
      },
      symptom: {
        prompt: "The patient says: “Me duele la cabeza desde ayer.” What do you do?",
        options: [
          { id: "clarify", label: "¿El dolor es fuerte? ¿Tomó algún medicamento?", score: 2, next: "end-high" },
          { id: "dismiss", label: "Espere ahí.", score: 0, next: "end-low" },
        ],
      },
      "end-high": {
        prompt: "You collected identity and a usable symptom description.",
        complete: true,
      },
      "end-low": {
        prompt: "The interaction did not gather enough clinical information.",
        complete: true,
      },
    },
  },
  {
    scenarioId: "customer-complaint",
    title: "Customer-service complaint",
    specialty: "customer_service",
    objective: "Acknowledge a complaint, clarify the problem, and offer a solution.",
    start: "open",
    nodes: {
      open: {
        prompt: "A customer says the order is wrong. First move?",
        options: [
          { id: "empathy", label: "Lamento el error. ¿Puede contarme qué recibió?", score: 2, next: "fix" },
          { id: "blame", label: "Usted debió revisar el pedido.", score: 0, next: "end-low" },
        ],
      },
      fix: {
        prompt: "They received the wrong size. What do you offer?",
        options: [
          { id: "replace", label: "Se lo cambio ahora y le confirmo el envío.", score: 2, next: "end-high" },
          { id: "nothing", label: "No puedo hacer nada.", score: 0, next: "end-low" },
        ],
      },
      "end-high": { prompt: "Complaint resolved with a clear next step.", complete: true },
      "end-low": { prompt: "The customer leaves without a resolution.", complete: true },
    },
  },
];

function getScenario(scenarioId) {
  return SCENARIOS.find((row) => row.scenarioId === scenarioId) || SCENARIOS[0];
}

function publicNode(scenario, nodeId, score) {
  const node = scenario.nodes[nodeId];
  return {
    scenarioId: scenario.scenarioId,
    title: scenario.title,
    objective: scenario.objective,
    nodeId,
    prompt: node.prompt,
    complete: Boolean(node.complete),
    options: (node.options || []).map((option) => ({ id: option.id, label: option.label })),
    score: score || 0,
  };
}

module.exports = { SCENARIOS, getScenario, publicNode };
