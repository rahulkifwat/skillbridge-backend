const MIN_LESSON_SEC = 120;
const MAX_LESSON_SEC = 180;
const TARGET_LESSON_SEC = 150;
const CONTROLLED_PAUSE_SEC = 1;

function speechSeconds(text, lang) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const wordsPerSec = lang === "es" ? 2.15 : 2.45;
  return Math.max(1.7, Number((words / wordsPerSec).toFixed(2)));
}

function pushPair(items, pair, start) {
  let t = start;
  const esDur = speechSeconds(pair.es, "es");
  items.push({ kind: "spanish", text: pair.es, start: t, duration: esDur });
  t += esDur;
  items.push({ kind: "pause", text: "", start: t, duration: CONTROLLED_PAUSE_SEC });
  t += CONTROLLED_PAUSE_SEC;
  const enDur = speechSeconds(pair.en, "en");
  items.push({ kind: "english", text: pair.en, start: t, duration: enDur });
  t += enDur;
  items.push({ kind: "gap", text: "", start: t, duration: 0.4 });
  t += 0.4;
  return t;
}

function buildLayout(video) {
  const script = Array.isArray(video?.script) ? video.script : [];
  const items = [];
  let t = 0;
  for (const pair of script) t = pushPair(items, pair, t);

  let guard = 0;
  while (t < MIN_LESSON_SEC && script.length && guard < 6) {
    const recap = script.slice(0, Math.min(3, script.length));
    for (const pair of recap) t = pushPair(items, pair, t);
    guard += 1;
  }

  if (t > MAX_LESSON_SEC) {
    const clipped = items.filter((row) => row.start + row.duration <= MAX_LESSON_SEC);
    t = clipped.length ? clipped[clipped.length - 1].start + clipped[clipped.length - 1].duration : MAX_LESSON_SEC;
    items.length = 0;
    items.push(...clipped);
  }

  const durationSec = Math.round(Math.min(MAX_LESSON_SEC, Math.max(MIN_LESSON_SEC, t)));
  return {
    engine: "loop-core",
    pacing: "spanish-phrase → 1s pause → english-translation",
    durationSec,
    targetDurationSec: TARGET_LESSON_SEC,
    presenter: video.presenter || null,
    voiceProfile: video.presenter?.voiceProfile || null,
    forbidden: ["static-text-slides", "clip-art"],
    items,
  };
}

module.exports = {
  MIN_LESSON_SEC,
  MAX_LESSON_SEC,
  TARGET_LESSON_SEC,
  CONTROLLED_PAUSE_SEC,
  speechSeconds,
  buildLayout,
};
