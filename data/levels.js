// Level definitions. Data only — no behaviour.
//
// Each level lists the item ids in the tray (with multiplicities), the bag
// size, the per-level time-bonus tuning, and a 3-star threshold ladder
// (ascending). The 1-star bar is the win condition; clearing the level
// requires final score >= starThresholds[0]. CARRY_FACTOR is global and
// lives in src/logic.js.
//
// Bags were shrunk in `feature/smaller-bags-fewer-items` to roughly the size
// of a real grocery bag (25-40 cells), and trays trimmed to 6-10 items per
// level. Smaller bags raise fill ratios and force tighter packing decisions;
// thresholds were rescaled to the new ceilings using each level's original
// star-ratio character (easier levels keep their 85%-of-ceiling 3-star bar;
// the glass-jar capstone keeps its 90% bar).

export const LEVELS = [
  // Level 1 — Bag Basics. A 5x5 bag and sturdy items only (no eggs, bread,
  // chips, jar, strawberries, bananas, greens, baguette, wine, pizza).
  // Under sensible top-down play nothing breaks; this level teaches placement
  // and Carry before any fragility puzzle is introduced. Tray fills 16/25
  // cells (64%) so there is real packing room to experiment. Max base 100 +
  // bonus 100 = ceiling 200.
  {
    id: 1,
    name: "Bag Basics",
    bag: { W: 5, H: 5 },
    tray: [
      "canned", "canned", "canned",
      "onions", "onions",
      "carrots",
      "potatoes",
      "flour",
    ],
    starThresholds: [80, 130, 170],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 2 — Tall & Narrow. A 3x10 bag still forces strict stack-order
  // thinking: most placements lock under whatever the player puts on top.
  // Tray fills 21/30 cells (70%). Potatoes are the obvious bottom anchor;
  // chips and bread belong on top; strawberries are the lightest fragile
  // ballast. Wine bottles are an awkward 1x3 in a 3-wide bag — they bite a
  // full column for three rows. Max base 158.
  {
    id: 2,
    name: "Tall & Narrow",
    bag: { W: 3, H: 10 },
    tray: [
      "potatoes",
      "canned", "canned",
      "soda",
      "bread",
      "chips",
      "strawberries",
      "wine",
      "jar",
    ],
    starThresholds: [115, 160, 190],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 3 — Wide & Shallow. A 9x4 bag is the spatial inverse of Level 2:
  // only four vertical layers, plenty of horizontal room. Tray fills 26/36
  // cells (72%). The trap is putting the eggs anywhere but the top row,
  // where any load above them wins. Pizza is the awkward neighbour — 3x3
  // in a 4-tall bag, leaving only one row above it for fragile cover.
  // Baguette (4x1) demands a clean 4-wide stripe somewhere; the bag is
  // 9 wide rather than 8 so pizza (3 cols) and baguette (4 cols) can sit
  // in disjoint column ranges with breathing room for the smaller items
  // around them. Max base 143.
  {
    id: 3,
    name: "Wide & Shallow",
    bag: { W: 9, H: 4 },
    tray: [
      "pizza",
      "canned", "canned",
      "carrots",
      "bananas",
      "eggs",
      "cereal",
      "baguette",
    ],
    starThresholds: [105, 145, 170],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 4 — Protect the eggs. Multiple ultra-fragile items competing for
  // top-row real estate in a 5x7 bag, 24/35 cells filled (69%). Eggs lose
  // 35 if anything sits above them; strawberries lose 22 each. Wine bottles
  // (str 10) are mid-fragile and need their own column-stripe. Watermelon
  // is the dominant bottom anchor. Max base 212.
  {
    id: 4,
    name: "Protect the eggs",
    bag: { W: 5, H: 7 },
    tray: [
      "watermelon",
      "potatoes",
      "canned", "canned",
      "eggs", "eggs",
      "strawberries", "strawberries",
      "wine",
    ],
    starThresholds: [140, 200, 235],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 5 — Fragile forest. A 6x6 bag stuffed (31/36, 86%) with mostly
  // fragile items — bananas, eggs, strawberries, wine, baguette, pizza —
  // plus a potato and carrots as the only viable anchors. Every mid-layer
  // slot bears a sub-strength load; almost no slack. Max base 221. The
  // level rewards finding the one clean layering rather than rushing.
  {
    id: 5,
    name: "Fragile forest",
    bag: { W: 6, H: 6 },
    tray: [
      "potatoes",
      "carrots",
      "bananas", "bananas",
      "eggs",
      "strawberries", "strawberries",
      "baguette",
      "wine",
      "pizza",
    ],
    starThresholds: [140, 200, 240],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 6 — Heavy haul. The inverse of Fragile Forest: a 5x7 bag at 29/35
  // cells (83%), filled with heavy rigid items only. Wine is deliberately
  // excluded — its str 10 is lower than cereal's str 14, so a can above wine
  // would break it and the level would inherit fragility-roulette
  // character. The puzzle is the strength-budget chain: cans (str 45) at
  // the bottom can hold cans above them, but cereal (str 14) has to live
  // near the top or it crumples. Max base 143.
  {
    id: 6,
    name: "Heavy haul",
    bag: { W: 5, H: 7 },
    tray: [
      "watermelon",
      "potatoes",
      "soda",
      "canned", "canned", "canned",
      "onions", "onions",
      "cereal",
      "flour",
    ],
    starThresholds: [105, 145, 170],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 7 — The glass-jar bind. The capstone. The jar is heavy enough
  // (wt 7) to crush bread/eggs/chips if it sits on them, AND fragile enough
  // (str 12) to break under ~two cans or a heavy stack. A zero-damage
  // layout exists (heavy on bottom, fragile/light spread across the top row
  // in separate columns), but every odd-shaped item — baguette (4x1, str 4),
  // pizza (3x3, str 6), soda (1x3, wt 9) — chews up the top row, forcing
  // layout trade-offs. 7x6 bag, 30/42 cells (71%). The seventh column
  // matters here: pizza (3 cols) and baguette (4 cols) together cover 7
  // cols, which only fit disjointly in a ≥7-wide bag — otherwise baguette
  // is forced to stack on pizza and the level collapses to one layout.
  // Max base 159. The 1-star bar of 140 (~88% of max base) means a clean
  // carry always wins; the 2-star and 3-star bars require non-trivial
  // bonus on top of survival, preserving the speed-vs-safety choice.
  {
    id: 7,
    name: "The glass-jar bind",
    bag: { W: 7, H: 6 },
    tray: [
      "canned", "canned",
      "soda",
      "cereal",
      "eggs",
      "chips",
      "jar",
      "baguette",
      "pizza",
    ],
    starThresholds: [140, 210, 235],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
];
