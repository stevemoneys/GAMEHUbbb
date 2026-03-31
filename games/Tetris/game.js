import { Grid, BOARD_COLUMNS, BOARD_ROWS } from './grid.js';
import {
  createPiece,
  PIECES,
  rotateShapeClockwise,
  rotateShapeCounterClockwise,
  getWallKickOffsets
} from './pieces.js';

const LINE_CLEAR_POINTS = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

const GARBAGE_BY_CLEAR = {
  1: 0,
  2: 1,
  3: 2,
  4: 4
};

export class Game {
  constructor() {
    this.grid = new Grid(BOARD_COLUMNS, BOARD_ROWS);
    this.smartPieceMode = true;
    this.smartSpawnSeed = 0;
    this.recentSmartTypes = [];
    this.pieceBag = [];
    this.currentPiece = this.drawNextPiece();
    this.nextPiece = this.drawNextPiece();
    this.heldType = null;
    this.canHold = true;
    this.gameOver = false;
    this.linesCleared = 0;
    this.level = 1;
    this.score = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.pendingGarbage = 0;
    this.forgivenessCharges = 0;
    this.events = [];
    this.lastUndoSnapshot = null;
  }

  refillBag() {
    const types = Object.keys(PIECES);
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.pieceBag.push(...types);
  }

  getSpawnYForShape(shape) {
    const firstFilledRow = shape.findIndex((row) => row.some(Boolean));
    return firstFilledRow > 0 ? -firstFilledRow : 0;
  }

  getShapeBounds(shape) {
    let minX = Infinity;
    let maxX = -Infinity;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    if (minX === Infinity) return null;
    return { minX, maxX };
  }

  getUniqueRotationsForType(type) {
    const rotations = [];
    const seen = new Set();
    let shape = PIECES[type];

    for (let i = 0; i < 4; i++) {
      const key = shape.map((row) => row.join('')).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        rotations.push(shape.map((row) => [...row]));
      }
      shape = rotateShapeClockwise(shape);
    }

