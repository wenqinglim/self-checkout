// Headless tests for src/logic.js. Run with: node tests/logic.test.js
//
// No test framework. Each assertion either passes silently or throws; the
// runner at the bottom prints PASS/FAIL counts and exits non-zero on failure.

import {
  CARRY_FACTOR,
  TIME_BONUS_MAX,
  canPlace,
  isRemovable,
  evaluateBreakage,
  finalScore,
  settle,
  starsFor,
  survivalScore,
  timeBonus,
} from "../src/logic.js";
import { ITEMS } from "../data/items.js";

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}
function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error(`${msg || "expected equal"}: got ${a}, want ${b}`);
  }
}
function assertClose(a, b, msg, eps = 1e-9) {
  if (typeof a !== "number" || typeof b !== "number" || Math.abs(a - b) > eps) {
    throw new Error(`${msg || "expected close"}: got ${a}, want ~${b}`);
  }
}
function assertSetEq(set, arr, msg) {
  const got = [...set].sort().join(",");
  const want = [...arr].sort().join(",");
  if (got !== want) {
    throw new Error(`${msg || "set mismatch"}: got [${got}], want [${want}]`);
  }
}

// --- Sanity --------------------------------------------------------------

test("CARRY_FACTOR is 1.5", () => assertEq(CARRY_FACTOR, 1.5));

// --- The plan's oracles --------------------------------------------------

