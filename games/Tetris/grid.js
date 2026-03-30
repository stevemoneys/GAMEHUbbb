export class Grid {
  constructor(width = 10, height = 20) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  createEmptyGrid() {
    return Array.from({ length: this.height }, () =>
      Array(this.width).fill(0)
    );
  }

  reset() {
    this.cells = this.createEmptyGrid();
  }

  isInside(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  checkCollision(piece) {
    const { shape, x, y } = piece;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          const outOfBounds =
            newX < 0 || newX >= this.width || newY >= this.height;
          if (outOfBounds) {
            return true;
          }

          if (newY >= 0 && this.cells[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  merge(piece) {
    const { shape, x, y } = piece;

    shape.forEach((row, r) => {
      row.forEach((value, c) => {
        if (value) {
          const gridX = x + c;
          const gridY = y + r;

          if (this.isInside(gridX, gridY)) {
            this.cells[gridY][gridX] = piece.type;
          }
        }
      });
    });
  }

  getFullLineIndices() {
    const fullLines = [];
    for (let y = 0; y < this.height; y++) {
      const isFull = this.cells[y].every((cell) => cell !== 0);
      if (isFull) {
        fullLines.push(y);
      }
    }
    return fullLines;
  }

  removeLines(lineIndices) {
    if (!lineIndices.length) {
      return;
    }

    const rowsToRemove = new Set(lineIndices);
    const remainingRows = this.cells.filter((_, rowIndex) => !rowsToRemove.has(rowIndex));

    while (remainingRows.length < this.height) {
      remainingRows.unshift(Array(this.width).fill(0));
    }

    this.cells = remainingRows;
  }

  clearLines() {
    const fullLines = this.getFullLineIndices();
    this.removeLines(fullLines);
    return {
      count: fullLines.length,
      lines: fullLines
    };
  }

  addGarbageLines(count, holeSelector = null) {
    let toppedOut = false;
    const safeCount = Math.max(0, count | 0);

    for (let i = 0; i < safeCount; i++) {
      const removedTop = this.cells.shift();
      if (removedTop.some((cell) => cell !== 0)) {
        toppedOut = true;
      }

      const hole = typeof holeSelector === 'function'
        ? holeSelector(this.width, i)
        : Math.floor(Math.random() * this.width);

      const row = Array(this.width).fill('G');
      row[Math.max(0, Math.min(this.width - 1, hole))] = 0;
      this.cells.push(row);
    }

    return toppedOut;
  }
}
