const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const SKILLS = ["grammar", "vocabulary", "reading", "listening", "writing", "speaking"];

const BACKGROUND_START_LEVEL = {
  never: "A0",
  little: "A1",
  studied: "A2",
  speakSome: "B1",
  professional: "B1",
};

const GOAL_SPECIALTY = {
  growth: "general",
  travel: "travel",
  living: "general",
  family: "general",
  education: "k12",
  business: "business",
  healthcare: "medical",
  lawEnforcement: "law",
  customerService: "customer_service",
  teaching: "k12",
  remote: "remote",
  career: "business",
};

const SPECIALTY_LABEL = {
  general: "General Spanish / Spanish for Daily Life",
  medical: "Medical / Healthcare Spanish",
  law: "Law Enforcement Spanish",
  k12: "Middle School / K–12 Spanish",
  business: "Business Spanish",
  customer_service: "Customer Service Spanish",
  travel: "Travel & Relocation Spanish",
  remote: "Remote Collaboration Spanish",
  hospitality: "Hospitality & Tourism Spanish",
};

const WRITING_WEIGHTS = {
  task: 0.2,
  organization: 0.2,
  vocabulary: 0.2,
  grammar: 0.2,
  register: 0.2,
};

const SPEAKING_WEIGHTS = {
  task: 0.2,
  pronunciation: 0.2,
  fluency: 0.2,
  vocabulary: 0.15,
  grammar: 0.15,
  register: 0.1,
};

function publicItem(item) {
  return {
    itemId: item.itemId,
    domain: item.domain,
    cefrLevel: item.cefrLevel,
    category: item.category,
    questionType: item.questionType,
    prompt: item.prompt,
    options: item.options || null,
    mediaNote: item.mediaNote || null,
    audioScript: item.audioScript || null,
    guidance: item.guidance || null,
    estimatedTime: item.estimatedTime,
    minDurationSec: item.minDurationSec || null,
  };
}

function nextLevel(level) {
  const index = LEVELS.indexOf(level);
  if (index < 0 || index >= LEVELS.length - 1) return level;
  return LEVELS[index + 1];
}

function previousLevel(level) {
  const index = LEVELS.indexOf(level);
  if (index <= 0) return level;
  return LEVELS[index - 1];
}

function pickFromPool(pool, count, exclude) {
  const copy = pool.filter((item) => !exclude.has(item.itemId));
  const selected = [];
  while (copy.length && selected.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    selected.push(copy.splice(index, 1)[0]);
  }
  if (selected.length < count) {
    const fallback = pool.filter((item) => !selected.includes(item) && !exclude.has(item.itemId));
    while (fallback.length && selected.length < count) {
      const index = Math.floor(Math.random() * fallback.length);
      selected.push(fallback.splice(index, 1)[0]);
    }
  }
  for (const item of selected) exclude.add(item.itemId);
  return selected;
}

function itemsForSkill(bank, skill, level, specialty, count, exclude) {
  const picked = [];
  if (specialty && specialty !== "general") {
    const specialtyPool = bank.filter((item) => item.domain === skill && item.category === specialty);
    const atLevel = specialtyPool.filter((item) => item.cefrLevel === level);
    picked.push(...pickFromPool(atLevel.length ? atLevel : specialtyPool, count, exclude));
  }
  if (picked.length < count) {
    const exact = bank.filter(
      (item) => item.domain === skill && item.cefrLevel === level && item.category === "general"
    );
    picked.push(...pickFromPool(exact, count - picked.length, exclude));
  }
  if (picked.length < count) {
    const nearby = bank.filter(
      (item) => item.domain === skill && item.category === "general" && !picked.includes(item)
    );
    picked.push(...pickFromPool(nearby, count - picked.length, exclude));
  }
  return picked;
}

function buildForm(bank, { backgroundId, goalId, excludeItemIds } = {}) {
  const startLevel = BACKGROUND_START_LEVEL[backgroundId] || "A1";
  const specialty = GOAL_SPECIALTY[goalId] || "general";
  const exclude = excludeItemIds instanceof Set ? excludeItemIds : new Set(excludeItemIds || []);
  const form = [];
  for (const skill of SKILLS) {
    const count = skill === "writing" || skill === "speaking" ? 1 : 2;
    form.push(...itemsForSkill(bank, skill, startLevel, specialty, count, exclude));
  }
  return { startLevel, specialty, form };
}

function wordStats(text) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const unique = new Set(words.map((word) => word.toLowerCase().replace(/[^\p{L}]/gu, ""))).size;
  const sentences = String(text || "").split(/[.!?¿¡]+/).filter((part) => part.trim()).length;
  return { words: words.length, unique, sentences };
}

