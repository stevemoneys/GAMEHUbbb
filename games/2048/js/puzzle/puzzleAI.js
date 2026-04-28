import { cloneGrid } from "../../grid.js";

function getDropRow(grid, column) {
  for (let row = grid.length - 1; row >= 0; row -= 1) {
    if (grid[row][column] === 0) {
      return row;
    }
  }
  return null;
}

function collapseTop(grid) {
  for (let col = 0; col < grid[0].length; col += 1) {
    const values = [];
    for (let row = 0; row < grid.length; row += 1) {
      if (grid[row][col] > 0) {
        values.push(grid[row][col]);
      }
    }
    for (let row = 0; row < grid.length; row += 1) {
      grid[row][col] = values[row] ?? 0;
    }
  }
}

function resolveSimpleMerges(grid) {
  let score = 0;
  let merged = 0;
  let changed = true;

  while (changed) {
    changed = false;
    const marks = [];

    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid[row].length; col += 1) {
        const value = grid[row][col];
        if (value <= 0) {
          continue;
        }

        if (col + 1 < grid[row].length && grid[row][col + 1] === value) {
          marks.push({ source: { row, col }, target: { row, col: col + 1 }, value });
        }

        if (row + 1 < grid.length && grid[row + 1][col] === value) {
          marks.push({ source: { row, col }, target: { row: row + 1, col }, value });
        }
      }
    }

    if (marks.length === 0) {
      break;
    }

    changed = true;
    for (const mark of marks) {
      const { source, target, value } = mark;
      if (grid[source.row][source.col] !== value || grid[target.row][target.col] !== value) {
        continue;
      }
      grid[source.row][source.col] = value * 2;
      grid[target.row][target.col] = 0;
      score += value * 2;
      merged += 1;
    }
    collapseTop(grid);
  }

  return { score, merged };
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

function getMaxTile(grid) {
  let best = 0;
  for (const row of grid) {
    for (const value of row) {
      if (value > best) {
        best = value;
      }
    }
  }
  return best;
}

export function evaluatePuzzleColumns(grid, currentAmmo, config) {
  const scores = [];
  const restricted = new Set(config.restrictedColumns || []);

  for (let col = 0; col < grid[0].length; col += 1) {
    if (restricted.has(col)) {
      continue;
    }

    const dropRow = getDropRow(grid, col);
    if (dropRow === null) {
      continue;
    }

    const trial = cloneGrid(grid);
    trial[dropRow][col] = currentAmmo;
    const beforeEmpty = countEmpty(grid);
    const merge = resolveSimpleMerges(trial);
    const afterEmpty = countEmpty(trial);
    const maxTile = getMaxTile(trial);
    const heuristic =
      merge.score * 2.4 +
      merge.merged * 30 +
      maxTile * 0.18 +
      (afterEmpty - beforeEmpty) * 18 +
      (col === 2 ? 8 : 0);

    scores.push({
      column: col,
      score: heuristic,
      mergeScore: merge.score,
      merged: merge.merged,
      maxTile,
      empties: afterEmpty
    });
  }

  scores.sort((left, right) => right.score - left.score);
  return scores;
}

export function getAdaptivePuzzleHint(grid, currentAmmo, config, failCount = 0) {
  const ranked = evaluatePuzzleColumns(grid, currentAmmo, config);
  const best = ranked[0] || null;
  if (!best) {
    return null;
  }

  const tone =
    failCount >= 4 ? "Try the calmer lane" :
    failCount >= 2 ? "This column keeps the board safer" :
    "Best move";

  const reason =
    best.mergeScore > 0 ? `it creates ${best.mergeScore} merge score` :
    best.maxTile > 0 ? `it sets up a stronger ${best.maxTile} tile` :
    `it gives you more breathing room`;

  return {
    column: best.column,
    text: `${tone}: column ${best.column + 1}, because ${reason}.`
  };
}

export function evaluatePuzzleEfficiency(config, movesUsed) {
  const optimal = Number(config.optimalMoves || config.moveLimit || movesUsed || 1);
  const safeMoves = Math.max(1, Number(movesUsed || optimal));
  const slack = safeMoves - optimal;

  if (slack <= 0) {
    return 3;
  }
  if (slack <= 2) {
    return 2;
  }
  return 1;
}
