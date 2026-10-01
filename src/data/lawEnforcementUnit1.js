const ACADEMIC_NOTICE =
  "This curriculum is for lawful professional education, classroom simulation, and language practice. It does not replace agency policy, instructor certification, local law, or official operational procedures. Classroom forms are educational templates, not official agency documents.";

const LANGUAGE_BANK = [
  { en: "Driver's license", es: "Licencia de conducir" },
  { en: "Vehicle registration", es: "Registro del vehículo" },
  { en: "Identification document", es: "Documento de identidad" },
  { en: "Full name", es: "Nombre completo" },
  { en: "Date of birth", es: "Fecha de nacimiento" },
  { en: "Active arrest warrant", es: "Orden de arresto activa" },
  { en: "Keep your hands visible", es: "Mantenga las manos donde pueda verlas." },
  { en: "Step out of the vehicle", es: "Salga del vehículo." },
  { en: "Do not move", es: "No se mueva." },
  { en: "Follow the tip of my pen", es: "Siga la punta de mi bolígrafo." },
  { en: "Walk heel-to-toe", es: "Camine en línea recta poniendo el talón delante de la punta." },
  { en: "You have the right to remain silent", es: "Tiene derecho a permanecer en silencio." },
  { en: "You have the right to an attorney", es: "Tiene derecho a un abogado." },
  { en: "Please explain again", es: "Explíquelo nuevamente, por favor." },
];

const SUCCESS_CRITERIA = [
  "Uses complete Spanish commands",
  "Checks comprehension appropriately",
  "Distinguishes direct facts from assumptions",
  "Completes forms legibly",
  "Uses professional register",
  "Performs a structured simulation",
];

const CAPSTONE_RUBRIC = [
  { id: "commands", label: "Commands", max: 4 },
  { id: "identity", label: "Identity language", max: 4 },
  { id: "comprehension", label: "Comprehension checks", max: 4 },
  { id: "register", label: "Professional register", max: 4 },
  { id: "documentation", label: "Documentation", max: 4 },
];

const FINAL_ASSESSMENT = {
  totalPoints: 60,
  components: [
    { id: "traffic", label: "Traffic-stop communication", points: 10 },
    { id: "identity", label: "Identity verification", points: 10 },
    { id: "sfst", label: "SFST language sequence", points: 10 },
    { id: "custody", label: "Custody / Miranda language", points: 10 },
    { id: "documentation", label: "Documentation / forms", points: 10 },
    { id: "register", label: "Professional register", points: 10 },
  ],
};

