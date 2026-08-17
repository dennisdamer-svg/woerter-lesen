# Wörter lesen – Projektkontext

Kleine, werbefreie iPad-Webapp zum selbstständigen Wortlesen (Förderschwerpunkt
Geistige Entwicklung). Reines HTML/CSS/JS, kein Build-Schritt, kein Backend.
Deploy über IONOS Deploy Now: `git push` auf `main` löst automatisch ein
Redeploy aus, danach ist die Änderung auf allen iPads sofort verfügbar
(Reload der Seite reicht).

## App-Struktur

- `index.html` – lädt `wordlists.js` **vor** `app.js`
- `wordlists.js` – reine Wortlisten-**Daten** (`window.WORDLISTS`), keine Logik
- `app.js` – App-Logik/UI (Anzeige, Vorlesen, Silbenschrift-Umschalter), keine Wortinhalte
- `style.css` – Styling, hoher Kontrast, große Touch-Flächen für iPad,
  Schriftart Poppins (lokal in `fonts/`, siehe unten)
- `tools/hyphenate.js` – Hilfsskript für Silbentrennungs-Vorschläge (s. u.)

Es gibt **kein** In-App-Bearbeiten von Wortlisten (keine Lehrkraft-Oberfläche
mehr, kein `localStorage` für Inhalte). `localStorage` wird nur noch für die
Silbenschrift-Einstellung verwendet (pro Gerät, keine Inhalte). Wortlisten
werden ausschließlich über `wordlists.js` im Code gepflegt.

## Aktuelle Listen (Stand: siehe `wordlists.js`)

- **Küche** (14), **Berufe** (10) – direkte Listen auf oberster Ebene der
  Startseite.
- **Landwirtschaft** – Gruppe, führt zu **Tiere & Hof** (17), **Feld &
  Maschinen** (16).
- **Gastronomie** – Gruppe, führt zu **Essen & Trinken** (15), **Im
  Restaurant** (17), **Am Tisch** (16).

Beide Gruppen: digitalisiert aus vorhandenen Lernkarten (ursprünglich
Metacom-Bilder, hier durch ARASAAC ersetzt) und nach Themen statt nach
Kartenset-Nummer sortiert. Bewusst etwas größer als die Faustregel
6–10 Wörter/Liste – lässt sich bei Bedarf später weiter aufteilen, sobald
einzelne Themen wachsen.

### Gruppen (mehrstufige Startseite)

`window.WORDLISTS` ist eine Mischung aus direkten Listen und Gruppen:

```js
{ id: "gastronomie", type: "group", name: "Gastronomie", icon: {...}, children: [
  { id: "essen_trinken", name: "Essen & Trinken", icon: {...}, words: [...] },
  // ...
] }
```

Eine Gruppe hat `children` statt `words` und `type: "group"`. Auf der
Startseite führt ein Klick auf eine Gruppe zu einer Zwischenseite
("Thema auswählen") mit den `children` als normalen Listen-Buttons -
implementiert über `chooseGroup()` in `app.js`. `findList(id)` in `app.js`
sucht sowohl direkte Listen als auch Listen innerhalb von Gruppen, damit
Üben/Bild-Übung unabhängig von der Verschachtelung funktionieren.

Jede Liste/Gruppe kann ein optionales `icon` haben (gleiche Bild-Struktur wie
bei Wörtern), das auf dem jeweiligen Auswahl-Button als kleines Vorschaubild
erscheint. Wo möglich ein Bild wiederverwenden, das ohnehin schon zu einem
Wort in der Liste gehört (z. B. Küche-Icon = Bild des Worts "Küche") - spart
Pflegeaufwand und hält die Bilderanzahl klein.

## Wortlisten pflegen (`wordlists.js`)

Datenstruktur pro Liste:

```js
{
  id: "kueche",        // Listen-ID (intern zur Auswahl verwendet)
  name: "Küche",       // angezeigter Listenname
  lang: "de",           // Sprachcode, aktuell nur "de", später z. B. "en"
  words: [
    {
      id: "de-teller",           // eindeutig pro Sprache: <lang>-<slug(wort)>
      word: "Teller",            // angezeigtes/vorgelesenes Wort
      syllables: ["Tel", "ler"], // für die farbige Silbenschrift
      conceptId: "plate",        // sprachneutral, verbindet Übersetzungen + Bild
      image: null,               // später: { source, url, license, attribution }
    },
  ],
}
```