function clamp100(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreWriting(text, minWords) {
  const { words, unique, sentences } = wordStats(text);
  const task = Math.min(100, (words / Math.max(minWords, 1)) * 100);
  const organization = Math.min(100, sentences * 25);
  const vocabulary = words ? Math.min(100, (unique / words) * 140) : 0;
  const grammar = /[áéíóúñü¿¡]/i.test(text) ? 80 : words > 8 ? 55 : 30;
  const register = /\b(ok|yeah|u|lol)\b/i.test(text) ? 50 : 80;
  const breakdown = { task, organization, vocabulary, grammar, register };
  const total =
    breakdown.task * WRITING_WEIGHTS.task +
    breakdown.organization * WRITING_WEIGHTS.organization +
    breakdown.vocabulary * WRITING_WEIGHTS.vocabulary +
    breakdown.grammar * WRITING_WEIGHTS.grammar +
    breakdown.register * WRITING_WEIGHTS.register;
  return { score: clamp100(total), breakdown };
}

function scoreSpeaking(text, minWords, artifact = {}) {
  const writing = scoreWriting(text, minWords);
  const durationSec = Number(artifact.durationMs || 0) / 1000;
  const pronunciation = artifact.recorded ? Math.min(100, 50 + durationSec * 4) : writing.breakdown.grammar;
  const fluency = artifact.recorded
    ? Math.min(100, durationSec >= 20 ? 88 : durationSec * 4)
    : Math.min(100, writing.breakdown.organization);
  const breakdown = {
    task: writing.breakdown.task,
    pronunciation,
    fluency,
    vocabulary: writing.breakdown.vocabulary,
    grammar: writing.breakdown.grammar,
    register: writing.breakdown.register,
  };
  const total =
    breakdown.task * SPEAKING_WEIGHTS.task +
    breakdown.pronunciation * SPEAKING_WEIGHTS.pronunciation +
    breakdown.fluency * SPEAKING_WEIGHTS.fluency +
    breakdown.vocabulary * SPEAKING_WEIGHTS.vocabulary +
    breakdown.grammar * SPEAKING_WEIGHTS.grammar +
    breakdown.register * SPEAKING_WEIGHTS.register;
  return { score: clamp100(total), breakdown };
}

function scoreItemDetail(item, value, artifact) {
  if (item.questionType === "mcq") {
    const score = Number(value) === item.answerKey ? 100 : 0;
    return { score, breakdown: { accuracy: score } };
  }
  const minWords = item.minWords || (item.domain === "writing" ? 40 : 20);
  if (item.domain === "speaking") return scoreSpeaking(value, minWords, artifact);
  return scoreWriting(value, minWords);
}

function scoreItem(item, value, artifact) {
  return scoreItemDetail(item, value, artifact).score;
}

const PUNITIVE = /\b(wrong|incorrect|false|you failed|that's wrong)\b/i;

function encouragingFeedback(item, score) {
  const skill = item?.domain || "this skill";
  let message;
  if (Number(score) >= 100) {
    message = `Nice work on ${skill}. That response shows you understood the situation.`;
  } else if (Number(score) >= 70) {
    message = `You are communicating clearly in ${skill}. Keep using complete, respectful language.`;
  } else {
    message = `Keep going. This ${skill} item helps us find a good starting point — a little more practice here will build confidence.`;
  }
  if (PUNITIVE.test(message)) {
    message = "Keep going. Each attempt helps us place the next practice step.";
  }
  return message;
}

function feedbackForAnswers(form, answers, artifacts) {
  const safeAnswers = answers && typeof answers === "object" ? answers : {};
  const safeArtifacts = artifacts && typeof artifacts === "object" ? artifacts : {};
  const rows = {};
  for (const item of form || []) {
    if (safeAnswers[item.itemId] === undefined || safeAnswers[item.itemId] === null || safeAnswers[item.itemId] === "") {
      continue;
    }
    const result = scoreItemDetail(item, safeAnswers[item.itemId], safeArtifacts[item.itemId]);
    rows[item.itemId] = {
      message: encouragingFeedback(item, result.score),
      strong: result.score >= 70,
    };
  }
  return rows;
}

function skillScores(form, answers, artifacts) {
  const safeAnswers = answers && typeof answers === "object" ? answers : {};
  const safeArtifacts = artifacts && typeof artifacts === "object" ? artifacts : {};
  const bySkill = {};
  const details = {};
  for (const skill of SKILLS) {
    const items = form.filter((item) => item.domain === skill);
    if (!items.length) {
      bySkill[skill] = 0;
      details[skill] = [];
      continue;
    }
    const rows = items.map((item) => {
      const result = scoreItemDetail(item, safeAnswers[item.itemId], safeArtifacts[item.itemId]);
      return {
        itemId: item.itemId,
        competencyId: `spanish.${skill}.${item.cefrLevel}`,
        cefrLevel: item.cefrLevel,
        score: result.score,
        breakdown: result.breakdown,
      };
    });
    details[skill] = rows;
    bySkill[skill] = Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length);
  }
  return { bySkill, details };
}

function overallFromSkills(scores) {
  const values = SKILLS.map((skill) => scores[skill] || 0);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function cefrFromOverall(overall, startLevel) {
  if (overall < 28) return startLevel === "A0" || startLevel === "A1" ? "A0" : previousLevel(startLevel);
  if (overall < 42) return "A1";
  if (overall < 55) return "A2";
  if (overall < 68) return "B1";
  if (overall < 80) return "B2";
  if (overall < 92) return "C1";
  return "C2";
}

function strengthsAndPriorities(scores) {
  const ranked = SKILLS.map((skill) => ({ skill, score: scores[skill] || 0 })).sort(
    (left, right) => right.score - left.score
  );
  return {
    strengths: ranked.filter((item) => item.score >= 70).slice(0, 3),
    priorities: ranked.filter((item) => item.score < 70).sort((left, right) => left.score - right.score).slice(0, 3),
  };
}

function evidenceFromDetails(details, scores) {
  return SKILLS.map((skill) => {
    const rows = details[skill] || [];
    return {
      skill,
      score: scores[skill] || 0,
      competencyIds: rows.map((row) => row.competencyId),
      itemIds: rows.map((row) => row.itemId),
      recommendation: (scores[skill] || 0) < 70
        ? `Practice ${skill} items at the confirmed CEFR band; this recommendation is from ${rows.length} scored item(s).`
        : `Maintain ${skill} with specialty simulations; evidence from ${rows.length} item(s).`,
    };
  });
}

function maybeCredential(profile) {
  const ready = profile.overallScore >= 70 && SKILLS.every((skill) => (profile.skillScores[skill] || 0) >= 45);
  if (!ready) return null;
  return {
    name: `Spanish Academy ${profile.cefrLevel} diagnostic competency`,
    competencies: profile.evidence.flatMap((row) => row.competencyIds),
    issuedAt: new Date().toISOString(),
    note: "Issued for demonstrated diagnostic performance, not employment placement.",
  };
}

function buildProfile({ fullName, specialty, startLevel, scores, details = {} }) {
  const overall = overallFromSkills(scores);
  const cefrLevel = cefrFromOverall(overall, startLevel);
  const { strengths, priorities } = strengthsAndPriorities(scores);
  const specialtyLabel = SPECIALTY_LABEL[specialty] || SPECIALTY_LABEL.general;
  const evidence = evidenceFromDetails(details, scores);
  const path = `Core Spanish ${cefrLevel} + ${specialtyLabel} + targeted ${
    priorities[0] ? priorities[0].skill : "practice"
  } modules`;

  const profile = {
    academyId: "spanish-academy",
    greeting: `¡Hola, ${fullName.split(" ")[0]}!`,
    title: "Your Spanish Profile",
    cefrLevel,
    overallScore: overall,
    skillScores: scores,
    specialty,
    specialtyLabel,
    specialtyNote:
      "Specialty results show learning readiness and gaps. They do not imply licensure or job qualification.",
    strengths,
    priorities,
    evidence,
    confidence: overall >= 75 ? "high" : overall >= 55 ? "moderate" : "emerging",
    recommendedPath: path,
    nextMilestone: priorities[0]
      ? `Raise ${priorities[0].skill} with level-${cefrLevel} practice before the next diagnostic.`
      : `Maintain ${cefrLevel} performance in simulations, then reassess.`,
    reassessment: "Retake after completing the recommended practice cycle. Historical attempts are kept.",
  };
  profile.credential = maybeCredential(profile);
  return profile;
}

module.exports = {
  BACKGROUND_START_LEVEL,
  GOAL_SPECIALTY,
  LEVELS,
  SKILLS,
  SPECIALTY_LABEL,
  SPEAKING_WEIGHTS,
  WRITING_WEIGHTS,
  buildForm,
  buildProfile,
  encouragingFeedback,
  feedbackForAnswers,
  cefrFromOverall,
  nextLevel,
  overallFromSkills,
  publicItem,
  scoreItem,
  scoreItemDetail,
  scoreSpeaking,
  scoreWriting,
  skillScores,
};
