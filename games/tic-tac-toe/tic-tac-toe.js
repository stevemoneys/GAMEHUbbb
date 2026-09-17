const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const timerTextEl = document.getElementById("timerText");
const hubBackBtn = document.querySelector(".hub-back-btn");
const saveManager = window.TicTacToeSave;
const featureCore = window.TicTacToeFeatureCore;
let playerSave = saveManager.load();

const bgMusic = document.getElementById("bgMusic");

let unlockedLevel = playerSave.progression.levels.highestUnlocked;
let scoreX = playerSave.scores.x;
let scoreO = playerSave.scores.o;
let pendingLevelSelection = false;
const turnTime = 10;
const maxLevel = 20;
const GAME_PHASES = Object.freeze({ HOME: "HOME", LEVEL_SELECT: "LEVEL_SELECT", SYMBOL_SELECT: "SYMBOL_SELECT", PLAYING: "PLAYING", AI_THINKING: "AI_THINKING", RESULT: "RESULT" });
const gameState = {
  phase: GAME_PHASES.HOME,
  mode: "",
  board: Array(9).fill(""),
  currentPlayer: "X",
  playerSymbol: "X",
  aiSymbol: "O",
  selectedLevel: 1,
  level: 1,
  aiPersonality: "human",
  active: false,
  inputLocked: false,
  ai: { thinking: false, timeout: undefined },
  timer: { handle: undefined, active: false, remaining: turnTime },
  result: { timeout: undefined, recorded: false, data: null },
  match: { generation: 0, context: null, objectives: null, config: featureCore.createDefaultMatchConfig(), moves: [] }
};

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Personality describes preferred *kinds* of moves. Strength controls how
// consistently the AI recognizes and executes those moves. Keeping these
// concerns separate prevents a high-level opponent from becoming generic.
const AI_PERSONALITIES = {
  human: { pressure: 18, defense: 18, forks: 18, bait: 8, center: 14, corners: 12, variety: 26 },
  aggressive: { pressure: 54, defense: 10, forks: 50, bait: 14, center: 22, corners: 18, variety: 10 },
  defensive: { pressure: 12, defense: 58, forks: 20, bait: 4, center: 18, corners: 12, variety: 8 },
  trickster: { pressure: 28, defense: 16, forks: 42, bait: 56, center: 10, corners: 24, variety: 18 }
};

const AI_STRENGTH_BANDS = [
  { name: "Foundations", first: 1, last: 4, win: [0.65, 0.8], block: [0.4, 0.65], fork: [0.04, 0.18], forkDefense: [0.02, 0.12], choiceWindow: 4, optimal: false },
  { name: "Awareness", first: 5, last: 8, win: [0.84, 0.96], block: [0.74, 0.91], fork: [0.28, 0.58], forkDefense: [0.2, 0.48], choiceWindow: 3, optimal: false },
  { name: "Pressure", first: 9, last: 12, win: [0.98, 1], block: [0.94, 0.99], fork: [0.68, 0.88], forkDefense: [0.6, 0.82], choiceWindow: 2, optimal: false },
  { name: "Tactical Mastery", first: 13, last: 16, win: [1, 1], block: [1, 1], fork: [0.92, 0.99], forkDefense: [0.9, 0.98], choiceWindow: 2, optimal: false },
  { name: "Proof", first: 17, last: 20, win: [1, 1], block: [1, 1], fork: [1, 1], forkDefense: [1, 1], choiceWindow: 1, optimal: true }
];

// Phase 4's single source of truth: levels define the tactical curriculum;
// personality defines style and strength defines the AI's capability.
const LEVELS = [
  ["First Steps", "Foundations", "human", "Learn the board, turns, and three-in-a-row.", "Complete a match.", "Win the match.", "First level completion", "Very Easy", false, "completeMatch"],
  ["See the Threat", "Foundations", "human", "Recognize immediate winning threats.", "Check whether either side can win next.", "Win without allowing an obvious immediate threat.", "Level progression recognition", "Easy", false, null],
  ["The Block", "Foundations", "defensive", "Answer immediate threats with defense.", "Prevent an immediate opponent win.", "Win while answering every immediate threat.", "Progression recognition", "Easy", true, "blockThreat"],
  ["Center Control", "Foundations", "aggressive", "Use central control to create future options.", "Learn why the center creates possibilities.", "Win after establishing strong central control.", "Progression recognition", "Easy â€“ Moderate", false, null],
  ["Own the Corners", "Awareness", "human", "Use corners as tactical resources.", "Understand corners and center play.", "Win using a corner-based setup.", "Unlock the Awareness challenge band", "Moderate", false, null],
  ["Create the Fork", "Awareness", "aggressive", "Create multiple simultaneous threats.", "Create a legitimate fork when possible.", "Win using a fork.", "Fork mastery milestone", "Moderate", true, "createFork"],
  ["Break the Fork", "Awareness", "defensive", "Prevent dangerous fork opportunities.", "Prevent the opponent from creating a decisive fork.", "Win without allowing a successful opponent fork.", "Progression recognition", "Moderate", true, "preventFork"],
  ["Read Ahead", "Awareness", "trickster", "Judge moves by their consequences.", "Avoid an obvious tactical trap.", "Win while avoiding the strongest bait opportunity.", "Awareness milestone", "Moderate â€“ Challenging", true, null],
  ["Make Them Answer", "Pressure", "aggressive", "Create forcing threats.", "Create a situation the opponent must answer.", "Win through forcing moves.", "Pressure milestone", "Challenging", false, null],
  ["Two Threats", "Pressure", "defensive", "Use multi-threat positions deliberately.", "Create or exploit a double-threat position.", "Win by creating a genuine double threat.", "Midpoint mastery recognition", "Challenging", true, "createFork"],
  ["Don't Chase Bait", "Pressure", "trickster", "Choose tactically sound moves over tempting ones.", "Avoid the opponent's strongest legitimate bait.", "Win without falling for bait.", "Tactical awareness recognition", "Challenging", true, null],
  ["Hold the Line", "Pressure", "defensive", "Preserve strong defensive outcomes.", "Recognize when a draw is the correct result.", "Force or preserve a draw from a difficult position.", "Defensive mastery recognition", "Challenging", true, "draw"],
  ["Change the Plan", "Tactical Mastery", "human", "Adapt when the first plan no longer works.", "Change tactical approach as the board develops.", "Win after changing strategy.", "Adaptation milestone", "Hard", false, null],
  ["Pressure vs Defense", "Tactical Mastery", "aggressive", "Balance attack with defensive responsibility.", "Create threats without abandoning defense.", "Win after surviving a serious counter-threat.", "Tactical balance recognition", "Hard", true, null],
  ["No Easy Forks", "Tactical Mastery", "defensive", "Find advantage when obvious forks are denied.", "Find an alternative route to advantage.", "Win without relying on a direct fork.", "Advanced tactical milestone", "Hard", true, null],
  ["Read the Trickster", "Tactical Mastery", "trickster", "Read the opponent's purpose before committing.", "Identify the actual tactical purpose of a move.", "Win without falling into a major trap.", "Trickster mastery recognition", "Very Hard", true, null],
  ["Perfect Defense", "Proof", "defensive", "Find the best available result against optimal defense.", "Preserve the best possible result.", "Win if a winning line exists; otherwise draw.", "Expert challenge recognition", "Expert", true, "bestResult"],
  ["Aggressive Proof", "Proof", "aggressive", "Survive pressure and exploit legitimate openings.", "Neutralize pressure while seeking advantage.", "Win if a winning line exists.", "Expert pressure milestone", "Expert", true, "bestResult"],
  ["Human-like Mastery", "Proof", "human", "Apply complete tactical understanding against flexible play.", "Use the complete tactical skill set.", "Win with strong tactical consistency.", "Mastery-path recognition", "Expert â€“ Master", true, "bestResult"],
  ["The Final Test", "Proof", "trickster", "Read intent, create threats, prevent threats, and adapt.", "Achieve the best possible result.", "Win if possible; otherwise preserve optimal defense.", "Master Tactician recognition", "Master", true, "bestResult"]
].map(([name, band, personality, strategicLesson, objective, bonusObjective, reward, difficulty, replayableForMastery, tracking]) => ({
  number: 0,
  name,
  band,
  personality,
  strength: 0,
  strategicLesson,
  objective,
  bonusObjective,
  unlockRequirement: "Complete the previous level",
  reward,
  difficulty,
  replayableForMastery,
  tracking
})).map((levelDefinition, index) => ({
  ...levelDefinition,
  number: index + 1,
  strength: index + 1,
  unlockRequirement: index === 0 ? "Available from the beginning" : `Complete Level ${index}`
}));

