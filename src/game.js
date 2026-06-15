// Game state and controller. Owns the mutable game state; delegates all DOM
// work to render.js and all rules to logic.js (which never touches the DOM).

import { ITEMS } from "../data/items.js";
import { LEVELS } from "../data/levels.js";
import {
  evaluateBreakage,
  isRemovable,
  settle,
  survivalScore,
} from "./logic.js";
import { renderBag, renderTray } from "./render.js";

const LEVEL = LEVELS[0];

// Seed mutable state from level data. Tray items each get a unique instance id
// so we can refer to them across re-renders even when the same item type
// appears more than once.
const state = {
  grid: LEVEL.bag,
  bag: [],
  tray: LEVEL.tray.map((itemId, i) => ({ id: `t${i}-${itemId}`, itemId })),
  // Populated by Carry, cleared on any subsequent placement edit. Holding it
  // in state (rather than recomputing on every render) is what lets the
  // damaged highlight persist after Carry until the player moves something.
  carryResult: null, // { damagedIds: Set, score: number } | null
};

const bagEl = document.getElementById("bag");
const trayEl = document.getElementById("tray");
const carryBtn = document.getElementById("carry-btn");
const resultEl = document.getElementById("result");
const resultScoreEl = document.getElementById("result-score-value");
const resultBreakdownEl = document.getElementById("result-breakdown");

function render() {
  renderBag(bagEl, state.grid, state.bag, ITEMS, {
    onDrop: handleDropOnBag,
    isRemovable: (p) => isRemovable(p, state.bag, ITEMS),
    damagedIds: state.carryResult?.damagedIds,
  });
  renderTray(trayEl, state.tray, ITEMS, { onDrop: handleDropOnTray });
  renderResult();
}

function renderResult() {
  if (!state.carryResult) {
    resultEl.hidden = true;
    resultBreakdownEl.textContent = "";
    return;
  }
  const { damagedIds, score } = state.carryResult;
  resultEl.hidden = false;
  resultScoreEl.textContent = String(score);
  const intact = state.bag.length - damagedIds.size;
  const overflow = state.tray.length;
  const parts = [`${intact} intact`, `${damagedIds.size} broken`];
  if (overflow > 0) parts.push(`${overflow} left in tray`);
  resultBreakdownEl.textContent = parts.join(" · ");
}

// Any change to the bag invalidates the Carry result; clear it so stale
// damage highlights don't linger over a different arrangement.
function invalidateCarryResult() {
  state.carryResult = null;
}

// Look up an item by instance id in either pool. Returns { item, source }
// where source is "bag" or "tray".
function findInstance(instanceId) {
  const inBag = state.bag.find((p) => p.id === instanceId);
  if (inBag) return { item: inBag, source: "bag" };
  const inTray = state.tray.find((p) => p.id === instanceId);
  if (inTray) return { item: inTray, source: "tray" };
  return null;
}

function handleDropOnBag(instanceId, dropX) {
  const found = findInstance(instanceId);
  if (!found) return;
  const { item, source } = found;

  // Items inside the bag must be removable before they can be repositioned.
  if (source === "bag" && !isRemovable(item, state.bag, ITEMS)) return;

  // Clamp the drop column so a wide item released near the right edge
  // snaps flush right instead of being silently rejected by settle.
  const w = ITEMS[item.itemId].footprint.w;
  const clampedX = Math.max(0, Math.min(state.grid.W - w, dropX));

  // settle excludes the candidate's own cells by id, so a bag→bag reposition
  // can pass state.bag through unchanged. It is the sole authority on legal
  // placement — if it returns a result, the result is in-bounds and
  // overlap-free by construction.
  const candidate = { id: item.id, itemId: item.itemId, x: clampedX };
  const settled = settle(state.grid, state.bag, ITEMS, candidate);
  if (!settled) return; // no vertical room — silent reject.

  if (source === "tray") {
    state.tray = state.tray.filter((p) => p.id !== item.id);
    state.bag.push(settled);
  } else {
    const idx = state.bag.findIndex((p) => p.id === item.id);
    state.bag[idx] = settled;
  }
  invalidateCarryResult();
  render();
}

function handleDropOnTray(instanceId) {
  const found = findInstance(instanceId);
  if (!found || found.source !== "bag") return;
  if (!isRemovable(found.item, state.bag, ITEMS)) return;

  state.bag = state.bag.filter((p) => p.id !== instanceId);
  state.tray.push({ id: instanceId, itemId: found.item.itemId });
  invalidateCarryResult();
  render();
}

function handleCarry() {
  const { damagedIds } = evaluateBreakage(state.grid, state.bag, ITEMS);
  const score = survivalScore(state.bag, damagedIds, ITEMS);
  state.carryResult = { damagedIds, score };
  render();
}

carryBtn.addEventListener("click", handleCarry);

render();
