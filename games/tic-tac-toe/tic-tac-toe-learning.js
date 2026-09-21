/* Phase 11.5C — playable learning and review experiences. */
(function createLearningLoop(global) {
  "use strict";

  const core = global.TicTacToeFeatureCore;
  const save = global.TicTacToeSave;
  const $ = (id) => document.getElementById(id);
  const emptyBoard = () => Array(9).fill("");
  const other = (mark) => mark === "X" ? "O" : "X";
  const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,4,6]];
  let active = null;
  let generation = 0;

  const CATEGORIES = {
    WIN_IN_1: { title: "Win in 1", lesson: "Spot the line that ends the game now." },
    BLOCK: { title: "Block", lesson: "Stop the opponent's immediate threat." },
    FORK: { title: "Create Fork", lesson: "Create two winning threats with one move." },
    PREVENT_FORK: { title: "Prevent Fork", lesson: "Remove the opponent's double-threat opportunity." },
    WIN_IN_2: { title: "Win in 2", lesson: "Create a forced pair of threats." }
  };
  const TRIALS = {
    threat: { title: "Threat Recognition", steps: ["WIN_IN_1", "BLOCK", "WIN_IN_1"] },
    blocking: { title: "Blocking Fundamentals", steps: ["BLOCK", "BLOCK", "PREVENT_FORK"] },
    fork: { title: "Fork Creation", steps: ["FORK", "WIN_IN_2", "FORK"] },
    prevention: { title: "Fork Prevention", steps: ["PREVENT_FORK", "BLOCK", "PREVENT_FORK"] },
    conversion: { title: "Tactical Conversion", steps: ["WIN_IN_1", "WIN_IN_2", "WIN_IN_1"] }
  };
  // These are legal, non-terminal positions. Their tactical result is checked at
  // play time; the listed board is never treated as an answer key.
  const POSITIONS = {
    WIN_IN_1: [
      { board: ["X","X","","O","O","","","", ""], player: "X" },
      { board: ["X","O","","X","O","","","", ""], player: "X" }
    ],
    BLOCK: [
      { board: ["O","O","","X","","","","X", ""], player: "X" },
      { board: ["X","O","X","","O","","","", ""], player: "X" }
    ],
    FORK: [
      { board: ["X","O","","","O","","","","X"], player: "X" }
    ],
    PREVENT_FORK: [
      { board: ["O","X","X","","","","","",""], player: "O" }
    ],
    WIN_IN_2: [
      { board: ["O","O","X","X","","","","", ""], player: "X" }
    ]
  };

  function winner(board, mark) { return WIN_LINES.some((line) => line.every((cell) => board[cell] === mark)); }
  function count(board, mark) { return board.filter((cell) => cell === mark).length; }
  function legalPosition(board, player) {
    if (!Array.isArray(board) || board.length !== 9 || board.some((cell) => !["", "X", "O"].includes(cell))) return false;
    const x = count(board, "X"), o = count(board, "O");
    return (x === o || x === o + 1) && player === (x === o ? "X" : "O") && !winner(board, "X") && !winner(board, "O");
  }
  function analysis(board, player) { return core.analyzePosition({ board, playerSymbol: player, opponentSymbol: other(player) }); }
  function immediateWins(board, player) { return analysis(board, player).immediateWins; }
  function forcedWinInTwo(board, player, move) {
    const first = [...board]; first[move] = player;
    if (winner(first, player)) return false;
    const opponent = other(player);
    const replies = analysis(first, opponent).legalMoves;
    return replies.length > 0 && replies.every((reply) => {
      const afterReply = [...first]; afterReply[reply] = opponent;
      return !winner(afterReply, opponent) && immediateWins(afterReply, player).length > 0;
    });
  }
  function solutions(position) {
    const before = analysis(position.board, position.player);
    const opponent = other(position.player);
    return before.legalMoves.filter((move) => {
      const after = [...position.board]; after[move] = position.player;
      if (position.type === "WIN_IN_1") return winner(after, position.player);
      if (position.type === "BLOCK") return before.opponentImmediateWins.includes(move) && immediateWins(after, opponent).length === 0;
      if (position.type === "FORK") return immediateWins(after, position.player).length >= 2;
      if (position.type === "PREVENT_FORK") return before.counterForks.length > 0 && analysis(after, opponent).forks.length === 0;
      if (position.type === "WIN_IN_2") return forcedWinInTwo(position.board, position.player, move);
      return false;
    });
  }
  function validatedPosition(type, seed) {
    const pool = POSITIONS[type] || [];
    const offset = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(pool.length, 1);
    for (let index = 0; index < pool.length; index += 1) {
      const source = pool[(offset + index) % pool.length];
      const position = { id: `${type}-${(offset + index) % pool.length + 1}`, type, board: [...source.board], player: source.player, opponent: other(source.player) };
      if (legalPosition(position.board, position.player) && solutions(position).length) return position;
    }
    return null;
  }
  function dailyKey() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  function emit(type) { global.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type } })); }
  function current() { return active && active.generation === generation ? active : null; }
  function endSession() { generation += 1; active = null; }
  function screens(showId) { ["menu", "levels", "avatars", "symbolSelect", "game", "learning", "competition", "experiment", "gauntlet"].forEach((id) => $(id)?.classList.toggle("active", id === showId)); }
  function updateFeature(mutator) { save.update((data) => { mutator(data.features); }); }
  function escape(text) { return String(text).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[char])); }

  function openHub() { endSession(); screens("learning"); renderHub(); }
  function closeHub() { endSession(); screens("menu"); }
  function renderHub() {
    const replay = save.get().features.replays[0];
    $("learningIntro").textContent = "Focused tactics, connected trials, and factual match review.";
    $("learningContent").innerHTML = `
      <article class="glass-card learning-card"><h3>Tactical Challenges</h3><p>Practice one provable pattern at a time.</p><button class="primary-control" type="button" onclick="learningTacticalMenu()">Choose tactic</button></article>
      <article class="glass-card learning-card"><h3>Mastery Trials</h3><p>Complete three connected tactical decisions.</p><button class="control-button" type="button" onclick="learningTrialsMenu()">Choose trial</button></article>
      <article class="glass-card learning-card"><h3>Daily Challenge</h3><p>One stable, replayable puzzle for ${dailyKey()}.</p><button class="control-button" type="button" onclick="learningDaily()">Play today</button></article>
      <article class="glass-card learning-card"><h3>Last Match</h3><p>${replay ? "Inspect the actual completed move sequence." : "Finish a normal match to unlock factual review."}</p>${replay ? `<button class="control-button" type="button" onclick="learningAnalysis()">Match analysis</button>${replay.result === "loss" && replay.matchType === "standard" && replay.mode === "ai" ? '<button class="control-button" type="button" onclick="learningWhy()">Why did I lose?</button>' : ""}` : ""}</article>`;
  }
  function tacticalMenu() {
    endSession(); $("learningIntro").textContent = "Choose the tactical idea you want to train.";
    const progress = save.get().features.challenges?.solved || {};
    $("learningContent").innerHTML = Object.entries(CATEGORIES).map(([type, item]) => { const entry = progress[type]; return `<article class="glass-card learning-card"><h3>${item.title}</h3><p>${item.lesson}</p><small>${entry?.completed ? `Completed · ${entry.attempts} attempt${entry.attempts === 1 ? "" : "s"}` : "Ready to practice"}</small><button class="control-button" type="button" onclick="learningStartChallenge('${type}')">${entry?.completed ? "Play again" : "Start"}</button></article>`; }).join("") + `<button class="text-button" type="button" onclick="learningBack()">‹ Learning home</button>`;
  }
  function trialsMenu() {
    endSession(); $("learningIntro").textContent = "Each trial is a connected three-step tactical exercise.";
    const progress = save.get().features.challenges?.trials || {};
    $("learningContent").innerHTML = Object.entries(TRIALS).map(([id, item]) => { const entry = progress[id]; return `<article class="glass-card learning-card"><h3>${item.title}</h3><p>${item.steps.map((type) => CATEGORIES[type].title).join(" → ")}</p><small>${entry?.completed ? "Completed" : "3 connected decisions"}</small><button class="control-button" type="button" onclick="learningStartTrial('${id}')">${entry?.completed ? "Retry trial" : "Start trial"}</button></article>`; }).join("") + `<button class="text-button" type="button" onclick="learningBack()">‹ Learning home</button>`;
  }
  function startSession(kind, type, options = {}) {
    endSession();
    const token = generation;
    const seed = options.seed || `${kind}-${Date.now()}`;
    const position = validatedPosition(type, seed);
    if (!position) { $("learningContent").textContent = "This challenge could not be validated. Please choose another exercise."; return; }
    active = { kind, generation: token, type, position, step: options.step || 0, trial: options.trial || null, attempts: options.attempts || 0, totalAttempts: options.totalAttempts || 0, completed: false, locked: false, seed };
    renderBoard();
  }
  function startChallenge(type) { startSession("TACTICAL_CHALLENGE", type); }
  function startTrial(id) { const trial = TRIALS[id]; if (trial) startSession("MASTERY_TRIAL", trial.steps[0], { trial: id, step: 0 }); }
  function startDaily() {
    const date = dailyKey();
    const types = Object.keys(CATEGORIES); const type = types[[...`TIC_TAC_TOE_DAILY_V1:${date}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) % types.length];
    startSession("DAILY_CHALLENGE", type, { seed: `TIC_TAC_TOE_DAILY_V1:${date}` });
  }
  function renderBoard() {
    const session = current(); if (!session) return;
    const category = CATEGORIES[session.type];
    const heading = session.kind === "MASTERY_TRIAL" ? `${TRIALS[session.trial].title} · Step ${session.step + 1} of 3` : session.kind === "DAILY_CHALLENGE" ? `Daily Challenge · ${dailyKey()}` : category.title;
    $("learningIntro").textContent = `${heading} — ${category.lesson}`;
    $("learningContent").innerHTML = `<article class="glass-card learning-card learning-play"><p><strong>You are ${session.position.player}.</strong> Select the move that fulfills the objective.</p><div class="learning-board" role="grid" aria-label="${escape(category.title)} tactical board">${session.position.board.map((mark, index) => `<button class="learning-cell" type="button" data-learning-cell="${index}" ${mark ? "disabled" : ""} aria-label="Cell ${index + 1}: ${mark || "empty"}">${mark || ""}</button>`).join("")}</div><p class="learning-feedback" id="learningFeedback">Attempt ${session.attempts + 1}. ${category.lesson}</p><div class="learning-actions"><button class="control-button" type="button" onclick="learningHint()">Hint</button><button class="control-button" type="button" onclick="learningExit()">Exit</button></div></article>`;
    document.querySelectorAll("[data-learning-cell]").forEach((button) => button.addEventListener("click", () => answer(Number(button.dataset.learningCell), session.generation), { once: true }));
  }
  function answer(move, token) {
    const session = current(); if (!session || session.generation !== token || session.locked || session.completed) return;
    session.locked = true; session.attempts += 1; session.totalAttempts += 1;
    const correct = solutions(session.position).includes(move);
    session.position.board[move] = session.position.player;
    const selectedCell = document.querySelector(`[data-learning-cell="${move}"]`);
    if (selectedCell) { selectedCell.textContent = session.position.player; selectedCell.disabled = true; }
    document.querySelectorAll("[data-learning-cell]").forEach((cell) => { cell.disabled = true; });
    const feedback = $("learningFeedback");
    if (!correct) {
      feedback.textContent = session.type === "BLOCK" ? "Not quite — the immediate threat is still available." : `Not quite — that move does not ${CATEGORIES[session.type].lesson.toLowerCase()}`;
      emit("incorrect_answer");
      feedback.insertAdjacentHTML("afterend", `<div class="learning-actions"><button class="primary-control" type="button" onclick="learningRetry()">Retry</button><button class="control-button" type="button" onclick="learningExit()">Back</button></div>`);
      return;
    }
    session.completed = true;
    feedback.textContent = session.type === "FORK" || session.type === "WIN_IN_2" ? "Correct — that move creates two genuine winning threats." : `Correct — ${CATEGORIES[session.type].lesson.toLowerCase()}`;
    emit("level_unlock");
    if (session.kind === "MASTERY_TRIAL" && session.step < 2) {
      feedback.insertAdjacentHTML("afterend", `<div class="learning-actions"><button class="primary-control" type="button" onclick="learningNextTrialStep()">Next decision</button><button class="control-button" type="button" onclick="learningExit()">Exit</button></div>`);
    } else {
      persistCompletion(session);
      feedback.insertAdjacentHTML("afterend", `<div class="learning-actions"><button class="primary-control" type="button" onclick="learningNextChallenge()">Next challenge</button><button class="control-button" type="button" onclick="learningRetry()">Retry</button><button class="control-button" type="button" onclick="learningExit()">Back</button></div>`);
    }
  }
  function persistCompletion(session) {
    if (session.saved) return; session.saved = true;
    updateFeature((features) => {
      features.challenges ??= { solved: {}, trials: {} };
      if (session.kind === "MASTERY_TRIAL") features.challenges.trials[session.trial] = { completed: true, steps: 3, attempts: session.totalAttempts };
      else if (session.kind === "DAILY_CHALLENGE") { features.daily ??= { history: {} }; features.daily.history[dailyKey()] = { id: `TIC_TAC_TOE_DAILY_V1:${dailyKey()}`, seed: session.seed, positionId: session.position.id, type: session.type, completed: true, result: "completed", attempts: session.totalAttempts }; const keys = Object.keys(features.daily.history).sort().slice(-14); features.daily.history = Object.fromEntries(keys.map((key) => [key, features.daily.history[key]])); }
      else features.challenges.solved[session.type] = { completed: true, attempts: session.totalAttempts };
    });
  }
  function nextTrialStep() { const session = current(); if (!session || !session.completed || session.kind !== "MASTERY_TRIAL") return; const trial = TRIALS[session.trial]; startSession("MASTERY_TRIAL", trial.steps[session.step + 1], { trial: session.trial, step: session.step + 1, totalAttempts: session.totalAttempts }); }
  function nextChallenge() { const session = current(); if (!session) return; if (session.kind === "MASTERY_TRIAL") { persistCompletion(session); trialsMenu(); } else if (session.kind === "DAILY_CHALLENGE") startDaily(); else startChallenge(session.type); }
  function retry() { const session = current(); if (!session) return; const options = { seed: session.seed, trial: session.trial, step: session.step, attempts: session.attempts, totalAttempts: session.totalAttempts }; startSession(session.kind, session.type, options); }
  function hint() { const session = current(); if (!session) return; const move = solutions(session.position)[0]; const feedback = $("learningFeedback"); if (feedback) feedback.textContent = `Hint: examine cell ${move + 1}; verify the resulting threats before playing it.`; }
  function exit() { endSession(); renderHub(); }

  function replay() { return save.get().features.replays[0] || null; }
  function moveMark(record, index) { return index % 2 === 0 ? "X" : "O"; }
  function analyzeReplay(record) {
    const items = []; let board = emptyBoard();
    record.moves.forEach((move, index) => {
      const mark = moveMark(record, index), opponent = other(mark), before = analysis(board, mark);
      let finding = "No provable tactical event.";
      if (before.immediateWins.length && !before.immediateWins.includes(move)) finding = `Missed an immediate win at cell ${before.immediateWins[0] + 1}.`;
      else if (before.opponentImmediateWins.length && !before.opponentImmediateWins.includes(move)) finding = `Did not block the immediate threat at cell ${before.opponentImmediateWins[0] + 1}.`;
      else if (before.forks.includes(move)) finding = "Created a fork.";
      else if (before.counterForks.length && !afterPreventsFork(board, mark, move, opponent)) finding = "Allowed an opponent fork opportunity.";
      board[move] = mark;
      items.push({ index, move, mark, finding, board: [...board] });
    });
    return items;
  }
  function afterPreventsFork(board, mark, move, opponent) { const after = [...board]; after[move] = mark; return analysis(after, opponent).forks.length === 0; }
  function renderReview(record, focus = 0, title = "Match Analysis", explanation = "Select a move to reconstruct the recorded board.") {
    const timeline = analyzeReplay(record); const item = timeline[Math.min(Math.max(focus, 0), Math.max(timeline.length - 1, 0))];
    screens("learning"); $("learningIntro").textContent = `${record.result.toUpperCase()} · You: ${record.playerSymbol} · Opponent: ${record.mode === "ai" ? `${record.aiSymbol} (${record.personality}, Level ${record.level})` : other(record.playerSymbol)} · ${record.moves.length} moves`;
    if (!item) { $("learningContent").textContent = "This completed match has no moves to review."; return; }
    $("learningContent").innerHTML = `<article class="glass-card learning-card"><h3>${title}</h3><p>${escape(explanation)}</p><div class="learning-board read-only" aria-label="Recorded board after move ${item.index + 1}">${item.board.map((mark) => `<span class="learning-cell" aria-hidden="true">${mark}</span>`).join("")}</div><p class="learning-feedback">Move ${item.index + 1}: ${item.mark} → cell ${item.move + 1}. ${escape(item.finding)}</p><div class="learning-timeline">${timeline.map((entry) => `<button class="control-button" type="button" onclick="learningReviewMove(${entry.index}, '${title === "Why did I lose?" ? "why" : "analysis"}')">${entry.index + 1}. ${entry.mark} → ${entry.move + 1} · ${escape(entry.finding)}</button>`).join("")}</div><div class="learning-actions"><button class="control-button" type="button" onclick="learningBack()">Back</button></div></article>`;
    active = { kind: title === "Why did I lose?" ? "WHY_DID_I_LOSE" : "MATCH_ANALYSIS", generation, record, focus: item.index, title, explanation };
  }
  function openAnalysis() { const record = replay(); if (record) { endSession(); renderReview(record); } }
  function openWhy() {
    const record = replay(); if (!record || record.result !== "loss" || record.matchType !== "standard" || record.mode !== "ai") return;
    endSession(); const first = analyzeReplay(record).find((item) => item.mark === record.playerSymbol && /Missed|Did not block|Allowed/.test(item.finding));
    const explanation = first ? `Earliest provable turning point: after move ${first.index + 1}, ${first.finding}` : "No single tactical turning point can be proven from this recorded match.";
    renderReview(record, first?.index || 0, "Why did I lose?", explanation);
  }
  function reviewMove(index, mode) { const session = current(); if (!session?.record) return; renderReview(session.record, index, mode === "why" ? "Why did I lose?" : "Match Analysis", session.explanation); }

  global.openLearningHub = openHub;
  global.closeLearningHub = closeHub;
  global.learningTacticalMenu = tacticalMenu;
  global.learningTrialsMenu = trialsMenu;
  global.learningStartChallenge = startChallenge;
  global.learningStartTrial = startTrial;
  global.learningDaily = startDaily;
  global.learningHint = hint;
  global.learningRetry = retry;
  global.learningNextTrialStep = nextTrialStep;
  global.learningNextChallenge = nextChallenge;
  global.learningExit = exit;
  global.learningBack = () => { endSession(); renderHub(); };
  global.learningAnalysis = openAnalysis;
  global.learningWhy = openWhy;
  global.learningReviewMove = reviewMove;
}(window));
