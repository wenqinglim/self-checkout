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
  // a 128-value tray: losing chips (val 8) only drops the base to 120 and
  // clears with zero time bonus, so that path is trivial. The tight path is
  // losing the eggs (val 35) — base 93, must finish in ≤83s for a clean win.
  // That's what the level is asking the player to play around.
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
  // eggs, and chips if it sits on them, AND fragile enough (str 12) to break
  // under ~two cans or a heavy stack. A zero-damage layout *does* exist with
  // current stats (heavy on bottom, fragile/light spread across the top row
  // in separate columns), so the bind isn't breakage — it's the threshold.
  // Max base 165 vs threshold 210 means even a clean carry needs ≥45 time
  // bonus (finish in ≤55s); sacrificing chips drops the base to 157 and the
  // bar to ≤53s, freeing a few seconds of planning time. The real choice
  // here is speed-vs-safety.
  //
  // Plan §9 wants this level to be the graded-scoring showcase where the
  // player MUST sacrifice something — that intent isn't fully met by the
  // current item stats in a 4-wide bag (the jar can always be isolated in
  // its own top-row column with nothing heavy above). Worth revisiting in
  // playtest if the speed/safety trade doesn't feel sharp enough.
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
    // Explicit ladder is required here: the controller's fallback
    // (1.2x/1.4x) would produce a 3-star bar of 294, but the absolute
    // ceiling is 265 (max base 165 + max time bonus 100), making it
    // mathematically unreachable. With this ladder, 2-star (230) needs
    // a clean carry in ≤35s and 3-star (250) in ≤15s — tight but real.
    starThresholds: [210, 230, 250],
    timeBonusMax: 100,
    timeDecay: 1.0,
  },
];
