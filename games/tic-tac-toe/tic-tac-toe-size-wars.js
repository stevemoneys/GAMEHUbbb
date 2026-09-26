/* Phase 12: an isolated, fixed three-round series built on the Phase 11 board rules. */
(function createSizeWars(global) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const rounds = Object.freeze([{ size: 3, target: 3, name: "3×3 Classic" }, { size: 4, target: 4, name: "4×4 Expanded" }, { size: 5, target: 4, name: "5×5 Grand" }]);
  const state = { mode: "ai", level: 1, round: 0, board: [], current: "X", scores: { X: 0, O: 0 }, active: false, thinking: false, resolved: false, advancing: false, generation: 0, timeout: null };
  const other = (mark) => mark === "X" ? "O" : "X";
  const currentRound = () => rounds[state.round];

  function clearPending() { clearTimeout(state.timeout); state.timeout = null; state.thinking = false; state.generation += 1; }
  function showScreen(id) { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id)); }
  function feel(type, detail = {}) { global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } })); }
  function maxUnlockedLevel() { const save = global.TicTacToeSave?.get?.(); return Math.max(1, Math.min(20, Number(save?.progression?.levels?.highestUnlocked) || 1)); }
  function markName(mark = state.current) { return state.mode === "ai" ? (mark === "X" ? "You" : "Board AI") : `Player ${mark}`; }
  function hideResult() { const result = $("sizeWarsResult"); result.hidden = true; result.classList.remove("active", "victory", "defeat", "draw"); }

  function syncSetup() {
    const limit = maxUnlockedLevel(); state.level = Math.min(state.level, limit);
    $("sizeWarsLevelRange").max = String(limit); $("sizeWarsLevelRange").value = String(state.level); $("sizeWarsLevelValue").textContent = String(state.level);
    $("sizeWarsLevel").hidden = state.mode !== "ai";
    document.querySelectorAll("[data-size-wars-mode]").forEach((button) => button.classList.toggle("selected", button.dataset.sizeWarsMode === state.mode));
  }
  function open() { clearPending(); state.active = false; state.resolved = false; $("sizeWarsSetup").hidden = false; $("sizeWarsPlay").hidden = true; hideResult(); syncSetup(); showScreen("sizewars"); }
  function close() { clearPending(); state.active = false; state.resolved = false; hideResult(); showScreen("menu"); }
  function selectMode(mode) { if (mode !== "ai" && mode !== "two") return; state.mode = mode; syncSetup(); feel("selection"); }

  function updateHud() {
    const round = currentRound();
    $("sizeWarsRound").textContent = `Round ${state.round + 1} / ${rounds.length}`;
    $("sizeWarsArena").textContent = round.name;
    $("sizeWarsTarget").textContent = `${round.target} in a row`;
    $("sizeWarsXScore").textContent = String(state.scores.X);
    $("sizeWarsOScore").textContent = String(state.scores.O);
    const aiTurn = state.mode === "ai" && state.current === "O";
    $("sizeWarsTurn").classList.toggle("ai-turn", aiTurn);
    $("sizeWarsTurnMark").textContent = state.current;
    $("sizeWarsTurn").querySelector("strong").textContent = state.active ? `${markName()} turn` : "Round complete";
    $("sizeWarsTurnDetail").textContent = `Round ${state.round + 1} · ${round.target} in a row`;
  }
  function render() {
    const board = $("sizeWarsBoard"); board.style.setProperty("--size", currentRound().size);
    board.innerHTML = state.board.map((mark, index) => `<button type="button" class="size-wars-cell ${mark || ""}" data-size-wars-cell="${index}" ${mark || !state.active || state.thinking ? "disabled" : ""} aria-label="Cell ${index + 1}: ${mark || "empty"}">${mark}</button>`).join("");
    board.querySelectorAll("[data-size-wars-cell]").forEach((cell) => cell.addEventListener("click", () => move(Number(cell.dataset.sizeWarsCell)), { once: true }));
  }
  function beginRound(index) {
    clearPending(); state.round = index; state.board = Array(currentRound().size ** 2).fill(""); state.current = index % 2 === 0 ? "X" : "O"; state.active = true; state.resolved = false; state.advancing = false;
    hideResult(); $("sizeWarsSetup").hidden = true; $("sizeWarsPlay").hidden = false; render(); updateHud();
    if (state.mode === "ai" && state.current === "O") scheduleAI();
  }
  function start() { clearPending(); state.scores = { X: 0, O: 0 }; state.round = 0; beginRound(0); }
  function restart() { start(); }

  function move(index) {
    if (!state.active || state.thinking || !Number.isInteger(index) || state.board[index]) { feel("invalid_move"); return false; }
    const actor = state.current; state.board[index] = actor; feel("piece_place", { symbol: actor, actor: state.mode === "ai" && actor === "O" ? "ai" : "player" }); render();
    const rule = global.TicTacToeSizeRules; const line = rule?.winningLine(state.board, actor, currentRound().size, currentRound().target);
    if (line) { line.forEach((cell) => document.querySelector(`[data-size-wars-cell="${cell}"]`)?.classList.add("win")); finish(actor, false); return true; }
    if (!rule?.legalMoves(state.board).length) { finish(null, true); return true; }
    state.current = other(actor); updateHud(); if (state.mode === "ai" && state.current === "O") scheduleAI(); return true;
  }
  function scheduleAI() {
    if (!state.active || state.mode !== "ai" || state.current !== "O" || state.thinking) return;
    state.thinking = true; render(); updateHud(); feel("ai_thinking_start"); const generation = state.generation;
    state.timeout = setTimeout(() => { state.timeout = null; if (generation !== state.generation || !state.active || state.current !== "O") return; state.thinking = false; const rule = global.TicTacToeSizeRules; const choice = rule?.chooseAIMove(state.board, { size: currentRound().size, target: currentRound().target, level: state.level, aiMark: "O", playerMark: "X" }); if (Number.isInteger(choice)) move(choice); }, 320);
  }
  function finish(winner, draw) {
    if (state.resolved) return;
    state.resolved = true; clearPending(); state.active = false; if (winner) state.scores[winner] += 1; render(); updateHud();
    const lastRound = state.round === rounds.length - 1, result = $("sizeWarsResult");
    $("sizeWarsResultKicker").textContent = lastRound ? "Size Wars complete" : `Round ${state.round + 1} complete`;
    $("sizeWarsResultTitle").textContent = lastRound ? seriesTitle() : draw ? "Round Draw" : `${markName(winner)} takes the round`;
    $("sizeWarsResultDetail").textContent = lastRound ? seriesDetail() : draw ? "No point awarded. The series stays live." : `${markName(winner)} earns one series point.`;
    $("sizeWarsResultScore").textContent = `X ${state.scores.X} — ${state.scores.O} O`;
    $("sizeWarsContinue").hidden = lastRound; $("sizeWarsReplay").hidden = !lastRound;
    result.hidden = false; result.classList.add("active", draw ? "draw" : winner === "X" ? "victory" : "defeat"); feel(lastRound ? (state.scores.X === state.scores.O ? "draw" : state.scores.X > state.scores.O ? "victory" : "defeat") : draw ? "draw" : winner === "X" ? "victory" : "defeat");
  }
  function seriesTitle() { if (state.scores.X === state.scores.O) return "Series Tie"; return state.mode === "ai" ? (state.scores.X > state.scores.O ? "You Win Size Wars" : "Board AI Wins") : `Player ${state.scores.X > state.scores.O ? "X" : "O"} Wins Size Wars`; }
  function seriesDetail() { if (state.scores.X === state.scores.O) return "Three rounds. Neither side took the series."; return `${state.scores.X > state.scores.O ? markName("X") : markName("O")} won more rounds across every board.`; }
  function nextRound() { if (!state.resolved || state.advancing || state.round >= rounds.length - 1) return; state.advancing = true; beginRound(state.round + 1); }

  document.querySelectorAll("[data-size-wars-mode]").forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.sizeWarsMode)));
  $("sizeWarsLevelRange").addEventListener("input", () => { state.level = Number($("sizeWarsLevelRange").value); $("sizeWarsLevelValue").textContent = String(state.level); });
  global.openSizeWars = open; global.closeSizeWars = close; global.startSizeWars = start; global.continueSizeWars = nextRound; global.restartSizeWars = restart; global.exitSizeWars = close;
}(window));
