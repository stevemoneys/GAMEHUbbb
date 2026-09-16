const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const timerTextEl = document.getElementById("timerText");
const hubBackBtn = document.querySelector(".hub-back-btn");
const RESUME_KEY = "tictactoe_saved_match_v1";

const bgMusic = document.getElementById("bgMusic");

let gameMode = "";
let selectedLevel = 1;
let unlockedLevel = Number(localStorage.getItem("unlockedLevel")) || 1;
let selectedAvatar = "human";

let playerSymbol = "X";
let aiSymbol = "O";

let scoreX = Number(localStorage.getItem("scoreX")) || 0;
let scoreO = Number(localStorage.getItem("scoreO")) || 0;

let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;

let turnTimer;
let aiTimeout;
let resultTimeout;
let matchGeneration = 0;
const turnTime = 10;
const maxLevel = 20;
let level = 1;

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
  ["Center Control", "Foundations", "aggressive", "Use central control to create future options.", "Learn why the center creates possibilities.", "Win after establishing strong central control.", "Progression recognition", "Easy – Moderate", false, null],
  ["Own the Corners", "Awareness", "human", "Use corners as tactical resources.", "Understand corners and center play.", "Win using a corner-based setup.", "Unlock the Awareness challenge band", "Moderate", false, null],
  ["Create the Fork", "Awareness", "aggressive", "Create multiple simultaneous threats.", "Create a legitimate fork when possible.", "Win using a fork.", "Fork mastery milestone", "Moderate", true, "createFork"],
  ["Break the Fork", "Awareness", "defensive", "Prevent dangerous fork opportunities.", "Prevent the opponent from creating a decisive fork.", "Win without allowing a successful opponent fork.", "Progression recognition", "Moderate", true, "preventFork"],
  ["Read Ahead", "Awareness", "trickster", "Judge moves by their consequences.", "Avoid an obvious tactical trap.", "Win while avoiding the strongest bait opportunity.", "Awareness milestone", "Moderate – Challenging", true, null],
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
  ["Human-like Mastery", "Proof", "human", "Apply complete tactical understanding against flexible play.", "Use the complete tactical skill set.", "Win with strong tactical consistency.", "Mastery-path recognition", "Expert – Master", true, "bestResult"],
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

const META_PROGRESS_KEY = "tictactoe_meta_progress_v1";
const META_PROGRESS_VERSION = 1;
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

function createPersonalityMastery() {
  return META_PERSONALITIES.reduce((mastery, personality) => {
    mastery[personality] = { victories: 0, highestLevelDefeated: 0, defeated: false };
    return mastery;
  }, {});
}

function createDefaultMetaProgress(legacyUnlocked = 1) {
  const highestUnlocked = Math.max(1, Math.min(maxLevel, Number(legacyUnlocked) || 1));
  const completed = Array.from({ length: Math.max(0, highestUnlocked - 1) }, (_, index) => index + 1);
  return {
    version: META_PROGRESS_VERSION,
    profile: { createdAt: Date.now() },
    statistics: { matches: 0, wins: 0, losses: 0, draws: 0, aiMatches: 0, twoPlayerMatches: 0, aiWins: 0, aiLosses: 0, aiDraws: 0, totalPersonalityVictories: 0, winsByLevel: {}, completionsByLevel: {} },
    streaks: { current: 0, best: 0 },
    levels: { highestUnlocked, completed, highestCompleted: completed.length ? Math.max(...completed) : 0 },
    personalityMastery: createPersonalityMastery(),
    achievements: {},
    milestones: {},
    mastery: {}
  };
}

function asNonNegativeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeLevelCountMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((counts, [levelNumber, count]) => {
    const level = Number(levelNumber);
    if (Number.isInteger(level) && level >= 1 && level <= maxLevel) {
      counts[level] = asNonNegativeNumber(count);
    }
    return counts;
  }, {});
}