test("eggs directly under a watermelon are damaged", () => {
  const grid = { W: 3, H: 5 };
  const placements = [
    { id: "w1", itemId: "watermelon", x: 0, y: 0 },
    { id: "e1", itemId: "eggs", x: 0, y: 4 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["w1"], 0, "watermelon sees no load above it");
  // Watermelon weight 10 spread over 3 cols => 10/3 per col. Eggs span 2 of
  // those 3 cols => 20/3 ≈ 6.667. 6.667 * 1.5 = 10 > strength 3, eggs break.
  assertClose(loads["e1"], 20 / 3, "eggs see summed load 20/3");
  assertSetEq(damagedIds, ["e1"], "only eggs broken");
});

test("eggs ON TOP of a watermelon: nothing is damaged", () => {
  // Watermelon is 3 wide; eggs sit across two of its columns above its top.
  const grid = { W: 3, H: 4 };
  const placements = [
    { id: "e1", itemId: "eggs", x: 0, y: 0 },
    { id: "w1", itemId: "watermelon", x: 0, y: 1 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["e1"], 0);
  // Eggs weight 2 over 2 cols => 1 each in cols 0,1; col 2 is empty.
  // Watermelon spans cols 0..2 => sees 1 + 1 + 0 = 2.
  assertEq(loads["w1"], 2);
  assertSetEq(damagedIds, [], "no damage");
});

test("cereal box (w=2) on two 1x1 items: each sees load 2", () => {
  // Cereal is now 2x2, so the grid needs a third row for the cans below it.
  const grid = { W: 2, H: 3 };
  const placements = [
    { id: "cer", itemId: "cereal", x: 0, y: 0 },
    { id: "left", itemId: "canned", x: 0, y: 2 },
    { id: "right", itemId: "canned", x: 1, y: 2 },
  ];
  const { loads, damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["cer"], 0);
  // Cereal redistributes (0 + 4) / 2 = 2 to each column.
  assertEq(loads["left"], 2, "left can sees exactly 2 — not 4");
  assertEq(loads["right"], 2, "right can sees exactly 2 — not 4");
  // 2 * 1.5 = 3 < 45 strength of canned, so cans survive.
  assertSetEq(damagedIds, []);
});

// --- A few more I want covered ------------------------------------------

test("a heavy column crushes a strawberry at the bottom (no spreading)", () => {
  // Two cans stacked over a strawberry in a single column. Chips used to
  // play this role at 1x1; now chips is 2x2, so strawberries inherit the
  // "1x1 fragile" slot for this single-column test.
  const grid = { W: 1, H: 3 };
  const placements = [
    { id: "c1", itemId: "canned", x: 0, y: 0 },
    { id: "c2", itemId: "canned", x: 0, y: 1 },
    { id: "s", itemId: "strawberries", x: 0, y: 2 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["c1"], 0);
  assertEq(loads["c2"], 8); // top can passes its 8 down
  assertEq(loads["s"], 16); // 8 + 8 of the two cans
  // 16 * 1.5 = 24 >> 4 strength of strawberries.
  assertSetEq(damagedIds, ["s"]);
});

test("watermelon two rows above eggs: load carries through the gap", () => {
  const grid = { W: 3, H: 6 };
  // Watermelon at rows 0..2 (3x3); eggs at row 5; rows 3–4 empty.
  const placements = [
    { id: "w1", itemId: "watermelon", x: 0, y: 0 },
    { id: "e1", itemId: "eggs", x: 0, y: 5 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  // Watermelon passes 10/3 per col across cols 0..2. Eggs (2 cols) see
  // 20/3 ≈ 6.667 total, despite the empty rows between them.
  assertClose(loads["e1"], 20 / 3);
  assertSetEq(damagedIds, ["e1"]);
});

test("an item by itself on the floor never damages itself", () => {
  const grid = { W: 2, H: 2 };
  const placements = [
    { id: "e1", itemId: "eggs", x: 0, y: 1 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["e1"], 0);
  assertSetEq(damagedIds, []);
});

test("glass jar on a strawberry: strawberry breaks under jar's 7 weight", () => {
  // Jar weight 7 sits on strawberries strength 4 => 7 * 1.5 = 10.5 > 4.
  // The jar is now 1x2 and chips are 2x2, so the single-column oracle uses
  // strawberries (still 1x1) as the fragile beneath.
  const grid = { W: 1, H: 3 };
  const placements = [
    { id: "j", itemId: "jar", x: 0, y: 0 },
    { id: "s", itemId: "strawberries", x: 0, y: 2 },
  ];
  const { damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  assertSetEq(damagedIds, ["s"]);
});

test("cereal bridging a gap: one col carries load past the empty cell", () => {
  // Cereal 2x2 at (0,0) covers rows 0–1; a single can at (0,3). Col 1 below
  // cereal is empty all the way to the floor. The can in col 0 sees 2.
  const grid = { W: 2, H: 4 };
  const placements = [
    { id: "cer", itemId: "cereal", x: 0, y: 0 },
    { id: "c1", itemId: "canned", x: 0, y: 3 },
  ];
  const { loads, damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["c1"], 2);
  assertSetEq(damagedIds, []);
});

test("fractional passDown: bread under a jar splits 9/2 = 4.5 per col", () => {
  // Jar (now 1x2, weight 7) at (0,0) covers rows 0–1 of col 0. Bread (2x1,
  // weight 2) sits at (0,2) under the jar's column. Bread sees loadFromAbove
  // 7 + 0 = 7 (and breaks: 7*1.5 = 10.5 > 5 strength), then passes
  // (7 + 2) / 2 = 4.5 down each column. A 1x1 can in the right column
  // therefore sees exactly 4.5.
  const grid = { W: 2, H: 4 };
  const placements = [
    { id: "j",   itemId: "jar",    x: 0, y: 0 },
    { id: "br",  itemId: "bread",  x: 0, y: 2 },
    { id: "can", itemId: "canned", x: 1, y: 3 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertClose(loads["can"], 4.5, "fractional load arrives intact");
  assertSetEq(damagedIds, ["br"], "only bread broken");
});

test("two same-row items don't influence each other (no shared columns)", () => {
  const grid = { W: 4, H: 2 };
  const placements = [
    { id: "a", itemId: "canned", x: 0, y: 0 },
    { id: "b", itemId: "canned", x: 3, y: 0 },
    // strawberries (still 1x1) takes the fragile-under-the-can slot now that
    // chips have grown to 2x2.
    { id: "s", itemId: "strawberries", x: 0, y: 1 },
  ];
  const { loads, damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  // Strawberry at (0,1) sees the can above it only.
  assertEq(loads["s"], 8);
  assertSetEq(damagedIds, ["s"]);
});

// --- Placement validity --------------------------------------------------

test("canPlace: fits in empty grid", () => {
  const grid = { W: 4, H: 6 };
  assert(
    canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 0, y: 0 }),
  );
});

test("canPlace: rejects out-of-grid placements", () => {
  const grid = { W: 4, H: 6 };
  // Watermelon is 3x3; (2, 0) would overflow column 4 (2+3=5).
  assert(
    !canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 2, y: 0 }),
    "right edge overflow",
  );
  assert(
    !canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 0, y: 4 }),
    "bottom edge overflow",
  );
  assert(
    !canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: -1, y: 0 }),
    "negative x",
  );
});

test("canPlace: rejects overlap with existing items", () => {
  const grid = { W: 4, H: 6 };
  // Watermelon (3x3) at (0,0) covers cols 0..2 rows 0..2.
  const existing = [{ id: "w1", itemId: "watermelon", x: 0, y: 0 }];
  assert(
    !canPlace(grid, existing, ITEMS, {
      id: "c1", itemId: "canned", x: 1, y: 1,
    }),
    "overlaps watermelon's interior",
  );
  assert(
    canPlace(grid, existing, ITEMS, {
      id: "c1", itemId: "canned", x: 3, y: 0,
    }),
    "adjacent placement is fine",
  );
});

// --- Removability -------------------------------------------------------

test("isRemovable: top-row item is always removable", () => {
  const placements = [
    { id: "a", itemId: "canned", x: 0, y: 0 },
    { id: "b", itemId: "canned", x: 0, y: 1 },
  ];
  assert(isRemovable(placements[0], placements, ITEMS));
});

test("isRemovable: blocked by an item directly above", () => {
  const placements = [
    { id: "top", itemId: "canned", x: 0, y: 0 },
    { id: "bot", itemId: "canned", x: 0, y: 1 },
  ];
  assert(
    !isRemovable(placements[1], placements, ITEMS),
    "bottom can is locked under top can",
  );
});

test("isRemovable: wide item locked when ANY cell above is occupied", () => {
  // Bread is 2x1; a single 1x1 can over its right column locks it.
  const placements = [
    { id: "can", itemId: "canned", x: 1, y: 0 },
    { id: "br", itemId: "bread", x: 0, y: 1 },
  ];
  assert(!isRemovable(placements[1], placements, ITEMS));
});

test("isRemovable: same-row neighbour does NOT lock", () => {
  // Two cans in row 0 side by side: each is removable.
  const placements = [
    { id: "a", itemId: "canned", x: 0, y: 0 },
    { id: "b", itemId: "canned", x: 1, y: 0 },
  ];
  assert(isRemovable(placements[0], placements, ITEMS));
  assert(isRemovable(placements[1], placements, ITEMS));
});

// --- Settling ------------------------------------------------------------

test("settle: a single item drops to the floor on an empty bag", () => {
  const grid = { W: 4, H: 6 };
  const result = settle(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 0 });
  // Watermelon is 3x3 in a 4x6 bag → bottom at row 5 ⇒ top y = 3.
  assertEq(result.y, 3);
});

test("settle: stacks on top of an existing item in the same column", () => {
  const grid = { W: 2, H: 6 };
  const existing = [{ id: "c1", itemId: "canned", x: 0, y: 5 }];
  const result = settle(grid, existing, ITEMS, {
    id: "c2", itemId: "canned", x: 0,
  });
  // Lands on row 4, directly above the existing can.
  assertEq(result.y, 4);
});

test("settle: wide item rests on the highest surface across its span", () => {
  // A can in col 2 row 5, col 1 empty. Bread (2x1) at x=1 spans cols 1 & 2.
  // It rests on the can's top (row 5), hovering above empty col 1 — rigid.
  const grid = { W: 4, H: 6 };
  const existing = [{ id: "c1", itemId: "canned", x: 2, y: 5 }];
  const result = settle(grid, existing, ITEMS, {
    id: "br", itemId: "bread", x: 1,
  });
  assertEq(result.y, 4);
});

test("settle: rejects horizontal overflow", () => {
  const grid = { W: 4, H: 6 };
  // Watermelon is 3 wide; dropping at x=2 would overflow into col 4 (2+3=5).
  assertEq(
    settle(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 2 }),
    null,
  );
  assertEq(
    settle(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: -1 }),
    null,
  );
});

