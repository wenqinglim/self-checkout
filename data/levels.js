// Level definitions. Data only — no behaviour.
//
// Each level lists the item ids in the tray (with multiplicities), the bag
// size, the per-level time-bonus tuning, and a 3-star threshold ladder
// (ascending). The 1-star bar is the win condition; clearing the level
// requires final score >= starThresholds[0]. CARRY_FACTOR is global and
// lives in src/logic.js.
//
// Grids were doubled in `feature/halve-grid-resolution` so item footprints
// can express realistic relative sizes. Trays were grown to refill the bag
// to roughly the previous occupancy ratio, and thresholds rescaled to the
// new max base scores.

export const LEVELS = [
  // Level 1 — Bag Basics. A 6x8 bag and sturdy items only (no eggs, bread,
  // chips, jar, strawberries, bananas, greens, baguette, wine, pizza). Under
  // sensible top-down play nothing breaks: this level teaches placement and
  // Carry before any fragility puzzle is introduced. Adversarial stacks CAN
  // still break sturdies (3 cans stacked on one onion: column load 24, x1.5
  // = 36 > 30 strength; 4 onions stacked above carrots' three-col footprint
  // in a single column: column load 16, carrots see 16, x1.5 = 24 > 20),
  // but no normal player working top-to-bottom hits these. Tray fills 26/48
  // cells (54%) so the player has room to experiment. Max base 166 + bonus
  // 100 = ceiling 266. 1-star is reachable by carrying anything; 3-star
  // requires a clean pack and a reasonably fast finish (~35s).
  {
    id: 1,
    name: "Bag Basics",
    bag: { W: 6, H: 8 },
    tray: [
      "canned", "canned", "canned", "canned",
      "onions", "onions", "onions", "onions",
      "carrots", "carrots",
      "potatoes", "potatoes",
      "flour",
    ],
    starThresholds: [110, 175, 230],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 2 — Tall & Narrow. A 4x14 bag still forces strict stack-order
  // thinking: most placements are locked under whatever the player puts on
  // top. Tray fills 38/56 cells (68%). Potatoes are the obvious bottom anchor
  // pair; chips and bread belong on top; strawberries are the lightest fragile
  // ballast. Wine bottles are an awkward 1x3 — they occupy a single column for
  // three rows, biting hard into a narrow bag. Max base 308.
  {
    id: 2,
    name: "Tall & Narrow",
    bag: { W: 4, H: 14 },
    tray: [
      "potatoes", "potatoes",
      "soda", "soda",
      "canned", "canned", "canned", "canned",
      "bread", "bread",
      "chips",
      "jar", "jar",
      "strawberries", "strawberries",
      "wine", "wine",
    ],
    starThresholds: [180, 250, 300],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 3 — Wide & Shallow. A 10x6 bag is a totally different spatial puzzle
  // from a tall bag: only six vertical layers, but plenty of horizontal room.
  // Tray fills 51/60 cells (85%). A clean three-or-four-layer pack
  // (sturdy/mid/fragile) keeps every item intact; the trap is putting the
  // eggs anywhere but the top row, where any load above them wins. Pizza is
  // the new awkward neighbour — 3x3 flat and surprisingly fragile (str 6).
  // Max base 286.
  {
    id: 3,
    name: "Wide & Shallow",
    bag: { W: 10, H: 6 },
    tray: [
      "cereal", "cereal",
      "bananas", "bananas",
      "carrots", "carrots",
      "greens", "greens",
      "eggs", "eggs",
      "canned", "canned", "canned", "canned",
      "pizza",
      "baguette",
      "flour",
    ],
    starThresholds: [170, 230, 270],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 4 — Protect the Eggs. The "shield the eggs" idea, now with multiple
  // ultra-fragile items competing for the top row. 8x10 bag, 59/80 cells
  // filled. Putting eggs OR strawberries anywhere with weight above them
  // loses 35 or 22 respectively. Wine bottles (str 10) are mid-fragile and
  // need their own column-stripe handled. Max base 459.
  {
    id: 4,
    name: "Protect the eggs",
    bag: { W: 8, H: 10 },
    tray: [
      "watermelon",
      "potatoes", "potatoes",
      "canned", "canned", "canned", "canned",
      "soda", "soda",
      "bread", "bread",
      "eggs", "eggs", "eggs",
      "strawberries", "strawberries", "strawberries", "strawberries",
      "chips", "chips",
      "wine", "wine",
      "flour",
    ],
    starThresholds: [250, 360, 420],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 5 — Fragile Forest. An 8x8 bag stuffed (58/64 cells, 91%) with
  // mostly fragile items: bananas, greens, eggs, strawberries, jar, wine,
  // baguette, bread, pizza — plus a single potato and pairs of carrots as the
  // only viable anchors. Every mid-layer slot bears a sub-strength load;
  // there's almost no slack. Max base 460. The level rewards finding the one
  // clean layering rather than rushing.
  {
    id: 5,
    name: "Fragile forest",
    bag: { W: 8, H: 8 },
    tray: [
      "potatoes",
      "carrots", "carrots",
      "bananas", "bananas", "bananas",
      "greens", "greens",
      "eggs", "eggs",
      "strawberries", "strawberries", "strawberries",
      "jar", "jar",
      "wine", "wine",
      "baguette",
      "bread", "bread",
      "pizza",
    ],
    starThresholds: [240, 350, 420],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 6 — Heavy Haul. The inverse of Fragile Forest: an 8x10 bag filled
  // 56/80 (70%) with heavy, rigid items only (watermelon, 3 potatoes, 3
  // sodas, 10 cans, 4 onions, 2 flour) plus a single cereal as the only
  // fragile concern. Wine is deliberately excluded — its str 10 is lower
  // than cereal's str 14, so a single can above wine would break it and
  // the level would inherit the fragility-roulette character of Level 5.
  // The puzzle here is the strength-budget chain — cans (str 45) at the
  // bottom can hold cans above them, but cereal (str 14) has to live near
  // the top or it crumples. Tests intuition for "how much does this item
  // bear?" without mid-fragile items in play. Max base 317.
  {
    id: 6,
    name: "Heavy haul",
    bag: { W: 8, H: 10 },
    tray: [
      "watermelon",
      "potatoes", "potatoes", "potatoes",
      "soda", "soda", "soda",
      "canned", "canned", "canned", "canned", "canned",
      "canned", "canned", "canned", "canned", "canned",
      "onions", "onions", "onions", "onions",
      "cereal",
      "flour", "flour",
    ],
    starThresholds: [180, 250, 290],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 7 — The Glass-Jar Bind. The original capstone, retained in spirit.
  // The jar is heavy enough (wt 7) to crush bread/eggs/chips if it sits on
  // them, AND fragile enough (str 12) to break under ~two cans or a heavy
  // stack. A zero-damage layout exists (heavy on bottom, fragile/light
  // spread across the top row in separate columns), but every odd-shaped
  // newcomer — baguette (4x1, str 4), wine (1x3, str 10), pizza (3x3, str 6)
  // — chews up the top row, forcing layout trade-offs. 8x10 bag, 67/80 cells
  // (84%). Max base 388. The 3-star bar of 440 means even a clean carry
  // needs a non-trivial bonus (~52, finish in ≤48s). The choice the level
  // forces is speed-vs-safety.
  {
    id: 7,
    name: "The glass-jar bind",
    bag: { W: 8, H: 10 },
    tray: [
      "watermelon",
      "canned", "canned", "canned", "canned",
      "soda", "soda",
      "cereal", "cereal",
      "bread", "bread",
      "eggs", "eggs",
      "chips", "chips",
      "jar", "jar",
      "baguette",
      "wine",
      "pizza",
      "flour",
    ],
    starThresholds: [330, 400, 440],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
];