const LESSONS = [
  {
    id: "l1",
    number: 1,
    title: "High-risk traffic stop",
    titleEs: "Alto riesgo en un control de tráfico",
    focus: "Initial commands, vehicle-control language, compliance checks",
    simulationId: "law-l1-traffic-stop",
    videoId: "vid-law-traffic",
    formId: "patrol-f-card",
    teacherCue: "Model each command twice: naturally, then slowly. Identify the verb, repeat, then explain purpose.",
    commands: [
      { en: "Step out of the car immediately", es: "Salga del vehículo inmediatamente." },
      { en: "Keep your hands visible", es: "Mantenga las manos donde pueda verlas." },
      { en: "Turn off the engine", es: "Apague el motor ahora mismo." },
      { en: "No sudden movements", es: "No haga ningún movimiento brusco." },
      { en: "Driver's license", es: "Licencia de conducir" },
      { en: "Vehicle registration", es: "Registro del vehículo" },
    ],
  },
  {
    id: "l2",
    number: 2,
    title: "Suspect identification and warrants",
    titleEs: "Identificación y órdenes",
    focus: "Identity verification, documentation, active-warrant language",
    simulationId: "law-l1-identity",
    videoId: "vid-law-identity",
    formId: "identity-log",
    teacherCue: "Prioritize accuracy and respectful questioning. Verify names, dates, and ID. Meaning first, then grammar.",
    commands: [
      { en: "What is your full name?", es: "¿Cuál es su nombre completo?" },
      { en: "Give me your ID document.", es: "Deme su documento de identidad." },
      { en: "Active arrest warrant", es: "Orden de arresto activa" },
      { en: "Stay back / Do not move.", es: "Permanezca atrás. / No se mueva." },
      { en: "Date of birth", es: "Fecha de nacimiento" },
    ],
    registerRepair: [
      { avoid: "Usted es culpable.", prefer: "El sistema indica una orden activa." },
      { avoid: "Sé que usted miente.", prefer: "Necesito verificar esta información." },
    ],
  },
  {
    id: "l3",
    number: 3,
    title: "SFST / DUI communication",
    titleEs: "Pruebas de sobriedad — lenguaje",
    focus: "Physical-direction commands and comprehension checks",
    simulationId: "law-l1-sfst",
    videoId: "vid-law-sfst",
    formId: "sfst-observation",
    teacherCue: "Short cycles: model, choral repetition, partner practice, comprehension check. Language practice only — not an official SFST.",
    commands: [
      { en: "Follow the tip of my pen.", es: "Siga la punta de mi bolígrafo." },
      { en: "Do not move your head.", es: "No mueva la cabeza durante la prueba." },
      { en: "Walk heel-to-toe.", es: "Camine en línea recta poniendo el talón delante de la punta." },
      { en: "Keep your feet together.", es: "Mantenga los pies juntos." },
      { en: "Do not start until I tell you.", es: "No empiece hasta que yo se lo indique." },
    ],
  },
  {
    id: "l4",
    number: 4,
    title: "Extraction, handcuffing language, Miranda",
    titleEs: "Custodia y lectura de derechos",
    focus: "Custodial-transition vocabulary and approved rights-language practice",
    simulationId: "law-l1-custody",
    videoId: "vid-law-custody",
    formId: "rights-card",
    teacherCue: "Use only approved classroom rights-language. Do not substitute unofficial legal wording. Focus on sequence and comprehension.",
    commands: [
      { en: "Put your hands behind your back.", es: "Ponga las manos detrás de la espalda." },
      { en: "Under arrest.", es: "Está bajo arresto." },
      { en: "Right to remain silent.", es: "Tiene derecho a permanecer en silencio." },
      { en: "Anything you say can be used.", es: "Todo lo que diga puede ser utilizado." },
      { en: "You have the right to an attorney.", es: "Tiene derecho a un abogado." },
      { en: "Do not move.", es: "No se mueva." },
    ],
  },
  {
    id: "l5",
    number: 5,
    title: "Integrated traffic stop",
    titleEs: "Control de tráfico integrado",
    focus: "Sequence multiple communication tasks without losing clarity",
    simulationId: "law-l1-integrated",
    videoId: "vid-law-traffic",
    formId: "integrated-record",
    teacherCue: "Perform the sequence in stages. Pause after each stage and require a comprehension check.",
    commands: [
      { en: "Keep your hands visible.", es: "Buenas tardes. Por favor, mantenga las manos visibles." },
      { en: "License and registration.", es: "Necesito ver su licencia y registro." },
      { en: "Full name.", es: "¿Cuál es su nombre completo?" },
      { en: "I will verify this information.", es: "Voy a verificar esta información." },
      { en: "Remain here.", es: "Permanezca aquí mientras terminamos la verificación." },
      { en: "Do you understand?", es: "¿Entiende esta instrucción?" },
    ],
    repairs: [
      { problem: "Dame eso.", repair: "Necesito ver su licencia y registro, por favor." },
      { problem: "Tú estás mintiendo.", repair: "Necesito verificar esta información." },
      { problem: "¿Entendiste?", repair: "¿Entiende esta instrucción?" },
    ],
  },
  {
    id: "l6",
    number: 6,
    title: "Documentation and field forms",
    titleEs: "Documentación e informes",
    focus: "Record facts, reports, verification, and uncertainty without inference",
    simulationId: "law-l1-documentation",
    videoId: "vid-law-identity",
    formId: "field-report",
    teacherCue: "Record only observable or explicitly reported information. Separate facts, reports, verification, and uncertainty.",
    commands: [
      { en: "I observed", es: "Observé ____________________." },
      { en: "The person reported", es: "La persona indicó ____________________." },
      { en: "Verified", es: "La información fue verificada ____________________." },
      { en: "Unverified", es: "No se pudo confirmar ____________________." },
      { en: "Follow-up needed", es: "Se requiere verificar ____________________." },
    ],
  },
  {
    id: "l7",
    number: 7,
    title: "Professional register and de-escalation",
    titleEs: "Registro profesional y desescalada",
    focus: "Repair ambiguity and maintain respectful language",
    simulationId: "law-l1-deescalation",
    videoId: "vid-law-custody",
    formId: "coaching",
    teacherCue: "Model calm repair: clarify, repeat, slow down, and confirm meaning instead of assuming.",
    commands: [
      { en: "Clarify", es: "¿Puede explicarlo nuevamente, por favor?" },
      { en: "Confirm", es: "Quiero confirmar que entendí correctamente." },
      { en: "Slow down", es: "Hable más despacio, por favor." },
      { en: "Repeat", es: "Voy a repetir la instrucción." },
      { en: "Ask for cooperation", es: "Necesito que coopere con esta instrucción." },
      { en: "Confirm understanding", es: "¿Comprende la instrucción?" },
    ],
  },
  {
    id: "l8",
    number: 8,
    title: "Capstone simulation",
    titleEs: "Simulación integradora",
    focus: "Demonstrate integrated Level 1 communication",
    simulationId: "law-l1-capstone",
    videoId: "vid-law-capstone",
    formId: "capstone-record",
    teacherCue: "Run as a structured language assessment. Observe without unnecessary interruption. Score the unit rubric /20.",
    commands: [
      { en: "Opening command", es: "Buenas tardes. Mantenga las manos visibles." },
      { en: "Identity request", es: "Necesito su licencia y su nombre completo." },
      { en: "Comprehension check", es: "¿Entiende esta instrucción?" },
      { en: "Movement instruction", es: "Mantenga los pies juntos. No empiece hasta que yo se lo indique." },
      { en: "Approved rights language", es: "Tiene derecho a permanecer en silencio. Tiene derecho a un abogado." },
    ],
    stages: [
      "Initial contact",
      "Vehicle / identity",
      "Clarification",
      "Movement / testing language",
      "Custody / rationale language",
      "Documentation",
    ],
  },
];

