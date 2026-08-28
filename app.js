(() => {
  const SETTINGS_KEY = "woerterlesen-einstellungen-v1";
  const app = document.querySelector("#app");

  // Inhalte (Wortlisten) kommen aus wordlists.js (window.WORDLISTS), das vor
  // dieser Datei geladen wird. app.js enthält ausschließlich App-Logik/UI,
  // keine Wort-Inhalte - siehe CLAUDE.md für die Datenstruktur.
  const wordlists = window.WORDLISTS || [];
  // wordlists.js mischt direkte Wortlisten mit Gruppen (type: "group", z. B.
  // "Gastronomie"), die mehrere Listen bündeln. findList() sucht unabhängig
  // davon, ob eine Liste direkt auf oberster Ebene steht oder in einer
  // Gruppe steckt - Üben/Quiz läuft immer auf einer einzelnen Liste.
  const flatLists = () => wordlists.flatMap((entry) => (entry.type === "group" ? entry.children : [entry]));
  const findList = (id) => flatLists().find((item) => item.id === id);
  const hasImages = (list) => list.words.every((w) => w.image && w.image.url);
  const iconImg = (icon) => (icon && icon.url ? `<img class="list-icon" src="${escapeHtml(icon.url)}" alt="" />` : "");

  let state = { list: null, words: [], index: 0 };
  let quizState = { list: null, order: [], index: 0, correctId: null, locked: false, firstTryCorrect: 0 };
  let blitzState = { list: null, order: [], index: 0, duration: 800, correctId: null, locked: false, firstTryCorrect: 0 };
  let writeState = { list: null, order: [], index: 0, firstTryCorrect: 0 };

  // Erhöht sich bei jedem render() - verhindert, dass ein noch laufender
  // setTimeout (z. B. Blitzlesen-Anzeigedauer) nach einem Screen-Wechsel
  // (z. B. Zurück zum Start) verspätet noch etwas rendert.
  let renderGeneration = 0;

  const escapeHtml = (text) => String(text).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));

  // localStorage wird nur noch für die Silbenschrift-Einstellung genutzt
  // (pro Gerät) - Wortlisten selbst liegen ausschließlich in wordlists.js.
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
  const render = (html) => { stopSpeech(); renderGeneration++; app.innerHTML = html; };

  // Verkleinert die Schrift eines Wort-Elements so lange, bis es in einer
  // Zeile passt (kein Umbruch mitten im Wort) - setzt voraus, dass das
  // Element per CSS white-space:nowrap + width:100% hat (siehe .word/.quiz-word).
  const fitTextToWidth = (el, minFontSize = 26) => {
    if (!el) return;
    let fontSize = parseFloat(getComputedStyle(el).fontSize);
    let guard = 0;
    while (el.scrollWidth > el.clientWidth && fontSize > minFontSize && guard < 60) {
      fontSize -= 2;
      el.style.fontSize = `${fontSize}px`;
      guard++;
    }
  };
  // Poppins lädt asynchron (font-display: swap); direkt nach dem Rendern ist
  // oft noch die etwas schmalere Systemschrift sichtbar, wodurch die Anpassung
  // zu wenig verkleinert. Nach dem Laden der Schrift wird deshalb nochmal
  // nachjustiert - el kann zu dem Zeitpunkt bereits durch einen Screen-Wechsel
  // ersetzt sein, dann ist der Aufruf einfach wirkungslos.
  const scheduleFit = (el, minFontSize) => {
    fitTextToWidth(el, minFontSize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => fitTextToWidth(el, minFontSize));
    }
  };

  const renderWord = (entry, showSyllables) => {
    if (!showSyllables || entry.syllables.length < 2) {
      return `<span class="syll syll-a">${escapeHtml(entry.word)}</span>`;
    }
    return entry.syllables.map((syllable, i) => `<span class="syll ${i % 2 === 0 ? "syll-a" : "syll-b"}">${escapeHtml(syllable)}</span>`).join("");
  };

  // Bildquellen (z. B. ARASAAC, CC BY-NC-SA) verlangen eine Quellenangabe -
  // wird angezeigt, sobald irgendwo ein Bild mit `attribution` sichtbar ist.
  const attributionLine = (image) => (image && image.attribution ? `<p class="attribution">Bildquelle: ${escapeHtml(image.attribution)}${image.license ? ` (${escapeHtml(image.license)})` : ""}</p>` : "");

  // Auswertungszeile für die Abschluss-Screens von Bild-Übung, Blitzlesen und
  // Wort schreiben - zählt nur Runden, die schon beim ersten Versuch richtig
  // waren (siehe CLAUDE.md, Abschnitt Auswertung).
  const scoreLine = (correct, total) => `<p class="score">${correct} von ${total} beim ersten Versuch richtig</p>`;

  const listButton = (entry, count) => `<button class="list-button" data-open="${escapeHtml(entry.id)}"><span class="list-button-left">${iconImg(entry.icon)}<span class="list-button-name">${escapeHtml(entry.name)}</span></span><span class="list-button-count">${count} Wörter&nbsp; →</span></button>`;

  function home() {
    const settings = getSettings();
    const items = wordlists.map((entry) => {
      const count = entry.type === "group" ? entry.children.reduce((sum, c) => sum + c.words.length, 0) : entry.words.length;
      return listButton(entry, count);
    }).join("");
    render(`<section class="screen">
      <h1>Wörter lesen</h1>
      <p class="intro">Lies ein Wort laut. Tippe dann auf <strong>Vorlesen</strong> und überprüfe dich.</p>
      <button class="toggle" id="toggle-syllables" aria-pressed="${settings.syllables ? "true" : "false"}">🔤 Silbenschrift: ${settings.syllables ? "An" : "Aus"}</button>
      <h2>Wortliste auswählen</h2>
      <div class="choices">${items}</div>
    </section>`);
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
      const entry = wordlists.find((item) => item.id === button.dataset.open);
      if (entry && entry.type === "group") chooseGroup(entry.id);
      else chooseMode(button.dataset.open);
    }));
    app.querySelector("#toggle-syllables").addEventListener("click", () => { setSettings({ ...settings, syllables: !settings.syllables }); home(); });
  }

  function chooseGroup(id) {
    const group = wordlists.find((entry) => entry.id === id && entry.type === "group");
    if (!group) return home();
    const items = group.children.map((list) => listButton(list, list.words.length)).join("");
    render(`<section class="screen">
      <div class="topbar"><button id="home">← Start</button><h1>${escapeHtml(group.name)}</h1></div>
      <h2>Thema auswählen</h2>
      <div class="choices">${items}</div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => chooseMode(button.dataset.open)));
  }

  function chooseMode(id) {
    const list = findList(id);
    if (!list) return home();
    render(`<section class="screen">
      <div class="topbar"><button id="home">← Start</button><h1>${escapeHtml(list.name)}</h1></div>
      <p class="intro">Wie möchtest du üben?</p>
      <div class="choices">
        <button class="list-button" id="mode-read">🔤 Wort lesen<span class="list-button-count">selbst lesen, dann vorlesen lassen</span></button>
        ${hasImages(list) ? `<button class="list-button" id="mode-quiz">🖼️ Bild-Übung<span class="list-button-count">passendes Bild zum Wort finden</span></button>` : ""}
        ${hasImages(list) ? `<button class="list-button" id="mode-blitz">⚡ Blitzlesen<span class="list-button-count">Wort kurz sehen, dann Bild wählen</span></button>` : ""}
        ${list.spelling && hasImages(list) ? `<button class="list-button" id="mode-write">✍️ Wort schreiben<span class="list-button-count">Bild sehen, Wort selbst schreiben</span></button>` : ""}
      </div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#mode-read").addEventListener("click", () => start(id));
    const quizButton = app.querySelector("#mode-quiz");
    if (quizButton) quizButton.addEventListener("click", () => quizStart(id));
    const blitzButton = app.querySelector("#mode-blitz");
    if (blitzButton) blitzButton.addEventListener("click", () => blitzChooseDuration(id));
    const writeButton = app.querySelector("#mode-write");
    if (writeButton) writeButton.addEventListener("click", () => writeStart(id));
  }

  function start(id) { const list = findList(id); if (!list) return home(); state = { list, words: shuffle(list.words), index: 0 }; practice(); }

  function practice() {
    if (state.index >= state.words.length) return complete();
    const settings = getSettings();
    const entry = state.words[state.index];
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${state.index + 1} von ${state.words.length}</div></div>
      <div class="word-card">
        <div class="word">${renderWord(entry, settings.syllables)}</div>
      </div>
      <button id="speak" class="primary speak" aria-label="Das Wort ${escapeHtml(entry.word)} vorlesen">🔊 Vorlesen</button>
      <p class="hint">Erst selbst lesen, dann zum Überprüfen tippen.</p>
      <div class="nav"><button id="back" ${state.index === 0 ? "disabled" : ""}>← Zurück</button><button id="next" class="secondary">${state.index === state.words.length - 1 ? "Fertig" : "Weiter →"}</button></div>
    </section>`);
    scheduleFit(app.querySelector(".word"));
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => speak(entry.word));
    app.querySelector("#back").addEventListener("click", () => { if (state.index) { state.index--; practice(); } });
    app.querySelector("#next").addEventListener("click", () => { state.index++; practice(); });
  }

  function complete() { render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Wörter gelesen.</p><button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`); app.querySelector("#again").addEventListener("click", () => start(state.list.id)); app.querySelector("#home").addEventListener("click", home); }

  // --- Bild-Übung: Wort wird gezeigt, Schüler:in wählt das passende Bild aus 4 Alternativen ---

  function quizStart(id) {
    const list = findList(id);
    if (!list) return home();
    quizState = { list, order: shuffle(list.words), index: 0, correctId: null, locked: false, firstTryCorrect: 0 };
    quizRound();
  }

  function quizRound() {
    if (quizState.index >= quizState.order.length) return quizComplete();
    const settings = getSettings();
    const target = quizState.order[quizState.index];
    const distractors = shuffle(quizState.list.words.filter((w) => w.id !== target.id)).slice(0, 3);
    const options = shuffle([target, ...distractors]);
    quizState.correctId = target.id;
    quizState.locked = false;
    // Zählt nur, wenn der erste Tipp in dieser Runde bereits richtig war -
    // für die Auswertung am Ende (quizComplete).
    let attempted = false;
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${quizState.index + 1} von ${quizState.order.length}</div></div>
      <div class="quiz-word">${renderWord(target, settings.syllables)}</div>
      <div class="quiz-grid">
        ${options.map((opt, i) => `<button class="quiz-option" data-id="${escapeHtml(opt.id)}" aria-label="Bildoption ${i + 1}"><img src="${escapeHtml(opt.image.url)}" alt="" /></button>`).join("")}
      </div>
      <div class="quiz-footer">
        ${attributionLine(target.image)}
        <button id="speak" class="speak-mini" aria-label="Das Wort ${escapeHtml(target.word)} vorlesen">🔊</button>
      </div>
    </section>`);
    scheduleFit(app.querySelector(".quiz-word"));
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => speak(target.word));
    app.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => {
        if (quizState.locked) return;
        if (button.dataset.id === quizState.correctId) {
          quizState.locked = true;
          if (!attempted) quizState.firstTryCorrect++;
          button.classList.add("correct");
          const gen = renderGeneration;
          setTimeout(() => { if (renderGeneration === gen) { quizState.index++; quizRound(); } }, 800);
        } else {
          attempted = true;
          button.classList.add("wrong");
          setTimeout(() => button.classList.remove("wrong"), 500);
        }
      });
    });
  }

  function quizComplete() {
    render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Bilder richtig zugeordnet.</p>${scoreLine(quizState.firstTryCorrect, quizState.order.length)}<button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`);
    app.querySelector("#again").addEventListener("click", () => quizStart(quizState.list.id));
    app.querySelector("#home").addEventListener("click", home);
  }

  // --- Blitzlesen: Wort erscheint kurz, verschwindet, dann Kontrolle per Bild ---

  // Tempo wird bewusst nicht in Millisekunden angezeigt (sagt Schüler:innen
  // nichts), sondern als aufsteigende "wird schneller"-Bildergeschichte.
  // `hint` ist nur für aria-label (Barrierefreiheit), nirgends sichtbar.
  const BLITZ_SPEEDS = [
    { ms: 3000, icon: "🐌", label: "Schnecke", hint: "sehr langsam" },
    { ms: 1500, icon: "🚶", label: "Fußgänger", hint: "langsam" },
    { ms: 800, icon: "🚲", label: "Fahrrad", hint: "mittel" },
    { ms: 500, icon: "🚗", label: "Auto", hint: "zügig" },
    { ms: 300, icon: "🐇", label: "Hase", hint: "schnell" },
    { ms: 150, icon: "🚀", label: "Rakete", hint: "sehr schnell" },
  ];

  function blitzChooseDuration(id) {
    const list = findList(id);
    if (!list) return home();
    const items = BLITZ_SPEEDS.map((s) => `<button class="speed-option" data-duration="${s.ms}" aria-label="${escapeHtml(s.label)} - ${escapeHtml(s.hint)}"><span class="speed-icon">${s.icon}</span><span class="speed-label">${escapeHtml(s.label)}</span></button>`).join("");
    render(`<section class="screen">
      <div class="topbar"><button id="home">← Start</button><h1>${escapeHtml(list.name)}</h1></div>
      <p class="intro">Wie schnell soll das Wort verschwinden?</p>
      <div class="speed-grid">${items}</div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelectorAll("[data-duration]").forEach((button) => button.addEventListener("click", () => blitzStart(id, Number(button.dataset.duration))));
  }

  function blitzStart(id, duration) {
    const list = findList(id);
    if (!list) return home();
    blitzState = { list, order: shuffle(list.words), index: 0, duration, correctId: null, locked: false, firstTryCorrect: 0 };
    blitzReady();
  }

  function blitzReady() {
    if (blitzState.index >= blitzState.order.length) return blitzComplete();
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${blitzState.index + 1} von ${blitzState.order.length}</div></div>
      <div class="word-card"><button id="ready" class="primary speak" aria-label="Bereit - Wort anzeigen">⚡ Bereit</button></div>
      <p class="hint">Leertaste drücken oder Bereit antippen, dann genau hinschauen.</p>
    </section>`);
    const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); go(); } };
    const go = () => { document.removeEventListener("keydown", onKey); blitzShowWord(); };
    document.addEventListener("keydown", onKey);
    app.querySelector("#ready").addEventListener("click", go);
    app.querySelector("#home").addEventListener("click", () => { document.removeEventListener("keydown", onKey); home(); });
  }

  function blitzShowWord() {
    const settings = getSettings();
    const entry = blitzState.order[blitzState.index];
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${blitzState.index + 1} von ${blitzState.order.length}</div></div>
      <div class="word-card"><div class="word">${renderWord(entry, settings.syllables)}</div></div>
    </section>`);
    scheduleFit(app.querySelector(".word"));
    app.querySelector("#home").addEventListener("click", home);
    const gen = renderGeneration;
    setTimeout(() => { if (renderGeneration === gen) blitzMask(); }, blitzState.duration);
  }

  // Kurzer leerer/neutraler Bildschirm zwischen Wort und Bild-Kontrolle, damit
  // kein Nachbild des Worts die Bildauswahl beeinflusst.
  function blitzMask() {
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${blitzState.index + 1} von ${blitzState.order.length}</div></div>
      <div class="word-card"></div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    const gen = renderGeneration;
    setTimeout(() => { if (renderGeneration === gen) blitzQuiz(); }, 300);
  }

  function blitzQuiz() {
    const entry = blitzState.order[blitzState.index];
    const distractors = shuffle(blitzState.list.words.filter((w) => w.id !== entry.id)).slice(0, 3);
    const options = shuffle([entry, ...distractors]);
    blitzState.correctId = entry.id;
    blitzState.locked = false;
    let attempted = false;
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${blitzState.index + 1} von ${blitzState.order.length}</div></div>
      <p class="intro">Welches Bild passt zum Wort?</p>
      <div class="quiz-grid">
        ${options.map((opt, i) => `<button class="quiz-option" data-id="${escapeHtml(opt.id)}" aria-label="Bildoption ${i + 1}"><img src="${escapeHtml(opt.image.url)}" alt="" /></button>`).join("")}
      </div>
      ${attributionLine(entry.image)}
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => {
        if (blitzState.locked) return;
        if (button.dataset.id === blitzState.correctId) {
          blitzState.locked = true;
          if (!attempted) blitzState.firstTryCorrect++;
          button.classList.add("correct");
          const gen = renderGeneration;
          setTimeout(() => { if (renderGeneration === gen) { blitzState.index++; blitzReady(); } }, 800);
        } else {
          attempted = true;
          button.classList.add("wrong");
          setTimeout(() => button.classList.remove("wrong"), 500);
        }
      });
    });
  }

  function blitzComplete() {
    render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Wörter erkannt.</p>${scoreLine(blitzState.firstTryCorrect, blitzState.order.length)}<button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`);
    app.querySelector("#again").addEventListener("click", () => blitzStart(blitzState.list.id, blitzState.duration));
    app.querySelector("#home").addEventListener("click", home);
  }

  // --- Wort schreiben: Bild + Vorlesen, Schüler:in tippt das Wort selbst
  // (inkl. Groß-/Kleinschreibung) - siehe CLAUDE.md, Abschnitt "Wort schreiben".

  // Wie schnell der Tipp-Button das Wort Buchstabe für Buchstabe aufdeckt.
  const HINT_STEP_MS = 450;

  function writeStart(id) {
    const list = findList(id);
    if (!list) return home();
    writeState = { list, order: shuffle(list.words), index: 0, firstTryCorrect: 0 };
    writeRound();
  }

  function writeRound() {
    if (writeState.index >= writeState.order.length) return writeComplete();
    const entry = writeState.order[writeState.index];
    let hintTimer = null;
    // Räumt einen laufenden Tipp-Timer auf - wird beim Verlassen des Screens
    // (Start-Button, Weiter) und beim Loslassen des Tipp-Buttons aufgerufen.
    const stopHint = () => { if (hintTimer) { clearInterval(hintTimer); hintTimer = null; } const el = app.querySelector("#hint-display"); if (el) el.textContent = ""; };
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${writeState.index + 1} von ${writeState.order.length}</div></div>
      <div class="word-card"><img class="write-image" src="${escapeHtml(entry.image.url)}" alt="" /></div>
      <div class="hint-display" id="hint-display" aria-live="polite"></div>
      <form id="write-form">
        <input id="write-input" class="write-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Wort eintippen" />
        <div class="write-row">
          <button type="button" id="hint" class="secondary">💡 Tipp</button>
          <button type="button" id="speak" class="secondary" aria-label="Das Wort vorlesen">🔊 Vorlesen</button>
        </div>
        <button type="submit" class="primary write-submit">Weiter →</button>
      </form>
      ${attributionLine(entry.image)}
    </section>`);
    app.querySelector("#home").addEventListener("click", () => { stopHint(); home(); });
    app.querySelector("#speak").addEventListener("click", () => speak(entry.word));
    const input = app.querySelector("#write-input");
    input.focus();
    const hintButton = app.querySelector("#hint");
    const hintEl = app.querySelector("#hint-display");
    let hintCount = 0;
    const revealNext = () => {
      hintCount = Math.min(hintCount + 1, entry.word.length);
      hintEl.textContent = entry.word.slice(0, hintCount);
      if (hintCount >= entry.word.length) stopHint();
    };
    const startHint = (e) => { e.preventDefault(); if (hintTimer) return; hintCount = 0; revealNext(); hintTimer = setInterval(revealNext, HINT_STEP_MS); };
    hintButton.addEventListener("pointerdown", startHint);
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => hintButton.addEventListener(evt, stopHint));
    app.querySelector("#write-form").addEventListener("submit", (e) => {
      e.preventDefault();
      stopHint();
      const isCorrect = input.value === entry.word;
      if (isCorrect) writeState.firstTryCorrect++;
      writeFeedback(entry, input.value, isCorrect);
    });
  }

  function writeFeedback(entry, userInput, isCorrect) {
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${writeState.index + 1} von ${writeState.order.length}</div></div>
      <div class="word-card">
        <p class="feedback-verdict ${isCorrect ? "correct" : "wrong"}">${isCorrect ? "✅ Richtig!" : "❌ Nicht ganz richtig"}</p>
        ${isCorrect ? `<div class="word">${escapeHtml(entry.word)}</div>` : `
          <div class="compare-grid">
            <div class="compare-box wrong"><p class="compare-label">Deine Antwort</p><p class="compare-word">${escapeHtml(userInput) || "–"}</p></div>
            <div class="compare-box correct"><p class="compare-label">Richtig wäre</p><p class="compare-word">${escapeHtml(entry.word)}</p></div>
          </div>`}
      </div>
      <button id="next" class="primary">Weiter →</button>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#next").addEventListener("click", () => { writeState.index++; writeRound(); });
  }

  function writeComplete() {
    render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Wörter geschrieben.</p>${scoreLine(writeState.firstTryCorrect, writeState.order.length)}<button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`);
    app.querySelector("#again").addEventListener("click", () => writeStart(writeState.list.id));
    app.querySelector("#home").addEventListener("click", home);
  }

  home();
})();