const CORE_TACTICAL_LEVELS = [3, 6, 7, 8, 10, 11, 12];
const META_PERSONALITIES = ["human", "aggressive", "defensive", "trickster"];

const ACHIEVEMENTS = [
  { id: "first-victory", name: "First Victory", description: "Win your first AI Challenge.", category: "Foundations", active: true, meets: (meta) => meta.statistics.aiWins >= 1 },
  { id: "getting-started", name: "Getting Started", description: "Complete the first 5 AI levels.", category: "Foundations", active: true, meets: (meta) => meta.levels.completed.length >= 5 },
  { id: "halfway-there", name: "Halfway There", description: "Complete 10 AI levels.", category: "Foundations", active: true, meets: (meta) => meta.levels.completed.length >= 10 },
  { id: "the-long-game", name: "The Long Game", description: "Complete all 20 AI levels.", category: "Foundations", active: true, meets: (meta) => meta.levels.completed.length === maxLevel },
  { id: "watch-the-threat", name: "Watch the Threat", description: "Block an immediate winning threat.", category: "Tactical Skill", active: true, meets: (_, result) => Boolean(result?.objectives?.blockedThreat) },
  { id: "double-trouble", name: "Double Trouble", description: "Create a genuine fork.", category: "Tactical Skill", active: true, meets: (_, result) => Boolean(result?.objectives?.createdFork) },
  { id: "fork-breaker", name: "Fork Breaker", description: "Prevent an AI fork opportunity.", category: "Tactical Skill", active: true, meets: (_, result) => Boolean(result?.objectives?.preventedFork) },
  { id: "think-ahead", name: "Think Ahead", description: "Complete the Read Ahead challenge.", category: "Tactical Skill", active: true, meets: (meta) => meta.levels.completed.includes(8) },
  { id: "pressure-player", name: "Pressure Player", description: "Win using a meaningful forcing sequence.", category: "Tactical Skill", active: false, meets: () => false, unsupportedReason: "The current engine does not reliably identify a complete forcing sequence." },
  { id: "calm-under-pressure", name: "Calm Under Pressure", description: "Defeat an advanced Aggressive AI.", category: "Tactical Skill", active: true, meets: (_, result) => result?.outcome === "win" && result.personality === "aggressive" && result.level >= 14 },
  { id: "wall-builder", name: "Wall Builder", description: "Defeat a meaningful Defensive AI challenge.", category: "Defense", active: true, meets: (_, result) => result?.outcome === "win" && result.personality === "defensive" && result.level >= 10 },
  { id: "no-easy-opening", name: "No Easy Opening", description: "Defeat an opponent without relying on an obvious tactical mistake.", category: "Defense", active: false, meets: () => false, unsupportedReason: "The current engine cannot reliably attribute an opponent loss to a single obvious mistake." },
  { id: "draw-master", name: "Draw Master", description: "Draw against an expert-level AI.", category: "Defense", active: true, meets: (_, result) => result?.outcome === "draw" && result.mode === "ai" && result.level >= 17 },
  { id: "read-the-human", name: "Read the Human", description: "Defeat an advanced Human-like AI.", category: "Personality Mastery", active: true, meets: (_, result) => result?.outcome === "win" && result.personality === "human" && result.level >= 13 },
  { id: "break-the-attack", name: "Break the Attack", description: "Defeat an advanced Aggressive AI.", category: "Personality Mastery", active: true, meets: (_, result) => result?.outcome === "win" && result.personality === "aggressive" && result.level >= 14 },
  { id: "hold-the-line", name: "Hold the Line", description: "Defeat an advanced Defensive AI.", category: "Personality Mastery", active: true, meets: (_, result) => result?.outcome === "win" && result.personality === "defensive" && result.level >= 15 },
  { id: "see-through-the-trick", name: "See Through the Trick", description: "Defeat an advanced Trickster AI.", category: "Personality Mastery", active: true, meets: (_, result) => result?.outcome === "win" && result.personality === "trickster" && result.level >= 16 },
  { id: "winning-habit", name: "Winning Habit", description: "Reach a 3-match win streak.", category: "Consistency", active: true, meets: (meta) => meta.streaks.best >= 3 },
  { id: "unshaken", name: "Unshaken", description: "Reach a 5-match win streak.", category: "Consistency", active: true, meets: (meta) => meta.streaks.best >= 5 },
  { id: "complete-player", name: "Complete Player", description: "Defeat all four AI personalities.", category: "Consistency", active: true, meets: (meta) => META_PERSONALITIES.every((personality) => meta.personalityMastery[personality].defeated) },
  { id: "tactical-student", name: "Tactical Student", description: "Complete the core tactical-learning challenges.", category: "Consistency", active: true, meets: (meta) => CORE_TACTICAL_LEVELS.every((levelNumber) => meta.levels.completed.includes(levelNumber)) },
  { id: "master-tactician", name: "Master Tactician", description: "Complete Level 20.", category: "Consistency", active: true, meets: (meta) => meta.levels.completed.includes(20) }
];

function asNonNegativeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function createMetaProgressView(save = playerSave) {
  return {
    profile: save.profile,
    statistics: save.statistics,
    streaks: save.progression.streaks,
    levels: save.progression.levels,
    personalityMastery: save.progression.personalityMastery,
    achievements: save.achievements,
    milestones: save.progression.milestones
  };
}

function savePlayerData() {
  playerSave.progression.levels.highestUnlocked = Math.max(playerSave.progression.levels.highestUnlocked, unlockedLevel);
  playerSave.progression.currentLevel = gameState.selectedLevel;
  playerSave.scores.x = scoreX;
  playerSave.scores.o = scoreO;
  saveManager.save();
}

function saveMetaProgress() {
  savePlayerData();
}

function calculateMastery(meta = metaProgress) {
  // Mastery is completion-based: level clears, personality breadth, and
  // meaningful active milestones each count once. Match volume never inflates it.
  const levelGoals = meta.levels.completed.length;
  const personalityGoals = META_PERSONALITIES.filter((personality) => meta.personalityMastery[personality].defeated).length;
  const activeAchievements = ACHIEVEMENTS.filter((achievement) => achievement.active);
  const achievementGoals = activeAchievements.filter((achievement) => meta.achievements[achievement.id]).length;
  const totalGoals = maxLevel + META_PERSONALITIES.length + activeAchievements.length;
  return Math.round(((levelGoals + personalityGoals + achievementGoals) / totalGoals) * 100);
}

function evaluateAchievements(result) {
  ACHIEVEMENTS.forEach((achievement) => {
    if (!achievement.active || metaProgress.achievements[achievement.id]) return;
    if (achievement.meets(metaProgress, result)) metaProgress.achievements[achievement.id] = Date.now();
  });
}

function getProfileSummary() {
  return {
    wins: metaProgress.statistics.wins,
    losses: metaProgress.statistics.losses,
    draws: metaProgress.statistics.draws,
    currentStreak: metaProgress.streaks.current,
    bestStreak: metaProgress.streaks.best,
    levelsCompleted: metaProgress.levels.completed.length,
    personalitiesDefeated: META_PERSONALITIES.filter((personality) => metaProgress.personalityMastery[personality].defeated).length,
    mastery: calculateMastery(),
    achievementsCompleted: Object.keys(metaProgress.achievements).length
  };
}

let metaProgress = createMetaProgressView();
unlockedLevel = metaProgress.levels.highestUnlocked;
evaluateAchievements();
saveMetaProgress();
let gameFeelTimeout;

function emitGameFeelEvent(type, detail = {}) {
  window.dispatchEvent(new CustomEvent("tictactoe:feel", { detail: { type, ...detail } }));
}

