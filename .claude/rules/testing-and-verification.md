---
paths:
  - "src/**/*.js"
  - "data/*.js"
  - "tests/**/*.js"
  - "index.html"
  - "style.css"
  - "CLAUDE.md"
  - ".claude/rules/**/*.md"
  - "package.json"
  - "README.md"
  - "grocery-bagging-game-plan.md"
---

# Testing and verification

**Before opening a PR:**
1. Run `npm test`; every assertion must pass. Paste the output into the PR description.
2. Manually confirm the app still loads and runs served over http (not `file://`).
3. Confirm no architecture boundary was crossed (no DOM in `logic.js`, no logic in `data/`).

**When changing behaviour:**
- Any change to breakage, scoring, placement, or removability must ship with a test update in the same PR. Never alter core behaviour without an accompanying test.
