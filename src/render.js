// DOM rendering and input. This is the only module that touches the DOM.
// Pure logic and data must never depend on anything here.

// Draws the bag grid and any placed items into `container`. Wires the
// container as a drop target; calls callbacks.onDrop(instanceId, dropX)
// when an item is dropped on the bag. `callbacks.isRemovable(placement)`
// is asked to decide if a bag item is draggable.
export function renderBag(container, grid, placements, items, callbacks = {}) {
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
    }));
  }

  wireDropTarget(container, (e) => {
    const instanceId = e.dataTransfer.getData("text/instance-id");
    if (!instanceId) return;
    const dropX = columnFromEvent(container, grid, e);
    callbacks.onDrop?.(instanceId, dropX);
  });
}

// Draws the unplaced (tray) items into `container` as a flat list.
// Each tray item keeps its real footprint so the player can read its size.
export function renderTray(container, trayPlacements, items, callbacks = {}) {
  container.innerHTML = "";
  container.classList.add("tray");
  for (const p of trayPlacements) {
    container.appendChild(itemEl(p, items, {
      placedInBag: false,
      source: "tray",
      locked: false,
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
      e.dataTransfer.setData("text/source", opts.source);
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
  }

  return el;
}

// Helper: turn a drop event into a bag column. The bag is a CSS grid with
// equal-width columns, so we read the container's width and divide.
function columnFromEvent(container, grid, e) {
  const rect = container.getBoundingClientRect();
  const cellW = rect.width / grid.W;
  const col = Math.floor((e.clientX - rect.left) / cellW);
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
    // container, not when it crosses an inner element.
    if (e.target === container) container.classList.remove("drag-over");
  });
  container.addEventListener("drop", (e) => {
    e.preventDefault();
    container.classList.remove("drag-over");
    onDrop(e);
  });
}
