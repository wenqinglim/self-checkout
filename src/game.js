// Game state and controller. Owns the mutable game state; delegates all DOM
// work to render.js and all rules to logic.js (which never touches the DOM).

import { ITEMS } from "../data/items.js";
import { LEVELS } from "../data/levels.js";
import {
  evaluateBreakage,
  finalScore,
  isRemovable,
  settle,
  starsFor,
  survivalScore,
  timeBonus,
} from "./logic.js";
import { renderBag, renderStars, renderTray } from "./render.js";

const CLOCK_TICK_MS = 250;

// Mutable state. `levelIndex` indirects through LEVELS so loadLevel can reset
// the per-level slice (bag/tray/carry/clock/won) when the player advances.
// Tray items each get a unique instance id so we can refer to them across
// re-renders even when the same item type appears more than once.
const state = {
  levelIndex: 0,
  grid: null,
  bag: [],
  tray: [],
  // Populated by Carry, cleared on any subsequent placement edit. Holding it
  // in state (rather than recomputing on every render) is what lets the
  // damaged highlight persist after Carry until the player moves something.
  carryResult: null, // { damagedIds, survival, bonus, final, stars } | null
  // ms timestamp of the player's first drag in the current level; null before
  // any drag. The clock never resets across retries within a level — that's
  // what makes time the real cost of unlimited do-overs (plan §8) — but it
  // does reset on level transition because each level has its own time tuning.
  clockStartedAt: null,
  // True once Carry produces final >= threshold. Locks all interactions until
  // the player advances to the next level.
  won: false,
};

function currentLevel() {
  return LEVELS[state.levelIndex];
}

// Star thresholds for `level`. Every level must declare `starThresholds`
// — fail loudly per CLAUDE.md if a level is missing it, so a malformed
// data entry surfaces at level-load rather than as a silent no-star carry.
// `starsFor` (pure) re-validates length and ordering at use time.
function starThresholdsFor(level) {
  if (!level.starThresholds) {
    throw new Error(`level "${level.name}" is missing starThresholds`);
  }
  return level.starThresholds;
}

function loadLevel(idx) {
  state.levelIndex = idx;
  const level = currentLevel();
  state.grid = level.bag;
  state.bag = [];
  // Prefix instance ids with the level index so they don't collide across
  // levels. Nothing today carries placements across boundaries (loadLevel
  // wipes both pools), but anything later that does — undo, replay, analytics,
  // persisted progress — would silently alias `t0-watermelon` between levels.
  state.tray = level.tray.map((itemId, i) => ({
    id: `L${idx}-t${i}-${itemId}`,
    itemId,
  }));
  state.carryResult = null;
  state.clockStartedAt = null;
  state.won = false;
  if (clockInterval != null) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  tickClock();
}

const bagEl = document.getElementById("bag");
const trayEl = document.getElementById("tray");
const carryBtn = document.getElementById("carry-btn");
const resultEl = document.getElementById("result");
const resultScoreEl = document.getElementById("result-score-value");
const resultStarsEl = document.getElementById("result-stars");
const resultBreakdownEl = document.getElementById("result-breakdown");
const clockEl = document.getElementById("clock");
const winBannerEl = document.getElementById("win-banner");
const winBannerTextEl = document.getElementById("win-banner-text");
const nextLevelBtn = document.getElementById("next-level-btn");
const levelNameEl = document.getElementById("level-name");

function render() {
  renderBag(bagEl, state.grid, state.bag, ITEMS, {
    onDrop: handleDropOnBag,
    // After winning, nothing is draggable: clicking around shouldn't be able
    // to modify a cleared level.
    isRemovable: (p) => !state.won && isRemovable(p, state.bag, ITEMS),
    damagedIds: state.carryResult?.damagedIds,
    onDragStart: startClockIfNeeded,
  });
  renderTray(trayEl, state.tray, ITEMS, {
    onDrop: handleDropOnTray,
    onDragStart: startClockIfNeeded,
    // Tray items are inherently removable, but the post-win lock still
    // applies: after winning, nothing in the tray should be draggable.
    isRemovable: () => !state.won,
  });
  renderResult();
  renderWinBanner();
  renderLevelName();
  carryBtn.disabled = state.won;
}

function renderResult() {
  if (!state.carryResult) {
    resultEl.hidden = true;
    resultBreakdownEl.textContent = "";
    return;
  }
  const { damagedIds, survival, bonus, final, stars } = state.carryResult;
  resultEl.hidden = false;
  // `final` is already rounded at compute time so display and the
  // threshold check stay consistent (no "Score: 80 but didn't win").
  resultScoreEl.textContent = String(final);
  renderStars(resultStarsEl, stars);
  const intact = state.bag.length - damagedIds.size;
  const overflow = state.tray.length;
  const [s1, s2, s3] = starThresholdsFor(currentLevel());
  const parts = [
    `survival ${survival}`,
    `time bonus ${Math.round(bonus)}`,
    `${intact} intact`,
    `${damagedIds.size} broken`,
  ];
  if (overflow > 0) parts.push(`${overflow} left in tray`);
  parts.push(`stars ★${s1} / ★★${s2} / ★★★${s3}`);
  resultBreakdownEl.textContent = parts.join(" · ");
}

