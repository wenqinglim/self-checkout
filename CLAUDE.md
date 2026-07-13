# CLAUDE.md

How to work here. **`grocery-bagging-game-plan.md` is the *what*; this file is the *how*.**
If they conflict, stop and ask.

## Project

2D grocery-bagging puzzle in the browser. Player packs items into a fixed-width grid bag;
fragile items break if crushed (deterministic rule, no physics). Timed. Full design lives
in `grocery-bagging-game-plan.md`.

**Stack:** plain HTML/CSS/vanilla JS. No frameworks, no bundler, no build step.

## Architecture (do not cross these boundaries)

- **`src/logic.js`** — pure. No `document`, `window`, or DOM. The portable "brain."
- **`data/items.js`, `data/levels.js`** — data only. No behaviour.
- **`src/render.js`** — the only DOM layer. All drawing and input.
- **`src/game.js`** — state + wiring between logic and render.
- Content (items, levels) lives in `data/`, never hardcoded in logic.

## Working locally

- ES modules don't load over `file://`. Serve with `npm run serve` (or `python3 -m http.server 8000`) and open `http://localhost:8000`. Don't add a bundler to work around this.
- Tests: `npm test` (runs `node tests/logic.test.js`). All assertions must pass.

## Core rules

- **Never commit directly to `main`.** Every change goes through a branch + PR.
- **Small, single-purpose functions** with descriptive names.
- **Comment the *why*, not the *what*** — especially for the breakage/load model.
- **Fail loudly.** Assertions/throws over silent fallbacks so bugs surface early.
- **In-memory only.** No `localStorage` or other browser storage in the MVP.

## Scope discipline

- **Stay inside the MVP fence** (plan §10). No physics, item rotation, sound, persistence, mobile/touch tuning, or any unlisted feature.
- **Do only the task that was asked.** If it seems to need something outside scope, stop and ask rather than expanding it yourself.
- **Surface ambiguities before coding.** State any gap-filling assumptions explicitly.
- **Stop at the end of a scoped task.** Don't race into the next feature.

## Detailed rules (load conditionally)

- `.claude/rules/logic-purity.md` — determinism, tunable-constants, data/logic separation. Loads when touching `src/logic.js`, `data/**`, or `tests/**`.
- `.claude/rules/testing-and-verification.md` — pre-PR checklist and "update tests with behaviour changes." Loads on any source file.
- `.claude/rules/pull-requests.md` — branch naming, commit style, PR body template, pause-at-boundary. Loads on any source file.
