/* Phase 11: 3×3, 4×4, and 5×5 share a transient, size-aware match controller. */
(function createBoardSizeMode(global) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = { size: 3, target: 3, level: 1, mode: null, board: [], current: "X", playerMark: "X", aiMark: "O", active: false, thinking: false, generation: 0, timeout: null, history: [], context: null, resultRecorded: false };
  const defaults = { 3: 3, 4: 4, 5: 4 };
  const validTargets = { 3: [3], 4: [3,4], 5: [4] };
  const other = (mark) => mark === "X" ? "O" : "X";
  const $all = (selector) => [...document.querySelectorAll(selector)];

  function clearPending() { clearTimeout(state.timeout); state.timeout = null; state.thinking = false; state.generation += 1; }
  function screens(show) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === show));
    global.refreshTicTacToeChrome?.();
  }
  function emit(type, detail = {}) { global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } })); }
  function playerName(mark = state.current) { return state.mode === "ai" ? (mark === state.playerMark ? "You" : "Board AI") : `Player ${mark}`; }
  function lines(size = state.size, target = state.target) {
    const result = [], directions = [[0,1],[1,0],[1,1],[1,-1]];
    for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) for (const [rowStep, colStep] of directions) {
      const endRow = row + (target - 1) * rowStep, endCol = col + (target - 1) * colStep;
      if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
      result.push(Array.from({ length: target }, (_, step) => (row + step * rowStep) * size + col + step * colStep));
    }
    return result;
  }
  function winningLine(board, mark, size = state.size, target = state.target) { return lines(size, target).find((line) => line.every((index) => board[index] === mark)) || null; }
  function legalMoves(board = state.board) { return board.reduce((moves, mark, index) => mark ? moves : moves.concat(index), []); }
  function winningMoves(board, mark, size = state.size, target = state.target) { return legalMoves(board).filter((index) => { const next = [...board]; next[index] = mark; return Boolean(winningLine(next, mark, size, target)); }); }
  function hideResult() { const result = $("sizesResult"); result.hidden = true; result.classList.remove("active", "victory", "defeat", "draw"); }
  function replaySnapshot(lastMove = null, marker = null) { return { turn: state.history.length, board: [...state.board], size: state.size, target: state.target, lastMove, mark: lastMove === null ? null : state.current, nextPlayer: other(state.current), marker }; }
  function maxUnlockedLevel() { const save = global.TicTacToeSave?.get?.(); return Math.max(1, Math.min(20, Number(save?.progression?.levels?.highestUnlocked) || 1)); }

  function open() {
    clearPending(); state.active = false; state.context = null; state.resultRecorded = false; $("sizeboards").classList.remove("challenge-arena"); state.level = Math.min(state.level, maxUnlockedLevel()); $("sizesPlay").hidden = true; $("sizeChoices").hidden = false; $("sizeWinTargets").hidden = state.size === 3; $("sizeAiLevel").hidden = false; $("sizesActions").hidden = false; hideResult(); syncSetup(); screens("sizeboards");
  }
  function close() {
    const returnToJourney = state.context?.type === "AI_CHALLENGE";
    clearPending(); state.active = false; state.context = null; $("sizeboards").classList.remove("challenge-arena"); hideResult();
    if (returnToJourney && global.TicTacToeAIChallenge?.returnToLevels) global.TicTacToeAIChallenge.returnToLevels();
    else if (typeof global.showHomeScreen === "function") global.showHomeScreen();
    else screens("menu");
  }
  function selectSize(size) { if (![3,4,5].includes(size)) return; state.size = size; state.target = defaults[size]; syncSetup(); emit("selection"); }
  function selectTarget(target) { if (!validTargets[state.size].includes(target)) return; state.target = target; renderTargetChoices(); emit("selection"); }
  function syncSetup() {
    if (!validTargets[state.size].includes(state.target)) state.target = defaults[state.size];
    $all("[data-size-choice]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.sizeChoice) === state.size));
    $("sizeWinTargets").hidden = state.size === 3; renderTargetChoices();
    const range = $("sizeLevelRange"), maximum = maxUnlockedLevel(); range.max = String(maximum); state.level = Math.min(state.level, maximum); range.value = String(state.level); $("sizeLevelValue").textContent = String(state.level);
  }
  function renderTargetChoices() { const host = $("sizeWinOptions"); host.innerHTML = validTargets[state.size].map((target) => `<button type="button" class="${target === state.target ? "selected" : ""}" data-size-target="${target}">${target}</button>`).join(""); host.querySelectorAll("[data-size-target]").forEach((button) => button.addEventListener("click", () => selectTarget(Number(button.dataset.sizeTarget)))); }
  function start(mode, options = {}) {
    clearPending(); state.mode = mode; state.playerMark = options.playerSymbol === "O" ? "O" : "X"; state.aiMark = options.aiSymbol === state.playerMark ? other(state.playerMark) : (options.aiSymbol === "X" ? "X" : "O"); state.current = "X"; state.board = Array(state.size ** 2).fill(""); state.active = true; state.resultRecorded = false; state.history = []; state.history.push(replaySnapshot());
    $("sizeChoices").hidden = true; $("sizeWinTargets").hidden = true; $("sizeAiLevel").hidden = true; $("sizesActions").hidden = true; $("sizesPlay").hidden = false; hideResult(); render(); updateTurn();
    if (state.mode === "ai" && state.current === state.aiMark) scheduleAI();
  }
  function restart() { if (!state.mode) { open(); return; } start(state.mode, { playerSymbol: state.playerMark, aiSymbol: state.aiMark }); }
  function updateTurn(note = `${state.size}×${state.size} · ${state.target} in a row`) {
    const turn = $("sizesTurn"), aiTurn = state.mode === "ai" && state.current === state.aiMark; turn.classList.toggle("ai-turn", aiTurn); $("sizesTurnMark").textContent = state.current; turn.querySelector("strong").textContent = state.active ? `${playerName()} turn` : "Match complete"; $("sizesRuleDisplay").textContent = note;
  }
  function render() {
    const board = $("sizesBoard"); board.style.setProperty("--size", state.size); board.innerHTML = state.board.map((mark, index) => `<button type="button" class="sizes-cell ${mark || ""}" data-size-cell="${index}" ${mark || !state.active || state.thinking ? "disabled" : ""} aria-label="Cell ${index + 1}: ${mark || "empty"}">${mark}</button>`).join("");
    board.querySelectorAll("[data-size-cell]").forEach((button) => button.addEventListener("click", () => move(Number(button.dataset.sizeCell)), { once: true }));
  }
  function move(index) {
    if (!state.active || state.thinking || !Number.isInteger(index) || state.board[index]) { emit("invalid_move"); return false; }
    const actor = state.current; state.board[index] = actor; state.history.push(replaySnapshot(index)); emit("piece_place", { symbol: actor, actor: actor === state.playerMark ? "player" : "ai" }); render();
    const line = winningLine(state.board, actor); if (line) { line.forEach((cell) => document.querySelector(`[data-size-cell="${cell}"]`)?.classList.add("win")); finish(actor, false); return true; }
    if (!legalMoves().length) { finish(null, true); return true; }
    state.current = other(actor); updateTurn(); if (state.mode === "ai" && state.current === state.aiMark) scheduleAI(); return true;
  }
  function potentialScore(board, mark, size = state.size, target = state.target) {
    const opponent = other(mark); return lines(size, target).reduce((score, line) => { const own = line.filter((index) => board[index] === mark).length, theirs = line.filter((index) => board[index] === opponent).length; if (theirs) return score; return score + own * own * 10 + (own ? 4 : 1); }, 0);
  }
  function forkMoves(board, mark, size = state.size, target = state.target) {
    return legalMoves(board).filter((index) => {
      const next = [...board]; next[index] = mark;
      return winningMoves(next, mark, size, target).length >= 2;
    });
  }
  function challengeProfile(level) {
    const normalized = Math.max(1, Math.min(20, Number(level) || 1));
    const progress = (normalized - 1) / 19;
    return {
      winAwareness: Math.min(1, 0.48 + progress * 0.52),
      blockAwareness: Math.min(1, 0.25 + progress * 0.75),
      forkAwareness: Math.max(0, (normalized - 3) / 13),
      forkDefense: Math.max(0, (normalized - 5) / 12),
      replySafety: Math.max(0.2, progress),
      choiceWindow: normalized >= 17 ? 1 : normalized >= 13 ? 2 : normalized >= 8 ? 3 : normalized >= 4 ? 4 : 5
    };
  }
  function awarenessPass(rate, board, salt) {
    // Deterministic imperfection: lower levels can make a recognizable,
    // repeatable tactical oversight instead of behaving as random noise.
    const source = `${board.join("-")}:${state.level}:${salt}`;
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
    return ((hash >>> 0) % 1000) / 1000 < rate;
  }
  function chooseAIMove(board, { size, target, level, aiMark = "O", playerMark = "X" }) {
    const legal = legalMoves(board); if (!legal.length) return null;
    const profile = challengeProfile(level);
    const wins = winningMoves(board, aiMark, size, target);
    if (wins.length && awarenessPass(profile.winAwareness, board, "win")) return wins[0];
    const blocks = winningMoves(board, playerMark, size, target);
    if (blocks.length && awarenessPass(profile.blockAwareness, board, "block")) return blocks[0];
    const opponentForks = forkMoves(board, playerMark, size, target);
    const ranked = legal.map((index) => {
      const next = [...board]; next[index] = aiMark;
      const ownThreats = winningMoves(next, aiMark, size, target).length;
      const ownFork = ownThreats >= 2;
      const allowedOpponentWins = winningMoves(next, playerMark, size, target).length;
      const allowedOpponentForks = forkMoves(next, playerMark, size, target).length;
      const worstReply = legalMoves(next).reduce((worst, reply) => {
        const afterReply = [...next]; afterReply[reply] = playerMark;
        const immediate = winningLine(afterReply, playerMark, size, target) ? 1 : 0;
        const nextForks = forkMoves(afterReply, playerMark, size, target).length;
        const playerPotential = potentialScore(afterReply, playerMark, size, target);
        return Math.max(worst, immediate * 10000 + nextForks * 760 + playerPotential * profile.replySafety);
      }, 0);
      const centerDistance = Math.abs((index % size) - (size - 1) / 2) + Math.abs(Math.floor(index / size) - (size - 1) / 2);
      let score = potentialScore(next, aiMark, size, target) + ownThreats * 440 - centerDistance * 5;
      score -= allowedOpponentWins * (profile.blockAwareness * 12000 + 400);
      score -= allowedOpponentForks * (profile.forkDefense * 1400 + 80);
      score -= worstReply;
      if (ownFork) score += profile.forkAwareness * 2100;
      if (opponentForks.length && !forkMoves(next, playerMark, size, target).length) score += profile.forkDefense * 1700;
      return { index, score };
    }).sort((a,b) => b.score - a.score || a.index - b.index);
    const windowSize = Math.min(ranked.length, profile.choiceWindow);
    const offset = windowSize === 1 ? 0 : Math.floor(((level * 7 + board.filter(Boolean).length * 3) % windowSize));
    return ranked[offset].index;
  }
  function chooseAI() {
    return chooseAIMove(state.board, { size: state.size, target: state.target, level: state.level, aiMark: state.aiMark, playerMark: state.playerMark });
  }
  function scheduleAI() {
    if (!state.active || state.mode !== "ai" || state.current !== state.aiMark || state.thinking) return;
    state.thinking = true; render(); updateTurn("AI is reading the board"); emit("ai_thinking_start"); const generation = state.generation;
    state.timeout = setTimeout(() => { state.timeout = null; if (generation !== state.generation || !state.active || state.current !== state.aiMark) return; state.thinking = false; const choice = chooseAI(); if (choice !== null) move(choice); }, 280);
  }
  function finish(winner, draw) {
    clearPending(); state.active = false; render(); updateTurn(draw ? "No winning line remains" : `${state.target} in a row complete`); const result = $("sizesResult");
    const outcome = draw ? "draw" : winner === state.playerMark ? "win" : "loss";
    $("sizesExitButton").textContent = state.context?.type === "AI_CHALLENGE" ? "Challenge Journey" : "Home";
    $("sizesResultKicker").textContent = `${state.size}×${state.size} · ${state.target} in a row`; $("sizesResultTitle").textContent = draw ? "Draw" : state.mode === "ai" ? (winner === state.playerMark ? "You Win" : "Board AI Wins") : `Player ${winner} Wins`; $("sizesResultDetail").textContent = draw ? "The board filled without a valid line." : `${playerName(winner)} completed ${state.target} consecutive marks.`;
    if (state.context?.type === "AI_CHALLENGE") $("sizesResultKicker").textContent = `AI Challenge · Level ${state.level} · ${state.size}×${state.size}`;
    const final = state.history.at(-1); if (final) final.marker = { type:"result", label:draw ? "DRAW" : "WINNING MOVE" };
    if (state.context?.type === "AI_CHALLENGE" && !state.resultRecorded) {
      state.resultRecorded = true;
      const saved = global.TicTacToeAIChallenge?.recordExpandedResult?.({ level: state.level, outcome, playerSymbol: state.playerMark, aiSymbol: state.aiMark, personality: state.context.personality });
      if (saved?.newlyUnlocked) $("sizesResultDetail").textContent += ` Level ${saved.unlockedLevel} is now unlocked.`;
    }
    global.TicTacToeReplay?.recordExternal({ matchType:"sizes", mode:state.mode, boardSize:state.size, winTarget:state.target, playerSymbol:state.playerMark, aiSymbol:state.aiMark, result:draw ? "draw" : winner === state.playerMark ? "win" : "loss", snapshots:state.history });
    result.hidden = false; result.classList.add("active", draw ? "draw" : winner === state.playerMark ? "victory" : "defeat"); global.dispatchEvent(new CustomEvent("tictactoe:feature-complete", { detail: { feature: "sizes", size: state.size, target: state.target, won: !draw && winner === state.playerMark } })); emit(draw ? "draw" : winner === state.playerMark ? "victory" : "defeat");
  }
  $all("[data-size-choice]").forEach((button) => button.addEventListener("click", () => selectSize(Number(button.dataset.sizeChoice))));
  $("sizeLevelRange").addEventListener("input", () => { state.level = Number($("sizeLevelRange").value); $("sizeLevelValue").textContent = String(state.level); });
  function openWith(size, mode) {
    if (![3, 4, 5].includes(Number(size)) || !["ai", "two"].includes(mode)) return false;
    selectSize(Number(size));
    open();
    start(mode);
    return true;
  }
  function startChallenge({ size, level, playerSymbol = "X", aiSymbol = "O", personality = "human" } = {}) {
    const normalizedSize = Number(size);
    if (![4, 5].includes(normalizedSize)) return false;
    clearPending();
    state.size = normalizedSize;
    state.target = defaults[normalizedSize];
    state.level = Math.max(1, Math.min(maxUnlockedLevel(), Number(level) || 1));
    state.context = { type: "AI_CHALLENGE", personality };
    state.resultRecorded = false;
    $("sizeboards").classList.add("challenge-arena");
    $("sizesPlay").hidden = true; $("sizeChoices").hidden = true; $("sizeWinTargets").hidden = true; $("sizeAiLevel").hidden = true; $("sizesActions").hidden = true; hideResult();
    screens("sizeboards");
    start("ai", { playerSymbol, aiSymbol });
    return true;
  }
  global.TicTacToeSizeRules = Object.freeze({ getLines: (size, target) => lines(size, target), winningLine: (board, mark, size, target) => winningLine(board, mark, size, target), legalMoves: (board) => legalMoves(board), chooseAIMove });
  global.TicTacToeBoardSizes = Object.freeze({ openWith, startChallenge });
  global.openBoardSizes = open; global.closeBoardSizes = close; global.startBoardSizeAI = () => start("ai"); global.startBoardSizeTwoPlayers = () => start("two"); global.restartBoardSizes = restart; global.exitBoardSizes = close;
}(window));
