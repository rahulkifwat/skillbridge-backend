/**
 * Spanish → English-approximation phonetic guide.
 *
 * The Production Master Blueprint (SBS-2026-PRODUCTION-002 §2) requires that
 * "every voice track line must include an immediate phonetic guide". The Unit 1
 * teacher edition hand-writes a few of them, e.g.
 *
 *   Licencia de conducir  →  lee-SEN-syah deh kon-doo-SEER
 *   Registro del vehículo →  reh-HEES-troh del veh-EE-koo-loh
 *
 * Spanish orthography is near-phonemic, so the rest are derived by rule rather
 * than authored by hand. The rules below were fitted to the two hand-written
 * examples above, which the test suite pins as regressions. Anything the
 * curriculum spells out explicitly wins via OVERRIDES — the generator never
 * silently overrules a human-authored guide.
 */

// Hand-authored guides taken verbatim from the Unit 1 teacher edition.
const OVERRIDES = {
  "licencia de conducir": "lee-SEN-syah deh kon-doo-SEER",
  "registro del vehículo": "reh-HEES-troh del veh-EE-koo-loh",
};

const ACCENTS = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" };
const STRONG = new Set(["a", "e", "o"]);
const WEAK = new Set(["i", "u"]);
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// Consonant pairs Spanish never splits across a syllable boundary.
const INSEPARABLE = new Set([
  "pr", "br", "tr", "dr", "cr", "gr", "fr",
  "pl", "bl", "cl", "gl", "fl",
  "ll", "rr", "ch",
]);

function isVowel(character) {
  return VOWELS.has(character) || Object.hasOwn(ACCENTS, character);
}

function stripAccent(character) {
  return ACCENTS[character] || character;
}

/**
 * Splits a word into syllables, recording which ones carry a written accent.
 * Returns [{ text, accented }].
 */
function syllabify(word) {
  const letters = [...word];
  // Group into vowel nuclei and the consonant runs between them.
  const groups = [];
  let index = 0;

  while (index < letters.length) {
    if (isVowel(letters[index])) {
      const nucleus = [letters[index]];
      index += 1;
      // Absorb following vowels that form a diphthong with this one.
      while (index < letters.length && isVowel(letters[index])) {
        const previous = nucleus[nucleus.length - 1];
        const current = letters[index];
        const previousAccented = Object.hasOwn(ACCENTS, previous);
        const currentAccented = Object.hasOwn(ACCENTS, current);
        const base = stripAccent(previous);
        const currentBase = stripAccent(current);
        const bothStrong = STRONG.has(base) && STRONG.has(currentBase);
        // An accented weak vowel breaks the diphthong (ví-a, dí-as).
        const accentedWeakBreak =
          (WEAK.has(base) && previousAccented) || (WEAK.has(currentBase) && currentAccented);
        if (bothStrong || accentedWeakBreak) break;
        nucleus.push(current);
        index += 1;
      }
      groups.push({ type: "vowel", text: nucleus.join("") });
    } else {
      const run = [];
      while (index < letters.length && !isVowel(letters[index])) {
        run.push(letters[index]);
        index += 1;
      }
      groups.push({ type: "consonant", text: run.join("") });
    }
  }

  // Distribute each consonant run between the syllables it sits between.
  const syllables = [];
  let pending = "";

  groups.forEach((group, position) => {
    if (group.type === "consonant") {
      const isFinalRun = position === groups.length - 1;
      if (isFinalRun || syllables.length === 0 && !pending) {
        // Leading cluster attaches forward; trailing cluster closes the word.
        pending += group.text;
        return;
      }
      const run = group.text;
      let toPrevious = "";
      let toNext = "";

      if (run.length === 1) {
        toNext = run;
      } else if (run.length === 2) {
        if (INSEPARABLE.has(run.toLowerCase())) toNext = run;
        else {
          toPrevious = run[0];
          toNext = run[1];
        }
      } else if (run.length === 3) {
        if (INSEPARABLE.has(run.slice(1).toLowerCase())) {
          toPrevious = run[0];
          toNext = run.slice(1);
        } else {
          toPrevious = run.slice(0, 2);
          toNext = run[2];
        }
      } else {
        toPrevious = run.slice(0, 2);
        toNext = run.slice(2);
      }

      if (syllables.length) syllables[syllables.length - 1].text += toPrevious;
      else pending += toPrevious;
      pending += toNext;
      return;
    }

    syllables.push({ text: pending + group.text, accented: [...group.text].some((c) => Object.hasOwn(ACCENTS, c)) });
    pending = "";
  });

  if (pending && syllables.length) syllables[syllables.length - 1].text += pending;
  else if (pending) syllables.push({ text: pending, accented: false });

  return syllables;
}

