/* Phase 14: rival presentation and rematches reuse the authoritative standard AI. */
(function createRivals(global) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const rivals = Object.freeze([
    { id: "challenger", name: "The Challenger", phrase: "Presses the attack.", personality: "aggressive", motif: "attack", reactions: { win: "You broke through. Again.", loss: "Keep up.", draw: "No one takes a draw." } },
    { id: "guardian", name: "The Guardian", phrase: "Never leaves an opening.", personality: "defensive", motif: "guard", reactions: { win: "Your line held. This time.", loss: "The board was protected.", draw: "The position stands." } },
    { id: "trickster", name: "The Trickster", phrase: "Always has another move.", personality: "trickster", motif: "trick", reactions: { win: "You saw through the trap.", loss: "There was always another move.", draw: "A neat escape. Settle it." } },
    { id: "master", name: "The Master", phrase: "Every move has a purpose.", personality: "human", motif: "master", reactions: { win: "A precise finish. Rematch?", loss: "The line was calculated.", draw: "An exact balance. Break it." } }
  ]);
  const state = { rivalId: "challenger", level: 1, rematch: false, resultHandled: false, resultTimer: null, generation: 0 };
  const selected = () => rivals.find((rival) => rival.id === state.rivalId) || rivals[0];
  const maxLevel = () => Math.max(1, Math.min(20, Number(global.TicTacToeSave?.get?.()?.progression?.levels?.highestUnlocked) || 1));
  const clearResultTimer = () => { clearTimeout(state.resultTimer); state.resultTimer = null; state.generation += 1; };
  const clearRivalVisual = () => { const emblem = $("opponentEmblem"); if (emblem?.classList.contains("rival-game-emblem")) { emblem.className = "opponent-emblem"; emblem.textContent = "◉"; } };
  const feel = (type, detail = {}) => global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } }));
  function screens(id) { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id)); }
  function portrait(rival = selected()) { return `<span class="rival-portrait ${rival.id}" aria-hidden="true"><i></i></span>`; }
  function sync() {
    state.level = Math.min(state.level, maxLevel()); $("rivalLevelValue").textContent = String(state.level);
    $("rivalGrid").innerHTML = rivals.map((rival) => `<button type="button" class="rival-choice ${rival.id} ${rival.id === state.rivalId ? "selected" : ""}" data-rival="${rival.id}">${portrait(rival)}<span><strong>${rival.name}</strong><small>${rival.phrase}</small></span><b aria-hidden="true">›</b></button>`).join("");
    $("rivalGrid").querySelectorAll("[data-rival]").forEach((button) => button.addEventListener("click", () => { state.rivalId = button.dataset.rival; sync(); feel("selection"); }));
  }
  function open() { clearResultTimer(); state.rematch = false; state.resultHandled = false; $("rivalSelect").hidden = false; $("rivalIntro").hidden = true; sync(); screens("rivals"); }
  function close() { clearResultTimer(); clearRivalVisual(); state.resultHandled = false; $("resultModal")?.classList.remove("active"); screens("menu"); }
  function adjustLevel(amount) { state.level = Math.max(1, Math.min(maxLevel(), state.level + amount)); sync(); }
  function confirm() { const rival = selected(); $("rivalSelect").hidden = true; const intro = $("rivalIntro"); intro.hidden = false; intro.innerHTML = `<div class="rival-intro-card ${rival.id}">${portrait(rival)}<p class="eyebrow">${state.rematch ? "Rival rematch" : "First match"}</p><h2>${rival.name}</h2><p>${rival.phrase}</p><span class="rival-level-badge">Challenge ${state.level}</span><div><button class="primary-control" type="button" onclick="startRivalMatch()">Play <span aria-hidden="true">›</span></button><button class="text-button" type="button" onclick="backToRivalSelect()">‹ Change rival</button></div></div>`; }
  function backToSelect() { $("rivalIntro").hidden = true; $("rivalSelect").hidden = false; sync(); }
  function start() {
    const rival = selected(); clearResultTimer(); state.resultHandled = false;
    const response = global.TicTacToeCompetitionEngine?.start({ type: state.rematch ? "rival_rematch" : "rival", mode: "ai", level: state.level, personality: rival.personality, playerSymbol: "X", aiSymbol: "O", timer: { enabled: true, secondsPerTurn: 10 }, permissions: { progression: false, statistics: false, achievements: false, replay: false } }, { featureType: state.rematch ? "RIVAL_REMATCH" : "RIVAL", rivalId: rival.id, rivalName: rival.name, rivalPhrase: rival.phrase, rivalRematch: state.rematch });
    if (!response?.valid) { backToSelect(); return; }
    const emblem = $("opponentEmblem"); if (emblem) { emblem.className = `opponent-emblem rival-game-emblem ${rival.id}`; emblem.innerHTML = portrait(rival); }
    feel("selection", { feature: "rival", rival: rival.id });
  }
  function decorateResult(detail, token) {
    if (token !== state.generation || !state.resultHandled || detail.context?.rivalId !== state.rivalId) return;
    const rival = selected(), modal = $("resultModal"), actions = modal?.querySelector(".modal-buttons"); if (!modal || !actions) return;
    modal.classList.add("rival-result", rival.id); $("resultKicker").textContent = state.rematch ? "Rival Rematch" : "Rival Match"; $("resultDetail").textContent = rival.reactions[detail.outcome] || rival.reactions.draw;
    actions.querySelectorAll(".rival-result-action").forEach((button) => button.remove());
    const rematch = document.createElement("button"); rematch.type = "button"; rematch.className = "primary-control rival-result-action"; rematch.textContent = "Rematch"; rematch.addEventListener("click", () => { modal.classList.remove("active"); state.rematch = true; state.resultHandled = false; screens("rivals"); confirm(); });
    const exit = document.createElement("button"); exit.type = "button"; exit.className = "control-button rival-result-action"; exit.textContent = "Rivals"; exit.addEventListener("click", () => { modal.classList.remove("active"); state.rematch = false; state.resultHandled = false; screens("rivals"); backToSelect(); });
    actions.prepend(exit); actions.prepend(rematch);
    const card = modal.querySelector(".modal-card"); card?.querySelector(".rival-result-portrait")?.remove(); card?.insertAdjacentHTML("afterbegin", `<div class="rival-result-portrait">${portrait(rival)}</div>`);
  }
  global.addEventListener("tictactoe:match-complete", (event) => {
    const detail = event.detail || {}; if (!detail.context?.rivalId || !["rival", "rival_rematch"].includes(detail.config?.type) || state.resultHandled) return;
    state.resultHandled = true; clearTimeout(state.resultTimer); const token = state.generation; state.resultTimer = setTimeout(() => decorateResult(detail, token), 660);
  });
  global.addEventListener("tictactoe:match-exit", () => { clearResultTimer(); clearRivalVisual(); });
  global.openRivals = open; global.closeRivals = close; global.adjustRivalLevel = adjustLevel; global.confirmRival = confirm; global.backToRivalSelect = backToSelect; global.startRivalMatch = start;
  global.TicTacToeRivals = Object.freeze({ list: rivals.map(({ id, name, personality }) => ({ id, name, personality })) });
}(window));
