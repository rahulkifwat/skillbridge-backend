const PRESENTERS = {
  medical: {
    uniform: "clinical scrubs",
    setting: "community clinic intake desk",
    voiceProfile: "calm_clear_empathetic",
    enginePreference: ["heygen", "synthesia"],
  },
  law: {
    uniform: "tactical duty uniform",
    setting: "roadside traffic stop",
    voiceProfile: "assertive_firm_tactical",
    enginePreference: ["heygen", "synthesia"],
  },
  customer_service: {
    uniform: "corporate business attire",
    setting: "professional support floor",
    voiceProfile: "warm_precise_service",
    enginePreference: ["heygen", "synthesia"],
  },
  construction: {
    uniform: "high-visibility vest and hard hat",
    setting: "residential jobsite briefing",
    voiceProfile: "clear_directive_site",
    enginePreference: ["heygen", "synthesia"],
  },
};

const VIDEOS = [
  {
    id: "vid-medical-intake",
    title: "Patient intake in 3 minutes",
    programId: "medical",
    simulationId: "med-l1-patient-intake",
    durationHintMin: 2,
    durationHintMax: 3,
    bucketKey: "vid-medical-intake.mp4",
    src: null,
    summary: "Watch a clinic greeting, name check, and symptom question with operational Spanish.",
    script: [
      { es: "Buenos días. Bienvenido a la clínica.", en: "Good morning. Welcome to the clinic." },
      { es: "¿Cómo se llama, por favor?", en: "What is your name, please?" },
      { es: "¿Me confirma su fecha de nacimiento?", en: "Can you confirm your date of birth?" },
      { es: "¿Qué le duele hoy?", en: "What hurts today?" },
      { es: "¿Desde cuándo tiene este dolor?", en: "How long have you had this pain?" },
      { es: "¿Toma algún medicamento?", en: "Are you taking any medication?" },
      { es: "¿Tiene alguna alergia?", en: "Do you have any allergies?" },
      { es: "Voy a anotar los síntomas para la enfermera.", en: "I will note the symptoms for the nurse." },
      { es: "Espere aquí, por favor. Ya lo llaman.", en: "Please wait here. They will call you shortly." },
    ],
  },
  {
    id: "vid-customer-order",
    title: "Delayed-order support in 3 minutes",
    programId: "customer_service",
    simulationId: "cs-l1-order-delay",
    durationHintMin: 2,
    durationHintMax: 3,
    bucketKey: "vid-customer-order.mp4",
    src: null,
    summary: "See a professional greeting, order-number request, and a clear next step.",
    script: [
      { es: "Buenos días. ¿En qué puedo ayudarle?", en: "Good morning. How can I help you?" },
      { es: "Lamento el retraso de su pedido.", en: "I am sorry your order is delayed." },
      { es: "¿Me da el número de pedido, por favor?", en: "May I have the order number, please?" },
      { es: "Voy a revisar el envío ahora mismo.", en: "I will check the shipment right now." },
      { es: "El paquete está en tránsito.", en: "The package is in transit." },
      { es: "Le envío el número de seguimiento por correo.", en: "I will email you the tracking number." },
      { es: "¿El correo que tenemos es correcto?", en: "Is the email we have on file correct?" },
      { es: "Gracias por su paciencia. ¿Puedo ayudarle en algo más?", en: "Thank you for your patience. Can I help with anything else?" },
      { es: "Que tenga un buen día.", en: "Have a good day." },
    ],
  },
  {
    id: "vid-law-traffic",
    title: "Calm traffic-stop Spanish in 3 minutes",
    programId: "law",
    simulationId: "law-l1-traffic-stop",
    durationHintMin: 2,
    durationHintMax: 3,
    bucketKey: "vid-law-traffic.mp4",
    src: null,
    summary: "Identify yourself, request identification, and explain the stop without raising tension.",
    script: [
      { es: "Buenas tardes. Soy oficial de policía.", en: "Good afternoon. I am a police officer." },
      { es: "Por favor, permanezca en el vehículo.", en: "Please remain in the vehicle." },
      { es: "¿Me muestra su identificación?", en: "Will you show me your identification?" },
      { es: "Necesito ver su licencia, por favor.", en: "I need to see your license, please." },
      { es: "Lo detuve porque no respetó la señal de alto.", en: "I stopped you because you did not obey the stop sign." },
      { es: "Mantenga las manos donde yo pueda verlas.", en: "Keep your hands where I can see them." },
      { es: "Voy a revisar los documentos. Espere aquí.", en: "I will check the documents. Wait here." },
      { es: "¿Habla inglés, o seguimos en español?", en: "Do you speak English, or shall we continue in Spanish?" },
      { es: "Gracias por su cooperación.", en: "Thank you for your cooperation." },
    ],
  },
  {
    id: "vid-construction-jobsite",
    title: "Jobsite briefing in 3 minutes",
    programId: "construction",
    simulationId: "con-l1-jobsite",
    durationHintMin: 2,
    durationHintMax: 3,
    bucketKey: "vid-construction-jobsite.mp4",
    src: null,
    summary: "Require PPE and assign a task in short, clear Spanish.",
    script: [
      { es: "Buenos días, equipo. Atención un momento.", en: "Good morning, team. Attention for a moment." },
      { es: "Hoy todos llevan casco y chaleco.", en: "Today everyone wears a hard hat and vest." },
      { es: "No suba sin guantes.", en: "Do not go up without gloves." },
      { es: "Usted trabaja en el segundo piso.", en: "You work on the second floor." },
      { es: "Use la escalera con cuidado.", en: "Use the ladder carefully." },
      { es: "Si ve un riesgo, avise de inmediato.", en: "If you see a hazard, report it immediately." },
      { es: "¿Entendió la instrucción?", en: "Did you understand the instruction?" },
      { es: "Repita la tarea, por favor.", en: "Repeat the task, please." },
      { es: "Bien. Empezamos. Cuidado con los materiales.", en: "Good. We start now. Watch the materials." },
    ],
  },
];

function listVideos() {
  return VIDEOS.map((row) => ({ ...row, presenter: PRESENTERS[row.programId] }));
}

function getVideo(id) {
  return listVideos().find((row) => row.id === id) || null;
}

function videoForSimulation(simulationId) {
  return listVideos().find((row) => row.simulationId === simulationId) || null;
}

module.exports = { VIDEOS, PRESENTERS, listVideos, getVideo, videoForSimulation };