/** Index of the stressed syllable, by the standard Spanish rules. */
function stressIndex(syllables, word) {
  const written = syllables.findIndex((syllable) => syllable.accented);
  if (written >= 0) return written;
  if (syllables.length < 2) return 0;
  const last = word[word.length - 1];
  // Ends in a vowel, -n or -s → penultimate. Otherwise → final.
  if (isVowel(last) || last === "n" || last === "s") return syllables.length - 2;
  return syllables.length - 1;
}

/** Maps one syllable's spelling to an English-readable approximation. */
function renderSyllable(syllable, nextSyllable) {
  const letters = [...syllable.toLowerCase()];
  // A syllable is "open" when it ends on its vowel; open vowels get the long
  // -h forms ("deh", "troh"), closed ones stay short ("del", "kon").
  const open = isVowel(letters[letters.length - 1]);
  let out = "";
  let i = 0;

  while (i < letters.length) {
    const character = letters[i];
    const next = letters[i + 1] || "";
    const nextIsFrontVowel = ["e", "i", "é", "í"].includes(next);

    if (character === "h") {
      i += 1; // Silent in Spanish.
      continue;
    }
    if (character === "c" && next === "h") {
      out += "ch";
      i += 2;
      continue;
    }
    if (character === "c") {
      out += nextIsFrontVowel ? "s" : "k";
      i += 1;
      continue;
    }
    if (character === "q") {
      out += "k";
      i += next === "u" ? 2 : 1; // "qu" is /k/.
      continue;
    }
    if (character === "z") {
      out += "s";
      i += 1;
      continue;
    }
    if (character === "j") {
      out += "h";
      i += 1;
      continue;
    }
    if (character === "g" && nextIsFrontVowel) {
      out += "h";
      i += 1;
      continue;
    }
    if (character === "g" && next === "u" && ["e", "i", "é", "í"].includes(letters[i + 2] || "")) {
      out += "g";
      i += 2; // "gue"/"gui" — the u is silent.
      continue;
    }
    if (character === "l" && next === "l") {
      out += "y";
      i += 2;
      continue;
    }
    if (character === "r" && next === "r") {
      out += "rr";
      i += 2;
      continue;
    }
    if (character === "ñ") {
      out += "ny";
      i += 1;
      continue;
    }
    if (isVowel(character)) {
      const base = stripAccent(character);
      const followingVowel = letters[i + 1] && isVowel(letters[i + 1]);
      // A weak vowel gliding into another vowel becomes a y/w glide
      // ("cia" → "syah", "cuo" → "kwoh").
      if (followingVowel && WEAK.has(base) && !Object.hasOwn(ACCENTS, character)) {
        out += base === "i" ? "y" : "w";
        i += 1;
        continue;
      }
      const lastVowelInSyllable = !letters.slice(i + 1).some((c) => isVowel(c));
      const lengthen = open && lastVowelInSyllable;
      if (base === "a") out += lengthen ? "ah" : "a";
      else if (base === "e") out += lengthen ? "eh" : "e";
      else if (base === "i") out += "ee";
      else if (base === "o") out += lengthen ? "oh" : "o";
      else if (base === "u") out += "oo";
      i += 1;
      continue;
    }

    out += character === "v" ? "v" : character;
    i += 1;
  }

  // A syllable ending in a vowel that is followed by another syllable starting
  // with a vowel keeps its long form; nothing to adjust here today.
  void nextSyllable;
  return out;
}

/** Phonetic guide for a single word, e.g. "conducir" → "kon-doo-SEER". */
function wordGuide(word) {
  const cleaned = word.toLowerCase().replace(/[^a-záéíóúüñ]/gi, "");
  if (!cleaned) return "";
  const syllables = syllabify(cleaned);
  if (!syllables.length) return cleaned;
  const stressed = stressIndex(syllables, cleaned);
  // Monosyllables stay lowercase unless they carry a written accent — the
  // teacher edition prints "deh" and "del", not "DEH" and "DEL". An accented
  // monosyllable ("cuál", "más") is genuinely stressed, so it keeps the caps.
  const markStress = syllables.length > 1 || syllables.some((syllable) => syllable.accented);
  return syllables
    .map((syllable, index) => {
      const rendered = renderSyllable(syllable.text, syllables[index + 1]?.text);
      return markStress && index === stressed ? rendered.toUpperCase() : rendered;
    })
    .join("-");
}

/**
 * Phonetic guide for a full line of Spanish. Punctuation is dropped; each word
 * is hyphenated by syllable with the stressed syllable in capitals.
 */
function phoneticGuide(spanish) {
  const text = String(spanish || "").trim();
  if (!text) return "";

  const key = text
    .toLowerCase()
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (OVERRIDES[key]) return OVERRIDES[key];

  return text
    .split(/\s+/)
    .map((word) => wordGuide(word))
    .filter(Boolean)
    .join(" ");
}

module.exports = { phoneticGuide, wordGuide, syllabify, stressIndex, OVERRIDES };