function renderWinBanner() {
  winBannerEl.hidden = !state.won;
  if (!state.won) {
    // Reset explicitly rather than relying on the parent banner's `hidden`
    // cascade — otherwise the button's own `hidden` flag stays stale from a
    // previous win and would re-appear if the banner is ever hidden via a
    // different mechanism, or if the button is moved out of the banner.
    nextLevelBtn.hidden = true;
    return;
  }
  const hasNext = state.levelIndex < LEVELS.length - 1;
  winBannerTextEl.textContent = hasNext
    ? "Level cleared!"
    : "All levels cleared!";
  nextLevelBtn.hidden = !hasNext;
}

function renderLevelName() {
  levelNameEl.textContent = currentLevel().name;
}

// Any change to the bag invalidates the Carry result; clear it so stale
// damage highlights don't linger over a different arrangement.
function invalidateCarryResult() {
  state.carryResult = null;
}

// Look up an item by instance id in either pool. Returns { item, source }
// where source is "bag" or "tray".
function findInstance(instanceId) {
  const inBag = state.bag.find((p) => p.id === instanceId);
  if (inBag) return { item: inBag, source: "bag" };
  const inTray = state.tray.find((p) => p.id === instanceId);
  if (inTray) return { item: inTray, source: "tray" };
  return null;
}

function handleDropOnBag(instanceId, dropX) {
  if (state.won) return;
  const found = findInstance(instanceId);
  if (!found) return;
  const { item, source } = found;

  // Items inside the bag must be removable before they can be repositioned.
  if (source === "bag" && !isRemovable(item, state.bag, ITEMS)) return;

  // Clamp the drop column so a wide item released near the right edge
  // snaps flush right instead of being silently rejected by settle.
  const w = ITEMS[item.itemId].footprint.w;
  const clampedX = Math.max(0, Math.min(state.grid.W - w, dropX));

  // settle excludes the candidate's own cells by id, so a bag→bag reposition
  // can pass state.bag through unchanged. It is the sole authority on legal
  // placement — if it returns a result, the result is in-bounds and
  // overlap-free by construction.
  const candidate = { id: item.id, itemId: item.itemId, x: clampedX };
  const settled = settle(state.grid, state.bag, ITEMS, candidate);
  if (!settled) return; // no vertical room — silent reject.

  if (source === "tray") {
    state.tray = state.tray.filter((p) => p.id !== item.id);
    state.bag.push(settled);
  } else {
    const idx = state.bag.findIndex((p) => p.id === item.id);
    state.bag[idx] = settled;
  }
  invalidateCarryResult();
  render();
}

function handleDropOnTray(instanceId) {
  if (state.won) return;
  const found = findInstance(instanceId);
  if (!found || found.source !== "bag") return;
  if (!isRemovable(found.item, state.bag, ITEMS)) return;

  state.bag = state.bag.filter((p) => p.id !== instanceId);
  state.tray.push({ id: instanceId, itemId: found.item.itemId });
  invalidateCarryResult();
  render();
}

function handleCarry() {
  if (state.won) return;
  const level = currentLevel();
  const { damagedIds } = evaluateBreakage(state.grid, state.bag, ITEMS);
  const survival = survivalScore(state.bag, damagedIds, ITEMS);
  const bonus = timeBonus(
    level.timeBonusMax,
    level.timeDecay,
    elapsedSeconds(),
  );
  // Round at compute time so the displayed score and the threshold gate
  // agree to the integer. Storing the raw float bit us before: a final of
  // 79.6 would render as "Score: 80" next to "threshold 80" but still fail
  // the (final >= threshold) check.
  const final = Math.round(finalScore(survival, bonus));
  const thresholds = starThresholdsFor(level);
  const stars = starsFor(final, thresholds);
  state.carryResult = { damagedIds, survival, bonus, final, stars };
  // An empty bag yielding final = bonus is not a win — the player hasn't
  // packed anything. Without this gate, Carry-as-first-action would clear
  // the level for free (bonus 100 >= threshold 80). `stars >= 1` is
  // equivalent to `final >= thresholds[0]`, so this preserves the
  // pre-existing pass/fail semantics for legacy levels.
  if (stars >= 1 && state.bag.length > 0) {
    state.won = true;
    freezeClock();
  }
  render();
}

function handleNextLevel() {
  if (state.levelIndex >= LEVELS.length - 1) return;
  loadLevel(state.levelIndex + 1);
  render();
}

// ---- Clock -----------------------------------------------------------------

function elapsedSeconds() {
  if (state.clockStartedAt == null) return 0;
  return (Date.now() - state.clockStartedAt) / 1000;
}

function tickClock() {
  clockEl.textContent = `${elapsedSeconds().toFixed(1)}s`;
}

let clockInterval = null;
function startClockIfNeeded() {
  if (state.clockStartedAt != null) return;
  state.clockStartedAt = Date.now();
  tickClock();
  clockInterval = setInterval(tickClock, CLOCK_TICK_MS);
}

// Stop the ticking display once the level is won. The frozen chip shows
// the elapsed time at the moment of the winning Carry — there is no
// further score to lose by waiting.
function freezeClock() {
  if (clockInterval != null) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  tickClock();
}

carryBtn.addEventListener("click", handleCarry);
nextLevelBtn.addEventListener("click", handleNextLevel);

loadLevel(0);
render();
