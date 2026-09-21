/* Phase 04: Gauntlet-only tactical powers. The shared engine remains authoritative. */
(function createGauntletPowers(global) {
  "use strict";

  const engine = global.TicTacToeCompetitionEngine;
  const core = global.TicTacToeFeatureCore;
  const DEFAULT_LOADOUT = Object.freeze(["insight", "rewind"]);
  const MAX_LOADOUT = 2;
  const POWER_DEFINITIONS = Object.freeze({
    insight: { icon: "◎", name: "Insight", rule: "Each encounter", detail: "Reveal a strong move" },
    rewind: { icon: "↶", name: "Rewind", rule: "One per run", detail: "Undo your last exchange" },
    momentum: { icon: "ϟ", name: "Momentum", rule: "One per run", detail: "Take one extra move" }
  });
  let selectedLoadout = [...DEFAULT_LOADOUT];

  const $ = (id) => document.getElementById(id);
  const activeRun = () => global.TicTacToeGauntlet?.getActiveRun?.() || null;
  const hasPower = (state, id) => Boolean(state?.powers?.loadout?.includes(id));
  const dispatchFeel = (type) => global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, feature: "gauntlet-power" } }));

  function normalizeLoadout(loadout = selectedLoadout) {
    const unique = [...new Set(Array.isArray(loadout) ? loadout : [])].filter((id) => POWER_DEFINITIONS[id]);
    return unique.length ? unique.slice(0, MAX_LOADOUT) : [...DEFAULT_LOADOUT];
  }

  function createPowerState() {
    return {
      loadout: normalizeLoadout(),
      insightUsed: false,
      insightCell: null,
      rewindUsed: false,
      rewindReady: false,
      momentumUsed: false,
      momentumArmed: false,
      extraMovePending: false,
      playerMovesSinceAI: 0,
      busy: false,
      message: ""
    };
  }

  function clearInsightHighlight() {
    document.querySelectorAll("#board .cell.insight-recommendation").forEach((cell) => cell.classList.remove("insight-recommendation"));
  }

  function clearEffects(state = activeRun()) {
    clearInsightHighlight();
    if (!state?.powers) return;
    state.powers.insightCell = null;
    state.powers.momentumArmed = false;
    state.powers.extraMovePending = false;
    state.powers.playerMovesSinceAI = 0;
    state.powers.busy = false;
    state.powers.message = "";
  }

  function resetForEncounter(state) {
    if (!state?.powers) return;
    clearEffects(state);
    state.powers.insightUsed = false;
    state.powers.rewindReady = false;
    refreshHud();
  }

  function isGauntletSnapshot(snapshot = engine?.snapshot?.()) {
    const state = activeRun();
    return Boolean(state && snapshot?.active && state.status === "playing" && snapshot.config?.type === "gauntlet" && snapshot.context?.gauntletRunId === state.id);
  }

  function canUseOnHumanTurn(snapshot = engine?.snapshot?.()) {
    return isGauntletSnapshot(snapshot) && snapshot.phase === "PLAYING" && snapshot.currentPlayer === snapshot.playerSymbol;
  }

  function powerAvailability(state, id, snapshot = engine?.snapshot?.()) {
    const powers = state?.powers;
    if (!hasPower(state, id)) return { enabled: false, label: "Not equipped" };
    if (!canUseOnHumanTurn(snapshot) || powers?.busy) return { enabled: false, label: "Wait" };
    if (id === "insight") {
      return !powers.insightUsed && core.analyzePosition({ board: snapshot.board, playerSymbol: snapshot.playerSymbol, opponentSymbol: snapshot.aiSymbol, rules: snapshot.config.rules }).legalMoves.length ? { enabled: true, label: "Ready" } : { enabled: false, label: powers.insightUsed ? "Used" : "No move" };
    }
    if (id === "rewind") return !powers.rewindUsed && powers.rewindReady ? { enabled: true, label: "Ready" } : { enabled: false, label: powers.rewindUsed ? "Used" : "After reply" };
    if (id === "momentum") {
      if (powers.momentumArmed) return { enabled: false, label: "Armed" };
      if (powers.extraMovePending) return { enabled: false, label: "Extra move" };
      if (powers.momentumUsed) return { enabled: false, label: "Used" };
      return { enabled: true, label: "Ready" };
    }
    return { enabled: false, label: "Unavailable" };
  }

  function addFeedback(hud, text, state = activeRun()) {
    if (state?.powers) state.powers.message = text;
    const message = hud?.querySelector(".gauntlet-power-message");
    if (message) message.textContent = text;
  }

  function refreshHud() {
    const state = activeRun();
    if (state) global.TicTacToeGauntlet?.refreshHud?.();
  }

  function renderHud(state, hud) {
    if (!state?.powers || !hud) return;
    hud.querySelector(".gauntlet-powers")?.remove();
    const snapshot = engine.snapshot();
    const powerBar = document.createElement("section");
    powerBar.className = "gauntlet-powers";
    powerBar.setAttribute("aria-label", "Tactical powers");
    powerBar.innerHTML = `<span class="gauntlet-power-label">Tactical powers</span><div class="gauntlet-power-list"></div><span class="gauntlet-power-message" role="status" aria-live="polite">${state.powers.message || ""}</span>`;
    const list = powerBar.querySelector(".gauntlet-power-list");
    state.powers.loadout.forEach((id) => {
      const definition = POWER_DEFINITIONS[id];
      const availability = powerAvailability(state, id, snapshot);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gauntlet-power ${id}${availability.enabled ? " available" : ""}${state.powers.momentumArmed && id === "momentum" ? " armed" : ""}`;
      button.disabled = !availability.enabled;
      button.setAttribute("aria-label", `${definition.name}: ${availability.label}. ${definition.detail}.`);
      button.innerHTML = `<b aria-hidden="true">${definition.icon}</b><span>${definition.name}</span><small>${availability.label}</small>`;
      button.addEventListener("click", () => activatePower(id));
      list.appendChild(button);
    });
    hud.appendChild(powerBar);
  }

  function renderLoadout() {
    const briefing = document.querySelector("#gauntletContent .gauntlet-briefing");
    if (!briefing) return;
    let slot = $("gauntletLoadout");
    if (!slot) {
      slot = document.createElement("section");
      slot.id = "gauntletLoadout";
      slot.className = "gauntlet-loadout-slot";
      briefing.querySelector(".gauntlet-briefing-actions")?.before(slot);
    }
    slot.innerHTML = `<div class="gauntlet-loadout-heading"><span>Tactical loadout</span><small>Choose up to ${MAX_LOADOUT} · ${selectedLoadout.length}/${MAX_LOADOUT} equipped</small></div><div class="gauntlet-loadout-list" role="group" aria-label="Choose tactical powers"></div>`;
    const list = slot.querySelector(".gauntlet-loadout-list");
    Object.entries(POWER_DEFINITIONS).forEach(([id, definition]) => {
      const equipped = selectedLoadout.includes(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gauntlet-loadout-power ${id}${equipped ? " equipped" : ""}`;
      button.setAttribute("aria-pressed", String(equipped));
      button.setAttribute("aria-label", `${definition.name}. ${definition.rule}. ${equipped ? "Equipped" : "Not equipped"}. ${definition.detail}.`);
      button.innerHTML = `<b aria-hidden="true">${definition.icon}</b><span><strong>${definition.name}</strong><small>${definition.detail}</small></span><em>${definition.rule}</em>`;
      button.addEventListener("click", () => toggleLoadout(id));
      list.appendChild(button);
    });
  }

  function toggleLoadout(id) {
    if (selectedLoadout.includes(id)) {
      if (selectedLoadout.length === 1) return;
      selectedLoadout = selectedLoadout.filter((power) => power !== id);
    } else {
      if (selectedLoadout.length >= MAX_LOADOUT) return;
      selectedLoadout = [...selectedLoadout, id];
    }
    dispatchFeel("button_press");
    renderLoadout();
  }

  function recommendMove(snapshot) {
    const analysis = core.analyzePosition({ board: snapshot.board, playerSymbol: snapshot.playerSymbol, opponentSymbol: snapshot.aiSymbol, rules: snapshot.config.rules });
    if (!analysis.valid || !analysis.legalMoves.length) return null;
    const strategic = analysis.immediateWins[0] ?? analysis.opponentImmediateWins[0] ?? analysis.forks[0];
    if (Number.isInteger(strategic)) return strategic;
    if (analysis.legalMoves.includes(4)) return 4;
    return analysis.legalMoves.find((move) => [0, 2, 6, 8].includes(move)) ?? analysis.legalMoves[0];
  }

  function activateInsight(state, snapshot) {
    const move = recommendMove(snapshot);
    if (!Number.isInteger(move)) return false;
    clearInsightHighlight();
    const cell = document.querySelectorAll("#board .cell")[move];
    if (!cell || cell.textContent) return false;
    state.powers.insightUsed = true;
    state.powers.insightCell = move;
    cell.classList.add("insight-recommendation");
    addFeedback($("gauntletHud"), "Insight: consider the marked cell.", state);
    dispatchFeel("button_press");
    refreshHud();
    return true;
  }

  function activateRewind(state) {
    if (!engine.rewindGauntletPair?.()) return false;
    state.powers.rewindUsed = true;
    state.powers.rewindReady = false;
    state.powers.playerMovesSinceAI = 0;
    clearInsightHighlight();
    addFeedback($("gauntletHud"), "Rewind used. Your turn again.", state);
    dispatchFeel("button_press");
    refreshHud();
    return true;
  }

  function activateMomentum(state) {
    state.powers.momentumUsed = true;
    state.powers.momentumArmed = true;
    addFeedback($("gauntletHud"), "Momentum armed for your next move.", state);
    dispatchFeel("button_press");
    refreshHud();
    return true;
  }

  function activatePower(id) {
    const state = activeRun();
    const snapshot = engine?.snapshot?.();
    if (!state?.powers || !powerAvailability(state, id, snapshot).enabled) return;
    state.powers.busy = true;
    const used = id === "insight" ? activateInsight(state, snapshot) : id === "rewind" ? activateRewind(state) : activateMomentum(state);
    state.powers.busy = false;
    if (!used) refreshHud();
  }

  global.addEventListener("tictactoe:player-move", (event) => {
    const state = activeRun();
    if (!isGauntletSnapshot(engine.snapshot()) || event.detail.config?.type !== "gauntlet") return;
    clearInsightHighlight();
    state.powers.insightCell = null;
    state.powers.playerMovesSinceAI += 1;
    refreshHud();
  });

  global.addEventListener("tictactoe:before-ai-response", (event) => {
    const state = activeRun();
    if (!state?.powers || event.detail.config?.type !== "gauntlet" || event.detail.context?.gauntletRunId !== state.id) return;
    if (state.powers.momentumArmed) {
      state.powers.momentumArmed = false;
      state.powers.extraMovePending = true;
      addFeedback($("gauntletHud"), "Momentum: one extra move.", state);
      refreshHud();
      event.preventDefault();
      return;
    }
    if (state.powers.extraMovePending) {
      state.powers.extraMovePending = false;
      refreshHud();
    }
  });

  global.addEventListener("tictactoe:ai-move", (event) => {
    const state = activeRun();
    if (!state?.powers || event.detail.config?.type !== "gauntlet") return;
    state.powers.rewindReady = state.powers.playerMovesSinceAI === 1;
    state.powers.playerMovesSinceAI = 0;
    state.powers.extraMovePending = false;
    refreshHud();
  });

  global.addEventListener("tictactoe:match-complete", (event) => {
    const state = activeRun();
    if (!state?.powers || event.detail.config?.type !== "gauntlet" || event.detail.context?.gauntletRunId !== state.id) return;
    clearInsightHighlight();
    state.powers.insightCell = null;
    state.powers.momentumArmed = false;
    state.powers.extraMovePending = false;
  });

  global.createGauntletPowerState = createPowerState;
  global.resetGauntletPowersForEncounter = resetForEncounter;
  global.clearGauntletPowerEffects = clearEffects;
  global.renderGauntletPowers = renderHud;
  global.renderGauntletLoadout = renderLoadout;
  global.activateGauntletPower = activatePower;
}(window));
