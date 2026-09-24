/* Phase 09: Classic three-board Notakto. Match state is intentionally transient. */
(function createNotakto(global) {
  "use strict";

  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const $ = (id) => document.getElementById(id);
  const state = { mode: null, boards: [], dead: [], current: "p1", active: false, thinking: false, generation: 0, timeout: null };
  const emptyBoard = () => Array(9).fill("");
  const other = (player) => player === "p1" ? "p2" : "p1";

  function isLine(board) { return LINES.some(([a, b, c]) => board[a] === "X" && board[b] === "X" && board[c] === "X"); }
  function legalMoves(boards = state.boards, dead = state.dead) {
    const moves = [];
    boards.forEach((board, boardIndex) => { if (!dead[boardIndex]) board.forEach((mark, cellIndex) => { if (!mark) moves.push({ boardIndex, cellIndex }); }); });
    return moves;
  }
  function playerName(player = state.current) { return state.mode === "ai" ? (player === "p1" ? "You" : "Notakto AI") : `Player ${player === "p1" ? "1" : "2"}`; }
  function activeBoards() { return state.dead.filter((dead) => !dead).length; }
  function clearPending() { clearTimeout(state.timeout); state.timeout = null; state.thinking = false; state.generation += 1; }
  function screens(show) { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === show)); }
  function emit(type, detail = {}) { global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } })); }

  function hideResult() { const result = $("notaktoResult"); result.hidden = true; result.classList.remove("active", "victory", "defeat", "draw"); }
  function open() { clearPending(); state.active = false; $("notaktoPlay").hidden = true; $("notaktoActions").hidden = false; hideResult(); screens("notakto"); }
  function close() { clearPending(); state.active = false; hideResult(); screens("menu"); }
  function start(mode) {
    clearPending(); state.mode = mode; state.boards = [emptyBoard(), emptyBoard(), emptyBoard()]; state.dead = [false, false, false]; state.current = "p1"; state.active = true;
    $("notaktoActions").hidden = true; $("notaktoPlay").hidden = false; hideResult();
    render(); updateTurn();
  }
  function restart() { if (!state.mode) { open(); return; } start(state.mode); }
  function updateTurn(note = "Choose any active board") {
    const turn = $("notaktoTurn"); if (!turn) return;
    turn.classList.toggle("ai-turn", state.mode === "ai" && state.current === "p2");
    turn.querySelector("strong").textContent = state.active ? `${playerName()} turn` : "Match complete";
    turn.querySelector("small").textContent = note;
  }
  function render() {
    const host = $("notaktoBoards"); if (!host) return;
    host.innerHTML = state.boards.map((board, boardIndex) => `<section class="notakto-board ${state.dead[boardIndex] ? "dead" : "active"}" data-notakto-board="${boardIndex}" aria-label="Board ${boardIndex + 1}${state.dead[boardIndex] ? ", dead" : ", active"}"><header><span>Board ${boardIndex + 1}</span><b>${state.dead[boardIndex] ? "SEALED" : "ACTIVE"}</b></header><div class="notakto-grid" role="grid">${board.map((mark, cellIndex) => `<button type="button" class="notakto-cell ${mark ? "placed" : ""}" data-notakto-cell="${boardIndex}:${cellIndex}" ${mark || state.dead[boardIndex] || !state.active || state.thinking ? "disabled" : ""} aria-label="Board ${boardIndex + 1}, cell ${cellIndex + 1}: ${mark || "empty"}">${mark}</button>`).join("")}</div></section>`).join("");
    host.querySelectorAll("[data-notakto-cell]").forEach((button) => button.addEventListener("click", () => { const [boardIndex, cellIndex] = button.dataset.notaktoCell.split(":").map(Number); move(boardIndex, cellIndex); }, { once: true }));
  }
  function move(boardIndex, cellIndex) {
    if (!state.active || state.thinking || !Number.isInteger(boardIndex) || !Number.isInteger(cellIndex) || state.dead[boardIndex] || state.boards[boardIndex]?.[cellIndex]) { emit("invalid_move"); return false; }
    const actor = state.current;
    state.boards[boardIndex][cellIndex] = "X";
    const killed = isLine(state.boards[boardIndex]);
    if (killed) state.dead[boardIndex] = true;
    emit("piece_place", { symbol: "X", actor: actor === "p1" ? "player" : "ai" });
    render();
    if (killed) {
      const board = document.querySelector(`[data-notakto-board="${boardIndex}"]`); board?.classList.add("just-sealed");
      emit("win_line", { boardIndex, notakto: true });
      if (activeBoards() === 0) { finish(actor); return true; }
      updateTurn(`Board ${boardIndex + 1} sealed · ${activeBoards()} remain`);
    }
    state.current = other(actor);
    updateTurn();
    if (state.mode === "ai" && state.current === "p2") scheduleAI();
    return true;
  }
  function simulate(boards, dead, move) {
    const nextBoards = boards.map((board) => [...board]), nextDead = [...dead];
    nextBoards[move.boardIndex][move.cellIndex] = "X";
    const killed = isLine(nextBoards[move.boardIndex]); if (killed) nextDead[move.boardIndex] = true;
    return { boards: nextBoards, dead: nextDead, killed, terminal: nextDead.every(Boolean) };
  }
  function boardKey(boards, dead, actor, depth) { return `${boards.map((board) => board.join("")).join("/")}:${dead.map(Number).join("")}:${actor}:${depth}`; }
  function evaluate(boards, dead, actor, depth, memo) {
    const moves = legalMoves(boards, dead); if (!moves.length) return 0;
    const key = boardKey(boards, dead, actor, depth); if (memo.has(key)) return memo.get(key);
    const maximizing = actor === "p2"; let best = maximizing ? -Infinity : Infinity;
    for (const candidate of moves) {
      const next = simulate(boards, dead, candidate);
      const score = next.terminal ? (actor === "p2" ? -100 : 100) : depth <= 0 ? heuristic(next.dead, actor) : evaluate(next.boards, next.dead, other(actor), depth - 1, memo);
      best = maximizing ? Math.max(best, score) : Math.min(best, score);
    }
    memo.set(key, best); return best;
  }
  function heuristic(dead, actor) { const remaining = dead.filter((value) => !value).length; return (actor === "p2" ? 1 : -1) * (3 - remaining); }
  function chooseAI() {
    const moves = legalMoves(); if (!moves.length) return null;
    const memo = new Map();
    const ranked = moves.map((candidate) => { const next = simulate(state.boards, state.dead, candidate); return { ...candidate, score: next.terminal ? -100 : evaluate(next.boards, next.dead, "p1", 2, memo), killed: next.killed }; });
    ranked.sort((a, b) => b.score - a.score || Number(a.killed) - Number(b.killed) || a.boardIndex - b.boardIndex || a.cellIndex - b.cellIndex);
    return ranked[0];
  }
  function scheduleAI() {
    if (!state.active || state.mode !== "ai" || state.current !== "p2" || state.thinking) return;
    state.thinking = true; render(); updateTurn("AI is weighing the remaining boards"); emit("ai_thinking_start");
    const generation = state.generation;
    state.timeout = setTimeout(() => { state.timeout = null; if (generation !== state.generation || !state.active || state.current !== "p2") return; state.thinking = false; const choice = chooseAI(); if (choice) move(choice.boardIndex, choice.cellIndex); }, 280);
  }
  function finish(loser) {
    clearPending(); state.active = false; render(); updateTurn("The final board was sealed");
    const winner = other(loser), result = $("notaktoResult");
    $("notaktoResultKicker").textContent = "Final board sealed";
    $("notaktoResultTitle").textContent = state.mode === "ai" ? (winner === "p1" ? "You Win" : "Notakto AI Wins") : `${playerName(winner)} Wins`;
    $("notaktoResultDetail").textContent = `${playerName(loser)} sealed the last active board and loses the match.`;
    result.hidden = false; result.classList.add("active", winner === "p1" ? "victory" : "defeat"); emit(winner === "p1" ? "victory" : "defeat");
  }

  global.openNotaktoMode = open; global.closeNotaktoMode = close;
  global.startNotaktoAI = () => start("ai"); global.startNotaktoTwoPlayers = () => start("two");
  global.restartNotakto = restart; global.exitNotakto = close;
}(window));
