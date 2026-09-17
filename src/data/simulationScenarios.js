const { ACADEMY_ID } = require("./spanishPrograms");

function scenario(partial) {
  return {
    academyId: ACADEMY_ID,
    status: "published",
    version: 1,
    rubricId: "professional-communication-v1",
    rubricVersion: "v1",
    interactionMode: "text",
    maxTurns: 8,
    ...partial,
  };
}

const SCENARIOS = [
  scenario({
    id: "cs-l1-order-delay",
    programId: "customer_service",
    level: 1,
    unitId: "unit-1-order-support",
    lessonId: "lesson-2-delayed-order",
    cefr: "A2",
    title: "Order has not arrived",
    description: "A Spanish-speaking customer contacts support because an order has not arrived.",
    studentRole: "customer service representative",
    aiRole: "Spanish-speaking customer",
    context: "Retail support desk. The customer is frustrated but willing to cooperate.",
    difficulty: "beginner",
    estimatedDuration: 8,
    openingMessage: "Buenos días. Pedí un paquete hace dos semanas y todavía no llega.",
    closingMessage: "Gracias. Voy a esperar el correo con el número de seguimiento.",
    targetVocabulary: ["pedido", "número de orden", "retraso", "seguimiento", "envío"],
    grammarTargets: ["usted present tense", "polite requests"],
    communicationFunctions: ["greet", "confirm details", "explain next step", "close"],
    objectives: [
      { id: "greet", label: "Greet professionally", cues: ["buenos", "buenas", "hola"] },
      { id: "ask_order", label: "Ask for the order number", cues: ["número", "pedido", "orden"] },
      { id: "confirm", label: "Confirm the problem", cues: ["no llega", "retraso", "paquete"] },
      { id: "next_step", label: "Explain the next step", cues: ["seguimiento", "reviso", "envío", "correo"] },
      { id: "close", label: "Close professionally", cues: ["gracias", "bueno", "ayuda"] },
    ],
    requiredInformation: [
      { id: "greet", cues: ["buenos", "buenas", "hola", "ayud"] },
      { id: "ask_order", cues: ["número", "pedido", "orden"] },
      { id: "next_step", cues: ["seguimiento", "reviso", "envío", "correo", "llamar"] },
    ],
    successCriteria: ["Greeting", "Order number request", "Clear next step"],
    safetyRules: [{ forbiddenCues: ["cállate", "estúpido"] }],
    variations: [
      { id: "v-ana", persona: "Ana López", openingMessage: "Buenos días. Pedí un paquete hace dos semanas y todavía no llega." },
      { id: "v-diego", persona: "Diego Ruiz", openingMessage: "Hola. Mi pedido CS-4419 no aparece. Estoy preocupado." },
    ],
    conversationBeats: [
      { id: "greet", assistantMessage: "Buenos días. El pedido es de Ana López. Todavía no llega." },
      { id: "ask_order", assistantMessage: "El número de pedido es CS-2201. ¿Puede revisar, por favor?" },
      { id: "next_step", assistantMessage: "De acuerdo. ¿Me va a enviar el seguimiento por correo?" },
      { id: "progress", assistantMessage: "Sí, el paquete no llega. ¿Qué podemos hacer?" },
    ],
  }),
  scenario({
    id: "med-l1-patient-intake",
    programId: "medical",
    level: 1,
    unitId: "unit-1-patient-intake",
    lessonId: "lesson-1-check-in",
    cefr: "A1",
    title: "Patient intake",
    description: "Obtain identity and a basic symptom description from a patient.",
    studentRole: "clinic staff",
    aiRole: "patient",
    context: "Community clinic front desk.",
    difficulty: "beginner",
    estimatedDuration: 7,
    openingMessage: "Buenos días. Vengo porque me duele la cabeza desde ayer.",
    closingMessage: "Gracias. Voy a esperar a la enfermera.",
    targetVocabulary: ["nombre", "dolor", "medicamento", "alergia"],
    grammarTargets: ["present tense", "question words"],
    communicationFunctions: ["greet", "identify", "ask symptoms", "confirm"],
    objectives: [
      { id: "greet", label: "Greet the patient", cues: ["buenos", "buenas"] },
      { id: "name", label: "Ask for the name", cues: ["nombre", "cómo se llama"] },
      { id: "symptom", label: "Ask about the symptom", cues: ["duele", "dolor", "síntoma"] },
      { id: "meds", label: "Ask about medicine", cues: ["medicamento", "tomó", "alergia"] },
    ],
    requiredInformation: [
      { id: "greet", cues: ["buenos", "buenas", "hola"] },
      { id: "name", cues: ["nombre", "llama"] },
      { id: "symptom", cues: ["duele", "dolor", "síntoma"] },
    ],
    successCriteria: ["Identity", "Symptom"],
    safetyRules: [{ forbiddenCues: ["diagnóstico", "está muerto"] }],
    variations: [
      { id: "v-maria", persona: "María Soto", openingMessage: "Buenos días. Vengo porque me duele la cabeza desde ayer." },
      { id: "v-carlos", persona: "Carlos Vega", openingMessage: "Hola. Tengo dolor de estómago desde anoche." },
    ],
    conversationBeats: [
      { id: "greet", assistantMessage: "Buenos días. Me llamo María Soto." },
      { id: "name", assistantMessage: "Me llamo María Soto." },
      { id: "symptom", assistantMessage: "Me duele la cabeza. No tomé medicamento." },
      { id: "progress", assistantMessage: "Sí, el dolor continúa. ¿Qué más necesita?" },
    ],
  }),
  scenario({
    id: "law-l1-traffic-stop",
    programId: "law",
    level: 1,
    unitId: "unit-1-traffic",
    lessonId: "lesson-1-stop",
    cefr: "A2",
    title: "Traffic stop",
    description: "Greet the driver, request identification, and explain the next step calmly.",
    studentRole: "officer",
    aiRole: "driver",
    context: "Roadside stop. Keep the interaction calm and clear.",
    difficulty: "beginner",
    estimatedDuration: 6,
    openingMessage: "Buenas tardes. ¿Qué pasa, oficial?",
    closingMessage: "Está bien. Voy a esperar aquí.",
    targetVocabulary: ["identificación", "licencia", "alto", "vehículo"],
    grammarTargets: ["formal commands", "usted"],
    communicationFunctions: ["identify self", "request ID", "explain reason"],
    objectives: [
      { id: "identify", label: "Identify as an officer", cues: ["oficial", "policía", "buenas"] },
      { id: "id", label: "Request identification", cues: ["identificación", "licencia"] },
      { id: "reason", label: "Explain the stop", cues: ["alto", "señal", "velocidad", "luz"] },
    ],
    requiredInformation: [
      { id: "identify", cues: ["oficial", "policía", "buenas", "tardes"] },
      { id: "id", cues: ["identificación", "licencia"] },
      { id: "reason", cues: ["alto", "señal", "velocidad", "luz", "pare"] },
    ],
    successCriteria: ["Calm greeting", "ID request", "Reason"],
    safetyRules: [{ forbiddenCues: ["cállate", "estúpido", "disparo"] }],
    variations: [
      { id: "v-stop", persona: "Luis Mora", openingMessage: "Buenas tardes. ¿Qué pasa, oficial?" },
      { id: "v-window", persona: "Elena Cruz", openingMessage: "No entiendo. ¿Por qué me detiene?" },
    ],
    conversationBeats: [
      { id: "identify", assistantMessage: "Buenas tardes. Aquí está mi licencia." },
      { id: "id", assistantMessage: "Sí, aquí tiene mi identificación." },
      { id: "reason", assistantMessage: "Entiendo. Voy a esperar en el vehículo." },
      { id: "progress", assistantMessage: "¿Me puede explicar más despacio, por favor?" },
    ],
  }),
  scenario({
    id: "con-l1-jobsite",
    programId: "construction",
    level: 1,
    unitId: "unit-1-jobsite-communication",
    lessonId: "lesson-1-safety-brief",
    cefr: "A1",
    title: "Jobsite communication",
    description: "Give a short safety instruction and confirm understanding on a construction site.",
    studentRole: "site supervisor",
    aiRole: "crew member",
    context: "Morning briefing at a residential build.",
    difficulty: "beginner",
    estimatedDuration: 6,
    openingMessage: "Jefe, ¿dónde trabajo hoy?",
    closingMessage: "Sí, entiendo. Voy al segundo piso con casco.",
    targetVocabulary: ["casco", "cuidado", "escalera", "piso"],
    grammarTargets: ["informal and formal commands"],
    communicationFunctions: ["direct", "warn", "confirm"],
    objectives: [
      { id: "greet", label: "Open the briefing", cues: ["buenos", "hoy", "equipo"] },
      { id: "ppe", label: "Require safety gear", cues: ["casco", "guantes", "chaleco"] },
      { id: "task", label: "Assign the task", cues: ["piso", "escalera", "lleve", "trabaja"] },
    ],
    requiredInformation: [
      { id: "ppe", cues: ["casco", "guantes", "chaleco"] },
      { id: "task", cues: ["piso", "escalera", "trabaja", "lleve"] },
    ],
    successCriteria: ["PPE", "Task assignment"],
    safetyRules: [{ forbiddenCues: ["no importa"] }],
    variations: [
      { id: "v-roof", persona: "Jorge Díaz", openingMessage: "Jefe, ¿dónde trabajo hoy?" },
      { id: "v-ground", persona: "Pablo Herrera", openingMessage: "¿Llevo materiales al patio?" },
    ],
    conversationBeats: [
      { id: "ppe", assistantMessage: "Sí, ya tengo el casco. ¿Y ahora?" },
      { id: "task", assistantMessage: "Entendido. Voy al segundo piso." },
      { id: "progress", assistantMessage: "¿Puede repetir más despacio, jefe?" },
    ],
  }),
];

