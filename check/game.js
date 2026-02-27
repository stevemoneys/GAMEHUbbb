const PLAYER = {
  WHITE: "white",
  BLACK: "black"
};

const DIRS = {
  diagonal: [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 }
  ],
  orthogonal: [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ]
};

const VARIANTS = [
  {
    id: "american",
    name: "American checkers",
    flag: "assets/flags/american.jpg",
    boardSize: 8,
    piecesPerPlayer: 12,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: false,
    captureMandatory: true,
    maxCapture: false,
    kingType: "short",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8",
      "Pieces: 12 per player (dark squares only)",
      "Men move: Diagonal forward only",
      "Men capture backward? No",
      "Capture mandatory? Yes",
      "Max capture required? No",
      "King type: Short king (1 square, forward and backward)"
    ]
  },
  {
    id: "international",
    name: "International",
    flag: "assets/flags/international.jpg",
    boardSize: 10,
    piecesPerPlayer: 20,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: true,
    captureMandatory: true,
    maxCapture: true,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 10x10",
      "Pieces: 20 per player",
      "Men move: Diagonal forward",
      "Men capture backward? Yes",
      "Capture mandatory? Yes",
      "Must capture maximum pieces? Yes",
      "King type: Flying king (moves any distance diagonally)"
    ]
  },
  {
    id: "russian",
    name: "Russian",
    flag: "assets/flags/russian.jpg",
    boardSize: 8,
    piecesPerPlayer: 12,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: true,
    captureMandatory: true,
    maxCapture: false,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8",
      "Pieces: 12 per player",
      "Men move: Diagonal forward",
      "Men capture backward? Yes",
      "Capture mandatory? Yes",
      "Max capture rule? No",
      "King type: Flying king"
    ]
  },
  {
    id: "turkey",
    name: "Turkey",
    flag: "assets/flags/turkey.jpg",
    boardSize: 8,
    piecesPerPlayer: 16,
    playable: "all",
    movement: "orthogonal",
    menCaptureBackward: false,
    captureMandatory: true,
    maxCapture: false,
    kingType: "flying",
    kingMovement: "orthogonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8 (all squares used)",
      "Pieces: 16 per player",
      "Men move: Forward or sideways (not diagonal)",
      "Men capture backward? No",
      "Capture mandatory? Yes",
      "King type: Rook-style (moves any distance forward/back/side)"
    ]
  },
  {
    id: "italy",
    name: "Italy",
    flag: "assets/flags/italy.jpg",
    boardSize: 8,
    piecesPerPlayer: 12,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: false,
    captureMandatory: true,
    maxCapture: true,
    kingType: "short",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8",
      "Pieces: 12 per player",
      "Men move: Diagonal forward",
      "Men capture backward? No",
      "Capture mandatory? Yes",
      "Must capture maximum pieces? Yes (very strict rules)",
      "King type: Short king (1 square only)"
    ]
  },
  {
    id: "spain",
    name: "Spain",
    flag: "assets/flags/spain.jpg",
    boardSize: 8,
    piecesPerPlayer: 12,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: true,
    captureMandatory: true,
    maxCapture: true,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8",
      "Pieces: 12 per player",
      "Men move: Diagonal forward",
      "Men capture backward? Yes",
      "Capture mandatory? Yes",
      "Must capture maximum pieces? Yes",
      "King type: Flying king"
    ]
  },
  {
    id: "canada",
    name: "Canada",
    flag: "assets/flags/canada.jpg",
    boardSize: 12,
    piecesPerPlayer: 30,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: true,
    captureMandatory: true,
    maxCapture: true,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 12x12",
      "Pieces: 30 per player",
      "Men capture backward? Yes",
      "Capture mandatory? Yes",
      "Max capture rule? Yes",
      "King type: Flying king"
    ]
  },
  {
    id: "thailand",
    name: "Thailand",
    flag: "assets/flags/thailand.jpg",
    boardSize: 8,
    piecesPerPlayer: 8,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: true,
    captureMandatory: true,
    maxCapture: false,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: true,
    rules: [
      "Board: 8x8",
      "Pieces: 8 per player",
      "Men capture backward? Yes",
      "Capture mandatory? Yes",
      "King type: Flying king",
      "Special rule: King must land directly behind captured piece (not anywhere)"
    ]
  },
  {
    id: "czech",
    name: "Czech republic",
    flag: "assets/flags/czech-republic.jpg",
    boardSize: 8,
    piecesPerPlayer: 12,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: false,
    captureMandatory: true,
    maxCapture: true,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8",
      "Pieces: 12 per player",
      "Men capture backward? No",
      "Capture mandatory? Yes",
      "Max capture rule? Yes",
      "King type: Flying king"
    ]
  },
  {
    id: "armenia",
    name: "Armenia",
    flag: "assets/flags/armenia.jpg",
    boardSize: 8,
    piecesPerPlayer: 12,
    playable: "dark",
    movement: "diagonal",
    menCaptureBackward: true,
    captureMandatory: true,
    maxCapture: false,
    kingType: "flying",
    kingMovement: "diagonal",
    thaiLanding: false,
    rules: [
      "Board: 8x8",
      "Pieces: 12 per player",
      "Men capture backward? Yes",
      "Capture mandatory? Yes",
      "Max capture rule? No",
      "King type: Flying king"
    ]
  }
];

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Expert",
  "Professional",
  "Master",
  "Grandmaster"
];
const TIERS_PER_LEVEL = 10;

class GameState {
  constructor(variant) {
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.setVariant(variant);
  }

  setVariant(variant) {
    this.variant = variant;
    this.size = variant.boardSize;
    this.board = this.createEmptyBoard(this.size);
    this.currentPlayer = PLAYER.WHITE;
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.initializePieces();
  }

  createEmptyBoard(size) {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  }

  isDarkSquare(row, col) {
    return (row + col) % 2 === 1;
  }

  isPlayableSquare(row, col) {
    return this.variant.playable === "all" || this.isDarkSquare(row, col);
  }

  isInside(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  getPiece(row, col) {
    return this.isInside(row, col) ? this.board[row][col] : null;
  }

  setPiece(row, col, piece) {
    if (this.isInside(row, col)) this.board[row][col] = piece;
  }

  initializePieces() {
    if (this.variant.playable === "all" && this.variant.movement === "orthogonal") {
      this.placeRowsOnAllSquares();
      return;
    }
    let black = this.variant.piecesPerPlayer;
    let white = this.variant.piecesPerPlayer;
    for (let r = 0; r < this.size && black > 0; r++) {
      for (let c = 0; c < this.size && black > 0; c++) {
        if (!this.isPlayableSquare(r, c)) continue;
        this.board[r][c] = { player: PLAYER.BLACK, king: false };
        black -= 1;
      }
    }
    for (let r = this.size - 1; r >= 0 && white > 0; r--) {
      for (let c = this.size - 1; c >= 0 && white > 0; c--) {
        if (!this.isPlayableSquare(r, c)) continue;
        if (this.board[r][c]) continue;
        this.board[r][c] = { player: PLAYER.WHITE, king: false };
        white -= 1;
      }
    }
  }

  placeRowsOnAllSquares() {
    if (this.variant.id === "turkey") {
      for (let c = 0; c < this.size; c++) {
        this.board[1][c] = { player: PLAYER.BLACK, king: false };
        this.board[2][c] = { player: PLAYER.BLACK, king: false };
        this.board[this.size - 3][c] = { player: PLAYER.WHITE, king: false };
        this.board[this.size - 2][c] = { player: PLAYER.WHITE, king: false };
      }
      return;
    }
    let black = this.variant.piecesPerPlayer;
    let white = this.variant.piecesPerPlayer;
    for (let r = 0; r < this.size && black > 0; r++) {
      for (let c = 0; c < this.size && black > 0; c++) {
        this.board[r][c] = { player: PLAYER.BLACK, king: false };
        black -= 1;
      }
    }
    for (let r = this.size - 1; r >= 0 && white > 0; r--) {
      for (let c = this.size - 1; c >= 0 && white > 0; c--) {
        if (this.board[r][c]) continue;
        this.board[r][c] = { player: PLAYER.WHITE, king: false };
        white -= 1;
      }
    }
  }

  getForward(player) {
    return player === PLAYER.WHITE ? -1 : 1;
  }

  getMenMoveDirs(player) {
    const f = this.getForward(player);
    if (this.variant.movement === "orthogonal") {
      return [{ dr: f, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    }
    return [{ dr: f, dc: -1 }, { dr: f, dc: 1 }];
  }

  getMenCaptureDirs(player) {
    const dirs = this.getMenMoveDirs(player).slice();
    if (this.variant.movement === "orthogonal") {
      if (this.variant.menCaptureBackward) dirs.push({ dr: -this.getForward(player), dc: 0 });
      return dirs;
    }
    if (this.variant.menCaptureBackward) {
      const f = this.getForward(player);
      dirs.push({ dr: -f, dc: -1 }, { dr: -f, dc: 1 });
    }
    return dirs;
  }

  getKingDirs() {
    return this.variant.kingMovement === "orthogonal" ? DIRS.orthogonal : DIRS.diagonal;
  }

  shouldPromote(piece, row) {
    if (piece.king) return false;
    return piece.player === PLAYER.WHITE ? row === 0 : row === this.size - 1;
  }

  promoteIfNeeded(row, col) {
    const piece = this.getPiece(row, col);
    if (piece && this.shouldPromote(piece, row)) piece.king = true;
  }

  movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = this.getPiece(fromRow, fromCol);
    if (!piece) return false;
    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, null);
    return true;
  }

  getSimpleMovesFor(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];
    if (piece.king && this.variant.kingType === "flying") {
      return this.getFlyingMoves(row, col, this.getKingDirs());
    }
    const dirs = piece.king ? this.getKingDirs() : this.getMenMoveDirs(piece.player);
    return this.getShortMoves(row, col, dirs);
  }

  getShortMoves(row, col, dirs) {
    const moves = [];
    for (const d of dirs) {
      const r = row + d.dr;
      const c = col + d.dc;
      if (!this.isInside(r, c) || !this.isPlayableSquare(r, c) || this.getPiece(r, c)) continue;
      moves.push({ row: r, col: c });
    }
    return moves;
  }

  getFlyingMoves(row, col, dirs) {
    const moves = [];
    for (const d of dirs) {
      let r = row + d.dr;
      let c = col + d.dc;
      while (this.isInside(r, c) && !this.getPiece(r, c)) {
        if (this.isPlayableSquare(r, c)) moves.push({ row: r, col: c });
        r += d.dr;
        c += d.dc;
      }
    }
    return moves;
  }

  getCaptureMovesFor(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];
    if (piece.king && this.variant.kingType === "flying") return this.getFlyingCaptures(row, col, piece);
    const dirs = piece.king ? this.getKingDirs() : this.getMenCaptureDirs(piece.player);
    return this.getShortCaptures(row, col, piece, dirs);
  }

  getShortCaptures(row, col, piece, dirs) {
    const moves = [];
    for (const d of dirs) {
      const er = row + d.dr;
      const ec = col + d.dc;
      const lr = row + d.dr * 2;
      const lc = col + d.dc * 2;
      if (!this.isInside(lr, lc) || !this.isPlayableSquare(lr, lc) || this.getPiece(lr, lc)) continue;
      const enemy = this.getPiece(er, ec);
      if (!enemy || enemy.player === piece.player) continue;
      moves.push({ row: lr, col: lc, capture: { row: er, col: ec } });
    }
    return moves;
  }

  getFlyingCaptures(row, col, piece) {
    const moves = [];
    for (const d of this.getKingDirs()) {
      let r = row + d.dr;
      let c = col + d.dc;
      let enemy = null;
      while (this.isInside(r, c)) {
        const cell = this.getPiece(r, c);
        if (!cell) {
          if (enemy && this.isPlayableSquare(r, c)) {
            moves.push({ row: r, col: c, capture: { row: enemy.row, col: enemy.col } });
            if (this.variant.thaiLanding) break;
          }
          r += d.dr;
          c += d.dc;
          continue;
        }
        if (cell.player === piece.player || enemy) break;
        enemy = { row: r, col: c };
        r += d.dr;
        c += d.dc;
      }
    }
    return moves;
  }

  countPieces(player) {
    let total = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.player === player) total += 1;
      }
    }
    return total;
  }

  cloneBoard(board) {
    return board.map(row => row.map(cell => (cell ? { player: cell.player, king: cell.king } : null)));
  }

  applyCaptureToClone(board, fromRow, fromCol, move) {
    const cloned = this.cloneBoard(board);
    const piece = cloned[fromRow][fromCol];
    if (!piece) return null;
    cloned[fromRow][fromCol] = null;
    if (move.capture) cloned[move.capture.row][move.capture.col] = null;
    const moved = { player: piece.player, king: piece.king };
    if (!moved.king) {
      if ((moved.player === PLAYER.WHITE && move.row === 0) ||
          (moved.player === PLAYER.BLACK && move.row === this.size - 1)) moved.king = true;
    }
    cloned[move.row][move.col] = moved;
    return { board: cloned, piece: moved };
  }

  getCaptureMovesFromBoard(board, row, col, piece) {
    const saved = this.board;
    this.board = board;
    const result = this.getCaptureMovesFor(row, col);
    this.board = saved;
    return result;
  }

  evaluateCaptureDepth(board, row, col, piece) {
    const caps = this.getCaptureMovesFromBoard(board, row, col, piece);
    if (!caps.length) return 0;
    let best = 0;
    for (const move of caps) {
      const applied = this.applyCaptureToClone(board, row, col, move);
      if (!applied) continue;
      const score = 1 + this.evaluateCaptureDepth(applied.board, move.row, move.col, applied.piece);
      if (score > best) best = score;
    }
    return best;
  }

  filterCapturesForPosition(row, col, captures) {
    if (!this.variant.maxCapture || !captures.length) return captures;
    const piece = this.getPiece(row, col);
    if (!piece) return captures;
    let best = -1;
    const scored = [];
    for (const move of captures) {
      const applied = this.applyCaptureToClone(this.board, row, col, move);
      if (!applied) continue;
      const score = 1 + this.evaluateCaptureDepth(applied.board, move.row, move.col, applied.piece);
      scored.push({ move, score });
      if (score > best) best = score;
    }
    return scored.filter(item => item.score === best).map(item => item.move);
  }

  getCaptureMapForPlayer(player) {
    const rawMap = {};
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const piece = this.getPiece(r, c);
        if (!piece || piece.player !== player) continue;
        const caps = this.filterCapturesForPosition(r, c, this.getCaptureMovesFor(r, c));
        if (caps.length) rawMap[`${r},${c}`] = caps;
      }
    }
    if (!this.variant.maxCapture) return rawMap;

    let globalMax = -1;
    const scored = {};
    for (const key of Object.keys(rawMap)) {
      const [r, c] = key.split(",").map(Number);
      const piece = this.getPiece(r, c);
      scored[key] = [];
      for (const move of rawMap[key]) {
        const applied = this.applyCaptureToClone(this.board, r, c, move);
        if (!piece || !applied) continue;
        const score = 1 + this.evaluateCaptureDepth(applied.board, move.row, move.col, applied.piece);
        scored[key].push({ move, score });
        if (score > globalMax) globalMax = score;
      }
    }

    const filtered = {};
    for (const key of Object.keys(scored)) {
      const keep = scored[key].filter(item => item.score === globalMax).map(item => item.move);
      if (keep.length) filtered[key] = keep;
    }
    return filtered;
  }

  getAllLegalMovesForPlayer(player) {
    const captureMap = this.getCaptureMapForPlayer(player);
    const captureKeys = Object.keys(captureMap);
    if (this.variant.captureMandatory && captureKeys.length) {
      const forcedMoves = [];
      for (const key of captureKeys) {
        const [r, c] = key.split(",").map(Number);
        for (const move of captureMap[key]) forcedMoves.push({ fromRow: r, fromCol: c, ...move });
      }
      return { forced: true, moves: forcedMoves, captureMap };
    }

    const simpleMoves = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const piece = this.getPiece(r, c);
        if (!piece || piece.player !== player) continue;
        for (const move of this.getSimpleMovesFor(r, c)) simpleMoves.push({ fromRow: r, fromCol: c, ...move });
      }
    }
    if (!this.variant.captureMandatory && captureKeys.length) {
      const optionalCaptures = [];
      for (const key of captureKeys) {
        const [r, c] = key.split(",").map(Number);
        for (const move of captureMap[key]) optionalCaptures.push({ fromRow: r, fromCol: c, ...move });
      }
      return { forced: false, moves: [...optionalCaptures, ...simpleMoves], captureMap: {} };
    }
    return { forced: false, moves: simpleMoves, captureMap: {} };
  }
}

