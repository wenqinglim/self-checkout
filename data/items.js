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
//   tag       — short shorthand the player can read on the rectangle

export const ITEMS = {
  watermelon: {
    id: "watermelon",
    name: "Watermelon",
    footprint: { w: 2, h: 2 },
    weight: 10,
    strength: 60,
    value: 30,
    color: "#2e7d32",
    tag: "WMLN",
  },
  canned: {
    id: "canned",
    name: "Canned goods",
    footprint: { w: 1, h: 1 },
    weight: 8,
    strength: 45,
    value: 10,
    color: "#607d8b",
    tag: "CAN",
  },
  soda: {
    id: "soda",
    name: "2L soda",
    footprint: { w: 1, h: 2 },
    weight: 9,
    strength: 30,
    value: 15,
    color: "#1565c0",
    tag: "SODA",
  },
  cereal: {
    id: "cereal",
    name: "Cereal box",
    footprint: { w: 2, h: 1 },
    weight: 4,
    strength: 14,
    value: 12,
    color: "#ef6c00",
    tag: "CER",
  },
  bread: {
    id: "bread",
    name: "Bread",
    footprint: { w: 2, h: 1 },
    weight: 2,
    strength: 5,
    value: 20,
    color: "#c69c6d",
    tag: "BRD",
  },
  eggs: {
    id: "eggs",
    name: "Eggs",
    footprint: { w: 2, h: 1 },
    weight: 2,
    strength: 3,
    value: 35,
    color: "#fbc02d",
    tag: "EGGS",
  },
  chips: {
    id: "chips",
    name: "Chips",
    footprint: { w: 1, h: 1 },
    weight: 1,
    strength: 2,
    value: 8,
    color: "#e53935",
    tag: "CHP",
  },
  jar: {
    id: "jar",
    name: "Glass jar",
    footprint: { w: 1, h: 1 },
    weight: 7,
    strength: 12,
    value: 25,
    color: "#8e63b5",
    tag: "JAR",
  },
};
