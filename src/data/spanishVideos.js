const VIDEOS = [
  {
    id: "vid-medical-intake",
    title: "Patient intake in 3 minutes",
    programId: "medical",
    simulationId: "med-l1-patient-intake",
    durationHintMin: 2,
    durationHintMax: 3,
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    summary: "Watch how a clinic greeting, name check, and symptom question sound in Spanish.",
  },
  {
    id: "vid-customer-order",
    title: "Delayed-order support in 3 minutes",
    programId: "customer_service",
    simulationId: "cs-l1-order-delay",
    durationHintMin: 2,
    durationHintMax: 3,
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    summary: "See a professional greeting, order-number request, and a clear next step.",
  },
  {
    id: "vid-law-traffic",
    title: "Calm traffic-stop Spanish in 3 minutes",
    programId: "law",
    simulationId: "law-l1-traffic-stop",
    durationHintMin: 2,
    durationHintMax: 3,
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    summary: "Identify yourself, request identification, and explain the stop without raising tension.",
  },
  {
    id: "vid-construction-jobsite",
    title: "Jobsite briefing in 3 minutes",
    programId: "construction",
    simulationId: "con-l1-jobsite",
    durationHintMin: 2,
    durationHintMax: 3,
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    summary: "Require PPE and assign a task in short, clear Spanish.",
  },
];

function listVideos() {
  return VIDEOS.map((row) => ({ ...row }));
}

function getVideo(id) {
  return VIDEOS.find((row) => row.id === id) || null;
}

function videoForSimulation(simulationId) {
  return VIDEOS.find((row) => row.simulationId === simulationId) || null;
}

module.exports = { VIDEOS, listVideos, getVideo, videoForSimulation };
