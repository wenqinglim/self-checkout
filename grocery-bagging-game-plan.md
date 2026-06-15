# Grocery Bagging Game — MVP Build Plan

A plan for Claude Code to build the first playable version. Read this whole document
before writing code. The single most important rule is in **Architecture**: keep game
logic separate from rendering so the game can move to a richer stack later.

---

## 1. Concept in one paragraph

A 2D, top-of-the-checkout puzzle. The player sees all of their groceries up front and
must arrange them into a fixed-width bag (a grid) so that, when the bag is carried,
fragile items aren't crushed by heavier ones stacked on top of them. There is **no
physics** — breakage is decided by a deterministic rule. The player is racing a clock:
finishing faster scores higher. The whole MVP exists to answer one question: *is
arranging-for-fragility-under-time actually fun?* Prioritise getting one level fully
playable end to end over breadth.

---

## 2. Locked design decisions

- **Rule-based**, not physics (a hybrid may come later — do not build physics now).
- **All items visible upfront, always.** No item-at-a-time mode.
- **2D side view**, grid-based.
- **Side-by-side placement on a grid** (not a single column). Items occupy whole cells.
- **Fixed bag width**; bad packing can overflow (a light fit challenge is intended).
- **Weight is shown** to the player; **strength is hidden** (players infer fragility
  from the item's identity).
- **Unlimited retries**; the clock keeps running across retries.
- **Graded scoring** (points for surviving items), plus a time bonus.
- **Timed**: score includes a time bonus that decays as the clock runs.
- Target **desktop browser first** (mouse drag). Mobile/touch is later.

---

## 3. Tech & architecture (non-negotiable)

Plain **HTML / CSS / vanilla JavaScript**. No framework for the MVP.

**Separate logic from rendering, and keep content as data.** This is what makes a
future move to a JS game framework (e.g. Phaser) or a wrapper (e.g. Capacitor) cheap.
Suggested file layout:

```
index.html        – page structure
style.css         – layout and visuals
data/items.js     – item definitions (DATA ONLY, no behaviour)
data/levels.js    – level definitions (DATA ONLY)
src/logic.js      – PURE game logic. NO references to the DOM, window, or document.
src/render.js     – all DOM drawing + drag handling (the only engine-specific layer)
src/game.js       – game state + controller; wires logic.js to render.js
```

**Hard rule:** `src/logic.js` must not touch the DOM. It takes plain data in (grid
state, item list) and returns plain data out (loads, which items broke, score). This is
the "brain" and must be portable on its own.

---

## 4. The bag (grid)

- A grid `W` cells wide by `H` cells tall. Start with **W = 4**, `H` set per level
  (e.g. 6–8). Expose both as level parameters.
- Cell (0,0) is the **top-left**; row index increases downward; the bottom row is the
  bag floor.
- Items occupy a rectangular block of whole cells (their footprint).
- An item may be placed only if every cell of its footprint is inside the grid and
  unoccupied. Anything that won't fit stays in the tray (**overflow**) and scores 0.

---

## 5. Items

Each item is data with: `name`, `footprint` (width × height in cells), `weight`
(shown), `strength` (hidden — max weight-on-top before it breaks), `value` (points if
it survives), and a `tag`/look that telegraphs fragility.

Starting roster (all numbers are **tuning starting points** — expect to adjust during
playtest):

| Item            | Footprint (w×h) | Weight | Strength (hidden) | Value | Role |
|-----------------|-----------------|--------|-------------------|-------|------|
| Watermelon      | 2×2             | 10     | 60                | 30    | Heavy, tough foundation |
| Canned goods    | 1×1             | 8      | 45                | 10    | Heavy, tough |
| 2L soda bottle  | 1×2             | 9      | 30                | 15    | Tall, heavy, fairly tough |
| Cereal box      | 2×1             | 4      | 14                | 12    | Wide, mid strength |
| Bread           | 2×1             | 2      | 5                 | 20    | Wide, easily crushed |
| Eggs            | 2×1             | 2      | 3                 | 35    | Light, very fragile, costly to lose |
| Chips           | 1×1             | 1      | 2                 | 8     | Lightest, instantly crushed |
| Glass jar (sauce)| 1×1            | 7      | 12                | 25    | **Heavy AND fragile — the troublemaker** |

Because strength is hidden, each item's name and visual must make its fragility
guessable (everyone knows eggs are fragile and cans aren't). MVP visuals can be labelled
coloured rectangles sized to the footprint — but the label/colour should read clearly.

**No item rotation** in the MVP (footprints are fixed). Note this; it's a deliberate
simplification.

---

## 6. Placement & interaction

- Items start in a **checkout tray** beside the bag.
- The player **drags** an item from the tray (or from elsewhere in the bag) into the
  bag. On drop it **snaps to the grid** and **settles downward**: it falls until its
  bottom edge rests on the highest occupied surface within its column span, or on the
  floor.
- A placement is rejected (item returns to where it came from) if it would leave the
  grid, overflow the width, or overlap an occupied cell.
- **Removability lock:** an item cannot be dragged out or repositioned if **any cell
  directly above its footprint is occupied**. The player must clear the items on top
  first. (On a grid this is a simple cell check.)
- The player rearranges freely. The clock is running the whole time.

---

## 7. Breakage model (the core algorithm — verify this first)

Deterministic, grid-based, no physics. Conceptually: weight presses straight down
through grid columns; a wide item collects the load from every column above it, adds its
own weight, and passes the total down split evenly across the columns it spans.

```
CARRY_FACTOR = 1.5   // master difficulty knob; carrying jostles the load

function evaluate(grid):
    loadInColumn = array of W zeros          // weight currently pressing down each column
    damaged = empty set

    for row from TOP to BOTTOM:
        for each item whose TOP edge is in this row (process each item once, at its top):
            span = the columns the item occupies
            loadFromAbove = sum(loadInColumn[c] for c in span)

            if loadFromAbove * CARRY_FACTOR > item.strength:
                add item to damaged

            // redistribute total load to the columns below this item
            passDown = (loadFromAbove + item.weight) / len(span)
            for c in span:
                loadInColumn[c] = passDown   // replaces the column's load below the item

    return damaged
```

Notes / known simplifications (fine for MVP):

- An item acts as a rigid redistributor: it gathers all load above it and spreads the
  total evenly to the columns below. This gives intuitive results — heavy-on-top
  crushes, and spreading items out across the width protects them.
- If a wide item bridges a gap (an empty cell beneath part of it), the column sweep
  simply carries that column's load straight down to the next item or the floor. Good
  enough; no tilting.
- **Validate the math headless** against two or three hand-worked stacks (e.g. eggs
  under a watermelon → broken; eggs on top of everything → safe) **before** building any
  UI. This is the riskiest logic; de-risk it first.

---

## 8. Carry phase, scoring & timer

- A **Carry** button runs `evaluate(grid)`, highlights the damaged items, and shows the
  score. No animation in the MVP — a result state is enough.
- **Survival score** = sum of `value` for every item that is **in the bag and not
  damaged**. Overflowed (untbagged) items contribute 0.
- **Time bonus** = `max(0, TIME_BONUS_MAX - TIME_DECAY * secondsElapsed)`. Model it as a
  decaying bonus, not a subtracted penalty (rewards speed instead of punishing thought).
  Start `TIME_BONUS_MAX = 100`, `TIME_DECAY` tuned per level.
- **Final score** = survival score + time bonus.
- **Clock** starts on the player's **first drag** of the level (not on load, so reading
  the board is free) and runs continuously. It does **not reset on retries** — that is
  what makes time the real cost of unlimited do-overs.
- **Win condition:** a level is complete the moment a Carry produces `final score ≥
  level threshold`. On reaching it, **auto-complete** the level. (Letting players keep
  optimising for a higher score can come later.)

Expose `CARRY_FACTOR`, `TIME_BONUS_MAX`, `TIME_DECAY`, bag `W`/`H`, and the per-level
threshold as easily editable constants — they are the tuning surface.

---

## 9. Levels (4–5, hand-authored)

Each level is data: item set, bag `W`/`H`, score `threshold`, and time tuning. Suggested
arc:

1. **Tutorial** — a few cleanly-sortable items, roomy bag, generous threshold. Teaches
   drag, settle, removability, and Carry. No glass jar.
2. **Width & wide items** — introduces cereal/bread (2×1) so the player learns to spread
   load across columns, not just stack.
3. **Protect the fragile one** — more items, a tighter bag, eggs that must end up
   shielded. Threshold requires saving them.
4. **The glass-jar bind** — include the glass jar. It is too heavy to sit on light items
   yet too weak to bear much, so there is **no zero-damage solution**. Set the threshold
   so the player wins by sacrificing the cheapest item — this is the level that shows off
   graded scoring. Pass/fail scoring would feel broken here; that's the point.
5. *(Optional)* **Everything** — full roster, tight space, tighter time.

---

## 10. Out of scope for the MVP (do not build these)

- No physics; no continuous/free-form placement (grid only).
- No item rotation.
- No item-at-a-time mode.
- No leaks, temperature, rolling, or squish-vs-shatter distinction — damage is binary
  (intact / broken).
- No sound; no elaborate art (labelled coloured rectangles are fine).
- No accounts or saved progress beyond in-memory level state.
- No mobile/touch tuning yet — desktop mouse first.

Keep the build inside this fence. Unscoped additions are the main way a project like this
sprawls.

---

## 11. Suggested build order (incremental, testable)

1. **Data + pure logic.** Write `data/items.js`, `data/levels.js`, and `src/logic.js`
   (load/breakage, scoring, placement validity, removability). Test it with a few
   console assertions on hand-worked grids. No UI yet.
2. **Static render.** Draw the bag grid, the tray, and items from a hardcoded
   arrangement. No interaction.
3. **Drag & place.** Drag-and-drop with grid snap, settle, overflow/occupancy rejection,
   and the removability lock.
4. **Carry & score.** Carry button → evaluate → highlight breaks → show survival score.
5. **Timer.** Decaying time bonus, final score, win threshold, auto-complete.
6. **Progression & polish.** Load the next level on completion; minimal UI tidy-up.
7. **Tune the levels.** Adjust stats, thresholds, and time decay by playing them.

Get **one level fully playable end to end** before adding the others.

---

## 12. Open tuning questions (resolve by playtesting, not now)

- Are the strength/value numbers fun, or do levels feel arbitrary? Adjust freely.
- Is hidden strength too hard? If players can't reason about fragility, reveal strength
  (or add a clearer visual cue) — this was flagged as a "revisit if needed" decision.
- Is `CARRY_FACTOR = 1.5` the right amount of pressure?
- Does the time bonus create good urgency without overshadowing the packing puzzle?