class LegalMoveEngine {
  constructor(gameState) {
    this.gameState = gameState;
  }

  getTurnContext(player, mustContinue = null) {
    if (mustContinue) {
      const piece = this.gameState.getPiece(mustContinue.row, mustContinue.col);
      if (!piece || piece.player !== player) return { forced: false, captureMap: {}, allMoves: [] };
      const caps = this.gameState.filterCapturesForPosition(
        mustContinue.row,
        mustContinue.col,
        this.gameState.getCaptureMovesFor(mustContinue.row, mustContinue.col)
      );
      const map = caps.length ? { [`${mustContinue.row},${mustContinue.col}`]: caps } : {};
      return {
        forced: caps.length > 0,
        captureMap: map,
        allMoves: caps.map(move => ({ fromRow: mustContinue.row, fromCol: mustContinue.col, ...move }))
      };
    }
    const legal = this.gameState.getAllLegalMovesForPlayer(player);
    return { forced: legal.forced, captureMap: legal.captureMap, allMoves: legal.moves };
  }

  getPieceMoves(player, row, col, mustContinue = null) {
    const piece = this.gameState.getPiece(row, col);
    if (!piece || piece.player !== player) return [];
    const context = this.getTurnContext(player, mustContinue);
    if (context.forced) return context.captureMap[`${row},${col}`] || [];
    const simple = this.gameState.getSimpleMovesFor(row, col);
    if (!this.gameState.variant.captureMandatory) {
      const captures = this.gameState.filterCapturesForPosition(
        row,
        col,
        this.gameState.getCaptureMovesFor(row, col)
      );
      return [...captures, ...simple];
    }
    return simple;
  }

  validateMove(player, fromRow, fromCol, toRow, toCol, mustContinue = null) {
    const context = this.getTurnContext(player, mustContinue);
    const move = context.allMoves.find(
      item => item.fromRow === fromRow && item.fromCol === fromCol && item.row === toRow && item.col === toCol
    );
    return { isLegal: Boolean(move), move: move || null };
  }
}

class Renderer {
  constructor(boardElement, gameState, capturedWhiteElement, capturedBlackElement) {
    this.boardElement = boardElement;
    this.gameState = gameState;
    this.capturedWhiteElement = capturedWhiteElement;
    this.capturedBlackElement = capturedBlackElement;
    this.flipBoard = false;
    this.coordTopElement = document.getElementById("board-coord-top");
    this.coordBottomElement = document.getElementById("board-coord-bottom");
    this.coordLeftElement = document.getElementById("board-coord-left");
    this.coordRightElement = document.getElementById("board-coord-right");
  }

  setPerspective(player) {
    this.flipBoard = player === PLAYER.BLACK;
  }

  fileLabel(index) {
    let n = index + 1;
    let out = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      out = String.fromCharCode(65 + rem) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out;
  }

  renderCoordinates() {
    if (!this.coordTopElement || !this.coordBottomElement || !this.coordLeftElement || !this.coordRightElement) return;
    const size = this.gameState.size;
    this.coordTopElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.coordBottomElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.coordLeftElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    this.coordRightElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    this.coordTopElement.innerHTML = "";
    this.coordBottomElement.innerHTML = "";
    this.coordLeftElement.innerHTML = "";
    this.coordRightElement.innerHTML = "";

    for (let dc = 0; dc < size; dc++) {
      const c = this.flipBoard ? size - 1 - dc : dc;
      const label = this.fileLabel(c);
      const topCell = document.createElement("span");
      topCell.className = "coord-cell";
      topCell.textContent = label;
      this.coordTopElement.appendChild(topCell);

      const bottomCell = document.createElement("span");
      bottomCell.className = "coord-cell";
      bottomCell.textContent = label;
      this.coordBottomElement.appendChild(bottomCell);
    }

    for (let dr = 0; dr < size; dr++) {
      const r = this.flipBoard ? size - 1 - dr : dr;
      const label = String(size - r);
      const leftCell = document.createElement("span");
      leftCell.className = "coord-cell";
      leftCell.textContent = label;
      this.coordLeftElement.appendChild(leftCell);

      const rightCell = document.createElement("span");
      rightCell.className = "coord-cell";
      rightCell.textContent = label;
      this.coordRightElement.appendChild(rightCell);
    }
  }

  renderBoard() {
    this.boardElement.innerHTML = "";
    this.boardElement.style.gridTemplateColumns = `repeat(${this.gameState.size}, 1fr)`;
    this.boardElement.style.gridTemplateRows = `repeat(${this.gameState.size}, 1fr)`;
    for (let dr = 0; dr < this.gameState.size; dr++) {
      for (let dc = 0; dc < this.gameState.size; dc++) {
        const r = this.flipBoard ? this.gameState.size - 1 - dr : dr;
        const c = this.flipBoard ? this.gameState.size - 1 - dc : dc;
        const square = document.createElement("div");
        square.classList.add("square", this.gameState.isDarkSquare(dr, dc) ? "dark" : "light");
        square.dataset.row = String(r);
        square.dataset.col = String(c);
        const piece = this.gameState.getPiece(r, c);
        if (piece) {
          const el = document.createElement("div");
          el.classList.add("piece", piece.player);
          if (piece.king) el.classList.add("king");
          square.appendChild(el);
        }
        this.boardElement.appendChild(square);
      }
    }
    this.renderCoordinates();
  }

  renderCaptured() {
    this.capturedWhiteElement.innerHTML = "";
    this.capturedBlackElement.innerHTML = "";
    for (const piece of this.gameState.capturedBlack) {
      const token = document.createElement("div");
      token.classList.add("tray-piece", piece.player);
      if (piece.king) token.classList.add("king");
      this.capturedBlackElement.appendChild(token);
    }
    for (const piece of this.gameState.capturedWhite) {
      const token = document.createElement("div");
      token.classList.add("tray-piece", piece.player);
      if (piece.king) token.classList.add("king");
      this.capturedWhiteElement.appendChild(token);
    }
  }
}
class GameController {
  constructor(boardElement, gameState, renderer, legalMoveEngine, modalElement, modalCloseButton) {
    this.boardElement = boardElement;
    this.gameState = gameState;
    this.renderer = renderer;
    this.legalMoveEngine = legalMoveEngine;
    this.modalElement = modalElement;
    this.modalCloseButton = modalCloseButton;
    this.selected = null;
    this.legalMoves = [];
    this.captureMap = {};
    this.mustContinue = null;
    this.aiEnabled = true;
    this.humanPlayer = PLAYER.WHITE;
    this.aiPlayer = PLAYER.BLACK;
    this.aiBusy = false;
    this.gameOver = false;
    this.aiProfile = { levelIndex: 0, tier: 1 };
    this.matchVariantId = null;
    this.onPlayerWin = null;
    this.onGameEnd = null;
    this.moveHistory = [];
    this.freezeAiArmed = false;
    this.freezeAiUsedThisMatch = false;
    this.mistakeShieldArmed = false;
    this.mistakeShieldTriggered = false;
  }

  init() {
    this.boardElement.addEventListener("click", event => {
      if (this.aiBusy || this.gameOver) return;
      if (this.aiEnabled && this.gameState.currentPlayer === this.aiPlayer) return;
      const square = event.target.closest(".square");
      if (!square) return;
      this.handleClick(Number(square.dataset.row), Number(square.dataset.col));
    });
    this.modalCloseButton.addEventListener("click", () => this.hideModal());
    this.modalElement.addEventListener("click", event => {
      if (event.target === this.modalElement) this.hideModal();
    });
  }

  startMatch(variant, aiEnabled, aiProfile = null, options = null) {
    this.gameState.setVariant(variant);
    this.aiEnabled = aiEnabled;
    this.humanPlayer = options?.humanPlayer || PLAYER.WHITE;
    this.aiPlayer = options?.aiPlayer || (this.humanPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE);
    this.aiProfile = aiProfile || { levelIndex: 0, tier: 1 };
    this.matchVariantId = variant.id;
    this.aiBusy = false;
    this.gameOver = false;
    this.mustContinue = null;
    this.moveHistory = [];
    this.freezeAiArmed = false;
    this.freezeAiUsedThisMatch = false;
    this.mistakeShieldArmed = false;
    this.mistakeShieldTriggered = false;
    this.gameState.currentPlayer = options?.firstPlayer || PLAYER.WHITE;
    this.renderer.setPerspective(this.humanPlayer);
    this.clearSelection();
    this.refresh();
    if (this.aiEnabled && this.gameState.currentPlayer === this.aiPlayer) this.performAiTurn();
  }

  refresh() {
    const context = this.legalMoveEngine.getTurnContext(this.gameState.currentPlayer, this.mustContinue);
    this.captureMap = context.captureMap;
    this.renderer.renderBoard();
    this.renderer.renderCaptured();
    this.refreshHighlights();
    this.checkGameOver();
  }

  handleClick(row, col) {
    if (this.selected) {
      const validation = this.legalMoveEngine.validateMove(
        this.gameState.currentPlayer,
        this.selected.row,
        this.selected.col,
        row,
        col,
        this.mustContinue
      );
      if (validation.isLegal) {
        this.executeMove(this.selected.row, this.selected.col, validation.move);
        return;
      }
    }

    const piece = this.gameState.getPiece(row, col);
    if (piece && piece.player === this.gameState.currentPlayer) {
      if (this.mustContinue && (this.mustContinue.row !== row || this.mustContinue.col !== col)) {
        this.showModal();
        return;
      }
      const context = this.legalMoveEngine.getTurnContext(this.gameState.currentPlayer, this.mustContinue);
      if (context.forced && !this.captureMap[`${row},${col}`]) {
        this.showModal();
        return;
      }
      this.selected = { row, col };
      playSfx("pieceSelect");
      this.legalMoves = this.legalMoveEngine.getPieceMoves(
        this.gameState.currentPlayer,
        row,
        col,
        this.mustContinue
      );
      this.refreshHighlights();
      return;
    }
    this.clearSelection();
    this.refreshHighlights();
  }

  executeMove(fromRow, fromCol, move) {
    const validation = this.legalMoveEngine.validateMove(
      this.gameState.currentPlayer,
      fromRow,
      fromCol,
      move.row,
      move.col,
      this.mustContinue
    );
    if (!validation.isLegal) {
      this.showModal();
      return;
    }
    this.moveHistory.push(this.createSnapshot());
    if (this.moveHistory.length > 300) this.moveHistory.shift();
    const selectedMove = validation.move;
    const movingPiece = this.gameState.getPiece(fromRow, fromCol);
    const wasKingBeforeMove = Boolean(movingPiece && movingPiece.king);
    if (
      this.aiEnabled &&
      this.gameState.currentPlayer === this.humanPlayer &&
      this.mistakeShieldArmed &&
      !this.mistakeShieldTriggered &&
      !this.mustContinue
    ) {
      const snap = this.createSnapshot();
      this.applyMoveForSearch({ fromRow, fromCol, row: selectedMove.row, col: selectedMove.col });
      const oppContext = this.legalMoveEngine.getTurnContext(this.aiPlayer, this.mustContinue);
      const blunder = oppContext.allMoves.some(
        item => item.capture && item.capture.row === selectedMove.row && item.capture.col === selectedMove.col
      );
      this.restoreSnapshot(snap);
      if (blunder) {
        this.mistakeShieldArmed = false;
        this.mistakeShieldTriggered = true;
        playSfx("mistakeShield");
        this.showCustomModal("Mistake Shield", "This move loses a piece.");
        return;
      }
    }
    if (selectedMove.capture) {
      const captured = this.gameState.getPiece(selectedMove.capture.row, selectedMove.capture.col);
      if (captured) {
        const snapshot = { player: captured.player, king: captured.king };
        if (captured.player === PLAYER.WHITE) this.gameState.capturedWhite.push(snapshot);
        else this.gameState.capturedBlack.push(snapshot);
      }
      this.gameState.setPiece(selectedMove.capture.row, selectedMove.capture.col, null);
      playSfx("capture");
    }

    this.gameState.movePiece(fromRow, fromCol, selectedMove.row, selectedMove.col);
    this.gameState.promoteIfNeeded(selectedMove.row, selectedMove.col);
    playSfx("validMove");
    const movedPiece = this.gameState.getPiece(selectedMove.row, selectedMove.col);
    const isRewardTurn = !this.aiEnabled || this.gameState.currentPlayer === this.humanPlayer;
    if (!wasKingBeforeMove && movedPiece && movedPiece.king) {
      playSfx("kingPromotion");
      if (isRewardTurn) queueGameplayReward("King Formed Reward", KING_FORMED_REWARD);
    }

    const moreCaptures = this.gameState.filterCapturesForPosition(
      selectedMove.row,
      selectedMove.col,
      this.gameState.getCaptureMovesFor(selectedMove.row, selectedMove.col)
    );
    if (selectedMove.capture && moreCaptures.length) {
      playSfx("multiCapture");
      if (isRewardTurn) queueGameplayReward("Multi-Capture Reward", MULTI_CAPTURE_REWARD);
      this.mustContinue = { row: selectedMove.row, col: selectedMove.col };
      this.selected = { row: selectedMove.row, col: selectedMove.col };
      this.legalMoves = moreCaptures;
      this.refresh();
      if (this.aiEnabled && this.gameState.currentPlayer === this.aiPlayer) this.performAiContinuation();
      return;
    }

    this.mustContinue = null;
    this.clearSelection();
    this.switchPlayer();
    this.refresh();
    if (!this.gameOver && this.aiEnabled && this.gameState.currentPlayer === this.aiPlayer) this.performAiTurn();
  }

