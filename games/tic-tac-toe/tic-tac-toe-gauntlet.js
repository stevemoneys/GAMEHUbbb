/* Phase 03: a temporary eight-encounter run using the authoritative engine. */
(function createGauntletRun(global) {
  "use strict";

  const engine = global.TicTacToeCompetitionEngine;
  const $ = (id) => document.getElementById(id);
  const TOTAL_ENCOUNTERS = 8;
  const ENCOUNTERS = Object.freeze([
    { id: "pulse", name: "Pulse", title: "Opening Signal", personality: "human", level: 3, accent: "#35dfe8", glyph: "◇" },
    { id: "cinder", name: "Cinder", title: "Sealed Center", personality: "aggressive", level: 5, accent: "#ff986c", glyph: "⊘", encounterRule: "sealed_center", ruleLabel: "Center sealed", ruleText: "The center is locked for both sides.", pattern: "center" },
    { id: "aegis", name: "Aegis", title: "Hold the Center", personality: "defensive", level: 7, accent: "#65bcff", glyph: "◈" },
    { id: "warden", name: "The Warden", title: "Fortress Protocol", personality: "trickster", level: 9, accent: "#b496ff", glyph: "♜", boss: true, encounterRule: "sealed_center", ruleLabel: "Center sealed", ruleText: "The Warden seals the center for both sides.", pattern: "center" },
    { id: "flare", name: "Flare", title: "Open Fire", personality: "aggressive", level: 11, accent: "#ffba6b", glyph: "◆" },
    { id: "bastion", name: "Bastion", title: "Sealed Corners", personality: "defensive", level: 13, accent: "#66d6ff", glyph: "⊞", encounterRule: "sealed_corners", ruleLabel: "Corners sealed", ruleText: "All four corners are locked for both sides.", pattern: "corners" },
    { id: "cipher", name: "Cipher", title: "Hidden Reply", personality: "trickster", level: 15, accent: "#ae91ff", glyph: "✧" },
    { id: "architect", name: "The Architect", title: "Final Structure", personality: "human", level: 17, accent: "#f1d27e", glyph: "◫", boss: true, finalBoss: true, encounterRule: "sealed_corners", ruleLabel: "Corners sealed", ruleText: "The Architect seals every corner for both sides.", pattern: "corners" }
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
      const special = item.boss ? ` boss${item.finalBoss ? " final-boss" : ""}` : item.encounterRule ? " mutator" : "";
      const descriptor = item.boss ? `${item.finalBoss ? "final boss, " : "boss, "}${item.ruleLabel}` : item.encounterRule ? `${item.ruleLabel} mutator` : "standard encounter";
      return `<span class="gauntlet-node ${state}${special}" role="listitem" style="--encounter:${item.accent}" aria-label="Encounter ${index + 1}: ${item.name}, ${descriptor}, ${state}"><b>${item.glyph}</b><i>${index + 1}</i></span>`;
    }).join("")}</div>`;
  }

  function renderBriefing() {
    const content = $("gauntletContent");
    if (!content) return;
    screens("gauntlet");
    content.innerHTML = `<header class="gauntlet-hero"><p class="eyebrow">Eight encounters</p><div class="gauntlet-crest" aria-hidden="true">✦</div><h2>The Gauntlet</h2><p>One run. Defeat every opponent. A loss ends the run.</p></header><section class="gauntlet-briefing glass-card"><div class="gauntlet-briefing-top"><span>RUN</span><strong>8</strong><small>encounters</small></div>${routeNodes()}<div class="gauntlet-briefing-actions"><button class="primary-control gauntlet-start" type="button" onclick="gauntletStartRun()">Begin Run <span aria-hidden="true">›</span></button><button class="text-button" type="button" onclick="closeGauntletHub()">‹ Back to home</button></div></section>`;
    global.renderGauntletLoadout?.();
  }

  function openHub() {
    endRun();
    $("resultModal")?.classList.remove("active");
    renderBriefing();
  }

  function closeHub() {
    endRun();
    $("resultModal")?.classList.remove("active");
    screens("menu");
  }

  function configFor(item) {
    const blockedCells = item.encounterRule === "sealed_center" ? [4] : item.encounterRule === "sealed_corners" ? [0, 2, 6, 8] : [];
    return {
      type: "gauntlet",
      mode: "ai",
      level: item.level,
      personality: item.personality,
      playerSymbol: "X",
      aiSymbol: "O",
      rules: { blockedCells, gauntletEncounterRule: item.encounterRule || null },
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
    const encounterTag = item.boss ? `<span class="gauntlet-encounter-tag boss-tag"><b aria-hidden="true">${item.glyph}</b> ${item.finalBoss ? "Final Boss" : "Boss"}</span>` : item.encounterRule ? `<span class="gauntlet-encounter-tag mutator-tag"><b aria-hidden="true">${item.glyph}</b> ${item.ruleLabel}</span>` : "";
    const ruleBrief = item.encounterRule ? `<div class="gauntlet-rule-brief ${item.boss ? "boss-rule" : ""}" aria-label="${item.ruleLabel}: ${item.ruleText}"><span class="gauntlet-rule-pattern ${item.pattern}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span><strong>${item.ruleLabel}</strong><small>${item.ruleText}</small></span></div>` : "";
    hud.innerHTML = `<div class="gauntlet-hud-opponent"><span class="gauntlet-hud-kicker">Gauntlet ${encounterTag}</span><strong>${item.glyph} ${item.name}</strong></div><div class="gauntlet-hud-progress" aria-label="Encounter ${state.encounterIndex + 1} of ${TOTAL_ENCOUNTERS}"><b>${state.encounterIndex + 1}</b><div class="gauntlet-hud-route">${routeNodes(state.encounterIndex, state.victories)}</div></div>${ruleBrief}`;
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
    if (kicker) kicker.textContent = item.boss ? `Gauntlet Boss · Encounter ${state.encounterIndex + 1} of ${TOTAL_ENCOUNTERS}` : item.encounterRule ? `Gauntlet Mutator · Encounter ${state.encounterIndex + 1} of ${TOTAL_ENCOUNTERS}` : `Gauntlet · Encounter ${state.encounterIndex + 1} of ${TOTAL_ENCOUNTERS}`;
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
    const item = encounter();
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
        if (kicker) kicker.textContent = item?.boss ? "Final Boss Defeated" : "Gauntlet Complete";
        if (title) title.textContent = item?.boss ? "Architecture Broken" : "Run Cleared";
        if (detailText) detailText.textContent = `All ${TOTAL_ENCOUNTERS} encounters defeated.`;
        actions.prepend(resultButton("Exit Gauntlet", false, closeHub));
        actions.prepend(resultButton("New Run", true, startRun));
      } else {
        state.status = "encounter-complete";
        if (kicker) kicker.textContent = item?.boss ? "Boss Defeated" : `Encounter ${state.encounterIndex + 1} Cleared`;
        if (title) title.textContent = item?.boss ? "Fortress Breached" : "Victory";
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
