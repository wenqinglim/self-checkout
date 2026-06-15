// Bootstrap for the static-render slice. No interactivity yet.
//
// This module wires data → render. When drag-and-drop arrives it will own
// the mutable game state and call logic.js to evaluate carries.

import { ITEMS } from "../data/items.js";
import { renderBag, renderTray } from "./render.js";

// A hand-picked arrangement that exercises all the item shapes: a 2x2 base,
// 1x1 and 2x1 floors, a 1x2 tall bottle, and a wide cereal up top. The bag
// is the tutorial 4x6 from data/levels.js.
const GRID = { W: 4, H: 6 };

const PLACED = [
  { id: "p-watermelon", itemId: "watermelon", x: 0, y: 4 },
  { id: "p-canned-a",   itemId: "canned",     x: 2, y: 5 },
  { id: "p-canned-b",   itemId: "canned",     x: 3, y: 5 },
  { id: "p-bread",      itemId: "bread",      x: 2, y: 4 },
  { id: "p-eggs",       itemId: "eggs",       x: 0, y: 3 },
  { id: "p-chips",      itemId: "chips",      x: 2, y: 3 },
  { id: "p-soda",       itemId: "soda",       x: 3, y: 2 },
  { id: "p-cereal",     itemId: "cereal",     x: 0, y: 2 },
];

const TRAY = [
  { id: "t-jar",     itemId: "jar"   },
  { id: "t-chips-2", itemId: "chips" },
];

renderBag(document.getElementById("bag"), GRID, PLACED, ITEMS);
renderTray(document.getElementById("tray"), TRAY, ITEMS);
