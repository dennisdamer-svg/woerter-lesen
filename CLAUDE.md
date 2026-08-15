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
- `style.css` – Styling, hoher Kontrast, große Touch-Flächen für iPad
- `tools/hyphenate.js` – Hilfsskript für Silbentrennungs-Vorschläge (s. u.)

Es gibt **kein** In-App-Bearbeiten von Wortlisten (keine Lehrkraft-Oberfläche
mehr, kein `localStorage` für Inhalte). `localStorage` wird nur noch für die
Silbenschrift-Einstellung verwendet (pro Gerät, keine Inhalte). Wortlisten
werden ausschließlich über `wordlists.js` im Code gepflegt.

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
- **`conceptId`**: englischer, sprachneutraler Slug (z. B. `plate`, `cat`,
  `kitchen`). Verbindet später gleiche Bilder über Sprachen hinweg – "Teller"
  (de) und "plate" (en) teilen sich dasselbe Bild, wenn ihre `conceptId`
  übereinstimmt. Bei Berufsbezeichnungen die geschlechtsneutrale Berufs-ID
  verwenden (z. B. "Lehrerin" → `teacher`, nicht `teacher_f`).
- **`syllables`**: nach deutschen Trennregeln (Duden). Zusammengesetzte Wörter
  (Komposita, z. B. "Tierärztin" → Tier-ärz-tin) können bei automatischer
  Trennung danebenliegen – von Hand prüfen.
- **`image`**: aktuell überall `null`. Struktur ist vorbereitet für
  ARASAAC-Piktogramme (Lizenz **CC BY-NC-SA – Quellenangabe nötig!**, z. B.
  `{ source: "arasaac", url, license: "CC BY-NC-SA", attribution: "ARASAAC" }`)
  und ergänzend KI-generierte Bilder (`source: "ai"`). Bilder werden in der
  App erst nach Antippen von "Vorlesen" angezeigt, nicht vorher (Schüler:innen
  sollen zuerst nur den Text selbst lesen).

### Neue Wörter/Listen hinzufügen

1. Optional: `node tools/hyphenate.js "Wort"` für einen Trennvorschlag laufen
   lassen – das Ergebnis danach gegen die Duden-Regeln prüfen, besonders bei
   zusammengesetzten Wörtern.
2. Eintrag nach obigem Schema in `wordlists.js` ergänzen.
3. `git add -A && git commit -m "..."`. Push macht i. d. R. der Projektinhaber
   selbst im Terminal (Push braucht Zugangsdaten, die hier nicht hinterlegt sind).

## Sonstiges

- Sprachausgabe: Web Speech API, `de-DE`, ausgelöst nur durch Tastendruck
  (iOS-Safari-Vorgabe). Rate `0.78` für gut verständliches, nicht zu schnelles
  Vorlesen.
- DSGVO: Die App verarbeitet aktuell keine personenbezogenen Daten (keine
  Anmeldung, keine Lernstands-Speicherung). Sobald Lernfortschritt pro
  Schüler:in dazukommt (geplante spätere Ausbaustufe), ändert sich das – dann
  separat neu bewerten (Backend/Konten nötig, echte Schülerdaten).
