#!/usr/bin/env node
// Schlägt eine deutsche Silbentrennung vor (bestmögliche Annäherung an die
// Duden-Regeln). Nur eine Hilfestellung beim Pflegen von wordlists.js -
// zusammengesetzte Wörter (Komposita, z. B. "Tierärztin") können danebenliegen
// und sollten von Hand geprüft werden (siehe CLAUDE.md).
//
// Aufruf: node tools/hyphenate.js Wort1 Wort2 ...

const isVowel = (ch) => "aeiouyäöüAEIOUYÄÖÜ".includes(ch);
const VOWEL_DIGRAPHS = ["ie", "ei", "ey", "au", "ai", "ay", "eu", "äu", "aa", "ee", "oo", "uu"];
const INSEPARABLE_TAILS = ["ch", "ck", "ph", "th", "sh"];

function findNuclei(word) {
  const lower = word.toLowerCase();
  const nuclei = [];
  let i = 0;
  while (i < word.length) {
    if (isVowel(word[i])) {
      let len = 1;
      if (i + 1 < word.length && VOWEL_DIGRAPHS.includes(lower.slice(i, i + 2))) len = 2;
      nuclei.push({ start: i, end: i + len });
      i += len;
    } else {
      i++;
    }
  }
  return nuclei;
}

function autoHyphenate(word) {
  const nuclei = findNuclei(word);
  if (nuclei.length <= 1) return [word];
  const syllables = [];
  let start = 0;
  for (let n = 0; n < nuclei.length - 1; n++) {
    const consStart = nuclei[n].end;
    const consEnd = nuclei[n + 1].start;
    const cluster = word.slice(consStart, consEnd);
    let splitAt;
    if (cluster.length === 0) {
      splitAt = consStart;
    } else {
      const lower = cluster.toLowerCase();
      let tailLen = 1;
      if (lower.endsWith("sch")) tailLen = 3;
      else if (INSEPARABLE_TAILS.some((t) => lower.endsWith(t))) tailLen = 2;
      splitAt = consEnd - tailLen;
    }
    syllables.push(word.slice(start, splitAt));
    start = splitAt;
  }
  syllables.push(word.slice(start));
  return syllables;
}

const words = process.argv.slice(2);
if (!words.length) {
  console.log("Nutzung: node tools/hyphenate.js Wort1 Wort2 ...");
  process.exit(1);
}
for (const word of words) {
  console.log(`${word} → ${autoHyphenate(word).join("-")}`);
}
