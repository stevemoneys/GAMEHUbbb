/* Phase 10: Classic Ultimate Tic-Tac-Toe. This isolated controller keeps 81-cell state transient. */
(function createUltimate(global) {
  "use strict";

  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const $ = (id) => document.getElementById(id);
  const emptyBoard = () => Array(9).fill("");
  const other = (mark) => mark === "X" ? "O" : "X";
  const state = { mode: null, playerMark: "X", aiMark: "O", boards: [], claims: [], current: "X", forced: null, active: false, thinking: false, generation: 0, timeout: null };

  function winner(board) { return LINES.find(([a,b,c]) => board[a] && board[a] === board[b] && board[b] === board[c]) || null; }
  function macroWinner(claims) { const line = LINES.find(([a,b,c]) => (claims[a] === "X" || claims[a] === "O") && claims[a] === claims[b] && claims[b] === claims[c]); return line ? claims[line[0]] : null; }
  function boardClaim(board) { const line = winner(board); return line ? board[line[0]] : board.every(Boolean) ? "draw" : ""; }
  function activeBoards(boards = state.boards, claims = state.claims) { return boards.reduce((list, board, index) => claims[index] ? list : list.concat(index), []); }
  function legalMoves(boards = state.boards, claims = state.claims, forced = state.forced) {
    const allowed = forced !== null && !claims[forced] ? [forced] : activeBoards(boards, claims);
    return allowed.flatMap((boardIndex) => boards[boardIndex].flatMap((mark, cellIndex) => mark ? [] : [{ boardIndex, cellIndex }]));
  }
  function clearPending() { clearTimeout(state.timeout); state.timeout = null; state.thinking = false; state.generation += 1; }
  function screens(show) { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === show)); }
  function emit(type, detail = {}) { global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } })); }
  function playerName(mark = state.current) { return state.mode === "ai" ? (mark === state.playerMark ? "You" : "Ultimate AI") : `Player ${mark}`; }
  function turnDetail() { return state.forced === null ? "Choose any open mini-board" : `Play in board ${state.forced + 1}`; }
  function hideResult() { const result = $("ultimateResult"); result.hidden = true; result.classList.remove("active", "victory", "defeat", "draw"); }

  function open() { clearPending(); state.active = false; $("ultimatePlay").hidden = true; $("ultimateActions").hidden = false; hideResult(); screens("ultimate"); }
  function close() { clearPending(); state.active = false; hideResult(); screens("menu"); }
  function start(mode, playerMark = "X") {
    clearPending(); state.mode = mode; state.playerMark = playerMark; state.aiMark = other(playerMark); state.boards = Array.from({ length: 9 }, emptyBoard); state.claims = Array(9).fill(""); state.current = "X"; state.forced = null; state.active = true;
    $("ultimateActions").hidden = true; $("ultimatePlay").hidden = false; hideResult(); render(); updateTurn();
    if (mode === "ai" && state.current === state.aiMark) scheduleAI();
  }
  function restart() { if (!state.mode) { open(); return; } start(state.mode, state.playerMark); }
  function updateTurn(note = turnDetail()) {
    const turn = $("ultimateTurn"); if (!turn) return;
    const aiTurn = state.mode === "ai" && state.current === state.aiMark;
    turn.classList.toggle("ai-turn", aiTurn); turn.classList.toggle("free-choice", state.forced === null);
    $("ultimateTurnMark").textContent = state.current;
    turn.querySelector("strong").textContent = state.active ? `${playerName()} turn` : "Match complete";
    turn.querySelector("small").textContent = note;
  }
  function render() {
    const host = $("ultimateBoard"); if (!host) return;
    host.innerHTML = state.boards.map((board, boardIndex) => {
      const claim = state.claims[boardIndex], forced = state.forced === boardIndex && !claim, playable = !claim && state.active && !state.thinking && (state.forced === null || forced);
      return `<section class="ultimate-mini ${claim ? `claimed ${claim}` : forced ? "forced" : playable ? "playable" : "restricted"}" data-ultimate-mini="${boardIndex}" aria-label="Mini-board ${boardIndex + 1}${claim ? `, ${claim === "draw" ? "drawn" : `claimed by ${claim}`}` : forced ? ", required" : ", active"}"><header><span>${boardIndex + 1}</span><b>${claim === "draw" ? "DRAW" : claim || (forced ? "PLAY" : "")}</b></header><div class="ultimate-grid" role="grid">${board.map((mark, cellIndex) => `<button type="button" class="ultimate-cell ${mark || ""}" data-ultimate-cell="${boardIndex}:${cellIndex}" ${mark || !playable ? "disabled" : ""} aria-label="Board ${boardIndex + 1}, cell ${cellIndex + 1}: ${mark || "empty"}">${mark}</button>`).join("")}</div>${claim && claim !== "draw" ? `<i class="ultimate-claim" aria-hidden="true">${claim}</i>` : ""}</section>`;
    }).join("");
    host.querySelectorAll("[data-ultimate-cell]").forEach((button) => button.addEventListener("click", () => { const [boardIndex, cellIndex] = button.dataset.ultimateCell.split(":").map(Number); move(boardIndex, cellIndex); }, { once: true }));
  }
  function simulate(boards, claims, forced, mark, move) {
    const nextBoards = boards.map((board) => [...board]), nextClaims = [...claims]; nextBoards[move.boardIndex][move.cellIndex] = mark;
    const claimed = boardClaim(nextBoards[move.boardIndex]); if (claimed) nextClaims[move.boardIndex] = claimed;
    const macro = macroWinner(nextClaims);
    const nextForced = nextClaims[move.cellIndex] ? null : move.cellIndex;
    return { boards: nextBoards, claims: nextClaims, forced: nextForced, claimed, macro, terminal: Boolean(macro) || activeBoards(nextBoards, nextClaims).length === 0 };
  }
  function move(boardIndex, cellIndex) {
    const legal = legalMoves();
    if (!state.active || state.thinking || !legal.some((move) => move.boardIndex === boardIndex && move.cellIndex === cellIndex)) { emit("invalid_move"); return false; }
    const actor = state.current, next = simulate(state.boards, state.claims, state.forced, actor, { boardIndex, cellIndex });
    state.boards = next.boards; state.claims = next.claims; state.forced = next.forced;
    emit("piece_place", { symbol: actor, actor: actor === state.playerMark ? "player" : "ai" }); render();
    if (next.claimed) { document.querySelector(`[data-ultimate-mini="${boardIndex}"]`)?.classList.add(next.claimed === "draw" ? "just-drawn" : "just-claimed"); emit("win_line", { boardIndex, macro: false, ultimate: true }); }
    if (next.macro) { finish(actor, false); return true; }
    if (next.terminal) { finish(null, true); return true; }
    state.current = other(actor); updateTurn();
    if (state.mode === "ai" && state.current === state.aiMark) scheduleAI();
    return true;
  }
  function macroThreats(boards, claims, forced, mark) { return legalMoves(boards, claims, forced).filter((candidate) => simulate(boards, claims, forced, mark, candidate).macro); }
  function miniValue(claims, mark) { return claims.reduce((score, claim, index) => score + (claim === mark ? [2,3,2,3,5,3,2,3,2][index] : 0), 0); }
  function chooseAI() {
    const legal = legalMoves(); if (!legal.length) return null;
    const immediate = legal.find((candidate) => simulate(state.boards, state.claims, state.forced, state.aiMark, candidate).macro); if (immediate) return immediate;
    const ranked = legal.map((candidate) => {
      const next = simulate(state.boards, state.claims, state.forced, state.aiMark, candidate);
      const opponentWins = next.terminal ? 0 : macroThreats(next.boards, next.claims, next.forced, state.playerMark).length;
      const future = next.terminal ? 0 : macroThreats(next.boards, next.claims, next.forced, state.aiMark).length;
      return { ...candidate, score: (next.claimed === state.aiMark ? 240 : 0) + miniValue(next.claims, state.aiMark) * 8 + future * 70 - opponentWins * 900 + (candidate.cellIndex === 4 ? 6 : [0,2,6,8].includes(candidate.cellIndex) ? 3 : 1) };
    });
    ranked.sort((a, b) => b.score - a.score || a.boardIndex - b.boardIndex || a.cellIndex - b.cellIndex); return ranked[0];
  }
  function scheduleAI() {
    if (!state.active || state.mode !== "ai" || state.current !== state.aiMark || state.thinking) return;
    state.thinking = true; render(); updateTurn("AI is reading the macro board"); emit("ai_thinking_start"); const generation = state.generation;
    state.timeout = setTimeout(() => { state.timeout = null; if (generation !== state.generation || !state.active || state.current !== state.aiMark) return; state.thinking = false; const choice = chooseAI(); if (choice) move(choice.boardIndex, choice.cellIndex); }, 320);
  }
  function finish(winner, draw) {
    clearPending(); state.active = false; render(); updateTurn(draw ? "No legal moves remain" : "Three claimed boards aligned");
    const result = $("ultimateResult"); $("ultimateResultKicker").textContent = draw ? "Macro board closed" : "Macro board complete";
    $("ultimateResultTitle").textContent = draw ? "Draw" : state.mode === "ai" ? (winner === state.playerMark ? "You Win" : "Ultimate AI Wins") : `Player ${winner} Wins`;
    $("ultimateResultDetail").textContent = draw ? "Every mini-board is closed with no macro-board winner." : `${playerName(winner)} claimed three mini-boards in a row.`;
    result.hidden = false; result.classList.add("active", draw ? "draw" : winner === state.playerMark ? "victory" : "defeat"); emit(draw ? "draw" : winner === state.playerMark ? "victory" : "defeat");
  }

  global.openUltimateMode = open; global.closeUltimateMode = close; global.startUltimateAI = (mark) => start("ai", mark === "O" ? "O" : "X"); global.startUltimateTwoPlayers = () => start("two", "X"); global.restartUltimate = restart; global.exitUltimate = close;
}(window));
