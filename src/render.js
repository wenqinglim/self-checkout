// DOM rendering. This is the only module that touches the DOM in this slice.
// Pure logic and data must never depend on anything here.

// Draws the bag grid and any placed items into `container`.
// `placements` is an array of { id, itemId, x, y }.
export function renderBag(container, grid, placements, items) {
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
    container.appendChild(itemEl(p, items, /* placedInBag */ true));
  }
}

// Draws the unplaced (tray) items into `container` as a flat list.
// Each tray item keeps its real footprint so the player can read its size.
export function renderTray(container, trayPlacements, items) {
  container.innerHTML = "";
  container.classList.add("tray");
  for (const p of trayPlacements) {
    container.appendChild(itemEl(p, items, /* placedInBag */ false));
  }
}

function itemEl(placement, items, placedInBag) {
  const item = items[placement.itemId];
  const el = document.createElement("div");
  el.className = "item";
  el.dataset.itemId = item.id;
  el.dataset.instanceId = placement.id;
  el.style.background = item.color;

  if (placedInBag) {
    el.style.gridColumn = `${placement.x + 1} / span ${item.footprint.w}`;
    el.style.gridRow = `${placement.y + 1} / span ${item.footprint.h}`;
  } else {
    // In the tray we size by footprint using the same cell unit as the bag,
    // so an egg carton in the tray looks the size it will when placed.
    el.style.width = `calc(var(--cell) * ${item.footprint.w})`;
    el.style.height = `calc(var(--cell) * ${item.footprint.h})`;
  }

  const label = document.createElement("div");
  label.className = "item-label";
  label.textContent = item.name;
  el.appendChild(label);

  const weight = document.createElement("div");
  weight.className = "item-weight";
  weight.textContent = `wt ${item.weight}`;
  el.appendChild(weight);

  // Strength is intentionally NOT rendered: the player must infer fragility
  // from the item's identity (plan §2, §5).

  return el;
}
