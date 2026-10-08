/* Phase 22 entry presentation; it wraps Phase 21 without changing its rules. */
(function (global) {
  "use strict";
  const original = global.gauntletChooseRoute;
  let pending = null;
  function show() {
    const state = global.TicTacToeGauntlet?.getActiveRun?.();
    const mode = state?.encounterIndex === 4 ? "ghost" : state?.encounterIndex === 7 ? "quantum" : null;
    if (!mode || !pending) return original?.(pending || "battle");
    const host = document.getElementById("gauntletContent");
    host.innerHTML = `<section class="gauntlet-temporal-brief ${mode}"><div><p class="eyebrow">Temporal encounter</p><h2>${mode === "ghost" ? "Ghost Protocol" : "Quantum Protocol"}</h2><p>${mode === "ghost" ? "Reserve one cell for exactly two normal moves." : "Reserve two cells, then resolve one after the opponent moves."}</p><button class="primary-control" type="button" onclick="gauntletConfirmTemporalEntry()">Enter encounter</button></div></section>`;
  }
  global.gauntletChooseRoute = (type) => { const state = global.TicTacToeGauntlet?.getActiveRun?.(); if ((state?.encounterIndex === 4 || state?.encounterIndex === 7) && (type === "battle" || type === "elite")) { pending = type; show(); return; } original?.(type); };
  global.gauntletConfirmTemporalEntry = () => { const choice = pending || "battle"; pending = null; original?.(choice); };
}(window));