function normalizeMetaProgress(raw, legacyUnlocked) {
  const fallback = createDefaultMetaProgress(legacyUnlocked);
  if (!raw || typeof raw !== "object") return fallback;
  const rawStats = raw.statistics && typeof raw.statistics === "object" ? raw.statistics : {};
  const completed = Array.from(new Set((Array.isArray(raw.levels?.completed) ? raw.levels.completed : fallback.levels.completed)
    .map((levelNumber) => Number(levelNumber))
    .filter((levelNumber) => Number.isInteger(levelNumber) && levelNumber >= 1 && levelNumber <= maxLevel))).sort((a, b) => a - b);
  const personalityMastery = createPersonalityMastery();
  META_PERSONALITIES.forEach((personality) => {
    const source = raw.personalityMastery?.[personality] || {};
    personalityMastery[personality] = {
      victories: asNonNegativeNumber(source.victories),
      highestLevelDefeated: Math.min(maxLevel, asNonNegativeNumber(source.highestLevelDefeated)),
      defeated: Boolean(source.defeated) || asNonNegativeNumber(source.victories) > 0
    };
  });
  const achievementIds = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));
  const achievements = Object.entries(raw.achievements && typeof raw.achievements === "object" ? raw.achievements : {})
    .reduce((valid, [id, timestamp]) => {
      if (achievementIds.has(id) && Number(timestamp) > 0) valid[id] = Number(timestamp);
      return valid;
    }, {});
  const highestUnlocked = Math.max(fallback.levels.highestUnlocked, Math.min(maxLevel, asNonNegativeNumber(raw.levels?.highestUnlocked) || 1));
  return {
    ...fallback,
    version: META_PROGRESS_VERSION,
    profile: { createdAt: asNonNegativeNumber(raw.profile?.createdAt) || fallback.profile.createdAt },
    statistics: {
      ...fallback.statistics,
      ...Object.fromEntries(Object.keys(fallback.statistics).map((key) => [key,
        typeof fallback.statistics[key] === "object" ? normalizeLevelCountMap(rawStats[key]) : asNonNegativeNumber(rawStats[key])
      ]))
    },
    streaks: { current: asNonNegativeNumber(raw.streaks?.current), best: Math.max(asNonNegativeNumber(raw.streaks?.best), asNonNegativeNumber(raw.streaks?.current)) },
    levels: { highestUnlocked, completed, highestCompleted: completed.length ? Math.max(...completed) : 0 },
    personalityMastery,
    achievements,
    milestones: raw.milestones && typeof raw.milestones === "object" ? raw.milestones : {},
    mastery: {}
  };
}

function loadMetaProgress() {
  const legacyUnlocked = Number(localStorage.getItem("unlockedLevel")) || 1;
  try {
    const raw = localStorage.getItem(META_PROGRESS_KEY);
    return normalizeMetaProgress(raw ? JSON.parse(raw) : null, legacyUnlocked);
  } catch {
    return createDefaultMetaProgress(legacyUnlocked);
  }
}

function saveMetaProgress() {
  try {
    localStorage.setItem(META_PROGRESS_KEY, JSON.stringify(metaProgress));
  } catch {
    // Progress persistence is optional to match completion; gameplay continues.
  }
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

let metaProgress = loadMetaProgress();
unlockedLevel = Math.max(unlockedLevel, metaProgress.levels.highestUnlocked);
evaluateAchievements();
metaProgress.mastery = { percentage: calculateMastery(metaProgress), updatedAt: Date.now() };
saveMetaProgress();
let matchResultRecorded = false;
let matchContext = null;
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
  document.getElementById("thinkingCard")?.classList.toggle("is-thinking", isThinking);
  document.getElementById("turnPill")?.classList.toggle("is-thinking", isThinking);
}

const AUDIO_SETTINGS_KEY = "tictactoe_audio_settings_v1";
const DEFAULT_AUDIO_SETTINGS = { master: 1, music: 0.3, sfx: 0.65, musicEnabled: true, sfxEnabled: true };
let audioSettings = loadAudioSettings();
let audioContext;
let sfxGain;
let audioReady = false;
let musicFadeFrame;
let pageWasMusicPlaying = false;
let activeAudioPriority = 0;
let activeAudioUntil = 0;
const audioCooldowns = new Map();

function loadAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY));
    if (!saved || typeof saved !== "object") return { ...DEFAULT_AUDIO_SETTINGS };
    const volume = (value, fallback) => Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : fallback;
    return {
      master: volume(saved.master, DEFAULT_AUDIO_SETTINGS.master),
      music: volume(saved.music, DEFAULT_AUDIO_SETTINGS.music),
      sfx: volume(saved.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
      musicEnabled: saved.musicEnabled !== false,
      sfxEnabled: saved.sfxEnabled !== false
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

function saveAudioSettings() {
  try { localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings)); } catch {}
}

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
  saveAudioSettings();
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
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * audioSettings.master * audioSettings.sfx), now + delay + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
  oscillator.connect(envelope).connect(sfxGain);
  oscillator.start(now + delay);
  oscillator.stop(now + delay + duration + 0.03);
}

