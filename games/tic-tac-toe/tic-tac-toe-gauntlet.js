/* Phase 03: a temporary eight-encounter run using the authoritative engine. */
(function createGauntletRun(global) {
  "use strict";

  const engine = global.TicTacToeCompetitionEngine;
  const $ = (id) => document.getElementById(id);
  const TOTAL_ENCOUNTERS = 8;
  const ENCOUNTERS = Object.freeze([
    { id: "pulse", name: "Pulse", title: "Opening Signal", personality: "human", level: 3, accent: "#35dfe8", glyph: "◇" },
    { id: "cinder", name: "Cinder", title: "Pressure Line", personality: "aggressive", level: 5, accent: "#ff986c", glyph: "▲" },
    { id: "aegis", name: "Aegis", title: "Hold the Center", personality: "defensive", level: 7, accent: "#65bcff", glyph: "◈" },
    { id: "prism", name: "Prism", title: "False Angle", personality: "trickster", level: 9, accent: "#b496ff", glyph: "✦" },
    { id: "flare", name: "Flare", title: "Open Fire", personality: "aggressive", level: 11, accent: "#ffba6b", glyph: "◆" },
    { id: "bastion", name: "Bastion", title: "No Easy Line", personality: "defensive", level: 13, accent: "#66d6ff", glyph: "⬡" },
    { id: "cipher", name: "Cipher", title: "Hidden Reply", personality: "trickster", level: 15, accent: "#ae91ff", glyph: "✧" },
    { id: "apex", name: "Apex", title: "Final Pattern", personality: "human", level: 17, accent: "#f1d27e", glyph: "✹" }
  ]);

  let run = null;
  let generation = 0;
  let resultTimer = null;

  function screens(active) {
    ["menu", "levels", "avatars", "symbolSelect", "game", "learning", "competition", "experiment", "gauntlet"].forEach((id) => $(id)?.classList.toggle("active", id === active));
  }

  function current() {
    return run && run.generation === generation ? run : null;
  }

  function clearResultActions() {
    clearTimeout(resultTimer);
    resultTimer = null;
    document.querySelectorAll(".gauntlet-result-action").forEach((button) => button.remove());
  }

  function endRun() {
    global.clearGauntletPowerEffects?.();
    generation += 1;
    clearResultActions();
    run = null;
    const hud = $("gauntletHud");
    if (hud) { hud.hidden = true; hud.innerHTML = ""; }
  }

  function encounter() {
    const state = current();
    return state ? ENCOUNTERS[state.encounterIndex] : null;
  }

  function routeNodes(activeIndex = -1, cleared = 0) {
    return `<div class="gauntlet-route" role="list" aria-label="Eight encounter route">${ENCOUNTERS.map((item, index) => {
      const state = index < cleared ? "cleared" : index === activeIndex ? "current" : "upcoming";
      return `<span class="gauntlet-node ${state}" role="listitem" style="--encounter:${item.accent}" aria-label="Encounter ${index + 1}: ${item.name}, ${state}"><b>${item.glyph}</b><i>${index + 1}</i></span>`;
    }).join("")}</div>`;
  }

  function renderBriefing() {
    const content = $("gauntletContent");
    if (!content) return;
    screens("gauntlet");
    content.innerHTML = `<header class="gauntlet-hero"><p class="eyebrow">Eight encounters</p><div class="gauntlet-crest" aria-hidden="true">✦</div><h2>The Gauntlet</h2><p>One run. Defeat every opponent. A loss ends the run.</p></header><section class="gauntlet-briefing glass-card"><div class="gauntlet-briefing-top"><span>RUN</span><strong>8</strong><small>encounters</small></div>${routeNodes()}<div class="gauntlet-briefing-actions"><button class="primary-control gauntlet-start" type="button" onclick="gauntletStartRun()">Begin Run <span aria-hidden="true">›</span></button><button class="text-button" type="button" onclick="closeGauntletHub()">‹ Back to home</button></div></section>`;
  }

  function openHub() {
    endRun();
    $("resultModal")?.classList.remove("active");
    renderBriefing();
    global.renderGauntletLoadout?.();
  }

  function closeHub() {
    endRun();
    $("resultModal")?.classList.remove("active");
    screens("menu");
  }

  function configFor(item) {
    return {
      type: "gauntlet",
      mode: "ai",
      level: item.level,
      personality: item.personality,
      playerSymbol: "X",
      aiSymbol: "O",
      timer: { enabled: true, secondsPerTurn: 10 },
      objective: { type: "WIN" },
      permissions: { progression: false, statistics: false, achievements: false, replay: true }
    };
  }

  function updateHud() {
    const state = current();
    const hud = $("gauntletHud");
    const item = encounter();
    if (!state || !hud || !item) return;
    hud.hidden = false;
    hud.style.setProperty("--encounter", item.accent);
    hud.innerHTML = `<div><span class="gauntlet-hud-kicker">Gauntlet</span><strong>${item.glyph} ${item.name}</strong></div><div class="gauntlet-hud-progress" aria-label="Encounter ${state.encounterIndex + 1} of ${TOTAL_ENCOUNTERS}"><b>${state.encounterIndex + 1}</b><div class="gauntlet-hud-route">${routeNodes(state.encounterIndex, state.victories)}</div></div>`;
    global.renderGauntletPowers?.(state, hud);
  }

  function startRun() {
    if (current()?.status === "starting" || current()?.status === "playing") return;
    endRun();
    const token = generation;
    run = { id: `gauntlet-${Date.now()}`, generation: token, status: "starting", encounterIndex: 0, victories: 0, complete: false, failed: false, resultHandled: false, advancing: false, powers: global.createGauntletPowerState?.() || null };
    startEncounter();
  }

  function startEncounter() {
    const state = current();
    const item = encounter();
    if (!state || !item || state.advancing || state.status === "failed" || state.complete) return;
    state.advancing = true;
    state.status = "starting";
    state.resultHandled = false;
    global.resetGauntletPowersForEncounter?.(state);
    clearResultActions();
    $("resultModal")?.classList.remove("active");
    const started = engine.start(configFor(item), {
      featureType: "GAUNTLET",
      returnScreen: "gauntlet",
      gauntletRunId: state.id,
      encounterIndex: state.encounterIndex,
      encounterTotal: TOTAL_ENCOUNTERS,
      opponentName: item.name
    });
    state.advancing = false;
    if (!started.valid) {
      endRun();
      renderBriefing();
      return;
    }
    state.status = "playing";
    updateHud();
    const kicker = $("opponentKicker");
    const name = $("opponentName");
    const lesson = $("opponentLesson");
    if (kicker) kicker.textContent = `Gauntlet · Encounter ${state.encounterIndex + 1} of ${TOTAL_ENCOUNTERS}`;
    if (name) name.textContent = item.name;
    if (lesson) lesson.textContent = item.title;
    global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type: "button_press", feature: "gauntlet" } }));
  }

  function resultButton(label, primary, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${primary ? "primary-control" : "control-button"} gauntlet-result-action`;
    button.textContent = label;
    button.addEventListener("click", handler, { once: true });
    return button;
  }

  function decorateResult(detail, token) {
    const state = current();
    if (!state || state.generation !== token) return;
    const modal = $("resultModal");
    const actions = modal?.querySelector(".modal-buttons");
    if (!modal || !actions) return;
    clearResultActions();
    const kicker = $("resultKicker");
    const title = $("resultTitle");
    const detailText = $("resultDetail");
    const replay = actions.querySelector('button[onclick="restartGame()"]');
    const home = actions.querySelector('button[onclick="goHome()"]');
    const next = $("nextBtn");
    if (replay) replay.style.display = "none";
    if (home) home.style.display = "none";
    if (next) next.style.display = "none";

    if (detail.outcome === "win") {
      if (state.encounterIndex === TOTAL_ENCOUNTERS - 1) {
        state.status = "complete";
        state.complete = true;
        if (kicker) kicker.textContent = "Gauntlet Complete";
        if (title) title.textContent = "Run Cleared";
        if (detailText) detailText.textContent = `All ${TOTAL_ENCOUNTERS} encounters defeated.`;
        actions.prepend(resultButton("Exit Gauntlet", false, closeHub));
        actions.prepend(resultButton("New Run", true, startRun));
      } else {
        state.status = "encounter-complete";
        if (kicker) kicker.textContent = `Encounter ${state.encounterIndex + 1} Cleared`;
        if (title) title.textContent = "Victory";
        if (detailText) detailText.textContent = `${state.victories} / ${TOTAL_ENCOUNTERS} opponents defeated.`;
        actions.prepend(resultButton("Exit Run", false, exitRun));
        actions.prepend(resultButton("Next Encounter", true, continueRun));
      }
      return;
    }

    if (detail.outcome === "draw") {
      state.status = "draw";
      if (kicker) kicker.textContent = `Encounter ${state.encounterIndex + 1} Drawn`;
      if (title) title.textContent = "Run Holds";
      if (detailText) detailText.textContent = "No opponent was defeated. Replay this encounter or leave the run.";
      actions.prepend(resultButton("Exit Run", false, exitRun));
      actions.prepend(resultButton("Replay Encounter", true, replayEncounter));
      return;
    }

    state.status = "failed";
    state.failed = true;
    if (kicker) kicker.textContent = "Run Failed";
    if (title) title.textContent = "Gauntlet Ended";
    if (detailText) detailText.textContent = `${state.victories} / ${TOTAL_ENCOUNTERS} encounters defeated · reached encounter ${state.encounterIndex + 1}.`;
    actions.prepend(resultButton("Exit Gauntlet", false, closeHub));
    actions.prepend(resultButton("Fresh Run", true, startRun));
  }

  function continueRun() {
    const state = current();
    if (!state || state.status !== "encounter-complete" || state.advancing) return;
    state.encounterIndex += 1;
    if (state.encounterIndex >= TOTAL_ENCOUNTERS) return;
    startEncounter();
  }

  function replayEncounter() {
    const state = current();
    if (!state || state.status !== "draw" || state.advancing) return;
    startEncounter();
  }

  function exitRun() {
    if (!current()) { closeHub(); return; }
    engine.exit();
  }

  global.addEventListener("tictactoe:match-complete", (event) => {
    const state = current();
    const detail = event.detail;
    if (!state || state.status !== "playing" || detail.config?.type !== "gauntlet" || detail.context?.gauntletRunId !== state.id || state.resultHandled) return;
    state.resultHandled = true;
    if (detail.outcome === "win") state.victories += 1;
    const token = state.generation;
    resultTimer = setTimeout(() => decorateResult(detail, token), 680);
  });

  global.addEventListener("tictactoe:match-exit", () => {
    if (current()) endRun();
  });

  global.openGauntletHub = openHub;
  global.closeGauntletHub = closeHub;
  global.gauntletStartRun = startRun;
  global.gauntletContinue = continueRun;
  global.gauntletReplayEncounter = replayEncounter;
  global.gauntletExitRun = exitRun;
  global.TicTacToeGauntlet = Object.freeze({
    getActiveRun: () => current(),
    refreshHud: updateHud
  });
}(window));