function haptic(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function restartAnimation(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function showGameToast(title, detail = "", tone = "progress") {
  const toast = document.getElementById("gameToast");
  if (!toast) return;
  clearTimeout(gameFeelTimeout);
  toast.className = `game-toast ${tone}`;
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastDetail").textContent = detail;
  requestAnimationFrame(() => toast.classList.add("active"));
  gameFeelTimeout = setTimeout(() => toast.classList.remove("active"), 2200);
}

function setThinkingState(isThinking) {
  gameState.ai.thinking = Boolean(isThinking);
  document.getElementById("thinkingCard")?.classList.toggle("is-thinking", isThinking);
  document.getElementById("turnPill")?.classList.toggle("is-thinking", isThinking);
}

let audioSettings = playerSave.settings.audio;
let audioContext;
let sfxGain;
let audioReady = false;
let musicFadeFrame;
let pageWasMusicPlaying = false;
let activeAudioPriority = 0;
let activeAudioUntil = 0;
const audioCooldowns = new Map();

function musicTargetVolume() {
  return audioSettings.musicEnabled ? audioSettings.master * audioSettings.music : 0;
}

function fadeMusic(target, duration = 220) {
  if (!bgMusic) return;
  cancelAnimationFrame(musicFadeFrame);
  const start = bgMusic.volume;
  const startedAt = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    bgMusic.volume = start + (target - start) * progress;
    if (progress < 1) musicFadeFrame = requestAnimationFrame(tick);
    else if (target === 0 && !audioSettings.musicEnabled) bgMusic.pause();
  };
  musicFadeFrame = requestAnimationFrame(tick);
}

function ensureAudio() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return false;
    try {
      audioContext = new AudioCtor();
      sfxGain = audioContext.createGain();
      sfxGain.gain.value = audioSettings.master * audioSettings.sfx;
      sfxGain.connect(audioContext.destination);
    } catch { return false; }
  }
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  audioReady = true;
  if (audioSettings.musicEnabled && bgMusic?.paused && !document.hidden) {
    bgMusic.volume = 0;
    bgMusic.play().then(() => fadeMusic(musicTargetVolume(), 420)).catch(() => {});
  }
  return true;
}

function setAudioSettings(patch) {
  audioSettings = { ...audioSettings, ...patch };
  playerSave.settings.audio = audioSettings;
  savePlayerData();
  if (sfxGain && audioContext) sfxGain.gain.setTargetAtTime(audioSettings.master * audioSettings.sfx, audioContext.currentTime, 0.025);
  if (audioSettings.musicEnabled) {
    ensureAudio();
    fadeMusic(musicTargetVolume());
  } else {
    fadeMusic(0);
  }
  syncAudioSettingsUI();
}

function playTone({ frequency, endFrequency = frequency, duration = 0.09, type = "sine", gain = 0.15, delay = 0, priority = 3, cooldown = "tone" }) {
  if (!audioSettings.sfxEnabled || !ensureAudio() || document.hidden) return;
  const now = audioContext.currentTime;
  const realNow = performance.now();
  if (audioCooldowns.get(cooldown) > realNow || (priority < activeAudioPriority && realNow < activeAudioUntil)) return;
  audioCooldowns.set(cooldown, realNow + 38);
  if (priority >= activeAudioPriority) {
    activeAudioPriority = priority;
    activeAudioUntil = realNow + (duration + delay) * 1000;
  }
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now + delay);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + delay + duration);
  envelope.gain.setValueAtTime(0.0001, now + delay);
  // The shared SFX gain owns master/SFX volume; individual envelopes only
  // describe each effect's relative loudness so settings are not applied twice.
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + delay + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
  oscillator.connect(envelope).connect(sfxGain);
  oscillator.start(now + delay);
  oscillator.stop(now + delay + duration + 0.03);
}

function playAudioEffect(type, detail = {}) {
  const personalityPitch = { human: 0, aggressive: 32, defensive: -18, trickster: 18 }[gameState.aiPersonality] || 0;
  const pieceOffset = detail.symbol === "X" ? 32 : -10;
  const effects = {
    button_press: () => playTone({ frequency: 310, endFrequency: 365, duration: 0.055, type: "triangle", gain: 0.07, priority: 1, cooldown: "button" }),
    level_select: () => { playTone({ frequency: 420, endFrequency: 590, duration: 0.09, type: "sine", gain: 0.09, priority: 2, cooldown: "level" }); },
    locked: () => playTone({ frequency: 205, endFrequency: 170, duration: 0.09, type: "triangle", gain: 0.075, priority: 2, cooldown: "locked" }),
    invalid_move: () => playTone({ frequency: 250, endFrequency: 205, duration: 0.07, type: "triangle", gain: 0.065, priority: 2, cooldown: "invalid" }),
    piece_place: () => playTone({ frequency: 480 + pieceOffset + personalityPitch, endFrequency: 405 + pieceOffset + personalityPitch, duration: 0.075, type: detail.symbol === "X" ? "triangle" : "sine", gain: detail.actor === "ai" ? 0.09 : 0.11, priority: 3, cooldown: "piece" }),
    player_turn: () => playTone({ frequency: 520, endFrequency: 590, duration: 0.055, type: "sine", gain: 0.045, priority: 2, cooldown: "turn" }),
    ai_turn: () => playTone({ frequency: 350 + personalityPitch, endFrequency: 320 + personalityPitch, duration: 0.055, type: "triangle", gain: 0.04, priority: 2, cooldown: "turn" }),
    timer_warning: () => playTone({ frequency: 500 + (detail.seconds * 42), endFrequency: 520 + (detail.seconds * 42), duration: 0.045, type: "sine", gain: 0.05, priority: 3, cooldown: `timer-${detail.seconds}` }),
    win_line: () => { playTone({ frequency: 520, endFrequency: 760, duration: 0.2, type: "sine", gain: 0.12, priority: 5, cooldown: "win" }); },
    victory: () => { playTone({ frequency: 520, endFrequency: 660, duration: 0.16, type: "sine", gain: 0.1, priority: 6, cooldown: "result" }); playTone({ frequency: 660, endFrequency: 880, duration: 0.22, type: "triangle", gain: 0.09, delay: 0.14, priority: 6, cooldown: "result-2" }); },
    defeat: () => { playTone({ frequency: 390, endFrequency: 280, duration: 0.24, type: "sine", gain: 0.085, priority: 6, cooldown: "result" }); },
    draw: () => { playTone({ frequency: 420, endFrequency: 420, duration: 0.15, type: "sine", gain: 0.075, priority: 6, cooldown: "result" }); playTone({ frequency: 525, endFrequency: 525, duration: 0.15, type: "sine", gain: 0.06, delay: 0.09, priority: 6, cooldown: "result-2" }); },
    level_unlock: () => { playTone({ frequency: 480, endFrequency: 720, duration: 0.16, type: "triangle", gain: 0.095, priority: 5, cooldown: "unlock" }); playTone({ frequency: 720, endFrequency: 920, duration: 0.18, type: "sine", gain: 0.07, delay: 0.14, priority: 5, cooldown: "unlock-2" }); },
    achievement_unlock: () => { playTone({ frequency: 600, endFrequency: 810, duration: 0.13, type: "sine", gain: 0.095, priority: 5, cooldown: "achievement" }); playTone({ frequency: 810, endFrequency: 960, duration: 0.15, type: "triangle", gain: 0.075, delay: 0.12, priority: 5, cooldown: "achievement-2" }); }
  };
  effects[type]?.();
}

function duckMusic() {
  if (!bgMusic || !audioSettings.musicEnabled) return;
  fadeMusic(musicTargetVolume() * 0.68, 120);
  setTimeout(() => fadeMusic(musicTargetVolume(), 340), 620);
}

function syncAudioSettingsUI() {
  const values = [["masterVolume", audioSettings.master], ["musicVolume", audioSettings.music], ["sfxVolume", audioSettings.sfx]];
  values.forEach(([id, value]) => { const control = document.getElementById(id); if (control) control.value = String(Math.round(value * 100)); });
  const musicToggle = document.getElementById("musicToggle");
  const sfxToggle = document.getElementById("sfxToggle");
  if (musicToggle) musicToggle.textContent = audioSettings.musicEnabled ? "Music On" : "Music Off";
  if (sfxToggle) sfxToggle.textContent = audioSettings.sfxEnabled ? "SFX On" : "SFX Off";
}

function beginMatchContext() {
  gameState.result.recorded = false;
  gameState.match.context = {
    mode: gameState.mode,
    level: gameState.mode === "ai" ? gameState.selectedLevel : null,
    personality: gameState.mode === "ai" ? gameState.aiPersonality : null,
    playerSymbol: gameState.playerSymbol,
    matchType: gameState.match.config.type,
    permissions: gameState.match.config.permissions
  };
}

