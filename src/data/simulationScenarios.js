const { ACADEMY_ID } = require("./spanishPrograms");
const { atmosphereFor } = require("./simulationAtmosphere");

function scenario(partial) {
  return {
    academyId: ACADEMY_ID,
    status: "published",
    version: 1,
    rubricId: "professional-communication-v1",
    rubricVersion: "v1",
    interactionMode: "speech_text",
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
    masterScript: [
      "Buenos días, ¿en qué puedo ayudarle?",
      "¿Me da el número de pedido, por favor?",
      "Voy a revisar el envío y le mando el seguimiento.",
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
    masterScript: [
      "Buenos días. ¿Cómo se llama, por favor?",
      "¿Qué le duele hoy?",
      "¿Toma algún medicamento?",
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
    unitId: "unit-1-field-communication",
    lessonId: "l1",
    cefr: "A2",
    title: "High-risk traffic stop",
    description: "Classroom language for initial commands, vehicle control, and compliance checks. Not tactical instruction.",
    studentRole: "officer",
    aiRole: "driver",
    context: "Fictional roadside stop. Engine is running and the driver's hands are not visible. Academic simulation only.",
    academicNotice: true,
    difficulty: "beginner",
    estimatedDuration: 8,
    openingMessage: "¿Qué pasa? No oigo bien y el carro sigue encendido.",
    closingMessage: "Está bien. Voy a esperar aquí con las manos visibles.",
    targetVocabulary: ["licencia", "registro", "vehículo", "manos", "motor"],
    grammarTargets: ["formal usted commands"],
    communicationFunctions: ["command", "compliance check", "document request"],
    objectives: [
      { id: "identify", label: "Identify as an officer", cues: ["oficial", "policía", "buenas"] },
      { id: "hands", label: "Require visible hands", cues: ["manos", "visibles", "verlas"] },
      { id: "engine", label: "Direct the engine off", cues: ["motor", "apague"] },
      { id: "id", label: "Request license or registration", cues: ["licencia", "registro", "identificación"] },
      { id: "check", label: "Check comprehension", cues: ["entiende", "comprende"] },
    ],
    requiredInformation: [
      { id: "identify", cues: ["oficial", "policía", "buenas"] },
      { id: "hands", cues: ["manos", "visibles", "verlas"] },
      { id: "id", cues: ["licencia", "registro", "identificación"] },
    ],
    successCriteria: ["Formal command", "Hands visible", "Document request", "Comprehension check"],
    safetyRules: [{ forbiddenCues: ["cállate", "estúpido", "disparo", "culpable"] }],
    variations: [
      { id: "v-engine", persona: "Luis Mora", openingMessage: "¿Qué pasa? No oigo bien y el carro sigue encendido." },
      { id: "v-hands", persona: "Elena Cruz", openingMessage: "No entiendo. ¿Por qué me detiene?" },
    ],
    masterScript: [
      "Buenas tardes. Soy oficial de policía.",
      "Apague el motor ahora mismo.",
      "Mantenga las manos donde pueda verlas.",
      "Necesito su licencia de conducir.",
      "¿Entiende esta instrucción?",
    ],
    conversationBeats: [
      { id: "identify", assistantMessage: "Buenas tardes. No oí bien. ¿Puede repetir?" },
      { id: "hands", assistantMessage: "Mis manos están aquí. El motor sigue encendido." },
      { id: "id", assistantMessage: "Aquí está mi licencia. ¿Necesita el registro también?" },
      { id: "progress", assistantMessage: "¿Me puede explicar más despacio, por favor?" },
    ],
  }),
  scenario({
    id: "law-l1-identity",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l2",
    cefr: "A2",
    title: "Identity verification and warrants",
    description: "Verify name, date of birth, and ID. Report warrant status without accusing.",
    studentRole: "officer",
    aiRole: "subject",
    context: "Fictional field identification. Students verify; they do not guess.",
    difficulty: "beginner",
    estimatedDuration: 8,
    openingMessage: "¿Por qué necesita mi nombre? No tengo nada.",
    closingMessage: "Está bien. Voy a esperar mientras verifica.",
    targetVocabulary: ["nombre completo", "fecha de nacimiento", "documento", "orden"],
    grammarTargets: ["usted questions"],
    communicationFunctions: ["identity question", "verification", "neutral status"],
    objectives: [
      { id: "name", label: "Ask for full name", cues: ["nombre", "completo"] },
      { id: "dob", label: "Ask date of birth", cues: ["nacimiento", "fecha"] },
      { id: "id", label: "Request ID document", cues: ["documento", "identidad", "identificación"] },
      { id: "verify", label: "State verification", cues: ["verificar", "verifico"] },
    ],
    requiredInformation: [
      { id: "name", cues: ["nombre"] },
      { id: "id", cues: ["documento", "identidad", "identificación"] },
      { id: "verify", cues: ["verificar", "verifico", "verifique"] },
    ],
    successCriteria: ["Identity question", "Document request", "Neutral verification"],
    safetyRules: [{ forbiddenCues: ["culpable", "mentiroso", "estúpido"] }],
    variations: [
      { id: "v-alias", persona: "Pablo Ruiz", openingMessage: "¿Por qué necesita mi nombre? No tengo nada." },
      { id: "v-dob", persona: "Ana Mora", openingMessage: "No oigo bien. ¿Qué necesita?" },
    ],
    masterScript: [
      "¿Cuál es su nombre completo?",
      "Deme su documento de identidad.",
      "Voy a verificar esta información.",
      "El sistema indica una orden activa.",
    ],
    conversationBeats: [
      { id: "name", assistantMessage: "Me llamo Pablo Ruiz. A veces me dicen Paco." },
      { id: "id", assistantMessage: "Aquí está mi documento. ¿Está bien?" },
      { id: "verify", assistantMessage: "Está bien. Espero aquí." },
      { id: "progress", assistantMessage: "No entiendo. ¿Puede preguntar otra vez?" },
    ],
  }),
  scenario({
    id: "law-l1-sfst",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l3",
    cefr: "A2",
    title: "SFST language sequence",
    description: "Give sequenced movement instructions and check comprehension. Language practice only.",
    studentRole: "officer",
    aiRole: "driver",
    context: "Classroom SFST language. Official testing is outside this course.",
    difficulty: "beginner",
    estimatedDuration: 7,
    openingMessage: "¿Qué tengo que hacer? No entiendo.",
    closingMessage: "Sí, ahora entiendo. Espero su instrucción.",
    targetVocabulary: ["pies", "cabeza", "bolígrafo", "talón", "empiece"],
    grammarTargets: ["negative commands", "sequencing"],
    communicationFunctions: ["direction", "sequence", "comprehension check"],
    objectives: [
      { id: "attention", label: "Establish attention", cues: ["escuch", "atención"] },
      { id: "feet", label: "Feet together", cues: ["pies"] },
      { id: "wait", label: "Do not start yet", cues: ["empiece", "indique"] },
      { id: "check", label: "Confirm comprehension", cues: ["comprende", "entiende"] },
    ],
    requiredInformation: [
      { id: "feet", cues: ["pies"] },
      { id: "wait", cues: ["empiece", "indique"] },
      { id: "check", cues: ["comprende", "entiende"] },
    ],
    successCriteria: ["Sequenced instruction", "Comprehension check"],
    safetyRules: [{ forbiddenCues: ["borracho", "culpable"] }],
    variations: [
      { id: "v-early", persona: "Rosa Díaz", openingMessage: "¿Qué tengo que hacer? No entiendo." },
    ],
    masterScript: [
      "Mantenga los pies juntos.",
      "No empiece hasta que yo se lo indique.",
      "Siga la punta de mi bolígrafo.",
      "¿Comprende la instrucción?",
    ],
    conversationBeats: [
      { id: "feet", assistantMessage: "Mis pies están juntos. ¿Ahora camino?" },
      { id: "wait", assistantMessage: "Está bien. Espero." },
      { id: "check", assistantMessage: "Sí, ahora entiendo." },
      { id: "progress", assistantMessage: "¿Puede repetir más despacio?" },
    ],
  }),
  scenario({
    id: "law-l1-custody",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l4",
    cefr: "A2",
    title: "Custody transition and Miranda language",
    description: "Approved classroom rights-language and concise custody commands. Not legal advice.",
    studentRole: "officer",
    aiRole: "subject",
    context: "Fictional custodial-language practice. Rights wording must follow agency policy in real settings.",
    difficulty: "beginner",
    estimatedDuration: 8,
    openingMessage: "¿Qué está pasando? No entiendo.",
    closingMessage: "Entiendo. Voy a escuchar.",
    targetVocabulary: ["manos", "arresto", "silencio", "abogado"],
    grammarTargets: ["formal commands", "rights statements"],
    communicationFunctions: ["custody command", "rights language", "comprehension"],
    objectives: [
      { id: "hands", label: "Hands behind back", cues: ["manos", "espalda"] },
      { id: "arrest", label: "Status statement", cues: ["arresto"] },
      { id: "rights", label: "Approved rights language", cues: ["silencio", "abogado", "derecho"] },
      { id: "check", label: "Comprehension check", cues: ["comprende", "entiende"] },
    ],
    requiredInformation: [
      { id: "hands", cues: ["manos", "espalda"] },
      { id: "rights", cues: ["silencio", "abogado", "derecho"] },
      { id: "check", cues: ["comprende", "entiende"] },
    ],
    successCriteria: ["Custody command", "Approved rights language", "Comprehension check"],
    safetyRules: [{ forbiddenCues: ["disparo", "estúpido"] }],
    variations: [
      { id: "v-rights", persona: "Mario Soto", openingMessage: "¿Qué está pasando? No entiendo." },
    ],
    masterScript: [
      "Ponga las manos detrás de la espalda.",
      "Tiene derecho a permanecer en silencio.",
      "Tiene derecho a un abogado.",
      "¿Comprende estos derechos?",
    ],
    conversationBeats: [
      { id: "hands", assistantMessage: "Mis manos están atrás. ¿Qué sigue?" },
      { id: "rights", assistantMessage: "Estoy escuchando. ¿Puede repetir lo del abogado?" },
      { id: "check", assistantMessage: "Sí, entiendo." },
      { id: "progress", assistantMessage: "Hable más despacio, por favor." },
    ],
  }),
  scenario({
    id: "law-l1-integrated",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l5",
    cefr: "A2",
    title: "Integrated traffic stop sequence",
    description: "Combine opening, documents, clarification, and documentation language in one classroom scenario.",
    studentRole: "officer",
    aiRole: "driver",
    context: "Staged communication sequence from Lessons 1–4. Pause for comprehension after each stage.",
    difficulty: "intermediate",
    estimatedDuration: 10,
    openingMessage: "Buenas tardes. No sé por qué me detiene.",
    closingMessage: "Entiendo. Voy a esperar aquí.",
    targetVocabulary: ["manos", "licencia", "registro", "nombre", "entiende"],
    grammarTargets: ["usted commands and questions"],
    communicationFunctions: ["opening", "documents", "clarification", "documentation"],
    objectives: [
      { id: "hands", label: "Visible hands", cues: ["manos"] },
      { id: "docs", label: "License and registration", cues: ["licencia", "registro"] },
      { id: "name", label: "Full name", cues: ["nombre"] },
      { id: "check", label: "Comprehension check", cues: ["entiende", "comprende"] },
    ],
    requiredInformation: [
      { id: "hands", cues: ["manos"] },
      { id: "docs", cues: ["licencia", "registro"] },
      { id: "check", cues: ["entiende", "comprende"] },
    ],
    successCriteria: ["Sequenced tasks", "Comprehension checks"],
    safetyRules: [{ forbiddenCues: ["mentiroso", "culpable", "cállate"] }],
    variations: [
      { id: "v-seq", persona: "Diego López", openingMessage: "Buenas tardes. No sé por qué me detiene." },
    ],
    masterScript: [
      "Buenas tardes. Por favor, mantenga las manos visibles.",
      "Necesito ver su licencia y registro.",
      "¿Cuál es su nombre completo?",
      "¿Entiende esta instrucción?",
    ],
    conversationBeats: [
      { id: "hands", assistantMessage: "Mis manos están en el volante." },
      { id: "docs", assistantMessage: "Aquí está la licencia. Busco el registro." },
      { id: "check", assistantMessage: "Sí, entiendo." },
      { id: "progress", assistantMessage: "¿Puede repetir, por favor?" },
    ],
  }),
  scenario({
    id: "law-l1-documentation",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l6",
    cefr: "A2",
    title: "Neutral field documentation",
    description: "Separate observed facts, reported statements, verified items, and unverified gaps.",
    studentRole: "officer",
    aiRole: "supervisor",
    context: "After a fictional stop, a supervisor asks for a neutral oral report before the form is filed.",
    difficulty: "intermediate",
    estimatedDuration: 7,
    openingMessage: "Oficial, dígame qué observó y qué informó la persona. No quiero conclusiones.",
    closingMessage: "Bien. Separe lo verificado de lo pendiente.",
    targetVocabulary: ["observé", "indicó", "verificada", "confirmar"],
    grammarTargets: ["preterite reporting"],
    communicationFunctions: ["report facts", "label uncertainty"],
    objectives: [
      { id: "observed", label: "State an observation", cues: ["observé", "observ"] },
      { id: "reported", label: "State what was reported", cues: ["indicó", "informó", "dijo"] },
      { id: "pending", label: "Label unverified information", cues: ["confirmar", "verificar", "pendiente"] },
    ],
    requiredInformation: [
      { id: "observed", cues: ["observé", "observ"] },
      { id: "reported", cues: ["indicó", "informó", "dijo"] },
      { id: "pending", cues: ["confirmar", "verificar", "pendiente"] },
    ],
    successCriteria: ["Fact vs report", "Uncertainty labeled"],
    safetyRules: [{ forbiddenCues: ["borracho", "peligroso", "mentía"] }],
    variations: [
      { id: "v-report", persona: "Sargento Cruz", openingMessage: "Oficial, dígame qué observó y qué informó la persona. No quiero conclusiones." },
    ],
    masterScript: [
      "Observé que el vehículo seguía encendido.",
      "La persona indicó que no oía bien.",
      "No se pudo confirmar el registro.",
    ],
    conversationBeats: [
      { id: "observed", assistantMessage: "Anote lo observado. ¿Qué informó la persona?" },
      { id: "reported", assistantMessage: "Bien. ¿Qué falta por verificar?" },
      { id: "pending", assistantMessage: "Correcto. Mantenga un lenguaje neutral." },
      { id: "progress", assistantMessage: "Separe hechos de interpretaciones, por favor." },
    ],
  }),
  scenario({
    id: "law-l1-deescalation",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l7",
    cefr: "A2",
    title: "Clarification and de-escalation language",
    description: "Repair misunderstanding with calm, specific, respectful Spanish.",
    studentRole: "officer",
    aiRole: "driver",
    context: "The driver is confused and speaking quickly. Invite clarification instead of assuming.",
    difficulty: "beginner",
    estimatedDuration: 6,
    openingMessage: "¡No entiendo nada! Hable más rápido no me ayuda.",
    closingMessage: "Gracias. Ahora entiendo el siguiente paso.",
    targetVocabulary: ["despacio", "repetir", "confirmar", "calma"],
    grammarTargets: ["polite requests"],
    communicationFunctions: ["clarify", "slow down", "confirm"],
    objectives: [
      { id: "slow", label: "Ask to slow down or repeat", cues: ["despacio", "repet"] },
      { id: "confirm", label: "Confirm understanding", cues: ["confirmar", "entendí", "comprende"] },
      { id: "next", label: "Explain next step", cues: ["siguiente", "paso"] },
    ],
    requiredInformation: [
      { id: "slow", cues: ["despacio", "repet"] },
      { id: "confirm", cues: ["confirmar", "entendí", "comprende", "entiende"] },
    ],
    successCriteria: ["Repair language", "Professional register"],
    safetyRules: [{ forbiddenCues: ["cállate", "estúpido"] }],
    variations: [
      { id: "v-fast", persona: "Lucía Peña", openingMessage: "¡No entiendo nada! Hable más rápido no me ayuda." },
    ],
    masterScript: [
      "Hable más despacio, por favor.",
      "Voy a repetir la instrucción.",
      "¿Comprende la instrucción?",
      "Le explicaré el siguiente paso.",
    ],
    conversationBeats: [
      { id: "slow", assistantMessage: "Gracias. Ahora escucho." },
      { id: "confirm", assistantMessage: "Sí, ahora entiendo." },
      { id: "progress", assistantMessage: "¿Cuál es el siguiente paso?" },
    ],
  }),
  scenario({
    id: "law-l1-capstone",
    programId: "law",
    level: 1,
    unitId: "unit-1-field-communication",
    lessonId: "l8",
    cefr: "A2",
    title: "Unit 1 capstone — integrated field communication",
    description: "Demonstrate opening, identity, comprehension, movement language, and approved rights language in one coherent classroom scenario.",
    studentRole: "officer",
    aiRole: "driver",
    context: "Fictional traffic violation. Score the /20 unit rubric. Language assessment only.",
    difficulty: "intermediate",
    estimatedDuration: 12,
    openingMessage: "Buenas tardes. ¿Me puede decir qué está pasando?",
    closingMessage: "Entiendo. Voy a cooperar y esperar.",
    targetVocabulary: ["manos", "licencia", "nombre", "pies", "silencio", "abogado"],
    grammarTargets: ["integrated usted register"],
    communicationFunctions: ["command", "verify", "check", "rights", "document"],
    objectives: [
      { id: "open", label: "Opening command", cues: ["buenas", "manos", "oficial"] },
      { id: "id", label: "Identity / documents", cues: ["licencia", "nombre", "registro"] },
      { id: "check", label: "Comprehension check", cues: ["entiende", "comprende"] },
      { id: "move", label: "Movement instruction", cues: ["pies", "bolígrafo", "empiece"] },
      { id: "rights", label: "Approved rights language", cues: ["silencio", "abogado", "derecho"] },
    ],
    requiredInformation: [
      { id: "open", cues: ["buenas", "manos", "oficial"] },
      { id: "id", cues: ["licencia", "nombre", "registro"] },
      { id: "check", cues: ["entiende", "comprende"] },
      { id: "rights", cues: ["silencio", "abogado", "derecho"] },
    ],
    successCriteria: ["Integrated sequence", "Professional register", "Approved rights language"],
    safetyRules: [{ forbiddenCues: ["culpable", "mentiroso", "cállate", "disparo"] }],
    variations: [
      { id: "v-cap", persona: "Héctor Vela", openingMessage: "Buenas tardes. ¿Me puede decir qué está pasando?" },
    ],
    masterScript: [
      "Buenas tardes. Mantenga las manos visibles.",
      "Necesito su licencia y su nombre completo.",
      "¿Entiende esta instrucción?",
      "Tiene derecho a permanecer en silencio.",
      "Tiene derecho a un abogado.",
    ],
    conversationBeats: [
      { id: "open", assistantMessage: "Mis manos están visibles. ¿Qué necesita?" },
      { id: "id", assistantMessage: "Me llamo Héctor Vela. Aquí está la licencia." },
      { id: "check", assistantMessage: "Sí, entiendo." },
      { id: "rights", assistantMessage: "Estoy escuchando." },
      { id: "progress", assistantMessage: "¿Cuál es el siguiente paso?" },
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
    masterScript: [
      "Hoy todos llevan casco y chaleco.",
      "Usted trabaja en el segundo piso.",
      "Use la escalera con cuidado.",
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
    academic_notice: Boolean(row.academicNotice) || row.programId === "law",
    atmosphere: atmosphereFor(row.programId),
    master_script: row.masterScript || [],
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
