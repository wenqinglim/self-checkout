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
];
