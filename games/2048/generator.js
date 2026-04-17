import { getEmptyCells } from "./grid.js";

const CHANCE_FOR_FOUR = 0.1;

export function getRandomTileValue(rng = Math.random) {
  return rng() < CHANCE_FOR_FOUR ? 4 : 2;
}

export function addRandomTile(grid, rng = Math.random) {
  const emptyCells = getEmptyCells(grid);

  if (emptyCells.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(rng() * emptyCells.length);
  const { row, col } = emptyCells[randomIndex];
  const value = getRandomTileValue(rng);

  grid[row][col] = value;

  return { row, col, value };
}
