const ATMOSPHERE = {
  medical: {
    id: "clinic",
    label: "Clinic floor",
    loops: ["heart-monitor", "clinic-chatter"],
  },
  law: {
    id: "roadside",
    label: "Traffic stop",
    loops: ["radio-static", "outdoor-traffic"],
  },
  construction: {
    id: "jobsite",
    label: "Jobsite yard",
    loops: ["site-yard", "light-machinery"],
  },
  customer_service: {
    id: "contact-center",
    label: "Support floor",
    loops: ["soft-phones", "room-tone"],
  },
};

function atmosphereFor(programId) {
  return ATMOSPHERE[programId] || ATMOSPHERE.customer_service;
}

module.exports = { ATMOSPHERE, atmosphereFor };
