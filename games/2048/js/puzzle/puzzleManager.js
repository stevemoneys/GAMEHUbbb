import { cloneGrid } from "../../grid.js";
import { evaluatePuzzleEfficiency, getAdaptivePuzzleHint } from "./puzzleAI.js";
import { getPuzzleFailureMessage, getPuzzleNearMessage, getPuzzlePraise } from "./puzzleFeedback.js";
import { getPuzzleLevel } from "./puzzleLevels.js";
import { getPuzzleGoalLabel, getPuzzleHeaderCopy, getPuzzleMovesLabel } from "./puzzleUI.js";

const PUZZLE_RESULTS_KEY = "gamehub_2048_puzzle_results_v1";
const PUZZLE_FAILS_KEY = "gamehub_2048_puzzle_fails_v1";

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage errors.
  }
}

function countEmpty(grid) {
  let total = 0;
  for (const row of grid) {
    for (const value of row) {
      if (value === 0) {
        total += 1;
      }
    }
  }
  return total;
}

function countLockedRemaining(grid, lockedTiles) {
  return lockedTiles.filter((tile) => grid[tile.row]?.[tile.col] > 0).length;
}

function getRestrictedColumnSet(config) {
  return new Set(config.restrictedColumns || []);
}

export function createPuzzleManager({ storage = window.localStorage } = {}) {
  let results = readJson(storage, PUZZLE_RESULTS_KEY, {});
  let fails = readJson(storage, PUZZLE_FAILS_KEY, {});

  function persist() {
    writeJson(storage, PUZZLE_RESULTS_KEY, results);
    writeJson(storage, PUZZLE_FAILS_KEY, fails);
  }

  function getLevel(level) {
    return getPuzzleLevel(level);
  }

  function getRecord(level) {
    return results[String(level)] || { stars: 0, bestMoves: null, clears: 0 };
  }

  function getFailCount(level) {
    return Number(fails[String(level)] || 0);
  }

  function markFailure(level) {
    const key = String(level);
    fails[key] = getFailCount(level) + 1;
    persist();
    return fails[key];
  }

  function clearFailures(level) {
    fails[String(level)] = 0;
    persist();
  }

  function createSession(level) {
    const config = getLevel(level);
    return {
      config,
      level: config.level,
      board: cloneGrid(config.board),
      moveLimit: config.moveLimit,
      movesUsed: 0,
      playerAmmoQueue: Array.isArray(config.ammoQueue) ? config.ammoQueue.slice() : [],
      hintCount: 0,
      failCount: getFailCount(level),
      goalLabel: getPuzzleGoalLabel(config),
      specialRule: config.specialRule || null
    };
  }

  function getHeaderUi(session) {
    return {
      ...getPuzzleHeaderCopy(session.config, getRecord(session.level)),
      moves: getPuzzleMovesLabel(session.moveLimit - session.movesUsed, session.moveLimit)
    };
  }

  function getProgressRatio(session, boardScore, boardMaxTile, lockedTiles, grid) {
    const goal = session.config.goal || {};
    if (goal.kind === "score") {
      return Math.max(0, Math.min(1, boardScore / Math.max(1, Number(goal.target || 1))));
    }

    if (goal.kind === "survive") {
      const empties = countEmpty(grid);
      return Math.max(0, Math.min(1, empties / 8));
    }

    if (goal.kind === "clear") {
      const remaining = countLockedRemaining(grid, lockedTiles);
      const total = Math.max(1, lockedTiles.length);
      return Math.max(0, Math.min(1, 1 - remaining / total));
    }

    return Math.max(0, Math.min(1, boardMaxTile / Math.max(2, Number(goal.target || 2))));
  }

  function checkOutcome(session, boardScore, boardMaxTile, lockedTiles, grid) {
    const goal = session.config.goal || {};
    const movesLeft = session.moveLimit - session.movesUsed;

    let solved = false;
    if (goal.kind === "score") {
      solved = boardScore >= Number(goal.target || 0);
    } else if (goal.kind === "survive") {
      solved = movesLeft >= 0 && countEmpty(grid) >= 3;
    } else if (goal.kind === "clear") {
      solved = countLockedRemaining(grid, lockedTiles) === 0;
    } else {
      solved = boardMaxTile >= Number(goal.target || 0);
    }

    const progressRatio = getProgressRatio(session, boardScore, boardMaxTile, lockedTiles, grid);
    const failed = !solved && movesLeft <= 0;

    return {
      solved,
      failed,
      progressRatio,
      praise: getPuzzlePraise(progressRatio, 0),
      almost: getPuzzleNearMessage(progressRatio)
    };
  }

  function recordWin(level, movesUsed) {
    const config = getLevel(level);
    const stars = evaluatePuzzleEfficiency(config, movesUsed);
    const current = getRecord(level);
    results[String(level)] = {
      stars: Math.max(current.stars || 0, stars),
      bestMoves: current.bestMoves === null ? movesUsed : Math.min(current.bestMoves, movesUsed),
      clears: Number(current.clears || 0) + 1
    };
    clearFailures(level);
    persist();
    return stars;
  }

  function getFailureCopy(level, movesUsed) {
    return getPuzzleFailureMessage(getLevel(level), movesUsed);
  }

  function getHint(session, grid, currentAmmo) {
    const hint = getAdaptivePuzzleHint(grid, currentAmmo, session.config, getFailCount(session.level));
    if (hint) {
      session.hintCount += 1;
    }
    return hint;
  }

  function isColumnAllowed(session, column) {
    return !getRestrictedColumnSet(session.config).has(column);
  }

  return {
    getLevel,
    getRecord,
    getFailCount,
    markFailure,
    clearFailures,
    createSession,
    getHeaderUi,
    getProgressRatio,
    checkOutcome,
    recordWin,
    getFailureCopy,
    getHint,
    isColumnAllowed
  };
}
