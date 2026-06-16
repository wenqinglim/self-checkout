// DOM rendering and input. This is the only module that touches the DOM.
// Pure logic and data must never depend on anything here.

// Draws the bag grid and any placed items into `container`. Wires the
// container as a drop target; calls callbacks.onDrop(instanceId, dropX)
// when an item is dropped on the bag. `callbacks.isRemovable(placement)`
// is asked to decide if a bag item is draggable. `callbacks.damagedIds`
// is an optional Set of placement ids to render with the broken-item
// treatment (post-Carry). `callbacks.onDragStart()` fires once per
// dragstart — used by the controller to start the level clock on the
// player's first interaction (plan §8).
export function renderBag(container, grid, placements, items, callbacks = {}) {
  const damagedIds = callbacks.damagedIds ?? new Set();
  container.innerHTML = "";
  container.classList.add("bag");
  container.style.setProperty("--cols", grid.W);
  container.style.setProperty("--rows", grid.H);

  // Empty-cell layer — purely visual, so the grid lines are always visible
  // even where no item sits.
  for (let y = 0; y < grid.H; y++) {
    for (let x = 0; x < grid.W; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.gridColumn = `${x + 1}`;
      cell.style.gridRow = `${y + 1}`;
      container.appendChild(cell);
    }
  }

  for (const p of placements) {
    const locked = callbacks.isRemovable
      ? !callbacks.isRemovable(p)
      : false;
    container.appendChild(itemEl(p, items, {
      placedInBag: true,
      source: "bag",
      locked,
      damaged: damagedIds.has(p.id),
      onDragStart: callbacks.onDragStart,
    }));
  }

  wireDropTarget(container, (e) => {
    const instanceId = e.dataTransfer.getData("text/instance-id");
    if (!instanceId) return;
    const rawCol = columnFromEvent(container, grid, e);
    // Subtract the cursor-offset captured at dragstart so the item drops
    // where the player aimed — i.e. the cursor stays anchored on the same
    // sub-cell of a wide item from grab to release.
    const colOffset = parseInt(
      e.dataTransfer.getData("text/col-offset") || "0", 10,
    );
    callbacks.onDrop?.(instanceId, rawCol - colOffset);
  });
}

// Draws the unplaced (tray) items into `container` as a flat list.
// Each tray item keeps its real footprint so the player can read its size.
// `callbacks.isRemovable(placement)` is optional: tray items are removable
// by default, but the controller uses this hook to lock the tray after the
// level is won.
export function renderTray(container, trayPlacements, items, callbacks = {}) {
  container.innerHTML = "";
  container.classList.add("tray");
  for (const p of trayPlacements) {
    const locked = callbacks.isRemovable
      ? !callbacks.isRemovable(p)
      : false;
    container.appendChild(itemEl(p, items, {
      placedInBag: false,
      source: "tray",
      locked,
      onDragStart: callbacks.onDragStart,
    }));
  }

  wireDropTarget(container, (e) => {
    const instanceId = e.dataTransfer.getData("text/instance-id");
    if (!instanceId) return;
    callbacks.onDrop?.(instanceId);
  });
}

function itemEl(placement, items, opts) {
  const item = items[placement.itemId];
  const el = document.createElement("div");
  el.className = "item";
  if (opts.locked) el.classList.add("locked");
  if (opts.damaged) el.classList.add("damaged");
  el.dataset.itemId = item.id;
  el.dataset.instanceId = placement.id;
  el.style.background = item.color;
  el.title = opts.locked
    ? `${item.name} (clear items above first)`
    : item.name;

  if (opts.placedInBag) {
    el.style.gridColumn = `${placement.x + 1} / span ${item.footprint.w}`;
    el.style.gridRow = `${placement.y + 1} / span ${item.footprint.h}`;
  } else {
    // In the tray we size by footprint using the same cell unit as the bag,
    // so an egg carton in the tray looks the size it will when placed.
    el.style.width = `calc(var(--cell) * ${item.footprint.w})`;
    el.style.height = `calc(var(--cell) * ${item.footprint.h})`;
  }

  // Use the short `tag` in-cell — the full `name` wraps awkwardly on 1×1
  // footprints. The full name is available on the wrapper's `title` attr.
  const label = document.createElement("div");
  label.className = "item-label";
  label.textContent = item.tag;
  el.appendChild(label);

  const weight = document.createElement("div");
  weight.className = "item-weight";
  weight.textContent = `wt ${item.weight}`;
  el.appendChild(weight);

  // Strength is intentionally NOT rendered: the player must infer fragility
  // from the item's identity (plan §2, §5).

  if (!opts.locked) {
    el.draggable = true;
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/instance-id", placement.id);
      // Record where in the item the grab landed (in cell-widths from the
      // left). The drop handler subtracts this so a wide item lands where
      // the player aimed instead of having its left edge under the cursor.
      const r = el.getBoundingClientRect();
      const cellPx = r.width / item.footprint.w;
      const colOffset = Math.max(0, Math.min(
        item.footprint.w - 1,
        Math.floor((e.clientX - r.left) / cellPx),
      ));
      e.dataTransfer.setData("text/col-offset", String(colOffset));
      el.classList.add("dragging");
      opts.onDragStart?.();
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
  }

  return el;
}

// Helper: turn a drop event into a bag column. The bag is a CSS grid with
// equal-width columns, but its borders count toward `rect.width` under
// box-sizing: border-box, so we subtract them before dividing — otherwise
// the rightmost ~4px of every column maps to the wrong index.
function columnFromEvent(container, grid, e) {
  const rect = container.getBoundingClientRect();
  const style = getComputedStyle(container);
  const borderL = parseFloat(style.borderLeftWidth) || 0;
  const borderR = parseFloat(style.borderRightWidth) || 0;
  const inner = rect.width - borderL - borderR;
  const cellW = inner / grid.W;
  const col = Math.floor((e.clientX - rect.left - borderL) / cellW);
  return Math.max(0, Math.min(grid.W - 1, col));
}

function wireDropTarget(container, onDrop) {
  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    container.classList.add("drag-over");
  });
  container.addEventListener("dragleave", (e) => {
    // Only clear the highlight when the pointer actually leaves the
    // container's subtree — `dragleave` also fires when crossing onto an
    // inner element, which would otherwise flicker the highlight off and on.
    if (!container.contains(e.relatedTarget)) {
      container.classList.remove("drag-over");
    }
  });
  container.addEventListener("drop", (e) => {
    e.preventDefault();
    container.classList.remove("drag-over");
    onDrop(e);
  });
}