### Konventionen

- **`id`**: `<lang>-<slug>`. Slug = Wort kleingeschrieben, `ä→ae ö→oe ü→ue ß→ss`,
  keine Sonderzeichen/Leerzeichen. Muss über alle Sprachen hinweg eindeutig sein.
  Ausnahme: Taucht dasselbe Wort (gleiche Bedeutung, gleiches Bild) bewusst in
  mehreren Listen auf (z. B. "Teller"/"Glas"/"Tasse"/"Löffel" in Küche **und**
  Am Tisch, "Koch" in Berufe **und** Im Restaurant), wird derselbe Eintrag
  (gleiche `id`) einfach wiederverwendet – das ist unproblematisch, da
  Quiz-Distraktoren nur innerhalb einer Liste gewählt werden.
- **`conceptId`**: englischer, sprachneutraler Slug (z. B. `plate`, `cat`,
  `kitchen`). Verbindet später gleiche Bilder über Sprachen hinweg – "Teller"
  (de) und "plate" (en) teilen sich dasselbe Bild, wenn ihre `conceptId`
  übereinstimmt. Bei Berufsbezeichnungen die geschlechtsneutrale Berufs-ID
  verwenden (z. B. "Lehrerin" → `teacher`, nicht `teacher_f`) – **außer**
  beide Genusformen desselben Berufs kommen gleichzeitig in derselben Liste
  vor und brauchen unterschiedliche (geschlechtsspezifische) Bilder; dann
  eigene `conceptId`s mit `_f`-Suffix verwenden (z. B. "Kellner" → `waiter`,
  "Kellnerin" → `waiter_f`), da `conceptId` aktuell 1:1 den Bilddateinamen
  bestimmt und sich zwei Wörter kein Bild teilen können, wenn sie
  unterschiedlich aussehen müssen.
- **`syllables`**: nach deutschen Trennregeln (Duden). Zusammengesetzte Wörter
  (Komposita, z. B. "Tierärztin" → Tier-ärz-tin) können bei automatischer
  Trennung danebenliegen – von Hand prüfen.
- **`image`**: `{ source, arasaacId, url, license, attribution }` (siehe
  `arasaac()`-Hilfsfunktion oben in `wordlists.js`) oder `null`, falls noch
  kein Bild gesetzt ist. Bilder werden lokal unter `images/pictograms/`
  gespeichert (Dateiname = `conceptId`), nicht extern verlinkt – die App
  funktioniert damit unabhängig von der Verfügbarkeit von arasaac.org.
  ARASAAC-Bilder stehen unter **CC BY-NC-SA** (Quellenangabe nötig); die App
  zeigt die Quellenangabe automatisch an, sobald ein Bild sichtbar ist
  (`attributionLine()` in `app.js`). Ergänzend können KI-generierte Bilder
  verwendet werden (`source: "ai"`, ohne `arasaacId`).
  - Im Lesemodus ("🔤 Wort lesen") werden **keine** Bilder angezeigt – bewusst
    reduziert auf Wort + Vorlesen, damit die Übung einfach bleibt.
  - Im Bild-Übungsmodus ("🖼️ Bild-Übung" auf der Moduswahl-Seite) ist das
    Bild Teil der Aufgabe: Wort wird gezeigt, Schüler:in wählt es aus 4
    Bild-Alternativen. Der Vorlesen-Button ist hier bewusst klein und unten
    rechts platziert (nicht der große primäre Button wie im Lesemodus), damit
    er nicht zum vorschnellen Antippen verleitet – die Schüler:innen sollen
    primär lesen, Audio ist nur Zusatzhilfe. Ein Wort braucht ein Bild, damit
    dieser Modus für seine Liste erscheint – ohne durchgängige Bilder wird der
    Button automatisch ausgeblendet (`hasImages()` in `app.js`).
  - Im Blitzlesen-Modus ("⚡ Blitzlesen") wird das Wort nach Antippen von
    "Bereit" (oder Leertaste) nur kurz eingeblendet (wählbare Dauer:
    3000/1500/800/500/300/150 ms, ausgewählt über eine Reihe aus 6 Symbolen
    -Schnecke/Fußgänger/Fahrrad/Auto/Hase/Rakete- statt Millisekundenzahlen;
    `BLITZ_SPEEDS` in `app.js`), dann folgt ein kurzer leerer/neutraler
    Bildschirm (Maske gegen Nachbild-Effekte) und danach dieselbe
    4-Bilder-Kontrolle wie bei der Bild-Übung - ohne das Wort nochmal zu
    zeigen, da hier das Kurzzeitgedächtnis trainiert wird. Braucht ebenfalls
    durchgängige Bilder in der Liste (`hasImages()`).