function playAudioEffect(type, detail = {}) {
  const personalityPitch = { human: 0, aggressive: 32, defensive: -18, trickster: 18 }[selectedAvatar] || 0;
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
  matchResultRecorded = false;
  matchContext = {
    mode: gameMode,
    level: gameMode === "ai" ? selectedLevel : null,
    personality: gameMode === "ai" ? selectedAvatar : null,
    playerSymbol
  };
}

function finalizeMatch(outcome) {
  if (matchResultRecorded) return;
  matchResultRecorded = true;
  const previousAchievementIds = new Set(Object.keys(metaProgress.achievements));
  const previouslyUnlocked = metaProgress.levels.highestUnlocked;

  const context = matchContext || {
    mode: gameMode,
    level: gameMode === "ai" ? selectedLevel : null,
    personality: gameMode === "ai" ? selectedAvatar : null,
    playerSymbol
  };
  const result = { ...context, outcome, objectives: { ...matchObjectives } };
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
      if (!metaProgress.levels.completed.includes(context.level)) {
        metaProgress.levels.completed.push(context.level);
        metaProgress.levels.completed.sort((a, b) => a - b);
        stats.completionsByLevel[context.level] = 1;
      }
      metaProgress.levels.highestCompleted = Math.max(metaProgress.levels.highestCompleted, context.level);
    }
    metaProgress.levels.highestUnlocked = Math.max(metaProgress.levels.highestUnlocked, unlockedLevel);
  }

  evaluateAchievements(result);
  metaProgress.mastery = { percentage: calculateMastery(metaProgress), updatedAt: Date.now() };
  saveMetaProgress();
  updateHomeDashboard();
  const unlockedAchievement = ACHIEVEMENTS.find((achievement) => !previousAchievementIds.has(achievement.id) && metaProgress.achievements[achievement.id]);
  if (unlockedAchievement) {
    showGameToast("Achievement unlocked", unlockedAchievement.name, "achievement");
    emitGameFeelEvent("achievement_unlock", { id: unlockedAchievement.id });
    haptic(16);
  } else if (context.mode === "ai" && outcome === "win" && metaProgress.levels.highestUnlocked > previouslyUnlocked) {
    const next = getLevelDefinition(metaProgress.levels.highestUnlocked);
    showGameToast(`Level ${next.number} unlocked`, next.name, "unlock");
    emitGameFeelEvent("level_unlock", { level: next.number });
    haptic([12, 45, 18]);
  } else {
    emitGameFeelEvent("progression_update", { outcome });
  }
}

let matchObjectives = createMatchObjectives();

function createMatchObjectives() {
  return { completed: false, won: false, draw: false, blockedThreat: false, createdFork: false, preventedFork: false };
}

function getLevelDefinition(levelNumber = selectedLevel) {
  return LEVELS[Math.max(1, Math.min(maxLevel, Number(levelNumber) || 1)) - 1];
}

function applyLevelDefinition(levelNumber) {
  const definition = getLevelDefinition(levelNumber);
  selectedLevel = definition.number;
  level = definition.strength;
  selectedAvatar = definition.personality;
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
  clearTimeout(aiTimeout);
  aiTimeout = undefined;
  clearTimeout(resultTimeout);
  resultTimeout = undefined;
  matchGeneration += 1;
  setThinkingState(false);
}

function scheduleAIMove(delay = 350) {
  clearTimeout(aiTimeout);
  const generation = matchGeneration;
  setThinkingState(true);
  emitGameFeelEvent("ai_thinking_start");
  aiTimeout = setTimeout(() => {
    aiTimeout = undefined;
    if (generation !== matchGeneration) return;
    aiMove();
  }, delay);
}

