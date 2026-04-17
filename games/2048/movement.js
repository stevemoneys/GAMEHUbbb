import { cloneGrid, gridsEqual } from "./grid.js";
import { canMergeValues, getMergedValue } from "./merge.js";

export const DIRECTIONS = Object.freeze({
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down"
});

function getDirectionVector(direction) {
  switch (direction) {
    case DIRECTIONS.LEFT:
      return { row: 0, col: -1 };
    case DIRECTIONS.RIGHT:
      return { row: 0, col: 1 };
    case DIRECTIONS.UP:
      return { row: -1, col: 0 };
    case DIRECTIONS.DOWN:
      return { row: 1, col: 0 };
    default:
      throw new Error(`Invalid move direction: ${direction}`);
  }
}

function createTraversalOrder(size, direction) {
  const rows = Array.from({ length: size }, (_, index) => index);
  const cols = Array.from({ length: size }, (_, index) => index);

  if (direction === DIRECTIONS.DOWN) {
    rows.reverse();
  }

  if (direction === DIRECTIONS.RIGHT) {
    cols.reverse();
  }

  return { rows, cols };
}

function advanceCell(cell, vector) {
  return {
    row: cell.row + vector.row,
    col: cell.col + vector.col
  };
}

function isWithinBounds(grid, cell) {
  return (
    cell.row >= 0 &&
    cell.row < grid.length &&
    cell.col >= 0 &&
    cell.col < grid[0].length
  );
}

function findFarthestAvailableCell(grid, start, vector) {
  let previous = { row: start.row, col: start.col };
  let next = advanceCell(start, vector);

  while (isWithinBounds(grid, next) && grid[next.row][next.col] === 0) {
    previous = next;
    next = advanceCell(next, vector);
  }

  return previous;
}

function createMergedLockGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(false));
}

export function moveGrid(grid, direction) {
  const validDirections = Object.values(DIRECTIONS);

  if (!validDirections.includes(direction)) {
    throw new Error(`Invalid move direction: ${direction}`);
  }

  const nextGrid = cloneGrid(grid);
  const size = nextGrid.length;
  const vector = getDirectionVector(direction);
  const traversal = createTraversalOrder(size, direction);
  const mergedLockGrid = createMergedLockGrid(size);
  let scoreGained = 0;
  const moves = [];
  const merges = [];

  for (const row of traversal.rows) {
    for (const col of traversal.cols) {
      const value = nextGrid[row][col];

      if (value === 0) {
        continue;
      }

      const origin = { row, col };
      const destination = findFarthestAvailableCell(nextGrid, origin, vector);
      const mergeTarget = advanceCell(destination, vector);
      const canMerge =
        isWithinBounds(nextGrid, mergeTarget) &&
        canMergeValues(
          value,
          nextGrid[mergeTarget.row][mergeTarget.col],
          mergedLockGrid[mergeTarget.row][mergeTarget.col]
        );

      if (canMerge) {
        const mergedValue = getMergedValue(value);

        nextGrid[origin.row][origin.col] = 0;
        nextGrid[mergeTarget.row][mergeTarget.col] = mergedValue;
        mergedLockGrid[mergeTarget.row][mergeTarget.col] = true;
        scoreGained += mergedValue;

        moves.push({
          from: origin,
          to: mergeTarget,
          value,
          merged: true
        });
        merges.push({
          at: { row: mergeTarget.row, col: mergeTarget.col },
          resultValue: mergedValue
        });

        continue;
      }

      if (destination.row !== origin.row || destination.col !== origin.col) {
        nextGrid[origin.row][origin.col] = 0;
        nextGrid[destination.row][destination.col] = value;

        moves.push({
          from: origin,
          to: destination,
          value,
          merged: false
        });
      }
    }
  }

  return {
    grid: nextGrid,
    scoreGained,
    moved: !gridsEqual(grid, nextGrid),
    moves,
    merges
  };
}
