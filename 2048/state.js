import { GRID_SIZE, cloneGrid, createEmptyGrid } from "./grid.js";
import { addRandomTile } from "./generator.js";
import { calculateGameOver } from "./gameOver.js";

const BEST_SCORE_STORAGE_KEY = "gamehub_2048_best_score_v1";
const MAX_UNDO_HISTORY = 40;

function normalizeScore(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return Math.floor(numericValue);
}

function createInitialGrid(size) {
  const grid = createEmptyGrid(size);

  addRandomTile(grid);
  addRandomTile(grid);

  return grid;
}

export function loadBestScore() {
  try {
    const stored = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : 0;

    return normalizeScore(parsed);
  } catch (error) {
    return 0;
  }
}

export function saveBestScore(score) {
  const safeScore = normalizeScore(score);

  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(safeScore));
  } catch (error) {
    // Ignore write failures (private mode / storage restrictions).
  }
}

export function createInitialState(size = GRID_SIZE) {
  const grid = createInitialGrid(size);

  return {
    size,
    grid,
    score: 0,
    bestScore: loadBestScore(),
    moveCount: 0,
    gameOver: calculateGameOver(grid),
    undoStack: []
  };
}

export function updateGameOverStatus(state) {
  state.gameOver = calculateGameOver(state.grid);
  return state.gameOver;
}

export function captureUndoSnapshot(state) {
  return {
    grid: cloneGrid(state.grid),
    score: state.score,
    moveCount: state.moveCount
  };
}

export function pushUndoState(state) {
  state.undoStack.push(captureUndoSnapshot(state));

  if (state.undoStack.length > MAX_UNDO_HISTORY) {
    state.undoStack.shift();
  }
}

export function canUndo(state) {
  return state.undoStack.length > 0;
}

export function popUndoState(state) {
  return state.undoStack.pop() || null;
}

export function applyUndoSnapshot(state, snapshot) {
  state.grid = cloneGrid(snapshot.grid);
  state.score = normalizeScore(snapshot.score);
  state.moveCount = snapshot.moveCount;
  updateGameOverStatus(state);
}

export function applyMoveResult(state, moveResult) {
  if (!moveResult || !moveResult.moved) {
    updateGameOverStatus(state);
    return {
      applied: false,
      spawnedTile: null
    };
  }

  pushUndoState(state);
  state.grid = cloneGrid(moveResult.grid);
  state.score = normalizeScore(state.score + moveResult.scoreGained);
  state.moveCount += 1;

  const spawnedTile = addRandomTile(state.grid);
  updateGameOverStatus(state);
  refreshBestScore(state);

  return {
    applied: true,
    spawnedTile
  };
}

export function refreshBestScore(state) {
  const currentBestScore = normalizeScore(state.bestScore);
  const nextBestScore = Math.max(currentBestScore, normalizeScore(state.score));

  state.bestScore = currentBestScore;

  if (nextBestScore > currentBestScore) {
    state.bestScore = nextBestScore;
    saveBestScore(state.bestScore);
  }
}

export function resetGameState(state) {
  const previousBest = normalizeScore(state.bestScore);
  const next = createInitialState(state.size);
  const bestScore = Math.max(previousBest, normalizeScore(next.bestScore));

  state.grid = cloneGrid(next.grid);
  state.score = next.score;
  state.bestScore = bestScore;
  state.moveCount = next.moveCount;
  state.gameOver = next.gameOver;
  state.undoStack = [];

  saveBestScore(state.bestScore);
}
