/* Phase 11.5D — competition modes built on the authoritative game engine. */
(function competitionLoop(global) {
  "use strict";
  const engine = global.TicTacToeCompetitionEngine;
  const core = global.TicTacToeFeatureCore;
  const save = global.TicTacToeSave;
  const $ = (id) => document.getElementById(id);
  const other = (mark) => mark === "X" ? "O" : "X";
  const RIVALS = Object.freeze([
    { id: "nova", name: "Nova Vale", personality: "human", level: 4, accent: "#36dce8", tendency: "Balanced lines and center control.", opening: "Often claims the center." },
    { id: "vex", name: "Vex Rook", personality: "aggressive", level: 6, accent: "#ff8a5d", tendency: "Turns small pressure into forcing threats.", opening: "Looks for active corners." },
    { id: "sable", name: "Sable Ward", personality: "defensive", level: 8, accent: "#57baff", tendency: "Denies threats before building an advantage.", opening: "Keeps the center secure." },
    { id: "mira", name: "Mira Flux", personality: "trickster", level: 10, accent: "#a98aff", tendency: "Creates awkward choices and fork bait.", opening: "Varies her first plan." },
    { id: "arden", name: "Arden Pike", personality: "aggressive", level: 13, accent: "#ffbd63", tendency: "Relentless tactical conversion.", opening: "Pressures open lanes early." },
    { id: "orion", name: "Orion Glass", personality: "defensive", level: 16, accent: "#78d8ff", tendency: "Patient proof-level resistance.", opening: "Removes the strongest route." }
  ]);
  const SPEEDS = Object.freeze({ standard: { label: "Standard", seconds: 8, level: 6 }, fast: { label: "Fast", seconds: 5, level: 8 }, extreme: { label: "Extreme", seconds: 3, level: 10 } });
  let session = null;
  let generation = 0;
  let countdown = null;
  let resultTimer = null;

  function clearAsync() { clearInterval(countdown); clearTimeout(resultTimer); countdown = null; resultTimer = null; }
  function endSession() { generation += 1; clearAsync(); removePrompt(); $("readOpponentButton")?.remove(); session = null; }
  function screens(id) { ["menu", "levels", "avatars", "symbolSelect", "game", "learning", "competition"].forEach((screen) => $(screen)?.classList.toggle("active", screen === id)); }
  function active() { return session && session.generation === generation ? session : null; }
  function emit(type, detail = {}) { global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } })); }
  function update(mutator) { save.update((data) => { data.features.competition ??= {}; mutator(data.features.competition); }); }
  function recordFor(id) { const entry = save.get().features.competition?.rivals?.[id] || {}; return { matches: Number(entry.matches) || 0, wins: Number(entry.wins) || 0, losses: Number(entry.losses) || 0, draws: Number(entry.draws) || 0, currentStreak: Number(entry.currentStreak) || 0, bestStreak: Number(entry.bestStreak) || 0, lastResult: entry.lastResult || "No matches yet" }; }
  function rivalUnlocked(rival, index) { return index === 0 || save.get().progression.levels.highestUnlocked >= rival.level - 1; }
  function featureConfig(type, personality, level, timer = { enabled: true, secondsPerTurn: 10 }) { return { type, mode: "ai", level, personality, playerSymbol: "X", aiSymbol: "O", timer, objective: { type: "WIN" }, permissions: { progression: false, statistics: false, achievements: false, replay: true } }; }

  function openHub() { endSession(); screens("competition"); renderHub(); }
  function closeHub() { endSession(); screens("menu"); }
  function renderHub() {
    $("competitionIntro").textContent = "Choose a fast reason to play again.";
    $("competitionContent").innerHTML = `<article class="glass-card competition-card"><h3>Rivals</h3><p>Face recognizable opponents with a record that remembers you.</p><button class="primary-control" type="button" onclick="competitionRivals()">View rivals</button></article><article class="glass-card competition-card"><h3>Quick Duel</h3><p>Start a real AI match now — no curriculum setup.</p><button class="control-button" type="button" onclick="competitionQuick(false)">Start instantly</button><button class="control-button" type="button" onclick="competitionQuick(true)">Predict the opponent</button></article><article class="glass-card competition-card"><h3>Speed Duel</h3><p>Make tactical decisions under an authoritative clock.</p><button class="control-button" type="button" onclick="competitionSpeedMenu()">Choose speed</button></article>`;
  }
  function rivalsMenu() {
    $("competitionIntro").textContent = "Each Rival reuses the real AI with a distinct identity and strength.";
    $("competitionContent").innerHTML = RIVALS.map((rival, index) => { const unlocked = rivalUnlocked(rival, index); const record = recordFor(rival.id); return `<article class="glass-card competition-card rival-card" style="--rival:${rival.accent}"><h3>${rival.name}</h3><p>${rival.tendency}</p><small>${rival.personality} · Strength ${rival.level} · ${record.wins}W ${record.losses}L ${record.draws}D</small><button class="control-button" type="button" ${unlocked ? "" : "disabled"} onclick="competitionRivalProfile('${rival.id}')">${unlocked ? "View profile" : `Unlock at level ${rival.level - 1}`}</button></article>`; }).join("") + `<button class="text-button" type="button" onclick="competitionBack()">‹ Compete</button>`;
  }
  function profile(id) {
    const rival = RIVALS.find((entry) => entry.id === id); if (!rival) return;
    const record = recordFor(id);
    $("competitionIntro").textContent = `${rival.name} · ${rival.personality} · Strength ${rival.level}`;
    $("competitionContent").innerHTML = `<article class="glass-card competition-card rival-profile" style="--rival:${rival.accent}"><h3>${rival.name}</h3><p>${rival.tendency}</p><p>${rival.opening}</p><small>Record: ${record.wins} wins · ${record.losses} losses · ${record.draws} draws · ${record.lastResult}</small><div class="competition-actions"><button class="primary-control" type="button" onclick="competitionStartRival('${id}')">Play Rival</button><button class="control-button" type="button" onclick="competitionStartRival('${id}', true)">Predict this Rival</button><button class="control-button" type="button" onclick="competitionRivals()">Back</button></div></article>`;
  }
  function startRival(id, prediction = false, rematch = false) {
    const rival = RIVALS.find((entry) => entry.id === id); if (!rival || !rivalUnlocked(rival, RIVALS.indexOf(rival))) return;
    endSession(); const token = generation;
    const config = featureConfig(rematch ? "rival_rematch" : "rival", rival.personality, rival.level);
    session = { generation: token, id: `rival-${id}-${Date.now()}`, type: rematch ? "RIVAL_REMATCH" : "RIVAL", config, playerSymbol: "X", opponentSymbol: "O", personality: rival.personality, level: rival.level, timer: config.timer, rival, predictionEnabled: prediction, predictionPending: false, read: [], start: Date.now() };
    const started = engine.start(config, { featureType: session.type, rivalId: rival.id, rivalName: rival.name, predictionEnabled: prediction });
    if (!started.valid) { session = null; openHub(); return; }
    emit("button_press", { feature: "rival" });
  }
  function startQuick(prediction) {
    endSession(); const token = generation;
    const config = featureConfig(prediction ? "prediction" : "quick_duel", "human", 6);
    session = { generation: token, id: `quick-${Date.now()}`, type: "QUICK_DUEL", config, playerSymbol: "X", opponentSymbol: "O", personality: "human", level: 6, timer: config.timer, predictionEnabled: prediction, predictionPending: false, read: [], start: Date.now() };
    const started = engine.start(config, { featureType: "QUICK_DUEL", predictionEnabled: prediction });
    if (!started.valid) { session = null; openHub(); return; }
  }
  function speedMenu() { $("competitionIntro").textContent = "The clock applies to your decisions; the AI does not consume your time."; $("competitionContent").innerHTML = Object.entries(SPEEDS).map(([id, item]) => `<article class="glass-card competition-card"><h3>${item.label}</h3><p>${item.seconds} seconds per player turn against a Level ${item.level} AI.</p><button class="control-button" type="button" onclick="competitionStartSpeed('${id}')">Start ${item.label}</button></article>`).join("") + `<button class="text-button" type="button" onclick="competitionBack()">‹ Compete</button>`; }
  function startSpeed(id) {
    const speed = SPEEDS[id]; if (!speed) return;
    endSession(); const token = generation;
    const config = featureConfig("speed_duel", "aggressive", speed.level, { enabled: true, secondsPerTurn: speed.seconds });
    session = { generation: token, id: `speed-${id}-${Date.now()}`, type: "SPEED_DUEL", config, playerSymbol: "X", opponentSymbol: "O", personality: "aggressive", level: speed.level, timer: config.timer, speed: id, predictionEnabled: false, read: [], start: 0 };
    showPrompt(`<strong>${speed.label} Speed Duel</strong><span>3</span>`, "competition-countdown");
    let remaining = 3;
    countdown = setInterval(() => { const current = active(); if (!current || current.generation !== token) { clearAsync(); return; } remaining -= 1; const prompt = $("competitionPrompt"); if (prompt) prompt.querySelector("span").textContent = remaining > 0 ? String(remaining) : "GO"; if (remaining <= 0) { clearInterval(countdown); countdown = null; removePrompt(); current.start = Date.now(); const started = engine.start(config, { featureType: "SPEED_DUEL", speed: id }); if (!started.valid) { session = null; openHub(); } } }, 650);
  }
  function showPrompt(content, className = "") { removePrompt(); const prompt = document.createElement("aside"); prompt.id = "competitionPrompt"; prompt.className = `competition-prompt ${className}`; prompt.setAttribute("role", "dialog"); prompt.setAttribute("aria-live", "assertive"); prompt.innerHTML = content; document.body.appendChild(prompt); }
  function removePrompt() { $("competitionPrompt")?.remove(); }

  function promptPrediction(detail) {
    const current = active(); if (!current || current.predictionPending || !current.predictionEnabled || detail.legalMoves.length < 2 || detail.moves.length < 3) return false;
    current.predictionPending = true; current.predictionGeneration = detail.generation;
    showPrompt(`<h3>Predict the opponent</h3><p>Choose one legal cell before the AI decides.</p><div class="prediction-grid">${detail.legalMoves.map((move) => `<button type="button" onclick="competitionPredict(${move})" aria-label="Predict cell ${move + 1}">${move + 1}</button>`).join("")}</div><button class="text-button" type="button" onclick="competitionCancelPrediction()">Skip</button>`);
    return true;
  }
  function choosePrediction(move) {
    const current = active(); if (!current?.predictionPending) return;
    current.prediction = move; current.predictionPending = false; removePrompt(); emit("button_press", { feature: "prediction" }); engine.resumeAI();
  }
  function cancelPrediction() { const current = active(); if (!current?.predictionPending) return; current.predictionPending = false; current.skipPredictionOnce = true; removePrompt(); engine.resumeAI(); }
  function categorizeAIMove(detail) {
    const current = active(); if (!current) return;
    const before = Array(9).fill(""); detail.moves.slice(0, -1).forEach((move, index) => { before[move] = index % 2 === 0 ? "X" : "O"; });
    const actor = detail.symbol; const tactical = core.analyzePosition({ board: before, playerSymbol: actor, opponentSymbol: other(actor) });
    let category = detail.index === 4 ? "center" : [0,2,6,8].includes(detail.index) ? "corner" : "pressure";
    if (tactical.opponentImmediateWins.includes(detail.index)) category = "defense";
    if (tactical.immediateWins.includes(detail.index) || tactical.forks.includes(detail.index)) category = "pressure";
    current.read.push(category);
    if (current.prediction !== undefined) {
      const correct = current.prediction === detail.index;
      update((competition) => { competition.prediction ??= { attempts: 0, correct: 0, recent: [] }; competition.prediction.attempts += 1; if (correct) competition.prediction.correct += 1; competition.prediction.recent = [...(competition.prediction.recent || []), { correct, at: Date.now() }].slice(-12); });
      current.prediction = undefined;
      showPrompt(`<h3>${correct ? "You predicted the move." : "The opponent chose another move."}</h3><p>${correct ? "Your read matched the real AI decision." : "Keep watching the tactical choices."}</p><button class="primary-control" type="button" onclick="competitionDismissPrompt()">Continue</button>`);
    }
    addReadButton();
  }
  function addReadButton() {
    const current = active(); if (!current || current.read.length < 2 || $("readOpponentButton")) return;
    const controls = document.querySelector(".game-screen .controls"); if (!controls) return;
    const button = document.createElement("button"); button.id = "readOpponentButton"; button.type = "button"; button.className = "control-button"; button.textContent = "Read Opponent"; button.addEventListener("click", openRead); controls.appendChild(button);
  }
  function openRead() {
    const current = active(); if (!current) return;
    const counts = current.read.reduce((all, item) => ({ ...all, [item]: (all[item] || 0) + 1 }), {});
    const ranked = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    if (ranked.length === 0 || ranked[0][1] < 2) { showPrompt(`<h3>Read the Opponent</h3><p>Not enough moves have been observed to establish a reliable pattern.</p><button class="primary-control" type="button" onclick="competitionDismissPrompt()">Continue</button>`); return; }
    const labels = { pressure: "Immediate pressure", defense: "Defensive denial", corner: "Corner control", center: "Center control" }; const answer = ranked[0][0];
    const observations = ranked.slice(0, 3).map(([key, value]) => `<li>${value} observed ${labels[key].toLowerCase()} move${value === 1 ? "" : "s"}.</li>`).join("");
    showPrompt(`<h3>Read the Opponent</h3><p>Observed behavior from this actual match:</p><ul>${observations}</ul><p>What has the opponent prioritized?</p><div class="prediction-grid">${Object.entries(labels).map(([key, label]) => `<button type="button" onclick="competitionReadAnswer('${key}','${answer}')">${label}</button>`).join("")}</div>`);
  }
  function readAnswer(choice, answer) { const correct = choice === answer; update((competition) => { competition.readOpponent ??= { attempts: 0, correct: 0 }; competition.readOpponent.attempts += 1; if (correct) competition.readOpponent.correct += 1; }); showPrompt(`<h3>${correct ? "Accurate read." : "Not this match."}</h3><p>${correct ? "Your choice matches the strongest observed tendency." : "The evidence pointed more strongly to another observed tactical pattern."}</p><button class="primary-control" type="button" onclick="competitionDismissPrompt()">Continue</button>`); }
  function dismissPrompt() { removePrompt(); }

  function recordResult(detail) {
    const current = active(); if (!current || current.generation !== generation) return;
    const type = detail.config.type;
    if (!["rival", "rival_rematch", "quick_duel", "prediction", "speed_duel"].includes(type)) return;
    if (current.rival) update((competition) => { competition.rivals ??= {}; const record = competition.rivals[current.rival.id] || { matches: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, bestStreak: 0, lastResult: "" }; record.matches += 1; if (detail.outcome === "win") { record.wins += 1; record.currentStreak += 1; record.bestStreak = Math.max(record.bestStreak || 0, record.currentStreak); } else if (detail.outcome === "draw") { record.draws += 1; record.currentStreak = 0; } else { record.losses += 1; record.currentStreak = 0; } record.lastResult = detail.outcome === "timeout" ? "Timed out" : detail.outcome; competition.rivals[current.rival.id] = record; });
    if (type === "quick_duel" || type === "prediction") update((competition) => { competition.quickDuel ??= { matches: 0, wins: 0, losses: 0, draws: 0 }; const q = competition.quickDuel; q.matches += 1; if (detail.outcome === "win") q.wins += 1; else if (detail.outcome === "draw") q.draws += 1; else q.losses += 1; });
    if (type === "speed_duel") update((competition) => { competition.speed ??= { wins: 0, losses: 0, draws: 0, timeouts: 0, fastestWinMs: null }; const speed = competition.speed; if (detail.outcome === "win") { speed.wins += 1; if (!speed.fastestWinMs || detail.durationMs < speed.fastestWinMs) speed.fastestWinMs = detail.durationMs; } else if (detail.outcome === "draw") speed.draws += 1; else { speed.losses += 1; if (detail.outcome === "timeout") speed.timeouts += 1; } });
    const token = current.generation; resultTimer = setTimeout(() => { if (!active() || active().generation !== token) return; decorateResult(current, detail); }, 720);
  }
  function decorateResult(current, detail) {
    const box = document.querySelector("#resultModal .modal-buttons"); if (!box) return;
    box.querySelectorAll(".competition-result-action").forEach((button) => button.remove());
    if (current.rival) { const rematch = document.createElement("button"); rematch.className = "primary-control competition-result-action"; rematch.type = "button"; rematch.textContent = `Rematch ${current.rival.name}`; rematch.addEventListener("click", () => startRival(current.rival.id, current.predictionEnabled, true)); box.prepend(rematch); if (current.read.length >= 2) { const read = document.createElement("button"); read.className = "control-button competition-result-action"; read.type = "button"; read.textContent = "Read Opponent"; read.addEventListener("click", openRead); box.prepend(read); } }
    if (detail.config.type === "quick_duel" || detail.config.type === "prediction") { const again = document.createElement("button"); again.className = "control-button competition-result-action"; again.type = "button"; again.textContent = "Quick Duel Again"; again.addEventListener("click", () => startQuick(current.predictionEnabled)); box.prepend(again); }
    if (detail.config.type === "speed_duel") { const again = document.createElement("button"); again.className = "control-button competition-result-action"; again.type = "button"; again.textContent = "Beat Your Time"; again.addEventListener("click", () => startSpeed(current.speed)); box.prepend(again); }
  }

  global.addEventListener("tictactoe:before-ai-move", (event) => { const current = active(); if (!current || !current.predictionEnabled || current.predictionPending || current.prediction !== undefined) return; if (current.skipPredictionOnce) { current.skipPredictionOnce = false; return; } if (promptPrediction(event.detail)) event.preventDefault(); });
  global.addEventListener("tictactoe:ai-move", (event) => categorizeAIMove(event.detail));
  global.addEventListener("tictactoe:match-complete", (event) => recordResult(event.detail));
  global.addEventListener("tictactoe:match-exit", () => { if (active()) endSession(); });
  global.openCompetitionHub = openHub; global.closeCompetitionHub = closeHub; global.competitionBack = renderHub; global.competitionRivals = rivalsMenu; global.competitionRivalProfile = profile; global.competitionStartRival = startRival; global.competitionQuick = startQuick; global.competitionSpeedMenu = speedMenu; global.competitionStartSpeed = startSpeed; global.competitionPredict = choosePrediction; global.competitionCancelPrediction = cancelPrediction; global.competitionReadAnswer = readAnswer; global.competitionDismissPrompt = dismissPrompt;
}(window));
