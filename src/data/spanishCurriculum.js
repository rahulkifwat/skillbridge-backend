const BANDS = {
  A0: "foundational",
  A1: "foundational",
  A2: "foundational",
  B1: "intermediate",
  B2: "intermediate",
  C1: "advanced",
  C2: "advanced",
};

const UNITS = {
  foundational: [
    "Sounds and greetings",
    "Introductions and identity",
    "Numbers, time and dates",
    "Family and people",
    "Daily routines",
    "Places in the city",
    "Food and needs",
    "School and work basics",
    "Directions and transport",
    "Shopping and services",
    "Review of survival language",
    "Foundational performance task",
  ],
  intermediate: [
    "Narration of past events",
    "Opinions and reasons",
    "Future plans",
    "Problem solving in Spanish",
    "Travel and relocation",
    "Community interactions",
    "Workplace basics",
    "Culture and pragmatics",
    "Interpretation of short texts",
    "Extended writing",
    "Presentations",
    "Intermediate capstone",
  ],
  advanced: [
    "Complex structures and nuance",
    "Argumentation",
    "Register and tone",
    "Professional scenarios",
    "Pragmatics and implication",
    "Interpretation of dense texts",
    "Formal writing",
    "Advanced presentations",
    "Analysis and synthesis",
    "Negotiation",
    "Specialty discourse",
    "Advanced capstone",
  ],
};

function curriculumForProfile(profile) {
  const band = BANDS[profile.cefrLevel] || "foundational";
  const priorities = (profile.priorities || []).map((item) => item.skill);
  return {
    level: profile.cefrLevel,
    band,
    specialty: profile.specialtyLabel,
    units: UNITS[band].map((title, index) => ({
      index: index + 1,
      title,
      status: index === 0 ? "next" : "locked",
      emphasis: priorities[index] || null,
    })),
    practiceRule: "85% practice / 15% concise theory",
    nextActivity: profile.nextMilestone,
  };
}

module.exports = { curriculumForProfile, BANDS, UNITS };
