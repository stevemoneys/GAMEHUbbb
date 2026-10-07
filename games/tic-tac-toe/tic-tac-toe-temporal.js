/* Phase 21: visible, deterministic temporal state. Never persists directly. */
(function temporalController(global) {
  "use strict";

  let state = null;
  const empty = () => ({ mode: null, sides: [], used: { X: false, O: false }, ghost: null, quantum: null, action: null, events: [] });
  const copy = () => state ? JSON.parse(JSON.stringify(state)) : null;
  const reserved = (index) => Boolean(state?.ghost?.cell === index || state?.quantum?.cells?.includes(index));
  const valid = (index, board, legal) => Number.isInteger(index) && index >= 0 && index < board.length && !board[index] && (!legal || legal.includes(index)) && !reserved(index);

  function begin(rules = {}) {
    state = empty();
    if (!["ghost", "quantum"].includes(rules.temporalMode)) return copy();
    state.mode = rules.temporalMode;
    state.sides = Array.isArray(rules.temporalSides) ? rules.temporalSides.filter((side) => side === "X" || side === "O") : ["X", "O"];
    return copy();
  }

  function clear() { state = null; }
  function available(owner) { return Boolean(state?.mode && state.sides.includes(owner) && !state.used[owner] && !state.action && !state.quantum?.ready); }
  function activate(owner) { if (!available(owner)) return false; state.action = { owner, mode: state.mode, cells: [] }; return true; }

  function select(index, board, legal) {
    if (!state?.action || !valid(index, board, legal)) return { valid: false };
    const action = state.action;
    if (action.mode === "ghost") {
      state.ghost = { cell: index, owner: action.owner, remaining: 2 };
      state.used[action.owner] = true;
      state.action = null;
      state.events.push({ type: "ghost", label: "GHOST PLACED", cell: index });
      return { valid: true, complete: true, type: "ghost", owner: action.owner, index };
    }
    if (action.cells.includes(index)) return { valid: false };
    action.cells.push(index);
    if (action.cells.length < 2) return { valid: true, complete: false, type: "quantum" };
    state.quantum = { cells: [...action.cells], owner: action.owner, ready: false };
    state.used[action.owner] = true;
    state.action = null;
    state.events.push({ type: "quantum", label: "QUANTUM PAIR", cells: [...state.quantum.cells] });
    return { valid: true, complete: true, type: "quantum", owner: action.owner, cells: [...state.quantum.cells] };
  }

  function afterNormalMove(actor) {
    const events = [];
    if (state?.ghost) {
      state.ghost.remaining -= 1;
      if (state.ghost.remaining <= 0) {
        const expired = { type: "ghost-expired", label: "GHOST EXPIRED", cell: state.ghost.cell };
        events.push(expired); state.events.push(expired); state.ghost = null;
      }
    }
    if (state?.quantum && !state.quantum.ready && actor !== state.quantum.owner) {
      state.quantum.ready = true;
      events.push({ type: "quantum-ready", label: "QUANTUM RESOLUTION", cells: [...state.quantum.cells] });
    }
    return events;
  }

  function needsResolution(owner) { return Boolean(state?.quantum?.ready && state.quantum.owner === owner); }
  function resolve(owner, index, board) {
    if (!needsResolution(owner) || !state.quantum.cells.includes(index) || board[index]) return { valid: false };
    const other = state.quantum.cells.find((cell) => cell !== index);
    state.events.push({ type: "quantum-resolved", label: "QUANTUM RESOLVED", cell: index });
    state.quantum = null;
    return { valid: true, index, other, owner };
  }

  function aiAction(owner, board, legal, level = 1, personality = "human") {
    if (!available(owner) || level < 5) return null;
    const corners = legal.filter((cell) => [0, 2, 6, 8].includes(cell));
    const ordered = personality === "aggressive" ? [...corners, ...legal.filter((cell) => !corners.includes(cell))] : personality === "trickster" ? [...legal].reverse() : personality === "defensive" ? [...legal].sort((a, b) => Math.abs(a - 4) - Math.abs(b - 4)) : legal;
    if (state.mode === "ghost") { const index = personality === "human" ? (legal.find((cell) => cell === 4) ?? ordered[0]) : ordered[0]; return index === undefined ? null : { mode: "ghost", index }; }
    const cells = ordered.slice(0, 2);
    return cells.length === 2 ? { mode: "quantum", cells } : null;
  }

  function decorate(cell, index) {
    if (!cell) return;
    const wasTemporal = cell.dataset.temporal;
    cell.classList.remove("temporal-ghost", "temporal-quantum", "temporal-quantum-choice");
    cell.removeAttribute("data-temporal");
    if (wasTemporal) { cell.textContent = ""; cell.setAttribute("aria-label", `Cell ${index + 1}: Empty`); }
    if (state?.ghost?.cell === index) {
      cell.classList.add("temporal-ghost"); cell.dataset.temporal = "ghost";
      cell.innerHTML = `<span aria-hidden="true">Ghost</span><i aria-hidden="true">${"●".repeat(state.ghost.remaining)}</i>`;
      cell.setAttribute("aria-label", `Cell ${index + 1}: Ghost, temporary for ${state.ghost.remaining} moves`);
    }
    if (state?.quantum?.cells?.includes(index)) {
      cell.classList.add("temporal-quantum"); if (needsResolution(state.quantum.owner)) cell.classList.add("temporal-quantum-choice");
      cell.dataset.temporal = "quantum"; cell.innerHTML = '<span aria-hidden="true">Quantum</span>';
      cell.setAttribute("aria-label", `Cell ${index + 1}: Quantum candidate${needsResolution(state.quantum.owner) ? ", choose to resolve" : ""}`);
    }
  }

  global.TicTacToeTemporal = Object.freeze({ begin, clear, state: copy, reserved, available, activate, select, afterNormalMove, needsResolution, resolve, aiAction, decorate });
}(window));
