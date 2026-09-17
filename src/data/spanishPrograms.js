const ACADEMY_ID = "spanish-academy";

const PROGRAM_GROUPS = [
  { id: "academic", title: "General & Academic Spanish" },
  { id: "professional", title: "Professional & Industry Spanish" },
  { id: "care", title: "Health, Care & Human Services" },
  { id: "career", title: "Career & Professional Development" },
  { id: "continuing", title: "Specialized & Continuing Education" },
];

const FLAGSHIP_IDS = ["medical", "customer_service", "law", "construction"];

const PROGRAMS = [
  { id: "general", groupId: "academic", name: "General Spanish", nameEs: "Español General", status: "available" },
  { id: "middle_school", groupId: "academic", name: "Middle School Spanish", nameEs: "Español para Secundaria", status: "planned" },
  { id: "high_school", groupId: "academic", name: "High School Spanish", nameEs: "Español para Bachillerato", status: "planned" },
  { id: "university", groupId: "academic", name: "College & University Spanish", nameEs: "Español Universitario", status: "planned" },
  { id: "adult", groupId: "academic", name: "Adult Spanish", nameEs: "Español para Adultos", status: "planned" },
  { id: "medical", groupId: "professional", name: "Medical Spanish", nameEs: "Español Médico", status: "flagship" },
  { id: "dental", groupId: "professional", name: "Dental Spanish", nameEs: "Español Dental", status: "planned" },
  { id: "law", groupId: "professional", name: "Law Enforcement Spanish", nameEs: "Español para las Fuerzas del Orden", status: "flagship" },
  { id: "customer_service", groupId: "professional", name: "Customer Service Spanish", nameEs: "Español para Servicio al Cliente", status: "flagship" },
  { id: "business", groupId: "professional", name: "Business Spanish", nameEs: "Español de Negocios", status: "available" },
  { id: "construction", groupId: "professional", name: "Construction Spanish", nameEs: "Español para la Construcción", status: "flagship" },
  { id: "manufacturing", groupId: "professional", name: "Manufacturing Spanish", nameEs: "Español para la Manufactura", status: "planned" },
  { id: "warehouse", groupId: "professional", name: "Warehouse & Logistics Spanish", nameEs: "Español para Almacenes y Logística", status: "planned" },
  { id: "transportation", groupId: "professional", name: "Transportation & Trucking Spanish", nameEs: "Español para el Transporte y Camioneros", status: "planned" },
  { id: "agriculture", groupId: "professional", name: "Agriculture & Farm Spanish", nameEs: "Español para la Agricultura", status: "planned" },
  { id: "hospitality", groupId: "professional", name: "Hospitality & Tourism Spanish", nameEs: "Español para Hotelería y Turismo", status: "available" },
  { id: "food_service", groupId: "professional", name: "Food Service Spanish", nameEs: "Español para Servicios de Alimentos", status: "planned" },
  { id: "retail", groupId: "professional", name: "Retail Spanish", nameEs: "Español para Ventas y Comercio Minorista", status: "planned" },
  { id: "automotive", groupId: "professional", name: "Automotive Spanish", nameEs: "Español para la Industria Automotriz", status: "planned" },
  { id: "real_estate", groupId: "professional", name: "Real Estate Spanish", nameEs: "Español Inmobiliario", status: "planned" },
  { id: "banking", groupId: "professional", name: "Banking & Financial Services Spanish", nameEs: "Español Bancario y Financiero", status: "planned" },
  { id: "insurance", groupId: "professional", name: "Insurance Spanish", nameEs: "Español para Seguros", status: "planned" },
  { id: "legal", groupId: "professional", name: "Legal Spanish", nameEs: "Español Jurídico", status: "planned" },
  { id: "education", groupId: "professional", name: "Education Spanish", nameEs: "Español para la Educación", status: "planned" },
  { id: "technology", groupId: "professional", name: "Technology & IT Spanish", nameEs: "Español para Tecnología e Informática", status: "planned" },
  { id: "workplace", groupId: "professional", name: "Workplace Spanish", nameEs: "Español para el Entorno Laboral", status: "planned" },
  { id: "remote", groupId: "professional", name: "Remote Work Spanish", nameEs: "Español para el Trabajo Remoto", status: "available" },
  { id: "senior_care", groupId: "care", name: "Senior Care Spanish", nameEs: "Español para el Cuidado de Adultos Mayores", status: "planned" },
  { id: "childcare", groupId: "care", name: "Childcare Spanish", nameEs: "Español para el Cuidado Infantil", status: "planned" },
  { id: "veterinary", groupId: "care", name: "Veterinary Spanish", nameEs: "Español Veterinario", status: "planned" },
  { id: "emergency", groupId: "care", name: "Emergency Services Spanish", nameEs: "Español para Servicios de Emergencia", status: "planned" },
  { id: "public_safety", groupId: "care", name: "Public Safety Spanish", nameEs: "Español para la Seguridad Pública", status: "planned" },
  { id: "social_services", groupId: "care", name: "Social Services Spanish", nameEs: "Español para Servicios Sociales", status: "planned" },
  { id: "community", groupId: "care", name: "Community Services Spanish", nameEs: "Español para Servicios Comunitarios", status: "planned" },
  { id: "career", groupId: "career", name: "Career Spanish", nameEs: "Español para el Desarrollo Profesional", status: "planned" },
  { id: "professional_communication", groupId: "career", name: "Professional Communication Spanish", nameEs: "Español para la Comunicación Profesional", status: "planned" },
  { id: "interview", groupId: "career", name: "Interview & Employment Spanish", nameEs: "Español para Entrevistas y Empleo", status: "planned" },
  { id: "global_employment", groupId: "career", name: "Spanish for Global Employment", nameEs: "Español para el Empleo Global", status: "planned" },
  { id: "advanced_professional", groupId: "career", name: "Advanced Professional Spanish", nameEs: "Español Profesional Avanzado", status: "planned" },
  { id: "specialized", groupId: "continuing", name: "Spanish for Specialized Professions", nameEs: "Español para Profesiones Especializadas", status: "planned" },
  { id: "certification", groupId: "continuing", name: "Spanish Certification Preparation", nameEs: "Preparación para Certificaciones de Español", status: "planned" },
  { id: "continuing", groupId: "continuing", name: "Continuing Spanish Education", nameEs: "Educación Continua de Español", status: "planned" },
];

function getProgram(id) {
  return PROGRAMS.find((row) => row.id === id) || null;
}

function catalog() {
  return {
    academyId: ACADEMY_ID,
    hierarchy: ["program", "level", "unit", "lesson", "learning_activities", "simulation", "assessment", "mastery"],
    groups: PROGRAM_GROUPS.map((group) => ({
      ...group,
      programs: PROGRAMS.filter((row) => row.groupId === group.id),
    })),
    flagshipProgramIds: FLAGSHIP_IDS,
  };
}

module.exports = { ACADEMY_ID, PROGRAM_GROUPS, PROGRAMS, FLAGSHIP_IDS, getProgram, catalog };
