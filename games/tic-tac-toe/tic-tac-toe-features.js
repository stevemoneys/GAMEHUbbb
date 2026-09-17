/* Phase 11.5B: shared, non-visual foundation for future feature experiences. */
(function createFeatureCore(global) {
  "use strict";

  const BOARD_SIZE = 3;
  const CELL_COUNT = BOARD_SIZE ** 2;
  const MATCH_TYPES = Object.freeze(["standard", "quick_duel", "tactical_challenge", "daily_challenge", "mastery_trial", "rival", "rival_rematch", "modifier", "speed_duel", "prediction", "two_player_series", "experimental", "replay", "what_if"]);
  const OBJECTIVE_TYPES = Object.freeze(["WIN", "DRAW", "BLOCK", "FORK", "PREVENT_FORK", "FORCE_DRAW", "WIN_IN_1", "WIN_IN_2", "PREDICT", "SURVIVE_SEQUENCE", "TIME_LIMIT"]);
  const PERSONALITIES = Object.freeze(["human", "aggressive", "defensive", "trickster"]);
  const FEATURE_REGISTRY = Object.freeze({
    tactical_challenges: { category: "master", enabled: true, progression: false, statistics: false, replay: true },
    quick_duel: { category: "play", enabled: false, progression: false, statistics: true, replay: true },
    daily_challenge: { category: "master", enabled: true, progression: false, statistics: false, replay: true },
    mastery_trials: { category: "master", enabled: true, progression: false, statistics: false, replay: true },
    rivals: { category: "play", enabled: false, progression: false, statistics: true, replay: true },
    modifiers: { category: "lab", enabled: false, progression: false, statistics: false, replay: true },
    replay: { category: "review", enabled: false, progression: false, statistics: false, replay: false },
    what_if: { category: "review", enabled: false, progression: false, statistics: false, replay: false }
  });
  const WIN_LINES = Object.freeze([[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]);
  let engine = null;

  const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const symbol = (value, fallback = "X") => value === "X" || value === "O" ? value : fallback;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const other = (mark) => mark === "X" ? "O" : "X";
  const integer = (value) => Number.isInteger(value) ? value : Number.NaN;

  function createDefaultRules() {
    return { boardSize: BOARD_SIZE, winLength: 3, blockedCells: [], centerLocked: false, forcedOpening: null, misere: false };
  }

  function normalizeRules(raw = {}) {
    if (!isRecord(raw)) return { valid: false, reason: "Rules must be an object." };
    if (raw.boardSize !== undefined && raw.boardSize !== BOARD_SIZE) return { valid: false, reason: "Only the 3 × 3 board is supported." };
    if (raw.winLength !== undefined && raw.winLength !== 3) return { valid: false, reason: "Only three-in-a-row is supported." };
    if (raw.misere === true) return { valid: false, reason: "Misère is reserved until the engine supports it end-to-end." };
    const blocked = Array.isArray(raw.blockedCells) ? raw.blockedCells : [];
    const cells = [...new Set(blocked.map(integer))];
    if (cells.length !== blocked.length || cells.some((cell) => !Number.isInteger(cell) || cell < 0 || cell >= CELL_COUNT)) return { valid: false, reason: "Blocked cells must be unique board indices." };
    if (cells.length || raw.centerLocked === true) return { valid: false, reason: "Blocked-cell rules are defined but not enabled until the engine enforces them for every actor." };
    const forcedOpening = raw.forcedOpening === null || raw.forcedOpening === undefined ? null : integer(raw.forcedOpening);
    if (forcedOpening !== null) return { valid: false, reason: "Forced openings are defined but not enabled until the engine applies them atomically." };
    return { valid: true, value: createDefaultRules() };
  }

  function createDefaultMatchConfig() {
    return { type: "standard", mode: "ai", level: 1, personality: "human", playerSymbol: "X", aiSymbol: "O", rules: createDefaultRules(), timer: { enabled: true, secondsPerTurn: 10 }, objective: { type: "WIN" }, permissions: { progression: true, statistics: true, achievements: true, replay: true } };
  }

  function normalizeMatchConfig(raw = {}) {
    const source = isRecord(raw) ? raw : {};
    const base = createDefaultMatchConfig();
    const type = source.type ?? base.type;
    if (!MATCH_TYPES.includes(type)) return { valid: false, reason: "Unknown match type." };
    const mode = source.mode ?? base.mode;
    if (!["ai", "two"].includes(mode)) return { valid: false, reason: "Unknown match mode." };
    const level = Number(source.level ?? base.level);
    if (!Number.isInteger(level) || level < 1 || level > 20) return { valid: false, reason: "Level must be between 1 and 20." };
    const playerSymbol = symbol(source.playerSymbol, base.playerSymbol);
    const aiSymbol = mode === "ai" ? other(playerSymbol) : symbol(source.aiSymbol, other(playerSymbol));
    const personality = source.personality ?? base.personality;
    if (!PERSONALITIES.includes(personality)) return { valid: false, reason: "Unknown AI personality." };
    const rules = normalizeRules(source.rules || {});
    if (!rules.valid) return rules;
    const timerSource = isRecord(source.timer) ? source.timer : {};
    const timer = { enabled: timerSource.enabled !== false, secondsPerTurn: Number(timerSource.secondsPerTurn ?? base.timer.secondsPerTurn) };
    if (!Number.isInteger(timer.secondsPerTurn) || timer.secondsPerTurn < 3 || timer.secondsPerTurn > 60) return { valid: false, reason: "Timer must be 3–60 seconds." };
    const objectiveType = source.objective?.type ?? base.objective.type;
    if (!OBJECTIVE_TYPES.includes(objectiveType)) return { valid: false, reason: "Unknown objective." };
    const permissionSource = isRecord(source.permissions) ? source.permissions : {};
    const permissions = { progression: permissionSource.progression !== false, statistics: permissionSource.statistics !== false, achievements: permissionSource.achievements !== false, replay: permissionSource.replay !== false };
    if (["replay", "what_if", "tactical_challenge", "daily_challenge", "mastery_trial", "experimental"].includes(type)) permissions.progression = false;
    if (["replay", "what_if"].includes(type)) { permissions.statistics = false; permissions.achievements = false; }
    return { valid: true, value: Object.freeze({ type, mode, level, personality, playerSymbol, aiSymbol, rules: Object.freeze(rules.value), timer: Object.freeze(timer), objective: Object.freeze({ type: objectiveType }), permissions: Object.freeze(permissions) }) };
  }

  function getWinner(board) { return WIN_LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[b] === board[c]) || null; }
  function legalMoves(board, rules = createDefaultRules()) { return board.reduce((moves, value, index) => value === "" && !rules.blockedCells.includes(index) ? [...moves, index] : moves, []); }
  function withMove(board, index, mark) { const next = [...board]; next[index] = mark; return next; }
  function immediateWins(board, mark, rules) { return legalMoves(board, rules).filter((move) => getWinner(withMove(board, move, mark))); }
  function forkMoves(board, mark, rules) { return legalMoves(board, rules).filter((move) => immediateWins(withMove(board, move, mark), mark, rules).length >= 2); }

  function analyzePosition({ board, playerSymbol = "X", opponentSymbol = "O", rules = createDefaultRules() } = {}) {
    if (!Array.isArray(board) || board.length !== CELL_COUNT || board.some((cell) => cell !== "" && cell !== "X" && cell !== "O")) return { valid: false, reason: "Invalid board." };
    const normalizedRules = normalizeRules(rules);
    if (!normalizedRules.valid) return normalizedRules;
    const resolved = normalizedRules.value;
    const player = symbol(playerSymbol);
    const opponent = symbol(opponentSymbol, other(player));
    const legal = engine?.analysis?.legalMoves ? engine.analysis.legalMoves(board, resolved) : legalMoves(board, resolved);
    const wins = engine?.analysis?.winningMoves ? engine.analysis.winningMoves(board, player) : immediateWins(board, player, resolved);
    const opponentWins = engine?.analysis?.winningMoves ? engine.analysis.winningMoves(board, opponent) : immediateWins(board, opponent, resolved);
    const forks = engine?.analysis?.forkMoves ? engine.analysis.forkMoves(board, player) : forkMoves(board, player, resolved);
    const counterForks = engine?.analysis?.forkMoves ? engine.analysis.forkMoves(board, opponent) : forkMoves(board, opponent, resolved);
    const bestMoves = wins.length ? wins : opponentWins.length ? opponentWins : forks.length ? forks : legal;
    return { valid: true, board: [...board], legalMoves: legal, immediateWins: wins, opponentImmediateWins: opponentWins, forks, counterForks, bestMoves, outcome: wins.length ? "WIN" : opponentWins.length ? "THREAT" : legal.length ? "UNKNOWN" : "DRAW", criticalMoves: [...new Set([...wins, ...opponentWins, ...forks, ...counterForks])] };
  }

  function evaluateObjective(objective, state, context = {}) {
    const type = objective?.type;
    if (!OBJECTIVE_TYPES.includes(type)) return { satisfied: false, objective: type || "UNKNOWN", reason: "Unsupported objective." };
    const analysis = analyzePosition({ board: state?.board, playerSymbol: context.playerSymbol, opponentSymbol: context.opponentSymbol, rules: context.rules });
    if (!analysis.valid) return { satisfied: false, objective: type, reason: analysis.reason };
    const result = state?.result?.outcome;
    const succeeded = ({ WIN: result === "win", DRAW: result === "draw", BLOCK: Boolean(context.blockedThreat), FORK: Boolean(context.createdFork), PREVENT_FORK: Boolean(context.preventedFork), FORCE_DRAW: result === "draw", WIN_IN_1: analysis.immediateWins.length > 0, WIN_IN_2: analysis.forks.length > 0, PREDICT: context.predictionCorrect === true, SURVIVE_SEQUENCE: Boolean(context.survivedSequence), TIME_LIMIT: Boolean(context.withinTimeLimit) })[type];
    const reasons = { WIN: "Match won.", DRAW: "Draw preserved.", BLOCK: "Immediate threat blocked.", FORK: "Fork created.", PREVENT_FORK: "Opponent fork prevented.", FORCE_DRAW: "Best available draw preserved.", WIN_IN_1: "Winning move is available.", WIN_IN_2: "Fork creates a forced next threat.", PREDICT: "Prediction matched the AI move.", SURVIVE_SEQUENCE: "Required sequence survived.", TIME_LIMIT: "Time requirement met." };
    return { satisfied: Boolean(succeeded), objective: type, reason: succeeded ? reasons[type] : "Objective conditions are not yet satisfied.", analysis };
  }

  function isLegalPosition(board, currentPlayer, rules) {
    if (!Array.isArray(board) || board.length !== CELL_COUNT || board.some((cell) => cell !== "" && cell !== "X" && cell !== "O")) return false;
    const x = board.filter((cell) => cell === "X").length;
    const o = board.filter((cell) => cell === "O").length;
    if (!(x === o || x === o + 1) || currentPlayer !== (x === o ? "X" : "O")) return false;
    const winner = getWinner(board);
    if (winner) return false;
    return normalizeRules(rules).valid;
  }

  function seeded(seed) { let value = Math.abs([...String(seed)].reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)) || 1; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function generatePosition({ seed = "default", objective = "WIN_IN_1", difficulty = 1, seen = [] } = {}) {
    if (!OBJECTIVE_TYPES.includes(objective)) return { valid: false, reason: "Unknown tactical objective." };
    const random = seeded(`${seed}:${objective}:${difficulty}`);
    const orders = [[0, 4, 1, 8], [4, 0, 8, 2], [2, 4, 0, 6], [6, 4, 8, 0], [0, 1, 4, 2]];
    for (let attempt = 0; attempt < orders.length; attempt += 1) {
      const order = orders[(attempt + Math.floor(random() * orders.length)) % orders.length];
      const board = Array(CELL_COUNT).fill("");
      order.forEach((cell, index) => { board[cell] = index % 2 === 0 ? "X" : "O"; });
      const currentPlayer = "X";
      const analysis = analyzePosition({ board, playerSymbol: currentPlayer, opponentSymbol: other(currentPlayer) });
      const property = objective === "WIN_IN_1" ? analysis.immediateWins.length > 0 : objective === "WIN_IN_2" || objective === "FORK" ? analysis.forks.length > 0 : objective === "BLOCK" || objective === "PREVENT_FORK" ? analysis.opponentImmediateWins.length > 0 || analysis.counterForks.length > 0 : analysis.legalMoves.length > 0;
      const fingerprint = board.join("-");
      if (isLegalPosition(board, currentPlayer, createDefaultRules()) && property && !seen.includes(fingerprint)) return { valid: true, board, playerSymbol: currentPlayer, opponentSymbol: other(currentPlayer), currentPlayer, objective: { type: objective }, difficulty, seed: String(seed), fingerprint, analysis };
    }
    return { valid: false, reason: "No validated tactical position was generated." };
  }

  function createReplay({ config, moves, result, createdAt = Date.now() } = {}) {
    const normalized = normalizeMatchConfig(config);
    if (!normalized.valid || !Array.isArray(moves) || moves.length > CELL_COUNT || moves.some((move) => !Number.isInteger(move) || move < 0 || move >= CELL_COUNT)) return { valid: false, reason: "Replay record is invalid." };
    return { valid: true, value: { version: 1, id: `${createdAt}-${moves.join("")}`, matchType: normalized.value.type, level: normalized.value.level, personality: normalized.value.personality, playerSymbol: normalized.value.playerSymbol, aiSymbol: normalized.value.aiSymbol, rules: clone(normalized.value.rules), moves: [...moves], result: typeof result === "string" ? result : "draw", createdAt } };
  }

  function recordReplay(record) {
    const created = createReplay(record);
    if (!created.valid || !global.TicTacToeSave) return created;
    global.TicTacToeSave.update((save) => {
      const history = Array.isArray(save.features?.replays) ? save.features.replays : [];
      save.features.replays = [created.value, ...history.filter((entry) => entry.id !== created.value.id)].slice(0, 12);
    });
    return created;
  }

  function reconstructReplay(replay, step = replay?.moves?.length ?? 0) {
    if (!isRecord(replay) || !Array.isArray(replay.moves) || step < 0 || step > replay.moves.length) return { valid: false, reason: "Replay unavailable." };
    const rules = normalizeRules(replay.rules || {});
    if (!rules.valid) return rules;
    const board = Array(CELL_COUNT).fill("");
    for (let index = 0; index < step; index += 1) {
      const cell = replay.moves[index];
      if (!Number.isInteger(cell) || cell < 0 || cell >= CELL_COUNT || board[cell] || rules.value.blockedCells.includes(cell)) return { valid: false, reason: "Replay move sequence is invalid." };
      board[cell] = index % 2 === 0 ? "X" : "O";
    }
    return { valid: true, board, nextPlayer: step % 2 === 0 ? "X" : "O", step, complete: step === replay.moves.length };
  }

  function createSandbox(replay, step) {
    const position = reconstructReplay(replay, step);
    if (!position.valid) return position;
    return { valid: true, value: { id: `sandbox-${Date.now()}`, sourceReplayId: replay.id, board: [...position.board], currentPlayer: position.nextPlayer, config: Object.freeze({ ...replay, permissions: Object.freeze({ progression: false, statistics: false, achievements: false, replay: false }) }), destroyed: false } };
  }
  function destroySandbox(sandbox) { if (!sandbox || sandbox.destroyed) return false; sandbox.board = []; sandbox.destroyed = true; return true; }

  global.TicTacToeFeatureCore = Object.freeze({ MATCH_TYPES, OBJECTIVE_TYPES, FEATURE_REGISTRY, createDefaultRules, normalizeRules, createDefaultMatchConfig, normalizeMatchConfig, analyzePosition, evaluateObjective, generatePosition, createReplay, recordReplay, reconstructReplay, createSandbox, destroySandbox, attachEngine: (api) => { engine = api; } });
}(window));