    return rotations;
  }

  cloneGridCells() {
    return this.grid.cells.map((row) => [...row]);
  }

  mergePieceIntoCells(cells, piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const gridX = piece.x + x;
        const gridY = piece.y + y;
        if (gridY < 0 || gridY >= this.grid.height || gridX < 0 || gridX >= this.grid.width) return;
        cells[gridY][gridX] = piece.type;
      });
    });
  }

  clearLinesInCells(cells) {
    let cleared = 0;
    const remainingRows = [];
    for (let y = 0; y < this.grid.height; y++) {
      if (cells[y].every((cell) => cell !== 0)) {
        cleared += 1;
      } else {
        remainingRows.push(cells[y]);
      }
    }

    while (remainingRows.length < this.grid.height) {
      remainingRows.unshift(Array(this.grid.width).fill(0));
    }

    return { cleared, cells: remainingRows };
  }

  countHoles(cells) {
    let holes = 0;
    for (let x = 0; x < this.grid.width; x++) {
      let seenBlock = false;
      for (let y = 0; y < this.grid.height; y++) {
        const value = cells[y][x];
        if (value !== 0) {
          seenBlock = true;
        } else if (seenBlock) {
          holes += 1;
        }
      }
    }
    return holes;
  }

  getHeights(cells) {
    const heights = Array(this.grid.width).fill(0);
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (cells[y][x] !== 0) {
          heights[x] = this.grid.height - y;
          break;
        }
      }
    }
    return heights;
  }

  countPlacementSupports(piece) {
    let supports = 0;
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const gridX = piece.x + x;
        const gridY = piece.y + y;
        const belowY = gridY + 1;
        if (belowY >= this.grid.height) {
          supports += 1;
        } else if (belowY >= 0 && this.grid.cells[belowY][gridX] !== 0) {
          supports += 1;
        }
      });
    });
    return supports;
  }

  evaluateCellsFitness(cells, cleared, supports) {
    const heights = this.getHeights(cells);
    const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
    const maxHeight = heights.reduce((max, h) => Math.max(max, h), 0);
    let bumpiness = 0;
    for (let i = 0; i < heights.length - 1; i++) {
      bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    const holes = this.countHoles(cells);

    return (
      cleared * 240 +
      supports * 3 -
      holes * 30 -
      bumpiness * 6 -
      aggregateHeight * 1.2 -
      maxHeight * 2.2
    );
  }

  getMostCompleteRowInfo(cells) {
    let bestFilled = 0;
    let bestMissing = this.grid.width;

    for (let y = 0; y < this.grid.height; y++) {
      let filled = 0;
      for (let x = 0; x < this.grid.width; x++) {
        if (cells[y][x] !== 0) filled += 1;
      }
      const missing = this.grid.width - filled;
      if (filled > bestFilled || (filled === bestFilled && missing < bestMissing)) {
        bestFilled = filled;
        bestMissing = missing;
      }
    }

    return { filled: bestFilled, missing: bestMissing };
  }

  getLineAssistTarget() {
    let best = null;

    for (let y = this.grid.height - 1; y >= 0; y--) {
      const missingCols = [];
      for (let x = 0; x < this.grid.width; x++) {
        if (this.grid.cells[y][x] === 0) {
          missingCols.push(x);
        }
      }

      const missing = missingCols.length;
      if (missing <= 0) continue;
      const filled = this.grid.width - missing;
      const candidate = {
        y,
        missing,
        filled,
        missingColsSet: new Set(missingCols)
      };

      if (
        !best ||
        candidate.missing < best.missing ||
        (candidate.missing === best.missing && candidate.y > best.y) ||
        (candidate.missing === best.missing && candidate.y === best.y && candidate.filled > best.filled)
      ) {
        best = candidate;
      }
    }

    return best;
  }

  countMissingInRow(cells, rowY) {
    if (rowY < 0 || rowY >= this.grid.height) return this.grid.width;
    let missing = 0;
    for (let x = 0; x < this.grid.width; x++) {
      if (cells[rowY][x] === 0) missing += 1;
    }
    return missing;
  }

  countAssistFill(piece, assistTarget) {
    if (!assistTarget) return 0;
    let filled = 0;

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardY === assistTarget.y && assistTarget.missingColsSet.has(boardX)) {
          filled += 1;
        }
      });
    });

    return filled;
  }

  findBestPlacementProfile(type, assistTarget = null, baseRowInfo = null) {
    const rotations = this.getUniqueRotationsForType(type);
    const target = assistTarget || this.getLineAssistTarget();
    const baseInfo = baseRowInfo || this.getMostCompleteRowInfo(this.grid.cells);
    let best = {
      score: -Infinity,
      cleared: 0,
      targetCompleted: false,
      remainingMissing: target ? target.missing : this.grid.width,
      assistFill: 0,
      setupGain: -Infinity
    };

    rotations.forEach((shape) => {
      const bounds = this.getShapeBounds(shape);
      if (!bounds) return;

      const minX = -bounds.minX;
      const maxX = this.grid.width - 1 - bounds.maxX;
      const spawnY = this.getSpawnYForShape(shape);

      for (let x = minX; x <= maxX; x++) {
        const piece = { type, shape, rotation: 0, x, y: spawnY };
        if (this.grid.checkCollision(piece)) continue;

        while (!this.grid.checkCollision({ ...piece, y: piece.y + 1 })) {
          piece.y += 1;
        }

        const cells = this.cloneGridCells();
        const supports = this.countPlacementSupports(piece);
        const assistFill = this.countAssistFill(piece, target);
        this.mergePieceIntoCells(cells, piece);
        const mergedRowInfo = this.getMostCompleteRowInfo(cells);
        const setupGain = baseInfo.missing - mergedRowInfo.missing;
        const remainingMissing = target ? this.countMissingInRow(cells, target.y) : this.grid.width;
        const targetCompleted = !!target && remainingMissing === 0;
        const clearedResult = this.clearLinesInCells(cells);
        const score = this.evaluateCellsFitness(clearedResult.cells, clearedResult.cleared, supports);
        const nextCandidate = {
          score,
          cleared: clearedResult.cleared,
          targetCompleted,
          remainingMissing,
          assistFill,
          setupGain
        };
        const shouldReplace =
          (nextCandidate.targetCompleted && !best.targetCompleted) ||
          (nextCandidate.targetCompleted === best.targetCompleted && nextCandidate.remainingMissing < best.remainingMissing) ||
          (nextCandidate.targetCompleted === best.targetCompleted && nextCandidate.remainingMissing === best.remainingMissing && nextCandidate.assistFill > best.assistFill) ||
          (nextCandidate.targetCompleted === best.targetCompleted && nextCandidate.remainingMissing === best.remainingMissing && nextCandidate.assistFill === best.assistFill && nextCandidate.cleared > best.cleared) ||
          (nextCandidate.targetCompleted === best.targetCompleted && nextCandidate.remainingMissing === best.remainingMissing && nextCandidate.assistFill === best.assistFill && nextCandidate.cleared === best.cleared && nextCandidate.setupGain > best.setupGain) ||
          (nextCandidate.targetCompleted === best.targetCompleted && nextCandidate.remainingMissing === best.remainingMissing && nextCandidate.assistFill === best.assistFill && nextCandidate.cleared === best.cleared && nextCandidate.setupGain === best.setupGain && nextCandidate.score > best.score);

        if (shouldReplace) {
          best = nextCandidate;
        }
      }
    });

    return best;
  }

  getTieBreaker(type) {
    const order = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return Math.max(0, order.indexOf(type));
  }

  getRecentRepeatCount(type) {
    let repeats = 0;
    for (let i = 0; i < this.recentSmartTypes.length; i++) {
      if (this.recentSmartTypes[i] === type) repeats += 1;
    }
    return repeats;
  }

  rememberSmartType(type) {
    this.recentSmartTypes.push(type);
    if (this.recentSmartTypes.length > 8) {
      this.recentSmartTypes.shift();
    }
    this.smartSpawnSeed = (this.smartSpawnSeed + 1) % 100000;
  }

  selectSmartPieceType() {
    const assistTarget = this.getLineAssistTarget();
    const baseRowInfo = this.getMostCompleteRowInfo(this.grid.cells);
    const types = Object.keys(PIECES);
    const options = types.map((type) => {
      const profile = this.findBestPlacementProfile(type, assistTarget, baseRowInfo);
      return {
        type,
        score: profile.score,
        cleared: profile.cleared,
        targetCompleted: profile.targetCompleted,
        remainingMissing: profile.remainingMissing,
        assistFill: profile.assistFill,
        setupGain: profile.setupGain,
        tie: this.getTieBreaker(type)
      };
    });

    options.sort((a, b) => {
      if (assistTarget) {
        if (b.targetCompleted !== a.targetCompleted) return Number(b.targetCompleted) - Number(a.targetCompleted);
        if (a.remainingMissing !== b.remainingMissing) return a.remainingMissing - b.remainingMissing;
      }
      if (b.cleared !== a.cleared) return b.cleared - a.cleared;
      if (b.assistFill !== a.assistFill) return b.assistFill - a.assistFill;
      if (b.setupGain !== a.setupGain) return b.setupGain - a.setupGain;
      if (b.score !== a.score) return b.score - a.score;
      return a.tie - b.tie;
    });

    const poolSize = assistTarget ? (assistTarget.missing <= 2 ? 2 : 3) : 4;
    const pool = options.slice(0, Math.min(poolSize, options.length));
    if (!pool.length) return 'T';

    const startIndex = this.smartSpawnSeed % pool.length;
    let pick = pool[startIndex];
    for (let offset = 0; offset < pool.length; offset++) {
      const candidate = pool[(startIndex + offset) % pool.length];
      const repeatCount = this.getRecentRepeatCount(candidate.type);
      if (repeatCount < 2 || offset === pool.length - 1) {
        pick = candidate;
        break;
      }
    }

    this.rememberSmartType(pick.type);
    return pick.type;
  }

  drawNextPiece() {
    if (this.smartPieceMode) {
      const smartType = this.selectSmartPieceType();
      return createPiece(smartType, this.grid.width);
    }

    if (this.pieceBag.length === 0) {
      this.refillBag();
    }

    const type = this.pieceBag.shift();
    return createPiece(type, this.grid.width);
  }

  emitEvent(event) {
    this.events.push(event);
  }

  clonePieceState(piece) {
    if (!piece) return null;
    return {
      ...piece,
      shape: piece.shape.map((row) => [...row])
    };
  }

  captureUndoSnapshot() {
    return {
      gridCells: this.grid.cells.map((row) => [...row]),
      smartSpawnSeed: this.smartSpawnSeed,
      recentSmartTypes: [...this.recentSmartTypes],
      pieceBag: [...this.pieceBag],
      currentPiece: this.clonePieceState(this.currentPiece),
      nextPiece: this.clonePieceState(this.nextPiece),
      heldType: this.heldType,
      canHold: this.canHold,
      gameOver: this.gameOver,
      linesCleared: this.linesCleared,
      level: this.level,
      score: this.score,
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      pendingGarbage: this.pendingGarbage,
      forgivenessCharges: this.forgivenessCharges
    };
  }

  undoLastLock() {
    if (!this.lastUndoSnapshot) return false;
    const snapshot = this.lastUndoSnapshot;
    this.grid.cells = snapshot.gridCells.map((row) => [...row]);
    this.smartSpawnSeed = snapshot.smartSpawnSeed;
    this.recentSmartTypes = [...snapshot.recentSmartTypes];
    this.pieceBag = [...snapshot.pieceBag];
    this.currentPiece = this.clonePieceState(snapshot.currentPiece);
    this.nextPiece = this.clonePieceState(snapshot.nextPiece);
    this.heldType = snapshot.heldType;
    this.canHold = snapshot.canHold;
    this.gameOver = snapshot.gameOver;
    this.linesCleared = snapshot.linesCleared;
    this.level = snapshot.level;
    this.score = snapshot.score;
    this.comboCount = snapshot.comboCount;
    this.comboMultiplier = snapshot.comboMultiplier;
    this.pendingGarbage = snapshot.pendingGarbage;
    this.forgivenessCharges = snapshot.forgivenessCharges;
    this.lastUndoSnapshot = null;
    this.events = [];
    this.emitEvent({ type: 'undoApplied' });
    return true;
  }

  consumeEvents() {
    const emitted = this.events;
    this.events = [];
    return emitted;
  }

  enqueueIncomingGarbage(lines) {
    if (this.gameOver || lines <= 0) return;
    this.pendingGarbage += lines;
    this.emitEvent({ type: 'incomingGarbage', pending: this.pendingGarbage });
  }

  applyGarbageLines(count) {
    if (count <= 0 || this.gameOver) return 0;

    let applied = 0;
    for (let i = 0; i < count; i++) {
      const removedTop = this.grid.cells.shift();
      if (removedTop.some((cell) => cell !== 0)) {
        this.gameOver = true;
      }

      const hole = Math.floor(Math.random() * this.grid.width);
      const garbageRow = Array(this.grid.width).fill('G');
      garbageRow[hole] = 0;
      this.grid.cells.push(garbageRow);
      applied += 1;

      if (this.gameOver) break;
    }

    return applied;
  }

  grantForgiveness(charges = 1) {
    const safeCharges = Math.max(0, charges | 0);
    this.forgivenessCharges += safeCharges;
  }

  useForgivingNudge(dy) {
    if (this.forgivenessCharges <= 0 || dy <= 0 || this.gameOver) return false;

    const nudgeCandidates = [-1, 1];
    for (const nudgeX of nudgeCandidates) {
      const nudged = {
        ...this.currentPiece,
        x: this.currentPiece.x + nudgeX,
        y: this.currentPiece.y + dy
      };

      if (!this.grid.checkCollision(nudged)) {
        this.currentPiece = nudged;
        this.forgivenessCharges = Math.max(0, this.forgivenessCharges - 1);
        this.emitEvent({ type: 'forgivenessUsed', remaining: this.forgivenessCharges });
        return true;
      }
    }

    return false;
  }

  move(dx, dy, options = {}) {
    const { lockOnFail = true, softDrop = false } = options;
    if (this.gameOver) return false;

    const newPiece = {
      ...this.currentPiece,
      x: this.currentPiece.x + dx,
      y: this.currentPiece.y + dy
    };

    if (!this.grid.checkCollision(newPiece)) {
      this.currentPiece = newPiece;
      if (softDrop && dy > 0) {
        this.score += 1;
      }
      return true;
    } else if (dy > 0 && lockOnFail) {
      if (this.useForgivingNudge(dy)) {
        if (softDrop && dy > 0) {
          this.score += 1;
        }
        return true;
      }
      this.lockPiece({ source: softDrop ? 'softDrop' : 'gravity' });
    }

    return false;
  }

  moveLeft() {
    return this.move(-1, 0);
  }

  moveRight() {
    return this.move(1, 0);
  }

  moveDown() {
    return this.move(0, 1);
  }

  softDrop() {
    return this.move(0, 1, { softDrop: true });
  }

  rotate(direction = 1) {
    if (this.gameOver) return false;

    const fromState = this.currentPiece.rotation;
    const toState = (fromState + direction + 4) % 4;
    const rotatedShape = direction === 1
      ? rotateShapeClockwise(this.currentPiece.shape)
      : rotateShapeCounterClockwise(this.currentPiece.shape);

    const basePiece = {
      ...this.currentPiece,
      shape: rotatedShape,
      rotation: toState
    };

    const kicks = getWallKickOffsets(this.currentPiece.type, fromState, toState);
    for (const [offsetX, offsetY] of kicks) {
      const candidate = {
        ...basePiece,
        x: basePiece.x + offsetX,
        y: basePiece.y + offsetY
      };

      if (!this.grid.checkCollision(candidate)) {
        this.currentPiece = candidate;
        return true;
      }
    }

    return false;
  }

  hardDrop() {
    if (this.gameOver) return;

    let droppedRows = 0;
    while (this.move(0, 1, { lockOnFail: false })) {
      droppedRows += 1;
    }

    this.score += droppedRows * 2;
    this.lockPiece({ source: 'hardDrop', dropDistance: droppedRows });
  }

  holdPiece() {
    if (this.gameOver || !this.canHold) {
      return false;
    }

    const currentType = this.currentPiece.type;

    if (this.heldType === null) {
      this.heldType = currentType;
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.drawNextPiece();
    } else {
      const swapType = this.heldType;
      this.heldType = currentType;
      this.currentPiece = createPiece(swapType, this.grid.width);
    }

    this.canHold = false;

    if (this.grid.checkCollision(this.currentPiece)) {
      this.gameOver = true;
      this.emitEvent({ type: 'gameOver' });
      return false;
    }

    return true;
  }

  hasBlockAboveVisibleArea(piece) {
    const { shape, y } = piece;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] && y + row < 0) {
          return true;
        }
      }
    }

    return false;
  }

  getVisiblePieceCells(piece) {
    const cells = [];
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardY >= 0) {
          cells.push({ x: boardX, y: boardY });
        }
      });
    });
    return cells;
  }

  evaluatePlacementQuality(piece) {
    const cells = this.getVisiblePieceCells(piece);
    if (!cells.length) {
      return { perfectFit: false, tightPlacement: false };
    }

    let supportedCells = 0;
    let sideContacts = 0;

    cells.forEach((cell) => {
      const belowY = cell.y + 1;
      if (belowY >= this.grid.height || this.grid.cells[belowY][cell.x] !== 0) {
        supportedCells += 1;
      }

      const leftBlocked = cell.x === 0 || this.grid.cells[cell.y][cell.x - 1] !== 0;
      const rightBlocked = cell.x === this.grid.width - 1 || this.grid.cells[cell.y][cell.x + 1] !== 0;
      if (leftBlocked || rightBlocked) {
        sideContacts += 1;
      }
    });

    const supportRatio = supportedCells / cells.length;
    const sideRatio = sideContacts / cells.length;

    return {
      perfectFit: supportRatio === 1 && sideRatio >= 0.7,
      tightPlacement: supportRatio >= 0.8 && sideRatio >= 0.5
    };
  }

  findChainCandidateLine() {
    for (let y = this.grid.height - 1; y >= 0; y--) {
      const row = this.grid.cells[y];
      const filled = row.reduce((count, cell) => (cell !== 0 ? count + 1 : count), 0);
      if (filled >= this.grid.width - 1 && filled < this.grid.width) {
        return y;
      }
    }
    return -1;
  }

  lockPiece(lockMeta = {}) {
    const { source = 'gravity', dropDistance = 0 } = lockMeta;
    this.lastUndoSnapshot = this.captureUndoSnapshot();

    if (this.hasBlockAboveVisibleArea(this.currentPiece)) {
      this.gameOver = true;
      this.emitEvent({ type: 'gameOver' });
      return;
    }

    const lockedCells = this.getVisiblePieceCells(this.currentPiece);
    const placementQuality = this.evaluatePlacementQuality(this.currentPiece);
    this.grid.merge(this.currentPiece);
    const clearResult = this.grid.clearLines();
    let cleared = clearResult.count;
    const clearedLines = [...clearResult.lines];
    let chainCount = 0;
    let garbageSent = 0;

    this.emitEvent({
      type: 'pieceLock',
      source,
      dropDistance,
      cells: lockedCells,
      perfectFit: placementQuality.perfectFit,
      tightPlacement: placementQuality.tightPlacement
    });

    if (cleared > 0) {
      // Chain reaction clears: near-full rows can ignite into bonus clears.
      while (chainCount < 2) {
        const chance = chainCount === 0 ? 0.28 : 0.16;
        if (Math.random() > chance) break;
        const candidateLine = this.findChainCandidateLine();
        if (candidateLine < 0) break;

        this.grid.cells[candidateLine] = Array(this.grid.width).fill('C');
        const chainResult = this.grid.clearLines();
        if (chainResult.count <= 0) break;

        chainCount += chainResult.count;
        cleared += chainResult.count;
        clearedLines.push(...chainResult.lines);
      }

      this.linesCleared += cleared;
      this.level = 1 + Math.floor(this.linesCleared / 10);
      const lineClearScore = (LINE_CLEAR_POINTS[Math.min(4, cleared)] || 0) + Math.max(0, cleared - 4) * 260;
      this.score += lineClearScore * this.level;

      this.comboCount += 1;
      this.comboMultiplier = 1 + Math.max(0, this.comboCount - 1) * 0.25;
      const baseGarbage = GARBAGE_BY_CLEAR[cleared] || 0;
      garbageSent = Math.floor(baseGarbage * this.comboMultiplier);

      if (garbageSent > 0 && this.pendingGarbage > 0) {
        const canceled = Math.min(this.pendingGarbage, garbageSent);
        this.pendingGarbage -= canceled;
        garbageSent -= canceled;
        this.emitEvent({ type: 'incomingGarbage', pending: this.pendingGarbage });
      }

      this.emitEvent({
        type: 'lineClear',
        count: cleared,
        lines: clearedLines,
        chainCount,
        comboCount: this.comboCount,
        comboMultiplier: this.comboMultiplier,
        garbageSent
      });
    } else {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }

    if (this.pendingGarbage > 0) {
      const appliedGarbage = this.applyGarbageLines(this.pendingGarbage);
      this.pendingGarbage = Math.max(0, this.pendingGarbage - appliedGarbage);
      this.emitEvent({ type: 'incomingGarbage', pending: this.pendingGarbage });
      this.emitEvent({ type: 'garbageApplied', count: appliedGarbage });

      if (this.gameOver) {
        this.emitEvent({ type: 'gameOver' });
        return;
      }
    }

    this.currentPiece = this.nextPiece;
    this.nextPiece = this.drawNextPiece();
    this.canHold = true;

    if (this.grid.checkCollision(this.currentPiece)) {
      this.gameOver = true;
      this.emitEvent({ type: 'gameOver' });
    }
  }

  getGravityIntervalMs() {
    return Math.max(100, 550 - (this.level - 1) * 35);
  }

  reset() {
    this.grid.reset();
    this.smartSpawnSeed = 0;
    this.recentSmartTypes = [];
    this.pieceBag = [];
    this.currentPiece = this.drawNextPiece();
    this.nextPiece = this.drawNextPiece();
    this.heldType = null;
    this.canHold = true;
    this.gameOver = false;
    this.linesCleared = 0;
    this.level = 1;
    this.score = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.pendingGarbage = 0;
    this.forgivenessCharges = 0;
    this.events = [];
    this.lastUndoSnapshot = null;
  }
}
