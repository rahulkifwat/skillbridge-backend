const GREEN = 0.85;
const YELLOW = 0.55;

function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-záéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function overlapRatio(heard, expected) {
  const a = new Set(tokens(heard));
  const b = tokens(expected);
  if (!b.length) return 0;
  const hits = b.filter((word) => a.has(word)).length;
  return hits / b.length;
}

function bestAgainstScript(heard, masterScript) {
  const lines = (masterScript || []).map(String).filter(Boolean);
  if (!lines.length) return overlapRatio(heard, heard);
  let best = 0;
  for (const line of lines) best = Math.max(best, overlapRatio(heard, line));
  const joined = overlapRatio(heard, lines.join(" "));
  return Math.max(best, joined * 0.9);
}

function bandFor(score) {
  if (score >= GREEN) return "green";
  if (score >= YELLOW) return "yellow";
  return "red";
}

function scorePronunciation(heard, masterScript) {
  const score = Number(bestAgainstScript(heard, masterScript).toFixed(3));
  const band = bandFor(score);
  return {
    score,
    band,
    fluency:
      band === "green"
        ? "Immediate fluent command"
        : band === "yellow"
          ? "Clear comprehension with a minor accent"
          : "Needs another pass on the target phrases",
    rerun: band === "red",
  };
}

module.exports = { GREEN, YELLOW, tokens, overlapRatio, scorePronunciation, bandFor };