function scheduleResult(won, isDraw, delay) {
  clearTimeout(resultTimeout);
  const generation = matchGeneration;
  resultTimeout = setTimeout(() => {
    resultTimeout = undefined;
    if (generation === matchGeneration) showResult(won, isDraw);
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
  hideAllScreens();
  document.getElementById("menu").classList.add("active");
  updateHomeDashboard();
  if (hubBackBtn) hubBackBtn.style.display = "inline-flex";
}

function hideHubBackBtn() {
  if (hubBackBtn) hubBackBtn.style.display = "none";
}

function clearSavedMatch() {
  localStorage.removeItem(RESUME_KEY);
}

function saveMatchSnapshot() {
  const payload = {
    gameMode,
    selectedLevel,
    unlockedLevel,
    selectedAvatar,
    playerSymbol,
    aiSymbol,
    board,
    currentPlayer,
    gameActive,
    matchObjectives,
    matchResultRecorded,
    matchContext,
    scoreX,
    scoreO
  };
  localStorage.setItem(RESUME_KEY, JSON.stringify(payload));
}

function getSavedMatch() {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
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
  cell.addEventListener("click", () => makeMove(index));
  return cell;
}

function restoreSavedMatch(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.board) || snapshot.board.length !== 9) return false;
  clearPendingAIWork();
  gameMode = snapshot.gameMode === "two" ? "two" : "ai";
  applyLevelDefinition(snapshot.selectedLevel);
  unlockedLevel = Math.max(1, Math.min(maxLevel, Number(snapshot.unlockedLevel) || unlockedLevel));
  // Level data is authoritative; saved avatar values from before Phase 4 are
  // intentionally ignored so a restored challenge keeps its curriculum AI.
  playerSymbol = snapshot.playerSymbol === "O" ? "O" : "X";
  aiSymbol = playerSymbol === "X" ? "O" : "X";
  scoreX = Math.max(0, Number(snapshot.scoreX) || 0);
  scoreO = Math.max(0, Number(snapshot.scoreO) || 0);
  board = snapshot.board.map((cell) => (cell === "X" || cell === "O" ? cell : ""));
  currentPlayer = snapshot.currentPlayer === "O" ? "O" : "X";
  gameActive = Boolean(snapshot.gameActive);
  matchObjectives = snapshot.matchObjectives && typeof snapshot.matchObjectives === "object"
    ? { ...createMatchObjectives(), ...snapshot.matchObjectives }
    : createMatchObjectives();
  matchResultRecorded = Boolean(snapshot.matchResultRecorded) || !gameActive;
  matchContext = snapshot.matchContext && typeof snapshot.matchContext === "object" ? snapshot.matchContext : null;

  document.getElementById("scoreX").textContent = String(scoreX);
  document.getElementById("scoreO").textContent = String(scoreO);
  localStorage.setItem("scoreX", String(scoreX));
  localStorage.setItem("scoreO", String(scoreO));
  localStorage.setItem("unlockedLevel", String(unlockedLevel));

  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");
  boardEl.innerHTML = "";

  board.forEach((value, index) => {
    boardEl.appendChild(createBoardCell(index, value));
  });

  setStatus(gameActive ? `Player ${currentPlayer} Turn` : "Saved match loaded");
  if (gameActive) {
    startTurnTimer();
    if (gameMode === "ai" && currentPlayer === aiSymbol) {
      scheduleAIMove();
    }
  } else {
    clearInterval(turnTimer);
    timerTextEl.textContent = `${turnTime}s`;
  }
  updateMatchPresentation();

  return true;
}

function setStatus(text) {
  statusEl.textContent = text;
  updateTurnPresentation();
}

