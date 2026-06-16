// Level definitions. Data only — no behaviour.
//
// Each level lists the item ids in the tray (with multiplicities), the bag size,
// the score threshold needed to clear it, and the time-bonus tuning for that
// level. CARRY_FACTOR is global and lives in src/logic.js.

export const LEVELS = [
  {
    id: 1,
    name: "Tutorial",
    bag: { W: 4, H: 6 },
    tray: [
      "watermelon",
      "canned",
      "canned",
      "bread",
      "eggs",
      "chips",
    ],
    threshold: 80,
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
  {
    id: 2,
    name: "Width",
    bag: { W: 4, H: 6 },
    tray: [
      "watermelon",
      "cereal",
      "cereal",
      "bread",
      "canned",
      "canned",
      "soda",
      "chips",
    ],
    threshold: 100,
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
  // Level 3: tighter bag (4x4) forces the player to actively shield the eggs
  // — there's no "stash them in a corner and ignore" option. Threshold 110 on
  // a 128-value tray means the player can afford to lose chips (val 8) and
  // still clear with a modest time bonus, but losing eggs (val 35) makes the
  // win uncomfortably tight.
  {
    id: 3,
    name: "Protect the eggs",
    bag: { W: 4, H: 4 },
    tray: [
      "watermelon",
      "canned",
      "canned",
      "soda",
      "bread",
      "eggs",
      "chips",
    ],
    threshold: 110,
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
  // Level 4: introduces the glass jar — heavy enough (wt 7) to crush bread,
  // eggs, and chips it sits on, AND fragile enough (str 12) to break under
  // ~two cans or a heavy stack. There's no fully-clean solution, so the
  // intended play is to sacrifice the cheapest item (chips, val 8) and keep
  // the jar alive. Threshold 210 on a 165-value tray makes "lose chips only"
  // comfortably winnable (~47s) while "lose the jar" requires unrealistic
  // speed — nudging the player toward the intended sacrifice.
  {
    id: 4,
    name: "The glass-jar bind",
    bag: { W: 4, H: 5 },
    tray: [
      "watermelon",
      "canned",
      "canned",
      "soda",
      "cereal",
      "bread",
      "eggs",
      "chips",
      "jar",
    ],
    threshold: 210,
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
];