### Neues ARASAAC-Bild zu einem Wort hinzufügen

1. Passendes Piktogramm suchen: `curl -sS "https://api.arasaac.org/v1/pictograms/de/search/<Wort>" | jq`
   – auf `_id` und `keywords` achten, mehrere Kandidaten vergleichen.
2. Bild herunterladen: `curl -sS -o images/pictograms/<conceptId>.png "https://static.arasaac.org/pictograms/<id>/<id>_500.png"`
   und **visuell prüfen** (z. B. mit dem Read-Tool), ob es wirklich passt.
3. In `wordlists.js` beim Wort `image: arasaac("<conceptId>", <id>)` setzen.

Falls kein einzelnes ARASAAC-Bild passt, können zwei Piktogramme lokal mit
Pillow (Python) zu einem Bild kombiniert werden (Beispiel: "Getränkekarte" =
Menü-Vorlage 5513 + Getränke-Bild 4575, mit `Image.alpha_composite` in das
weiße Oval der Vorlage montiert). In dem Fall `arasaacId` als String mit
beiden Quell-IDs dokumentieren, z. B. `arasaac("drink_menu", "5513+4575 (kombiniert)")`.

### Neue Wörter/Listen hinzufügen

1. Optional: `node tools/hyphenate.js "Wort"` für einen Trennvorschlag laufen
   lassen – das Ergebnis danach gegen die Duden-Regeln prüfen, besonders bei
   zusammengesetzten Wörtern.
2. Eintrag nach obigem Schema in `wordlists.js` ergänzen (inkl. Bild, s. o.).
3. `git add -A && git commit -m "..."`. Push macht i. d. R. der Projektinhaber
   selbst im Terminal (Push braucht Zugangsdaten, die hier nicht hinterlegt sind).

## Sonstiges

- **Schriftart**: Poppins (statt Systemschrift), lokal in `fonts/` gehostet
  (kein Google-Fonts-CDN zur Laufzeit, aus Datenschutzgründen). Bewusst
  gewählt wegen des einstöckigen, druckschrift-/schulschriftartigen "a" (statt
  des doppelstöckigen "a" der Systemschrift) – besser lesbar für Schüler:innen.
  Ähnelt optisch Century Gothic, ist aber frei lizenziert (SIL Open Font
  License) und daher selbst hostbar.
- **Bildschirm-Layout**: `.screen` ist auf `100dvh` fixiert (nicht nur
  `min-height`) und die flexiblen Bereiche (`.word-card`, `.quiz-grid`) haben
  `min-height: 0`, damit sich alles ins iPad-Display einpasst, ohne dass
  gescrollt werden muss. `overflow-y: auto` bleibt als Sicherheitsnetz für
  seltene Extremfälle.
- **Wort-Anzeige bricht nie um**: `.word`/`.quiz-word` haben `white-space:
  nowrap`; `fitTextToWidth()`/`scheduleFit()` in `app.js` verkleinern die
  Schrift per JS so weit, bis ein Wort in eine Zeile passt (z. B. bei langen
  Wörtern wie "Gartenschere"). `scheduleFit()` prüft zusätzlich nochmal nach
  `document.fonts.ready`, weil Poppins asynchron nachlädt (`font-display:
  swap`) und die anfängliche Messung sonst mit der schmaleren Systemschrift
  stattfindet.
- Sprachausgabe: Web Speech API, `de-DE`, ausgelöst nur durch Tastendruck
  (iOS-Safari-Vorgabe). Rate `0.78` für gut verständliches, nicht zu schnelles
  Vorlesen.
- DSGVO: Die App verarbeitet aktuell keine personenbezogenen Daten (keine
  Anmeldung, keine Lernstands-Speicherung). Sobald Lernfortschritt pro
  Schüler:in dazukommt (geplante spätere Ausbaustufe), ändert sich das – dann
  separat neu bewerten (Backend/Konten nötig, echte Schülerdaten).