function finalizeMatch(outcome) {
  if (gameState.result.recorded) return;
  gameState.result.recorded = true;
  const permissions = gameState.match.config.permissions;
  const previousAchievementIds = new Set(Object.keys(metaProgress.achievements));
  const previouslyUnlocked = metaProgress.levels.highestUnlocked;

  const context = gameState.match.context || {
    mode: gameState.mode,
    level: gameState.mode === "ai" ? gameState.selectedLevel : null,
    personality: gameState.mode === "ai" ? gameState.aiPersonality : null,
    playerSymbol: gameState.playerSymbol
  };
  const result = { ...context, outcome, objectives: { ...gameState.match.objectives } };
  if (!permissions.statistics) {
    if (permissions.replay) featureCore.recordReplay({ config: gameState.match.config, moves: gameState.match.moves, result: outcome });
    return;
  }
  const stats = metaProgress.statistics;
  stats.matches += 1;
  if (outcome === "win") {
    stats.wins += 1;
    metaProgress.streaks.current += 1;
    metaProgress.streaks.best = Math.max(metaProgress.streaks.best, metaProgress.streaks.current);
  } else if (outcome === "draw") {
    stats.draws += 1;
    metaProgress.streaks.current = 0;
  } else {
    stats.losses += 1;
    metaProgress.streaks.current = 0;
  }

  if (context.mode === "two") {
    stats.twoPlayerMatches += 1;
  } else if (context.mode === "ai") {
    stats.aiMatches += 1;
    if (outcome === "win") stats.aiWins += 1;
    if (outcome === "loss") stats.aiLosses += 1;
    if (outcome === "draw") stats.aiDraws += 1;

    const personality = META_PERSONALITIES.includes(context.personality) ? context.personality : "human";
    const mastery = metaProgress.personalityMastery[personality];
    if (outcome === "win") {
      mastery.victories += 1;
      stats.totalPersonalityVictories += 1;
      mastery.defeated = true;
      mastery.highestLevelDefeated = Math.max(mastery.highestLevelDefeated, context.level);
      stats.winsByLevel[context.level] = asNonNegativeNumber(stats.winsByLevel[context.level]) + 1;
      if (permissions.progression && !metaProgress.levels.completed.includes(context.level)) {
        metaProgress.levels.completed.push(context.level);
        metaProgress.levels.completed.sort((a, b) => a - b);
        stats.completionsByLevel[context.level] = 1;
      }
      if (permissions.progression) metaProgress.levels.highestCompleted = Math.max(metaProgress.levels.highestCompleted, context.level);
    }
    if (permissions.progression) metaProgress.levels.highestUnlocked = Math.max(metaProgress.levels.highestUnlocked, unlockedLevel);
  }

  if (permissions.achievements) evaluateAchievements(result);
  saveMetaProgress();
  if (permissions.replay) featureCore.recordReplay({ config: gameState.match.config, moves: gameState.match.moves, result: outcome });
  updateHomeDashboard();
  const unlockedAchievement = ACHIEVEMENTS.find((achievement) => !previousAchievementIds.has(achievement.id) && metaProgress.achievements[achievement.id]);
  if (unlockedAchievement && permissions.achievements) {
    showGameToast("Achievement unlocked", unlockedAchievement.name, "achievement");
    emitGameFeelEvent("achievement_unlock", { id: unlockedAchievement.id });
    haptic(16);
  } else if (permissions.progression && context.mode === "ai" && outcome === "win" && metaProgress.levels.highestUnlocked > previouslyUnlocked) {
    const next = getLevelDefinition(metaProgress.levels.highestUnlocked);
    showGameToast(`Level ${next.number} unlocked`, next.name, "unlock");
    emitGameFeelEvent("level_unlock", { level: next.number });
    haptic([12, 45, 18]);
  } else {
    emitGameFeelEvent("progression_update", { outcome });
  }
}

gameState.match.objectives = createMatchObjectives();

function createMatchObjectives() {
  return { completed: false, won: false, draw: false, blockedThreat: false, createdFork: false, preventedFork: false };
}

function getLevelDefinition(levelNumber = gameState.selectedLevel) {
  return LEVELS[Math.max(1, Math.min(maxLevel, Number(levelNumber) || 1)) - 1];
}

function snapshotMatchConfig(overrides = {}) {
  const normalized = featureCore.normalizeMatchConfig({
    ...gameState.match.config,
    mode: gameState.mode || "ai",
    level: gameState.selectedLevel,
    personality: gameState.aiPersonality,
    playerSymbol: gameState.playerSymbol,
    aiSymbol: gameState.aiSymbol,
    ...overrides
  });
  if (!normalized.valid) return false;
  gameState.match.config = normalized.value;
  return true;
}

function prepareMatchConfiguration(config) {
  if (gameState.active || gameState.phase === GAME_PHASES.AI_THINKING) return { valid: false, reason: "A match is already active." };
  const normalized = featureCore.normalizeMatchConfig(config);
  if (!normalized.valid) return normalized;
  const next = normalized.value;
  gameState.mode = next.mode;
  gameState.playerSymbol = next.playerSymbol;
  gameState.aiSymbol = next.aiSymbol;
  applyLevelDefinition(next.level);
  // Curriculum data remains authoritative for standard level matches. Future
  // non-standard experiences can explicitly use their own configuration later.
  if (next.type !== "standard") gameState.aiPersonality = next.personality;
  gameState.match.config = next;
  return { valid: true, value: next };
}

function applyLevelDefinition(levelNumber) {
  const definition = getLevelDefinition(levelNumber);
  gameState.selectedLevel = definition.number;
  gameState.level = definition.strength;
  gameState.aiPersonality = definition.personality;
  return definition;
}

function getStrengthProfile(aiLevel) {
  const normalized = Math.max(1, Math.min(maxLevel, Number(aiLevel) || 1));
  const band = AI_STRENGTH_BANDS.find((entry) => normalized >= entry.first && normalized <= entry.last);
  const progress = band.first === band.last ? 1 : (normalized - band.first) / (band.last - band.first);
  const interpolate = ([start, end]) => start + (end - start) * progress;
  return {
    band: band.name,
    winAwareness: interpolate(band.win),
    blockAwareness: interpolate(band.block),
    forkAwareness: interpolate(band.fork),
    forkDefense: interpolate(band.forkDefense),
    choiceWindow: band.choiceWindow,
    optimal: band.optimal
  };
}

function clearPendingAIWork() {
  clearTimeout(gameState.ai.timeout);
  gameState.ai.timeout = undefined;
  clearTimeout(gameState.result.timeout);
  gameState.result.timeout = undefined;
  gameState.match.generation += 1;
  gameState.ai.thinking = false;
  setThinkingState(false);
}

function stopTurnTimer() {
  clearInterval(gameState.timer.handle);
  gameState.timer.handle = undefined;
  gameState.timer.active = false;
  const seconds = gameState.match.config?.timer?.secondsPerTurn || turnTime;
  gameState.timer.remaining = seconds;
  timerTextEl.textContent = `${seconds}s`;
  timerTextEl.classList.remove("urgent");
  timerTextEl.parentElement?.classList.remove("urgent");
}

function transitionTo(phase) {
  if (!Object.values(GAME_PHASES).includes(phase)) return false;
  gameState.phase = phase;
  gameState.inputLocked = phase !== GAME_PHASES.PLAYING;
  return true;
}

function scheduleAIMove(delay = 350) {
  if (!gameState.active || gameState.mode !== "ai" || gameState.currentPlayer !== gameState.aiSymbol) return;
  clearTimeout(gameState.ai.timeout);
  const generation = gameState.match.generation;
  transitionTo(GAME_PHASES.AI_THINKING);
  gameState.ai.thinking = true;
  setThinkingState(true);
  emitGameFeelEvent("ai_thinking_start");
  gameState.ai.timeout = setTimeout(() => {
    gameState.ai.timeout = undefined;
    if (generation !== gameState.match.generation || gameState.phase !== GAME_PHASES.AI_THINKING) return;
    aiMove();
  }, delay);
}

function scheduleResult(won, isDraw, delay) {
  clearTimeout(gameState.result.timeout);
  const generation = gameState.match.generation;
  gameState.result.timeout = setTimeout(() => {
    gameState.result.timeout = undefined;
    if (generation === gameState.match.generation && gameState.phase === GAME_PHASES.RESULT) showResult(won, isDraw);
  }, delay);
}

document.getElementById("scoreX").textContent = String(scoreX);
document.getElementById("scoreO").textContent = String(scoreO);

function hideAllScreens() {
  ["menu", "levels", "avatars", "symbolSelect", "game"].forEach((id) => {
    document.getElementById(id).classList.remove("active");
  });
}

function showHomeScreen() {
  stopTurnTimer();
  clearPendingAIWork();
  gameState.active = false;
  transitionTo(GAME_PHASES.HOME);
  hideAllScreens();
  document.getElementById("menu").classList.add("active");
  updateHomeDashboard();
  if (hubBackBtn) hubBackBtn.style.display = "inline-flex";
}

function hideHubBackBtn() {
  if (hubBackBtn) hubBackBtn.style.display = "none";
}

function clearSavedMatch() {
  // Mid-match state is deliberately runtime-only. The save manager clears any
  // pre-Phase-10 snapshot while migrating legacy player data.
}

