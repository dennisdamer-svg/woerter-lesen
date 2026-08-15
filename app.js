(() => {
  const SETTINGS_KEY = "woerterlesen-einstellungen-v1";
  const app = document.querySelector("#app");

  // Inhalte (Wortlisten) kommen aus wordlists.js (window.WORDLISTS), das vor
  // dieser Datei geladen wird. app.js enthält ausschließlich App-Logik/UI,
  // keine Wort-Inhalte - siehe CLAUDE.md für die Datenstruktur.
  const wordlists = window.WORDLISTS || [];
  const allLists = () => wordlists;
  const hasImages = (list) => list.words.every((w) => w.image && w.image.url);

  let state = { list: null, words: [], index: 0 };
  let quizState = { list: null, order: [], index: 0, correctId: null, locked: false };

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
  const render = (html) => { stopSpeech(); app.innerHTML = html; };

  const renderWord = (entry, showSyllables) => {
    if (!showSyllables || entry.syllables.length < 2) {
      return `<span class="syll syll-a">${escapeHtml(entry.word)}</span>`;
    }
    return entry.syllables.map((syllable, i) => `<span class="syll ${i % 2 === 0 ? "syll-a" : "syll-b"}">${escapeHtml(syllable)}</span>`).join("");
  };

  // Bildquellen (z. B. ARASAAC, CC BY-NC-SA) verlangen eine Quellenangabe -
  // wird angezeigt, sobald irgendwo ein Bild mit `attribution` sichtbar ist.
  const attributionLine = (image) => (image && image.attribution ? `<p class="attribution">Bildquelle: ${escapeHtml(image.attribution)}${image.license ? ` (${escapeHtml(image.license)})` : ""}</p>` : "");

  function home() {
    const settings = getSettings();
    const items = allLists().map((list) => `<button class="list-button" data-open="${escapeHtml(list.id)}">${escapeHtml(list.name)} <span>${list.words.length} Wörter&nbsp; →</span></button>`).join("");
    render(`<section class="screen">
      <h1>Wörter lesen</h1>
      <p class="intro">Lies ein Wort laut. Tippe dann auf <strong>Vorlesen</strong> und überprüfe dich.</p>
      <button class="toggle" id="toggle-syllables" aria-pressed="${settings.syllables ? "true" : "false"}">🔤 Silbenschrift: ${settings.syllables ? "An" : "Aus"}</button>
      <h2>Wortliste auswählen</h2>
      <div class="choices">${items}</div>
    </section>`);
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => chooseMode(button.dataset.open)));
    app.querySelector("#toggle-syllables").addEventListener("click", () => { setSettings({ ...settings, syllables: !settings.syllables }); home(); });
  }

  function chooseMode(id) {
    const list = allLists().find((item) => item.id === id);
    if (!list) return home();
    render(`<section class="screen">
      <div class="topbar"><button id="home">← Start</button><h1>${escapeHtml(list.name)}</h1></div>
      <p class="intro">Wie möchtest du üben?</p>
      <div class="choices">
        <button class="list-button" id="mode-read">🔤 Wort lesen<span>selbst lesen, dann vorlesen lassen</span></button>
        ${hasImages(list) ? `<button class="list-button" id="mode-quiz">🖼️ Bild-Übung<span>passendes Bild zum Wort finden</span></button>` : ""}
      </div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#mode-read").addEventListener("click", () => start(id));
    const quizButton = app.querySelector("#mode-quiz");
    if (quizButton) quizButton.addEventListener("click", () => quizStart(id));
  }

  function start(id) { const list = allLists().find((item) => item.id === id); if (!list) return home(); state = { list, words: shuffle(list.words), index: 0 }; practice(); }

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
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => speak(entry.word));
    app.querySelector("#back").addEventListener("click", () => { if (state.index) { state.index--; practice(); } });
    app.querySelector("#next").addEventListener("click", () => { state.index++; practice(); });
  }

  function complete() { render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Wörter gelesen.</p><button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`); app.querySelector("#again").addEventListener("click", () => start(state.list.id)); app.querySelector("#home").addEventListener("click", home); }

  // --- Bild-Übung: Wort wird gezeigt, Schüler:in wählt das passende Bild aus 4 Alternativen ---

  function quizStart(id) {
    const list = allLists().find((item) => item.id === id);
    if (!list) return home();
    quizState = { list, order: shuffle(list.words), index: 0, correctId: null, locked: false };
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
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => speak(target.word));
    app.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => {
        if (quizState.locked) return;
        if (button.dataset.id === quizState.correctId) {
          quizState.locked = true;
          button.classList.add("correct");
          setTimeout(() => { quizState.index++; quizRound(); }, 800);
        } else {
          button.classList.add("wrong");
          setTimeout(() => button.classList.remove("wrong"), 500);
        }
      });
    });
  }

  function quizComplete() {
    render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Bilder richtig zugeordnet.</p><button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`);
    app.querySelector("#again").addEventListener("click", () => quizStart(quizState.list.id));
    app.querySelector("#home").addEventListener("click", home);
  }

  home();
})();
