# CLAUDE.md

Working instructions for Claude Code on this project. **This file governs *how* to
work. `grocery-bagging-game-plan.md` governs *what* to build** — treat the plan as the
design source of truth and this file as the rules of engagement. If the two ever
conflict, stop and ask.

---

## Project

A 2D grocery-bagging puzzle game for the browser. The player arranges all of their
groceries into a fixed-width grid "bag" so that fragile items aren't crushed when the
bag is carried. Breakage is decided by a deterministic rule (no physics). The game is
timed. Full design, item stats, breakage model, and levels are in
`grocery-bagging-game-plan.md`.

**Stack:** plain HTML, CSS, and vanilla JavaScript. No frameworks, no build step.
Desktop browser first; mobile is later.

---

## Architecture (must follow)

The project is structured so it can later move to a JS game framework or a native
wrapper without a rewrite. Keep these boundaries strict:

- **`src/logic.js` is pure.** No references to `document`, `window`, or the DOM. It
  takes plain data in and returns plain data out. This is the portable "brain."
- **`data/items.js` and `data/levels.js` are data only.** No behaviour, no logic.
- **`src/render.js` is the only DOM/engine-specific layer.** All drawing and input
  handling lives here.
- **`src/game.js`** holds game state and wires logic to render.
- Keep all content (items, levels) as data, never hardcoded inside logic.

```
index.html      data/items.js     src/logic.js   (pure, no DOM)
style.css       data/levels.js    src/render.js  (DOM only)
                                  src/game.js    (state + wiring)
```

---

## Coding practices

- **Vanilla JS, no tooling.** No frameworks, bundlers, or transpilers for the MVP.
- **Use ES modules** for the file separation above. Note that module imports don't work
  over `file://`, so run via a static server (e.g. `python3 -m http.server 8000`) and
  open `http://localhost:8000`. Don't switch to a build tool to work around this.
- **Logic is pure and deterministic.** No randomness or hidden state in scoring/breakage
  — the same grid must always yield the same result.
- **All tunable constants live in one place** (e.g. `CARRY_FACTOR`, `TIME_BONUS_MAX`,
  `TIME_DECAY`, bag dimensions, per-level thresholds). No magic numbers buried in logic.
- **Small, single-purpose functions** with clear, descriptive names.
- **Comment the *why*, not the *what*** — especially for the breakage/load model, where
  the reasoning is non-obvious.
- **Tests guard the logic.** The pure logic has headless assertions (see plan §7). When
  you change breakage, scoring, placement, or removability behaviour, update the tests
  in the same change. Never alter core behaviour without an accompanying test.
- **State is in-memory.** No `localStorage` or other browser storage in the MVP.
- **Fail loudly in development.** Prefer assertions/throws over silent fallbacks so bugs
  surface early.

---

## Testing & verification

Before opening any PR:

1. Run the logic test file and confirm every assertion passes; include the output in the
   PR description.
2. Manually confirm the app still loads and runs (served over http, not `file://`).
3. Confirm the change didn't cross an architecture boundary (no DOM in `logic.js`, no
   logic in `data/`).

---

## Scope discipline

- **Stay inside the MVP fence** (plan §10). Do not add physics, item rotation, sound,
  persistence, mobile/touch tuning, or any unlisted feature.
- **Do only the task that was asked.** If a task seems to need something outside its
  scope, stop and ask rather than expanding it yourself.
- **Surface ambiguities before coding.** If the plan is unclear or contradictory for the
  task at hand, raise it first; state any gap-filling assumptions explicitly.
- **Stop and report at the end of a scoped task.** Don't race ahead into the next
  feature.

---

## Git & pull requests

- **Never commit directly to `main`.** All changes go through a branch and a pull
  request — no exceptions, even for small fixes.
- **Always open a PR for changes.** Use the `gh` CLI if it's available; otherwise push
  the branch and create the PR against `main`.
- **One logical change per PR.** Keep PRs small and focused; do not mix unrelated
  changes.
- **Break larger tasks into a sequence of smaller PRs.** Before starting a big task,
  outline the PRs you intend to open and land them one at a time, each on its own branch.
  Don't bundle a whole feature into one large PR.
- **Every PR leaves the project working** — tests pass and the app runs. No PR should
  depend on a later one to be functional.
- **Branch names:** `feature/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`.
- **Commit messages:** short imperative subject (e.g. "Add load distribution to
  breakage eval"), with a body explaining *why* when it isn't obvious.
- **PR description must include:** what changed, why, how to verify it (including test
  output), and anything intentionally left out of scope.
- **Pause at the PR boundary.** After opening a PR, summarise it and wait — the project
  owner reviews and merges. Don't begin dependent work until the PR is merged unless told
  to.