const FORMS = {
  "patrol-f-card": {
    title: "Patrol unit F-card / vehicle field citation",
    fields: ["plate", "make", "model", "color", "driverName", "registrationVerified", "insurance", "primaryLanguage", "notes"],
  },
  "identity-log": {
    title: "Suspect identity verification log",
    fields: ["lastName", "firstName", "alias", "dateOfBirth", "idType", "idNumber", "status", "warrantStatus", "source", "notes"],
  },
  "sfst-observation": {
    title: "Classroom SFST language observation sheet",
    fields: ["student", "scenario", "instruction", "comprehension", "accuracy", "pronunciation", "notes"],
  },
  "rights-card": {
    title: "Constitutional rights statement (classroom template)",
    fields: ["subject", "date", "time", "rightsVersion", "comprehensionCheck", "questions", "languageSupport", "notes"],
  },
  "integrated-record": {
    title: "Integrated traffic stop record",
    fields: ["scenario", "dateTime", "vehicle", "identity", "primaryLanguage", "commands", "comprehensionCheck", "outcome", "notes"],
  },
  "field-report": {
    title: "Field communication report",
    fields: ["caseNumber", "dateTime", "location", "person", "languageUsed", "observed", "reported", "verified", "pending", "notes"],
  },
  coaching: {
    title: "Language coaching conference",
    fields: ["student", "strength", "accuracyIssue", "pronunciationIssue", "registerIssue", "documentationIssue", "nextTarget", "notes"],
  },
  "capstone-record": {
    title: "Capstone performance record",
    fields: ["student", "scenario", "opening", "identity", "comprehension", "movement", "closing", "documentation", "notes"],
  },
};

function unit() {
  return {
    academyId: "spanish-academy",
    programId: "law",
    programName: "Law Enforcement Spanish",
    level: 1,
    unit: 1,
    title: "Foundational Field Communication",
    titleEs: "Comunicación de campo fundamental",
    pages: 49,
    format: "Teacher edition — large print QC master",
    lessonCount: LESSONS.length,
    topics: [
      "Traffic stops",
      "Identification",
      "SFST communication",
      "Vehicle extractions",
      "Handcuffing language",
      "Miranda warning",
    ],
    academicNotice: ACADEMIC_NOTICE,
    successCriteria: SUCCESS_CRITERIA,
    languageBank: LANGUAGE_BANK,
    lessons: LESSONS,
    forms: FORMS,
    capstoneRubric: CAPSTONE_RUBRIC,
    finalAssessment: FINAL_ASSESSMENT,
    practiceRule: "85% practice / 15% concise theory",
  };
}

function getLesson(id) {
  return LESSONS.find((row) => row.id === id || String(row.number) === String(id)) || null;
}

module.exports = {
  ACADEMIC_NOTICE,
  LANGUAGE_BANK,
  SUCCESS_CRITERIA,
  LESSONS,
  FORMS,
  unit,
  getLesson,
};
