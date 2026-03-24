/**
 * Categorize ingredients by supermarket aisle order (Dutch supermarket layout).
 * Returns ingredients grouped and sorted by aisle.
 */

const AISLE_ORDER: { label: string; emoji: string; keywords: string[] }[] = [
  {
    label: "Groente & Fruit",
    emoji: "🥬",
    keywords: [
      "sla", "spinazie", "rucola", "tomaat", "tomaatjes", "cherry", "paprika",
      "komkommer", "ui", "uien", "knoflook", "gember", "prei", "wortel",
      "aardappel", "krieltjes", "zoete aardappel", "broccoli", "bloemkool",
      "courgette", "aubergine", "champignon", "avocado", "citroen", "limoen",
      "sinaasappel", "appel", "banaan", "bessen", "aardbei", "framboos",
      "bosbes", "peer", "druif", "mango", "ananas", "kool", "rode kool",
      "witte kool", "asperge", "sperzieboon", "doperwt", "mais", "radijs",
      "bieslook", "peterselie", "basilicum", "dille", "koriander", "munt",
      "rozemarijn", "tijm", "oregano", "selderij", "venkel", "pastinaak",
      "knolselderij", "pompoen", "artisjok", "lente-ui", "bosui",
    ],
  },
  {
    label: "Brood & Bakkerij",
    emoji: "🍞",
    keywords: [
      "brood", "bolletje", "baguette", "croissant", "pita", "tortilla",
      "wrap", "toast", "cracker", "beschuit", "pannenkoek",
    ],
  },
  {
    label: "Zuivel & Eieren",
    emoji: "🥛",
    keywords: [
      "melk", "havermelk", "amandelmelk", "sojamelk", "room", "slagroom",
      "crème fraîche", "zure room", "yoghurt", "kwark", "karnemelk",
      "boter", "margarine", "ei", "eieren", "kaas", "mozzarella", "parmezaan",
      "cheddar", "geitenkaas", "brie", "ricotta", "mascarpone", "feta",
      "roomkaas", "cottage cheese",
    ],
  },
  {
    label: "Vlees & Vis",
    emoji: "🥩",
    keywords: [
      "kip", "kipfilet", "kippenborst", "kippendij", "gehakt", "rundergehakt",
      "varkensvlees", "biefstuk", "entrecote", "spekjes", "bacon", "ham",
      "worst", "knakworst", "rookworst", "lam", "lamsvlees", "eend",
      "kalkoen", "zalm", "zalmfilet", "tonijn", "garnaal", "garnalen",
      "kabeljauw", "pangasius", "forel", "makreel", "mosselen", "inktvis",
      "vis", "filet",
    ],
  },
  {
    label: "Pasta, Rijst & Granen",
    emoji: "🍝",
    keywords: [
      "pasta", "spaghetti", "penne", "fusilli", "tagliatelle", "macaroni",
      "lasagne", "noodle", "rijst", "basmati", "jasmine", "couscous",
      "bulgur", "quinoa", "haver", "havermout", "polenta", "gnocchi",
      "tortellini", "ravioli",
    ],
  },
  {
    label: "Conserven & Peulvruchten",
    emoji: "🥫",
    keywords: [
      "blik", "kikkererwt", "bonen", "kidney", "witte bonen", "zwarte bonen",
      "linzen", "tomatenpuree", "tomatenblokjes", "san marzano", "gepelde tomaten",
      "kokosmelt", "kokosroom", "bouillon", "passata",
    ],
  },
  {
    label: "Olie, Sauzen & Kruiden",
    emoji: "🫒",
    keywords: [
      "olijfolie", "zonnebloemolie", "plantaardige olie", "sesamolie",
      "azijn", "balsamico", "sojasaus", "ketjap", "sriracha", "tabasco",
      "mosterd", "mayonaise", "ketchup", "pesto", "tahini", "sambal",
      "hoisin", "worcestershire", "vissaus", "oestersaus",
      "zout", "peper", "zwarte peper", "paprikapoeder", "komijn", "kurkuma",
      "kaneel", "nootmuskaat", "kardemom", "korianderzaad", "venkelzaad",
      "chilivlokken", "cayennepeper", "kruidnagel", "laurierblad",
      "oregano", "tijm", "rozemarijn", "kerrie", "garam masala",
      "ras el hanout", "za'atar",
    ],
  },
  {
    label: "Bakken",
    emoji: "🧁",
    keywords: [
      "bloem", "zelfrijzend", "bakpoeder", "bakingsoda", "gist",
      "suiker", "basterdsuiker", "poedersuiker", "vanille", "vanillesuiker",
      "cacao", "cacaopoeder", "chocolade", "chocoladechips", "kokos",
      "kokosrasp", "amandelmeel", "maizena", "amandelschaafsel",
      "gelatine", "glazuur",
    ],
  },
  {
    label: "Noten, Zaden & Gedroogd",
    emoji: "🥜",
    keywords: [
      "amandel", "walnoot", "cashew", "pinda", "hazelnoot", "pecannoot",
      "pistache", "pijnboom", "pijnboompit", "zonnebloempit", "pompoenpit",
      "sesamzaad", "chiazaad", "lijnzaad", "rozijn", "cranberry",
      "dadel", "vijg", "abrikoos", "pindakaas", "notenpasta",
    ],
  },
  {
    label: "Dranken",
    emoji: "☕",
    keywords: [
      "koffie", "thee", "sap", "water", "bruiswater", "limonade",
      "wijn", "bier", "rum", "cognac", "amaretto",
    ],
  },
  {
    label: "Honing & Siroop",
    emoji: "🍯",
    keywords: [
      "honing", "ahornsiroop", "maple", "stroop", "agave", "suikersiroop",
    ],
  },
  {
    label: "Diepvries",
    emoji: "🧊",
    keywords: [
      "diepvries", "bevroren", "ijsje", "ijs", "pizza", "friet",
      "bladerdeeg", "filodeeg",
    ],
  },
];

