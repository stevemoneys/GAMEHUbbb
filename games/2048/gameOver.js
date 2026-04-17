import { getEmptyCells } from "./grid.js";

export function hasAvailableMoves(grid) {
  if (getEmptyCells(grid).length > 0) {
    return true;
  }

  const size = grid.length;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const currentValue = grid[row][col];
      const rightNeighbor = col + 1 < size ? grid[row][col + 1] : null;
      const downNeighbor = row + 1 < size ? grid[row + 1][col] : null;

      if (currentValue === rightNeighbor || currentValue === downNeighbor) {
        return true;
      }
    }
  }

  return false;
}

export function calculateGameOver(grid) {
  return !hasAvailableMoves(grid);
}
