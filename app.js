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
  const findList = (id) => flatLists().find((item) => item.id === id) || customLists.find((item) => item.id === id);
  const hasImages = (list) => list.words.every((w) => w.image && w.image.url);
  const iconImg = (icon) => (icon && icon.url ? `<img class="list-icon" src="${escapeHtml(icon.url)}" alt="" />` : "");

  let state = { list: null, words: [], index: 0 };
  let quizState = { list: null, order: [], index: 0, correctId: null, locked: false, firstTryCorrect: 0 };
  let blitzState = { list: null, order: [], index: 0, duration: 800, correctId: null, locked: false, firstTryCorrect: 0 };
  let writeState = { list: null, order: [], index: 0, firstTryCorrect: 0 };

  // "Listen kombinieren": erzeugt aus mehreren ausgewählten Listen eine
  // temporäre Sammel-Liste (nur im Speicher, nicht in wordlists.js), damit
  // dieselben Übungsmodi (Lesen/Bild-Übung/Blitzlesen/Schreiben) darauf wie
  // gewohnt über findList() funktionieren. customLists lebt nur zur Laufzeit,
  // wird bei jeder neuen Kombination ersetzt statt endlos zu wachsen.
  let customLists = [];
  let multiSelectState = { selected: new Set(), expanded: new Set() };

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

  // --- Automatische Silbentrennung für "normalen" UI-Text --------------
  // Für die eigentlichen Übungswörter (renderWord) wird die von Hand
  // geprüfte Trennung aus wordlists.js verwendet. Für Überschriften,
  // Buttons, Hinweise und Listennamen gibt es keine kuratierten Daten -
  // hier kommt derselbe Heuristik-Algorithmus wie in tools/hyphenate.js
  // zum Einsatz (bewusst dupliziert statt importiert, da tools/hyphenate.js
  // ein Node-Skript ist und app.js ohne Build-Schritt direkt im Browser
  // läuft). Bei Komposita kann das danebenliegen - für reine Navigations-/
  // Beschriftungstexte ist das akzeptabel (siehe CLAUDE.md).
  const isVowel = (ch) => "aeiouyäöüAEIOUYÄÖÜ".includes(ch);
  const VOWEL_DIGRAPHS = ["ie", "ei", "ey", "au", "ai", "ay", "eu", "äu", "aa", "ee", "oo", "uu"];
  const INSEPARABLE_TAILS = ["ch", "ck", "ph", "th"];
  const findNuclei = (word) => {
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
  };
  const autoHyphenate = (word) => {
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
  };

  const WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g;
  // Wendet Silbenschrift auf freien UI-Text an (Überschriften, Buttons,
  // Hinweise, Listennamen) - erkennt Wörter per Regex und färbt sie ein,
  // alles andere (Leerzeichen, Satzzeichen, Emoji, Zahlen, Pfeile) bleibt
  // unverändert. Bei "Silbenschrift: Aus" wird nur escaped, nicht eingefärbt.
  // Darf keine eigenen HTML-Tags enthalten (z. B. <strong>) - die müssten
  // außerhalb dieses Aufrufs stehen, siehe home().
  const renderText = (text, showSyllables) => {
    const str = String(text);
    if (!showSyllables) return escapeHtml(str);
    let result = "";
    let last = 0;
    WORD_RE.lastIndex = 0;
    let m;
    while ((m = WORD_RE.exec(str))) {
      result += escapeHtml(str.slice(last, m.index));
      const parts = autoHyphenate(m[0]);
      result += parts.length < 2
        ? escapeHtml(m[0])
        : parts.map((p, i) => `<span class="syll ${i % 2 === 0 ? "syll-a" : "syll-b"}">${escapeHtml(p)}</span>`).join("");
      last = m.index + m[0].length;
    }
    result += escapeHtml(str.slice(last));
    return result;
  };

  // Bildquellen (z. B. ARASAAC, CC BY-NC-SA) verlangen eine Quellenangabe -
  // wird angezeigt, sobald irgendwo ein Bild mit `attribution` sichtbar ist.
  const attributionLine = (image, showSyllables) => (image && image.attribution ? `<p class="attribution">${renderText(`Bildquelle: ${image.attribution}${image.license ? ` (${image.license})` : ""}`, showSyllables)}</p>` : "");

  // Auswertungszeile für die Abschluss-Screens von Bild-Übung, Blitzlesen und
  // Wort schreiben - zählt nur Runden, die schon beim ersten Versuch richtig
  // waren (siehe CLAUDE.md, Abschnitt Auswertung).
  const scoreLine = (correct, total, showSyllables) => `<p class="score">${renderText(`${correct} von ${total} beim ersten Versuch richtig`, showSyllables)}</p>`;

  const listButton = (entry, count, showSyllables) => `<button class="list-button" data-open="${escapeHtml(entry.id)}"><span class="list-button-left">${iconImg(entry.icon)}<span class="list-button-name">${renderText(entry.name, showSyllables)}</span></span><span class="list-button-count">${renderText(`${count} Wörter`, showSyllables)}&nbsp; →</span></button>`;

  function home() {
    const settings = getSettings();
    const items = wordlists.map((entry) => {
      const count = entry.type === "group" ? entry.children.reduce((sum, c) => sum + c.words.length, 0) : entry.words.length;
      return listButton(entry, count, settings.syllables);
    }).join("");
    render(`<section class="screen">
      <h1>${renderText("Wörter lesen und schreiben", settings.syllables)}</h1>
      <p class="intro">${renderText("Lies ein Wort laut. Tippe dann auf", settings.syllables)} <strong>${renderText("Vorlesen", settings.syllables)}</strong> ${renderText("und überprüfe dich.", settings.syllables)}</p>
      <button class="toggle" id="toggle-syllables" aria-pressed="${settings.syllables ? "true" : "false"}">${renderText(`🔤 Silbenschrift: ${settings.syllables ? "An" : "Aus"}`, settings.syllables)}</button>
      <h2>${renderText("Wortliste auswählen", settings.syllables)}</h2>
      <div class="choices">${items}</div>
      <button class="secondary" id="multi-select">${renderText("🔀 Mehrere Listen kombinieren", settings.syllables)}</button>
    </section>`);
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
      const entry = wordlists.find((item) => item.id === button.dataset.open);
      if (entry && entry.type === "group") chooseGroup(entry.id);
      else chooseMode(button.dataset.open);
    }));
    app.querySelector("#toggle-syllables").addEventListener("click", () => { setSettings({ ...settings, syllables: !settings.syllables }); home(); });
    app.querySelector("#multi-select").addEventListener("click", () => { multiSelectState = { selected: new Set(), expanded: new Set() }; multiSelect(); });
  }

  // --- Listen kombinieren: mehrere Listen per Checkbox auswählen -------
  // Gruppen (Gastronomie, Landwirtschaft) bekommen eine eigene Checkbox
  // (wählt alle Unterlisten auf einmal) plus einen Ausklapp-Pfeil, um bei
  // Bedarf nur einzelne Unterlisten anzuhaken - Kompromiss zwischen
  // Übersichtlichkeit und Feinauswahl.

  function groupChildIds(group) { return group.children.map((c) => c.id); }
  function groupCheckState(group) {
    const ids = groupChildIds(group);
    const selectedCount = ids.filter((id) => multiSelectState.selected.has(id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === ids.length) return "all";
    return "some";
  }

  function multiSelect() {
    const settings = getSettings();
    const rows = wordlists.map((entry) => {
      if (entry.type === "group") {
        const state = groupCheckState(entry);
        const expanded = multiSelectState.expanded.has(entry.id);
        const total = entry.children.reduce((sum, c) => sum + c.words.length, 0);
        const childRows = entry.children.map((child) => `
          <label class="select-row select-row-child">
            <input type="checkbox" data-select="${escapeHtml(child.id)}" ${multiSelectState.selected.has(child.id) ? "checked" : ""} />
            ${iconImg(child.icon)}<span class="select-row-name">${renderText(child.name, settings.syllables)}</span>
            <span class="select-row-count">${renderText(`${child.words.length} Wörter`, settings.syllables)}</span>
          </label>`).join("");
        return `<div class="select-group">
          <label class="select-row">
            <input type="checkbox" data-select-group="${escapeHtml(entry.id)}" ${state === "all" ? "checked" : ""} data-indeterminate="${state === "some" ? "true" : "false"}" />
            ${iconImg(entry.icon)}<span class="select-row-name">${renderText(entry.name, settings.syllables)}</span>
            <span class="select-row-count">${renderText(`${total} Wörter`, settings.syllables)}</span>
            <button type="button" class="expand-toggle" data-expand="${escapeHtml(entry.id)}" aria-label="${expanded ? "Einklappen" : "Ausklappen"}">${expanded ? "▾" : "▸"}</button>
          </label>
          ${expanded ? `<div class="select-children">${childRows}</div>` : ""}
        </div>`;
      }
      return `<label class="select-row">
        <input type="checkbox" data-select="${escapeHtml(entry.id)}" ${multiSelectState.selected.has(entry.id) ? "checked" : ""} />
        ${iconImg(entry.icon)}<span class="select-row-name">${renderText(entry.name, settings.syllables)}</span>
        <span class="select-row-count">${renderText(`${entry.words.length} Wörter`, settings.syllables)}</span>
      </label>`;
    }).join("");
    const totalSelected = [...multiSelectState.selected].reduce((sum, id) => { const list = findList(id) || flatLists().find((l) => l.id === id); return sum + (list ? list.words.length : 0); }, 0);
    render(`<section class="screen">
      <div class="topbar"><button id="home">${renderText("← Start", settings.syllables)}</button><h1>${renderText("Listen kombinieren", settings.syllables)}</h1></div>
      <p class="intro">${renderText("Wähle mehrere Listen aus, die zusammen geübt werden sollen.", settings.syllables)}</p>
      <div class="choices select-list">${rows}</div>
      <p class="hint">${renderText(`${multiSelectState.selected.size} Listen ausgewählt (${totalSelected} Wörter)`, settings.syllables)}</p>
      <button class="primary" id="confirm-select" ${multiSelectState.selected.size === 0 ? "disabled" : ""}>${renderText("Weiter →", settings.syllables)}</button>
    </section>`);
    app.querySelectorAll("[data-indeterminate='true']").forEach((el) => { el.indeterminate = true; });
    app.querySelector("#home").addEventListener("click", home);
    app.querySelectorAll("[data-select]").forEach((el) => el.addEventListener("change", () => {
      if (el.checked) multiSelectState.selected.add(el.dataset.select);
      else multiSelectState.selected.delete(el.dataset.select);
      multiSelect();
    }));
    app.querySelectorAll("[data-select-group]").forEach((el) => el.addEventListener("change", () => {
      const group = wordlists.find((entry) => entry.id === el.dataset.selectGroup);
      const ids = groupChildIds(group);
      if (el.checked) ids.forEach((id) => multiSelectState.selected.add(id));
      else ids.forEach((id) => multiSelectState.selected.delete(id));
      multiSelect();
    }));
    app.querySelectorAll("[data-expand]").forEach((el) => el.addEventListener("click", () => {
      const id = el.dataset.expand;
      if (multiSelectState.expanded.has(id)) multiSelectState.expanded.delete(id);
      else multiSelectState.expanded.add(id);
      multiSelect();
    }));
    const confirmButton = app.querySelector("#confirm-select");
    if (confirmButton) confirmButton.addEventListener("click", confirmMultiSelect);
  }

  function confirmMultiSelect() {
    const chosen = flatLists().filter((list) => multiSelectState.selected.has(list.id));
    if (!chosen.length) return multiSelect();
    const words = chosen.flatMap((list) => list.words);
    const id = `custom-${Date.now()}`;
    const merged = {
      id,
      name: chosen.length === 1 ? chosen[0].name : `Eigene Auswahl (${chosen.length} Listen)`,
      lang: "de",
      spelling: chosen.every((list) => list.spelling === true),
      words,
    };
    customLists = [merged];
    chooseMode(id);
  }

  function chooseGroup(id) {
    const group = wordlists.find((entry) => entry.id === id && entry.type === "group");
    if (!group) return home();
    const settings = getSettings();
    const items = group.children.map((list) => listButton(list, list.words.length, settings.syllables)).join("");
    render(`<section class="screen">
      <div class="topbar"><button id="home">${renderText("← Start", settings.syllables)}</button><h1>${renderText(group.name, settings.syllables)}</h1></div>
      <h2>${renderText("Thema auswählen", settings.syllables)}</h2>
      <div class="choices">${items}</div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => chooseMode(button.dataset.open)));
  }

  function chooseMode(id) {
    const list = findList(id);
    if (!list) return home();
    const settings = getSettings();
    render(`<section class="screen">
      <div class="topbar"><button id="home">${renderText("← Start", settings.syllables)}</button><h1>${renderText(list.name, settings.syllables)}</h1></div>
      <p class="intro">${renderText("Wie möchtest du üben?", settings.syllables)}</p>
      <div class="choices">
        <button class="list-button" id="mode-read"><span class="list-button-name">${renderText("🔤 Wort lesen", settings.syllables)}</span><span class="list-button-count">${renderText("selbst lesen, dann vorlesen lassen", settings.syllables)}</span></button>
        ${hasImages(list) ? `<button class="list-button" id="mode-quiz"><span class="list-button-name">${renderText("🖼️ Bild-Übung", settings.syllables)}</span><span class="list-button-count">${renderText("passendes Bild zum Wort finden", settings.syllables)}</span></button>` : ""}
        ${hasImages(list) ? `<button class="list-button" id="mode-blitz"><span class="list-button-name">${renderText("⚡ Blitzlesen", settings.syllables)}</span><span class="list-button-count">${renderText("Wort kurz sehen, dann Bild wählen", settings.syllables)}</span></button>` : ""}
        ${list.spelling && hasImages(list) ? `<button class="list-button" id="mode-write"><span class="list-button-name">${renderText("✍️ Wort schreiben", settings.syllables)}</span><span class="list-button-count">${renderText("Bild sehen, Wort selbst schreiben", settings.syllables)}</span></button>` : ""}
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
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${state.index + 1} von ${state.words.length}`, settings.syllables)}</div></div>
      <div class="word-card">
        <div class="word">${renderWord(entry, settings.syllables)}</div>
      </div>
      <button id="speak" class="primary speak" aria-label="Das Wort ${escapeHtml(entry.word)} vorlesen">${renderText("🔊 Vorlesen", settings.syllables)}</button>
      <p class="hint">${renderText("Erst selbst lesen, dann zum Überprüfen tippen.", settings.syllables)}</p>
      <div class="nav"><button id="back" ${state.index === 0 ? "disabled" : ""}>${renderText("← Zurück", settings.syllables)}</button><button id="next" class="secondary">${renderText(state.index === state.words.length - 1 ? "Fertig" : "Weiter →", settings.syllables)}</button></div>
    </section>`);
    scheduleFit(app.querySelector(".word"));
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#speak").addEventListener("click", () => speak(entry.word));
    app.querySelector("#back").addEventListener("click", () => { if (state.index) { state.index--; practice(); } });
    app.querySelector("#next").addEventListener("click", () => { state.index++; practice(); });
  }

  function complete() {
    const settings = getSettings();
    render(`<section class="screen"><div class="finish"><h1>${renderText("Geschafft! 🎉", settings.syllables)}</h1><p class="intro">${renderText("Du hast alle Wörter gelesen.", settings.syllables)}</p><button class="primary" id="again">${renderText("Noch einmal", settings.syllables)}</button><button id="home">${renderText("Andere Wortliste", settings.syllables)}</button></div></section>`);
    app.querySelector("#again").addEventListener("click", () => start(state.list.id));
    app.querySelector("#home").addEventListener("click", home);
  }

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
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${quizState.index + 1} von ${quizState.order.length}`, settings.syllables)}</div></div>
      <div class="quiz-word">${renderWord(target, settings.syllables)}</div>
      <div class="quiz-grid">
        ${options.map((opt, i) => `<button class="quiz-option" data-id="${escapeHtml(opt.id)}" aria-label="Bildoption ${i + 1}"><img src="${escapeHtml(opt.image.url)}" alt="" /></button>`).join("")}
      </div>
      <div class="quiz-footer">
        ${attributionLine(target.image, settings.syllables)}
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
    const settings = getSettings();
    render(`<section class="screen"><div class="finish"><h1>${renderText("Geschafft! 🎉", settings.syllables)}</h1><p class="intro">${renderText("Du hast alle Bilder richtig zugeordnet.", settings.syllables)}</p>${scoreLine(quizState.firstTryCorrect, quizState.order.length, settings.syllables)}<button class="primary" id="again">${renderText("Noch einmal", settings.syllables)}</button><button id="home">${renderText("Andere Wortliste", settings.syllables)}</button></div></section>`);
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
    const settings = getSettings();
    const items = BLITZ_SPEEDS.map((s) => `<button class="speed-option" data-duration="${s.ms}" aria-label="${escapeHtml(s.label)} - ${escapeHtml(s.hint)}"><span class="speed-icon">${s.icon}</span><span class="speed-label">${renderText(s.label, settings.syllables)}</span></button>`).join("");
    render(`<section class="screen">
      <div class="topbar"><button id="home">${renderText("← Start", settings.syllables)}</button><h1>${renderText(list.name, settings.syllables)}</h1></div>
      <p class="intro">${renderText("Wie schnell soll das Wort verschwinden?", settings.syllables)}</p>
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
    const settings = getSettings();
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${blitzState.index + 1} von ${blitzState.order.length}`, settings.syllables)}</div></div>
      <div class="word-card"><button id="ready" class="primary speak" aria-label="Bereit - Wort anzeigen">${renderText("⚡ Bereit", settings.syllables)}</button></div>
      <p class="hint">${renderText("Leertaste drücken oder Bereit antippen, dann genau hinschauen.", settings.syllables)}</p>
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
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${blitzState.index + 1} von ${blitzState.order.length}`, settings.syllables)}</div></div>
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
    const settings = getSettings();
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${blitzState.index + 1} von ${blitzState.order.length}`, settings.syllables)}</div></div>
      <div class="word-card"></div>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    const gen = renderGeneration;
    setTimeout(() => { if (renderGeneration === gen) blitzQuiz(); }, 300);
  }

  function blitzQuiz() {
    const settings = getSettings();
    const entry = blitzState.order[blitzState.index];
    const distractors = shuffle(blitzState.list.words.filter((w) => w.id !== entry.id)).slice(0, 3);
    const options = shuffle([entry, ...distractors]);
    blitzState.correctId = entry.id;
    blitzState.locked = false;
    let attempted = false;
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${blitzState.index + 1} von ${blitzState.order.length}`, settings.syllables)}</div></div>
      <p class="intro">${renderText("Welches Bild passt zum Wort?", settings.syllables)}</p>
      <div class="quiz-grid">
        ${options.map((opt, i) => `<button class="quiz-option" data-id="${escapeHtml(opt.id)}" aria-label="Bildoption ${i + 1}"><img src="${escapeHtml(opt.image.url)}" alt="" /></button>`).join("")}
      </div>
      ${attributionLine(entry.image, settings.syllables)}
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
    const settings = getSettings();
    render(`<section class="screen"><div class="finish"><h1>${renderText("Geschafft! 🎉", settings.syllables)}</h1><p class="intro">${renderText("Du hast alle Wörter erkannt.", settings.syllables)}</p>${scoreLine(blitzState.firstTryCorrect, blitzState.order.length, settings.syllables)}<button class="primary" id="again">${renderText("Noch einmal", settings.syllables)}</button><button id="home">${renderText("Andere Wortliste", settings.syllables)}</button></div></section>`);
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
    const settings = getSettings();
    const entry = writeState.order[writeState.index];
    let hintTimer = null;
    // Räumt einen laufenden Tipp-Timer auf - wird beim Verlassen des Screens
    // (Start-Button, Weiter) und beim Loslassen des Tipp-Buttons aufgerufen.
    const stopHint = () => { if (hintTimer) { clearInterval(hintTimer); hintTimer = null; } const el = app.querySelector("#hint-display"); if (el) el.textContent = ""; };
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${writeState.index + 1} von ${writeState.order.length}`, settings.syllables)}</div></div>
      <div class="word-card"><img class="write-image" src="${escapeHtml(entry.image.url)}" alt="" /></div>
      <div class="hint-display" id="hint-display" aria-live="polite"></div>
      <form id="write-form">
        <input id="write-input" class="write-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Wort eintippen" />
        <div class="write-row">
          <button type="button" id="hint" class="secondary">${renderText("💡 Tipp", settings.syllables)}</button>
          <button type="button" id="speak" class="secondary" aria-label="Das Wort vorlesen">${renderText("🔊 Vorlesen", settings.syllables)}</button>
        </div>
        <button type="submit" class="primary write-submit">${renderText("Weiter →", settings.syllables)}</button>
      </form>
      ${attributionLine(entry.image, settings.syllables)}
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
    const settings = getSettings();
    render(`<section class="screen">
      <div class="topbar"><button id="home" aria-label="Zur Startseite">${renderText("⌂ Start", settings.syllables)}</button><div class="progress">${renderText(`${writeState.index + 1} von ${writeState.order.length}`, settings.syllables)}</div></div>
      <div class="word-card">
        <p class="feedback-verdict ${isCorrect ? "correct" : "wrong"}">${renderText(isCorrect ? "✅ Richtig!" : "❌ Nicht ganz richtig", settings.syllables)}</p>
        ${isCorrect ? `<div class="word">${renderWord(entry, settings.syllables)}</div>` : `
          <div class="compare-grid">
            <div class="compare-box wrong"><p class="compare-label">${renderText("Deine Antwort", settings.syllables)}</p><p class="compare-word">${escapeHtml(userInput) || "–"}</p></div>
            <div class="compare-box correct"><p class="compare-label">${renderText("Richtig wäre", settings.syllables)}</p><p class="compare-word">${renderWord(entry, settings.syllables)}</p></div>
          </div>`}
      </div>
      <button id="next" class="primary">${renderText("Weiter →", settings.syllables)}</button>
    </section>`);
    app.querySelector("#home").addEventListener("click", home);
    app.querySelector("#next").addEventListener("click", () => { writeState.index++; writeRound(); });
  }

  function writeComplete() {
    const settings = getSettings();
    render(`<section class="screen"><div class="finish"><h1>${renderText("Geschafft! 🎉", settings.syllables)}</h1><p class="intro">${renderText("Du hast alle Wörter geschrieben.", settings.syllables)}</p>${scoreLine(writeState.firstTryCorrect, writeState.order.length, settings.syllables)}<button class="primary" id="again">${renderText("Noch einmal", settings.syllables)}</button><button id="home">${renderText("Andere Wortliste", settings.syllables)}</button></div></section>`);
    app.querySelector("#again").addEventListener("click", () => writeStart(writeState.list.id));
    app.querySelector("#home").addEventListener("click", home);
  }

  home();
})();
