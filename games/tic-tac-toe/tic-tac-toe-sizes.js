/* Phase 11: 3×3, 4×4, and 5×5 share a transient, size-aware match controller. */
(function createBoardSizeMode(global) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = { size: 3, target: 3, level: 1, mode: null, board: [], current: "X", playerMark: "X", aiMark: "O", active: false, thinking: false, generation: 0, timeout: null };
  const defaults = { 3: 3, 4: 4, 5: 5 };
  const validTargets = { 3: [3], 4: [3,4], 5: [3,4,5] };
  const other = (mark) => mark === "X" ? "O" : "X";
  const $all = (selector) => [...document.querySelectorAll(selector)];

  function clearPending() { clearTimeout(state.timeout); state.timeout = null; state.thinking = false; state.generation += 1; }
  function screens(show) { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === show)); }
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
  function maxUnlockedLevel() { const save = global.TicTacToeSave?.get?.(); return Math.max(1, Math.min(20, Number(save?.progression?.levels?.highestUnlocked) || 1)); }

  function open() {
    clearPending(); state.active = false; state.level = Math.min(state.level, maxUnlockedLevel()); $("sizesPlay").hidden = true; $("sizeChoices").hidden = false; $("sizeWinTargets").hidden = state.size === 3; $("sizeAiLevel").hidden = false; $("sizesActions").hidden = false; hideResult(); syncSetup(); screens("sizeboards");
  }
  function close() { clearPending(); state.active = false; hideResult(); screens("menu"); }
  function selectSize(size) { if (![3,4,5].includes(size)) return; state.size = size; state.target = defaults[size]; syncSetup(); emit("selection"); }
  function selectTarget(target) { if (!validTargets[state.size].includes(target)) return; state.target = target; renderTargetChoices(); emit("selection"); }
  function syncSetup() {
    $all("[data-size-choice]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.sizeChoice) === state.size));
    $("sizeWinTargets").hidden = state.size === 3; renderTargetChoices();
    const range = $("sizeLevelRange"), maximum = maxUnlockedLevel(); range.max = String(maximum); state.level = Math.min(state.level, maximum); range.value = String(state.level); $("sizeLevelValue").textContent = String(state.level);
  }
  function renderTargetChoices() { const host = $("sizeWinOptions"); host.innerHTML = validTargets[state.size].map((target) => `<button type="button" class="${target === state.target ? "selected" : ""}" data-size-target="${target}">${target}</button>`).join(""); host.querySelectorAll("[data-size-target]").forEach((button) => button.addEventListener("click", () => selectTarget(Number(button.dataset.sizeTarget)))); }
  function start(mode) {
    clearPending(); state.mode = mode; state.playerMark = "X"; state.aiMark = "O"; state.current = "X"; state.board = Array(state.size ** 2).fill(""); state.active = true;
    $("sizeChoices").hidden = true; $("sizeWinTargets").hidden = true; $("sizeAiLevel").hidden = true; $("sizesActions").hidden = true; $("sizesPlay").hidden = false; hideResult(); render(); updateTurn();
  }
  function restart() { if (!state.mode) { open(); return; } start(state.mode); }
  function updateTurn(note = `${state.size}×${state.size} · ${state.target} in a row`) {
    const turn = $("sizesTurn"), aiTurn = state.mode === "ai" && state.current === state.aiMark; turn.classList.toggle("ai-turn", aiTurn); $("sizesTurnMark").textContent = state.current; turn.querySelector("strong").textContent = state.active ? `${playerName()} turn` : "Match complete"; $("sizesRuleDisplay").textContent = note;
  }
  function render() {
    const board = $("sizesBoard"); board.style.setProperty("--size", state.size); board.innerHTML = state.board.map((mark, index) => `<button type="button" class="sizes-cell ${mark || ""}" data-size-cell="${index}" ${mark || !state.active || state.thinking ? "disabled" : ""} aria-label="Cell ${index + 1}: ${mark || "empty"}">${mark}</button>`).join("");
    board.querySelectorAll("[data-size-cell]").forEach((button) => button.addEventListener("click", () => move(Number(button.dataset.sizeCell)), { once: true }));
  }
  function move(index) {
    if (!state.active || state.thinking || !Number.isInteger(index) || state.board[index]) { emit("invalid_move"); return false; }
    const actor = state.current; state.board[index] = actor; emit("piece_place", { symbol: actor, actor: actor === state.playerMark ? "player" : "ai" }); render();
    const line = winningLine(state.board, actor); if (line) { line.forEach((cell) => document.querySelector(`[data-size-cell="${cell}"]`)?.classList.add("win")); finish(actor, false); return true; }
    if (!legalMoves().length) { finish(null, true); return true; }
    state.current = other(actor); updateTurn(); if (state.mode === "ai" && state.current === state.aiMark) scheduleAI(); return true;
  }
  function potentialScore(board, mark, size = state.size, target = state.target) {
    const opponent = other(mark); return lines(size, target).reduce((score, line) => { const own = line.filter((index) => board[index] === mark).length, theirs = line.filter((index) => board[index] === opponent).length; if (theirs) return score; return score + own * own * 10 + (own ? 4 : 1); }, 0);
  }
  function chooseAIMove(board, { size, target, level, aiMark = "O", playerMark = "X" }) {
    const legal = legalMoves(board); if (!legal.length) return null;
    const wins = winningMoves(board, aiMark, size, target); if (wins.length) return wins[0];
    const blocks = winningMoves(board, playerMark, size, target); if (blocks.length && (level >= 3 || Math.random() < level / 6)) return blocks[0];
    const ranked = legal.map((index) => { const next = [...board]; next[index] = aiMark; const replyWins = winningMoves(next, playerMark, size, target).length; return { index, score: potentialScore(next, aiMark, size, target) - replyWins * (level >= 8 ? 140 : 45) + (index === Math.floor(board.length / 2) ? 6 : 0) }; }).sort((a,b) => b.score - a.score || a.index - b.index);
    const windowSize = Math.max(1, Math.min(ranked.length, 6 - Math.ceil(level / 4))); return ranked[Math.floor(Math.random() * windowSize)].index;
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
    $("sizesResultKicker").textContent = `${state.size}×${state.size} · ${state.target} in a row`; $("sizesResultTitle").textContent = draw ? "Draw" : state.mode === "ai" ? (winner === state.playerMark ? "You Win" : "Board AI Wins") : `Player ${winner} Wins`; $("sizesResultDetail").textContent = draw ? "The board filled without a valid line." : `${playerName(winner)} completed ${state.target} consecutive marks.`;
    result.hidden = false; result.classList.add("active", draw ? "draw" : winner === state.playerMark ? "victory" : "defeat"); emit(draw ? "draw" : winner === state.playerMark ? "victory" : "defeat");
  }
  $all("[data-size-choice]").forEach((button) => button.addEventListener("click", () => selectSize(Number(button.dataset.sizeChoice))));
  $("sizeLevelRange").addEventListener("input", () => { state.level = Number($("sizeLevelRange").value); $("sizeLevelValue").textContent = String(state.level); });
  global.TicTacToeSizeRules = Object.freeze({ getLines: (size, target) => lines(size, target), winningLine: (board, mark, size, target) => winningLine(board, mark, size, target), legalMoves: (board) => legalMoves(board), chooseAIMove });
  global.openBoardSizes = open; global.closeBoardSizes = close; global.startBoardSizeAI = () => start("ai"); global.startBoardSizeTwoPlayers = () => start("two"); global.restartBoardSizes = restart; global.exitBoardSizes = close;
}(window));