test("settle: rejects when a column has no vertical room left", () => {
  // Fill col 0 of a 1-wide bag completely; a strawberry can't fit anywhere.
  // Chips used to be the 1x1 candidate here, but they're 2x2 now.
  const grid = { W: 1, H: 2 };
  const existing = [
    { id: "a", itemId: "canned", x: 0, y: 0 },
    { id: "b", itemId: "canned", x: 0, y: 1 },
  ];
  assertEq(
    settle(grid, existing, ITEMS, { id: "x", itemId: "strawberries", x: 0 }),
    null,
  );
});

test("settle: excludes the candidate's own cells when repositioning", () => {
  // Pretend an existing can at (0,5) is being dragged: settling it at x=0
  // should still resolve to y=5 (the floor), not stack on itself.
  const grid = { W: 1, H: 6 };
  const existing = [{ id: "c1", itemId: "canned", x: 0, y: 5 }];
  const result = settle(grid, existing, ITEMS, {
    id: "c1", itemId: "canned", x: 0,
  });
  assertEq(result.y, 5);
});

// --- Scoring -------------------------------------------------------------

test("survivalScore: damaged items contribute 0; intact items contribute value", () => {
  const placements = [
    { id: "w1", itemId: "watermelon", x: 0, y: 0 }, // value 30
    { id: "e1", itemId: "eggs", x: 0, y: 2 },        // value 35, damaged
    { id: "c1", itemId: "canned", x: 2, y: 0 },     // value 10
  ];
  const damaged = new Set(["e1"]);
  const score = survivalScore(placements, damaged, ITEMS);
  assertEq(score, 40);
});

