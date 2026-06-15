// Pure game logic. NO references to document, window, or the DOM.
// Plain data in, plain data out. This module is the portable "brain"
// and must run unchanged under Node for headless tests.

// Master difficulty knob. Carrying jostles the load, so the effective
// load on any item is its loadFromAbove multiplied by this factor.
export const CARRY_FACTOR = 1.5;

// ---------- Placements & occupancy ------------------------------------------

// A placement is { id, itemId, x, y } where (x, y) is the top-left cell of
// the item's footprint in grid coords. (0, 0) is top-left; y increases down.

function footprintOf(placement, items) {
  const item = items[placement.itemId];
  return { w: item.footprint.w, h: item.footprint.h };
}

function cellsOf(placement, items) {
  const { w, h } = footprintOf(placement, items);
  const cells = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      cells.push([placement.x + dx, placement.y + dy]);
    }
  }
  return cells;
}

function occupiedKeys(placements, items, excludeId = null) {
  const set = new Set();
  for (const p of placements) {
    if (excludeId !== null && p.id === excludeId) continue;
    for (const [cx, cy] of cellsOf(p, items)) set.add(`${cx},${cy}`);
  }
  return set;
}

// ---------- Placement validity ----------------------------------------------

// Returns true iff `candidate` (a placement) fits entirely inside the grid
// and does not overlap any existing placement.
export function canPlace(grid, placements, items, candidate) {
  const { w, h } = footprintOf(candidate, items);
  if (candidate.x < 0 || candidate.y < 0) return false;
  if (candidate.x + w > grid.W) return false;
  if (candidate.y + h > grid.H) return false;

  const occupied = occupiedKeys(placements, items, candidate.id);
  for (const [cx, cy] of cellsOf(candidate, items)) {
    if (occupied.has(`${cx},${cy}`)) return false;
  }
  return true;
}

// ---------- Removability lock -----------------------------------------------

// An item is "locked" — i.e. not removable — if any cell directly above its
// top edge is occupied by another item. Items on the top row are always
// removable.
export function isRemovable(placement, placements, items) {
  if (placement.y === 0) return true;
  const { w } = footprintOf(placement, items);
  const occupied = occupiedKeys(placements, items, placement.id);
  const aboveRow = placement.y - 1;
  for (let dx = 0; dx < w; dx++) {
    if (occupied.has(`${placement.x + dx},${aboveRow}`)) return false;
  }
  return true;
}

// ---------- Breakage evaluation (the core algorithm) ------------------------

// Deterministic, grid-based, no physics. Conceptually: weight presses straight
// down through grid columns. When an item is encountered (processed at its
// TOP row), it gathers the total load from every column it spans (loadFromAbove
// is the SUM, since a wide item is bearing the load of each column under it),
// then redistributes (loadFromAbove + own weight) EVENLY across its columns
// going down. The break test compares loadFromAbove * CARRY_FACTOR against
// the item's strength — its own weight does not crush itself.
//
// Returns { damagedIds: Set<id>, loads: { [placementId]: loadFromAbove } }.
// The `loads` map is exposed for tests and any future UI hint.
export function evaluateBreakage(grid, placements, items) {
  const W = grid.W;
  const loadInColumn = new Array(W).fill(0);
  const damagedIds = new Set();
  const loads = {};

  // Process by top row first (shallowest first). Within a row, order is
  // irrelevant because the no-overlap rule means same-row items share no
  // columns; sorting by x is purely for determinism.
  const ordered = [...placements].sort((a, b) => a.y - b.y || a.x - b.x);

  for (const p of ordered) {
    const item = items[p.itemId];
    const w = item.footprint.w;

    let loadFromAbove = 0;
    for (let i = 0; i < w; i++) loadFromAbove += loadInColumn[p.x + i];
    loads[p.id] = loadFromAbove;

    if (loadFromAbove * CARRY_FACTOR > item.strength) {
      damagedIds.add(p.id);
    }

    const passDown = (loadFromAbove + item.weight) / w;
    for (let i = 0; i < w; i++) loadInColumn[p.x + i] = passDown;
  }

  return { damagedIds, loads };
}

// ---------- Scoring ---------------------------------------------------------

// Survival score: sum of `value` for every placement in the bag whose id is
// NOT in damagedIds. Items left in the tray (not passed in here) score 0 by
// virtue of being absent.
export function survivalScore(placements, damagedIds, items) {
  let total = 0;
  for (const p of placements) {
    if (!damagedIds.has(p.id)) total += items[p.itemId].value;
  }
  return total;
}