function getPersonalityPresentation(personality = selectedAvatar) {
  const presentations = {
    human: { name: "Human-like", symbol: "◉", color: "#27dbe5", description: "Balanced, adaptable, and tactically sensible." },
    aggressive: { name: "Aggressive", symbol: "↯", color: "#ff8a5d", description: "Creates pressure and forcing choices." },
    defensive: { name: "Defensive", symbol: "◈", color: "#48bff5", description: "Patient, resilient, and hard to crack." },
    trickster: { name: "Trickster", symbol: "◌", color: "#9a7dff", description: "Finds the consequence behind the tempting move." }
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
  document.getElementById("nextLevelMeta").textContent = `${getPersonalityPresentation(nextLevel.personality).name} · ${nextLevel.difficulty}`;
  document.getElementById("homeStats").textContent = `${summary.wins} wins · ${summary.bestStreak} best streak`;
}

function updateSymbolScreen() {
  const definition = getLevelDefinition(selectedLevel);
  const personality = getPersonalityPresentation(definition.personality);
  document.getElementById("symbolLevelLabel").textContent = `Level ${definition.number} · ${personality.name}`;
  document.getElementById("symbolTitle").textContent = definition.name;
  document.getElementById("symbolLesson").textContent = definition.strategicLesson;
}

function updateMatchPresentation() {
  const definition = getLevelDefinition(selectedLevel);
  const isAI = gameMode === "ai";
  const personality = getPersonalityPresentation(isAI ? selectedAvatar : "human");
  const opponentCard = document.getElementById("opponentCard");
  opponentCard.style.setProperty("--personality", personality.color);
  document.getElementById("opponentEmblem").textContent = isAI ? personality.symbol : "◫";
  document.getElementById("thinkingEmblem").textContent = isAI ? personality.symbol : "◫";
  document.getElementById("opponentKicker").textContent = isAI ? "Tactical Opponent" : "Local Duel";
  document.getElementById("opponentName").textContent = isAI ? personality.name : "Two Players";
  document.getElementById("opponentLesson").textContent = isAI ? `Level ${definition.number} · ${definition.name}` : "Pass the board and play face to face.";
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
  document.getElementById("playerSymbolDisplay").textContent = gameMode === "ai" ? playerSymbol : currentPlayer;
  document.getElementById("gameLevelNumber").textContent = isAI ? `Level ${definition.number}` : "Classic";
  document.getElementById("gameLesson").textContent = isAI ? definition.name : "Three in a row wins";
  updateTurnPresentation();
}

function updateTurnPresentation() {
  const turnPill = document.getElementById("turnPill");
  const turnLabel = document.getElementById("turnLabel");
  const turnMark = document.getElementById("turnMark");
  const playerTurn = document.getElementById("playerTurnDisplay");
  const isAI = gameMode === "ai";
  const aiTurn = isAI && currentPlayer === aiSymbol;
  const localLabel = isAI ? (aiTurn ? "AI Turn" : "Your Turn") : `Player ${currentPlayer} Turn`;
  if (!turnPill || !turnLabel || !turnMark) return;
  turnPill.classList.toggle("ai-turn", aiTurn);
  turnLabel.textContent = gameActive ? localLabel : statusEl.textContent;
  turnMark.textContent = currentPlayer;
  playerTurn.textContent = gameActive ? (isAI ? (aiTurn ? "AI thinking" : "Your turn") : `Player ${currentPlayer}`) : statusEl.textContent;
  emitGameFeelEvent(aiTurn ? "ai_turn" : "player_turn", { currentPlayer });
}

function startTwoPlayer() {
  clearSavedMatch();
  gameMode = "two";
  playerSymbol = "X";
  aiSymbol = "O";
  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");
  resetBoard();
  updateMatchPresentation();
  startTurnTimer();
}

function startVsAI() {
  clearSavedMatch();
  gameMode = "ai";
  applyLevelDefinition(unlockedLevel);
  updateHomeDashboard();

  document.getElementById("menu").classList.remove("active");
  hideHubBackBtn();
  showLevels();
}

function showLevels() {
  hideAllScreens();
  hideHubBackBtn();
  const levelBox = document.getElementById("levels");
  const levelButtons = document.getElementById("levelButtons");

  levelButtons.innerHTML = "";

  for (let i = 1; i <= maxLevel; i += 1) {
    const btn = document.createElement("button");
    const definition = getLevelDefinition(i);
    btn.innerHTML = `<span class="level-number">${i}</span><span class="level-copy"><strong>${definition.name}</strong><span>${definition.strategicLesson}</span><small>${getPersonalityPresentation(definition.personality).name} · ${definition.difficulty}</small></span><b class="level-state"></b>`;
    btn.title = `${definition.band} · ${definition.strategicLesson}`;
    const completed = metaProgress.levels.completed.includes(i);
    if (completed) btn.classList.add("completed");
    btn.querySelector(".level-state").textContent = completed ? "Complete" : "Play";

    if (i > unlockedLevel) {
      btn.classList.add("locked");
      btn.setAttribute("aria-disabled", "true");
      btn.querySelector(".level-state").textContent = `Lock · ${i - 1}`;
      btn.addEventListener("click", () => {
        restartAnimation(btn, "locked-feedback");
        showGameToast("Challenge locked", `Complete Level ${i - 1} to continue.`, "locked");
        emitGameFeelEvent("locked", { level: i });
        haptic(10);
      });
    } else {
      btn.addEventListener("click", () => {
        restartAnimation(btn, "selected-feedback");
        emitGameFeelEvent("level_select", { level: i });
        setTimeout(() => selectLevel(i), 130);
      });
    }

    levelButtons.appendChild(btn);
  }

  levelBox.classList.add("active");
}

function selectLevel(lvl) {
  clearSavedMatch();
  applyLevelDefinition(lvl);

  document.getElementById("levels").classList.remove("active");
  document.getElementById("symbolSelect").classList.add("active");
  updateSymbolScreen();
}

function selectAvatar() {
  clearSavedMatch();
  applyLevelDefinition(selectedLevel);
  document.getElementById("avatars").classList.remove("active");
  document.getElementById("symbolSelect").classList.add("active");
}

function chooseSymbol(symbol) {
  clearSavedMatch();
  applyLevelDefinition(selectedLevel);
  playerSymbol = symbol;
  aiSymbol = symbol === "X" ? "O" : "X";

  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");

  resetBoard();
  updateMatchPresentation();
  startTurnTimer();

  if (currentPlayer === aiSymbol) {
    scheduleAIMove();
  }
}

function backToLevelsFromSymbol() {
  showLevels();
}

function resetBoard() {
  clearPendingAIWork();
  matchObjectives = createMatchObjectives();
  beginMatchContext();
  board = Array(9).fill("");
  gameActive = true;
  currentPlayer = "X";
  boardEl.innerHTML = "";
  document.querySelector(".board-shell")?.classList.remove("has-win", "win-impact", "draw-complete", "win-row-top", "win-row-middle", "win-row-bottom", "win-col-left", "win-col-middle", "win-col-right", "win-diagonal-main", "win-diagonal-cross");

  setStatus(`Player ${currentPlayer} Turn`);
  timerTextEl.textContent = `${turnTime}s`;

  board.forEach((_, index) => {
    boardEl.appendChild(createBoardCell(index));
  });
  updateMatchPresentation();
}

function makeMove(index) {
  if (!gameActive || board[index] || (gameMode === "ai" && currentPlayer === aiSymbol)) {
    const cell = boardEl.children[index];
    if (cell) restartAnimation(cell, "invalid-move");
    emitGameFeelEvent("invalid_move", { index });
    haptic(8);
    return;
  }

  const tracksObjectives = gameMode === "ai" && currentPlayer === playerSymbol;
  const blocksImmediateThreat = tracksObjectives && getWinningMoves(board, aiSymbol).includes(index);
  const preventsFork = tracksObjectives && getForkMoves(board, aiSymbol).includes(index);
  const createsFork = tracksObjectives && getForkMoves(board, playerSymbol).includes(index);

  board[index] = currentPlayer;
  if (tracksObjectives) {
    matchObjectives.blockedThreat ||= blocksImmediateThreat;
    matchObjectives.preventedFork ||= preventsFork;
    matchObjectives.createdFork ||= createsFork;
  }
  const cell = boardEl.children[index];
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer);
  cell.setAttribute("aria-label", `Cell ${index + 1}: ${currentPlayer}`);
  restartAnimation(cell, currentPlayer === "X" ? "piece-in-x" : "piece-in-o");
  emitGameFeelEvent("piece_place", { symbol: currentPlayer, actor: "player" });
  haptic(10);

  if (checkWin()) return;

  if (board.every((value) => value !== "")) {
    draw();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setStatus(`Player ${currentPlayer} Turn`);
  startTurnTimer();

  if (gameMode === "ai" && currentPlayer === aiSymbol) {
    scheduleAIMove();
  }
}

function startTurnTimer() {
  clearInterval(turnTimer);

  let timeLeft = turnTime;
  timerTextEl.textContent = `${timeLeft}s`;

  turnTimer = setInterval(() => {
    timeLeft -= 1;
    timerTextEl.textContent = `${timeLeft}s`;

    if (timeLeft > 0 && timeLeft <= 3) emitGameFeelEvent("timer_warning", { seconds: timeLeft });

    if (timeLeft > 0 || !gameActive) {
      return;
    }

    clearInterval(turnTimer);

    if (gameMode === "ai" && currentPlayer === aiSymbol) {
      aiMove();
      return;
    }

    setStatus(`${currentPlayer} ran out of time`);
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    setStatus(`Player ${currentPlayer} Turn`);
    startTurnTimer();

    if (gameMode === "ai" && currentPlayer === aiSymbol) {
      scheduleAIMove();
    }
  }, 1000);
}

function aiMove() {
  setThinkingState(false);
  if (!gameActive) return;
  if (currentPlayer !== aiSymbol) return;

  const move = getAIMoveByLevel();
  if (move === null || move === undefined) return;

  playMoveFromAI(move);
}

function playMoveFromAI(index) {
  if (board[index]) {
    const fallback = board.findIndex((v) => v === "");
    if (fallback === -1) return;
    makeMoveFromSymbol(fallback, aiSymbol);
    return;
  }

  makeMoveFromSymbol(index, aiSymbol);
}

function makeMoveFromSymbol(index, symbol) {
  if (!gameActive || board[index]) return;

  board[index] = symbol;
  const cell = boardEl.children[index];
  cell.textContent = symbol;
  cell.classList.add(symbol);
  cell.setAttribute("aria-label", `Cell ${index + 1}: ${symbol}`);
  restartAnimation(cell, symbol === "X" ? "piece-in-x" : "piece-in-o");
  emitGameFeelEvent("piece_place", { symbol, actor: "ai" });

  if (checkWin()) return;

  if (board.every((value) => value !== "")) {
    draw();
    return;
  }

  currentPlayer = symbol === "X" ? "O" : "X";
  setStatus(`Player ${currentPlayer} Turn`);
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
  const aiWins = getWinningMoves(state, aiSymbol);
  const playerWins = getWinningMoves(state, playerSymbol);
  const playerForks = getForkMoves(state, playerSymbol);
  const recognizedWin = aiWins.length > 0 && Math.random() < profile.winAwareness;
  const recognizedBlock = playerWins.length > 0 && Math.random() < profile.blockAwareness;

  return legal.map((move) => {
    const next = playOnBoard(state, move, aiSymbol);
    const createsFork = getForkMoves(state, aiSymbol).includes(move);
    const blocksFork = playerForks.includes(move);
    const pressure = getWinningMoves(next, aiSymbol).length;
    const playerCounterThreats = getWinningMoves(next, playerSymbol).length;

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
  if (winner === aiSymbol) return 10;
  if (winner === playerSymbol) return -10;
  const legal = getLegalMoves(state);
  if (legal.length === 0) return 0;

  const key = `${state.join("")}:${turnSymbol}`;
  if (memo.has(key)) return memo.get(key);
  const maximizing = turnSymbol === aiSymbol;
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
  const profile = getStrengthProfile(level);
  const personality = AI_PERSONALITIES[selectedAvatar] ? selectedAvatar : "human";
  const legal = getLegalMoves(board);
  if (legal.length === 0) return null;

  const candidates = getTacticalCandidates(board, profile);
  if (profile.optimal) {
    const memo = new Map();
    const scored = candidates.map((candidate) => ({
      ...candidate,
      outcome: solvePosition(playOnBoard(board, candidate.move, aiSymbol), playerSymbol, memo),
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

function checkWin() {
  clearInterval(turnTimer);

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      [a, b, c].forEach((idx) => boardEl.children[idx].classList.add("win"));
      const boardShell = document.querySelector(".board-shell");
      boardShell?.classList.add("has-win", getWinLineClass(pattern));
      restartAnimation(boardShell, "win-impact");

      emitGameFeelEvent("win_line", { winner: currentPlayer, pattern });
      haptic([14, 45, 24]);

      matchObjectives.completed = true;
      matchObjectives.won = gameMode !== "ai" ? true : currentPlayer === playerSymbol;
      gameActive = false;
      setStatus(`Player ${currentPlayer} Wins`);
      updateScore();

      const playerWon = gameMode !== "ai" ? true : currentPlayer === playerSymbol;
      finalizeMatch(playerWon ? "win" : "loss");
      scheduleResult(playerWon, false, 600);

      return true;
    }
  }

  return false;
}

function draw() {
  clearInterval(turnTimer);
  gameActive = false;
  matchObjectives.completed = true;
  matchObjectives.draw = true;
  finalizeMatch("draw");

  document.querySelector(".board-shell")?.classList.add("draw-complete");

  setStatus("Draw");
  scheduleResult(false, true, 500);
}

function updateScore() {
  if (currentPlayer === "X") {
    scoreX += 1;
  } else {
    scoreO += 1;
  }

  document.getElementById("scoreX").textContent = String(scoreX);
  document.getElementById("scoreO").textContent = String(scoreO);

  localStorage.setItem("scoreX", String(scoreX));
  localStorage.setItem("scoreO", String(scoreO));

  if (gameMode === "ai" && currentPlayer === playerSymbol) {
    if (level >= unlockedLevel && unlockedLevel < maxLevel) {
      unlockedLevel += 1;
      localStorage.setItem("unlockedLevel", String(unlockedLevel));
    }
  }
}

function resetScores() {
  scoreX = 0;
  scoreO = 0;

  localStorage.setItem("scoreX", "0");
  localStorage.setItem("scoreO", "0");

  document.getElementById("scoreX").textContent = "0";
  document.getElementById("scoreO").textContent = "0";
}

function restartGame() {
  emitGameFeelEvent("reset");
  clearSavedMatch();
  clearPendingAIWork();
  document.getElementById("resultModal").classList.remove("active");
  resetBoard();
  startTurnTimer();

  if (gameMode === "ai" && currentPlayer === aiSymbol) {
    scheduleAIMove();
  }
}

function backToMenu() {
  clearInterval(turnTimer);
  clearPendingAIWork();
  if (document.getElementById("game").classList.contains("active")) {
    saveMatchSnapshot();
  }
  document.getElementById("resultModal").classList.remove("active");
  showHomeScreen();
}

function showResult(won, isDraw = false) {
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
    detail.textContent = gameMode === "ai" && level >= 17 ? "Strong defense preserved the best available result." : "No winning line remained. Try a new tactical plan.";
    nextBtn.style.display = "none";
    emitGameFeelEvent("draw");
    duckMusic();
    return;
  }

  if (gameMode === "two") {
    modal.classList.add("victory");
    kicker.textContent = "Local Duel Complete";
    title.textContent = `Player ${currentPlayer} Wins`;
    detail.textContent = "A clear tactical line decided the match.";
    nextBtn.style.display = "none";
    emitGameFeelEvent("victory");
    duckMusic();
    return;
  }

  if (won) {
    modal.classList.add("victory");
    kicker.textContent = level < maxLevel ? "Challenge Complete" : "Master Tactician";
    title.textContent = "You Win";
    const next = level < maxLevel ? getLevelDefinition(level + 1) : null;
    detail.textContent = next ? `Level ${next.number} unlocked: ${next.name}.` : "You completed the full tactical mastery path.";
    nextBtn.style.display = level < maxLevel ? "inline-block" : "none";
    emitGameFeelEvent("victory");
    duckMusic();
  } else {
    modal.classList.add("defeat");
    kicker.textContent = "The Opponent Found The Answer";
    title.textContent = "You Lost";
    detail.textContent = "Read the final line, adjust your plan, and try again.";
    nextBtn.style.display = "none";
    emitGameFeelEvent("defeat");
    duckMusic();
  }
}

function nextLevel() {
  emitGameFeelEvent("next_level");
  document.getElementById("resultModal").classList.remove("active");
  clearSavedMatch();
  clearPendingAIWork();
  if (selectedLevel < maxLevel) {
    applyLevelDefinition(selectedLevel + 1);
  }
  resetBoard();
  startTurnTimer();

  if (currentPlayer === aiSymbol) {
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
window.restartGame = restartGame;
window.backToMenu = backToMenu;
window.nextLevel = nextLevel;
window.goHome = goHome;
window.backToHome = backToHome;

showHomeScreen();
const savedMatch = getSavedMatch();
if (savedMatch) {
  const wantsResume = window.confirm("Continue your saved Tic Tac Toe game?");
  if (wantsResume && !restoreSavedMatch(savedMatch)) {
    clearSavedMatch();
  }
  if (!wantsResume) {
    clearSavedMatch();
  }
}

window.addEventListener("load", () => {
  document.getElementById("loadingScreen")?.classList.add("loaded");
});

window.addEventListener("tictactoe:feel", (event) => playAudioEffect(event.detail.type, event.detail));

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
syncAudioSettingsUI();