  createSnapshot() {
    return {
      board: this.gameState.cloneBoard(this.gameState.board),
      currentPlayer: this.gameState.currentPlayer,
      capturedWhite: this.gameState.capturedWhite.map(p => ({ player: p.player, king: p.king })),
      capturedBlack: this.gameState.capturedBlack.map(p => ({ player: p.player, king: p.king })),
      mustContinue: this.mustContinue ? { ...this.mustContinue } : null
    };
  }

  restoreSnapshot(snapshot) {
    this.gameState.board = snapshot.board;
    this.gameState.currentPlayer = snapshot.currentPlayer;
    this.gameState.capturedWhite = snapshot.capturedWhite;
    this.gameState.capturedBlack = snapshot.capturedBlack;
    this.mustContinue = snapshot.mustContinue;
  }

  evaluatePosition() {
    let whiteMen = 0;
    let whiteKings = 0;
    let blackMen = 0;
    let blackKings = 0;

    for (let r = 0; r < this.gameState.size; r++) {
      for (let c = 0; c < this.gameState.size; c++) {
        const piece = this.gameState.getPiece(r, c);
        if (!piece) continue;
        if (piece.player === PLAYER.WHITE) {
          if (piece.king) whiteKings += 1;
          else whiteMen += 1;
        } else {
          if (piece.king) blackKings += 1;
          else blackMen += 1;
        }
      }
    }

    let material = (blackMen - whiteMen) * 100 + (blackKings - whiteKings) * 175;
    let mobility =
      this.gameState.getAllLegalMovesForPlayer(PLAYER.BLACK).moves.length -
      this.gameState.getAllLegalMovesForPlayer(PLAYER.WHITE).moves.length;
    if (this.aiPlayer === PLAYER.WHITE) {
      material *= -1;
      mobility *= -1;
    }
    return material + mobility * 4;
  }

  applyMoveForSearch(move) {
    const validation = this.legalMoveEngine.validateMove(
      this.gameState.currentPlayer,
      move.fromRow,
      move.fromCol,
      move.row,
      move.col,
      this.mustContinue
    );
    if (!validation.isLegal) return false;
    const selectedMove = validation.move;

    if (selectedMove.capture) {
      const captured = this.gameState.getPiece(selectedMove.capture.row, selectedMove.capture.col);
      if (captured) {
        const snapshot = { player: captured.player, king: captured.king };
        if (captured.player === PLAYER.WHITE) this.gameState.capturedWhite.push(snapshot);
        else this.gameState.capturedBlack.push(snapshot);
      }
      this.gameState.setPiece(selectedMove.capture.row, selectedMove.capture.col, null);
    }

    this.gameState.movePiece(move.fromRow, move.fromCol, selectedMove.row, selectedMove.col);
    this.gameState.promoteIfNeeded(selectedMove.row, selectedMove.col);

    const nextCaptures = this.gameState.filterCapturesForPosition(
      selectedMove.row,
      selectedMove.col,
      this.gameState.getCaptureMovesFor(selectedMove.row, selectedMove.col)
    );

    if (selectedMove.capture && nextCaptures.length) {
      this.mustContinue = { row: selectedMove.row, col: selectedMove.col };
    } else {
      this.mustContinue = null;
      this.switchPlayer();
    }
    return true;
  }

