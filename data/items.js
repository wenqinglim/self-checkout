// Item roster. Data only — no behaviour.
//
// Fields:
//   id        — stable key used by placements and levels
//   name      — display label
//   footprint — {w, h} in whole cells; no rotation in the MVP
//   weight    — shown to the player; presses down through columns
//   strength  — HIDDEN; max loadFromAbove*CARRY_FACTOR before the item breaks
//   value     — points awarded if the item survives the carry
//   color     — placeholder visual; readable rectangles for the MVP
//   emoji     — single glyph rendered centered on the rectangle as the
//               in-cell label; sized proportional to footprint by render.js
//
// The grid unit was halved in `feature/halve-grid-resolution`: a 1x1 cell is
// now the size of a small can. Larger items are sized in multiples of that.
// `weight`/`strength`/`value` were left intact where they still made sense
// post-resize, and only nudged where the new footprint changed the item's
// physical character (e.g. a 1L jar getting taller didn't change its mass).

export const ITEMS = {
  watermelon: {
    id: "watermelon",
    name: "Watermelon",
    footprint: { w: 3, h: 3 },
    weight: 10,
    strength: 60,
    value: 30,
    color: "#2e7d32",
    emoji: "🍉",
  },
  canned: {
    id: "canned",
    name: "Canned goods",
    footprint: { w: 1, h: 1 },
    weight: 8,
    strength: 45,
    value: 10,
    color: "#607d8b",
    emoji: "🥫",
  },
  soda: {
    id: "soda",
    name: "2L soda",
    footprint: { w: 1, h: 3 },
    weight: 9,
    strength: 30,
    value: 15,
    color: "#1565c0",
    emoji: "🥤",
  },
  cereal: {
    id: "cereal",
    name: "Cereal box",
    footprint: { w: 2, h: 2 },
    weight: 4,
    strength: 14,
    value: 12,
    color: "#ef6c00",
    emoji: "🥣",
  },
  bread: {
    id: "bread",
    name: "Bread",
    footprint: { w: 2, h: 1 },
    weight: 2,
    strength: 5,
    value: 20,
    color: "#c69c6d",
    emoji: "🍞",
  },
  eggs: {
    id: "eggs",
    name: "Eggs",
    footprint: { w: 2, h: 1 },
    weight: 2,
    strength: 3,
    value: 35,
    color: "#fbc02d",
    emoji: "🥚",
  },
  chips: {
    id: "chips",
    name: "Chips",
    footprint: { w: 2, h: 2 },
    weight: 1,
    strength: 2,
    value: 8,
    color: "#e53935",
    emoji: "🍟",
  },
  jar: {
    id: "jar",
    name: "Glass jar",
    footprint: { w: 1, h: 2 },
    weight: 7,
    strength: 12,
    value: 25,
    color: "#8e63b5",
    emoji: "🫙",
  },
  strawberries: {
    id: "strawberries",
    name: "Strawberries",
    footprint: { w: 1, h: 1 },
    weight: 2,
    strength: 4,
    value: 22,
    color: "#e91e63",
    emoji: "🍓",
  },
  bananas: {
    id: "bananas",
    name: "Bananas",
    footprint: { w: 2, h: 1 },
    weight: 2,
    strength: 6,
    value: 18,
    color: "#fdd835",
    emoji: "🍌",
  },
  greens: {
    id: "greens",
    name: "Bag of greens",
    footprint: { w: 2, h: 2 },
    weight: 1,
    strength: 4,
    value: 15,
    color: "#7cb342",
    emoji: "🥬",
  },
  potatoes: {
    id: "potatoes",
    name: "Potatoes",
    footprint: { w: 2, h: 2 },
    weight: 8,
    strength: 50,
    value: 18,
    color: "#8d6e63",
    emoji: "🥔",
  },
  onions: {
    id: "onions",
    name: "Onions",
    footprint: { w: 1, h: 1 },
    weight: 4,
    strength: 30,
    value: 12,
    color: "#bf8f5a",
    emoji: "🧅",
  },
  carrots: {
    id: "carrots",
    name: "Carrots",
    footprint: { w: 3, h: 1 },
    weight: 3,
    strength: 20,
    value: 14,
    color: "#fb8c00",
    emoji: "🥕",
  },

  // --- Odd-aspect-ratio items unlocked by the finer grid ------------------

  // Baguette: 4x1, very long and very fragile. Forces the player to find a
  // protected top-row stripe of width 4 — usually only available on wider bags.
  baguette: {
    id: "baguette",
    name: "Baguette",
    footprint: { w: 4, h: 1 },
    weight: 2,
    strength: 4,
    value: 16,
    color: "#d2a35c",
    emoji: "🥖",
  },

  // Wine: 1x3, narrow and tall. Has real heft but mid-fragile — it can hold
  // light items above but loses to a heavy stack. The thin column makes it
  // awkward to anchor without wasting neighbouring cells.
  wine: {
    id: "wine",
    name: "Wine bottle",
    footprint: { w: 1, h: 3 },
    weight: 6,
    strength: 10,
    value: 30,
    color: "#7a1f3d",
    emoji: "🍷",
  },

  // Pizza: 3x3, a big flat box. Surprisingly fragile — strength 6 means a
  // single can over ANY one of its three columns puts load 8 on the pizza
  // (loads sum across spanned columns) and 8 × 1.5 = 12 > 6 breaks it.
  // Belongs near the top of any pack that includes it.
  pizza: {
    id: "pizza",
    name: "Pizza box",
    footprint: { w: 3, h: 3 },
    weight: 3,
    strength: 6,
    value: 28,
    color: "#c83e3e",
    emoji: "🍕",
  },

  // Flour: 2x2 rigid bag of flour. Bulky, mid-weight, and tough — a reasonable
  // mid-layer anchor that occupies real volume without crushing what's below.
  flour: {
    id: "flour",
    name: "Bag of flour",
    footprint: { w: 2, h: 2 },
    weight: 6,
    strength: 25,
    value: 14,
    color: "#efe7d4",
    emoji: "🌾",
  },
};
