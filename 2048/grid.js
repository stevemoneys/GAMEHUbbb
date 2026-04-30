export const GRID_COLUMNS = 5;
export const GRID_ROWS = 8;
export const GRID_SIZE = GRID_COLUMNS;

export function createEmptyGrid(rows = GRID_ROWS, cols = rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function getEmptyCells(grid) {
  const emptyCells = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }

  return emptyCells;
}

export function gridsEqual(firstGrid, secondGrid) {
  if (firstGrid.length !== secondGrid.length) {
    return false;
  }

  for (let row = 0; row < firstGrid.length; row += 1) {
    if (firstGrid[row].length !== secondGrid[row].length) {
      return false;
    }

    for (let col = 0; col < firstGrid[row].length; col += 1) {
      if (firstGrid[row][col] !== secondGrid[row][col]) {
        return false;
      }
    }
  }

  return true;
}

export default class Grid {
  constructor(size = GRID_SIZE) {
    this.size = size;
    this.cells = createEmptyGrid(size, size);
  }

  createEmptyGrid() {
    return createEmptyGrid(this.size, this.size);
  }

  reset() {
    this.cells = this.createEmptyGrid();
  }

  getEmptyCells() {
    return getEmptyCells(this.cells).map((cell) => ({ r: cell.row, c: cell.col }));
  }

  setCell(r, c, value) {
    this.cells[r][c] = value;
  }

  getCell(r, c) {
    return this.cells[r][c];
  }
}
