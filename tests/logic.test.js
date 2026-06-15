// Headless tests for src/logic.js. Run with: node tests/logic.test.js
//
// No test framework. Each assertion either passes silently or throws; the
// runner at the bottom prints PASS/FAIL counts and exits non-zero on failure.

import {
  CARRY_FACTOR,
  canPlace,
  isRemovable,
  evaluateBreakage,
  survivalScore,
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
  const grid = { W: 2, H: 3 };
  const placements = [
    { id: "w1", itemId: "watermelon", x: 0, y: 0 },
    { id: "e1", itemId: "eggs", x: 0, y: 2 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["w1"], 0, "watermelon sees no load above it");
  // watermelon weight 10 spread over 2 cols => 5 per col. Eggs span both => 10.
  assertEq(loads["e1"], 10, "eggs see summed load 10");
  assertSetEq(damagedIds, ["e1"], "only eggs broken");
});

test("eggs ON TOP of a watermelon: nothing is damaged", () => {
  const grid = { W: 2, H: 3 };
  const placements = [
    { id: "e1", itemId: "eggs", x: 0, y: 0 },
    { id: "w1", itemId: "watermelon", x: 0, y: 1 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["e1"], 0);
  // eggs weight 2 spread over 2 cols => 1 per col. Watermelon span 2 => 2.
  assertEq(loads["w1"], 2);
  assertSetEq(damagedIds, [], "no damage");
});

test("cereal box (w=2) on two 1x1 items: each sees load 2", () => {
  const grid = { W: 2, H: 2 };
  const placements = [
    { id: "cer", itemId: "cereal", x: 0, y: 0 },
    { id: "left", itemId: "canned", x: 0, y: 1 },
    { id: "right", itemId: "canned", x: 1, y: 1 },
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

test("a heavy column crushes chips at the bottom (no spreading)", () => {
  // Two cans stacked over chips in a single column.
  const grid = { W: 1, H: 3 };
  const placements = [
    { id: "c1", itemId: "canned", x: 0, y: 0 },
    { id: "c2", itemId: "canned", x: 0, y: 1 },
    { id: "ch", itemId: "chips", x: 0, y: 2 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["c1"], 0);
  assertEq(loads["c2"], 8); // top can passes its 8 down
  assertEq(loads["ch"], 16); // 8 + 8 of the two cans
  // 16 * 1.5 = 24 >> 2 strength of chips.
  assertSetEq(damagedIds, ["ch"]);
});

test("watermelon two rows above eggs: load carries through the gap", () => {
  const grid = { W: 2, H: 4 };
  // Watermelon at rows 0–1; eggs at row 3; row 2 empty across both cols.
  const placements = [
    { id: "w1", itemId: "watermelon", x: 0, y: 0 },
    { id: "e1", itemId: "eggs", x: 0, y: 3 },
  ];
  const { damagedIds, loads } = evaluateBreakage(grid, placements, ITEMS);
  // Watermelon still passes 5/col; eggs still see 10 total despite the gap.
  assertEq(loads["e1"], 10);
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

test("glass jar on chips: chips break under jar's 7 weight", () => {
  // Jar weight 7 sits on chips strength 2 => 7 * 1.5 = 10.5 > 2.
  const grid = { W: 1, H: 2 };
  const placements = [
    { id: "j", itemId: "jar", x: 0, y: 0 },
    { id: "ch", itemId: "chips", x: 0, y: 1 },
  ];
  const { damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  assertSetEq(damagedIds, ["ch"]);
});

test("cereal bridging a gap: one col carries load past the empty cell", () => {
  // Cereal 2x1 at (0,0), a single can at (0,1). Col 1 below cereal is empty
  // all the way to the floor. The can in col 0 sees 2.
  const grid = { W: 2, H: 3 };
  const placements = [
    { id: "cer", itemId: "cereal", x: 0, y: 0 },
    { id: "c1", itemId: "canned", x: 0, y: 1 },
  ];
  const { loads, damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  assertEq(loads["c1"], 2);
  assertSetEq(damagedIds, []);
});

test("fractional passDown: bread under a jar splits 9/2 = 4.5 per col", () => {
  // Jar weight 7 sits on bread (2x1, weight 2). Bread sees loadFromAbove
  // 7 + 0 = 7 (and breaks: 7*1.5 = 10.5 > 5 strength), then passes
  // (7 + 2) / 2 = 4.5 down each column. A 1x1 can under the right column
  // therefore sees exactly 4.5.
  const grid = { W: 2, H: 3 };
  const placements = [
    { id: "j",   itemId: "jar",    x: 0, y: 0 },
    { id: "br",  itemId: "bread",  x: 0, y: 1 },
    { id: "can", itemId: "canned", x: 1, y: 2 },
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
    { id: "ch", itemId: "chips", x: 0, y: 1 },
  ];
  const { loads, damagedIds } = evaluateBreakage(grid, placements, ITEMS);
  // Chips at (0,1) sees the can above it only.
  assertEq(loads["ch"], 8);
  assertSetEq(damagedIds, ["ch"]);
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
  // Watermelon is 2x2; (3, 0) would overflow column 4.
  assert(
    !canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 3, y: 0 }),
    "right edge overflow",
  );
  assert(
    !canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: 0, y: 5 }),
    "bottom edge overflow",
  );
  assert(
    !canPlace(grid, [], ITEMS, { id: "x", itemId: "watermelon", x: -1, y: 0 }),
    "negative x",
  );
});

test("canPlace: rejects overlap with existing items", () => {
  const grid = { W: 4, H: 6 };
  const existing = [{ id: "w1", itemId: "watermelon", x: 0, y: 0 }];
  assert(
    !canPlace(grid, existing, ITEMS, {
      id: "c1", itemId: "canned", x: 1, y: 1,
    }),
    "overlaps watermelon's bottom-right cell",
  );
  assert(
    canPlace(grid, existing, ITEMS, {
      id: "c1", itemId: "canned", x: 2, y: 0,
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

// --- Report -------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