  search(depth, alpha, beta) {
    if (depth <= 0) return this.evaluatePosition();

    const context = this.legalMoveEngine.getTurnContext(this.gameState.currentPlayer, this.mustContinue);
    if (!context.allMoves.length) {
      if (this.gameState.currentPlayer === this.aiPlayer) return -100000 + depth;
      return 100000 - depth;
    }

    const maximizing = this.gameState.currentPlayer === this.aiPlayer;
    if (maximizing) {
      let best = -Infinity;
      for (const move of context.allMoves) {
        const snapshot = this.createSnapshot();
        this.applyMoveForSearch(move);
        const score = this.search(depth - 1, alpha, beta);
        this.restoreSnapshot(snapshot);
        if (score > best) best = score;
        if (score > alpha) alpha = score;
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const move of context.allMoves) {
      const snapshot = this.createSnapshot();
      this.applyMoveForSearch(move);
      const score = this.search(depth - 1, alpha, beta);
      this.restoreSnapshot(snapshot);
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    return best;
  }

  selectAiMove(context) {
    const level = this.aiProfile.levelIndex;
    const tier = this.aiProfile.tier;
    const moves = context.allMoves;
    if (!moves.length) return null;

    if (level === 0) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (level === 1) {
      let bestMoves = [];
      let bestScore = -Infinity;
      for (const move of moves) {
        let score = 0;
        if (move.capture) score += 100;
        const snapshot = this.createSnapshot();
        this.applyMoveForSearch(move);
        score += this.evaluatePosition() * 0.01;
        this.restoreSnapshot(snapshot);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    let depth = 3;
    if (level === 2) depth = tier <= 5 ? 2 : 3;
    if (level === 3) depth = 4 + Math.floor((tier - 1) / 5);
    if (level === 4) depth = 5 + Math.floor((tier - 1) / 3);
    if (level === 5 && tier <= 8) depth = 6 + Math.floor((tier - 1) / 3);
    if (level === 5 && tier >= 9) depth = tier === 9 ? 10 : 12;

    if (this.gameState.size >= 10 && depth > 8) depth -= 2;
    if (this.gameState.size >= 10 && depth > 6) depth -= 1;

    let best = -Infinity;
    let bestMoves = [];
    for (const move of moves) {
      const snapshot = this.createSnapshot();
      this.applyMoveForSearch(move);
      const score = this.search(depth - 1, -Infinity, Infinity);
      this.restoreSnapshot(snapshot);
      if (score > best) {
        best = score;
        bestMoves = [move];
      } else if (score === best) {
        bestMoves.push(move);
      }
    }

    if (level === 5 && tier >= 9) {
      return bestMoves[0];
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  performAiTurn() {
    if (this.freezeAiArmed && !this.freezeAiUsedThisMatch) {
      this.freezeAiArmed = false;
      this.freezeAiUsedThisMatch = true;
      this.switchPlayer();
      this.refresh();
      return;
    }
    this.aiBusy = true;
    setTimeout(() => {
      if (this.gameOver) {
        this.aiBusy = false;
        return;
      }
      const context = this.legalMoveEngine.getTurnContext(this.aiPlayer, null);
      if (!context.allMoves.length) {
        this.gameOver = true;
        if (typeof this.onGameEnd === "function") {
          this.onGameEnd({ result: "win", reason: "Opponent has no legal moves remaining." });
        } else {
          this.showEndModal("YOU WIN");
        }
        this.aiBusy = false;
        return;
      }
      const move = this.selectAiMove(context);
      if (!move) {
        this.aiBusy = false;
        return;
      }
      this.executeMove(move.fromRow, move.fromCol, move);
      if (!this.mustContinue) this.aiBusy = false;
    }, 280);
  }

  performAiContinuation() {
    setTimeout(() => {
      const context = this.legalMoveEngine.getTurnContext(this.aiPlayer, this.mustContinue);
      if (!context.allMoves.length) {
        this.mustContinue = null;
        this.clearSelection();
        this.switchPlayer();
        this.refresh();
        this.aiBusy = false;
        return;
      }
      const move = this.selectAiMove(context);
      if (!move) {
        this.aiBusy = false;
        return;
      }
      const from = this.mustContinue;
      this.executeMove(from.row, from.col, move);
      if (!this.mustContinue) this.aiBusy = false;
    }, 220);
  }

  refreshHighlights() {
    const squares = this.boardElement.querySelectorAll(".square");
    for (const square of squares) {
      square.classList.remove("highlight", "can-capture", "threat-source", "threat-danger", "mass-highlight");
      const piece = square.querySelector(".piece");
      if (piece) piece.classList.remove("selected");
    }
    for (const move of this.legalMoves) {
      const square = this.boardElement.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
      if (square) square.classList.add("highlight");
    }
    for (const key of Object.keys(this.captureMap)) {
      const [r, c] = key.split(",");
      const square = this.boardElement.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
      if (square) square.classList.add("can-capture");
    }
    if (this.selected) {
      const square = this.boardElement.querySelector(
        `.square[data-row="${this.selected.row}"][data-col="${this.selected.col}"]`
      );
      if (square) {
        const piece = square.querySelector(".piece");
        if (piece) piece.classList.add("selected");
      }
    }
  }

  clearSelection() {
    this.selected = null;
    this.legalMoves = [];
  }

  switchPlayer() {
    this.gameState.currentPlayer =
      this.gameState.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  }

  showModal() {
    this.modalElement.classList.remove("hidden");
    playSfx("invalidMove");
  }

  showCustomModal(titleText, bodyText) {
    const title = this.modalElement.querySelector(".modal-title");
    const body = this.modalElement.querySelector(".modal-body");
    if (title) title.textContent = titleText;
    if (body) body.textContent = bodyText;
    this.showModal();
  }

  hideModal() {
    this.modalElement.classList.add("hidden");
  }

  showEndModal(text) {
    const title = this.modalElement.querySelector(".modal-title");
    const body = this.modalElement.querySelector(".modal-body");
    if (title) title.textContent = "Game Over";
    if (body) body.textContent = text;
    this.showModal();
  }

  undoPlayerMove() {
    if (!this.moveHistory.length || this.aiBusy) return false;
    if (!this.aiEnabled) {
      const snapshot = this.moveHistory.pop();
      if (!snapshot) return false;
      this.restoreSnapshot(snapshot);
      this.gameOver = false;
      this.refresh();
      playSfx("undo");
      return true;
    }
    while (this.moveHistory.length) {
      const snapshot = this.moveHistory.pop();
      if (!snapshot) break;
      if (snapshot.currentPlayer === this.humanPlayer) {
        this.restoreSnapshot(snapshot);
        this.gameOver = false;
        this.aiBusy = false;
        this.refresh();
        playSfx("undo");
        return true;
      }
    }
    return false;
  }

  searchForWhite(depth) {
    if (depth <= 0) return this.humanPlayer === PLAYER.WHITE ? -this.evaluatePosition() : this.evaluatePosition();
    const context = this.legalMoveEngine.getTurnContext(this.gameState.currentPlayer, this.mustContinue);
    if (!context.allMoves.length) {
      if (this.gameState.currentPlayer === this.humanPlayer) return -100000 + depth;
      return 100000 - depth;
    }
    if (this.gameState.currentPlayer === this.humanPlayer) {
      let best = -Infinity;
      for (const move of context.allMoves) {
        const snap = this.createSnapshot();
        this.applyMoveForSearch(move);
        const score = this.searchForWhite(depth - 1);
        this.restoreSnapshot(snap);
        if (score > best) best = score;
      }
      return best;
    }
    let best = Infinity;
    for (const move of context.allMoves) {
      const snap = this.createSnapshot();
      this.applyMoveForSearch(move);
      const score = this.searchForWhite(depth - 1);
      this.restoreSnapshot(snap);
      if (score < best) best = score;
    }
    return best;
  }

  getHintMove(levelIndex) {
    if (this.aiBusy || this.gameOver || this.gameState.currentPlayer !== this.humanPlayer) return null;
    const context = this.legalMoveEngine.getTurnContext(this.humanPlayer, this.mustContinue);
    const moves = context.allMoves;
    if (!moves.length) return null;
    if (levelIndex === 0) return moves[Math.floor(Math.random() * moves.length)];
    if (levelIndex === 1) {
      const captures = moves.filter(m => m.capture);
      if (captures.length) return captures[Math.floor(Math.random() * captures.length)];
      return moves[Math.floor(Math.random() * moves.length)];
    }
    let depth = 2;
    if (levelIndex === 2) depth = 2;
    if (levelIndex === 3) depth = 3;
    if (levelIndex === 4) depth = 4;
    if (levelIndex >= 5) depth = 5;
    if (this.gameState.size >= 10 && depth > 3) depth -= 1;
    let bestMove = null;
    let bestScore = -Infinity;
    for (const move of moves) {
      const snap = this.createSnapshot();
      this.applyMoveForSearch(move);
      const score = this.searchForWhite(depth - 1);
      this.restoreSnapshot(snap);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove || moves[0];
  }

  showHint(move, label = "Hint") {
    if (!move) return false;
    this.selected = { row: move.fromRow, col: move.fromCol };
    this.legalMoves = [{ row: move.row, col: move.col }];
    this.refreshHighlights();
    this.showCustomModal(label, `Suggested move: (${move.fromRow + 1},${move.fromCol + 1}) -> (${move.row + 1},${move.col + 1})`);
    return true;
  }

  runThreatScanner() {
    if (this.aiBusy || this.gameOver) return;
    const context = this.legalMoveEngine.getTurnContext(this.aiPlayer, null);
    this.renderer.renderBoard();
    this.renderer.renderCaptured();
    this.refreshHighlights();
    for (const move of context.allMoves) {
      if (!move.capture) continue;
      const src = this.boardElement.querySelector(`.square[data-row="${move.fromRow}"][data-col="${move.fromCol}"]`);
      const dst = this.boardElement.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
      if (src) src.classList.add("threat-source");
      if (dst) dst.classList.add("threat-danger");
    }
    setTimeout(() => this.refresh(), 2200);
  }

  runMoveHighlighter() {
    if (this.aiBusy || this.gameOver) return;
    const context = this.legalMoveEngine.getTurnContext(this.humanPlayer, this.mustContinue);
    this.renderer.renderBoard();
    this.renderer.renderCaptured();
    this.refreshHighlights();
    for (const move of context.allMoves) {
      const square = this.boardElement.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
      if (square) square.classList.add("mass-highlight");
    }
    setTimeout(() => this.refresh(), 2000);
  }

  checkGameOver() {
    if (this.gameOver) return;
    if (this.gameState.countPieces(this.humanPlayer) === 0) {
      this.gameOver = true;
      if (typeof this.onGameEnd === "function") {
        this.onGameEnd({ result: "lose", reason: "All your pieces were captured." });
      } else {
        this.showEndModal("YOU LOSE");
      }
      return;
    }
    if (this.gameState.countPieces(this.aiPlayer) === 0) {
      this.gameOver = true;
      if (this.aiEnabled && typeof this.onPlayerWin === "function") this.onPlayerWin();
      if (typeof this.onGameEnd === "function") {
        this.onGameEnd({ result: "win", reason: "Opponent has no pieces left." });
      } else {
        this.showEndModal("YOU WIN");
      }
      return;
    }
    const context = this.legalMoveEngine.getTurnContext(this.gameState.currentPlayer, null);
    if (!context.allMoves.length) {
      this.gameOver = true;
      if (this.gameState.currentPlayer === this.humanPlayer) {
        if (typeof this.onGameEnd === "function") {
          this.onGameEnd({ result: "lose", reason: "You have no legal moves remaining." });
        } else {
          this.showEndModal("YOU LOSE");
        }
      } else {
        if (this.aiEnabled && typeof this.onPlayerWin === "function") this.onPlayerWin();
        if (typeof this.onGameEnd === "function") {
          this.onGameEnd({ result: "win", reason: "Opponent has no legal moves remaining." });
        } else {
          this.showEndModal("YOU WIN");
        }
      }
    }
  }
}

const boardElement = document.getElementById("board");
const capturedWhiteElement = document.getElementById("captured-white");
const capturedBlackElement = document.getElementById("captured-black");
const modalElement = document.getElementById("modal");
const modalCloseButton = document.getElementById("modal-close");

const homeScreenElement = document.getElementById("home-screen");
const levelScreenElement = document.getElementById("level-screen");
const gameScreenElement = document.getElementById("game-screen");
const rewardsScreenElement = document.getElementById("rewards-screen");
const shopScreenElement = document.getElementById("shop-screen");
const playNowButton = document.getElementById("play-now-button");
const rulesButton = document.getElementById("rules-button");
const shopButton = document.getElementById("shop-button");
const claimButton = document.getElementById("claim-button");
const rewardsBackButton = document.getElementById("rewards-back-button");
const rewardsBalanceElement = document.getElementById("rewards-balance");
const rewardsListElement = document.getElementById("rewards-list");
const shopBackButton = document.getElementById("shop-back-button");
const shopBalanceElement = document.getElementById("shop-balance");
const levelDisplayElement = document.getElementById("level-display");
const coinsDisplayElement = document.getElementById("coins-display");
const gameLevelDisplayElement = document.getElementById("game-level-display");
const gameCoinsDisplayElement = document.getElementById("game-coins-display");
const gameBackButton = document.getElementById("game-back-button");
const boardLevelBadgeElement = document.getElementById("board-level-badge");
const pieceGridElement = document.getElementById("piece-grid");
const piecePrevButton = document.getElementById("piece-prev");
const pieceNextButton = document.getElementById("piece-next");
const pieceDefaultButton = document.getElementById("piece-default-button");
const bgGridElement = document.getElementById("bg-grid");
const bgPrevButton = document.getElementById("bg-prev");
const bgNextButton = document.getElementById("bg-next");
const backgroundDefaultButton = document.getElementById("background-default-button");
const boardGridElement = document.getElementById("board-grid");
const boardPrevButton = document.getElementById("board-prev");
const boardNextButton = document.getElementById("board-next");
const boardDefaultButton = document.getElementById("board-default-button");
const effectGridElement = document.getElementById("effect-grid");
const effectPrevButton = document.getElementById("effect-prev");
const effectNextButton = document.getElementById("effect-next");
const effectsOwnedSummaryElement = document.getElementById("effects-owned-summary");
const effectsToolbarElement = document.getElementById("effects-toolbar");
const fxUndoButton = document.getElementById("fx-undo");
const fxHintR1Button = document.getElementById("fx-hint-r1");
const fxHintR2Button = document.getElementById("fx-hint-r2");
const fxHintR3Button = document.getElementById("fx-hint-r3");
const fxHintR4Button = document.getElementById("fx-hint-r4");
const fxHintR5Button = document.getElementById("fx-hint-r5");
const fxHintR6Button = document.getElementById("fx-hint-r6");
const fxThreatButton = document.getElementById("fx-threat");
const fxMovesButton = document.getElementById("fx-moves");
const fxShieldButton = document.getElementById("fx-shield");
const fxFreezeButton = document.getElementById("fx-freeze");
const fxUndoCountElement = document.getElementById("fx-undo-count");
const fxHintR1CountElement = document.getElementById("fx-hint-r1-count");
const fxHintR2CountElement = document.getElementById("fx-hint-r2-count");
const fxHintR3CountElement = document.getElementById("fx-hint-r3-count");
const fxHintR4CountElement = document.getElementById("fx-hint-r4-count");
const fxHintR5CountElement = document.getElementById("fx-hint-r5-count");
const fxHintR6CountElement = document.getElementById("fx-hint-r6-count");
const fxThreatCountElement = document.getElementById("fx-threat-count");
const fxMovesCountElement = document.getElementById("fx-moves-count");
const fxShieldCountElement = document.getElementById("fx-shield-count");
const fxFreezeCountElement = document.getElementById("fx-freeze-count");
const modePassPlayButton = document.getElementById("mode-pass-play");
const modeComputerButton = document.getElementById("mode-computer");
const variantPrevButton = document.getElementById("variant-prev");
const variantNextButton = document.getElementById("variant-next");
const variantNameElement = document.getElementById("variant-name");
const variantFlagElement = document.getElementById("variant-flag");

const rulesModalElement = document.getElementById("rules-modal");
const rulesTitleElement = document.getElementById("rules-title");
const rulesBodyElement = document.getElementById("rules-body");
const rulesCloseButton = document.getElementById("rules-close");
const resultModalElement = document.getElementById("result-modal");
const resultTitleElement = document.getElementById("result-title");
const resultBodyElement = document.getElementById("result-body");
const resultMenuButton = document.getElementById("result-menu");
const resultNextButton = document.getElementById("result-next");
const resultReplayButton = document.getElementById("result-replay");
const resultCancelButton = document.getElementById("result-cancel");
const resumeModalElement = document.getElementById("resume-modal");
const resumeTitleElement = document.getElementById("resume-title");
const resumeBodyElement = document.getElementById("resume-body");
const resumeContinueButton = document.getElementById("resume-continue");
const resumeNewButton = document.getElementById("resume-new");
const settingsButton = document.getElementById("settings-button");
const hubBackButtonElement = document.getElementById("hub-back-btn");
const settingsModalElement = document.getElementById("settings-modal");
const settingsCloseButton = document.getElementById("settings-close");
const setSfxOnButton = document.getElementById("set-sfx-on");
const setSfxOffButton = document.getElementById("set-sfx-off");
const setBgmOnButton = document.getElementById("set-bgm-on");
const setBgmOffButton = document.getElementById("set-bgm-off");
const setFirstWhiteButton = document.getElementById("set-first-white");
const setFirstBlackButton = document.getElementById("set-first-black");
const setPlayAsWhiteButton = document.getElementById("set-playas-white");
const setPlayAsBlackButton = document.getElementById("set-playas-black");
const setForcedOnButton = document.getElementById("set-forced-on");
const setForcedOffButton = document.getElementById("set-forced-off");
const effectsNavToggleButton = document.getElementById("effects-nav-toggle");

const FX_ICON_BY_EFFECT = {
  undo: "assets/effects/effect01_result.webp",
  hint_r1: "assets/effects/effect02_result.webp",
  hint_r2: "assets/effects/effect03_result.webp",
  hint_r3: "assets/effects/effect04_result.webp",
  hint_r4: "assets/effects/effect05_result.webp",
  hint_r5: "assets/effects/effect06_result.webp",
  hint_r6: "assets/effects/effect07_result.webp",
  threat_scanner: "assets/effects/effect08_result.webp",
  move_highlighter: "assets/effects/effect09_result.webp",
  mistake_shield: "assets/effects/effect10_result.webp",
  freeze_ai: "assets/effects/effect11_result.webp"
};

const levelBackButton = document.getElementById("level-back-button");
const levelListElement = document.getElementById("level-list");
const tierHeadlineElement = document.getElementById("tier-headline");
const tierGridElement = document.getElementById("tier-grid");
const startTierButton = document.getElementById("start-tier-button");

const gameState = new GameState(VARIANTS[0]);
const legalMoveEngine = new LegalMoveEngine(gameState);
const renderer = new Renderer(boardElement, gameState, capturedWhiteElement, capturedBlackElement);
const controller = new GameController(
  boardElement,
  gameState,
  renderer,
  legalMoveEngine,
  modalElement,
  modalCloseButton
);
controller.init();
controller.onPlayerWin = () => {
  queueBaseWinReward();
  const progress = currentProgress();
  const levelIndex = progress.selectedLevelIndex;
  const winsBefore = progress.tierWins[levelIndex];
  const tierWins = progress.tierWins[levelIndex];
    if (progress.selectedTier <= tierWins) {
      renderClaimButton();
      renderTopStats();
      renderBackgroundShop();
      renderBoardShop();
      saveState();
      return;
  }
  if (progress.selectedTier === tierWins + 1) {
    progress.tierWins[levelIndex] = Math.min(TIERS_PER_LEVEL, tierWins + 1);
    playSfx("tierCompleted");
  }
  const unlockedTier = unlockedTierForLevel(progress, levelIndex);
  progress.selectedTier = Math.min(unlockedTier, progress.selectedTier + 1);
  if (winsBefore < TIERS_PER_LEVEL && progress.tierWins[levelIndex] >= TIERS_PER_LEVEL) {
    playSfx("levelCompleted");
  }
  if (progress.tierWins[levelIndex] >= TIERS_PER_LEVEL && levelIndex < LEVELS.length - 1) {
    progress.selectedLevelIndex = levelIndex + 1;
    progress.selectedTier = 1;
  }
  renderClaimButton();
  renderTopStats();
  renderBackgroundShop();
  renderBoardShop();
  saveState();
};
controller.onGameEnd = payload => {
  openResultModal(payload);
};

const homeState = {
  mode: "pass_play",
  selectedVariantIndex: 0
};

const STORAGE_KEY = "checkers_royale_state_v2";
const CHECKERS_RESUME_KEY = "checkers_saved_match_v1";
let pendingResumeMatch = null;

function createDefaultProgressMap() {
  const map = {};
  for (const variant of VARIANTS) {
    map[variant.id] = {
      selectedLevelIndex: 0,
      selectedTier: 1,
      tierWins: LEVELS.map(() => 0)
    };
  }
  return map;
}

const PIECE_SKIN_PRICES = [
  280, 340, 390, 450, 520,
  600, 680, 760, 850, 940,
  1040, 1140, 1250, 1360, 1480,
  1610, 1740, 1880, 2030, 2190
];

const PIECE_SKINS = Array.from({ length: 20 }, (_, index) => {
  const number = index + 1;
  return {
    id: `skin${number}`,
    name: `Skin ${number}`,
    price: PIECE_SKIN_PRICES[index],
    whiteImage: `assets/pieces/white/skin${String(number).padStart(2, "0")}_result.webp`,
    blackImage: `assets/pieces/black/skin${String(number).padStart(2, "0")}_result.webp`
  };
});

const BACKGROUND_SKINS = Array.from({ length: 11 }, (_, index) => {
  const number = index + 1;
  const level = Math.floor((number - 1) / 2) + 1;
  const tier = number % 2 === 1 ? 5 : 10;
  return {
    id: `bg${number}`,
    name: `Background ${number}`,
    image: `assets/backgrounds/bg${String(number).padStart(2, "0")}_result.webp`,
    unlockLevel: level,
    unlockTier: tier
  };
});

const BOARD_THEME_COLORS = [
  { dark: "#5C3A21", light: "#E8D8C3" },
  { dark: "#2F2F2F", light: "#D9D9D9" },
  { dark: "#1C1C1C", light: "#F5F5F5" },
  { dark: "#1F2A44", light: "#F2E8D5" },
  { dark: "#111111", light: "#FAF9F6" },
  { dark: "#1F3D2B", light: "#8B5A2B" },
  { dark: "#0F1A2F", light: "#C9CED6" },
  { dark: "#A0522D", light: "#E5C9A3" },
  { dark: "#0B3D2E", light: "#F4F1E8" },
  { dark: "#121212", light: "#E6D3B3" },
  { dark: "#0A0A0A", light: "#DADADA" }
];

const BOARD_THEME_IMAGES = [
  "assets/boards/board1_result.webp",
  "assets/boards/board2_result.webp",
  "assets/boards/board3_result.webp",
  "assets/boards/board4_result.webp",
  "assets/boards/board5_result.webp",
  "assets/boards/board6_result.webp",
  "assets/boards/board7_result.webp",
  "assets/boards/board8_result.webp",
  "assets/boards/board9_result.wepb",
  "assets/boards/board10_result.webp",
  "assets/boards/board11_result.webp"
];

const BOARD_THEMES = BOARD_THEME_COLORS.map((colors, index) => {
  const number = index + 1;
  const level = Math.floor((number - 1) / 2) + 1;
  const tier = number % 2 === 1 ? 5 : 10;
  return {
    id: `board${number}`,
    name: `Board ${number}`,
    image: BOARD_THEME_IMAGES[index],
    dark: colors.dark,
    light: colors.light,
    unlockLevel: level,
    unlockTier: tier
  };
});

const SOUND_URLS = {
  pieceSelect: "assets/audio/sfx/piece select.wav",
  validMove: "assets/audio/sfx/valid.wav",
  invalidMove: "assets/audio/sfx/invalid.wav",
  capture: "assets/audio/sfx/capture.wav",
  multiCapture: "assets/audio/sfx/multi capture.wav",
  kingPromotion: "assets/audio/sfx/king prom.wav",
  gameWin: "assets/audio/sfx/gamewin.wav",
  gameLoss: "assets/audio/sfx/gamelose.wav",
  coinEarned: "assets/audio/sfx/coinreward.wav",
  levelCompleted: "assets/audio/sfx/levelcomp.wav",
  tierCompleted: "assets/audio/sfx/tiercomp.wav",
  unlockSkin: "assets/audio/sfx/unlockskin.wav",
  purchaseSuccess: "assets/audio/sfx/purchasesuccess.wav",
  notEnoughCoins: "assets/audio/sfx/notenough.wav",
  undo: "assets/audio/sfx/undo.wav",
  threatScanner: "assets/audio/sfx/threat.wav",
  moveHighlighter: "assets/audio/sfx/move.wav",
  mistakeShield: "assets/audio/sfx/shield.wav",
  freezeAi: "assets/audio/sfx/freeze.wav",
  hint1: "assets/audio/sfx/hint1.wav",
  hint2: "assets/audio/sfx/hint2.wav",
  hint3: "assets/audio/sfx/hint3.wav",
  hint4: "assets/audio/sfx/hint4.wav",
  hint5: "assets/audio/sfx/hint5.wav",
  hint6: "assets/audio/sfx/hint6.wav"
};

const BGM_URL = "assets/audio/background.mp3";

const EFFECT_ITEMS = [
  { id: "undo", name: "Undo", desc: "Undo your last move.", price: 0, image: "assets/effects/effect01_result.webp" },
  { id: "hint_r1", name: "Hint L1 Random", desc: "Suggests a random legal move.", price: 120, image: "assets/effects/effect02_result.webp" },
  { id: "hint_r2", name: "Hint L2 Greedy", desc: "Prefers immediate captures.", price: 200, image: "assets/effects/effect03_result.webp" },
  { id: "hint_r3", name: "Hint L3 Alpha-Beta", desc: "Balanced tactical search hint.", price: 260, image: "assets/effects/effect04_result.webp" },
  { id: "hint_r4", name: "Hint L4 Minimax", desc: "Deeper minimax move suggestion.", price: 340, image: "assets/effects/effect05_result.webp" },
  { id: "hint_r5", name: "Hint L5 Master", desc: "Strong strategic hint.", price: 460, image: "assets/effects/effect06_result.webp" },
  { id: "hint_r6", name: "Hint L6 Grandmaster", desc: "Best move from strongest engine.", price: 650, image: "assets/effects/effect07_result.webp" },
  { id: "threat_scanner", name: "Threat Scanner", desc: "Highlights enemy capture threats.", price: 100, image: "assets/effects/effect08_result.webp" },
  { id: "move_highlighter", name: "Move Highlighter", desc: "Highlights all legal moves.", price: 480, image: "assets/effects/effect09_result.webp" },
  { id: "mistake_shield", name: "Mistake Shield", desc: "Warns once before a blunder.", price: 450, image: "assets/effects/effect10_result.webp" },
  { id: "freeze_ai", name: "Freeze AI (1 Turn)", desc: "AI skips its next turn once.", price: 900, image: "assets/effects/effect11_result.webp" }
];

function createDefaultShopState() {
  return {
    ownedPieceSkins: {},
    equippedPieceSkin: "default",
    piecePage: 0,
    backgroundPage: 0,
    equippedBackground: null,
    boardPage: 0,
    equippedBoard: null,
    effectPage: 0,
    effectInventory: {}
  };
}

const progressByVariant = createDefaultProgressMap();

const rewardState = {
  balance: 0,
  pending: []
};

const shopState = createDefaultShopState();
const settingsState = {
  sfxOn: true,
  bgmOn: true,
  firstMove: PLAYER.WHITE,
  playAs: PLAYER.WHITE,
  forcedCaptureOn: true
};

const sessionState = {
  lastMatch: null
};

const sfxCache = {};
let bgmAudio = null;

function ensureBgm() {
  if (!bgmAudio) {
    bgmAudio = new Audio(BGM_URL);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.35;
  }
  return bgmAudio;
}

function playSfx(name) {
  if (!settingsState.sfxOn) return;
  const src = SOUND_URLS[name];
  if (!src) return;
  if (!sfxCache[name]) {
    sfxCache[name] = new Audio(src);
    sfxCache[name].preload = "auto";
  }
  const clip = sfxCache[name].cloneNode();
  clip.volume = 0.8;
  clip.play().catch(() => {});
}

function playBgm() {
  if (!settingsState.bgmOn) return;
  const audio = ensureBgm();
  audio.play().catch(() => {});
}

function stopBgm() {
  const audio = ensureBgm();
  audio.pause();
  audio.currentTime = 0;
}

function loadState() {
  let data = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    data = JSON.parse(raw);
  } catch (_) {
    return;
  }
  if (!data || typeof data !== "object") return;
  if (data.progressByVariant && typeof data.progressByVariant === "object") {
    for (const variant of VARIANTS) {
      if (data.progressByVariant[variant.id]) {
        progressByVariant[variant.id] = data.progressByVariant[variant.id];
      }
    }
  }
  if (data.rewardState && typeof data.rewardState === "object") {
    if (typeof data.rewardState.balance === "number") rewardState.balance = data.rewardState.balance;
    if (Array.isArray(data.rewardState.pending)) rewardState.pending = data.rewardState.pending;
  }
  if (data.shopState && typeof data.shopState === "object") {
    if (data.shopState.ownedPieceSkins) shopState.ownedPieceSkins = data.shopState.ownedPieceSkins;
    if (data.shopState.equippedPieceSkin) shopState.equippedPieceSkin = data.shopState.equippedPieceSkin;
    if (typeof data.shopState.piecePage === "number") shopState.piecePage = data.shopState.piecePage;
    if (typeof data.shopState.backgroundPage === "number") shopState.backgroundPage = data.shopState.backgroundPage;
    if (typeof data.shopState.boardPage === "number") shopState.boardPage = data.shopState.boardPage;
    if (typeof data.shopState.effectPage === "number") shopState.effectPage = data.shopState.effectPage;
    if (data.shopState.effectInventory && typeof data.shopState.effectInventory === "object") {
      shopState.effectInventory = data.shopState.effectInventory;
    }
    if (typeof data.shopState.equippedBackground === "string" || data.shopState.equippedBackground === null) {
      shopState.equippedBackground = data.shopState.equippedBackground;
    }
    if (typeof data.shopState.equippedBoard === "string" || data.shopState.equippedBoard === null) {
      shopState.equippedBoard = data.shopState.equippedBoard;
    }
  }
  if (data.settingsState && typeof data.settingsState === "object") {
    if (typeof data.settingsState.sfxOn === "boolean") settingsState.sfxOn = data.settingsState.sfxOn;
    if (typeof data.settingsState.bgmOn === "boolean") settingsState.bgmOn = data.settingsState.bgmOn;
    if (data.settingsState.firstMove === PLAYER.WHITE || data.settingsState.firstMove === PLAYER.BLACK) {
      settingsState.firstMove = data.settingsState.firstMove;
    }
    if (data.settingsState.playAs === PLAYER.WHITE || data.settingsState.playAs === PLAYER.BLACK) {
      settingsState.playAs = data.settingsState.playAs;
    }
    if (typeof data.settingsState.forcedCaptureOn === "boolean") {
      settingsState.forcedCaptureOn = data.settingsState.forcedCaptureOn;
    }
  }
  // Ensure shape safety after upgrades.
  for (const variant of VARIANTS) {
    if (!progressByVariant[variant.id]) {
      progressByVariant[variant.id] = {
        selectedLevelIndex: 0,
        selectedTier: 1,
        tierWins: LEVELS.map(() => 0)
      };
    }
    const progress = progressByVariant[variant.id];
    if (!Array.isArray(progress.tierWins) || progress.tierWins.length !== LEVELS.length) {
      progress.tierWins = LEVELS.map(() => 0);
    }
    if (typeof progress.selectedLevelIndex !== "number") progress.selectedLevelIndex = 0;
    if (typeof progress.selectedTier !== "number") progress.selectedTier = 1;
  }
  if (!shopState.ownedPieceSkins || typeof shopState.ownedPieceSkins !== "object") {
    shopState.ownedPieceSkins = {};
  }
  if (shopState.equippedPieceSkin !== "default" && !PIECE_SKINS.some(skin => skin.id === shopState.equippedPieceSkin)) {
    shopState.equippedPieceSkin = "default";
  }
  if (shopState.equippedPieceSkin !== "default" && !shopState.ownedPieceSkins[shopState.equippedPieceSkin]) {
    shopState.equippedPieceSkin = "default";
  }
  if (!Array.isArray(rewardState.pending)) rewardState.pending = [];
  if (typeof rewardState.balance !== "number") rewardState.balance = 0;
  if (typeof shopState.piecePage !== "number" || Number.isNaN(shopState.piecePage)) shopState.piecePage = 0;
  if (typeof shopState.backgroundPage !== "number" || Number.isNaN(shopState.backgroundPage)) {
    shopState.backgroundPage = 0;
  }
  if (typeof shopState.boardPage !== "number" || Number.isNaN(shopState.boardPage)) {
    shopState.boardPage = 0;
  }
  if (typeof shopState.effectPage !== "number" || Number.isNaN(shopState.effectPage)) {
    shopState.effectPage = 0;
  }
  if (!shopState.effectInventory || typeof shopState.effectInventory !== "object") {
    shopState.effectInventory = {};
  }
  for (const effect of EFFECT_ITEMS) {
    if (typeof shopState.effectInventory[effect.id] !== "number") shopState.effectInventory[effect.id] = 0;
  }
  if (shopState.equippedBackground && !BACKGROUND_SKINS.some(bg => bg.id === shopState.equippedBackground)) {
    shopState.equippedBackground = null;
  }
  if (shopState.equippedBoard && !BOARD_THEMES.some(board => board.id === shopState.equippedBoard)) {
    shopState.equippedBoard = null;
  }

  try {
    const rawResume = localStorage.getItem(CHECKERS_RESUME_KEY);
    if (rawResume) {
      const parsedResume = JSON.parse(rawResume);
      if (parsedResume && typeof parsedResume === "object" && parsedResume.snapshot) {
        pendingResumeMatch = parsedResume;
      }
    }
  } catch (_) {
    pendingResumeMatch = null;
  }
}

function saveState() {
  const payload = {
    progressByVariant,
    rewardState,
    shopState,
    settingsState
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function clearSavedMatch() {
  localStorage.removeItem(CHECKERS_RESUME_KEY);
  pendingResumeMatch = null;
}

function saveMatchSnapshot() {
  const variant = currentVariant();
  const progress = currentProgress();
  const payload = {
    variantId: controller.matchVariantId || variant.id,
    aiEnabled: controller.aiEnabled,
    aiProfile: controller.aiProfile,
    options: {
      firstPlayer: controller.gameState.currentPlayer,
      humanPlayer: controller.humanPlayer,
      aiPlayer: controller.aiPlayer
    },
    selectedLevelIndex: progress.selectedLevelIndex,
    selectedTier: progress.selectedTier,
    snapshot: controller.createSnapshot(),
    moveHistory: controller.moveHistory,
    freezeAiArmed: controller.freezeAiArmed,
    freezeAiUsedThisMatch: controller.freezeAiUsedThisMatch,
    mistakeShieldArmed: controller.mistakeShieldArmed,
    mistakeShieldTriggered: controller.mistakeShieldTriggered
  };
  localStorage.setItem(CHECKERS_RESUME_KEY, JSON.stringify(payload));
}

function restoreMatchSnapshot(saved) {
  if (!saved || !saved.snapshot) return false;
  const variant = VARIANTS.find(v => v.id === saved.variantId) || currentVariant();
  const progress = currentProgress();
  if (Number.isInteger(saved.selectedLevelIndex)) progress.selectedLevelIndex = saved.selectedLevelIndex;
  if (Number.isInteger(saved.selectedTier)) progress.selectedTier = saved.selectedTier;
  controller.startMatch(
    { ...variant, captureMandatory: settingsState.forcedCaptureOn },
    Boolean(saved.aiEnabled),
    saved.aiProfile || { levelIndex: progress.selectedLevelIndex, tier: progress.selectedTier },
    saved.options || null
  );
  controller.restoreSnapshot(saved.snapshot);
  controller.moveHistory = Array.isArray(saved.moveHistory) ? saved.moveHistory : [];
  controller.freezeAiArmed = Boolean(saved.freezeAiArmed);
  controller.freezeAiUsedThisMatch = Boolean(saved.freezeAiUsedThisMatch);
  controller.mistakeShieldArmed = Boolean(saved.mistakeShieldArmed);
  controller.mistakeShieldTriggered = Boolean(saved.mistakeShieldTriggered);
  controller.gameOver = false;
  controller.aiBusy = false;
  controller.refresh();
  renderTopStats();
  renderEffectsToolbar();
  saveState();
  showScreen("game");
  if (controller.aiEnabled && controller.gameState.currentPlayer === controller.aiPlayer) {
    setTimeout(() => controller.performAiTurn(), 250);
  }
  clearSavedMatch();
  return true;
}

function getSkinById(skinId) {
  return PIECE_SKINS.find(skin => skin.id === skinId) || PIECE_SKINS[0];
}

function isSkinOwned(skinId) {
  return Boolean(shopState.ownedPieceSkins[skinId]);
}

function applyEquippedPieceSkin() {
  const root = document.documentElement;
  if (shopState.equippedPieceSkin === "default") {
    root.style.setProperty("--piece-white-image", "var(--piece-white-fill)");
    root.style.setProperty("--piece-black-image", "var(--piece-black-fill)");
    return;
  }
  const equipped = getSkinById(shopState.equippedPieceSkin);
  if (!equipped) return;
  root.style.setProperty("--piece-white-image", `url("${equipped.whiteImage}")`);
  root.style.setProperty("--piece-black-image", `url("${equipped.blackImage}")`);
}

function getBackgroundById(backgroundId) {
  return BACKGROUND_SKINS.find(bg => bg.id === backgroundId) || null;
}

function isBackgroundUnlocked(background) {
  const progress = currentProgress();
  const levelIndex = background.unlockLevel - 1;
  if (levelIndex < 0 || levelIndex >= progress.tierWins.length) return false;
  return progress.tierWins[levelIndex] >= background.unlockTier;
}

function applyEquippedBackground() {
  const root = document.documentElement;
  if (!shopState.equippedBackground) {
    root.style.setProperty("--page-bg-image", 'url("assets/bg.png")');
    return;
  }
  const equipped = getBackgroundById(shopState.equippedBackground);
  if (!equipped) {
    root.style.setProperty("--page-bg-image", 'url("assets/bg.png")');
    return;
  }
  root.style.setProperty("--page-bg-image", `url("${equipped.image}")`);
}

function getBoardById(boardId) {
  return BOARD_THEMES.find(theme => theme.id === boardId) || null;
}

function isBoardUnlocked(board) {
  const progress = currentProgress();
  const levelIndex = board.unlockLevel - 1;
  if (levelIndex < 0 || levelIndex >= progress.tierWins.length) return false;
  return progress.tierWins[levelIndex] >= board.unlockTier;
}

function applyEquippedBoardTheme() {
  const root = document.documentElement;
  if (!shopState.equippedBoard) {
    root.style.setProperty("--board-dark", "#B58863");
    root.style.setProperty("--board-light", "#F0D9B5");
    return;
  }
  const equipped = getBoardById(shopState.equippedBoard);
  if (!equipped) {
    root.style.setProperty("--board-dark", "#B58863");
    root.style.setProperty("--board-light", "#F0D9B5");
    return;
  }
  root.style.setProperty("--board-dark", equipped.dark);
  root.style.setProperty("--board-light", equipped.light);
}

function currentVariant() {
  return VARIANTS[homeState.selectedVariantIndex];
}

function currentProgress() {
  return progressByVariant[currentVariant().id];
}

function renderTopStats() {
  const progress = currentProgress();
  const levelName = LEVELS[progress.selectedLevelIndex] || "Beginner";
  const levelText = `Level: ${levelName} (Tier ${progress.selectedTier})`;
  const coinValue = rewardState.balance.toLocaleString();
  const coinsMarkup =
    `Coins: <span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>${coinValue}</span></span>`;
  const balanceMarkup =
    `<span>Balance:</span><span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>${coinValue}</span></span>`;

  if (levelDisplayElement) levelDisplayElement.textContent = levelText;
  if (coinsDisplayElement) coinsDisplayElement.innerHTML = coinsMarkup;
  if (gameLevelDisplayElement) gameLevelDisplayElement.textContent = levelText;
  if (gameCoinsDisplayElement) gameCoinsDisplayElement.innerHTML = coinsMarkup;
  if (boardLevelBadgeElement) boardLevelBadgeElement.textContent = levelText;
  if (shopBalanceElement) shopBalanceElement.innerHTML = balanceMarkup;
}

function queueBaseWinReward() {
  const progress = currentProgress();
  const level = progress.selectedLevelIndex + 1;
  const tier = progress.selectedTier;
  const baseCoins = 20 + level * 10 + tier * 5;
  rewardState.pending.push({
    id: `${Date.now()}-${Math.random()}`,
    title: `Base Win Reward - ${LEVELS[progress.selectedLevelIndex]} Tier ${tier}`,
    amount: baseCoins
  });
}

const MULTI_CAPTURE_REWARD = 10;
const KING_FORMED_REWARD = 15;

function queueGameplayReward(title, amount) {
  rewardState.pending.push({
    id: `${Date.now()}-${Math.random()}`,
    title,
    amount
  });
  renderClaimButton();
  renderTopStats();
  saveState();
}
function renderClaimButton() {
  if (!claimButton) return;
  claimButton.textContent = "Claim";
  claimButton.classList.toggle("has-notice", rewardState.pending.length > 0);
}

function renderRewardsScreen() {
  if (rewardsBalanceElement) {
    rewardsBalanceElement.innerHTML =
      `<span>Balance:</span><span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>${rewardState.balance.toLocaleString()}</span></span>`;
  }
  if (!rewardsListElement) return;
  rewardsListElement.innerHTML = "";
  if (!rewardState.pending.length) {
    const empty = document.createElement("article");
    empty.className = "reward-card";
    empty.innerHTML =
      `<div><div class="reward-name">No rewards pending</div><div class="reward-meta">Win matches to earn claimable rewards.</div></div>` +
      `<button class="reward-action" type="button" disabled><span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>0</span></span></button>`;
    rewardsListElement.appendChild(empty);
    return;
  }

  for (const reward of rewardState.pending) {
    const card = document.createElement("article");
    card.className = "reward-card";
    const left = document.createElement("div");
    left.innerHTML =
      `<div class="reward-name">${reward.title}</div><div class="reward-meta">Tap to claim</div>`;
    const claim = document.createElement("button");
    claim.type = "button";
    claim.className = "reward-action";
    claim.innerHTML = `<span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>${reward.amount.toLocaleString()}</span></span>`;
    claim.addEventListener("click", () => {
      rewardState.balance += reward.amount;
      playSfx("coinEarned");
      rewardState.pending = rewardState.pending.filter(item => item.id !== reward.id);
      renderClaimButton();
      renderTopStats();
      saveState();
      renderRewardsScreen();
    });
    card.appendChild(left);
    card.appendChild(claim);
    rewardsListElement.appendChild(card);
  }
}

function renderPieceCard(skin) {
  const card = document.createElement("article");
  card.className = "piece-card";

  const thumb = document.createElement("div");
  thumb.className = "piece-thumb";
  thumb.style.backgroundImage = `url("${skin.whiteImage}")`;
  card.appendChild(thumb);

  const info = document.createElement("div");
  info.className = "piece-info";
  const title = document.createElement("div");
  title.className = "piece-title";
  title.textContent = skin.name;
  const price = document.createElement("div");
  price.className = "piece-price";
  price.innerHTML =
    `<span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>${skin.price.toLocaleString()}</span></span>`;
  info.appendChild(title);
  info.appendChild(price);
  card.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "piece-actions";

  const buyButton = document.createElement("button");
  buyButton.type = "button";
  buyButton.className = "piece-btn";
  const owned = isSkinOwned(skin.id);
  buyButton.textContent = owned ? "Bought" : "Buy";
  buyButton.disabled = owned;
  buyButton.addEventListener("click", () => {
    if (isSkinOwned(skin.id)) return;
    if (rewardState.balance < skin.price) {
      playSfx("notEnoughCoins");
      return;
    }
    rewardState.balance -= skin.price;
    shopState.ownedPieceSkins[skin.id] = true;
    playSfx("purchaseSuccess");
    if (skin.id === "skin5" || skin.id === "skin10" || skin.id === "skin15") playSfx("unlockSkin");
    renderTopStats();
    renderClaimButton();
    renderPieceShop();
    saveState();
  });

  const useButton = document.createElement("button");
  useButton.type = "button";
  useButton.className = "piece-btn secondary";
  const equipped = shopState.equippedPieceSkin === skin.id;
  useButton.textContent = equipped ? "Using" : "Use";
  useButton.disabled = !owned || equipped;
  useButton.addEventListener("click", () => {
    if (!isSkinOwned(skin.id)) return;
    shopState.equippedPieceSkin = skin.id;
    applyEquippedPieceSkin();
    controller.refresh();
    renderPieceShop();
    saveState();
  });

  actions.appendChild(buyButton);
  actions.appendChild(useButton);
  card.appendChild(actions);
  return card;
}

function renderPieceShop() {
  if (!pieceGridElement) return;
  const pages = [];
  pages.push({ skins: PIECE_SKINS.slice(0, 2) });
  pages.push({ skins: PIECE_SKINS.slice(2, 4) });
  pages.push({ skins: PIECE_SKINS.slice(4, 5) });
  if (isSkinOwned("skin5")) {
    pages.push({ skins: PIECE_SKINS.slice(5, 7) });
    pages.push({ skins: PIECE_SKINS.slice(7, 9) });
    pages.push({ skins: PIECE_SKINS.slice(9, 10) });
  } else {
    pages.push({ lockRequirement: "skin5", range: "6-10" });
  }
  if (isSkinOwned("skin10")) {
    pages.push({ skins: PIECE_SKINS.slice(10, 12) });
    pages.push({ skins: PIECE_SKINS.slice(12, 14) });
    pages.push({ skins: PIECE_SKINS.slice(14, 15) });
  } else {
    pages.push({ lockRequirement: "skin10", range: "11-15" });
  }
  if (isSkinOwned("skin15")) {
    pages.push({ skins: PIECE_SKINS.slice(15, 17) });
    pages.push({ skins: PIECE_SKINS.slice(17, 19) });
    pages.push({ skins: PIECE_SKINS.slice(19, 20) });
  } else {
    pages.push({ lockRequirement: "skin15", range: "16-20" });
  }

  const maxPage = Math.max(0, pages.length - 1);
  if (shopState.piecePage < 0) shopState.piecePage = 0;
  if (shopState.piecePage > maxPage) shopState.piecePage = maxPage;

  pieceGridElement.innerHTML = "";
  const page = pages[shopState.piecePage];
  if (page.lockRequirement) {
    const lock = document.createElement("div");
    lock.className = "piece-lock";
    const reqNumber = Number(page.lockRequirement.replace("skin", ""));
    lock.textContent = `Locked: Buy Skin ${reqNumber} to unlock Skin ${page.range}`;
    pieceGridElement.appendChild(lock);
  } else {
    const skins = page.skins || [];
    for (const skin of skins) pieceGridElement.appendChild(renderPieceCard(skin));
  }

  if (piecePrevButton) piecePrevButton.disabled = shopState.piecePage <= 0;
  if (pieceNextButton) pieceNextButton.disabled = shopState.piecePage >= maxPage;
  renderDefaultPieceButton();
}

function renderDefaultPieceButton() {
  if (!pieceDefaultButton) return;
  const usingDefault = shopState.equippedPieceSkin === "default";
  pieceDefaultButton.textContent = usingDefault ? "Default Piece (Using)" : "Default Piece";
  pieceDefaultButton.disabled = usingDefault;
}


function renderDefaultBackgroundButton() {
  if (!backgroundDefaultButton) return;
  const usingDefault = !shopState.equippedBackground;
  backgroundDefaultButton.textContent = usingDefault ? "Default Background (Using)" : "Default Background";
  backgroundDefaultButton.disabled = usingDefault;
}

function renderDefaultBoardButton() {
  if (!boardDefaultButton) return;
  const usingDefault = !shopState.equippedBoard;
  boardDefaultButton.textContent = usingDefault ? "Default Board (Using)" : "Default Board";
  boardDefaultButton.disabled = usingDefault;
}

function renderBackgroundCard(background) {
  const unlocked = isBackgroundUnlocked(background);
  if (!unlocked) {
    const lock = document.createElement("div");
    lock.className = "piece-lock";
    lock.textContent =
      `Locked: Level ${background.unlockLevel} Tier ${background.unlockTier}`;
    return lock;
  }

  const card = document.createElement("article");
  card.className = "piece-card";
  const thumb = document.createElement("div");
  thumb.className = "piece-thumb bg-thumb";
  thumb.style.backgroundImage = `url("${background.image}")`;
  card.appendChild(thumb);

  const info = document.createElement("div");
  info.className = "piece-info";
  info.innerHTML = `<div class="piece-title">${background.name}</div><div class="piece-price">Unlocked</div>`;
  card.appendChild(info);

  const useButton = document.createElement("button");
  useButton.type = "button";
  useButton.className = "piece-btn secondary";
  const equipped = shopState.equippedBackground === background.id;
  useButton.textContent = equipped ? "Using" : "Use";
  useButton.disabled = equipped;
  useButton.addEventListener("click", () => {
    shopState.equippedBackground = background.id;
    applyEquippedBackground();
    renderBackgroundShop();
    saveState();
  });
  card.appendChild(useButton);
  return card;
}

function renderBackgroundShop() {
  if (!bgGridElement) return;
  const pages = [];
  for (let i = 0; i < BACKGROUND_SKINS.length; i += 2) {
    pages.push(BACKGROUND_SKINS.slice(i, i + 2));
  }
  const maxPage = Math.max(0, pages.length - 1);
  if (shopState.backgroundPage < 0) shopState.backgroundPage = 0;
  if (shopState.backgroundPage > maxPage) shopState.backgroundPage = maxPage;

  bgGridElement.innerHTML = "";
  const currentPage = pages[shopState.backgroundPage] || [];
  for (const background of currentPage) {
    bgGridElement.appendChild(renderBackgroundCard(background));
  }

  if (bgPrevButton) bgPrevButton.disabled = shopState.backgroundPage <= 0;
  if (bgNextButton) bgNextButton.disabled = shopState.backgroundPage >= maxPage;
  renderDefaultBackgroundButton();
}

function renderBoardCard(boardTheme) {
  const unlocked = isBoardUnlocked(boardTheme);
  if (!unlocked) {
    const lock = document.createElement("div");
    lock.className = "piece-lock";
    lock.textContent =
      `Locked: Level ${boardTheme.unlockLevel} Tier ${boardTheme.unlockTier}`;
    return lock;
  }

  const card = document.createElement("article");
  card.className = "piece-card";
  const thumb = document.createElement("div");
  thumb.className = "piece-thumb board-thumb";
  const swatch = document.createElement("div");
  swatch.className = "board-swatch";
  swatch.style.setProperty("--swatch-dark", boardTheme.dark);
  swatch.style.setProperty("--swatch-light", boardTheme.light);
  swatch.style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url("${boardTheme.image}")`;
  swatch.style.backgroundSize = "cover";
  swatch.style.backgroundPosition = "center";
  thumb.appendChild(swatch);
  card.appendChild(thumb);

  const info = document.createElement("div");
  info.className = "piece-info";
  info.innerHTML = `<div class="piece-title">${boardTheme.name}</div><div class="piece-price">Unlocked</div>`;
  card.appendChild(info);

  const useButton = document.createElement("button");
  useButton.type = "button";
  useButton.className = "piece-btn secondary";
  const equipped = shopState.equippedBoard === boardTheme.id;
  useButton.textContent = equipped ? "Using" : "Use";
  useButton.disabled = equipped;
  useButton.addEventListener("click", () => {
    shopState.equippedBoard = boardTheme.id;
    applyEquippedBoardTheme();
    controller.refresh();
    renderBoardShop();
    saveState();
  });
  card.appendChild(useButton);
  return card;
}

function renderBoardShop() {
  if (!boardGridElement) return;
  const pages = [];
  for (let i = 0; i < BOARD_THEMES.length; i += 2) {
    pages.push(BOARD_THEMES.slice(i, i + 2));
  }
  const maxPage = Math.max(0, pages.length - 1);
  if (shopState.boardPage < 0) shopState.boardPage = 0;
  if (shopState.boardPage > maxPage) shopState.boardPage = maxPage;

  boardGridElement.innerHTML = "";
  const currentPage = pages[shopState.boardPage] || [];
  for (const boardTheme of currentPage) {
    boardGridElement.appendChild(renderBoardCard(boardTheme));
  }

  if (boardPrevButton) boardPrevButton.disabled = shopState.boardPage <= 0;
  if (boardNextButton) boardNextButton.disabled = shopState.boardPage >= maxPage;
  renderDefaultBoardButton();
}

function getEffectCount(effectId) {
  return Number(shopState.effectInventory[effectId] || 0);
}

function addEffectCount(effectId, amount) {
  shopState.effectInventory[effectId] = getEffectCount(effectId) + amount;
}

function consumeEffect(effectId) {
  const count = getEffectCount(effectId);
  if (count <= 0) return false;
  shopState.effectInventory[effectId] = count - 1;
  renderEffectsToolbar();
  saveState();
  return true;
}

function renderEffectsToolbar() {
  const map = [
    ["undo", fxUndoButton, fxUndoCountElement],
    ["hint_r1", fxHintR1Button, fxHintR1CountElement],
    ["hint_r2", fxHintR2Button, fxHintR2CountElement],
    ["hint_r3", fxHintR3Button, fxHintR3CountElement],
    ["hint_r4", fxHintR4Button, fxHintR4CountElement],
    ["hint_r5", fxHintR5Button, fxHintR5CountElement],
    ["hint_r6", fxHintR6Button, fxHintR6CountElement],
    ["threat_scanner", fxThreatButton, fxThreatCountElement],
    ["move_highlighter", fxMovesButton, fxMovesCountElement],
    ["mistake_shield", fxShieldButton, fxShieldCountElement],
    ["freeze_ai", fxFreezeButton, fxFreezeCountElement]
  ];
  let hasAvailableEffect = false;
  for (const [id, btn, countEl] of map) {
    const count = getEffectCount(id);
    if (countEl) countEl.textContent = String(count);
    if (btn) {
      btn.disabled = count <= 0;
      btn.classList.toggle("has-stock", count > 0);
    }
    if (count > 0) hasAvailableEffect = true;
  }
  if (effectsToolbarElement) effectsToolbarElement.classList.toggle("has-available", hasAvailableEffect);
  if (effectsNavToggleButton) effectsNavToggleButton.classList.toggle("has-available", hasAvailableEffect);
}

function renderEffectsShop() {
  if (!effectGridElement) return;
  const pages = [];
  for (let i = 0; i < EFFECT_ITEMS.length; i += 2) pages.push(EFFECT_ITEMS.slice(i, i + 2));
  const maxPage = Math.max(0, pages.length - 1);
  if (shopState.effectPage < 0) shopState.effectPage = 0;
  if (shopState.effectPage > maxPage) shopState.effectPage = maxPage;

  effectGridElement.innerHTML = "";
  for (const effect of pages[shopState.effectPage] || []) {
    const ownedCount = getEffectCount(effect.id);
    const card = document.createElement("article");
    card.className = "piece-card";
    const countBadge = document.createElement("span");
    countBadge.className = "effect-count";
    countBadge.textContent = String(ownedCount);
    card.appendChild(countBadge);
    const thumb = document.createElement("div");
    thumb.className = "piece-thumb bg-thumb";
    thumb.style.backgroundImage = `url("${effect.image}")`;
    card.appendChild(thumb);
    const title = document.createElement("div");
    title.className = "piece-title";
    title.textContent = effect.name;
    card.appendChild(title);
    const desc = document.createElement("div");
    desc.className = "piece-meta";
    desc.textContent = effect.desc || "";
    card.appendChild(desc);

    const actions = document.createElement("div");
    actions.className = "piece-actions";
    const buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.className = "piece-btn";
    buyButton.textContent = "Buy";
    buyButton.addEventListener("click", () => {
      if (rewardState.balance < effect.price) {
        playSfx("notEnoughCoins");
        return;
      }
      rewardState.balance -= effect.price;
      addEffectCount(effect.id, 1);
      playSfx("purchaseSuccess");
      renderTopStats();
      renderClaimButton();
      renderEffectsShop();
      renderEffectsToolbar();
      saveState();
    });
    const price = document.createElement("div");
    price.className = "piece-price";
    price.innerHTML = `<span class="coin-inline"><span class="coin-mark" aria-hidden="true"></span><span>${effect.price.toLocaleString()}</span></span>`;
    actions.appendChild(buyButton);
    actions.appendChild(price);
    card.appendChild(actions);
    effectGridElement.appendChild(card);
  }

  if (effectsOwnedSummaryElement) {
    const total = EFFECT_ITEMS.reduce((sum, item) => sum + getEffectCount(item.id), 0);
    effectsOwnedSummaryElement.textContent = `Owned effects: ${total}`;
  }
  if (effectPrevButton) effectPrevButton.disabled = shopState.effectPage <= 0;
  if (effectNextButton) effectNextButton.disabled = shopState.effectPage >= maxPage;
}

function activateEffect(effectId) {
  if (effectId === "undo") {
    if (!consumeEffect("undo")) return;
    if (!controller.undoPlayerMove()) {
      addEffectCount("undo", 1);
      renderEffectsToolbar();
      saveState();
      controller.showCustomModal("Undo", "No move available to undo.");
    }
    return;
  }
  if (effectId === "hint_r1" || effectId === "hint_r2" || effectId === "hint_r3" ||
      effectId === "hint_r4" || effectId === "hint_r5" || effectId === "hint_r6") {
    if (!consumeEffect(effectId)) return;
    const hintSounds = {
      hint_r1: "hint1",
      hint_r2: "hint2",
      hint_r3: "hint3",
      hint_r4: "hint4",
      hint_r5: "hint5",
      hint_r6: "hint6"
    };
    playSfx(hintSounds[effectId]);
    const levelById = {
      hint_r1: 0,
      hint_r2: 1,
      hint_r3: 2,
      hint_r4: 3,
      hint_r5: 4,
      hint_r6: 5
    };
    const move = controller.getHintMove(levelById[effectId]);
    if (!move) {
      addEffectCount(effectId, 1);
      renderEffectsToolbar();
      saveState();
      controller.showCustomModal("Hint", "No hint available in current position.");
      return;
    }
    const label = effectId === "hint_r6" ? "BEST Move" : "Hint";
    controller.showHint(move, label);
    return;
  }
  if (effectId === "threat_scanner") {
    if (!consumeEffect(effectId)) return;
    playSfx("threatScanner");
    controller.runThreatScanner();
    return;
  }
  if (effectId === "move_highlighter") {
    if (!consumeEffect(effectId)) return;
    playSfx("moveHighlighter");
    controller.runMoveHighlighter();
    return;
  }
  if (effectId === "mistake_shield") {
    if (controller.mistakeShieldArmed || controller.mistakeShieldTriggered) {
      controller.showCustomModal("Mistake Shield", "Shield can be used once per match.");
      return;
    }
    if (!consumeEffect(effectId)) return;
    controller.mistakeShieldArmed = true;
    playSfx("mistakeShield");
    controller.showCustomModal("Mistake Shield", "Shield armed. One blunder warning is active.");
    return;
  }
  if (effectId === "freeze_ai") {
    if (controller.freezeAiUsedThisMatch || controller.freezeAiArmed) {
      controller.showCustomModal("Freeze AI", "Freeze AI can be used once per match.");
      return;
    }
    if (!consumeEffect(effectId)) return;
    controller.freezeAiArmed = true;
    playSfx("freezeAi");
    controller.showCustomModal("Freeze AI", "AI will skip its next turn.");
  }
}

function closeResultModal() {
  if (resultModalElement) resultModalElement.classList.add("hidden");
}

function closeResumeModal() {
  if (resumeModalElement) resumeModalElement.classList.add("hidden");
}

function openResumeModal(saved, onContinueFail, onNewGame) {
  if (!resumeModalElement || !resumeContinueButton || !resumeNewButton) {
    if (!restoreMatchSnapshot(saved)) onContinueFail();
    return;
  }

  const variantName = (VARIANTS.find(v => v.id === saved.variantId) || currentVariant()).name;
  const modeLabel = saved.aiEnabled ? "Computer Mode" : "Pass & Play";
  if (resumeTitleElement) resumeTitleElement.textContent = "Resume Saved Match";
  if (resumeBodyElement) {
    resumeBodyElement.textContent = `${variantName} - ${modeLabel} match found. Continue from where you left off?`;
  }

  resumeModalElement.classList.remove("hidden");
  resumeContinueButton.onclick = () => {
    closeResumeModal();
    if (!restoreMatchSnapshot(saved)) onContinueFail();
  };
  resumeNewButton.onclick = () => {
    closeResumeModal();
    onNewGame();
  };
}

function openResultModal(payload) {
  if (!resultModalElement) return;
  const isWin = payload.result === "win";
  playSfx(isWin ? "gameWin" : "gameLoss");
  if (resultTitleElement) resultTitleElement.textContent = isWin ? "YOU WIN" : "YOU LOSE";
  if (resultBodyElement) {
    resultBodyElement.textContent = payload.reason || (isWin ? "You won the match." : "You lost the match.");
  }
  if (resultNextButton) resultNextButton.classList.toggle("hidden", !isWin || !controller.aiEnabled);
  resultModalElement.classList.remove("hidden");
}

function unlockedLevelIndex(progress) {
  let unlocked = 0;
  for (let i = 1; i < LEVELS.length; i++) {
    if (progress.tierWins[i - 1] >= TIERS_PER_LEVEL) unlocked = i;
    else break;
  }
  return unlocked;
}

function unlockedTierForLevel(progress, levelIndex) {
  const maxLevel = unlockedLevelIndex(progress);
  if (levelIndex > maxLevel) return 0;
  if (levelIndex < maxLevel) return TIERS_PER_LEVEL;
  return Math.min(TIERS_PER_LEVEL, progress.tierWins[levelIndex] + 1);
}

function getResumeMatchForCurrentSelection() {
  const saved = pendingResumeMatch || (() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKERS_RESUME_KEY) || "null");
    } catch {
      return null;
    }
  })();

  if (!saved || typeof saved !== "object" || !saved.snapshot) return null;
  const selectedVariantId = currentVariant().id;
  const selectedAiEnabled = homeState.mode === "computer";
  if (saved.variantId !== selectedVariantId) return null;
  if (Boolean(saved.aiEnabled) !== selectedAiEnabled) return null;
  return saved;
}

let rotateLockOverlayElement = null;

function ensureRotateLockOverlay() {
  if (rotateLockOverlayElement) return rotateLockOverlayElement;
  const overlay = document.createElement("div");
  overlay.className = "rotate-lock-overlay";
  overlay.innerHTML = `
    <div class="rotate-lock-card">
      <h2>Rotate Device</h2>
      <p>Switch to landscape mode for the best gameplay layout.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  rotateLockOverlayElement = overlay;
  return overlay;
}

function updateRotateLockOverlay() {
  if (!rotateLockOverlayElement) return;
  const inPortrait = window.matchMedia("(orientation: portrait)").matches;
  const activeGameplay = document.body.classList.contains("landscape-game-active");
  rotateLockOverlayElement.classList.toggle("active", activeGameplay && inPortrait);
}

async function requestLandscapeGameplay() {
  document.body.classList.add("landscape-game-active");
  ensureRotateLockOverlay();
  updateRotateLockOverlay();

  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch (_) {}
  }

  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock("landscape");
    } catch (_) {}
  }
}

function releaseLandscapeGameplay() {
  document.body.classList.remove("landscape-game-active");
  updateRotateLockOverlay();

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

window.addEventListener("resize", updateRotateLockOverlay);
window.addEventListener("orientationchange", updateRotateLockOverlay);
document.addEventListener("fullscreenchange", updateRotateLockOverlay);

function showScreen(screen) {
  if (homeScreenElement) homeScreenElement.classList.add("hidden");
  if (levelScreenElement) levelScreenElement.classList.add("hidden");
  if (gameScreenElement) gameScreenElement.classList.add("hidden");
  if (rewardsScreenElement) rewardsScreenElement.classList.add("hidden");
  if (shopScreenElement) shopScreenElement.classList.add("hidden");
  if (settingsButton) settingsButton.classList.remove("hidden");
  if (screen === "home" && homeScreenElement) homeScreenElement.classList.remove("hidden");
  if (screen === "level" && levelScreenElement) levelScreenElement.classList.remove("hidden");
  if (screen === "game" && gameScreenElement) gameScreenElement.classList.remove("hidden");
  if (screen === "rewards" && rewardsScreenElement) rewardsScreenElement.classList.remove("hidden");
  if (screen === "shop" && shopScreenElement) shopScreenElement.classList.remove("hidden");
  if (screen === "game" && settingsButton) settingsButton.classList.add("hidden");
  if (hubBackButtonElement) hubBackButtonElement.classList.toggle("hidden", screen !== "home");
  if (screen !== "game" && effectsToolbarElement) effectsToolbarElement.classList.remove("open");

  if (screen === "game" || screen === "shop") {
    requestLandscapeGameplay();
  } else {
    releaseLandscapeGameplay();
  }
}

function renderMode() {
  if (!modePassPlayButton || !modeComputerButton) return;
  const isPassPlay = homeState.mode === "pass_play";
  modePassPlayButton.classList.toggle("active", isPassPlay);
  modeComputerButton.classList.toggle("active", !isPassPlay);
}

function renderVariantCard() {
  const variant = currentVariant();
  if (variantNameElement) variantNameElement.textContent = variant.name;
  if (variantFlagElement) variantFlagElement.style.backgroundImage = `url("${variant.flag}")`;
  if (rulesButton) {
    rulesButton.textContent = "Rules";
    rulesButton.title = `Rules: ${variant.name}`;
  }
  renderTopStats();
  renderBackgroundShop();
  renderBoardShop();
}

function renderLevelScreen() {
  const variant = currentVariant();
  const progress = currentProgress();
  const maxUnlockedLevel = unlockedLevelIndex(progress);

  if (levelListElement) {
    levelListElement.innerHTML = "";
    for (let i = 0; i < LEVELS.length; i++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "level-chip";
      if (i === progress.selectedLevelIndex) button.classList.add("active");
      if (i > maxUnlockedLevel) button.classList.add("locked");
      button.dataset.levelIndex = String(i);
      button.textContent = LEVELS[i];
      if (i > maxUnlockedLevel) button.disabled = true;
      levelListElement.appendChild(button);
    }
  }

  if (tierGridElement) {
    tierGridElement.innerHTML = "";
    const unlockedTier = unlockedTierForLevel(progress, progress.selectedLevelIndex);
    const wins = progress.tierWins[progress.selectedLevelIndex];
    for (let tier = 1; tier <= TIERS_PER_LEVEL; tier++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tier-button";
      if (tier <= wins || tier === progress.selectedTier) button.classList.add("active");
      if (tier > unlockedTier) button.classList.add("locked");
      button.dataset.tier = String(tier);
      button.textContent = `Tier ${tier}`;
      if (tier > unlockedTier) button.disabled = true;
      tierGridElement.appendChild(button);
    }
  }

  if (tierHeadlineElement) {
    tierHeadlineElement.textContent =
      `${variant.name} - ${LEVELS[progress.selectedLevelIndex]} - Tier ${progress.selectedTier} of ${TIERS_PER_LEVEL}`;
  }
}

function openRulesModal() {
  const variant = currentVariant();
  if (!rulesModalElement) return;
  if (rulesTitleElement) rulesTitleElement.textContent = `${variant.name} Rules`;
  if (rulesBodyElement) rulesBodyElement.textContent = variant.rules.join("\n");
  rulesModalElement.classList.remove("hidden");
}

function closeRulesModal() {
  if (rulesModalElement) rulesModalElement.classList.add("hidden");
}

function renderSettingsState() {
  const setActive = (button, active) => {
    if (!button) return;
    button.classList.toggle("active-set", active);
  };
  setActive(setSfxOnButton, settingsState.sfxOn);
  setActive(setSfxOffButton, !settingsState.sfxOn);
  setActive(setBgmOnButton, settingsState.bgmOn);
  setActive(setBgmOffButton, !settingsState.bgmOn);
  setActive(setFirstWhiteButton, settingsState.firstMove === PLAYER.WHITE);
  setActive(setFirstBlackButton, settingsState.firstMove === PLAYER.BLACK);
  setActive(setPlayAsWhiteButton, settingsState.playAs === PLAYER.WHITE);
  setActive(setPlayAsBlackButton, settingsState.playAs === PLAYER.BLACK);
  setActive(setForcedOnButton, settingsState.forcedCaptureOn);
  setActive(setForcedOffButton, !settingsState.forcedCaptureOn);
}

function applyEffectButtonIcons() {
  const map = [
    ["undo", fxUndoButton],
    ["hint_r1", fxHintR1Button],
    ["hint_r2", fxHintR2Button],
    ["hint_r3", fxHintR3Button],
    ["hint_r4", fxHintR4Button],
    ["hint_r5", fxHintR5Button],
    ["hint_r6", fxHintR6Button],
    ["threat_scanner", fxThreatButton],
    ["move_highlighter", fxMovesButton],
    ["mistake_shield", fxShieldButton],
    ["freeze_ai", fxFreezeButton]
  ];
  for (const [effectId, button] of map) {
    if (!button) continue;
    const url = FX_ICON_BY_EFFECT[effectId];
    if (!url) continue;
    button.style.backgroundImage = `url("${url}")`;
  }
}
function openSettingsModal() {
  if (!settingsModalElement) return;
  renderSettingsState();
  settingsModalElement.classList.remove("hidden");
}

function closeSettingsModal() {
  if (!settingsModalElement) return;
  settingsModalElement.classList.add("hidden");
}

function startSelectedMatch(aiEnabled) {
  clearSavedMatch();
  const progress = currentProgress();
  const selectedVariant = {
    ...currentVariant(),
    captureMandatory: settingsState.forcedCaptureOn
  };
  const humanPlayer = aiEnabled ? settingsState.playAs : PLAYER.WHITE;
  const aiPlayer = humanPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  const options = {
    firstPlayer: settingsState.firstMove,
    humanPlayer,
    aiPlayer
  };
  const profile = {
    levelIndex: progress.selectedLevelIndex,
    tier: progress.selectedTier
  };
  sessionState.lastMatch = {
    variantId: selectedVariant.id,
    aiEnabled,
    levelIndex: profile.levelIndex,
    tier: profile.tier,
    options
  };
  closeResultModal();
  closeSettingsModal();
  controller.startMatch(selectedVariant, aiEnabled, profile, options);
  renderTopStats();
  renderEffectsToolbar();
  playBgm();
  showScreen("game");
}

function startReplayMatch() {
  clearSavedMatch();
  if (!sessionState.lastMatch) return;
  const replayVariantIndex = VARIANTS.findIndex(item => item.id === sessionState.lastMatch.variantId);
  if (replayVariantIndex >= 0) homeState.selectedVariantIndex = replayVariantIndex;
  const progress = currentProgress();
  progress.selectedLevelIndex = sessionState.lastMatch.levelIndex;
  progress.selectedTier = sessionState.lastMatch.tier;
  const aiEnabled = Boolean(sessionState.lastMatch.aiEnabled);
  const selectedVariant = {
    ...currentVariant(),
    captureMandatory: settingsState.forcedCaptureOn
  };
  const options = sessionState.lastMatch.options || {
    firstPlayer: settingsState.firstMove,
    humanPlayer: aiEnabled ? settingsState.playAs : PLAYER.WHITE,
    aiPlayer: (aiEnabled ? settingsState.playAs : PLAYER.WHITE) === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
  };
  closeResultModal();
  controller.startMatch(selectedVariant, aiEnabled, {
    levelIndex: progress.selectedLevelIndex,
    tier: progress.selectedTier
  }, options);
  renderTopStats();
  renderEffectsToolbar();
  playBgm();
  showScreen("game");
}

function initializeHome() {
  applyEffectButtonIcons();
  if (effectsNavToggleButton && effectsToolbarElement) {
    effectsNavToggleButton.addEventListener("click", () => {
      effectsToolbarElement.classList.toggle("open");
    });
  }

  if (modePassPlayButton) {
    modePassPlayButton.addEventListener("click", () => {
      homeState.mode = "pass_play";
      renderMode();
    });
  }
  if (modeComputerButton) {
    modeComputerButton.addEventListener("click", () => {
      homeState.mode = "computer";
      renderMode();
    });
  }

  if (variantPrevButton) {
    variantPrevButton.addEventListener("click", () => {
      homeState.selectedVariantIndex =
        (homeState.selectedVariantIndex - 1 + VARIANTS.length) % VARIANTS.length;
      renderVariantCard();
      saveState();
    });
  }
  if (variantNextButton) {
    variantNextButton.addEventListener("click", () => {
      homeState.selectedVariantIndex = (homeState.selectedVariantIndex + 1) % VARIANTS.length;
      renderVariantCard();
      saveState();
    });
  }

  if (rulesButton) rulesButton.addEventListener("click", openRulesModal);
  if (settingsButton) settingsButton.addEventListener("click", openSettingsModal);
  if (settingsCloseButton) settingsCloseButton.addEventListener("click", closeSettingsModal);
  if (settingsModalElement) {
    settingsModalElement.addEventListener("click", event => {
      if (event.target === settingsModalElement) closeSettingsModal();
    });
  }
  if (setSfxOnButton) {
    setSfxOnButton.addEventListener("click", () => {
      settingsState.sfxOn = true;
      renderSettingsState();
      saveState();
    });
  }
  if (setSfxOffButton) {
    setSfxOffButton.addEventListener("click", () => {
      settingsState.sfxOn = false;
      renderSettingsState();
      saveState();
    });
  }
  if (setBgmOnButton) {
    setBgmOnButton.addEventListener("click", () => {
      settingsState.bgmOn = true;
      playBgm();
      renderSettingsState();
      saveState();
    });
  }
  if (setBgmOffButton) {
    setBgmOffButton.addEventListener("click", () => {
      settingsState.bgmOn = false;
      stopBgm();
      renderSettingsState();
      saveState();
    });
  }
  if (setFirstWhiteButton) {
    setFirstWhiteButton.addEventListener("click", () => {
      settingsState.firstMove = PLAYER.WHITE;
      renderSettingsState();
      saveState();
    });
  }
  if (setFirstBlackButton) {
    setFirstBlackButton.addEventListener("click", () => {
      settingsState.firstMove = PLAYER.BLACK;
      renderSettingsState();
      saveState();
    });
  }
  if (setPlayAsWhiteButton) {
    setPlayAsWhiteButton.addEventListener("click", () => {
      settingsState.playAs = PLAYER.WHITE;
      renderSettingsState();
      saveState();
    });
  }
  if (setPlayAsBlackButton) {
    setPlayAsBlackButton.addEventListener("click", () => {
      settingsState.playAs = PLAYER.BLACK;
      renderSettingsState();
      saveState();
    });
  }
  if (setForcedOnButton) {
    setForcedOnButton.addEventListener("click", () => {
      settingsState.forcedCaptureOn = true;
      controller.gameState.variant.captureMandatory = true;
      controller.refresh();
      renderSettingsState();
      saveState();
    });
  }
  if (setForcedOffButton) {
    setForcedOffButton.addEventListener("click", () => {
      settingsState.forcedCaptureOn = false;
      controller.gameState.variant.captureMandatory = false;
      controller.refresh();
      renderSettingsState();
      saveState();
    });
  }
  if (shopButton) {
    shopButton.addEventListener("click", () => {
      renderPieceShop();
      renderBackgroundShop();
      renderBoardShop();
      renderEffectsShop();
      closeResultModal();
      showScreen("shop");
    });
  }
  if (shopBackButton) {
    shopBackButton.addEventListener("click", () => showScreen("home"));
  }
  if (claimButton) {
    claimButton.addEventListener("click", () => {
      renderRewardsScreen();
      closeResultModal();
      showScreen("rewards");
    });
  }
  if (rewardsBackButton) {
    rewardsBackButton.addEventListener("click", () => showScreen("home"));
  }
  if (rulesCloseButton) rulesCloseButton.addEventListener("click", closeRulesModal);
  if (rulesModalElement) {
    rulesModalElement.addEventListener("click", event => {
      if (event.target === rulesModalElement) closeRulesModal();
    });
  }
  if (resultCancelButton) resultCancelButton.addEventListener("click", closeResultModal);
  if (resultModalElement) {
    resultModalElement.addEventListener("click", event => {
      if (event.target === resultModalElement) closeResultModal();
    });
  }
  if (resumeModalElement) {
    resumeModalElement.addEventListener("click", event => {
      if (event.target === resumeModalElement) closeResumeModal();
    });
  }
  if (resultMenuButton) {
    resultMenuButton.addEventListener("click", () => {
      closeResultModal();
      showScreen("home");
    });
  }
  if (resultReplayButton) {
    resultReplayButton.addEventListener("click", () => {
      startReplayMatch();
    });
  }
  if (resultNextButton) {
    resultNextButton.addEventListener("click", () => {
      if (!controller.aiEnabled) return;
      startSelectedMatch(true);
    });
  }
  if (piecePrevButton) {
    piecePrevButton.addEventListener("click", () => {
      shopState.piecePage = Math.max(0, shopState.piecePage - 1);
      renderPieceShop();
      saveState();
    });
  }
  if (pieceNextButton) {
    pieceNextButton.addEventListener("click", () => {
      shopState.piecePage += 1;
      renderPieceShop();
      saveState();
    });
  }
  if (pieceDefaultButton) {
    pieceDefaultButton.addEventListener("click", () => {
      shopState.equippedPieceSkin = "default";
      applyEquippedPieceSkin();
      controller.refresh();
      renderPieceShop();
      saveState();
    });
  }
  if (bgPrevButton) {
    bgPrevButton.addEventListener("click", () => {
      shopState.backgroundPage = Math.max(0, shopState.backgroundPage - 1);
      renderBackgroundShop();
      saveState();
    });
  }
  if (bgNextButton) {
    bgNextButton.addEventListener("click", () => {
      shopState.backgroundPage += 1;
      renderBackgroundShop();
      saveState();
    });
  }
  if (backgroundDefaultButton) {
    backgroundDefaultButton.addEventListener("click", () => {
      shopState.equippedBackground = null;
      applyEquippedBackground();
      renderBackgroundShop();
      saveState();
    });
  }
  if (boardPrevButton) {
    boardPrevButton.addEventListener("click", () => {
      shopState.boardPage = Math.max(0, shopState.boardPage - 1);
      renderBoardShop();
      saveState();
    });
  }
  if (boardNextButton) {
    boardNextButton.addEventListener("click", () => {
      shopState.boardPage += 1;
      renderBoardShop();
      saveState();
    });
  }
  if (boardDefaultButton) {
    boardDefaultButton.addEventListener("click", () => {
      shopState.equippedBoard = null;
      applyEquippedBoardTheme();
      controller.refresh();
      renderBoardShop();
      saveState();
    });
  }
  if (effectPrevButton) {
    effectPrevButton.addEventListener("click", () => {
      shopState.effectPage = Math.max(0, shopState.effectPage - 1);
      renderEffectsShop();
      saveState();
    });
  }
  if (effectNextButton) {
    effectNextButton.addEventListener("click", () => {
      shopState.effectPage += 1;
      renderEffectsShop();
      saveState();
    });
  }
  if (gameBackButton) {
    gameBackButton.addEventListener("click", () => {
      saveMatchSnapshot();
      controller.gameOver = true;
      controller.aiBusy = false;
      closeResultModal();
      showScreen("home");
    });
  }
  if (fxUndoButton) fxUndoButton.addEventListener("click", () => activateEffect("undo"));
  if (fxHintR1Button) fxHintR1Button.addEventListener("click", () => activateEffect("hint_r1"));
  if (fxHintR2Button) fxHintR2Button.addEventListener("click", () => activateEffect("hint_r2"));
  if (fxHintR3Button) fxHintR3Button.addEventListener("click", () => activateEffect("hint_r3"));
  if (fxHintR4Button) fxHintR4Button.addEventListener("click", () => activateEffect("hint_r4"));
  if (fxHintR5Button) fxHintR5Button.addEventListener("click", () => activateEffect("hint_r5"));
  if (fxHintR6Button) fxHintR6Button.addEventListener("click", () => activateEffect("hint_r6"));
  if (fxThreatButton) fxThreatButton.addEventListener("click", () => activateEffect("threat_scanner"));
  if (fxMovesButton) fxMovesButton.addEventListener("click", () => activateEffect("move_highlighter"));
  if (fxShieldButton) fxShieldButton.addEventListener("click", () => activateEffect("mistake_shield"));
  if (fxFreezeButton) fxFreezeButton.addEventListener("click", () => activateEffect("freeze_ai"));

  if (playNowButton) {
    playNowButton.addEventListener("click", () => {
      const savedRaw = getResumeMatchForCurrentSelection();
      if (savedRaw) {
        openResumeModal(
          savedRaw,
          () => clearSavedMatch(),
          () => {
            clearSavedMatch();
            if (homeState.mode === "computer") {
              renderLevelScreen();
              showScreen("level");
            } else {
              startSelectedMatch(false);
            }
          }
        );
        return;
      }
      if (homeState.mode === "computer") {
        renderLevelScreen();
        showScreen("level");
      } else {
        startSelectedMatch(false);
      }
    });
  }

  if (levelBackButton) {
    levelBackButton.addEventListener("click", () => showScreen("home"));
  }
  if (levelListElement) {
    levelListElement.addEventListener("click", event => {
      const button = event.target.closest("[data-level-index]");
      if (!button) return;
      const progress = currentProgress();
      const nextLevel = Number(button.dataset.levelIndex);
      if (nextLevel > unlockedLevelIndex(progress)) return;
      progress.selectedLevelIndex = nextLevel;
      const unlockedTier = unlockedTierForLevel(progress, progress.selectedLevelIndex);
      if (progress.selectedTier > unlockedTier) progress.selectedTier = unlockedTier;
      renderLevelScreen();
      renderTopStats();
      renderBackgroundShop();
      renderBoardShop();
      saveState();
    });
  }
  if (tierGridElement) {
    tierGridElement.addEventListener("click", event => {
      const button = event.target.closest("[data-tier]");
      if (!button) return;
      const progress = currentProgress();
      const nextTier = Number(button.dataset.tier);
      const unlockedTier = unlockedTierForLevel(progress, progress.selectedLevelIndex);
      if (nextTier > unlockedTier) return;
      progress.selectedTier = nextTier;
      renderLevelScreen();
      renderTopStats();
      renderBackgroundShop();
      renderBoardShop();
      saveState();
    });
  }
  if (startTierButton) {
    startTierButton.addEventListener("click", () => {
      startSelectedMatch(true);
    });
  }

  const unlockBgm = () => {
    playBgm();
    document.removeEventListener("pointerdown", unlockBgm);
    document.removeEventListener("keydown", unlockBgm);
  };
  document.addEventListener("pointerdown", unlockBgm, { passive: true });
  document.addEventListener("keydown", unlockBgm);

  renderMode();
  renderVariantCard();
  renderTopStats();
  renderClaimButton();
  renderPieceShop();
  renderBackgroundShop();
  renderBoardShop();
  renderEffectsShop();
  renderEffectsToolbar();
  renderSettingsState();
  controller.gameState.variant.captureMandatory = settingsState.forcedCaptureOn;
  showScreen("home");
}

loadState();
applyEquippedPieceSkin();
applyEquippedBackground();
applyEquippedBoardTheme();
initializeHome();