function createBoardCell(index, value = "") {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.classList.add("cell");
  if (value) {
    cell.textContent = value;
    cell.classList.add(value);
  }
  cell.setAttribute("aria-label", value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`);
  cell.setAttribute("aria-rowindex", String(Math.floor(index / 3) + 1));
  cell.setAttribute("aria-colindex", String((index % 3) + 1));
  cell.addEventListener("click", () => makeMove(index));
  return cell;
}

function setStatus(text) {
  statusEl.textContent = text;
  updateTurnPresentation();
}

function getPersonalityPresentation(personality = gameState.aiPersonality) {
  const presentations = {
    human: { name: "Human-like", symbol: "â—‰", color: "#27dbe5", description: "Balanced, adaptable, and tactically sensible." },
    aggressive: { name: "Aggressive", symbol: "â†¯", color: "#ff8a5d", description: "Creates pressure and forcing choices." },
    defensive: { name: "Defensive", symbol: "â—ˆ", color: "#48bff5", description: "Patient, resilient, and hard to crack." },
    trickster: { name: "Trickster", symbol: "â—Œ", color: "#9a7dff", description: "Finds the consequence behind the tempting move." }
  };
  return presentations[personality] || presentations.human;
}

function updateHomeDashboard() {
  const summary = getProfileSummary();
  const mastery = document.getElementById("homeMastery");
  const goals = document.getElementById("homeGoals");
  const bar = document.getElementById("homeMasteryBar");
  const nextLevel = getLevelDefinition(Math.min(maxLevel, unlockedLevel));
  if (mastery) mastery.textContent = `${summary.mastery}%`;
  if (goals) goals.textContent = `${summary.levelsCompleted + summary.personalitiesDefeated + summary.achievementsCompleted} / 44 goals`;
  if (bar) {
    bar.style.width = `${summary.mastery}%`;
    bar.closest(".mastery-card")?.querySelector(".mastery-ring")?.style.setProperty("--p", `${summary.mastery}%`);
  }
  document.getElementById("nextLevelNumber").textContent = `Level ${nextLevel.number}`;
  document.getElementById("nextLevelName").textContent = nextLevel.name;
  document.getElementById("nextLevelMeta").textContent = `${getPersonalityPresentation(nextLevel.personality).name} Â· ${nextLevel.difficulty}`;
  document.getElementById("homeStats").textContent = `${summary.wins} wins Â· ${summary.bestStreak} best streak`;
}

function updateSymbolScreen() {
  const definition = getLevelDefinition(gameState.selectedLevel);
  const personality = getPersonalityPresentation(definition.personality);
  document.getElementById("symbolLevelLabel").textContent = `Level ${definition.number} Â· ${personality.name}`;
  document.getElementById("symbolTitle").textContent = definition.name;
  document.getElementById("symbolLesson").textContent = definition.strategicLesson;
}

function updateMatchPresentation() {
  const definition = getLevelDefinition(gameState.selectedLevel);
  const isAI = gameState.mode === "ai";
  const personality = getPersonalityPresentation(isAI ? gameState.aiPersonality : "human");
  const opponentCard = document.getElementById("opponentCard");
  opponentCard.style.setProperty("--personality", personality.color);
  document.getElementById("opponentEmblem").textContent = isAI ? personality.symbol : "â—«";
  document.getElementById("thinkingEmblem").textContent = isAI ? personality.symbol : "â—«";
  document.getElementById("opponentKicker").textContent = isAI ? "Tactical Opponent" : "Local Duel";
  document.getElementById("opponentName").textContent = isAI ? personality.name : "Two Players";
  document.getElementById("opponentLesson").textContent = isAI ? `Level ${definition.number} Â· ${definition.name}` : "Pass the board and play face to face.";
  document.getElementById("strengthLabel").textContent = isAI ? `Level ${definition.strength}` : "Classic match";
  const strengthDots = document.getElementById("strengthDots");
  strengthDots.innerHTML = "";
  const filled = isAI ? Math.max(1, Math.ceil(definition.strength / 4)) : 0;
  for (let index = 0; index < 5; index += 1) {
    const dot = document.createElement("i");
    if (index < filled) dot.classList.add("active");
    strengthDots.appendChild(dot);
  }
  document.getElementById("thinkingTitle").textContent = isAI ? `${personality.name} is ready` : "Local tactical duel";
  document.getElementById("thinkingText").textContent = isAI ? personality.description : "Every move creates a new decision.";
  document.getElementById("playerSymbolDisplay").textContent = gameState.mode === "ai" ? gameState.playerSymbol : gameState.currentPlayer;
  document.getElementById("gameLevelNumber").textContent = isAI ? `Level ${definition.number}` : "Classic";
  document.getElementById("gameLesson").textContent = isAI ? definition.name : "Three in a row wins";
  updateTurnPresentation();
}

function updateTurnPresentation() {
  const turnPill = document.getElementById("turnPill");
  const turnLabel = document.getElementById("turnLabel");
  const turnMark = document.getElementById("turnMark");
  const playerTurn = document.getElementById("playerTurnDisplay");
  const isAI = gameState.mode === "ai";
  const aiTurn = isAI && gameState.currentPlayer === gameState.aiSymbol;
  const localLabel = isAI ? (aiTurn ? "AI Turn" : "Your Turn") : `Player ${gameState.currentPlayer} Turn`;
  if (!turnPill || !turnLabel || !turnMark) return;
  turnPill.classList.toggle("ai-turn", aiTurn);
  turnLabel.textContent = gameState.active ? localLabel : statusEl.textContent;
  turnMark.textContent = gameState.currentPlayer;
  playerTurn.textContent = gameState.active ? (isAI ? (aiTurn ? "AI thinking" : "Your turn") : `Player ${gameState.currentPlayer}`) : statusEl.textContent;
  emitGameFeelEvent(aiTurn ? "ai_turn" : "player_turn", { currentPlayer: gameState.currentPlayer });
}

function startTwoPlayer() {
  clearSavedMatch();
  gameState.mode = "two";
  gameState.playerSymbol = "X";
  gameState.aiSymbol = "O";
  gameState.selectedLevel = 1;
  snapshotMatchConfig({ mode: "two", type: "standard" });
  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");
  resetBoard();
  updateMatchPresentation();
  startTurnTimer();
}

function startVsAI() {
  clearSavedMatch();
  gameState.mode = "ai";
  applyLevelDefinition(unlockedLevel);
  snapshotMatchConfig({ mode: "ai", type: "standard" });
  updateHomeDashboard();

  document.getElementById("menu").classList.remove("active");
  hideHubBackBtn();
  showLevels();
}

function showLevels() {
  transitionTo(GAME_PHASES.LEVEL_SELECT);
  hideAllScreens();
  hideHubBackBtn();
  const levelBox = document.getElementById("levels");
  const levelButtons = document.getElementById("levelButtons");

  levelButtons.innerHTML = "";
  pendingLevelSelection = false;

  let activeBand = "";
  for (let i = 1; i <= maxLevel; i += 1) {
    const btn = document.createElement("button");
    const definition = getLevelDefinition(i);
    if (definition.band !== activeBand) {
      activeBand = definition.band;
      const bandHeading = document.createElement("h3");
      bandHeading.className = "level-band-heading";
      bandHeading.textContent = definition.band;
      levelButtons.appendChild(bandHeading);
    }
    btn.innerHTML = `<span class="level-number">${i}</span><span class="level-copy"><strong>${definition.name}</strong><span>${definition.strategicLesson}</span><small>${getPersonalityPresentation(definition.personality).name} Â· ${definition.difficulty}</small></span><b class="level-state"></b>`;
    btn.title = `${definition.band} Â· ${definition.strategicLesson}`;
    btn.setAttribute("aria-label", `Level ${i}, ${definition.name}, ${definition.band}, ${definition.difficulty}`);
    const completed = metaProgress.levels.completed.includes(i);
    if (completed) btn.classList.add("completed");
    btn.querySelector(".level-state").textContent = completed ? "Complete" : "Play";

    if (i > unlockedLevel) {
      btn.classList.add("locked");
      btn.setAttribute("aria-disabled", "true");
      btn.querySelector(".level-state").textContent = `Lock Â· ${i - 1}`;
      btn.addEventListener("click", () => {
        restartAnimation(btn, "locked-feedback");
        showGameToast("Challenge locked", `Complete Level ${i - 1} to continue.`, "locked");
        emitGameFeelEvent("locked", { level: i });
        haptic(10);
      });
    } else {
      btn.addEventListener("click", () => {
        if (pendingLevelSelection) return;
        pendingLevelSelection = true;
        restartAnimation(btn, "selected-feedback");
        emitGameFeelEvent("level_select", { level: i });
        setTimeout(() => {
          pendingLevelSelection = false;
          selectLevel(i);
        }, 130);
      });
    }

    levelButtons.appendChild(btn);
  }

  levelBox.classList.add("active");
}

function selectLevel(lvl) {
  clearSavedMatch();
  applyLevelDefinition(lvl);
  savePlayerData();
  transitionTo(GAME_PHASES.SYMBOL_SELECT);

  document.getElementById("levels").classList.remove("active");
  document.getElementById("symbolSelect").classList.add("active");
  updateSymbolScreen();
}

function selectAvatar() {
  clearSavedMatch();
  applyLevelDefinition(gameState.selectedLevel);
  document.getElementById("avatars").classList.remove("active");
  document.getElementById("symbolSelect").classList.add("active");
}

function chooseSymbol(symbol) {
  if (gameState.phase !== GAME_PHASES.SYMBOL_SELECT || (symbol !== "X" && symbol !== "O")) return;
  clearSavedMatch();
  applyLevelDefinition(gameState.selectedLevel);
  gameState.playerSymbol = symbol;
  gameState.aiSymbol = symbol === "X" ? "O" : "X";
  if (!snapshotMatchConfig({ playerSymbol: symbol, aiSymbol: gameState.aiSymbol })) return;

  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");

  resetBoard();
  updateMatchPresentation();
  startTurnTimer();

  if (gameState.currentPlayer === gameState.aiSymbol) {
    scheduleAIMove();
  }
}

function backToLevelsFromSymbol() {
  showLevels();
}

function resetBoard() {
  stopTurnTimer();
  clearPendingAIWork();
  gameState.match.objectives = createMatchObjectives();
  gameState.match.moves = [];
  beginMatchContext();
  gameState.board = Array(9).fill("");
  gameState.active = true;
  gameState.currentPlayer = "X";
  gameState.result.data = null;
  transitionTo(GAME_PHASES.PLAYING);
  boardEl.innerHTML = "";
  document.querySelector(".board-shell")?.classList.remove("has-win", "win-impact", "draw-complete", "win-row-top", "win-row-middle", "win-row-bottom", "win-col-left", "win-col-middle", "win-col-right", "win-diagonal-main", "win-diagonal-cross");

  setStatus(`Player ${gameState.currentPlayer} Turn`);
  timerTextEl.textContent = `${turnTime}s`;

  gameState.board.forEach((_, index) => {
    boardEl.appendChild(createBoardCell(index));
  });
  updateMatchPresentation();
}

function makeMove(index) {
  if (!Number.isInteger(index) || index < 0 || index >= gameState.board.length || gameState.phase !== GAME_PHASES.PLAYING || gameState.inputLocked || !gameState.active || gameState.board[index] || (gameState.mode === "ai" && gameState.currentPlayer === gameState.aiSymbol)) {
    const cell = boardEl.children[index];
    if (cell) restartAnimation(cell, "invalid-move");
    emitGameFeelEvent("invalid_move", { index });
    haptic(8);
    return;
  }

  const tracksObjectives = gameState.mode === "ai" && gameState.currentPlayer === gameState.playerSymbol;
  const blocksImmediateThreat = tracksObjectives && getWinningMoves(gameState.board, gameState.aiSymbol).includes(index);
  const preventsFork = tracksObjectives && getForkMoves(gameState.board, gameState.aiSymbol).includes(index);
  const createsFork = tracksObjectives && getForkMoves(gameState.board, gameState.playerSymbol).includes(index);

  gameState.board[index] = gameState.currentPlayer;
  gameState.match.moves.push(index);
  if (tracksObjectives) {
    gameState.match.objectives.blockedThreat ||= blocksImmediateThreat;
    gameState.match.objectives.preventedFork ||= preventsFork;
    gameState.match.objectives.createdFork ||= createsFork;
  }
  const cell = boardEl.children[index];
  cell.textContent = gameState.currentPlayer;
  cell.classList.add(gameState.currentPlayer);
  cell.setAttribute("aria-label", `Cell ${index + 1}: ${gameState.currentPlayer}`);
  restartAnimation(cell, gameState.currentPlayer === "X" ? "piece-in-x" : "piece-in-o");
  emitGameFeelEvent("piece_place", { symbol: gameState.currentPlayer, actor: "player" });
  haptic(10);

  if (checkWin()) return;

  if (gameState.board.every((value) => value !== "")) {
    draw();
    return;
  }

  gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
  setStatus(`Player ${gameState.currentPlayer} Turn`);
  startTurnTimer();

  if (gameState.mode === "ai" && gameState.currentPlayer === gameState.aiSymbol) {
    scheduleAIMove();
  }
}

function startTurnTimer() {
  stopTurnTimer();
  if (!gameState.active || gameState.phase === GAME_PHASES.RESULT || gameState.match.config?.timer?.enabled === false) return;

  let timeLeft = gameState.match.config?.timer?.secondsPerTurn || turnTime;
  const generation = gameState.match.generation;
  gameState.timer.active = true;
  gameState.timer.remaining = timeLeft;
  timerTextEl.textContent = `${timeLeft}s`;
  timerTextEl.classList.remove("urgent");
  timerTextEl.parentElement?.classList.remove("urgent");

  gameState.timer.handle = setInterval(() => {
    if (generation !== gameState.match.generation || !gameState.active || gameState.phase === GAME_PHASES.RESULT) {
      stopTurnTimer();
      return;
    }
    timeLeft -= 1;
    gameState.timer.remaining = timeLeft;
    timerTextEl.textContent = `${timeLeft}s`;
    const isUrgent = timeLeft > 0 && timeLeft <= 3;
    timerTextEl.classList.toggle("urgent", isUrgent);
    timerTextEl.parentElement?.classList.toggle("urgent", isUrgent);

    if (isUrgent) emitGameFeelEvent("timer_warning", { seconds: timeLeft });

    if (timeLeft > 0) {
      return;
    }

    stopTurnTimer();

    if (gameState.mode === "ai" && gameState.currentPlayer === gameState.aiSymbol) {
      aiMove();
      return;
    }

    setStatus(`${gameState.currentPlayer} ran out of time`);
    gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
    setStatus(`Player ${gameState.currentPlayer} Turn`);
    startTurnTimer();

    if (gameState.mode === "ai" && gameState.currentPlayer === gameState.aiSymbol) {
      scheduleAIMove();
    }
  }, 1000);
}

function aiMove() {
  setThinkingState(false);
  gameState.ai.thinking = false;
  if (!gameState.active || gameState.phase !== GAME_PHASES.AI_THINKING) return;
  if (gameState.currentPlayer !== gameState.aiSymbol) return;

  const move = getAIMoveByLevel();
  if (move === null || move === undefined) return;

  playMoveFromAI(move);
}

function playMoveFromAI(index) {
  if (gameState.board[index]) {
    const fallback = gameState.board.findIndex((v) => v === "");
    if (fallback === -1) return;
    makeMoveFromSymbol(fallback, gameState.aiSymbol);
    return;
  }

  makeMoveFromSymbol(index, gameState.aiSymbol);
}

function makeMoveFromSymbol(index, symbol) {
  if (!gameState.active || !Number.isInteger(index) || symbol !== gameState.currentPlayer || gameState.board[index]) return;

  gameState.board[index] = symbol;
  gameState.match.moves.push(index);
  const cell = boardEl.children[index];
  cell.textContent = symbol;
  cell.classList.add(symbol);
  cell.setAttribute("aria-label", `Cell ${index + 1}: ${symbol}`);
  restartAnimation(cell, symbol === "X" ? "piece-in-x" : "piece-in-o");
  emitGameFeelEvent("piece_place", { symbol, actor: "ai" });

  if (checkWin()) return;

  if (gameState.board.every((value) => value !== "")) {
    draw();
    return;
  }

  gameState.currentPlayer = symbol === "X" ? "O" : "X";
  transitionTo(GAME_PHASES.PLAYING);
  setStatus(`Player ${gameState.currentPlayer} Turn`);
  startTurnTimer();
}

function getLegalMoves(state) {
  return state.reduce((moves, value, index) => {
    if (value === "") moves.push(index);
    return moves;
  }, []);
}

function getWinner(state) {
  for (const [a, b, c] of winPatterns) {
    if (state[a] && state[a] === state[b] && state[b] === state[c]) return state[a];
  }
  return null;
}

function getWinLineClass(pattern) {
  const lines = { "012": "win-row-top", "345": "win-row-middle", "678": "win-row-bottom", "036": "win-col-left", "147": "win-col-middle", "258": "win-col-right", "048": "win-diagonal-main", "246": "win-diagonal-cross" };
  return lines[pattern.join("")] || "";
}

function playOnBoard(state, index, symbol) {
  const next = state.slice();
  next[index] = symbol;
  return next;
}

function getWinningMoves(state, symbol) {
  return getLegalMoves(state).filter((move) => getWinner(playOnBoard(state, move, symbol)) === symbol);
}

function getForkMoves(state, symbol) {
  return getLegalMoves(state).filter((move) => {
    const next = playOnBoard(state, move, symbol);
    return getWinner(next) !== symbol && getWinningMoves(next, symbol).length >= 2;
  });
}

function getPositionValue(move) {
  if (move === 4) return 3;
  if ([0, 2, 6, 8].includes(move)) return 2;
  return 1;
}

function getTacticalCandidates(state, profile) {
  const legal = getLegalMoves(state);
  const aiWins = getWinningMoves(state, gameState.aiSymbol);
  const playerWins = getWinningMoves(state, gameState.playerSymbol);
  const playerForks = getForkMoves(state, gameState.playerSymbol);
  const recognizedWin = aiWins.length > 0 && Math.random() < profile.winAwareness;
  const recognizedBlock = playerWins.length > 0 && Math.random() < profile.blockAwareness;

  return legal.map((move) => {
    const next = playOnBoard(state, move, gameState.aiSymbol);
    const createsFork = getForkMoves(state, gameState.aiSymbol).includes(move);
    const blocksFork = playerForks.includes(move);
    const pressure = getWinningMoves(next, gameState.aiSymbol).length;
    const playerCounterThreats = getWinningMoves(next, gameState.playerSymbol).length;

    return {
      move,
      isWin: aiWins.includes(move),
      blocksWin: playerWins.includes(move),
      createsFork,
      blocksFork,
      pressure,
      playerCounterThreats,
      position: getPositionValue(move)
    };
  }).map((candidate) => ({
    ...candidate,
    recognizedWin,
    recognizedBlock,
    recognizesFork: candidate.createsFork && Math.random() < profile.forkAwareness,
    recognizesForkDefense: candidate.blocksFork && Math.random() < profile.forkDefense
  }));
}

function scoreCandidate(candidate, personality) {
  const preference = AI_PERSONALITIES[personality] || AI_PERSONALITIES.human;
  let score = candidate.position * (preference.center + preference.corners);

  // Immediate results always dominate only when this strength profile notices them.
  if (candidate.isWin) score += candidate.recognizedWin ? 100000 : 20;
  if (candidate.blocksWin) score += candidate.recognizedBlock ? 90000 : 12;
  if (candidate.recognizesFork) score += 700 + preference.forks * 8;
  if (candidate.recognizesForkDefense) score += 620 + preference.defense * 8;

  score += candidate.pressure * (50 + preference.pressure * 3);
  score -= candidate.playerCounterThreats * (40 + preference.defense * 3);

  if (candidate.position === 3) score += preference.center * 8;
  if (candidate.position === 2) score += preference.corners * 8;

  // Trickster's bait is a legitimate fork/pressure preference, never hidden state.
  if (personality === "trickster" && candidate.createsFork) score += preference.bait * 14;
  if (personality === "aggressive" && candidate.pressure > 0) score += preference.pressure * 12;
  if (personality === "defensive" && candidate.playerCounterThreats === 0) score += preference.defense * 7;
  return score;
}

function solvePosition(state, turnSymbol, memo = new Map()) {
  const winner = getWinner(state);
  if (winner === gameState.aiSymbol) return 10;
  if (winner === gameState.playerSymbol) return -10;
  const legal = getLegalMoves(state);
  if (legal.length === 0) return 0;

  const key = `${state.join("")}:${turnSymbol}`;
  if (memo.has(key)) return memo.get(key);
  const maximizing = turnSymbol === gameState.aiSymbol;
  let best = maximizing ? -Infinity : Infinity;

  for (const move of legal) {
    const next = playOnBoard(state, move, turnSymbol);
    const score = solvePosition(next, turnSymbol === "X" ? "O" : "X", memo);
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
  }
  memo.set(key, best);
  return best;
}

function chooseRankedCandidate(ranked, profile, personality) {
  if (ranked.length === 0) return null;
  const windowSize = Math.min(profile.choiceWindow, ranked.length);
  const pool = ranked.slice(0, windowSize);

  // Low levels choose among ranked, plausible alternatives. This is controlled
  // imperfection rather than selecting any empty square at random.
  if (pool.length === 1) return pool[0].move;
  const weights = pool.map((_, index) => (windowSize - index) ** 2);
  if (personality === "human") weights[0] += AI_PERSONALITIES.human.variety;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < pool.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return pool[index].move;
  }
  return pool[0].move;
}

function getAIMoveByLevel() {
  const profile = getStrengthProfile(gameState.level);
  const personality = AI_PERSONALITIES[gameState.aiPersonality] ? gameState.aiPersonality : "human";
  const legal = getLegalMoves(gameState.board);
  if (legal.length === 0) return null;

  const candidates = getTacticalCandidates(gameState.board, profile);
  if (profile.optimal) {
    const memo = new Map();
    const scored = candidates.map((candidate) => ({
      ...candidate,
      outcome: solvePosition(playOnBoard(gameState.board, candidate.move, gameState.aiSymbol), gameState.playerSymbol, memo),
      score: scoreCandidate(candidate, personality)
    }));
    const bestOutcome = Math.max(...scored.map((candidate) => candidate.outcome));
    const optimal = scored.filter((candidate) => candidate.outcome === bestOutcome)
      .sort((a, b) => b.score - a.score || a.move - b.move);
    // Variation at Proof strength is limited to equally optimal moves, so an
    // opponent can remain recognizable without sacrificing tactical outcome.
    return chooseRankedCandidate(optimal, { ...profile, choiceWindow: 2 }, personality);
  }

  const ranked = candidates
    .map((candidate) => ({ ...candidate, score: scoreCandidate(candidate, personality) }))
    .sort((a, b) => b.score - a.score || a.move - b.move);
  return chooseRankedCandidate(ranked, profile, personality);
}

function finishMatch({ outcome, isDraw = false, winner = null }) {
  if (!gameState.active || gameState.result.recorded) return false;
  stopTurnTimer();
  clearPendingAIWork();
  gameState.active = false;
  gameState.ai.thinking = false;
  gameState.result.data = { outcome, isDraw, winner };
  transitionTo(GAME_PHASES.RESULT);

  if (isDraw) {
    gameState.match.objectives.completed = true;
    gameState.match.objectives.draw = true;
    setStatus("Draw");
  } else {
    gameState.match.objectives.completed = true;
    gameState.match.objectives.won = gameState.mode !== "ai" || winner === gameState.playerSymbol;
    setStatus(`Player ${winner} Wins`);
    updateScore();
  }

  finalizeMatch(outcome);
  scheduleResult(outcome === "win", isDraw, isDraw ? 500 : 600);
  return true;
}

function checkWin() {

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;

    if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[b] === gameState.board[c]) {
      [a, b, c].forEach((idx) => boardEl.children[idx].classList.add("win"));
      const boardShell = document.querySelector(".board-shell");
      boardShell?.classList.add("has-win", getWinLineClass(pattern));
      restartAnimation(boardShell, "win-impact");

      emitGameFeelEvent("win_line", { winner: gameState.currentPlayer, pattern });
      haptic([14, 45, 24]);

      const playerWon = gameState.mode !== "ai" ? true : gameState.currentPlayer === gameState.playerSymbol;
      finishMatch({ outcome: playerWon ? "win" : "loss", winner: gameState.currentPlayer });

      return true;
    }
  }

  return false;
}

function draw() {
  document.querySelector(".board-shell")?.classList.add("draw-complete");
  finishMatch({ outcome: "draw", isDraw: true });
}

function updateScore() {
  if (gameState.currentPlayer === "X") {
    scoreX += 1;
  } else {
    scoreO += 1;
  }

  document.getElementById("scoreX").textContent = String(scoreX);
  document.getElementById("scoreO").textContent = String(scoreO);

  if (gameState.match.config.permissions.progression && gameState.mode === "ai" && gameState.currentPlayer === gameState.playerSymbol) {
    if (gameState.level >= unlockedLevel && unlockedLevel < maxLevel) {
      unlockedLevel += 1;
    }
  }
  if (gameState.match.config.permissions.statistics) savePlayerData();
}

function resetScores() {
  scoreX = 0;
  scoreO = 0;

  document.getElementById("scoreX").textContent = "0";
  document.getElementById("scoreO").textContent = "0";
  savePlayerData();
}

function resetPlayerData() {
  const confirmed = window.confirm("Reset all Tic-Tac-Toe progress, statistics, achievements, scores, and audio settings? This cannot be undone.");
  if (!confirmed) return;

  stopTurnTimer();
  clearPendingAIWork();
  playerSave = saveManager.reset();
  metaProgress = createMetaProgressView(playerSave);
  unlockedLevel = playerSave.progression.levels.highestUnlocked;
  scoreX = playerSave.scores.x;
  scoreO = playerSave.scores.o;
  audioSettings = playerSave.settings.audio;
  gameState.mode = "";
  gameState.selectedLevel = 1;
  gameState.aiPersonality = "human";
  gameState.playerSymbol = "X";
  gameState.aiSymbol = "O";
  gameState.board = Array(9).fill("");
  gameState.currentPlayer = "X";
  gameState.active = false;
  gameState.match.objectives = createMatchObjectives();
  gameState.result.recorded = false;
  gameState.match.context = null;
  gameState.result.data = null;
  applyLevelDefinition(1);

  document.getElementById("scoreX").textContent = "0";
  document.getElementById("scoreO").textContent = "0";
  document.getElementById("resultModal").classList.remove("active");
  document.getElementById("audioPanel").hidden = true;
  if (sfxGain && audioContext) sfxGain.gain.setTargetAtTime(audioSettings.master * audioSettings.sfx, audioContext.currentTime, 0.025);
  if (bgMusic) {
    if (audioSettings.musicEnabled) fadeMusic(musicTargetVolume());
    else { bgMusic.pause(); bgMusic.volume = 0; }
  }
  syncAudioSettingsUI();
  showHomeScreen();
  showGameToast("Player data reset", "A fresh local profile is ready.", "progress");
}

function restartGame() {
  if (!gameState.mode || ![GAME_PHASES.PLAYING, GAME_PHASES.AI_THINKING, GAME_PHASES.RESULT].includes(gameState.phase)) return;
  emitGameFeelEvent("reset");
  clearSavedMatch();
  clearPendingAIWork();
  document.getElementById("resultModal").classList.remove("active");
  resetBoard();
  startTurnTimer();

  if (gameState.mode === "ai" && gameState.currentPlayer === gameState.aiSymbol) {
    scheduleAIMove();
  }
}

function backToMenu() {
  stopTurnTimer();
  clearPendingAIWork();
  document.getElementById("resultModal").classList.remove("active");
  showHomeScreen();
}

function showResult(won, isDraw = false) {
  if (gameState.phase !== GAME_PHASES.RESULT) return;
  const modal = document.getElementById("resultModal");
  const title = document.getElementById("resultTitle");
  const nextBtn = document.getElementById("nextBtn");
  const kicker = document.getElementById("resultKicker");
  const detail = document.getElementById("resultDetail");

  modal.classList.add("active");
  modal.classList.remove("victory", "defeat", "draw");

  if (isDraw) {
    modal.classList.add("draw");
    kicker.textContent = "Balanced Position";
    title.textContent = "Draw";
    detail.textContent = gameState.mode === "ai" && gameState.level >= 17 ? "Strong defense preserved the best available result." : "No winning line remained. Try a new tactical plan.";
    nextBtn.style.display = "none";
    emitGameFeelEvent("draw");
    return;
  }

  if (gameState.mode === "two") {
    modal.classList.add("victory");
    kicker.textContent = "Local Duel Complete";
    title.textContent = `Player ${gameState.currentPlayer} Wins`;
    detail.textContent = "A clear tactical line decided the match.";
    nextBtn.style.display = "none";
    emitGameFeelEvent("victory");
    return;
  }

  if (won) {
    modal.classList.add("victory");
    kicker.textContent = gameState.level < maxLevel ? "Challenge Complete" : "Master Tactician";
    title.textContent = "You Win";
    const next = gameState.level < maxLevel ? getLevelDefinition(gameState.level + 1) : null;
    detail.textContent = next ? `Level ${next.number} unlocked: ${next.name}.` : "You completed the full tactical mastery path.";
    nextBtn.style.display = gameState.level < maxLevel ? "inline-block" : "none";
    emitGameFeelEvent("victory");
  } else {
    modal.classList.add("defeat");
    kicker.textContent = "The Opponent Found The Answer";
    title.textContent = "You Lost";
    detail.textContent = "Read the final line, adjust your plan, and try again.";
    nextBtn.style.display = "none";
    emitGameFeelEvent("defeat");
  }
}

function nextLevel() {
  if (gameState.phase !== GAME_PHASES.RESULT || gameState.mode !== "ai" || gameState.selectedLevel >= maxLevel) return;
  emitGameFeelEvent("next_level");
  document.getElementById("resultModal").classList.remove("active");
  clearSavedMatch();
  clearPendingAIWork();
  applyLevelDefinition(gameState.selectedLevel + 1);
  snapshotMatchConfig({ level: gameState.selectedLevel });
  savePlayerData();
  resetBoard();
  startTurnTimer();

  if (gameState.currentPlayer === gameState.aiSymbol) {
    scheduleAIMove();
  }
}

function goHome() {
  clearPendingAIWork();
  document.getElementById("resultModal").classList.remove("active");
  clearSavedMatch();
  backToMenu();
}

function backToHome() {
  showHomeScreen();
}

window.startVsAI = startVsAI;
window.startTwoPlayer = startTwoPlayer;
window.showLevels = showLevels;
window.selectLevel = selectLevel;
window.selectAvatar = selectAvatar;
window.chooseSymbol = chooseSymbol;
window.backToLevelsFromSymbol = backToLevelsFromSymbol;
window.resetScores = resetScores;
window.resetPlayerData = resetPlayerData;
window.restartGame = restartGame;
window.backToMenu = backToMenu;
window.nextLevel = nextLevel;
window.goHome = goHome;
window.backToHome = backToHome;

// Phase 11.5B adapter: feature systems can query the same tactical helpers as
// the AI without receiving authority to mutate the live match state.
featureCore.attachEngine({
  analysis: {
    legalMoves: (board) => getLegalMoves(board),
    winningMoves: (board, mark) => getWinningMoves(board, mark),
    forkMoves: (board, mark) => getForkMoves(board, mark)
  },
  getRuntimeSnapshot: () => ({
    phase: gameState.phase,
    board: [...gameState.board],
    currentPlayer: gameState.currentPlayer,
    config: gameState.match.config,
    moves: [...gameState.match.moves]
  }),
  validateConfiguration: (config) => featureCore.normalizeMatchConfig(config),
  prepareMatchConfiguration
});

showHomeScreen();

window.addEventListener("tictactoe:feel", (event) => {
  const { type, ...detail } = event.detail;
  playAudioEffect(type, detail);
  if (["victory", "defeat", "draw", "level_unlock", "achievement_unlock"].includes(type)) duckMusic();
});

document.addEventListener("pointerdown", (event) => {
  if (event.isTrusted) ensureAudio();
  const button = event.target.closest("button");
  if (button && !button.closest("#levelButtons")) emitGameFeelEvent("button_press");
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.isTrusted && (event.key === "Enter" || event.key === " ")) ensureAudio();
});

document.addEventListener("visibilitychange", () => {
  if (!bgMusic) return;
  if (document.hidden) {
    pageWasMusicPlaying = !bgMusic.paused;
    if (pageWasMusicPlaying) bgMusic.pause();
  } else if (pageWasMusicPlaying && audioSettings.musicEnabled) {
    bgMusic.play().then(() => fadeMusic(musicTargetVolume(), 180)).catch(() => {});
  }
});

document.getElementById("audioSettingsButton")?.addEventListener("click", () => {
  const panel = document.getElementById("audioPanel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) syncAudioSettingsUI();
});
document.getElementById("closeAudioPanel")?.addEventListener("click", () => { document.getElementById("audioPanel").hidden = true; });
[["masterVolume", "master"], ["musicVolume", "music"], ["sfxVolume", "sfx"]].forEach(([id, key]) => {
  document.getElementById(id)?.addEventListener("input", (event) => setAudioSettings({ [key]: Number(event.target.value) / 100 }));
});
document.getElementById("musicToggle")?.addEventListener("click", () => setAudioSettings({ musicEnabled: !audioSettings.musicEnabled }));
document.getElementById("sfxToggle")?.addEventListener("click", () => setAudioSettings({ sfxEnabled: !audioSettings.sfxEnabled }));
document.getElementById("resetPlayerData")?.addEventListener("click", resetPlayerData);
syncAudioSettingsUI();
