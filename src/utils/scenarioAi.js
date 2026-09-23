const axios = require("axios");
const env = require("../config/env");
const { pickVariation } = require("../data/simulationScenarios");

const CURRICULUM_POOL = {
  medical: [
    {
      id: "ceph-18h",
      persona: "María Soto",
      fieldCondition: "Headache for 18 hours, no fever, possible ibuprofen at home",
      openingMessage: "Buenos días. Vengo porque me duele la cabeza desde ayer.",
    },
    {
      id: "gi-night",
      persona: "Carlos Vega",
      fieldCondition: "Stomach pain since last night, no known drug allergy",
      openingMessage: "Hola. Tengo dolor de estómago desde anoche.",
    },
    {
      id: "allergy-rash",
      persona: "Elena Ríos",
      fieldCondition: "Itchy rash after a new antibiotic, breathing comfortable",
      openingMessage: "Buenos días. Me salió un sarpullido después de un medicamento.",
    },
  ],
  law: [
    {
      id: "stop-sign",
      persona: "Luis Mora",
      fieldCondition: "Failed to obey a stop sign, license in wallet",
      openingMessage: "Buenas tardes. ¿Qué pasa, oficial?",
    },
    {
      id: "speed",
      persona: "Elena Cruz",
      fieldCondition: "Excess speed in a school zone, nervous but cooperative",
      openingMessage: "No entiendo. ¿Por qué me detiene?",
    },
    {
      id: "light",
      persona: "Pablo Ruiz",
      fieldCondition: "Red light violation, passenger in the car",
      openingMessage: "Oficial, la luz estaba amarilla. ¿Puedo explicar?",
    },
  ],
  customer_service: [
    {
      id: "delay-ana",
      persona: "Ana López",
      fieldCondition: "Parcel two weeks late, order CS-2201",
      openingMessage: "Buenos días. Pedí un paquete hace dos semanas y todavía no llega.",
    },
    {
      id: "missing-scan",
      persona: "Diego Ruiz",
      fieldCondition: "No tracking scan for 48 hours, order CS-4419",
      openingMessage: "Hola. Mi pedido CS-4419 no aparece. Estoy preocupado.",
    },
    {
      id: "wrong-item",
      persona: "Lucía Peña",
      fieldCondition: "Delivered item does not match the order, wants a replacement",
      openingMessage: "Buenas. Llegó un artículo que no pedí. Necesito una solución.",
    },
  ],
  construction: [
    {
      id: "second-floor",
      persona: "Jorge Díaz",
      fieldCondition: "Assign second-floor framing, PPE required",
      openingMessage: "Jefe, ¿dónde trabajo hoy?",
    },
    {
      id: "patio-haul",
      persona: "Pablo Herrera",
      fieldCondition: "Move materials to the patio, gloves required",
      openingMessage: "¿Llevo materiales al patio?",
    },
    {
      id: "ladder",
      persona: "Rosa Méndez",
      fieldCondition: "Ladder work on the east wall, hard hat already on",
      openingMessage: "Ya tengo casco. ¿Subo por la escalera este muro?",
    },
  ],
};

function llmConfigured() {
  return Boolean(env.ai.openaiKey || env.ai.anthropicKey);
}

function pickCurriculumCondition(scenario, previousVariationId) {
  const pool = CURRICULUM_POOL[scenario.programId] || [];
  const previous = String(previousVariationId || "").replace(/^dyn-/, "");
  const remaining = pool.filter((row) => row.id !== previous);
  const choice = (remaining.length ? remaining : pool)[0] || {
    id: pickVariation(scenario, previousVariationId).id,
    persona: "Participante",
    fieldCondition: scenario.context,
    openingMessage: scenario.openingMessage,
  };
  return {
    id: `dyn-${choice.id}`,
    persona: choice.persona,
    openingMessage: choice.openingMessage,
    fieldCondition: choice.fieldCondition,
    source: "curriculum-engine",
  };
}

function parseJsonObject(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    return null;
  }
  return null;
}

async function fromOpenAi(scenario) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: env.ai.openaiModel,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return JSON only with keys id, persona, openingMessage (Spanish), fieldCondition. Stay inside the given curriculum. Do not invent medical diagnoses or weapons.",
        },
        {
          role: "user",
          content: JSON.stringify({
            programId: scenario.programId,
            title: scenario.title,
            context: scenario.context,
            cefr: scenario.cefr,
            targetVocabulary: scenario.targetVocabulary,
            objectives: (scenario.objectives || []).map((row) => row.label),
          }),
        },
      ],
    },
    {
      timeout: 12000,
      headers: { Authorization: `Bearer ${env.ai.openaiKey}` },
    }
  );
  return parseJsonObject(response.data?.choices?.[0]?.message?.content);
}

async function fromClaude(scenario) {
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: env.ai.anthropicModel,
      max_tokens: 400,
      temperature: 0.9,
      messages: [
        {
          role: "user",
          content: `Return JSON with id, persona, openingMessage (Spanish), fieldCondition for this Spanish Academy simulation. Curriculum only:\n${JSON.stringify(
            {
              programId: scenario.programId,
              context: scenario.context,
              vocabulary: scenario.targetVocabulary,
              objectives: (scenario.objectives || []).map((row) => row.label),
            }
          )}`,
        },
      ],
    },
    {
      timeout: 12000,
      headers: {
        "x-api-key": env.ai.anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );
  const text = response.data?.content?.[0]?.text || "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 ? parseJsonObject(text.slice(start, end + 1)) : null;
}

async function generateScenarioVariation(scenario, previousVariationId) {
  const fallback = pickCurriculumCondition(scenario, previousVariationId);
  if (!llmConfigured()) return fallback;

  try {
    const raw = env.ai.openaiKey ? await fromOpenAi(scenario) : await fromClaude(scenario);
    if (!raw?.openingMessage) return fallback;
    return {
      id: String(raw.id || `dyn-llm-${Date.now()}`).slice(0, 80),
      persona: String(raw.persona || fallback.persona).slice(0, 80),
      openingMessage: String(raw.openingMessage).slice(0, 280),
      fieldCondition: String(raw.fieldCondition || fallback.fieldCondition).slice(0, 240),
      source: env.ai.openaiKey ? "openai" : "claude",
    };
  } catch {
    return fallback;
  }
}

module.exports = {
  llmConfigured,
  pickCurriculumCondition,
  generateScenarioVariation,
  CURRICULUM_POOL,
};
