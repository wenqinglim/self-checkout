// Level definitions. Data only — no behaviour.
//
// Each level lists the item ids in the tray (with multiplicities), the bag
// size, the per-level time-bonus tuning, and a 3-star threshold ladder
// (ascending). The 1-star bar is the win condition; clearing the level
// requires final score >= starThresholds[0]. CARRY_FACTOR is global and
// lives in src/logic.js.

export const LEVELS = [
  // Level 1 — Bag Basics. A small 3x4 bag and sturdy items only (no eggs,
  // bread, chips, jar, strawberries, bananas, greens), so the player can't
  // break anything no matter how they pack. Teaches placement and the Carry
  // button before any fragility is introduced. Tray fits in 10 of 12 cells
  // with room to spare; max base 94 + max time bonus 100 = ceiling 194.
  // 1-star is reachable by carrying anything; 3-star requires a clean pack
  // and a reasonably fast finish (~24s).
  {
    id: 1,
    name: "Bag Basics",
    bag: { W: 3, H: 4 },
    tray: [
      "canned", "canned", "canned",
      "onions", "onions", "onions",
      "carrots", "carrots",
    ],
    starThresholds: [80, 130, 170],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 2 — Tall & Narrow. A 2x7 bag forces strict stack-order thinking:
  // every placement is locked under whatever the player puts on top. Tray
  // fills 12 of 14 cells. Potatoes are the obvious bottom anchors; chips
  // and bread belong on top. Max base 107, ceiling 207. 3-star at 180 needs
  // a no-breakage pack inside ~27s.
  {
    id: 2,
    name: "Tall & Narrow",
    bag: { W: 2, H: 7 },
    tray: [
      "potatoes", "potatoes",
      "soda",
      "canned", "canned",
      "bread",
      "chips", "chips",
    ],
    starThresholds: [90, 140, 180],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 3 — Wide & Shallow. A 5x3 bag is a totally different spatial
  // puzzle from a tall bag: only three vertical layers, and most items are
  // 2 wide, leaving an awkward 5th column that only 1x1s (cans) can fill.
  // Tray is an exact fit at 15/15 cells. A clean three-layer pack
  // (sturdy/mid/fragile) keeps every item intact for 136 base; the trap is
  // putting the eggs anywhere but the top row, where any load above them
  // wins (eggs strength is 3).
  {
    id: 3,
    name: "Wide & Shallow",
    bag: { W: 5, H: 3 },
    tray: [
      "cereal", "cereal",
      "bananas",
      "carrots",
      "greens",
      "eggs",
      "canned", "canned", "canned",
    ],
    starThresholds: [110, 170, 210],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 4 — Protect the Eggs. The original "shield the eggs" idea, now
  // sharing the bag with strawberries (the only other ultra-fragile item).
  // 4x5 bag, 17/20 cells filled, max base 190. Putting eggs OR strawberries
  // anywhere with weight above them loses 35 or 22 respectively — visibly
  // sacrifice-able, which is the lesson. 3-star at 250 needs a clean pack
  // finishing in ~40s; 2-star at 210 leaves comfortable planning time.
  {
    id: 4,
    name: "Protect the eggs",
    bag: { W: 4, H: 5 },
    tray: [
      "watermelon",
      "potatoes",
      "canned", "canned",
      "soda",
      "bread",
      "eggs",
      "strawberries", "strawberries",
      "chips",
    ],
    starThresholds: [140, 210, 250],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 5 — Fragile Forest. A 4x4 bag stuffed (15/16 cells) with mostly
  // fragile items: jar, eggs, 2 strawberries, 2 bananas, greens — plus a
  // single potato and a single carrot as the only viable anchors. Every
  // mid-layer slot has to bear a sub-strength load; there's almost no slack
  // for sloppy placement. Max base 187. The level rewards finding the one
  // clean layering rather than rushing.
  {
    id: 5,
    name: "Fragile forest",
    bag: { W: 4, H: 4 },
    tray: [
      "potatoes",
      "carrots",
      "bananas", "bananas",
      "greens",
      "eggs",
      "strawberries", "strawberries",
      "jar",
    ],
    starThresholds: [130, 190, 230],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 6 — Heavy Haul. The inverse of Fragile Forest: a 4x5 bag filled
  // 19/20 with heavy, rigid items (watermelon, 2 potatoes, 2 sodas, cans,
  // onions) plus a single cereal as the only real fragile concern. Max base
  // 162. The puzzle is the strength-budget chain — cans (str 45) at the
  // bottom can hold cans above them, but the cereal (str 14) has to live
  // at the top or it crumples. Tests the player's intuition for "how much
  // does this item bear?" without the fragility-roulette of Level 5.
  {
    id: 6,
    name: "Heavy haul",
    bag: { W: 4, H: 5 },
    tray: [
      "watermelon",
      "potatoes", "potatoes",
      "soda", "soda",
      "canned", "canned", "canned",
      "onions", "onions",
      "cereal",
    ],
    starThresholds: [110, 170, 210],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },

  // Level 7 — The Glass-Jar Bind. The original capstone, retained verbatim.
  // The jar is heavy enough (wt 7) to crush bread/eggs/chips if it sits on
  // them, AND fragile enough (str 12) to break under ~two cans or a heavy
  // stack. A zero-damage layout exists (heavy on bottom, fragile/light
  // spread across the top row in separate columns), so the bind is
  // *threshold*, not breakage. Max base 165 vs the 250 3-star bar means
  // even a clean carry needs ≥85 bonus (finish in ≤15s); 2-star at 230 is
  // a clean carry in ≤35s. Sacrificing chips drops the base to 157 and
  // tightens the bar further. The choice the level forces is speed-vs-safety.
  {
    id: 7,
    name: "The glass-jar bind",
    bag: { W: 4, H: 5 },
    tray: [
      "watermelon",
      "canned", "canned",
      "soda",
      "cereal",
      "bread",
      "eggs",
      "chips",
      "jar",
    ],
    starThresholds: [210, 230, 250],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
];