const drafts = [];

function publicScenario(row) {
  if (!row) return null;
  return {
    simulation_id: row.id,
    academy_id: row.academyId,
    program_id: row.programId,
    level: row.level,
    unit_id: row.unitId,
    lesson_id: row.lessonId,
    cefr: row.cefr,
    title: row.title,
    description: row.description,
    student_role: row.studentRole,
    ai_role: row.aiRole,
    context: row.context,
    objectives: (row.objectives || []).map((item) => ({ id: item.id, label: item.label })),
    target_vocabulary: row.targetVocabulary,
    grammar_targets: row.grammarTargets,
    communication_functions: row.communicationFunctions,
    difficulty: row.difficulty,
    estimated_duration: row.estimatedDuration,
    interaction_mode: row.interactionMode,
    status: row.status,
    version: row.version,
  };
}

function allScenarios() {
  return [...SCENARIOS, ...drafts];
}

function getScenario(id, { includeUnpublished = false } = {}) {
  const row = allScenarios().find((item) => item.id === id);
  if (!row) return null;
  if (!includeUnpublished && row.status !== "published") return null;
  return row;
}

function listPublished(filters = {}) {
  return SCENARIOS.filter((row) => {
    if (filters.program && row.programId !== filters.program) return false;
    if (filters.level && String(row.level) !== String(filters.level)) return false;
    if (filters.academy && row.academyId !== filters.academy) return false;
    return row.status === "published";
  });
}

function pickVariation(scenario, previousVariationId) {
  const list = scenario.variations || [{ id: "default" }];
  const remaining = list.filter((row) => row.id !== previousVariationId);
  const pool = remaining.length ? remaining : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

function upsertDraft(payload) {
  const existing = drafts.findIndex((row) => row.id === payload.id);
  const record = { ...payload, status: payload.status || "draft", version: payload.version || 1 };
  if (existing >= 0) drafts[existing] = record;
  else drafts.push(record);
  return record;
}

function publishScenario(id) {
  const row = allScenarios().find((item) => item.id === id);
  if (!row) return null;
  row.status = "published";
  row.version = (row.version || 1) + (SCENARIOS.includes(row) ? 0 : 0);
  if (!SCENARIOS.includes(row)) SCENARIOS.push(row);
  return row;
}

function archiveScenario(id) {
  const row = allScenarios().find((item) => item.id === id);
  if (!row) return null;
  row.status = "archived";
  return row;
}

module.exports = {
  SCENARIOS,
  publicScenario,
  getScenario,
  listPublished,
  pickVariation,
  upsertDraft,
  publishScenario,
  archiveScenario,
};
