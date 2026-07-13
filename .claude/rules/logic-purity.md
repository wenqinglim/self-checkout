---
paths:
  - "src/logic.js"
  - "data/*.js"
  - "tests/**/*.js"
---

# Logic purity and data-only files

- `src/logic.js` is pure. No `document`, `window`, timers, or DOM references. Data in, data out.
- No randomness or hidden state in scoring/breakage. The same grid must always yield the same result.
- All tunable constants live in one place (`CARRY_FACTOR`, `TIME_BONUS_MAX`, `TIME_DECAY`, bag dimensions, per-level thresholds). No magic numbers buried in logic.
- `data/items.js` and `data/levels.js` are data only — no behaviour, no logic.
- If a fix seems to require DOM inside logic, the fix is wrong. Move that piece up into `render.js` or `game.js`.
