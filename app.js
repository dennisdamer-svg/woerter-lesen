(() => {
  const SETTINGS_KEY = "woerterlesen-einstellungen-v1";
  const app = document.querySelector("#app");

  // Inhalte (Wortlisten) kommen aus wordlists.js (window.WORDLISTS), das vor
  // dieser Datei geladen wird. app.js enthält ausschließlich App-Logik/UI,
  // keine Wort-Inhalte - siehe CLAUDE.md für die Datenstruktur.
  const wordlists = window.WORDLISTS || [];
  const allLists = () => wordlists;

  let state = { list: null, words: [], index: 0, imageRevealed: false };

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
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => start(button.dataset.open)));
    app.querySelector("#toggle-syllables").addEventListener("click", () => { setSettings({ ...settings, syllables: !settings.syllables }); home(); });
  }

  function start(id) { const list = allLists().find((item) => item.id === id); if (!list) return home(); state = { list, words: shuffle(list.words), index: 0, imageRevealed: false }; practice(); }

  function practice() {
    if (state.index >= state.words.length) return complete();
    const settings = getSettings();
    const entry = state.words[state.index];
    // Bild wird erst nach dem Antippen von "Vorlesen" gezeigt, nicht vorher -
    // die Schüler:innen sollen zuerst nur den Text lesen. Aktuell hat noch
    // kein Wort ein Bild hinterlegt (image: null in wordlists.js).
    const showImage = Boolean(entry.image && entry.image.url && state.imageRevealed);
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">⌂ Start</button><div class="progress">${state.index + 1} von ${state.words.length}</div></div>
      <div class="word-card">
        <div class="word">${renderWord(entry, settings.syllables)}</div>
        ${showImage ? `<img class="word-image" src="${escapeHtml(entry.image.url)}" alt="" />` : ""}
      </div>
      <button id="speak" class="primary speak" aria-label="Das Wort ${escapeHtml(entry.word)} vorlesen">🔊 Vorlesen</button>
      <p class="hint">Erst selbst lesen, dann zum Überprüfen tippen.</p>
      <div class="nav"><button id="back" ${state.index === 0 ? "disabled" : ""}>← Zurück</button><button id="next" class="secondary">${state.index === state.words.length - 1 ? "Fertig" : "Weiter →"}</button></div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => {
      state.imageRevealed = true;
      practice();
      speak(entry.word);
    });
    app.querySelector("#back").addEventListener("click", () => { if (state.index) { state.index--; state.imageRevealed = false; practice(); } });
    app.querySelector("#next").addEventListener("click", () => { state.index++; state.imageRevealed = false; practice(); });
  }

  function complete() { render(`<section class="screen"><div class="finish"><h1>Geschafft! 🎉</h1><p class="intro">Du hast alle Wörter gelesen.</p><button class="primary" id="again">Noch einmal</button><button id="home">Andere Wortliste</button></div></section>`); app.querySelector("#again").addEventListener("click", () => start(state.list.id)); app.querySelector("#home").addEventListener("click", home); }

  home();
})();