interface CategorizedItem {
  category: string;
  emoji: string;
  items: string[];
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[,()]/g, "").replace(/\d+\s*(g|kg|ml|l|dl|cl|el|tl|eetlepel|theelepel|snufje|teen|stuk)\s*/gi, "").trim();
}

export function categorizeIngredients(ingredients: string[]): CategorizedItem[] {
  const categorized = new Map<string, { emoji: string; items: string[] }>();
  const uncategorized: string[] = [];

  for (const ing of ingredients) {
    const normalized = normalizeForMatch(ing);
    let matched = false;

    for (const aisle of AISLE_ORDER) {
      if (aisle.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized.split(" ")[0]))) {
        if (!categorized.has(aisle.label)) {
          categorized.set(aisle.label, { emoji: aisle.emoji, items: [] });
        }
        categorized.get(aisle.label)!.items.push(ing);
        matched = true;
        break;
      }
    }

    if (!matched) {
      uncategorized.push(ing);
    }
  }

  // Build result in aisle order
  const result: CategorizedItem[] = [];
  for (const aisle of AISLE_ORDER) {
    const cat = categorized.get(aisle.label);
    if (cat && cat.items.length > 0) {
      result.push({ category: aisle.label, emoji: cat.emoji, items: cat.items });
    }
  }
  if (uncategorized.length > 0) {
    result.push({ category: "Overig", emoji: "📦", items: uncategorized });
  }

  return result;
}

/**
 * Format a shopping list grouped by supermarket aisle.
 */
export function formatShoppingList(title: string, ingredients: string[]): string {
  const categories = categorizeIngredients(ingredients);
  let text = `${title}\n`;

  for (const cat of categories) {
    text += `\n${cat.emoji} ${cat.category}:\n`;
    for (const item of cat.items) {
      text += `- ${item}\n`;
    }
  }

  return text.trim();
}
