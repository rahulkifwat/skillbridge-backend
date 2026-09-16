const SCENARIOS = [
  {
    scenarioId: "medical-intake",
    trackId: "medical",
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
        prompt: "This practice round ended early. Next time, confirm the name and ask one follow-up about the symptom.",
        complete: true,
      },
    },
  },
  {
    scenarioId: "customer-complaint",
    trackId: "customer_service",
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
      "end-low": {
        prompt: "This practice round ended without a next step. Try acknowledging the issue first, then offer one clear action.",
        complete: true,
      },
    },
  },
  {
    scenarioId: "law-traffic-stop",
    trackId: "law",
    title: "Traffic stop",
    specialty: "law",
    objective: "Greet the driver, request identification, and explain the next step calmly.",
    start: "open",
    nodes: {
      open: {
        prompt: "You approach a stopped vehicle. First line?",
        options: [
          { id: "id", label: "Buenas tardes. Soy oficial. ¿Me muestra su identificación, por favor?", score: 2, next: "reason" },
          { id: "shout", label: "¡Salga ahora!", score: 0, next: "end-low" },
        ],
      },
      reason: {
        prompt: "The driver looks confused. What do you add?",
        options: [
          { id: "explain", label: "Lo detuve porque no se detuvo en la señal de alto. Espere un momento, por favor.", score: 2, next: "end-high" },
          { id: "silence", label: "Nada. Camine.", score: 0, next: "end-low" },
        ],
      },
      "end-high": { prompt: "You kept the stop clear, calm, and documented.", complete: true },
      "end-low": {
        prompt: "This practice stop can be calmer. Start with who you are, then one simple request.",
        complete: true,
      },
    },
  },
  {
    scenarioId: "hospitality-checkin",
    trackId: "hospitality",
    title: "Hotel check-in",
    specialty: "hospitality",
    objective: "Welcome a guest, confirm the reservation, and offer help with the room.",
    start: "welcome",
    nodes: {
      welcome: {
        prompt: "A guest arrives at the desk. First line?",
        options: [
          { id: "welcome", label: "Bienvenido. ¿Tiene una reservación a su nombre?", score: 2, next: "room" },
          { id: "wait", label: "Espere.", score: 0, next: "end-low" },
        ],
      },
      room: {
        prompt: "The reservation is found. What next?",
        options: [
          { id: "key", label: "Aquí tiene la llave. El desayuno es de siete a diez. ¿Necesita ayuda con las maletas?", score: 2, next: "end-high" },
          { id: "gone", label: "Esa es su habitación. Adiós.", score: 1, next: "end-high" },
        ],
      },
      "end-high": { prompt: "The guest has a key and a clear next step.", complete: true },
      "end-low": {
        prompt: "Guests need a welcome and a question. Try confirming the name first.",
        complete: true,
      },
    },
  },
  {
    scenarioId: "business-standup",
    trackId: "business",
    title: "Remote stand-up",
    specialty: "business",
    objective: "Open a short team update and ask for blockers.",
    start: "open",
    nodes: {
      open: {
        prompt: "Your team joins the call. How do you start?",
        options: [
          { id: "agenda", label: "Buenos días. Hoy revisamos avances y bloqueos. ¿Quién quiere empezar?", score: 2, next: "block" },
          { id: "mute", label: "Hablen si quieren.", score: 0, next: "end-low" },
        ],
      },
      block: {
        prompt: "A teammate says the report is late. Response?",
        options: [
          { id: "help", label: "Entiendo. ¿Qué necesita para terminarlo hoy?", score: 2, next: "end-high" },
          { id: "blame", label: "Eso no es aceptable.", score: 0, next: "end-low" },
        ],
      },
      "end-high": { prompt: "The meeting stayed focused and supportive.", complete: true },
      "end-low": {
        prompt: "Try naming the agenda and inviting one person to speak.",
        complete: true,
      },
    },
  },
];

function getScenario(scenarioId) {
  return SCENARIOS.find((row) => row.scenarioId === scenarioId) || SCENARIOS[0];
}

function coachMessage(node, score) {
  if (!node.complete) return null;
  if ((score || 0) >= 3) {
    return "Strong choices. You kept the interaction clear and respectful.";
  }
  return "This is practice, not a test. Next time, start with a calm greeting and one clear question.";
}

function publicNode(scenario, nodeId, score) {
  const node = scenario.nodes[nodeId];
  return {
    scenarioId: scenario.scenarioId,
    trackId: scenario.trackId || scenario.specialty,
    title: scenario.title,
    objective: scenario.objective,
    nodeId,
    prompt: node.prompt,
    complete: Boolean(node.complete),
    options: (node.options || []).map((option) => ({ id: option.id, label: option.label })),
    score: score || 0,
    coachMessage: coachMessage(node, score),
  };
}

module.exports = { SCENARIOS, getScenario, publicNode };
