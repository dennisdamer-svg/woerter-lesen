// Wortlisten-Daten für "Wörter lesen".
//
// Diese Datei enthält ausschließlich Inhalte (keine App-Logik) und ist bewusst
// von app.js getrennt, damit Wortlisten-Änderungen unabhängig von der
// Weiterentwicklung der App gemacht werden können. Konventionen und Anleitung
// zum Ergänzen neuer Wörter/Listen: siehe CLAUDE.md.
//
// Bilder: ARASAAC-Piktogramme (Lizenz CC BY-NC-SA, Quellenangabe "ARASAAC"
// nötig - wird in der App automatisch angezeigt, sobald ein Bild sichtbar
// ist). Lokal in images/pictograms/<conceptId>.png gespeichert, damit die
// App unabhängig von der Verfügbarkeit von arasaac.org funktioniert.
const arasaac = (conceptId, arasaacId) => ({
  source: "arasaac",
  arasaacId,
  url: `images/pictograms/${conceptId}.png`,
  license: "CC BY-NC-SA",
  attribution: "ARASAAC (arasaac.org)",
});

window.WORDLISTS = [
  {
    id: "kueche",
    name: "Küche",
    lang: "de",
    words: [
      { id: "de-kueche", word: "Küche", syllables: ["Kü", "che"], conceptId: "kitchen", image: arasaac("kitchen", 33070) },
      { id: "de-teller", word: "Teller", syllables: ["Tel", "ler"], conceptId: "plate", image: arasaac("plate", 16857) },
      { id: "de-loeffel", word: "Löffel", syllables: ["Löf", "fel"], conceptId: "spoon", image: arasaac("spoon", 2362) },
      { id: "de-gabel", word: "Gabel", syllables: ["Ga", "bel"], conceptId: "fork", image: arasaac("fork", 2588) },
      { id: "de-messer", word: "Messer", syllables: ["Mes", "ser"], conceptId: "knife", image: arasaac("knife", 4931) },
      { id: "de-topf", word: "Topf", syllables: ["Topf"], conceptId: "pot", image: arasaac("pot", 9086) },
      { id: "de-tasse", word: "Tasse", syllables: ["Tas", "se"], conceptId: "cup", image: arasaac("cup", 9091) },
      { id: "de-glas", word: "Glas", syllables: ["Glas"], conceptId: "glass", image: arasaac("glass", 2610) },
      { id: "de-brot", word: "Brot", syllables: ["Brot"], conceptId: "bread", image: arasaac("bread", 10230) },
      { id: "de-milch", word: "Milch", syllables: ["Milch"], conceptId: "milk", image: arasaac("milk", 2445) },
      { id: "de-mehl", word: "Mehl", syllables: ["Mehl"], conceptId: "flour", image: arasaac("flour", 8600) },
      { id: "de-zucker", word: "Zucker", syllables: ["Zu", "cker"], conceptId: "sugar", image: arasaac("sugar", 25560) },
      { id: "de-salz", word: "Salz", syllables: ["Salz"], conceptId: "salt", image: arasaac("salt", 25576) },
      { id: "de-pfeffer", word: "Pfeffer", syllables: ["Pfef", "fer"], conceptId: "pepper", image: arasaac("pepper", 25331) },
    ],
  },
  {
    id: "landwirtschaft",
    name: "Landwirtschaft",
    lang: "de",
    words: [
      { id: "de-traktor", word: "Traktor", syllables: ["Trak", "tor"], conceptId: "tractor", image: arasaac("tractor", 2600) },
      { id: "de-stall", word: "Stall", syllables: ["Stall"], conceptId: "barn", image: arasaac("barn", 26840) },
      { id: "de-bauer", word: "Bauer", syllables: ["Bau", "er"], conceptId: "farmer", image: arasaac("farmer", 2982) },
      { id: "de-feld", word: "Feld", syllables: ["Feld"], conceptId: "field", image: arasaac("field", 25916) },
      { id: "de-kuh", word: "Kuh", syllables: ["Kuh"], conceptId: "cow", image: arasaac("cow", 2609) },
      { id: "de-schwein", word: "Schwein", syllables: ["Schwein"], conceptId: "pig", image: arasaac("pig", 2327) },
      { id: "de-huhn", word: "Huhn", syllables: ["Huhn"], conceptId: "chicken", image: arasaac("chicken", 2403) },
      { id: "de-ernte", word: "Ernte", syllables: ["Ern", "te"], conceptId: "harvest", image: arasaac("harvest", 7227) },
      { id: "de-kartoffel", word: "Kartoffel", syllables: ["Kar", "tof", "fel"], conceptId: "potato", image: arasaac("potato", 2503) },
      { id: "de-gemuese", word: "Gemüse", syllables: ["Ge", "mü", "se"], conceptId: "vegetables", image: arasaac("vegetables", 29131) },
    ],
  },
  {
    id: "berufe",
    name: "Berufe",
    lang: "de",
    words: [
      { id: "de-lehrerin", word: "Lehrerin", syllables: ["Leh", "re", "rin"], conceptId: "teacher", image: arasaac("teacher", 2456) },
      { id: "de-arzt", word: "Arzt", syllables: ["Arzt"], conceptId: "doctor", image: arasaac("doctor", 2467) },
      { id: "de-baeckerin", word: "Bäckerin", syllables: ["Bä", "cke", "rin"], conceptId: "baker", image: arasaac("baker", 3359) },
      { id: "de-polizist", word: "Polizist", syllables: ["Po", "li", "zist"], conceptId: "police_officer", image: arasaac("police_officer", 2824) },
      { id: "de-gaertnerin", word: "Gärtnerin", syllables: ["Gärt", "ne", "rin"], conceptId: "gardener", image: arasaac("gardener", 2961) },
      { id: "de-koch", word: "Koch", syllables: ["Koch"], conceptId: "cook", image: arasaac("cook", 6985) },
      { id: "de-feuerwehrmann", word: "Feuerwehrmann", syllables: ["Feu", "er", "wehr", "mann"], conceptId: "firefighter", image: arasaac("firefighter", 2664) },
      { id: "de-tischlerin", word: "Tischlerin", syllables: ["Tisch", "le", "rin"], conceptId: "carpenter", image: arasaac("carpenter", 11204) },
      { id: "de-busfahrer", word: "Busfahrer", syllables: ["Bus", "fah", "rer"], conceptId: "bus_driver", image: arasaac("bus_driver", 38086) },
      { id: "de-tieraerztin", word: "Tierärztin", syllables: ["Tier", "ärz", "tin"], conceptId: "veterinarian", image: arasaac("veterinarian", 2780) },
    ],
  },
  {
    id: "gastronomie",
    name: "Gastronomie",
    lang: "de",
    words: [
      { id: "de-wasser", word: "Wasser", syllables: ["Was", "ser"], conceptId: "water", image: arasaac("water", 2248) },
      { id: "de-cola", word: "Cola", syllables: ["Co", "la"], conceptId: "cola", image: arasaac("cola", 2338) },
      { id: "de-fanta", word: "Fanta", syllables: ["Fan", "ta"], conceptId: "fanta", image: arasaac("fanta", 6569) },
      { id: "de-sprite", word: "Sprite", syllables: ["Spri", "te"], conceptId: "sprite", image: arasaac("sprite", 6551) },
      { id: "de-tee", word: "Tee", syllables: ["Tee"], conceptId: "tea", image: arasaac("tea", 2429) },
      { id: "de-kaffee", word: "Kaffee", syllables: ["Kaf", "fee"], conceptId: "coffee", image: arasaac("coffee", 24479) },
      { id: "de-wein", word: "Wein", syllables: ["Wein"], conceptId: "wine", image: arasaac("wine", 2614) },
      { id: "de-bier", word: "Bier", syllables: ["Bier"], conceptId: "beer", image: arasaac("beer", 2330) },
      { id: "de-teller", word: "Teller", syllables: ["Tel", "ler"], conceptId: "plate", image: arasaac("plate", 16857) },
      { id: "de-glas", word: "Glas", syllables: ["Glas"], conceptId: "glass", image: arasaac("glass", 2610) },
      { id: "de-becher", word: "Becher", syllables: ["Be", "cher"], conceptId: "mug", image: arasaac("mug", 2582) },
      { id: "de-tasse", word: "Tasse", syllables: ["Tas", "se"], conceptId: "cup", image: arasaac("cup", 9091) },
    ],
  },
];
