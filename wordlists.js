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
  // Die folgenden drei Listen ersetzen die frühere Einzelliste "Gastronomie".
  // Herkunft: digitalisierte Lernkarten (bisher Metacom-Bilder, hier durch
  // ARASAAC ersetzt), neu nach Themen sortiert statt nach Kartenset-Nummer.
  // Mehrere Wörter kommen unverändert aus Küche/Landwirtschaft/Berufe wieder
  // (gleiche id/gleiches Bild) - siehe Konvention in CLAUDE.md.
  {
    id: "essen_trinken",
    name: "Essen & Trinken",
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
      { id: "de-obst", word: "Obst", syllables: ["Obst"], conceptId: "fruit", image: arasaac("fruit", 28339) },
      { id: "de-gemuese", word: "Gemüse", syllables: ["Ge", "mü", "se"], conceptId: "vegetables", image: arasaac("vegetables", 29131) },
      { id: "de-fisch", word: "Fisch", syllables: ["Fisch"], conceptId: "fish", image: arasaac("fish", 2520) },
      { id: "de-fleisch", word: "Fleisch", syllables: ["Fleisch"], conceptId: "meat", image: arasaac("meat", 2316) },
      { id: "de-kartoffel", word: "Kartoffel", syllables: ["Kar", "tof", "fel"], conceptId: "potato", image: arasaac("potato", 2503) },
      { id: "de-nudeln", word: "Nudeln", syllables: ["Nu", "deln"], conceptId: "pasta", image: arasaac("pasta", 8652) },
      { id: "de-salat", word: "Salat", syllables: ["Sa", "lat"], conceptId: "salad", image: arasaac("salad", 2377) },
    ],
  },
  {
    id: "im_restaurant",
    name: "Im Restaurant",
    lang: "de",
    words: [
      { id: "de-kellner", word: "Kellner", syllables: ["Kell", "ner"], conceptId: "waiter", image: arasaac("waiter", 2681) },
      { id: "de-kellnerin", word: "Kellnerin", syllables: ["Kell", "ne", "rin"], conceptId: "waiter_f", image: arasaac("waiter_f", 11198) },
      { id: "de-koch", word: "Koch", syllables: ["Koch"], conceptId: "cook", image: arasaac("cook", 6985) },
      { id: "de-koechin", word: "Köchin", syllables: ["Kö", "chin"], conceptId: "cook_f", image: arasaac("cook_f", 3235) },
      { id: "de-rechnung", word: "Rechnung", syllables: ["Rech", "nung"], conceptId: "bill", image: arasaac("bill", 5995) },
      { id: "de-trinkgeld", word: "Trinkgeld", syllables: ["Trink", "geld"], conceptId: "tip", image: arasaac("tip", 38972) },
      { id: "de-tablett", word: "Tablett", syllables: ["Tab", "lett"], conceptId: "tray", image: arasaac("tray", 2656) },
      { id: "de-essen", word: "essen", syllables: ["es", "sen"], conceptId: "eat", image: arasaac("eat", 2349) },
      { id: "de-trinken", word: "trinken", syllables: ["trin", "ken"], conceptId: "drink_action", image: arasaac("drink_action", 2276) },
      { id: "de-vorspeise", word: "Vorspeise", syllables: ["Vor", "spei", "se"], conceptId: "appetizer", image: arasaac("appetizer", 7219) },
      { id: "de-hauptgericht", word: "Hauptgericht", syllables: ["Haupt", "ge", "richt"], conceptId: "main_course", image: arasaac("main_course", 7240) },
      { id: "de-nachtisch", word: "Nachtisch", syllables: ["Nach", "tisch"], conceptId: "dessert", image: arasaac("dessert", 7216) },
      { id: "de-eis", word: "Eis", syllables: ["Eis"], conceptId: "ice_cream", image: arasaac("ice_cream", 35209) },
      { id: "de-brot", word: "Brot", syllables: ["Brot"], conceptId: "bread", image: arasaac("bread", 10230) },
      { id: "de-burger", word: "Burger", syllables: ["Bur", "ger"], conceptId: "burger", image: arasaac("burger", 2419) },
      { id: "de-pizza", word: "Pizza", syllables: ["Piz", "za"], conceptId: "pizza", image: arasaac("pizza", 2527) },
      { id: "de-kuchen", word: "Kuchen", syllables: ["Ku", "chen"], conceptId: "cake", image: arasaac("cake", 26304) },
    ],
  },
  {
    id: "am_tisch",
    name: "Am Tisch",
    lang: "de",
    words: [
      { id: "de-zucker", word: "Zucker", syllables: ["Zu", "cker"], conceptId: "sugar", image: arasaac("sugar", 25560) },
      { id: "de-salz", word: "Salz", syllables: ["Salz"], conceptId: "salt", image: arasaac("salt", 25576) },
      { id: "de-pfeffer", word: "Pfeffer", syllables: ["Pfef", "fer"], conceptId: "pepper", image: arasaac("pepper", 25331) },
      { id: "de-flasche", word: "Flasche", syllables: ["Fla", "sche"], conceptId: "bottle", image: arasaac("bottle", 2288) },
      { id: "de-tisch", word: "Tisch", syllables: ["Tisch"], conceptId: "table", image: arasaac("table", 37873) },
      { id: "de-stuhl", word: "Stuhl", syllables: ["Stuhl"], conceptId: "chair", image: arasaac("chair", 6614) },
      { id: "de-speisekarte", word: "Speisekarte", syllables: ["Spei", "se", "kar", "te"], conceptId: "menu", image: arasaac("menu", 32514) },
      { id: "de-getraenkekarte", word: "Getränkekarte", syllables: ["Ge", "trän", "ke", "kar", "te"], conceptId: "drink_menu", image: arasaac("drink_menu", 34221) },
      { id: "de-teller", word: "Teller", syllables: ["Tel", "ler"], conceptId: "plate", image: arasaac("plate", 16857) },
      { id: "de-glas", word: "Glas", syllables: ["Glas"], conceptId: "glass", image: arasaac("glass", 2610) },
      { id: "de-becher", word: "Becher", syllables: ["Be", "cher"], conceptId: "mug", image: arasaac("mug", 2582) },
      { id: "de-tasse", word: "Tasse", syllables: ["Tas", "se"], conceptId: "cup", image: arasaac("cup", 9091) },
      { id: "de-loeffel", word: "Löffel", syllables: ["Löf", "fel"], conceptId: "spoon", image: arasaac("spoon", 2362) },
      { id: "de-gabel", word: "Gabel", syllables: ["Ga", "bel"], conceptId: "fork", image: arasaac("fork", 2588) },
      { id: "de-messer", word: "Messer", syllables: ["Mes", "ser"], conceptId: "knife", image: arasaac("knife", 4931) },
      { id: "de-besteck", word: "Besteck", syllables: ["Be", "steck"], conceptId: "cutlery", image: arasaac("cutlery", 8545) },
    ],
  },
];
