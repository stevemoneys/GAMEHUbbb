/* Phase 13: one explicit battlefield condition per isolated size-aware match. */
(function createBoardMutators(global) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const other = (mark) => mark === "X" ? "O" : "X";
  const choices = Object.freeze([
    { id: "classic", name: "Classic", icon: "○", note: "No board condition." },
    { id: "blockade", name: "Blockade", icon: "▦", note: "Sealed cells stay closed." },
    { id: "wild", name: "Wild", icon: "✦", note: "Claim the luminous wild cell." },
    { id: "surge", name: "Surge", icon: "⌁", note: "Claim it. Move again." },
    { id: "frozen", name: "Frozen Line", icon: "╱", note: "Top line unlocks after 4 moves." },
    { id: "shift", name: "Shift", icon: "◇", note: "The portal relocates every 3 moves." }
  ]);
  const state = { size: 3, mode: "ai", level: 1, mutator: "classic", board: [], current: "X", active: false, thinking: false, resolved: false, generation: 0, timeout: null, moves: 0, blocked: [], wild: null, wildOwner: "", surge: null, surgeUsed: false, frozen: [], frozenActive: false, shift: null, shiftStep: 0 };
  const rule = () => global.TicTacToeSizeRules;
  const target = () => state.size;
  const lineSet = () => rule()?.getLines(state.size, target()) || [];
  const maxLevel = () => Math.max(1, Math.min(20, Number(global.TicTacToeSave?.get?.()?.progression?.levels?.highestUnlocked) || 1));
  const emit = (type, detail = {}) => global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } }));

  function clearPending() { clearTimeout(state.timeout); state.timeout = null; state.thinking = false; state.generation += 1; }
  function screen(id) { document.querySelectorAll(".screen").forEach((item) => item.classList.toggle("active", item.id === id)); }
  function cellMark(index, board = state.board, extra = state) { return extra.wild === index && extra.wildOwner ? extra.wildOwner : board[index]; }
  function isOccupied(index, board = state.board, extra = state) { return Boolean(board[index] || (extra.wild === index && extra.wildOwner)); }
  function isFrozen(index, extra = state) { return extra.frozenActive && extra.frozen.includes(index); }
  function legalMoves(board = state.board, extra = state) { return board.reduce((moves, _, index) => !isOccupied(index, board, extra) && !extra.blocked.includes(index) && !isFrozen(index, extra) && extra.shift !== index ? moves.concat(index) : moves, []); }
  function winner(mark, board = state.board, extra = state) { return lineSet().find((line) => line.every((index) => cellMark(index, board, extra) === mark)) || null; }
  function cloneExtra() { return { blocked: [...state.blocked], wild: state.wild, wildOwner: state.wildOwner, surge: state.surge, surgeUsed: state.surgeUsed, frozen: [...state.frozen], frozenActive: state.frozenActive, shift: state.shift, shiftStep: state.shiftStep }; }
  function simulate(board, index, mark, extra = cloneExtra()) { const next = [...board], nextExtra = { ...extra }; if (nextExtra.wild === index) nextExtra.wildOwner = mark; else next[index] = mark; return { board: next, extra: nextExtra }; }
  function winningMoves(board, mark, extra = cloneExtra()) { return legalMoves(board, extra).filter((index) => { const next = simulate(board, index, mark, { ...extra, blocked: [...extra.blocked], frozen: [...extra.frozen] }); return Boolean(winner(mark, next.board, next.extra)); }); }
  function blockedLayout(size) { return size === 3 ? [4] : size === 4 ? [5, 10] : [6, 12, 18]; }
  function shiftPath(size) { const last = size * size - 1, center = Math.floor(last / 2); return [center, 0, last, size - 1, last - size + 1, Math.floor(size / 2), last - Math.floor(size / 2), center]; }
  function newState() {
    state.board = Array(state.size ** 2).fill(""); state.current = "X"; state.active = true; state.thinking = false; state.resolved = false; state.moves = 0; state.blocked = []; state.wild = null; state.wildOwner = ""; state.surge = null; state.surgeUsed = false; state.frozen = []; state.frozenActive = false; state.shift = null; state.shiftStep = 0;
    const center = Math.floor(state.board.length / 2);
    if (state.mutator === "blockade") state.blocked = blockedLayout(state.size);
    if (state.mutator === "wild") state.wild = center;
    if (state.mutator === "surge") state.surge = center;
    if (state.mutator === "frozen") { state.frozen = lineSet()[0] || []; state.frozenActive = true; }
    if (state.mutator === "shift") state.shift = shiftPath(state.size)[0];
  }
  function hideResult() { const result = $("mutatorResult"); result.hidden = true; result.classList.remove("active", "victory", "defeat", "draw"); }
  function clearMatch() { state.active = false; state.thinking = false; state.resolved = false; state.board = []; state.moves = 0; state.blocked = []; state.wild = null; state.wildOwner = ""; state.surge = null; state.surgeUsed = false; state.frozen = []; state.frozenActive = false; state.shift = null; state.shiftStep = 0; }
  function selectedChoice() { return choices.find((choice) => choice.id === state.mutator) || choices[0]; }
  function syncSetup() {
    state.level = Math.min(state.level, maxLevel()); $("mutatorLevelValue").textContent = String(state.level); $("mutatorLevel").hidden = state.mode !== "ai";
    document.querySelectorAll("[data-mutator-size]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.mutatorSize) === state.size));
    document.querySelectorAll("[data-mutator-mode]").forEach((button) => button.classList.toggle("selected", button.dataset.mutatorMode === state.mode));
    $("mutatorGrid").innerHTML = choices.map((choice) => `<button type="button" class="mutator-choice ${choice.id} ${choice.id === state.mutator ? "selected" : ""}" data-mutator-choice="${choice.id}"><i aria-hidden="true">${choice.icon}</i><strong>${choice.name}</strong><small>${choice.note}</small></button>`).join("");
    $("mutatorGrid").querySelectorAll("[data-mutator-choice]").forEach((button) => button.addEventListener("click", () => { state.mutator = button.dataset.mutatorChoice; syncSetup(); emit("selection"); }));
    const choice = selectedChoice(); $("mutatorPreview").innerHTML = `<i class="preview-${choice.id}" aria-hidden="true">${choice.icon}</i><span><strong>${choice.name}</strong><small>${choice.note}</small></span>`;
  }
  function open() { clearPending(); clearMatch(); $("mutatorSetup").hidden = false; $("mutatorPlay").hidden = true; hideResult(); syncSetup(); screen("mutators"); }
  function close() { clearPending(); clearMatch(); hideResult(); screen("menu"); }
  function returnSetup() { clearPending(); clearMatch(); hideResult(); $("mutatorPlay").hidden = true; $("mutatorSetup").hidden = false; syncSetup(); }
  function adjustLevel(amount) { state.level = Math.max(1, Math.min(maxLevel(), state.level + amount)); syncSetup(); }
  function start() { clearPending(); newState(); $("mutatorSetup").hidden = true; $("mutatorPlay").hidden = false; hideResult(); render(); updateHud(); }
  function restart() { start(); }
  function statusText() { if (state.mutator === "blockade") return `${state.blocked.length} sealed`; if (state.mutator === "wild") return state.wildOwner ? `Wild claimed by ${state.wildOwner}` : "Wild cell unclaimed"; if (state.mutator === "surge") return state.surgeUsed ? "Surge spent" : "Surge grants one extra turn"; if (state.mutator === "frozen") return state.frozenActive ? `Frozen · unlocks in ${Math.max(0, 4 - state.moves)} moves` : "Frozen line released"; if (state.mutator === "shift") return `Portal shifts in ${3 - (state.moves % 3)} moves`; return `${target()} in a row`; }
  function updateHud(note = statusText()) { const choice = selectedChoice(), aiTurn = state.mode === "ai" && state.current === "O"; $("mutatorSizeHud").textContent = `${state.size}×${state.size}`; $("mutatorNameHud").textContent = choice.name; $("mutatorStateHud").textContent = note; $("mutatorTurn").classList.toggle("ai-turn", aiTurn); $("mutatorTurnMark").textContent = state.current; $("mutatorTurn").querySelector("strong").textContent = state.active ? `${state.mode === "ai" ? (state.current === "X" ? "You" : "Board AI") : `Player ${state.current}`} turn` : "Match complete"; $("mutatorTurnDetail").textContent = note; }
  function render() {
    const board = $("mutatorBoard"); board.style.setProperty("--size", state.size);
    board.innerHTML = state.board.map((mark, index) => { const wild = state.wild === index, special = state.blocked.includes(index) ? "blockade" : isFrozen(index) ? "frozen" : state.shift === index ? "shift" : wild ? "wild" : state.surge === index ? "surge" : ""; const shown = wild && state.wildOwner ? state.wildOwner : mark; const disabled = !state.active || state.thinking || !legalMoves().includes(index); return `<button type="button" class="mutator-cell ${shown || ""} ${special} ${wild && state.wildOwner ? "wild-claimed" : ""} ${state.surge === index && state.surgeUsed ? "surge-claimed" : ""}" data-mutator-cell="${index}" ${disabled ? "disabled" : ""} aria-label="Cell ${index + 1}: ${special || shown || "empty"}"><span>${shown}</span></button>`; }).join("");
    board.querySelectorAll("[data-mutator-cell]").forEach((button) => button.addEventListener("click", () => move(Number(button.dataset.mutatorCell)), { once: true }));
  }
  function move(index) {
    if (!state.active || state.thinking || !legalMoves().includes(index)) { emit("invalid_move"); return false; }
    const actor = state.current, triggeredSurge = state.mutator === "surge" && index === state.surge && !state.surgeUsed; if (state.wild === index) state.wildOwner = actor; else state.board[index] = actor; state.moves += 1; if (triggeredSurge) state.surgeUsed = true;
    if (state.mutator === "frozen" && state.frozenActive && state.moves >= 4) state.frozenActive = false;
    if (state.mutator === "shift" && state.moves % 3 === 0) moveShift();
    emit("piece_place", { symbol: actor, actor: state.mode === "ai" && actor === "O" ? "ai" : "player" }); render(); const line = winner(actor);
    if (line) { line.forEach((cell) => document.querySelector(`[data-mutator-cell="${cell}"]`)?.classList.add("win")); finish(actor, false); return true; }
    if (!legalMoves().length) { finish(null, true); return true; }
    if (triggeredSurge) { updateHud(`${actor} triggered Surge · move again`); emit("selection"); if (state.mode === "ai" && actor === "O") scheduleAI(); return true; }
    state.current = other(actor); updateHud(); if (state.mode === "ai" && state.current === "O") scheduleAI(); return true;
  }
  function moveShift() { const path = shiftPath(state.size); for (let offset = 1; offset <= path.length; offset += 1) { const candidate = path[(state.shiftStep + offset) % path.length]; if (!isOccupied(candidate) && !state.blocked.includes(candidate) && candidate !== state.shift) { state.shift = candidate; state.shiftStep = (state.shiftStep + offset) % path.length; return; } } }
  function score(board, mark, extra) { const opponent = other(mark); return lineSet().reduce((value, line) => { const own = line.filter((index) => cellMark(index, board, extra) === mark).length, theirs = line.filter((index) => cellMark(index, board, extra) === opponent).length; return theirs ? value : value + own * own * 10 + (own ? 4 : 1); }, 0); }
  function chooseAI() { const legal = legalMoves(); if (!legal.length) return null; const wins = winningMoves(state.board, "O"); if (wins.length) return wins[0]; const blocks = winningMoves(state.board, "X"); if (blocks.length && (state.level >= 3 || Math.random() < state.level / 6)) return blocks[0]; const ranked = legal.map((index) => { const next = simulate(state.board, index, "O"), reply = winningMoves(next.board, "X", next.extra).length; return { index, value: score(next.board, "O", next.extra) - reply * (state.level >= 8 ? 140 : 45) + (index === state.surge && !state.surgeUsed ? 28 : 0) + (index === Math.floor(state.board.length / 2) ? 5 : 0) }; }).sort((a, b) => b.value - a.value || a.index - b.index); const window = Math.max(1, Math.min(ranked.length, 6 - Math.ceil(state.level / 4))); return ranked[Math.floor(Math.random() * window)].index; }
  function scheduleAI() { if (!state.active || state.mode !== "ai" || state.current !== "O" || state.thinking) return; state.thinking = true; render(); updateHud("AI is reading the condition"); emit("ai_thinking_start"); const generation = state.generation; state.timeout = setTimeout(() => { state.timeout = null; if (generation !== state.generation || !state.active || state.current !== "O") return; state.thinking = false; const choice = chooseAI(); if (Number.isInteger(choice)) move(choice); }, 340); }
  function finish(winnerMark, draw) { if (state.resolved) return; state.resolved = true; clearPending(); state.active = false; render(); updateHud(draw ? "No legal moves remain" : `${target()} in a row complete`); const result = $("mutatorResult"), playerWon = winnerMark === "X"; $("mutatorResultKicker").textContent = `${state.size}×${state.size} · ${selectedChoice().name}`; $("mutatorResultTitle").textContent = draw ? "Draw" : state.mode === "ai" ? (playerWon ? "You Win" : "Board AI Wins") : `Player ${winnerMark} Wins`; $("mutatorResultDetail").textContent = draw ? "No legal move remained on this battlefield." : `${state.mode === "ai" ? (playerWon ? "You" : "Board AI") : `Player ${winnerMark}`} completed the line.`; result.hidden = false; result.classList.add("active", draw ? "draw" : playerWon ? "victory" : "defeat"); emit(draw ? "draw" : playerWon ? "victory" : "defeat"); }
  document.querySelectorAll("[data-mutator-size]").forEach((button) => button.addEventListener("click", () => { state.size = Number(button.dataset.mutatorSize); syncSetup(); emit("selection"); }));
  document.querySelectorAll("[data-mutator-mode]").forEach((button) => button.addEventListener("click", () => { state.mode = button.dataset.mutatorMode; syncSetup(); emit("selection"); }));
  global.openBoardMutators = open; global.closeBoardMutators = close; global.returnToMutatorSetup = returnSetup; global.adjustMutatorLevel = adjustLevel; global.startBoardMutatorMatch = start; global.restartBoardMutatorMatch = restart;
}(window));
