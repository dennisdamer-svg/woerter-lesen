// Wortlisten-Daten für "Wörter lesen".
//
// Diese Datei enthält ausschließlich Inhalte (keine App-Logik) und ist bewusst
// von app.js getrennt, damit Wortlisten-Änderungen unabhängig von der
// Weiterentwicklung der App gemacht werden können. Konventionen und Anleitung
// zum Ergänzen neuer Wörter/Listen: siehe CLAUDE.md.
window.WORDLISTS = [
  {
    id: "kueche",
    name: "Küche",
    lang: "de",
    words: [
      { id: "de-kueche", word: "Küche", syllables: ["Kü", "che"], conceptId: "kitchen", image: null },
      { id: "de-teller", word: "Teller", syllables: ["Tel", "ler"], conceptId: "plate", image: null },
      { id: "de-loeffel", word: "Löffel", syllables: ["Löf", "fel"], conceptId: "spoon", image: null },
      { id: "de-gabel", word: "Gabel", syllables: ["Ga", "bel"], conceptId: "fork", image: null },
      { id: "de-messer", word: "Messer", syllables: ["Mes", "ser"], conceptId: "knife", image: null },
      { id: "de-topf", word: "Topf", syllables: ["Topf"], conceptId: "pot", image: null },
      { id: "de-tasse", word: "Tasse", syllables: ["Tas", "se"], conceptId: "cup", image: null },
      { id: "de-glas", word: "Glas", syllables: ["Glas"], conceptId: "glass", image: null },
      { id: "de-brot", word: "Brot", syllables: ["Brot"], conceptId: "bread", image: null },
      { id: "de-milch", word: "Milch", syllables: ["Milch"], conceptId: "milk", image: null },
      { id: "de-mehl", word: "Mehl", syllables: ["Mehl"], conceptId: "flour", image: null },
      { id: "de-zucker", word: "Zucker", syllables: ["Zu", "cker"], conceptId: "sugar", image: null },
      { id: "de-salz", word: "Salz", syllables: ["Salz"], conceptId: "salt", image: null },
      { id: "de-pfeffer", word: "Pfeffer", syllables: ["Pfef", "fer"], conceptId: "pepper", image: null },
    ],
  },
  {
    id: "landwirtschaft",
    name: "Landwirtschaft",
    lang: "de",
    words: [
      { id: "de-traktor", word: "Traktor", syllables: ["Trak", "tor"], conceptId: "tractor", image: null },
      { id: "de-stall", word: "Stall", syllables: ["Stall"], conceptId: "barn", image: null },
      { id: "de-bauer", word: "Bauer", syllables: ["Bau", "er"], conceptId: "farmer", image: null },
      { id: "de-feld", word: "Feld", syllables: ["Feld"], conceptId: "field", image: null },
      { id: "de-kuh", word: "Kuh", syllables: ["Kuh"], conceptId: "cow", image: null },
      { id: "de-schwein", word: "Schwein", syllables: ["Schwein"], conceptId: "pig", image: null },
      { id: "de-huhn", word: "Huhn", syllables: ["Huhn"], conceptId: "chicken", image: null },
      { id: "de-ernte", word: "Ernte", syllables: ["Ern", "te"], conceptId: "harvest", image: null },
      { id: "de-kartoffel", word: "Kartoffel", syllables: ["Kar", "tof", "fel"], conceptId: "potato", image: null },
      { id: "de-gemuese", word: "Gemüse", syllables: ["Ge", "mü", "se"], conceptId: "vegetables", image: null },
    ],
  },
  {
    id: "berufe",
    name: "Berufe",
    lang: "de",
    words: [
      { id: "de-lehrerin", word: "Lehrerin", syllables: ["Leh", "re", "rin"], conceptId: "teacher", image: null },
      { id: "de-arzt", word: "Arzt", syllables: ["Arzt"], conceptId: "doctor", image: null },
      { id: "de-baeckerin", word: "Bäckerin", syllables: ["Bä", "cke", "rin"], conceptId: "baker", image: null },
      { id: "de-polizist", word: "Polizist", syllables: ["Po", "li", "zist"], conceptId: "police_officer", image: null },
      { id: "de-gaertnerin", word: "Gärtnerin", syllables: ["Gärt", "ne", "rin"], conceptId: "gardener", image: null },
      { id: "de-koch", word: "Koch", syllables: ["Koch"], conceptId: "cook", image: null },
      { id: "de-feuerwehrmann", word: "Feuerwehrmann", syllables: ["Feu", "er", "wehr", "mann"], conceptId: "firefighter", image: null },
      { id: "de-tischlerin", word: "Tischlerin", syllables: ["Tisch", "le", "rin"], conceptId: "carpenter", image: null },
      { id: "de-busfahrer", word: "Busfahrer", syllables: ["Bus", "fah", "rer"], conceptId: "bus_driver", image: null },
      { id: "de-tieraerztin", word: "Tierärztin", syllables: ["Tier", "ärz", "tin"], conceptId: "veterinarian", image: null },
    ],
  },
];