// --- Timer & final score -------------------------------------------------

test("TIME_BONUS_MAX is 100", () => assertEq(TIME_BONUS_MAX, 100));

test("timeBonus: full bonus at t=0", () => {
  assertEq(timeBonus(100, 1.0, 0), 100);
});

test("timeBonus: decays linearly", () => {
  assertClose(timeBonus(100, 1.0, 25), 75);
  assertClose(timeBonus(100, 2.0, 10), 80);
});

test("timeBonus: floors at zero (never negative)", () => {
  assertEq(timeBonus(100, 1.0, 200), 0);
  assertEq(timeBonus(100, 1.0, 100), 0);
});

test("finalScore: sums survival and bonus", () => {
  assertEq(finalScore(40, 60), 100);
  assertEq(finalScore(0, 0), 0);
});

// --- Stars ---------------------------------------------------------------

test("starsFor: 0 when score is below the 1-star bar", () => {
  assertEq(starsFor(0, [80, 100, 120]), 0);
  assertEq(starsFor(79, [80, 100, 120]), 0);
});

test("starsFor: 1 at exact 1-star threshold (inclusive)", () => {
  assertEq(starsFor(80, [80, 100, 120]), 1);
  assertEq(starsFor(99, [80, 100, 120]), 1);
});

test("starsFor: 2 at exact 2-star threshold (inclusive)", () => {
  assertEq(starsFor(100, [80, 100, 120]), 2);
  assertEq(starsFor(119, [80, 100, 120]), 2);
});

test("starsFor: 3 at exact 3-star threshold (inclusive) and beyond", () => {
  assertEq(starsFor(120, [80, 100, 120]), 3);
  assertEq(starsFor(9999, [80, 100, 120]), 3);
});

test("starsFor: rejects malformed thresholds", () => {
  let threw = false;
  try { starsFor(100, [80, 100]); } catch (_) { threw = true; }
  assert(threw, "expected throw on length-2 thresholds");
  threw = false;
  try { starsFor(100, null); } catch (_) { threw = true; }
  assert(threw, "expected throw on null thresholds");
});

test("starsFor: rejects non-ascending thresholds", () => {
  let threw = false;
  try { starsFor(100, [120, 80, 100]); } catch (_) { threw = true; }
  assert(threw, "expected throw when s1 > s2");
  threw = false;
  try { starsFor(100, [80, 120, 100]); } catch (_) { threw = true; }
  assert(threw, "expected throw when s2 > s3");
  // Equal-adjacent thresholds are accepted (collapses a tier, but isn't a typo).
  assertEq(starsFor(100, [80, 100, 100]), 3);
});

// --- Report -------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
