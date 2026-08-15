(() => {
  const STORAGE_KEY = "woerterlesen-listen-v1";
  const SETTINGS_KEY = "woerterlesen-einstellungen-v1";
  const app = document.querySelector("#app");

  // --- Automatische deutsche Silbentrennung (bestmögliche Annäherung an die Duden-Regeln) ---
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

  // Best-effort automatische Silbentrennung. Bei zusammengesetzten Wörtern
  // (z. B. "Tierärztin") kann das Ergebnis danebenliegen, da rein phonetisch
  // getrennt wird - für die Beispiel-Wortlisten sind solche Fälle deshalb
  // von Hand korrigiert. Lehrkräfte können eigene Wörter bei Bedarf mit
  // einem Bindestrich selbst richtig trennen (siehe parseWordLine).
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

  const defaults = [
    { id: "kueche", name: "Küche", words: [
      { word: "Küche", syllables: ["Kü", "che"] },
      { word: "Teller", syllables: ["Tel", "ler"] },
      { word: "Löffel", syllables: ["Löf", "fel"] },
      { word: "Gabel", syllables: ["Ga", "bel"] },
      { word: "Messer", syllables: ["Mes", "ser"] },
      { word: "Topf", syllables: ["Topf"] },
      { word: "Tasse", syllables: ["Tas", "se"] },
      { word: "Glas", syllables: ["Glas"] },
      { word: "Brot", syllables: ["Brot"] },
      { word: "Milch", syllables: ["Milch"] },
    ] },
    { id: "landwirtschaft", name: "Landwirtschaft", words: [
      { word: "Traktor", syllables: ["Trak", "tor"] },
      { word: "Stall", syllables: ["Stall"] },
      { word: "Bauer", syllables: ["Bau", "er"] },
      { word: "Feld", syllables: ["Feld"] },
      { word: "Kuh", syllables: ["Kuh"] },
      { word: "Schwein", syllables: ["Schwein"] },
      { word: "Huhn", syllables: ["Huhn"] },
      { word: "Ernte", syllables: ["Ern", "te"] },
      { word: "Kartoffel", syllables: ["Kar", "tof", "fel"] },
      { word: "Gemüse", syllables: ["Ge", "mü", "se"] },
    ] },
    { id: "berufe", name: "Berufe", words: [
      { word: "Lehrerin", syllables: ["Leh", "re", "rin"] },
      { word: "Arzt", syllables: ["Arzt"] },
      { word: "Bäckerin", syllables: ["Bä", "cke", "rin"] },
      { word: "Polizist", syllables: ["Po", "li", "zist"] },
      { word: "Gärtnerin", syllables: ["Gärt", "ne", "rin"] },
      { word: "Koch", syllables: ["Koch"] },
      { word: "Feuerwehrmann", syllables: ["Feu", "er", "wehr", "mann"] },
      { word: "Tischlerin", syllables: ["Tisch", "le", "rin"] },
      { word: "Busfahrer", syllables: ["Bus", "fah", "rer"] },
      { word: "Tierärztin", syllables: ["Tier", "ärz", "tin"] },
    ] },
  ];

  let state = { list: null, words: [], index: 0 };

  const escapeHtml = (text) => String(text).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));

  // Macht sowohl alte (reine Strings) als auch neue (Objekte mit Silben) gespeicherte Wörter nutzbar.
  const normalizeWord = (entry) => {
    if (entry && typeof entry === "object" && typeof entry.word === "string") {
      const syllables = Array.isArray(entry.syllables) && entry.syllables.length ? entry.syllables : autoHyphenate(entry.word);
      return { word: entry.word, syllables };
    }
    const word = String(entry);
    return { word, syllables: autoHyphenate(word) };
  };

  const getCustomLists = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      return raw.map((list) => ({ ...list, words: (list.words || []).map(normalizeWord) }));
    } catch {
      return [];
    }
  };
  const setCustomLists = (lists) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  const allLists = () => [...defaults, ...getCustomLists()];

  const getSettings = () => {
    try {
      return { syllables: true, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
    } catch {
      return { syllables: true };
    }
  };
  const setSettings = (settings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  const shuffle = (items) => { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
  const stopSpeech = () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  const speak = (word) => {
    if (!("speechSynthesis" in window)) { alert("Das Vorlesen wird von diesem Browser leider nicht unterstützt."); return; }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "de-DE";
    utterance.rate = 0.78;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };
  const render = (html) => { stopSpeech(); app.innerHTML = html; };

  const renderWord = (entry, showSyllables) => {
    if (!showSyllables || entry.syllables.length < 2) {
      return `<span class="syll syll-a">${escapeHtml(entry.word)}</span>`;
    }
    return entry.syllables.map((syllable, i) => `<span class="syll ${i % 2 === 0 ? "syll-a" : "syll-b"}">${escapeHtml(syllable)}</span>`).join("");
  };

  function home() {
    const settings = getSettings();
    const items = allLists().map((list) => `<button class="list-button" data-open="${escapeHtml(list.id)}">${escapeHtml(list.name)} <span>${list.words.length} Wörter&nbsp; →</span></button>`).join("");
    render(`<section class="screen">
      <h1>Wörter lesen</h1>
      <p class="intro">Lies ein Wort laut. Tippe dann auf <strong>Vorlesen</strong> und überprüfe dich.</p>
      <button class="toggle" id="toggle-syllables" aria-pressed="${settings.syllables ? "true" : "false"}">🔤 Silbenschrift: ${settings.syllables ? "An" : "Aus"}</button>
      <h2>Wortliste auswählen</h2>
      <div class="choices">${items}</div>
      <button class="secondary" id="teacher">⚙️ Wortlisten für Lehrkräfte</button>
    </section>`);
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => start(button.dataset.open)));
    app.querySelector("#teacher").addEventListener("click", teacher);
    app.querySelector("#toggle-syllables").addEventListener("click", () => { setSettings({ ...settings, syllables: !settings.syllables }); home(); });
  }

  function start(id) { const list = allLists().find((item) => item.id === id); if (!list) return home(); state = { list, words: shuffle(list.words), index: 0 }; practice(); }

  function practice() {
    if (state.index >= state.words.length) return complete();
    const settings = getSettings();
    const entry = state.words[state.index];
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${state.index + 1} von ${state.words.length}</div></div>
      <div class="word-card"><div class="word">${renderWord(entry, settings.syllables)}</div></div>
      <button id="speak" class="primary speak" aria-label="Das Wort ${escapeHtml(entry.word)} vorlesen">🔊 Vorlesen</button>
      <p class="hint">Erst selbst lesen, dann zum Überprüfen tippen.</p>
      <div class="nav"><button id="back" ${state.index === 0 ? "disabled" : ""}>← Zurück</button><button id="next" class="secondary">${state.index === state.words.length - 1 ? "Fertig" : "Weiter →"}</button></div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => speak(entry.word));
    app.querySelector("#back").addEventListener("click", () => { if (state.index) { state.index--; practice(); } });
    app.querySelector("#next").addEventListener("click", () => { state.index++; practice(); });
  }

  function complete() { render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Wörter gelesen.</p><button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`); app.querySelector("#again").addEventListener("click", () => start(state.list.id)); app.querySelector("#home").addEventListener("click", home); }

  // Eine Zeile aus dem Lehrkraft-Textfeld in {word, syllables} umwandeln.
  // Enthält die Zeile einen Bindestrich, wird das als manuell vorgegebene
  // Silbentrennung interpretiert (z. B. "Trak-tor"); sonst automatische Trennung.
  function parseWordLine(line) {
    const trimmed = line.trim();
    if (trimmed.includes("-")) {
      const syllables = trimmed.split("-").map((s) => s.trim()).filter(Boolean);
      return { word: syllables.join(""), syllables };
    }
    return { word: trimmed, syllables: autoHyphenate(trimmed) };
  }

  function teacher() {
    const custom = getCustomLists();
    const saved = custom.length ? custom.map((list) => `<article class="saved-list"><p><strong>${escapeHtml(list.name)}</strong><br>${list.words.length} Wörter</p><div class="saved-list-actions"><button data-open="${escapeHtml(list.id)}">Üben</button><button class="danger" data-delete="${escapeHtml(list.id)}">Löschen</button></div></article>`).join("") : "<p>Noch keine eigenen Wortlisten gespeichert.</p>";
    render(`<section class="screen">
      <div class="topbar"><button id="home">← Start</button><h1>Wortlisten</h1></div>
      <label>Name der Liste<input id="name" maxlength="50" placeholder="Zum Beispiel: Tiere" /></label>
      <label>Wörter – eines pro Zeile<textarea id="words" placeholder="Hund&#10;Katze&#10;Maus"></textarea></label>
      <p class="field-hint">Die Silbentrennung wird automatisch vorgeschlagen. Passt sie einmal nicht, Silben von Hand mit Bindestrich trennen, z.&nbsp;B. „Trak-tor“.</p>
      <p class="notice" id="notice"></p>
      <div class="teacher-actions"><button id="save" class="primary">Liste speichern</button><button id="clear">Eingabe leeren</button></div>
      <h2>Eigene Wortlisten</h2>
      <div class="choices">${saved}</div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#clear").addEventListener("click", () => { app.querySelector("#name").value = ""; app.querySelector("#words").value = ""; app.querySelector("#name").focus(); });
    app.querySelector("#save").addEventListener("click", () => {
      const name = app.querySelector("#name").value.trim();
      const words = app.querySelector("#words").value.split(/\r?\n/).map((w) => w.trim()).filter(Boolean).map(parseWordLine);
      if (!name || !words.length) { app.querySelector("#notice").textContent = "Bitte einen Namen und mindestens ein Wort eingeben."; return; }
      setCustomLists([...getCustomLists(), { id: `custom-${Date.now()}`, name, words }]);
      teacher();
    });
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => start(button.dataset.open)));
    app.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => { if (confirm("Diese Wortliste wirklich löschen?")) { setCustomLists(getCustomLists().filter((list) => list.id !== button.dataset.delete)); teacher(); } }));
  }

  home();
})();
