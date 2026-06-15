// Game state and controller. Owns the mutable game state; delegates all DOM
// work to render.js and all rules to logic.js (which never touches the DOM).

import { ITEMS } from "../data/items.js";
import { LEVELS } from "../data/levels.js";
import { settle, canPlace, isRemovable } from "./logic.js";
import { renderBag, renderTray } from "./render.js";

const LEVEL = LEVELS[0];

// Seed mutable state from level data. Tray items each get a unique instance id
// so we can refer to them across re-renders even when the same item type
// appears more than once.
const state = {
  grid: LEVEL.bag,
  bag: [],
  tray: LEVEL.tray.map((itemId, i) => ({ id: `t${i}-${itemId}`, itemId })),
};

const bagEl = document.getElementById("bag");
const trayEl = document.getElementById("tray");

function render() {
  renderBag(bagEl, state.grid, state.bag, ITEMS, {
    onDrop: handleDropOnBag,
    isRemovable: (p) => isRemovable(p, state.bag, ITEMS),
  });
  renderTray(trayEl, state.tray, ITEMS, { onDrop: handleDropOnTray });
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

  // Both settle and canPlace exclude the candidate's own cells by id, so a
  // bag→bag reposition can pass state.bag through unchanged.
  const candidate = { id: item.id, itemId: item.itemId, x: dropX };
  const settled = settle(state.grid, state.bag, ITEMS, candidate);
  if (!settled) return; // overflow or no room — silent reject for now.
  if (!canPlace(state.grid, state.bag, ITEMS, settled)) return;

  if (source === "tray") {
    state.tray = state.tray.filter((p) => p.id !== item.id);
    state.bag.push(settled);
  } else {
    const idx = state.bag.findIndex((p) => p.id === item.id);
    state.bag[idx] = settled;
  }
  render();
}

function handleDropOnTray(instanceId) {
  const found = findInstance(instanceId);
  if (!found || found.source !== "bag") return;
  if (!isRemovable(found.item, state.bag, ITEMS)) return;

  state.bag = state.bag.filter((p) => p.id !== instanceId);
  state.tray.push({ id: instanceId, itemId: found.item.itemId });
  render();
}

render();
