---
paths:
  - "src/**/*.js"
  - "data/**/*.js"
  - "tests/**/*.js"
  - "index.html"
  - "style.css"
---

# Pull-request conventions

- **One logical change per PR.** No mixed-bag PRs.
- **Break big tasks into a sequence of small PRs.** Outline them before starting; land one at a time on its own branch. Never bundle a whole feature into a single mega-PR.
- **Every PR leaves the project working** — tests pass, app runs. No PR should depend on a later one to be functional.
- **Branch names:** `feature/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`.
- **Commit messages:** short imperative subject ("Add load distribution to breakage eval"). Body explains *why* if it isn't obvious.
- **PR description must include:** what changed, why, how to verify (including test output), and anything intentionally left out of scope.
- **Use `gh` CLI** to open the PR when available; otherwise push the branch and open against `main` in the UI.
- **Pause at the PR boundary.** After opening a PR, summarise it and wait — the owner reviews and merges. Don't start dependent work until the PR is merged unless told to.
