import { GRID_COLUMNS, GRID_ROWS, cloneGrid, createEmptyGrid, gridsEqual } from "./grid.js";
import { loadBestScore, saveBestScore } from "./state.js";
import { createPuzzleManager } from "./js/puzzle/puzzleManager.js";
import { createThemeManager } from "./js/theme/themeManager.js";
import { createThemeEffects } from "./js/theme/themeEffects.js";
import { THEME_DEFINITIONS, getThemeById } from "./js/theme/themes.js";

const SHOT_TRAVEL_MS = 200;
const SHOT_EASING = "cubic-bezier(0.2, 0.95, 0.2, 1)";
const MODES = [
  { id: "classic", label: "Classic", homeLabel: "Classic Mode" },
  { id: "speed", label: "Speed", homeLabel: "Speed Mode" },
  { id: "puzzle", label: "Puzzle", homeLabel: "Puzzle Mode" },
  { id: "chaos", label: "Chaos", homeLabel: "Chaos Mode" },
  { id: "solo", label: "Solo", homeLabel: "Solo Mode" }
];
const LEVEL_COUNT = 100;
const LEVEL_UNLOCK_KEY = "gamehub_2048_unlocked_level_v2";
const LEVEL_SELECTED_KEY = "gamehub_2048_selected_level_v2";
const MODE_LEVEL_PROGRESS_KEY_PREFIX = "gamehub_2048_mode_level_progress_v1_";
const SFX_ENABLED_KEY = "gamehub_2048_sfx_enabled_v1";
const MUSIC_ENABLED_KEY = "gamehub_2048_music_enabled_v1";
const SESSION_MODIFIER_STORAGE_KEY = "gamehub_2048_session_modifier_v1";
const POWER_BALANCE_STORAGE_KEY = "gamehub_2048_power_balance_v1";
const POWER_INVENTORY_STORAGE_KEY = "gamehub_2048_power_inventory_v1";
const STORAGE_RESET_VERSION_KEY = "gamehub_2048_storage_reset_version_v1";
const STORAGE_RESET_VERSION = "2026-05-02-full-reset-v2";
const MERGE_SFX_URL = "./assets/audio/merge.wav";
const BLOCKER_TILE = -1;
const MOMENTUM_THRESHOLDS = Object.freeze([0, 26, 56, 82]);
const SESSION_MODIFIERS = Object.freeze([
  {
    id: "high-fours",
    title: "Today: Power Starts",
    subtitle: "Higher chance of 4+ tiles.",
    scoreMultiplier: 1.02,
    calm: false,
    ammoBoost: 0.18
  },
  {
    id: "fast-scoring",
    title: "Today: Fast Scoring",
    subtitle: "Score gains are boosted.",
    scoreMultiplier: 1.2,
    calm: false,
    ammoBoost: 0.08
  },
  {
    id: "calm-mode",
    title: "Today: Calm Mode",
    subtitle: "Slower pressure and steadier flow.",
    scoreMultiplier: 1.06,
    calm: true,
    ammoBoost: 0.12
  }
]);
const COMBO_CELEBRATIONS = Object.freeze([
  { min: 2, label: "NICE" },
  { min: 4, label: "GREAT" },
  { min: 6, label: "AMAZING" },
  { min: 8, label: "INSANE" }
]);
const POWER_UPS = Object.freeze([
  {
    id: "rewind",
    icon: "&#8630;",
    name: "Time Rewind",
    price: 1350,
    description: "Step back one move per tap with a slick rewind pulse.",
    target: "instant",
    rarity: "Legendary",
    effect: "Undo the latest move each time you tap it.",
    shopTag: "Safety Net",
    accentA: "#79e5ff",
    accentB: "#4c62ff"
  },
  {
    id: "breaker",
    icon: "&#128165;",
    name: "Tile Breaker",
    price: 1250,
    description: "Remove one tile, except the current highest tile.",
    target: "tile",
    rarity: "Rare",
    effect: "Delete a blocking tile with precision.",
    shopTag: "Precision",
    accentA: "#ffb07c",
    accentB: "#ff5b6f"
  },
  {
    id: "merge-boost",
    icon: "&#8649;",
    name: "Merge Boost",
    price: 980,
    description: "Force a selected tile to merge with its nearest match.",
    target: "tile",
    rarity: "Epic",
    effect: "Snap a tile into its nearest matching merge.",
    shopTag: "Combo Tool",
    accentA: "#9bf5aa",
    accentB: "#43d9ff"
  },
  {
    id: "freeze-time",
    icon: "&#10052;",
    name: "Freeze Time",
    price: 1500,
    description: "Freeze pressure and skip AI turns for 3 player moves.",
    target: "instant",
    rarity: "Epic",
    effect: "Earn 3 pressure-free player moves.",
    shopTag: "Control",
    accentA: "#baf0ff",
    accentB: "#6ea6ff"
  },
  {
    id: "wild-tile",
    icon: "&#10022;",
    name: "Wild Tile",
    price: 1650,
    description: "Your next shot becomes a wild tile that fuses with any neighbor.",
    target: "instant",
    rarity: "Mythic",
    effect: "Your next shot merges with any neighbor.",
    shopTag: "Wildcard",
    accentA: "#ffe78a",
    accentB: "#ff9f5a"
  },
  {
    id: "smart-shuffle",
    icon: "&#8646;",
    name: "Smart Shuffle",
    price: 920,
    description: "Rearrange the board into a safer, merge-friendly shape.",
    target: "instant",
    rarity: "Rare",
    effect: "Rebuild the board into a safer layout.",
    shopTag: "Recovery",
    accentA: "#93f4ff",
    accentB: "#34c8b6"
  },
  {
    id: "lock-tile",
    icon: "&#128274;",
    name: "Lock Tile",
    price: 900,
    description: "Keep one tile anchored in place for 3 turns.",
    target: "tile",
    rarity: "Rare",
    effect: "Anchor a valuable tile for 3 turns.",
    shopTag: "Defense",
    accentA: "#d7b7ff",
    accentB: "#7784ff"
  },
  {
    id: "evolve-tile",
    icon: "&#11014;",
    name: "Evolve Tile",
    price: 1120,
    description: "Upgrade a selected tile one tier instantly.",
    target: "tile",
    rarity: "Epic",
    effect: "Upgrade a chosen tile by one tier.",
    shopTag: "Growth",
    accentA: "#ffe09a",
    accentB: "#f36dff"
  }
]);
const LEVEL_SCENE_BACKGROUNDS = Object.freeze([
  "linear-gradient(135deg, #FFF0F5, #FFE4E1)",
  "linear-gradient(125deg, #E6F0FA, #FDE8E0)",
  "radial-gradient(circle at 10% 30%, #FDE2E4, #FAD2E1)",
  "linear-gradient(112deg, #FFE9C4, #FFD6A5)",
  "conic-gradient(from 90deg, #FEE3B5, #FFC7A2, #FFB08C)",
  "radial-gradient(ellipse at 70% 20%, #FFDEE9, #B5FFFC)",
  "linear-gradient(145deg, #D4F1F9, #FFE0F0, #FFCCA7)",
  "repeating-linear-gradient(45deg, #FFF2E6 0px, #FFE0C0 30px, #FFD9B5 30px, #FFC9A5 60px)",
  "linear-gradient(135deg, #FBC2EB, #A6C1EE, #84FAB0)",
  "radial-gradient(circle at 30% 40%, #FFD194, #70E1F5)",
  "conic-gradient(from 0deg, #FFC3A0, #FFAFB0, #D6A2E8)",
  "linear-gradient(115deg, #CDEFFF, #A1B5D8, #FFC6D9)",
  "radial-gradient(circle at 60% 30%, #F9D976, #F39F86, #B2F0E5)",
  "repeating-radial-gradient(circle at 20% 40%, #FFDEE9, #FFD1E8 40px, #C9E4DE 80px)",
  "linear-gradient(95deg, #FAD0C4, #FFD1FF, #C9E4DE)",
  "conic-gradient(from 135deg, #F0F3BD, #F9B5AC, #EEB5EB, #B0E0E6)",
  "radial-gradient(ellipse at 80% 10%, #FFB347, #FF8C42, #F3A683)",
  "linear-gradient(160deg, #2b1b3a, #1f2b4e, #2c3e5c, #c471ed)",
  "radial-gradient(circle at 10% 30%, #0f0c29, #302b63, #24243e, #c94b4b)",
  "conic-gradient(from 60deg, #3a1c71, #d76d77, #ffaf7b)",
  "linear-gradient(112deg, #0b0f1a, #1e2a3a, #2c5364, #ffb347)",
  "radial-gradient(ellipse at 60% 50%, #ffecd2, #fcb69f, #6a11cb)",
  "repeating-linear-gradient(60deg, #fbc2eb 0px, #a6c1ee 30px, #fbc2eb 60px, #84fab0 90px)",
  "conic-gradient(from 200deg, #f6d365, #fda085, #f093fb, #f5576c)",
  "linear-gradient(105deg, #0f2027, #203a43, #2c5364, #e2b0ff)",
  "radial-gradient(circle at 90% 20%, #ff9a9e, #fecfef, #a1c4fd)",
  "conic-gradient(from 30deg, #ff6a88, #ff99ac, #d397fc, #6e45e2)",
  "linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb49)",
  "repeating-conic-gradient(from 45deg, #FFB88C 0deg 30deg, #DE6262 30deg 60deg, #FFB88C 60deg 90deg)",
  "radial-gradient(circle at 40% 50%, #f5af19, #f12711, #b721ff, #21d4fd)",
  "linear-gradient(125deg, #ff0844, #ffb199, #00c6fb)",
  "conic-gradient(from 0deg at 50% 50%, #f9d423, #f83600, #4facfe, #00f2fe)",
  "repeating-linear-gradient(45deg, #FFE0F0, #FFC8DD, #B5E3FF, #C0F0E8)",
  "radial-gradient(ellipse at 20% 30%, #ffdde1, #ee9ca7), repeating-linear-gradient(0deg, #ffdde1 0px, #c9e4de 20px)",
  "linear-gradient(135deg, #ff9a9e, #fad0c4, #a1c4fd)",
  "conic-gradient(from 90deg, #ffb347, #ffcc33, #4facfe, #43e97b)",
  "radial-gradient(circle at 10% 70%, #f6d365, #fda085), repeating-linear-gradient(90deg, #a6c1ee 0px, #fbc2eb 40px)",
  "linear-gradient(35deg, #2b5876, #4e4376, #f0a6ca, #f5b7b1)",
  "conic-gradient(from 0deg, #FFC371, #FF5F6D, #D3CCE3, #A1FFCE)",
  "repeating-radial-gradient(circle at 30% 40%, #FBC2EB, #FF9A9E 40px, #A6C1EE 80px, #84FAB0 120px)",
  "linear-gradient(225deg, #16222A, #3A6072, #C471ED, #F64F59)",
  "conic-gradient(from 70deg, #f12711, #f5af19, #b721ff, #21d4fd)",
  "radial-gradient(circle at 70% 20%, #ffd194, #70e1f5), linear-gradient(45deg, #ff9a9e, #fad0c4)",
  "repeating-linear-gradient(0deg, #ffb7b2, #ffd6a5, #fdfd97, #9bf6ff, #b5ead7)",
  "conic-gradient(from 150deg, #FFB88C, #DE6262, #FFB88C, #FF9A9E, #A6C1EE)",
  "radial-gradient(ellipse at 30% 70%, #ffe259, #ffa751), repeating-linear-gradient(45deg, #fbc2eb 0px, #a18cd1 25px)",
  "linear-gradient(125deg, #ff0844, #ffb199, #00c6fb, #1e3c72)",
  "conic-gradient(from 30deg, #F2994A, #F2C94C, #6A11CB, #2575FC, #F2994A)",
  "radial-gradient(circle at 40% 50%, #f5af19, #f12711, #f5af19, #b721ff)",
  "repeating-conic-gradient(from 30deg, #f093fb 0deg 30deg, #f5576c 30deg 60deg, #4facfe 60deg 90deg, #43e97b 90deg 120deg)"
]);
const LEVEL_SCENE_EFFECTS = Object.freeze({
  31: { backgroundSize: "200% 200%", animation: "gradientShift 8s infinite" },
  32: { backgroundSize: "300% 300%", animation: "gradientShift 10s infinite" },
  33: { backgroundSize: "300% 300%", animation: "cosmicDrift 12s infinite alternate" },
  34: { backgroundBlendMode: "soft-light", backgroundSize: "400% 400%", animation: "gradientShift 11s infinite" },
  35: { backgroundSize: "250% 250%", animation: "gradientShift 9s infinite" },
  36: { backgroundSize: "200% 200%", animation: "gradientShift 10s infinite" },
  37: { backgroundBlendMode: "difference", backgroundSize: "300% 300%", animation: "cosmicDrift 15s infinite" },
  38: { backgroundSize: "400% 400%", animation: "gradientShift 13s infinite" },
  39: { backgroundSize: "300% 300%", animation: "gradientShift 16s infinite" },
  40: { backgroundSize: "200% 200%", animation: "gradientShift 18s infinite alternate" },
  41: { backgroundSize: "250% 250%", animation: "gradientShift 12s infinite" },
  42: { backgroundSize: "350% 350%", animation: "gradientShift 14s infinite" },
  43: { backgroundBlendMode: "screen", backgroundSize: "400% 400%", animation: "cosmicDrift 20s infinite" },
  44: { backgroundSize: "300% 300%", animation: "gradientShift 11s infinite" },
  45: { backgroundSize: "300% 300%", animation: "gradientShift 19s infinite" },
  46: { backgroundBlendMode: "overlay", backgroundSize: "350% 350%", animation: "cosmicDrift 13s infinite" },
  47: { backgroundSize: "500% 500%", animation: "gradientShift 15s infinite" },
  48: { backgroundSize: "200% 200%", animation: "gradientShift 17s infinite" },
  49: { backgroundSize: "400% 400%", animation: "gradientShift 22s infinite" },
  50: {
    backgroundSize: "300% 300%",
    animation: "cosmicDrift 21s infinite, gradientShift 8s infinite",
    boxShadow: "inset 0 0 80px rgba(255, 215, 0, 0.4)"
  }
});

const AI_TIERS = [
  { from: 1, to: 10, name: "Clueless Player", summary: "Random moves with no strategy.", depth: [0, 0], mistake: [0.8, 0.8], speed: [1300, 1200], weights: { score: 0.3, empty: 0.2 }, lookahead: 0, branch: 1, ammoSamples: 1, noise: 1.1 },
  { from: 11, to: 20, name: "Confused Player", summary: "Slight preference for safe moves, still mostly random.", depth: [1, 1], mistake: [0.62, 0.58], speed: [1140, 1060], weights: { score: 0.6, empty: 1.1, risk: 1.2 }, lookahead: 0.12, branch: 1, ammoSamples: 1, noise: 0.8 },
  { from: 21, to: 30, name: "Casual Player", summary: "Avoids obvious bad moves and seeks basic merges.", depth: [1, 1], mistake: [0.42, 0.38], speed: [1020, 960], weights: { score: 1.1, merge: 1.4, empty: 1.2, risk: 1.5 }, lookahead: 0.2, branch: 2, ammoSamples: 1, noise: 0.55 },
  { from: 31, to: 40, name: "Learner", summary: "Groups similar tiles with merge + empty-space awareness.", depth: [2, 2], mistake: [0.32, 0.28], speed: [920, 850], weights: { score: 1.5, merge: 1.8, empty: 1.9, risk: 1.8 }, lookahead: 0.35, branch: 2, ammoSamples: 2, noise: 0.42 },
  { from: 41, to: 50, name: "Average Player", summary: "Maintains order and avoids filling the grid too quickly.", depth: [2, 2], mistake: [0.22, 0.18], speed: [840, 760], weights: { score: 1.7, merge: 2.0, empty: 2.2, risk: 2.1, stability: 1.2 }, lookahead: 0.45, branch: 2, ammoSamples: 2, noise: 0.3 },
  { from: 51, to: 60, name: "Smart Player", summary: "Uses corner strategy with monotonicity + smoothness.", depth: [3, 3], mistake: [0.16, 0.14], speed: [730, 650], weights: { score: 1.9, merge: 2.2, empty: 2.4, mono: 1.7, smooth: 1.1, corner: 2.6, risk: 2.3 }, lookahead: 0.56, branch: 2, ammoSamples: 2, noise: 0.22 },
  { from: 61, to: 70, name: "Advanced Player", summary: "Strong positioning with corner lock and merge chains.", depth: [3, 4], mistake: [0.11, 0.09], speed: [620, 560], weights: { score: 2.2, merge: 2.5, empty: 2.6, mono: 2.1, smooth: 1.5, corner: 2.9, chain: 1.6, risk: 2.5 }, lookahead: 0.68, branch: 2, ammoSamples: 2, noise: 0.14 },
  { from: 71, to: 80, name: "Expert", summary: "Predicts spawn impact and sets up combo chains.", depth: [4, 4], mistake: [0.06, 0.04], speed: [540, 500], weights: { score: 2.5, merge: 2.8, empty: 2.8, mono: 2.3, smooth: 1.8, corner: 3.2, chain: 2.2, stability: 1.7, risk: 2.8 }, lookahead: 0.78, branch: 3, ammoSamples: 3, noise: 0.09 },
  { from: 81, to: 90, name: "Master", summary: "Highly optimized play with weighted risk analysis.", depth: [5, 5], mistake: [0.03, 0.02], speed: [480, 440], weights: { score: 2.8, merge: 3.1, empty: 3.0, mono: 2.6, smooth: 2.0, corner: 3.4, chain: 2.6, stability: 2.0, risk: 3.2, max: 1.6 }, lookahead: 0.87, branch: 3, ammoSamples: 3, noise: 0.05 },
  { from: 91, to: 100, name: "God AI", summary: "Near-perfect structure with full board evaluation.", depth: [5, 6], mistake: [0.01, 0.0], speed: [420, 360], weights: { score: 3.2, merge: 3.3, empty: 3.2, mono: 2.9, smooth: 2.3, corner: 3.8, chain: 2.9, stability: 2.3, risk: 3.5, max: 1.9 }, lookahead: 0.96, branch: 3, ammoSamples: 3, noise: 0.02 }
];

const el = {
  home: document.querySelector("[data-home-screen]"),
  themes: document.querySelector("[data-theme-screen]"),
  powers: document.querySelector("[data-power-screen]"),
  levels: document.querySelector("[data-level-screen]"),
  game: document.querySelector("[data-game-screen]"),
  heroBoard: document.querySelector("[data-hero-board]"),
  playBtn: document.querySelector("[data-play-btn]"),
  resumeBtn: document.querySelector("[data-resume-btn]"),
  themeBtn: document.querySelector("[data-theme-btn]"),
  powerBtn: document.querySelector("[data-power-btn]"),
  themeBackBtn: document.querySelector("[data-theme-back-btn]"),
  powerBackBtn: document.querySelector("[data-power-back-btn]"),
  modeBtn: document.querySelector("[data-mode-btn]"),
  settingsBtn: document.querySelector("[data-settings-btn]"),
  settingsPanel: document.querySelector("[data-settings-panel]"),
  settingsCloseBtn: document.querySelector("[data-settings-close-btn]"),
  toggleSfxBtn: document.querySelector("[data-toggle-sfx-btn]"),
  toggleMusicBtn: document.querySelector("[data-toggle-music-btn]"),
  levelBackBtn: document.querySelector("[data-level-back-btn]"),
  startLevelBtn: document.querySelector("[data-start-level-btn]"),
  levelGrid: document.querySelector("[data-level-grid]"),
  themeGrid: document.querySelector("[data-theme-grid]"),
  powerGrid: document.querySelector("[data-power-grid]"),
  bestScoreTheme: document.querySelector("[data-best-score-theme]"),
  powerBalance: document.querySelector("[data-power-balance]"),
  unlockedLevel: document.querySelector("[data-unlocked-level]"),
  selectedLevel: document.querySelector("[data-selected-level]"),
  homeBtn: document.querySelector("[data-home-btn]"),
  overlayHomeBtn: document.querySelector("[data-overlay-home]"),
  overlayRestartBtn: document.querySelector("[data-overlay-restart]"),
  restartBtn: document.querySelector("[data-restart]"),
  soundBtn: document.querySelector("[data-sound-toggle]"),
  board: document.querySelector("[data-board]"),
  comboBanner: document.querySelector("[data-combo-banner]"),
  bestScoreHome: document.querySelector("[data-best-score-home]"),
  bestScoreLevel: document.querySelector("[data-best-score-level]"),
  gameBalance: document.querySelector("[data-game-balance]"),
  gameScore: document.querySelector("[data-game-score]"),
  ammoPlayerCurrent: document.querySelector("[data-current-ammo]"),
  ammoPlayerNext: document.querySelector("[data-next-ammo]"),
  ammoAiCurrent: document.querySelector("[data-ai-current-ammo]"),
  ammoAiNext: document.querySelector("[data-ai-next-ammo]"),
  aiLauncher: document.querySelector("[data-ai-launcher]"),
  targetValue: document.querySelector("[data-target-value]"),
  gameMode: document.querySelector("[data-game-mode]"),
  modeDetailWrap: document.querySelector("[data-mode-detail-wrap]"),
  modeDetail: document.querySelector("[data-mode-detail]"),
  puzzleBrief: document.querySelector("[data-puzzle-brief]"),
  puzzleZone: document.querySelector("[data-puzzle-zone]"),
  puzzleType: document.querySelector("[data-puzzle-type]"),
  puzzleStars: document.querySelector("[data-puzzle-stars]"),
  puzzleGoal: document.querySelector("[data-puzzle-goal]"),
  puzzleMoves: document.querySelector("[data-puzzle-moves]"),
  puzzleHintBtn: document.querySelector("[data-puzzle-hint-btn]"),
  puzzleRetryBtn: document.querySelector("[data-puzzle-retry-btn]"),
  powerDrawerBtn: document.querySelector("[data-power-drawer-btn]"),
  powerDrawer: document.querySelector("[data-power-drawer]"),
  powerDrawerCloseBtn: document.querySelector("[data-power-drawer-close-btn]"),
  powerDrawerGrid: document.querySelector("[data-power-drawer-grid]"),
  powerActiveCard: document.querySelector("[data-power-active-card]"),
  powerActiveCount: document.querySelector("[data-power-active-count]"),
  powerActiveIcon: document.querySelector("[data-power-active-icon]"),
  powerActiveName: document.querySelector("[data-power-active-name]"),
  powerActiveHint: document.querySelector("[data-power-active-hint]"),
  goalCallout: document.querySelector("[data-goal-callout]"),
  goalCalloutValue: document.querySelector("[data-goal-callout-value]"),
  goalCalloutCopy: document.querySelector("[data-goal-callout-copy]"),
  speedTimerWrap: document.querySelector("[data-speed-timer-wrap]"),
  speedTimerValue: document.querySelector("[data-speed-timer-value]"),
  powerTipPopup: document.querySelector("[data-power-tip-popup]"),
  powerTipTitle: document.querySelector("[data-power-tip-title]"),
  powerTipCopy: document.querySelector("[data-power-tip-copy]"),
  status: document.querySelector("[data-status]"),
  gameOverPanel: document.querySelector("[data-game-over-panel]"),
  gameOverKicker: document.querySelector("[data-game-over-kicker]"),
  gameOverTitle: document.querySelector("[data-game-over-title]"),
  gameOverCopy: document.querySelector("[data-game-over-copy]")
};

for (const [key, value] of Object.entries(el)) {
  if (!value) {
    throw new Error(`Missing UI element: ${key}`);
  }
}

resetGameStorageIfNeeded();

const state = {
  modeIndex: 0,
  modeProgress: loadAllModeLevelProgress(),
  bestScore: loadBestScore(),
  unlockedLevel: 1,
  selectedLevel: 1,
  activeLevel: 1,
  sfxEnabled: loadStoredBool(SFX_ENABLED_KEY, true),
  musicEnabled: loadStoredBool(MUSIC_ENABLED_KEY, true),
  settingsOpen: false,
  roundActive: false,
  roundFinished: false,
  roundResult: "",
  currentTurn: "player",
  timeLeftMs: 0,
  timerIntervalId: null,
  playerMovesLeft: null,
  lastChaosEvent: "",
  powerBalance: loadStoredNumber(POWER_BALANCE_STORAGE_KEY, 960),
  powerInventory: loadStoredInventory(),
  powerDrawerOpen: false,
  selectedPowerId: "",
  powerPreviewId: "",
  overlayAction: "restart",
  showGoalIntroPending: false,
  puzzleSession: null,
  sessionModifier: null,
  momentumPoints: 0,
  momentumLevel: 1,
  chainGoodMoves: 0,
  chainBoostArmed: false,
  assistCooldownTurns: 0,
  freezeTurns: 0,
  wildTileArmed: false,
  moveHistory: [],
  lockedTiles: [],
  magnetTurns: 0,
  flashTile: null,
  pendingRiskTileValue: null,
  turnIndex: 0,
  progressionMilestonesHit: new Set(),
  nearMissTimeoutId: null,
  nearMissCells: new Set()
};

applyModeProgress(getCurrentMode().id);
state.sessionModifier = loadSessionModifier();

const boardState = createBoardState(el.board, el.comboBanner);
const player = createActor("player", el.ammoPlayerCurrent, el.ammoPlayerNext);
const ai = createActor("ai", el.ammoAiCurrent, el.ammoAiNext);

let audioContext = null;
let sfxBusGain = null;
let bgmBusGain = null;
let bgmLoopIntervalId = null;
let bgmStep = 0;
let mergeSfxAudio = null;
let heroState = createHeroState();
let heroIntervalId = null;
let aiMoveTimeoutId = null;
let activeAiProfile = getAiProfileForLevel(state.selectedLevel);
const levelButtons = [];
const themeCards = [];
const powerCards = [];
const powerDrawerButtons = [];
const puzzleManager = createPuzzleManager();
const themeManager = createThemeManager();
const themeEffects = createThemeEffects({ getTheme: () => themeManager.getTheme() });

themeManager.subscribe(() => {
  renderMetaButtons();
  renderThemeScreen();
});

initialize();

function createBoardState(boardElement, comboElement) {
  return {
    rows: GRID_ROWS,
    cols: GRID_COLUMNS,
    grid: createEmptyGrid(GRID_ROWS, GRID_COLUMNS),
    score: 0,
    maxTile: 0,
    isAnimating: false,
    boardElement,
    comboElement,
    tileElements: [],
    cellElements: [],
    animationLayer: null,
    comboTimeoutId: null,
    feedbackTimeoutId: null,
    goalCalloutTimeoutId: null,
    powerTipTimeoutId: null,
    powerBannerUntil: 0,
    queuedBannerText: ""
  };
}

function resetGameStorageIfNeeded() {
  try {
    const storage = window.localStorage;
    if (storage.getItem(STORAGE_RESET_VERSION_KEY) === STORAGE_RESET_VERSION) {
      return;
    }

    const keysToClear = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && key.startsWith("gamehub_2048_")) {
        keysToClear.push(key);
      }
    }

    for (const key of keysToClear) {
      storage.removeItem(key);
    }

    storage.setItem(STORAGE_RESET_VERSION_KEY, STORAGE_RESET_VERSION);
  } catch (error) {
    // Ignore storage reset failures.
  }
}

function createActor(kind, currentAmmoElement, nextAmmoElement) {
  return {
    kind,
    currentAmmo: 2,
    nextAmmo: 2,
    score: 0,
    shotCount: 0,
    currentAmmoElement,
    nextAmmoElement
  };
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getSessionModifierById(id) {
  return SESSION_MODIFIERS.find((modifier) => modifier.id === id) || SESSION_MODIFIERS[0];
}

function loadSessionModifier() {
  const dateKey = getLocalDateKey();

  try {
    const raw = window.localStorage.getItem(SESSION_MODIFIER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.date === dateKey && parsed?.id) {
        return getSessionModifierById(parsed.id);
      }
    }
  } catch (error) {
    // Ignore parsing errors and rebuild modifier.
  }

  const index = hashString(dateKey) % SESSION_MODIFIERS.length;
  const modifier = SESSION_MODIFIERS[index];

  try {
    window.localStorage.setItem(SESSION_MODIFIER_STORAGE_KEY, JSON.stringify({ date: dateKey, id: modifier.id }));
  } catch (error) {
    // Ignore storage write failures.
  }

  return modifier;
}

function loadStoredNumber(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function loadStoredInventory() {
  const defaults = Object.fromEntries(POWER_UPS.map((power) => [power.id, 0]));

  try {
    const raw = window.localStorage.getItem(POWER_INVENTORY_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return defaults;
    }

    return POWER_UPS.reduce((inventory, power) => {
      inventory[power.id] = Math.max(0, Number(parsed[power.id] || 0));
      return inventory;
    }, { ...defaults });
  } catch (error) {
    return defaults;
  }
}

function savePowerState() {
  try {
    window.localStorage.setItem(POWER_BALANCE_STORAGE_KEY, String(Math.max(0, Math.round(state.powerBalance))));
    window.localStorage.setItem(POWER_INVENTORY_STORAGE_KEY, JSON.stringify(state.powerInventory));
  } catch (error) {
    // Ignore storage write failures.
  }
}

function getPowerById(powerId) {
  return POWER_UPS.find((power) => power.id === powerId) || null;
}

function formatCoins(value) {
  return Math.max(0, Math.round(Number(value) || 0)).toLocaleString();
}

function formatHudScore(value) {
  const safeValue = Math.max(0, Math.round(Number(value) || 0));
  if (safeValue < 10000) {
    return safeValue.toLocaleString();
  }

  if (typeof Intl !== "undefined" && Intl.NumberFormat) {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: safeValue >= 1000000 ? 1 : 0
    }).format(safeValue);
  }

  return formatCoins(safeValue);
}

function getOwnedPowerUpCount() {
  return POWER_UPS.reduce((sum, power) => sum + Number(state.powerInventory[power.id] || 0), 0);
}

function getPowerUseHint(powerId) {
  if (powerId === "rewind") {
    return "Tap to rewind one move at a time. Tap again to step back another move.";
  }

  if (powerId === "breaker") {
    return "Tap a particular number to break it from the board.";
  }

  if (powerId === "merge-boost") {
    return "Tap a number to merge it with the nearest matching block.";
  }

  if (powerId === "freeze-time") {
    return "Tap once to freeze AI pressure for your next 3 turns.";
  }

  if (powerId === "wild-tile") {
    return "Tap once to arm a wild shot that merges with any neighbor.";
  }

  if (powerId === "smart-shuffle") {
    return "Tap once to reshuffle the board into a safer pattern.";
  }

  if (powerId === "lock-tile") {
    return "Tap a particular number to lock it in place for 3 turns.";
  }

  if (powerId === "evolve-tile") {
    return "Tap a particular number to evolve it into the next value.";
  }

  return "Tap a power-up icon to use it in this run.";
}

function getPowerAnnouncementText(powerId) {
  const power = getPowerById(powerId);
  return power?.effect || "Power-Up Ready";
}

function getPowerAnnouncementCopy(powerId) {
  const power = getPowerById(powerId);
  if (!power) {
    return "Use this power-up to improve the board.";
  }

  return `${power.effect} ${getPowerUseHint(powerId)}`.trim();
}

function goToNextLevel() {
  const nextLevel = Math.min(LEVEL_COUNT, state.activeLevel + 1);
  if (nextLevel === state.activeLevel) {
    showHome();
    return;
  }

  state.selectedLevel = Math.min(state.unlockedLevel, nextLevel);
  persistCurrentModeProgress();
  startSelectedLevel();
}

function handleOverlayAction() {
  if (state.overlayAction === "next") {
    goToNextLevel();
    return;
  }

  restartLevel();
}

function showGoalCallout() {
  if (!el.goalCallout || !state.roundActive) {
    return;
  }

  let tileValue = "";
  let copy = "Reach this tile to win.";

  if (isPuzzleMode() && state.puzzleSession) {
    const goal = state.puzzleSession.config.goal || {};
    tileValue =
      goal.kind === "tile" ? formatBigInt(BigInt(Number(goal.target || 0))) :
      goal.kind === "score" ? Number(goal.target || 0).toLocaleString() :
      `${state.puzzleSession.level}`;
    copy = goal.text || "Solve this puzzle room.";
  } else if (isSpeedMode()) {
    tileValue = formatBigInt(getLevelTarget(state.activeLevel));
    copy = `Reach this tile before ${formatTimeLeft(getSpeedModeTimeLimit(state.activeLevel))} runs out.`;
  } else {
    tileValue = formatBigInt(getLevelTarget(state.activeLevel));
    copy = "Merge up to this block to clear the level.";
  }

  el.goalCalloutValue.textContent = tileValue;
  el.goalCalloutCopy.textContent = copy;
  el.goalCallout.classList.remove("hidden");
  el.goalCallout.classList.remove("is-visible");
  void el.goalCallout.offsetWidth;
  el.goalCallout.classList.add("is-visible");

  if (boardState.goalCalloutTimeoutId) {
    window.clearTimeout(boardState.goalCalloutTimeoutId);
  }

  boardState.goalCalloutTimeoutId = window.setTimeout(() => {
    el.goalCallout.classList.remove("is-visible");
    el.goalCallout.classList.add("hidden");
  }, 2000);
}

function hexToRgba(hex, alpha = 1) {
  const value = String(hex || "").trim();
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  let normalized = match[1];
  if (normalized.length === 3) {
    normalized = normalized.split("").map((char) => char + char).join("");
  }

  const parsed = Number.parseInt(normalized, 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeHue(value) {
  const hue = Number(value) || 0;
  return ((hue % 360) + 360) % 360;
}

function getThemeIndex(themeId) {
  return Math.max(0, THEME_DEFINITIONS.findIndex((theme) => theme.id === themeId));
}

function getThemePrestige(themeId) {
  return getThemeIndex(themeId) / Math.max(1, THEME_DEFINITIONS.length - 1);
}

function getThemeVariant(themeId) {
  if (/(neon|cyber|sky|synthwave|pixel)/.test(themeId)) {
    return "electric";
  }

  if (/(zen|moon|mono|ocean)/.test(themeId)) {
    return "soft";
  }

  if (/(magma|ember|midnight|desert)/.test(themeId)) {
    return "ember";
  }

  if (/(forest|coral)/.test(themeId)) {
    return "organic";
  }

  return "luxe";
}

function getThemeTierLabel(prestige) {
  if (prestige >= 0.94) {
    return "Mythic Finish";
  }

  if (prestige >= 0.78) {
    return "Legend Finish";
  }

  if (prestige >= 0.58) {
    return "Elite Finish";
  }

  if (prestige >= 0.34) {
    return "Signature Finish";
  }

  return "Core Finish";
}

function getThemeTempoLabel(theme) {
  const speed = Number(theme.animationProfile?.speed || 1);

  if (speed <= 0.84) {
    return "Fast Tempo";
  }

  if (speed <= 0.96) {
    return "Arcade Tempo";
  }

  if (speed >= 1.12) {
    return "Slow Drift";
  }

  return "Balanced Flow";
}

function getThemeFxLabel(theme) {
  const effects = theme.specialEffects || {};

  if (effects.explosion) {
    return "Burst FX";
  }

  if (effects.trail) {
    return "Trail FX";
  }

  if (effects.glow) {
    return "Glow FX";
  }

  return "Clean FX";
}

function getThemeMoodLabel(themeId) {
  const variant = getThemeVariant(themeId);

  if (variant === "electric") {
    return "Arcade Pulse";
  }

  if (variant === "soft") {
    return "Calm Atmosphere";
  }

  if (variant === "ember") {
    return "Heavy Contrast";
  }

  if (variant === "organic") {
    return "Living Color";
  }

  return "Luxe Surface";
}

function getThemeUiLook(theme) {
  const palette = theme.palette || {};
  const colors = theme.colors || {};
  const prestige = getThemePrestige(theme.id);
  const hueBase = normalizeHue(
    216 +
      Number(palette.hueShift || 0) +
      Number(palette.tileHueShift || 0) * 0.42 +
      getThemeIndex(theme.id) * 13
  );
  const baseSaturation = clamp(72 + prestige * 18 + Number(palette.saturationBoost || 0) * 0.2, 48, 98);
  const accentA = `hsl(${hueBase} ${baseSaturation}% ${clamp(62 - prestige * 8, 38, 70)}%)`;
  const accentB = `hsl(${normalizeHue(hueBase + 62 + prestige * 32)} ${clamp(baseSaturation + 8, 54, 99)}% ${clamp(54 - prestige * 4, 34, 64)}%)`;
  const glow = `hsla(${hueBase}, 96%, 68%, ${(0.2 + prestige * 0.26).toFixed(3)})`;
  const halo = `hsla(${normalizeHue(hueBase + 26)}, 98%, 74%, ${(0.16 + prestige * 0.22).toFixed(3)})`;

  return {
    prestige,
    accentA,
    accentB,
    glow,
    halo,
    variant: getThemeVariant(theme.id),
    tierLabel: getThemeTierLabel(prestige),
    motionLabel: getThemeTempoLabel(theme),
    fxLabel: getThemeFxLabel(theme),
    moodLabel: getThemeMoodLabel(theme.id),
    panelTop: colors.panelTop || "rgba(30, 40, 63, 0.96)",
    panelBottom: colors.panelBottom || "rgba(18, 24, 38, 0.96)",
    boardTop: colors.boardCellTop || "#151c2d",
    boardBottom: colors.boardCellBottom || "#090c14",
    textMain: colors.textMain || "#f3f6ff",
    textSoft: colors.textSoft || "#aab5cc"
  };
}

function applyThemeShowcaseStyles(element, theme) {
  if (!element) {
    return;
  }

  const look = getThemeUiLook(theme);
  element.dataset.themeVariant = look.variant;
  element.style.setProperty("--theme-accent-a", look.accentA);
  element.style.setProperty("--theme-accent-b", look.accentB);
  element.style.setProperty("--theme-accent-glow", look.glow);
  element.style.setProperty("--theme-accent-halo", look.halo);
  element.style.setProperty("--theme-surface-top", look.panelTop);
  element.style.setProperty("--theme-surface-bottom", look.panelBottom);
  element.style.setProperty("--theme-board-top", look.boardTop);
  element.style.setProperty("--theme-board-bottom", look.boardBottom);
  element.style.setProperty("--theme-card-text", look.textMain);
  element.style.setProperty("--theme-card-soft", look.textSoft);
  element.style.setProperty("--theme-prestige", look.prestige.toFixed(3));
}

function getPowerTargetLabel(power) {
  return power.target === "instant" ? "Instant Cast" : "Tile Target";
}

function getPowerActionLabel(power) {
  return power.target === "instant" ? "Activates on tap" : "Tap to arm";
}

function getThemeCoinPrice(theme) {
  return Math.max(0, Number(theme?.unlock?.target || 0));
}

function getThemeWinRequirement(theme) {
  return Math.max(0, Number(theme?.unlock?.wins || 0));
}

function getThemePriceMarkup(theme) {
  return `<span class="theme-card-price-main"><span class="theme-card-price-icon">&#128142;</span><span>${formatCoins(getThemeCoinPrice(theme))}</span></span>`;
}

function getPowerRarityWeight(rarity) {
  if (rarity === "Mythic") {
    return 4;
  }

  if (rarity === "Legendary") {
    return 3;
  }

  if (rarity === "Epic") {
    return 2;
  }

  return 1;
}

function applyPowerVisualStyles(element, power) {
  if (!element) {
    return;
  }

  const accentA = power.accentA || "#8cc8ff";
  const accentB = power.accentB || "#4f72ff";

  element.style.setProperty("--power-accent-a", accentA);
  element.style.setProperty("--power-accent-b", accentB);
  element.style.setProperty("--power-accent-glow", hexToRgba(accentA, 0.36));
  element.style.setProperty("--power-accent-halo", hexToRgba(accentB, 0.28));
  element.style.setProperty("--power-accent-soft", hexToRgba(accentA, 0.12));
  element.style.setProperty("--power-accent-line", hexToRgba(accentB, 0.46));
}

function getMomentumLevelFromPoints(points) {
  if (points >= MOMENTUM_THRESHOLDS[3]) {
    return 4;
  }
  if (points >= MOMENTUM_THRESHOLDS[2]) {
    return 3;
  }
  if (points >= MOMENTUM_THRESHOLDS[1]) {
    return 2;
  }
  return 1;
}

function clearNearMissMarks() {
  if (state.nearMissTimeoutId) {
    window.clearTimeout(state.nearMissTimeoutId);
    state.nearMissTimeoutId = null;
  }
  state.nearMissCells = new Set();
}

function resetRunDynamicSystems() {
  state.momentumPoints = 0;
  state.momentumLevel = 1;
  state.chainGoodMoves = 0;
  state.chainBoostArmed = false;
  state.assistCooldownTurns = 0;
  state.magnetTurns = 0;
  state.flashTile = null;
  state.pendingRiskTileValue = null;
  state.turnIndex = 0;
  state.progressionMilestonesHit = new Set();
  clearNearMissMarks();
}

function setMomentumPoints(nextPoints) {
  const safePoints = clamp(Math.round(nextPoints), 0, 100);
  const previousLevel = state.momentumLevel;
  state.momentumPoints = safePoints;
  state.momentumLevel = getMomentumLevelFromPoints(safePoints);

  if (state.momentumLevel > previousLevel && state.roundActive && !state.roundFinished) {
    showSystemBanner(`MOMENTUM x${state.momentumLevel}`);
  }
}

function updateMomentumByMerge(actor, mergeResult) {
  if (actor.kind !== "player") {
    return;
  }

  const mergeGain = 14 + Math.min(24, mergeResult.comboCount * 4) + Math.min(16, Math.log2(Math.max(2, mergeResult.maxMergedValue)));
  setMomentumPoints(state.momentumPoints + mergeGain);
  state.chainGoodMoves += 1;

  if (state.chainGoodMoves >= 3 && !state.chainBoostArmed) {
    state.chainBoostArmed = true;
    showSystemBanner("CHAIN BOOST READY");
  }
}

function decayMomentumForStall(actor) {
  if (actor.kind !== "player") {
    return;
  }

  const calmMod = state.sessionModifier?.calm ? 0.7 : 1;
  const decay = Math.round((18 + Math.max(0, state.momentumLevel - 1) * 5) * calmMod);
  setMomentumPoints(state.momentumPoints - decay);
  state.chainGoodMoves = 0;
}

function getComboCelebration(comboCount) {
  let selected = COMBO_CELEBRATIONS[0];
  for (const tier of COMBO_CELEBRATIONS) {
    if (comboCount >= tier.min) {
      selected = tier;
    }
  }
  return selected;
}

function getDynamicPlayerShotCap(maxTile = boardState.maxTile, activeLevel = state.activeLevel) {
  const safeTile = Math.max(2, maxTile || 2);
  const safeLevel = Math.max(1, Math.round(Number(activeLevel) || 1));
  const emergedCap = 2 ** Math.max(5, Math.floor(Math.log2(safeTile)) - 1);
  const levelCap = 2 ** Math.max(5, Math.min(30, safeLevel + 4));
  return Math.min(1073741824, Math.max(32, emergedCap, levelCap));
}

function getDynamicPlayerShotFloor(maxTile = boardState.maxTile, activeLevel = state.activeLevel) {
  const safeTile = Math.max(2, maxTile || 2);
  return 2 ** Math.max(1, Math.floor(Math.log2(safeTile)) - 6);
}

function getMergeOpportunityForColumn(grid, column, ammo) {
  const outcome = getShotOutcome(grid, column);
  if (outcome.type === "blocked" || outcome.row === null) {
    return null;
  }

  const row = outcome.row;
  const cells = [];
  const neighbors = [
    { row: row, col: column - 1 },
    { row: row, col: column + 1 },
    { row: row - 1, col: column },
    { row: row + 1, col: column }
  ];

  for (const neighbor of neighbors) {
    if (neighbor.row < 0 || neighbor.row >= grid.length || neighbor.col < 0 || neighbor.col >= grid[0].length) {
      continue;
    }
    if (grid[neighbor.row][neighbor.col] === ammo) {
      cells.push({ row: neighbor.row, col: neighbor.col });
    }
  }

  if (cells.length === 0) {
    return null;
  }

  cells.push({ row, col: column });
  return { column, cells };
}

function getMergeOpportunityColumns(grid, ammo) {
  const opportunities = [];
  for (let col = 0; col < grid[0].length; col += 1) {
    const hit = getMergeOpportunityForColumn(grid, col, ammo);
    if (hit) {
      opportunities.push(hit);
    }
  }
  return opportunities;
}

function triggerNearMissEffect(opportunities, chosenColumn) {
  const missed = opportunities.filter((item) => item.column !== chosenColumn);
  if (missed.length === 0) {
    return;
  }

  const marks = new Set();
  for (const item of missed) {
    for (const cell of item.cells) {
      marks.add(`${cell.row},${cell.col}`);
    }
  }

  if (marks.size === 0) {
    return;
  }

  clearNearMissMarks();
  state.nearMissCells = marks;
  state.nearMissTimeoutId = window.setTimeout(() => {
    state.nearMissCells = new Set();
    state.nearMissTimeoutId = null;
    renderBoard(boardState);
  }, 580);

  showSystemBanner("NEAR MISS");
}

function findRecoveryAssistSpawn(grid) {
  const empties = getEmptyCoordinates(grid);
  let best = null;

  for (const empty of empties) {
    const neighbors = [];
    const adjacent = [
      { row: empty.row, col: empty.col - 1 },
      { row: empty.row, col: empty.col + 1 },
      { row: empty.row - 1, col: empty.col },
      { row: empty.row + 1, col: empty.col }
    ];

    for (const spot of adjacent) {
      if (spot.row < 0 || spot.row >= grid.length || spot.col < 0 || spot.col >= grid[0].length) {
        continue;
      }

      const value = grid[spot.row][spot.col];
      if (value > 0 && value !== BLOCKER_TILE) {
        neighbors.push(value);
      }
    }

    if (neighbors.length === 0) {
      continue;
    }

    const target = Math.max(...neighbors);
    if (!best || target > best.value) {
      best = { row: empty.row, col: empty.col, value: target };
    }
  }

  return best;
}

function maybeApplyAlmostMagicRecovery(actor, mergeResult) {
  if (actor.kind !== "player" || mergeResult.scoreGained > 0) {
    return false;
  }

  if (state.assistCooldownTurns > 0) {
    state.assistCooldownTurns -= 1;
    return false;
  }

  const emptyCells = getEmptyCellCount(boardState.grid);
  if (emptyCells > 6 || Math.random() > 0.42) {
    return false;
  }

  const spawn = findRecoveryAssistSpawn(boardState.grid);
  if (!spawn) {
    return false;
  }

  boardState.grid[spawn.row][spawn.col] = spawn.value;
  boardState.maxTile = getMaxTile(boardState.grid);
  state.assistCooldownTurns = 3;
  showSystemBanner("ALMOST MAGIC");
  addTileEffectClass(boardState, spawn.row, spawn.col, "tile-spawn-pop");
  themeEffects.applySpawnEffect(getTileElement(boardState, spawn.row, spawn.col), spawn.value);
  return true;
}

function maybeAssignRiskTile(actor) {
  if (actor.kind !== "player") {
    state.pendingRiskTileValue = null;
    return;
  }

  const cap = getDynamicPlayerShotCap(boardState.maxTile, state.activeLevel);
  if (Math.random() > 0.08 || cap <= actor.nextAmmo || boardState.maxTile < 256) {
    state.pendingRiskTileValue = null;
    return;
  }

  const riskValue = Math.min(cap, actor.nextAmmo * 2);
  if (riskValue <= actor.nextAmmo) {
    state.pendingRiskTileValue = null;
    return;
  }

  actor.nextAmmo = riskValue;
  state.pendingRiskTileValue = riskValue;
  showSystemBanner("RISK TILE READY");
}

function maybeTriggerMicroEvent(actor, mergeResult) {
  if (actor.kind !== "player" || state.roundFinished || Math.random() > 0.09) {
    return false;
  }

  const roll = Math.random();

  if (roll < 0.34) {
    const candidates = [];
    for (let row = 0; row < boardState.grid.length; row += 1) {
      for (let col = 0; col < boardState.grid[row].length; col += 1) {
        const value = boardState.grid[row][col];
        if (value > 0 && value < 16384 && value !== BLOCKER_TILE) {
          candidates.push({ row, col, value });
        }
      }
    }

    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      boardState.grid[target.row][target.col] = target.value * 2;
      const bonus = Math.round(target.value * 0.6);
      actor.score += bonus;
      boardState.score += bonus;
      boardState.maxTile = getMaxTile(boardState.grid);
      updateBestScore(boardState.score);
      showSystemBanner("LUCKY MERGE");
      addTileEffectClass(boardState, target.row, target.col, "tile-merge-pop");
      themeEffects.applyMergeEffect(getTileElement(boardState, target.row, target.col), boardState.grid[target.row][target.col]);
      return true;
    }
  }

  if (roll < 0.67) {
    const candidates = [];
    for (let row = 0; row < boardState.grid.length; row += 1) {
      for (let col = 0; col < boardState.grid[row].length; col += 1) {
        const value = boardState.grid[row][col];
        if (value > 0 && value !== BLOCKER_TILE) {
          candidates.push({ row, col, value });
        }
      }
    }

    if (candidates.length > 0) {
      const flash = candidates[Math.floor(Math.random() * candidates.length)];
      state.flashTile = { row: flash.row, col: flash.col, turns: 1 };
      showSystemBanner("FLASH TILE");
      return true;
    }
  }

  state.magnetTurns = 1;
  showSystemBanner("MAGNET MOVE");
  return true;
}

function getEmptyCellCount(grid) {
  let count = 0;
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === 0) {
        count += 1;
      }
    }
  }
  return count;
}

function initialize() {
  buildBoard(boardState);
  buildLevelGrid();
  buildThemeGrid();
  buildPowerGrid();
  bindEvents();
  themeManager.loadTheme();
  renderSettingsPanel();
  renderHeroBoard();
  startHeroAutoplay();
  resetRound();
  syncThemeProgress();
  renderAll();
  primeMergeSfxAudio();
  applyMusicState();
  showHome();
}

function bindEvents() {
  boardState.boardElement.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    if (!isGameVisible() || !state.roundActive || state.roundFinished || state.currentTurn !== "player" || boardState.isAnimating) {
      return;
    }

    const cell = event.target.closest(".board-cell");
    if (!cell || !boardState.boardElement.contains(cell)) {
      return;
    }

    const column = Number.parseInt(cell.dataset.col || "", 10);
    const row = Number.parseInt(cell.dataset.row || "", 10);
    if (state.selectedPowerId && Number.isInteger(row) && Number.isInteger(column)) {
      maybeHandlePowerTarget(row, column);
      return;
    }

    if (Number.isInteger(column)) {
      handleHumanShot(column);
    }
  });

  window.addEventListener(
    "keydown",
    (event) => {
      const key = event.key.toLowerCase();

      if (!isGameVisible()) {
        return;
      }

      const digit = Number.parseInt(key, 10);
      if (Number.isInteger(digit) && digit >= 1 && digit <= boardState.cols) {
        event.preventDefault();
        handleHumanShot(digit - 1);
        return;
      }

      if (key === "r") {
        event.preventDefault();
        restartLevel();
      }
    },
    { passive: false }
  );

  el.playBtn.addEventListener("click", showLevels);
  el.resumeBtn.addEventListener("click", () => {
    if (state.roundActive) {
      showGame();
      if (!state.roundFinished && state.currentTurn === "ai") {
        scheduleAiTurn(true);
      }
      return;
    }

    showLevels();
  });

  el.themeBtn.addEventListener("click", () => {
    showThemes();
  });

  el.powerBtn.addEventListener("click", () => {
    showPowers();
  });

  el.modeBtn.addEventListener("click", () => {
    if (state.roundActive && !state.roundFinished) {
      stopAiLoop();
      stopModeTimer();
      state.roundActive = false;
      state.roundFinished = false;
      state.roundResult = "";
      state.currentTurn = "player";
    }

    persistCurrentModeProgress();
    state.modeIndex = (state.modeIndex + 1) % MODES.length;
    applyModeProgress(getCurrentMode().id);
    activeAiProfile = getAiProfileForLevel(state.selectedLevel);
    renderMetaButtons();
    renderLevels();
    renderScoreboard();
    renderGameHeader();
  });

  el.settingsBtn.addEventListener("click", () => {
    if (state.settingsOpen) {
      closeSettingsPanel();
    } else {
      openSettingsPanel();
    }
  });

  el.settingsCloseBtn.addEventListener("click", closeSettingsPanel);
  el.settingsPanel.addEventListener("click", (event) => {
    if (event.target === el.settingsPanel) {
      closeSettingsPanel();
    }
  });

  el.toggleSfxBtn.addEventListener("click", () => {
    state.sfxEnabled = !state.sfxEnabled;
    saveStoredBool(SFX_ENABLED_KEY, state.sfxEnabled);
    renderSound();
    renderSettingsPanel();
  });

  el.toggleMusicBtn.addEventListener("click", () => {
    state.musicEnabled = !state.musicEnabled;
    saveStoredBool(MUSIC_ENABLED_KEY, state.musicEnabled);
    applyMusicState();
    renderSound();
    renderSettingsPanel();
  });

  el.soundBtn.addEventListener("click", () => {
    state.sfxEnabled = !state.sfxEnabled;
    saveStoredBool(SFX_ENABLED_KEY, state.sfxEnabled);
    renderSound();
    renderSettingsPanel();
  });

  el.levelBackBtn.addEventListener("click", showHome);
  el.themeBackBtn.addEventListener("click", showHome);
  el.powerBackBtn.addEventListener("click", showHome);
  el.startLevelBtn.addEventListener("click", startSelectedLevel);

  el.homeBtn.addEventListener("click", showHome);
  el.overlayHomeBtn.addEventListener("click", showHome);
  el.restartBtn.addEventListener("click", restartLevel);
  el.overlayRestartBtn.addEventListener("click", handleOverlayAction);
  el.puzzleRetryBtn.addEventListener("click", restartLevel);
  el.puzzleHintBtn.addEventListener("click", () => {
    showPuzzleHint(true);
  });
  el.powerDrawerBtn.addEventListener("click", () => {
    if (state.powerDrawerOpen) {
      closePowerDrawer();
    } else {
      openPowerDrawer();
    }
  });
  el.powerDrawerCloseBtn.addEventListener("click", closePowerDrawer);
  el.powerDrawer.addEventListener("click", (event) => {
    if (event.target === el.powerDrawer) {
      closePowerDrawer();
    }
  });

  window.addEventListener("resize", updateBoardScale, { passive: true });
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);
}

function showHome() {
  stopAiLoop();
  stopModeTimer();
  closeSettingsPanel();
  closePowerDrawer();
  if (boardState.goalCalloutTimeoutId) {
    window.clearTimeout(boardState.goalCalloutTimeoutId);
    boardState.goalCalloutTimeoutId = null;
  }
  if (boardState.powerTipTimeoutId) {
    window.clearTimeout(boardState.powerTipTimeoutId);
    boardState.powerTipTimeoutId = null;
  }
  boardState.powerBannerUntil = 0;
  boardState.queuedBannerText = "";
  if (el.goalCallout) {
    el.goalCallout.classList.add("hidden");
  }
  if (el.powerTipPopup) {
    el.powerTipPopup.classList.remove("is-visible");
    el.powerTipPopup.classList.add("hidden");
  }
  el.home.classList.remove("hidden");
  el.themes.classList.add("hidden");
  el.powers.classList.add("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.add("hidden");
  renderAll();
}

function showThemes() {
  stopAiLoop();
  stopModeTimer();
  closeSettingsPanel();
  closePowerDrawer();
  el.home.classList.add("hidden");
  el.themes.classList.remove("hidden");
  el.powers.classList.add("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.add("hidden");
  renderThemeScreen();
}

function showPowers() {
  stopAiLoop();
  stopModeTimer();
  closeSettingsPanel();
  closePowerDrawer();
  el.home.classList.add("hidden");
  el.themes.classList.add("hidden");
  el.powers.classList.remove("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.add("hidden");
  renderPowerShop();
}

function showLevels() {
  stopAiLoop();
  stopModeTimer();
  closeSettingsPanel();
  closePowerDrawer();
  el.home.classList.add("hidden");
  el.themes.classList.add("hidden");
  el.powers.classList.add("hidden");
  el.levels.classList.remove("hidden");
  el.game.classList.add("hidden");
  renderLevels();
}

function showGame() {
  closeSettingsPanel();
  closePowerDrawer();
  el.home.classList.add("hidden");
  el.themes.classList.add("hidden");
  el.powers.classList.add("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.remove("hidden");
  if (isSpeedMode() && state.roundActive && !state.roundFinished) {
    startModeTimer();
  }
  window.requestAnimationFrame(() => {
    updateBoardScale();
    if (state.showGoalIntroPending) {
      state.showGoalIntroPending = false;
      showGoalCallout();
    }
  });
}

function isGameVisible() {
  return !el.game.classList.contains("hidden");
}

function openSettingsPanel() {
  state.settingsOpen = true;
  el.settingsPanel.classList.remove("hidden");
  renderSettingsPanel();
}

function closeSettingsPanel() {
  state.settingsOpen = false;
  el.settingsPanel.classList.add("hidden");
}

function openPowerDrawer() {
  if (getOwnedPowerUpCount() <= 0) {
    showSystemBanner("BUY POWER-UPS FIRST");
    return;
  }

  state.powerDrawerOpen = true;
  el.powerDrawer.classList.remove("hidden");
  renderPowerDrawer();
  renderPowerActiveCard();
}

function closePowerDrawer() {
  state.powerDrawerOpen = false;
  state.selectedPowerId = "";
  state.powerPreviewId = "";
  if (el.powerDrawer) {
    el.powerDrawer.classList.add("hidden");
  }
  if (el.powerActiveCard) {
    el.powerActiveCard.classList.add("hidden");
  }
}

function renderSettingsPanel() {
  el.toggleSfxBtn.textContent = `SFX: ${state.sfxEnabled ? "ON" : "OFF"}`;
  el.toggleMusicBtn.textContent = `MUSIC: ${state.musicEnabled ? "ON" : "OFF"}`;
}

function buildLevelGrid() {
  el.levelGrid.innerHTML = "";
  levelButtons.length = 0;

  for (let level = 1; level <= LEVEL_COUNT; level += 1) {
    const profile = getAiProfileForLevel(level);
    const shortName = profile.name.split(" ")[0];
    const button = document.createElement("button");

    button.type = "button";
    button.className = "level-btn";
    button.dataset.level = String(level);
    button.innerHTML = `<span>${level}</span><span class="level-btn-label">${shortName}</span>`;

    button.addEventListener("click", () => {
      if (level > state.unlockedLevel) {
        return;
      }

      if (state.selectedLevel === level) {
        startSelectedLevel();
        return;
      }

      state.selectedLevel = level;
      persistCurrentModeProgress();
      renderLevels();
    });

    levelButtons.push(button);
    el.levelGrid.append(button);
  }
}

function buildThemeGrid() {
  el.themeGrid.innerHTML = "";
  themeCards.length = 0;

  for (const theme of THEME_DEFINITIONS) {
    const button = document.createElement("button");
    const previewTiles = theme.preview
      .map((value) => `<span class="theme-preview-tile" data-preview-value="${value}">${value}</span>`)
      .join("");

    button.type = "button";
    button.className = "theme-card";
    button.dataset.themeId = theme.id;
    applyThemeShowcaseStyles(button, theme);
    button.innerHTML = `
      <div class="theme-card-topline">
        <span class="theme-card-status" data-theme-card-status>${theme.unlock.type === "default" ? "Open" : "Locked"}</span>
      </div>
      <div class="theme-preview" data-theme-preview>${previewTiles}</div>
      <div class="theme-card-footer">
        <strong class="theme-card-title">${theme.name}</strong>
        <span class="theme-card-price" data-theme-card-price>${theme.unlock.type === "default" ? "Unlocked" : getThemePriceMarkup(theme)}</span>
        <span class="theme-card-win-gate" data-theme-card-win-gate>${theme.unlock.type === "default" ? "" : `${getThemeWinRequirement(theme)} wins`}</span>
      </div>
    `;

    button.addEventListener("click", () => {
      const didSet = themeManager.setTheme(theme.id);
      if (!didSet) {
        button.classList.remove("is-locked-bump");
        void button.offsetWidth;
        button.classList.add("is-locked-bump");
        window.setTimeout(() => button.classList.remove("is-locked-bump"), 240);
        return;
      }

      renderAll();
      renderThemeScreen();
      renderHeroBoard();
    });

    el.themeGrid.append(button);
    themeCards.push(button);
  }
}

function buildPowerGrid() {
  el.powerGrid.innerHTML = "";
  powerCards.length = 0;

  for (const power of POWER_UPS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "power-card";
    card.dataset.powerId = power.id;
    applyPowerVisualStyles(card, power);
    card.innerHTML = `
      <span class="power-card-icon-wrap"><span class="power-card-icon">${power.icon}</span></span>
      <strong class="power-card-title">${power.name}</strong>
      <span class="power-card-effect">${power.effect}</span>
      <div class="power-card-footer">
        <span class="power-card-price">${formatCoins(power.price)} coins</span>
        <span class="power-card-owned" data-power-owned>x0</span>
      </div>
    `;

    card.addEventListener("click", () => {
      buyPowerUp(power.id);
    });

    el.powerGrid.append(card);
    powerCards.push(card);
  }
}

function renderPowerShop() {
  if (el.powerBalance) {
    el.powerBalance.textContent = formatCoins(state.powerBalance);
  }

  for (const card of powerCards) {
    const power = getPowerById(card.dataset.powerId || "");
    if (!power) {
      continue;
    }

    const owned = Number(state.powerInventory[power.id] || 0);
    const affordable = state.powerBalance >= power.price;
    const ownedEl = card.querySelector("[data-power-owned]");

    card.classList.toggle("is-disabled", !affordable);
    card.classList.toggle("is-owned", owned > 0);
    if (ownedEl) {
      ownedEl.textContent = `x${owned}`;
    }
  }
}

function renderPowerActiveCard() {
  if (!el.powerActiveCard) {
    return;
  }

  const powerId = state.selectedPowerId || state.powerPreviewId;
  const power = getPowerById(powerId);
  if (!power) {
    el.powerActiveCard.classList.add("hidden");
    return;
  }

  const owned = Number(state.powerInventory[power.id] || 0);
  if (el.powerActiveIcon) {
    el.powerActiveIcon.innerHTML = power.icon;
  }
  if (el.powerActiveCount) {
    el.powerActiveCount.textContent = `x${owned}`;
  }
  if (el.powerActiveName) {
    el.powerActiveName.textContent = power.effect;
  }
  if (el.powerActiveHint) {
    el.powerActiveHint.textContent = getPowerUseHint(power.id);
  }

  applyPowerVisualStyles(el.powerActiveCard, power);
  el.powerActiveCard.classList.remove("hidden");
  el.powerActiveCard.classList.toggle("is-armed", state.selectedPowerId === power.id);
}

function buyPowerUp(powerId) {
  const power = getPowerById(powerId);
  if (!power) {
    return false;
  }

  if (state.powerBalance < power.price) {
    showSystemBanner("NOT ENOUGH COINS");
    return false;
  }

  state.powerBalance -= power.price;
  state.powerInventory[power.id] = Number(state.powerInventory[power.id] || 0) + 1;
  savePowerState();
  renderScoreboard();
  renderPowerShop();
  renderThemeScreen();
  renderPowerDrawer();
  renderPowerActiveCard();
  showSystemBanner(`${power.name.toUpperCase()} BOUGHT`);
  return true;
}

function renderPowerDrawer() {
  if (!el.powerDrawerGrid) {
    return;
  }

  el.powerDrawerGrid.innerHTML = "";
  powerDrawerButtons.length = 0;

  for (const power of POWER_UPS) {
    const count = Number(state.powerInventory[power.id] || 0);
    if (count <= 0) {
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "power-drawer-btn";
    button.dataset.powerId = power.id;
    button.disabled = !state.roundActive || state.roundFinished;
    applyPowerVisualStyles(button, power);
    button.setAttribute("aria-label", `${power.name}. ${count} available.`);
    button.title = `${power.name}: ${getPowerUseHint(power.id)}`;
    button.innerHTML = `
      <span class="power-drawer-icon-wrap"><span class="power-drawer-icon">${power.icon}</span></span>
      <span class="power-drawer-count">${count}</span>
    `;
    button.classList.toggle("is-selected", state.selectedPowerId === power.id || state.powerPreviewId === power.id);
    button.addEventListener("click", () => {
      armOrUsePowerUp(power.id);
    });
    el.powerDrawerGrid.append(button);
    powerDrawerButtons.push(button);
  }

  if (powerDrawerButtons.length === 0) {
    closePowerDrawer();
  }
}

function armOrUsePowerUp(powerId) {
  const power = getPowerById(powerId);
  if (!power || !state.roundActive || state.roundFinished) {
    return false;
  }

  const owned = Number(state.powerInventory[power.id] || 0);
  if (owned <= 0) {
    showSystemBanner("POWER-UP EMPTY");
    return false;
  }

  state.powerPreviewId = power.id;
  showPowerAnnouncement(power.id);

  if (power.target === "instant") {
    state.selectedPowerId = "";
    const didUse = useInstantPowerUp(power.id);
    renderPowerActiveCard();
    renderPowerDrawer();
    return didUse;
  }

  state.selectedPowerId = state.selectedPowerId === power.id ? "" : power.id;
  if (!state.selectedPowerId) {
    state.powerPreviewId = power.id;
  }
  renderPowerActiveCard();
  renderPowerDrawer();
  renderStatus();
  return true;
}

function consumePowerUp(powerId) {
  const owned = Number(state.powerInventory[powerId] || 0);
  if (owned <= 0) {
    return false;
  }
  state.powerInventory[powerId] = owned - 1;
  savePowerState();
  renderPowerShop();
  renderPowerActiveCard();
  return true;
}

function snapshotActor(actor) {
  return {
    currentAmmo: actor.currentAmmo,
    nextAmmo: actor.nextAmmo,
    score: actor.score,
    shotCount: actor.shotCount
  };
}

function restoreActor(actor, snapshot) {
  actor.currentAmmo = snapshot.currentAmmo;
  actor.nextAmmo = snapshot.nextAmmo;
  actor.score = snapshot.score;
  actor.shotCount = snapshot.shotCount;
}

function storeGameSnapshot() {
  const snapshot = {
    grid: cloneGrid(boardState.grid),
    boardScore: boardState.score,
    boardMaxTile: boardState.maxTile,
    player: snapshotActor(player),
    ai: snapshotActor(ai),
    state: {
      activeLevel: state.activeLevel,
      selectedLevel: state.selectedLevel,
      currentTurn: state.currentTurn,
      roundActive: state.roundActive,
      roundFinished: state.roundFinished,
      roundResult: state.roundResult,
      timeLeftMs: state.timeLeftMs,
      playerMovesLeft: state.playerMovesLeft,
      lastChaosEvent: state.lastChaosEvent,
      momentumPoints: state.momentumPoints,
      momentumLevel: state.momentumLevel,
      chainGoodMoves: state.chainGoodMoves,
      chainBoostArmed: state.chainBoostArmed,
      assistCooldownTurns: state.assistCooldownTurns,
      freezeTurns: state.freezeTurns,
      wildTileArmed: state.wildTileArmed,
      magnetTurns: state.magnetTurns,
      flashTile: state.flashTile ? { ...state.flashTile } : null,
      pendingRiskTileValue: state.pendingRiskTileValue,
      turnIndex: state.turnIndex,
      progressionMilestonesHit: Array.from(state.progressionMilestonesHit),
      lockedTiles: state.lockedTiles.map((tile) => ({ ...tile }))
    }
  };

  state.moveHistory.push(snapshot);
  if (state.moveHistory.length > 14) {
    state.moveHistory.shift();
  }
}

function restoreSnapshot(snapshot) {
  if (!snapshot) {
    return false;
  }

  boardState.grid = cloneGrid(snapshot.grid);
  boardState.score = snapshot.boardScore;
  boardState.maxTile = snapshot.boardMaxTile;
  restoreActor(player, snapshot.player);
  restoreActor(ai, snapshot.ai);

  state.activeLevel = snapshot.state.activeLevel;
  state.selectedLevel = snapshot.state.selectedLevel;
  state.currentTurn = snapshot.state.currentTurn;
  state.roundActive = snapshot.state.roundActive;
  state.roundFinished = snapshot.state.roundFinished;
  state.roundResult = snapshot.state.roundResult;
  state.timeLeftMs = snapshot.state.timeLeftMs;
  state.playerMovesLeft = snapshot.state.playerMovesLeft;
  state.lastChaosEvent = snapshot.state.lastChaosEvent;
  state.momentumPoints = snapshot.state.momentumPoints;
  state.momentumLevel = snapshot.state.momentumLevel;
  state.chainGoodMoves = snapshot.state.chainGoodMoves;
  state.chainBoostArmed = snapshot.state.chainBoostArmed;
  state.assistCooldownTurns = snapshot.state.assistCooldownTurns;
  state.freezeTurns = snapshot.state.freezeTurns;
  state.wildTileArmed = snapshot.state.wildTileArmed;
  state.magnetTurns = snapshot.state.magnetTurns;
  state.flashTile = snapshot.state.flashTile ? { ...snapshot.state.flashTile } : null;
  state.pendingRiskTileValue = snapshot.state.pendingRiskTileValue;
  state.turnIndex = snapshot.state.turnIndex;
  state.progressionMilestonesHit = new Set(snapshot.state.progressionMilestonesHit);
  state.lockedTiles = snapshot.state.lockedTiles.map((tile) => ({ ...tile }));
  state.selectedPowerId = "";
  clearNearMissMarks();
  hideGameOverPanel();
  stopAiLoop();
  renderAll();
  if (state.currentTurn === "ai" && !state.roundFinished) {
    scheduleAiTurn(true);
  }
  return true;
}

function useInstantPowerUp(powerId) {
  if (powerId === "rewind") {
    if (state.moveHistory.length < 2) {
      showSystemBanner("NO REWIND READY");
      return false;
    }

    const targetIndex = Math.max(0, state.moveHistory.length - 2);
    const snapshot = state.moveHistory[targetIndex];
    if (!consumePowerUp(powerId)) {
      return false;
    }
    state.moveHistory = state.moveHistory.slice(0, targetIndex + 1);
    showSystemBanner("TIME REWIND");
    return restoreSnapshot(snapshot);
  }

  if (!consumePowerUp(powerId)) {
    return false;
  }

  if (powerId === "freeze-time") {
    state.freezeTurns = Math.max(state.freezeTurns, 3);
    showSystemBanner("TIME FROZEN");
  } else if (powerId === "wild-tile") {
    state.wildTileArmed = true;
    showSystemBanner("WILD SHOT READY");
  } else if (powerId === "smart-shuffle") {
    smartShuffleBoard();
    showSystemBanner("SMART SHUFFLE");
  } else {
    return false;
  }

  storeGameSnapshot();
  renderAll();
  renderPowerDrawer();
  return true;
}

function getSelectedCellValue(row, col) {
  if (row < 0 || row >= boardState.grid.length || col < 0 || col >= boardState.grid[0].length) {
    return 0;
  }
  return boardState.grid[row][col];
}

function getWildPlacementValue(row, col, fallbackValue) {
  let best = 0;
  const neighbors = [
    { row, col: col - 1 },
    { row, col: col + 1 },
    { row: row - 1, col },
    { row: row + 1, col }
  ];

  for (const neighbor of neighbors) {
    const value = getSelectedCellValue(neighbor.row, neighbor.col);
    if (value > best && value !== BLOCKER_TILE) {
      best = value;
    }
  }

  return best > 0 ? best : fallbackValue;
}

function removeLockedTile(row, col) {
  state.lockedTiles = state.lockedTiles.filter((tile) => !(tile.row === row && tile.col === col));
}

async function animatePowerTileAction(powerId, row, col, extra = {}) {
  const primaryTile = getTileElement(boardState, row, col);
  const linkedTile = extra.match ? getTileElement(boardState, extra.match.row, extra.match.col) : null;

  if (powerId === "breaker") {
    addTileEffectClass(boardState, row, col, "tile-power-break");
    await wait(220);
    return;
  }

  if (powerId === "evolve-tile") {
    addTileEffectClass(boardState, row, col, "tile-power-evolve");
    await wait(200);
    return;
  }

  if (powerId === "lock-tile") {
    addTileEffectClass(boardState, row, col, "tile-power-lock");
    await wait(190);
    return;
  }

  if (powerId === "merge-boost") {
    if (primaryTile) {
      addTileEffectClass(boardState, row, col, "tile-power-boost");
    }
    if (linkedTile) {
      addTileEffectClass(boardState, extra.match.row, extra.match.col, "tile-power-boost");
    }
    await wait(220);
  }
}

async function useTargetedPowerUp(powerId, row, col) {
  const value = getSelectedCellValue(row, col);
  const maxTile = getMaxTile(boardState.grid);

  if (value <= 0 || value === BLOCKER_TILE) {
    showSystemBanner("SELECT A TILE");
    return false;
  }

  if (!consumePowerUp(powerId)) {
    return false;
  }

  let didApply = false;

  if (powerId === "breaker") {
    if (value >= maxTile) {
      state.powerInventory[powerId] += 1;
      savePowerState();
      renderPowerShop();
      renderPowerDrawer();
      renderPowerActiveCard();
      showSystemBanner("HIGHEST TILE SAFE");
      return false;
    }

    boardState.isAnimating = true;
    await animatePowerTileAction(powerId, row, col);
    boardState.grid[row][col] = 0;
    removeLockedTile(row, col);
    collapseColumnsTopToBottom(boardState.grid);
    boardState.isAnimating = false;
    didApply = true;
    showSystemBanner("TILE BROKEN");
  } else if (powerId === "evolve-tile") {
    boardState.isAnimating = true;
    await animatePowerTileAction(powerId, row, col);
    boardState.grid[row][col] = value * 2;
    boardState.score += value * 2;
    updateBestScore(boardState.score);
    boardState.isAnimating = false;
    didApply = true;
    showSystemBanner("TILE EVOLVED");
  } else if (powerId === "lock-tile") {
    boardState.isAnimating = true;
    await animatePowerTileAction(powerId, row, col);
    removeLockedTile(row, col);
    state.lockedTiles.push({ row, col, turns: 3 });
    boardState.isAnimating = false;
    didApply = true;
    showSystemBanner("TILE LOCKED");
  } else if (powerId === "merge-boost") {
    const match = findNearestMatchingTile(row, col, value);
    if (!match) {
      state.powerInventory[powerId] += 1;
      savePowerState();
      renderPowerShop();
      renderPowerDrawer();
      renderPowerActiveCard();
      showSystemBanner("NO MATCH FOUND");
      return false;
    }

    boardState.isAnimating = true;
    await animatePowerTileAction(powerId, row, col, { match });
    boardState.grid[row][col] = value * 2;
    boardState.grid[match.row][match.col] = 0;
    removeLockedTile(match.row, match.col);
    collapseColumnsTopToBottom(boardState.grid);
    boardState.score += value * 2;
    updateBestScore(boardState.score);
    boardState.isAnimating = false;
    didApply = true;
    playMergeSound(value * 2, 1);
    showSystemBanner("MERGE BOOST");
  }

  if (!didApply) {
    state.powerInventory[powerId] += 1;
    savePowerState();
    renderPowerShop();
    renderPowerDrawer();
    renderPowerActiveCard();
    return false;
  }

  boardState.maxTile = getMaxTile(boardState.grid);
  state.selectedPowerId = "";
  storeGameSnapshot();
  renderAll();
  renderPowerDrawer();
  return true;
}

function maybeHandlePowerTarget(row, col) {
  if (!state.selectedPowerId) {
    return false;
  }

  return useTargetedPowerUp(state.selectedPowerId, row, col);
}

function findNearestMatchingTile(sourceRow, sourceCol, value) {
  let best = null;

  for (let row = 0; row < boardState.grid.length; row += 1) {
    for (let col = 0; col < boardState.grid[row].length; col += 1) {
      if (row === sourceRow && col === sourceCol) {
        continue;
      }
      if (boardState.grid[row][col] !== value) {
        continue;
      }

      const distance = Math.abs(sourceRow - row) + Math.abs(sourceCol - col);
      if (!best || distance < best.distance) {
        best = { row, col, distance };
      }
    }
  }

  return best;
}

function smartShuffleBoard() {
  const original = cloneGrid(boardState.grid);
  let bestGrid = cloneGrid(boardState.grid);
  let bestScore = countAdjacentEqualPairs(bestGrid);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const trial = cloneGrid(original);
    shuffleBoardTiles(trial);
    const adjacency = countAdjacentEqualPairs(trial);
    if (adjacency >= bestScore) {
      bestScore = adjacency;
      bestGrid = trial;
    }
  }

  boardState.grid = bestGrid;
  boardState.maxTile = getMaxTile(boardState.grid);
}

function countAdjacentEqualPairs(grid) {
  let score = 0;
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const value = grid[row][col];
      if (value <= 0 || value === BLOCKER_TILE) {
        continue;
      }
      if (col + 1 < grid[row].length && grid[row][col + 1] === value) {
        score += 1;
      }
      if (row + 1 < grid.length && grid[row + 1][col] === value) {
        score += 1;
      }
    }
  }
  return score;
}

function renderThemeScreen() {
  const activeTheme = themeManager.getTheme();
  const unlocked = new Set(themeManager.getUnlockedThemeIds());
  const progress = themeManager.getProgress();
  if (el.bestScoreTheme) {
    el.bestScoreTheme.textContent = formatCoins(state.powerBalance);
  }

  for (const card of themeCards) {
    const themeId = card.dataset.themeId || "";
    const theme = getThemeById(themeId);
    const isUnlocked = unlocked.has(themeId);
    const isActive = activeTheme.id === themeId;
    const status = card.querySelector("[data-theme-card-status]");
    const price = card.querySelector("[data-theme-card-price]");
    const winGate = card.querySelector("[data-theme-card-win-gate]");
    const winsNeeded = getThemeWinRequirement(theme);
    const winsText = `${progress.levelWins}/${winsNeeded} wins`;

    card.classList.toggle("is-locked", !isUnlocked);
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-label", `${theme.name}${isUnlocked ? "" : " locked"}`);
    card.disabled = false;

    if (status) {
      status.textContent = isUnlocked ? (isActive ? "Active" : "Open") : "Locked";
      status.classList.toggle("is-locked", !isUnlocked);
    }
    if (price) {
      price.innerHTML = isUnlocked ? (isActive ? "Using now" : "Unlocked") : getThemePriceMarkup(theme);
    }
    if (winGate) {
      winGate.textContent = isUnlocked ? `${winsNeeded} wins cleared` : winsText;
      winGate.classList.toggle("is-hidden", winsNeeded <= 0);
    }

    const previewTiles = card.querySelectorAll("[data-preview-value]");
    for (const previewTile of previewTiles) {
      const value = Number.parseInt(previewTile.dataset.previewValue || "0", 10);
      applyTileVisualStyle(previewTile, value, getVisualLevel(), theme);
    }
  }
}

function renderLevels() {
  const targetText = formatBigInt(getLevelTarget(state.selectedLevel));
  const puzzleConfig = isPuzzleMode() ? puzzleManager.getLevel(state.selectedLevel) : null;
  const speedTimeText = formatTimeLeft(getSpeedModeTimeLimit(state.selectedLevel));

  el.unlockedLevel.textContent = String(state.unlockedLevel);
  el.selectedLevel.textContent = String(state.selectedLevel);
  if (puzzleConfig) {
    el.startLevelBtn.textContent = `START PUZZLE ${state.selectedLevel}`;
  } else if (isSpeedMode()) {
    el.startLevelBtn.textContent = `START SPEED ${state.selectedLevel} - ${speedTimeText}`;
  } else {
    el.startLevelBtn.textContent = `START LEVEL ${state.selectedLevel} - ${targetText}`;
  }

  for (const button of levelButtons) {
    const level = Number.parseInt(button.dataset.level || "", 10);
    const locked = level > state.unlockedLevel;
    const label = button.querySelector(".level-btn-label");

    button.classList.toggle("is-locked", locked);
    button.classList.toggle("is-selected", level === state.selectedLevel);
    button.disabled = locked;
    if (label) {
      label.textContent = puzzleConfig ? puzzleManager.getLevel(level).typeLabel.split(" ")[0] : getAiProfileForLevel(level).name.split(" ")[0];
    }
  }

  renderScoreboard();
}

function getRunPayout(result) {
  const classicPayout = Math.max(0, Math.floor(boardState.score / 10));
  return isSpeedMode() ? Math.max(0, Math.floor(classicPayout * 1.5)) : classicPayout;
}

function awardRunCoins(result, bannerDelay = 120) {
  const payout = getRunPayout(result);
  state.powerBalance += payout;
  savePowerState();
  syncThemeProgress();
  renderAll();

  if (payout > 0) {
    window.setTimeout(() => {
      showSystemBanner(`+${payout} COINS FROM SCORE`);
    }, bannerDelay);
  }

  return payout;
}

function unlockNextLevelForCurrentMode() {
  if (state.activeLevel !== state.unlockedLevel || state.unlockedLevel >= LEVEL_COUNT) {
    persistCurrentModeProgress();
    return false;
  }

  state.unlockedLevel += 1;
  state.selectedLevel = Math.max(state.selectedLevel, state.unlockedLevel);
  persistCurrentModeProgress();
  return true;
}

function registerThemeLevelWin() {
  const unlockedNow = themeManager.incrementLevelWins();
  if (unlockedNow.length > 0) {
    showSystemBanner(`THEME UNLOCKED: ${unlockedNow[0].name.toUpperCase()}`);
  }
}

function startSelectedLevel() {
  state.activeLevel = state.selectedLevel;
  activeAiProfile = getAiProfileForLevel(state.activeLevel);
  state.roundActive = true;
  state.roundFinished = false;
  state.roundResult = "";
  state.currentTurn = "player";
  state.showGoalIntroPending = true;

  const unlockedNow = themeManager.incrementGamesPlayed();
  if (unlockedNow.length > 0) {
    showSystemBanner(`THEME UNLOCKED: ${unlockedNow[0].name.toUpperCase()}`);
  }

  resetRound();
  syncThemeProgress();
  renderAll();
  showGame();
  window.setTimeout(() => {
    if (state.roundActive && !state.roundFinished && isGameVisible()) {
      if (isPuzzleMode() && state.puzzleSession) {
        showSystemBanner(state.puzzleSession.goalLabel.toUpperCase());
      } else if (isSpeedMode()) {
        showSystemBanner("BEAT THE CLOCK");
      } else {
        showSystemBanner(state.sessionModifier?.title || "SESSION MODIFIER");
      }
    }
  }, 180);
}

function restartLevel() {
  if (!state.roundActive) {
    startSelectedLevel();
    return;
  }

  activeAiProfile = getAiProfileForLevel(state.activeLevel);
  state.roundFinished = false;
  state.roundResult = "";
  state.currentTurn = "player";
  state.showGoalIntroPending = true;

  resetRound();
  renderAll();
  showGame();
}

function resetRound() {
  stopAiLoop();
  stopModeTimer();
  closePowerDrawer();
  resetBoard(boardState);
  resetActor(player);
  resetActor(ai);
  resetRunDynamicSystems();
  setupModeState();
  hideGameOverPanel();
  updateBoardScale();
  state.moveHistory = [];
  storeGameSnapshot();
}

function resetBoard(board) {
  board.grid = createEmptyGrid(board.rows, board.cols);
  board.score = 0;
  board.maxTile = 0;
  board.isAnimating = false;
  clearAnimationLayer(board);
  board.boardElement.classList.remove("is-game-over", "is-glow", "is-shaking", "is-blocked", "is-danger", "is-calm", "is-magnetized", "is-slowmo");
}

function resetActor(actor) {
  actor.score = 0;
  actor.shotCount = 0;
  actor.currentAmmo = isPuzzleMode() ? drawPuzzleAmmoValue(actor.kind) : createAmmoValue(state.modeIndex, actor.kind);
  actor.nextAmmo = isPuzzleMode() ? drawPuzzleAmmoValue(actor.kind) : createAmmoValue(state.modeIndex, actor.kind);
}

function getCurrentMode() {
  return MODES[state.modeIndex];
}

function isSoloMode() {
  return getCurrentMode().id === "solo";
}

function isClassicMode() {
  return getCurrentMode().id === "classic";
}

function isSpeedMode() {
  return getCurrentMode().id === "speed";
}

function isPuzzleMode() {
  return getCurrentMode().id === "puzzle";
}

function isChaosMode() {
  return getCurrentMode().id === "chaos";
}

function isClassicAssistWindow() {
  return isClassicMode() && state.activeLevel <= 30;
}

function hasAiOpponent() {
  return !isSoloMode() && !isPuzzleMode() && !isSpeedMode() && !isClassicAssistWindow();
}

function drawPuzzleAmmoValue(actorKind = "player") {
  const queue = state.puzzleSession?.playerAmmoQueue;
  if (actorKind === "player" && Array.isArray(queue) && queue.length > 0) {
    return Number(queue.shift() || 2);
  }

  if (actorKind === "player" && state.puzzleSession?.config) {
    const fallback = state.puzzleSession.config.fallbackAmmo || state.puzzleSession.config.ammoQueue?.at(-1) || 2;
    return Number(fallback || 2);
  }

  return createAmmoValue(state.modeIndex, actorKind);
}

function renderPuzzleBrief() {
  if (!el.puzzleBrief) {
    return;
  }

  if (!isPuzzleMode() || !state.puzzleSession) {
    el.puzzleBrief.classList.add("hidden");
    return;
  }

  const header = puzzleManager.getHeaderUi(state.puzzleSession);
  const movesLeft = Math.max(0, state.puzzleSession.moveLimit - state.puzzleSession.movesUsed);
  el.puzzleZone.textContent = header.special || header.zone;
  el.puzzleType.textContent = header.type;
  el.puzzleStars.textContent = header.stars;
  el.puzzleGoal.textContent = header.goal;
  el.puzzleMoves.textContent = header.moves;
  el.puzzleBrief.dataset.puzzlePressure =
    movesLeft <= 1 ? "critical" :
    movesLeft <= 2 ? "warning" :
    "stable";
  el.puzzleBrief.classList.remove("hidden");
}

function highlightPuzzleHintColumn(column) {
  for (let row = 0; row < boardState.rows; row += 1) {
    const cell = boardState.cellElements[getCellIndex(boardState, row, column)];
    if (!cell) {
      continue;
    }
    cell.classList.remove("puzzle-hint-cell");
    void cell.offsetWidth;
    cell.classList.add("puzzle-hint-cell");
    window.setTimeout(() => cell.classList.remove("puzzle-hint-cell"), 950);
  }
}

function showPuzzleHint(force = false) {
  if (!isPuzzleMode() || !state.puzzleSession || !state.roundActive || state.roundFinished) {
    return false;
  }

  const threshold = Number(state.puzzleSession.config.hintThreshold || 2);
  if (!force && state.puzzleSession.movesUsed < threshold) {
    showSystemBanner("PLAY A LITTLE MORE");
    return false;
  }

  const hint = puzzleManager.getHint(state.puzzleSession, boardState.grid, player.currentAmmo);
  if (!hint) {
    showSystemBanner("NO HINT READY");
    return false;
  }

  highlightPuzzleHintColumn(hint.column);
  showSystemBanner(`HINT: ${hint.text.toUpperCase()}`);
  renderPuzzleBrief();
  return true;
}

function applyPuzzleSessionState() {
  if (!isPuzzleMode()) {
    state.puzzleSession = null;
    return;
  }

  state.puzzleSession = puzzleManager.createSession(state.activeLevel);
  state.playerMovesLeft = state.puzzleSession.moveLimit;
  boardState.grid = cloneGrid(state.puzzleSession.board);
  boardState.maxTile = getMaxTile(boardState.grid);
  state.lockedTiles = Array.isArray(state.puzzleSession.config.lockedTiles)
    ? state.puzzleSession.config.lockedTiles.map((tile) => ({ ...tile }))
    : [];
}

function applyPuzzleSpecialRuleAfterMove() {
  if (!isPuzzleMode() || !state.puzzleSession) {
    return;
  }

  if (state.puzzleSession.specialRule !== "gravity-shift") {
    return;
  }

  for (const row of boardState.grid) {
    row.reverse();
  }

  collapseColumnsTopToBottom(boardState.grid);
  boardState.maxTile = getMaxTile(boardState.grid);
  boardState.boardElement.classList.remove("is-shaking");
  void boardState.boardElement.offsetWidth;
  boardState.boardElement.classList.add("is-shaking");
  showSystemBanner("GRAVITY SHIFT");
}

function resolvePuzzleTurn(mergeResult) {
  if (!isPuzzleMode() || !state.puzzleSession) {
    return false;
  }

  if (mergeResult.scoreGained > 0) {
    const puzzlePraise = puzzleManager.checkOutcome(
      state.puzzleSession,
      boardState.score,
      boardState.maxTile,
      state.lockedTiles,
      boardState.grid
    ).praise;
    if (puzzlePraise) {
      showSystemBanner(puzzlePraise.toUpperCase());
    }
  }

  applyPuzzleSpecialRuleAfterMove();
  const outcome = puzzleManager.checkOutcome(
    state.puzzleSession,
    boardState.score,
    boardState.maxTile,
    state.lockedTiles,
    boardState.grid
  );
  renderPuzzleBrief();

  if (outcome.solved) {
    const stars = puzzleManager.recordWin(state.activeLevel, state.puzzleSession.movesUsed);
    unlockNextLevelForCurrentMode();
    registerThemeLevelWin();

    state.roundFinished = true;
    state.roundResult = `${outcome.praise || "Solved"} - ${stars} star${stars === 1 ? "" : "s"}.`;
    stopAiLoop();
    stopModeTimer();
    showGameOverPanel(
      "Puzzle Cleared",
      "Room Solved",
      `${outcome.praise || "Brilliant"} - ${stars} star${stars === 1 ? "" : "s"} earned.`,
      { action: "next", label: "Next" }
    );
    awardRunCoins("player-win");
    return true;
  }

  if (outcome.failed) {
    state.roundFinished = true;
    puzzleManager.markFailure(state.activeLevel);
    stopAiLoop();
    stopModeTimer();
    state.roundResult = puzzleManager.getFailureCopy(state.activeLevel, state.puzzleSession.movesUsed);
    showGameOverPanel("Almost!", "Retry Puzzle", state.roundResult, { action: "restart", label: "Play Again" });
    awardRunCoins("moves-over");
    return true;
  }

  if (outcome.almost) {
    showSystemBanner(outcome.almost.toUpperCase());
  }

  return false;
}

function setupModeState() {
  state.timeLeftMs = 0;
  state.playerMovesLeft = null;
  state.lastChaosEvent = "";
  state.puzzleSession = null;

  if (isSpeedMode()) {
    state.timeLeftMs = getSpeedModeTimeLimit(state.activeLevel);
    startModeTimer();
  }

  if (isPuzzleMode()) {
    applyPuzzleSessionState();
    player.currentAmmo = drawPuzzleAmmoValue("player");
    player.nextAmmo = drawPuzzleAmmoValue("player");
    ai.currentAmmo = createAmmoValue(state.modeIndex, "ai");
    ai.nextAmmo = createAmmoValue(state.modeIndex, "ai");
  }
}

function startModeTimer() {
  stopModeTimer();

  state.timerIntervalId = window.setInterval(() => {
    if (!state.roundActive || state.roundFinished || !isSpeedMode()) {
      stopModeTimer();
      return;
    }

    state.timeLeftMs = Math.max(0, state.timeLeftMs - 250);
    renderGameHeader();
    renderStatus();

    if (state.timeLeftMs <= 0) {
      finishRound("timeout");
    }
  }, 250);
}

function stopModeTimer() {
  if (state.timerIntervalId) {
    window.clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
}

function getRunScoreMultiplier(actor, mergeResult) {
  let multiplier = 1;

  if (isSpeedMode()) {
    multiplier *= 1.75;
  }

  if (actor.kind === "player") {
    multiplier *= 1 + (state.momentumLevel - 1) * 0.2;
    if (state.chainBoostArmed && mergeResult.scoreGained > 0) {
      multiplier *= 1.34;
    }
    multiplier *= Number(state.sessionModifier?.scoreMultiplier || 1);
  } else if (state.sessionModifier?.id === "fast-scoring") {
    multiplier *= 1.08;
  }

  return multiplier;
}

function applyScoreMultiplier(score, actor, mergeResult) {
  if (score <= 0) {
    return 0;
  }
  return Math.round(score * getRunScoreMultiplier(actor, mergeResult));
}

function applyModeAfterShot(actor, mergeResult) {
  if (isPuzzleMode() && actor.kind === "player") {
    state.playerMovesLeft = Math.max(0, (state.playerMovesLeft ?? 0) - 1);
    if (state.puzzleSession) {
      state.puzzleSession.movesUsed += 1;
    }
  }

  if (actor.kind === "player") {
    if (mergeResult.scoreGained > 0) {
      updateMomentumByMerge(actor, mergeResult);
    } else {
      decayMomentumForStall(actor);
    }

    if (state.magnetTurns > 0) {
      state.magnetTurns = Math.max(0, state.magnetTurns - 1);
    }

    if (state.freezeTurns > 0) {
      state.freezeTurns = Math.max(0, state.freezeTurns - 1);
    }

    state.lockedTiles = state.lockedTiles
      .map((tile) => ({ ...tile, turns: tile.turns - 1 }))
      .filter((tile) => tile.turns > 0 && getSelectedCellValue(tile.row, tile.col) > 0);
  }

  if (isChaosMode()) {
    triggerChaosEvent();
  }
}

function triggerChaosEvent() {
  const chaosChance = state.sessionModifier?.calm ? 0.2 : 0.34;
  if (Math.random() > chaosChance) {
    state.lastChaosEvent = "";
    return;
  }

  const eventId = ["shuffle", "merge", "blocker"][Math.floor(Math.random() * 3)];

  if (eventId === "shuffle") {
    shuffleBoardTiles(boardState.grid);
    state.lastChaosEvent = "Shuffle";
    showSystemBanner("BOARD SHUFFLED");
  } else if (eventId === "merge") {
    if (triggerRandomMerge(boardState.grid)) {
      state.lastChaosEvent = "Random Merge";
      boardState.maxTile = getMaxTile(boardState.grid);
      showSystemBanner("RANDOM MERGE");
    } else {
      state.lastChaosEvent = "No Merge";
    }
  } else if (spawnChaosBlocker(boardState.grid)) {
    state.lastChaosEvent = "Blocker";
    showSystemBanner("BLOCKER");
  } else {
    state.lastChaosEvent = "";
  }

  boardState.maxTile = getMaxTile(boardState.grid);
}

function buildBoard(board) {
  board.boardElement.innerHTML = "";
  board.tileElements = [];
  board.cellElements = [];

  board.boardElement.style.setProperty("--grid-size", String(board.cols));
  board.boardElement.style.setProperty("--grid-rows", String(board.rows));

  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("role", "gridcell");

      const tile = document.createElement("div");
      tile.className = "tile tile-empty";
      cell.append(tile);

      board.boardElement.append(cell);
      board.cellElements.push(cell);
      board.tileElements.push(tile);
    }
  }

  const animationLayer = document.createElement("div");
  animationLayer.className = "tile-animation-layer";
  animationLayer.setAttribute("aria-hidden", "true");
  board.boardElement.append(animationLayer);
  board.animationLayer = animationLayer;
}

async function handleHumanShot(column) {
  if (!state.roundActive || state.roundFinished || state.currentTurn !== "player" || boardState.isAnimating) {
    return;
  }

  if (isPuzzleMode() && state.puzzleSession && !puzzleManager.isColumnAllowed(state.puzzleSession, column)) {
    triggerBlockedFeedback(boardState);
    showSystemBanner("LANE LOCKED");
    return;
  }

  const result = await executeShot(player, column, true);
  if (result === "placed" && !state.roundFinished) {
    if (!hasAiOpponent()) {
      state.currentTurn = "player";
    } else {
      state.currentTurn = "ai";
      scheduleAiTurn(true);
    }
    renderStatus();
  }
}

async function executeShot(actor, column, withAudio) {
  if (column < 0 || column >= boardState.cols || boardState.isAnimating) {
    return "ignored";
  }

  const opportunitiesBefore =
    actor.kind === "player" ? getMergeOpportunityColumns(boardState.grid, actor.currentAmmo) : [];
  const outcome = getShotOutcome(boardState.grid, column);
  if (outcome.type === "blocked") {
    triggerBlockedFeedback(boardState);
    if (withAudio) {
      playBlockedSound();
    }

    if (actor.kind === "player" && getEmptyCellCount(boardState.grid) <= 2 && Math.random() < 0.55) {
      const assist = findRecoveryAssistSpawn(boardState.grid);
      if (assist) {
        boardState.grid[assist.row][assist.col] = assist.value;
        boardState.maxTile = getMaxTile(boardState.grid);
        showSystemBanner("ALMOST MAGIC");
        addTileEffectClass(boardState, assist.row, assist.col, "tile-spawn-pop");
      }
    }

    if (!hasAnyValidShots(boardState.grid)) {
      finishRound("board-full");
    }

    renderAll();
    return "blocked";
  }

  boardState.isAnimating = true;

  const isWildShot = actor.kind === "player" && state.wildTileArmed;
  const shotDisplayValue = isWildShot ? Math.max(64, actor.currentAmmo) : actor.currentAmmo;

  if (withAudio) {
    playShotSound(shotDisplayValue);
  }

  try {
    await animateShot(boardState, column, shotDisplayValue, outcome.row);
  } catch (error) {
    clearAnimationLayer(boardState);
  }

  const placedValue = isWildShot ? getWildPlacementValue(outcome.row, column, actor.currentAmmo) : actor.currentAmmo;
  boardState.grid[outcome.row][column] = placedValue;
  if (isWildShot) {
    state.wildTileArmed = false;
  }
  addTileEffectClass(boardState, outcome.row, column, "tile-spawn-pop");
  themeEffects.applySpawnEffect(getTileElement(boardState, outcome.row, column), placedValue);

  if (withAudio) {
    playLandingSound(placedValue);
  }

  const mergeResult = resolveAdjacentMerges(boardState.grid);
  const scoreGained = applyScoreMultiplier(mergeResult.scoreGained, actor, mergeResult);
  actor.score += scoreGained;
  boardState.score += scoreGained;
  boardState.maxTile = getMaxTile(boardState.grid);
  updateBestScore(boardState.score);
  syncThemeProgress();

  if (mergeResult.scoreGained > 0) {
    for (const cell of mergeResult.mergedCells) {
      addTileEffectClass(boardState, cell.row, cell.col, "tile-merge-pop");
      addTileEffectClass(boardState, cell.row, cell.col, "tile-merge-burst");
      themeEffects.applyMergeEffect(getTileElement(boardState, cell.row, cell.col), boardState.grid[cell.row][cell.col]);
    }

    if (withAudio) {
      playMergeSound(mergeResult.maxMergedValue, mergeResult.comboCount);
      if (mergeResult.comboCount > 1) {
        playComboSound(mergeResult.comboCount);
      }
    }

    triggerMergeFeedback(boardState, mergeResult.maxMergedValue);

    if (mergeResult.comboCount > 1) {
      showComboBanner(actor, mergeResult.comboCount);
      await maybePlayComboCinematic(mergeResult.comboCount);
      await wait(Math.min(150, 55 + mergeResult.comboCount * 20));
    } else {
      await wait(72);
    }
  } else if (actor.kind === "player" && opportunitiesBefore.length > 0) {
    triggerNearMissEffect(opportunitiesBefore, column);
  }

  if (actor.kind === "player" && state.chainBoostArmed && mergeResult.scoreGained > 0) {
    state.chainBoostArmed = false;
    showSystemBanner("CHAIN BOOST CASHED");
  }

  maybeApplyAlmostMagicRecovery(actor, mergeResult);
  maybeTriggerMicroEvent(actor, mergeResult);

  actor.shotCount += 1;
  actor.currentAmmo = actor.nextAmmo;
  actor.nextAmmo = isPuzzleMode() ? drawPuzzleAmmoValue(actor.kind) : createAmmoValue(state.modeIndex, actor.kind);
  maybeAssignRiskTile(actor);
  applyModeAfterShot(actor, mergeResult);

  if (actor.kind === "player" && state.flashTile) {
    state.flashTile.turns -= 1;
    if (state.flashTile.turns <= 0) {
      state.flashTile = null;
    }
  }

  state.turnIndex += 1;
  boardState.isAnimating = false;

  checkRunProgressMilestones();
  if (isPuzzleMode() && actor.kind === "player") {
    const puzzleResolved = resolvePuzzleTurn(mergeResult);
    storeGameSnapshot();
    renderAll();
    if (puzzleResolved) {
      return "placed";
    }
  } else {
    storeGameSnapshot();
    renderAll();
  }

  if (!isPuzzleMode() && hasReachedLevelTarget(boardState.maxTile, state.activeLevel)) {
    finishRound(actor.kind === "player" ? "player-win" : "ai-win");
    return "placed";
  }

  if (isPuzzleMode() && actor.kind === "player" && (state.playerMovesLeft ?? 0) <= 0) {
    finishRound("moves-over");
    return "placed";
  }

  if (!hasAnyValidShots(boardState.grid)) {
    finishRound("board-full");
    return "placed";
  }

  return "placed";
}

function finishRound(result) {
  if (!state.roundActive || state.roundFinished) {
    return;
  }

  state.roundFinished = true;
  clearNearMissMarks();
  stopAiLoop();
  stopModeTimer();
  boardState.boardElement.classList.add("is-game-over");

  const targetText = formatBigInt(getLevelTarget(state.activeLevel));

  if (isSpeedMode()) {
    if (result === "player-win") {
      unlockNextLevelForCurrentMode();
      registerThemeLevelWin();

      state.roundResult = `You reached ${targetText} before time ran out.`;
      showGameOverPanel("Speed Cleared", "You Win", `You reached ${targetText} before ${formatTimeLeft(getSpeedModeTimeLimit(state.activeLevel))} expired.`, { action: "next", label: "Next" });
    } else if (result === "timeout") {
      state.roundResult = `Time expired before ${targetText}.`;
      showGameOverPanel("Time Up", "Speed Failed", `The timer hit zero before you reached ${targetText}.`, { action: "restart", label: "Play Again" });
    } else {
      state.roundResult = `Board locked before ${targetText}.`;
      showGameOverPanel("Speed Failed", "Board Locked", `No more valid shots were left before you reached ${targetText}.`, { action: "restart", label: "Play Again" });
    }
    awardRunCoins(result);
    return;
  }

  if (result === "player-win") {
    unlockNextLevelForCurrentMode();
    registerThemeLevelWin();

    state.roundResult = `You reached ${targetText}.`;
    showGameOverPanel("Level Cleared", "You Win", `You reached the ${targetText} tile.`, { action: "next", label: "Next" });
  } else if (result === "ai-win") {
    state.roundResult = `AI reached ${targetText}.`;
    showGameOverPanel("Level Lost", "AI Wins", `The AI reached the ${targetText} tile first.`, { action: "restart", label: "Play Again" });
  } else if (result === "timeout") {
    state.roundResult = `Time expired before ${targetText}.`;
    showGameOverPanel("Time Up", "Level Failed", `The timer hit zero before you reached ${targetText}.`, { action: "restart", label: "Play Again" });
  } else if (result === "moves-over") {
    state.roundResult = `Moves exhausted before ${targetText}.`;
    showGameOverPanel("Puzzle Failed", "Out of Moves", `You used all available moves before reaching ${targetText}.`, { action: "restart", label: "Play Again" });
  } else {
    state.roundResult = `Board locked before ${targetText}.`;
    showGameOverPanel("Level Failed", "Board Locked", `No more valid shots were left before reaching ${targetText}.`, { action: "restart", label: "Play Again" });
  }

  awardRunCoins(result);
}

function showGameOverPanel(kicker, title, copy, { action = "restart", label = "Play Again" } = {}) {
  state.overlayAction = action;
  el.gameOverKicker.textContent = kicker;
  el.gameOverTitle.textContent = title;
  el.gameOverCopy.textContent = copy;
  el.overlayRestartBtn.textContent = label;
  el.gameOverPanel.classList.remove("hidden");
}

function hideGameOverPanel() {
  el.gameOverPanel.classList.add("hidden");
}

function renderAll() {
  applyLevelVisualTheme(getVisualLevel());
  renderBoard(boardState);
  renderAmmo();
  renderScoreboard();
  renderGameHeader();
  renderSpeedTimer();
  renderPuzzleBrief();
  renderStatus();
  renderSound();
  renderSettingsPanel();
  renderMetaButtons();
  renderThemeScreen();
  renderPowerShop();
  renderPowerActiveCard();
  if (state.powerDrawerOpen) {
    renderPowerDrawer();
  }
  renderLevels();
}

function renderBoard(board) {
  const visualLevel = getVisualLevel();
  const emptyCells = getEmptyCellCount(board.grid);
  let index = 0;

  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const value = board.grid[row][col];
      const tile = board.tileElements[index];
      const key = `${row},${col}`;
      const tileLabel = value > 0 ? formatTileLabel(value) : "";

      tile.className = `tile ${getTileClass(value)}`;
      tile.dataset.value = String(value);
      tile.dataset.digits = value === BLOCKER_TILE ? "1" : String(tileLabel.length || 1);
      tile.textContent = value === 0 ? "" : value === BLOCKER_TILE ? "X" : tileLabel;
      tile.classList.toggle("tile-alive", value >= 32);
      tile.classList.toggle("tile-pulse", value >= 512);
      tile.classList.toggle("tile-aura", value >= 2048);
      tile.classList.toggle("tile-flash", Boolean(state.flashTile && state.flashTile.row === row && state.flashTile.col === col));
      tile.classList.toggle("tile-locked", state.lockedTiles.some((locked) => locked.row === row && locked.col === col));
      tile.classList.toggle("tile-near-miss", state.nearMissCells.has(key));
      applyTileVisualStyle(tile, value, visualLevel);
      index += 1;
    }
  }

  board.boardElement.classList.toggle("is-danger", emptyCells <= 5 && !state.roundFinished);
  board.boardElement.classList.toggle("is-calm", emptyCells >= 22 && !state.roundFinished);
  board.boardElement.classList.toggle("is-magnetized", state.magnetTurns > 0);

  applyNearMergeHints(board);
  board.boardElement.classList.toggle("is-game-over", state.roundFinished);
}

function renderAmmo() {
  renderAmmoTile(player.currentAmmoElement, player.currentAmmo, "Your current tile");
  renderAmmoTile(player.nextAmmoElement, player.nextAmmo, "Your next tile");
  renderAmmoTile(ai.currentAmmoElement, ai.currentAmmo, "AI current tile");
  renderAmmoTile(ai.nextAmmoElement, ai.nextAmmo, "AI next tile");
  el.ammoPlayerNext.classList.toggle("is-risk-ammo", state.pendingRiskTileValue === player.nextAmmo && player.nextAmmo > player.currentAmmo);
}

function renderAmmoTile(element, value, label) {
  const baseClass = element.classList.contains("shot-tile") ? "shot-tile" : "shot-next";
  const isWild = element === player.currentAmmoElement && state.wildTileArmed;
  const tileLabel = isWild ? "W" : formatTileLabel(value);
  element.className = `${baseClass} tile ${isWild ? "tile-wild" : getTileClass(value)}`;
  element.dataset.value = isWild ? "wild" : String(value);
  element.dataset.digits = String(tileLabel.length || 1);
  element.textContent = tileLabel;
  element.setAttribute("aria-label", `${label}: ${isWild ? "wild" : tileLabel}`);

  if (isWild) {
    element.style.background = "linear-gradient(180deg, #fff4ba, #ffb96d)";
    element.style.color = "#3a2202";
    element.style.borderColor = "rgba(255,255,255,0.72)";
    element.style.boxShadow = "0 0 0 1px rgba(255,236,163,0.9), 0 0 16px rgba(255,193,105,0.62), inset 0 1px 0 rgba(255,255,255,0.34)";
  } else {
    applyTileVisualStyle(element, value, getVisualLevel());
  }
}

function renderScoreboard() {
  const best = state.bestScore.toLocaleString();
  const coins = formatCoins(state.powerBalance);
  el.bestScoreHome.textContent = formatCoins(state.powerBalance);
  el.bestScoreLevel.textContent = best;
  if (el.bestScoreTheme) {
    el.bestScoreTheme.textContent = coins;
  }
  if (el.powerBalance) {
    el.powerBalance.textContent = coins;
  }
  if (el.gameBalance) {
    el.gameBalance.textContent = coins;
  }
  if (el.gameScore) {
    el.gameScore.textContent = formatHudScore(boardState.score);
  }
}

function renderGameHeader() {
  el.targetValue.textContent = formatBigInt(getLevelTarget(state.activeLevel));
  const mode = getCurrentMode();
  el.gameMode.textContent = mode.label;
  el.aiLauncher.classList.toggle("hidden", !hasAiOpponent());

  let detailText = "";
  if (isPuzzleMode()) {
    detailText = `${state.playerMovesLeft ?? 0} moves`;
  } else if (isChaosMode() && state.lastChaosEvent) {
    detailText = state.lastChaosEvent;
  } else if (state.sessionModifier?.subtitle) {
    detailText = state.sessionModifier.subtitle;
  }

  el.modeDetailWrap.classList.toggle("hidden", detailText === "");
  el.modeDetail.textContent = detailText;
}

function renderSpeedTimer() {
  if (!el.speedTimerWrap || !el.speedTimerValue) {
    return;
  }

  const visible = isSpeedMode() && state.roundActive;
  el.speedTimerWrap.classList.toggle("hidden", !visible);
  if (!visible) {
    el.speedTimerWrap.classList.remove("is-warning", "is-critical");
    return;
  }

  el.speedTimerValue.textContent = formatTimeLeft(state.timeLeftMs);
  el.speedTimerWrap.classList.toggle("is-warning", state.timeLeftMs <= 30000 && state.timeLeftMs > 12000);
  el.speedTimerWrap.classList.toggle("is-critical", state.timeLeftMs <= 12000);
}

function getLevelTargetExponent(level) {
  return Math.max(9, Math.round(Number(level) || 1) + 8);
}

function getRunProgressRatio() {
  if (!state.roundActive) {
    return 0;
  }
  const currentExp = Math.log2(Math.max(1, boardState.maxTile));
  const targetExp = getLevelTargetExponent(state.activeLevel);
  return clamp(currentExp / targetExp, 0, 1);
}

function renderLiveMeta() {
  const ratio = getRunProgressRatio();
  const momentumRatio = clamp(state.momentumPoints / 100, 0, 1);

  el.momentumLevel.textContent = `x${state.momentumLevel}`;
  el.momentumFill.style.width = `${Math.round(momentumRatio * 100)}%`;
  el.runProgressLabel.textContent = `${Math.round(ratio * 100)}%`;
  el.runProgressFill.style.width = `${Math.round(ratio * 100)}%`;

  document.documentElement.style.setProperty("--momentum-heat", String((state.momentumLevel - 1) * 0.32));
}

function checkRunProgressMilestones() {
  if (!state.roundActive || state.roundFinished) {
    return;
  }

  const ratio = getRunProgressRatio();
  const milestones = [0.25, 0.5, 0.75];
  for (const milestone of milestones) {
    if (ratio >= milestone && !state.progressionMilestonesHit.has(milestone)) {
      state.progressionMilestonesHit.add(milestone);
      showSystemBanner(`${Math.round(milestone * 100)}% TO TARGET`);
    }
  }
}

function renderStatus() {
  if (!state.roundActive) {
    el.status.textContent = "Pick a level to begin.";
    return;
  }

  if (state.roundFinished) {
    el.status.textContent = state.roundResult || "Round complete.";
    return;
  }

  if (isPuzzleMode() && (state.playerMovesLeft ?? 0) <= 0) {
    el.status.textContent = "No player moves left.";
    return;
  }

  if (state.currentTurn === "player") {
    const modeText = isPuzzleMode() ? ` ${state.playerMovesLeft} moves left.` : "";
    const momentumText = state.momentumLevel > 1 ? ` Momentum x${state.momentumLevel}.` : "";
    const chainText = state.chainBoostArmed ? " Chain boost armed." : "";
    const powerText = state.selectedPowerId ? ` ${getPowerUseHint(state.selectedPowerId)}` : "";
    el.status.textContent = `Your turn. Place ${state.wildTileArmed ? "Wild" : formatTileLabel(player.currentAmmo)}.${modeText}${momentumText}${chainText}${powerText}`;
    return;
  }

  el.status.textContent = `AI is placing ${formatTileLabel(ai.currentAmmo)}.`;
}

function renderSound() {
  el.soundBtn.classList.toggle("is-muted", !state.sfxEnabled);
  el.soundBtn.textContent = state.sfxEnabled ? "SFX" : "SFX OFF";
  el.soundBtn.setAttribute("aria-label", state.sfxEnabled ? "Sound effects on" : "Sound effects off");
  el.settingsBtn.setAttribute("aria-label", "Audio settings");
}

function renderMetaButtons() {
  const ownedCount = getOwnedPowerUpCount();
  el.themeBtn.innerHTML = "&#10024; Themes";
  el.modeBtn.innerHTML = `&#9866; ${MODES[state.modeIndex].label}`;
  el.powerBtn.innerHTML = `&#9889; Power-Ups`;
  el.powerDrawerBtn.innerHTML = `&#9889;<span class="dock-btn-count">${ownedCount}</span>`;
  el.powerDrawerBtn.classList.toggle("has-stock", ownedCount > 0);
  el.powerDrawerBtn.setAttribute("aria-label", `Power-ups. ${ownedCount} owned`);
}

function updateBoardScale() {
  updateBoardScaleFor(boardState);

  const cellRect = boardState.cellElements[0]?.getBoundingClientRect();
  if (cellRect && cellRect.width > 0) {
    document.documentElement.style.setProperty("--cell-size", `${cellRect.width}px`);
  }
}

function updateBoardScaleFor(board) {
  const boardElement = board.boardElement;
  const hostRect = boardElement.parentElement?.getBoundingClientRect();
  const hostWidth = hostRect?.width ?? boardElement.getBoundingClientRect().width;

  if (!Number.isFinite(hostWidth) || hostWidth <= 0) {
    return;
  }

  const styles = window.getComputedStyle(boardElement);
  const gap = Number.parseFloat(styles.getPropertyValue("--board-gap")) || 6;
  const pad = Number.parseFloat(styles.getPropertyValue("--board-pad")) || 0;
  const widthCell = (hostWidth - pad * 2 - gap * (board.cols - 1)) / board.cols;

  const viewportHeight = window.innerHeight || 800;
  const maxBoardHeight = viewportHeight * 0.76;
  const heightCell = (maxBoardHeight - pad * 2 - gap * (board.rows - 1)) / board.rows;
  const cellSize = Math.max(24, Math.floor(Math.min(widthCell, heightCell)));

  boardElement.style.setProperty("--board-cell-size", `${cellSize}px`);

  const boardPixelWidth = cellSize * board.cols + gap * (board.cols - 1) + pad * 2;
  boardElement.style.width = `${Math.min(hostWidth, boardPixelWidth)}px`;

  const fontSize = Math.max(12, Math.min(38, cellSize * 0.45));
  boardElement.style.setProperty("--tile-font-size-base", `${fontSize}px`);
}

function applyNearMergeHints(board) {
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const tile = getTileElement(board, row, col);
      if (tile) {
        tile.classList.remove("tile-near-merge");
        tile.classList.remove("tile-magnetized");
      }
    }
  }

  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const value = board.grid[row][col];
      if (value <= 0) {
        continue;
      }

      const rightCol = col + 1;
      const downRow = row + 1;

      if (rightCol < board.cols && board.grid[row][rightCol] === value) {
        markNearMerge(board, row, col);
        markNearMerge(board, row, rightCol);
      }

      if (downRow < board.rows && board.grid[downRow][col] === value) {
        markNearMerge(board, row, col);
        markNearMerge(board, downRow, col);
      }
    }
  }
}

function markNearMerge(board, row, col) {
  const tile = getTileElement(board, row, col);
  if (tile && !tile.classList.contains("tile-empty")) {
    tile.classList.add("tile-near-merge");
    tile.classList.toggle("tile-magnetized", state.magnetTurns > 0);
  }
}

function scheduleAiTurn(immediate = false) {
  if (!state.roundActive || state.roundFinished || !hasAiOpponent() || state.currentTurn !== "ai" || boardState.isAnimating || !isGameVisible()) {
    return;
  }

  stopAiLoop();

  const base = isSpeedMode() ? Math.max(170, Math.round(activeAiProfile.speedMs * 0.68)) : activeAiProfile.speedMs;
  const jitter = Math.round(base * 0.16 * (Math.random() - 0.5));
  const delay = immediate ? Math.max(120, base - 260) : Math.max(170, base + jitter);

  aiMoveTimeoutId = window.setTimeout(() => {
    runAiTurn();
  }, delay);
}

function stopAiLoop() {
  if (aiMoveTimeoutId) {
    window.clearTimeout(aiMoveTimeoutId);
    aiMoveTimeoutId = null;
  }
}

async function runAiTurn() {
  if (!state.roundActive || state.roundFinished || !hasAiOpponent() || state.currentTurn !== "ai" || boardState.isAnimating || !isGameVisible()) {
    return;
  }

  if (state.freezeTurns > 0) {
    state.currentTurn = "player";
    showSystemBanner("TIME FROZEN");
    renderStatus();
    return;
  }

  const column = chooseAiColumn(activeAiProfile);
  if (column === null) {
    finishRound("board-full");
    return;
  }

  const result = await executeShot(ai, column, false);
  if (result === "placed" && !state.roundFinished) {
    state.currentTurn = "player";
    renderStatus();
  }
}

function chooseAiColumn(profile) {
  const validColumns = getValidColumns(boardState.grid);

  if (validColumns.length === 0) {
    return null;
  }

  if (Math.random() < profile.mistakeRate) {
    return chooseImperfectMove(validColumns, profile);
  }

  const scored = validColumns.map((column) => ({
    column,
    score: evaluateColumn(boardState.grid, ai.currentAmmo, column, profile.depth, profile)
  }));

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 1 && Math.random() < profile.noise * 0.28) {
    const poolSize = Math.min(2, scored.length);
    return scored[Math.floor(Math.random() * poolSize)].column;
  }

  return scored[0].column;
}

function chooseImperfectMove(validColumns, profile) {
  if (profile.depth === 0) {
    return validColumns[Math.floor(Math.random() * validColumns.length)];
  }

  const scored = validColumns.map((column) => {
    const sim = simulateShot(boardState.grid, column, ai.currentAmmo);
    return {
      column,
      score: sim.blocked ? Number.NEGATIVE_INFINITY : sim.score + evaluateGrid(sim.grid, profile) * 0.45
    };
  });

  scored.sort((a, b) => a.score - b.score);
  const start = Math.floor((scored.length - 1) / 2);
  const pool = scored.slice(start);
  return pool[Math.floor(Math.random() * pool.length)].column;
}

function evaluateColumn(grid, ammo, column, depth, profile) {
  const sim = simulateShot(grid, column, ammo);

  if (sim.blocked) {
    return Number.NEGATIVE_INFINITY;
  }

  const weights = profile.weights;
  const immediate = sim.score * (weights.score ?? 1) + evaluateGrid(sim.grid, profile);

  if (depth <= 0 || sim.gameOver) {
    return immediate;
  }

  const future = evaluateFuture(sim.grid, depth - 1, profile);
  return immediate + future * profile.lookahead;
}

function evaluateFuture(grid, depth, profile) {
  if (depth < 0 || !hasAnyValidShots(grid)) {
    return -900;
  }

  const ammos = getSearchAmmoDistribution(state.modeIndex, profile.ammoSamples, "ai");
  let expected = 0;

  for (const ammo of ammos) {
    const best = bestFutureForAmmo(grid, ammo.value, depth, profile);
    expected += best * ammo.probability;
  }

  return expected;
}

function bestFutureForAmmo(grid, ammo, depth, profile) {
  const validColumns = getValidColumns(grid);

  if (validColumns.length === 0) {
    return -1100;
  }

  const quick = validColumns
    .map((column) => ({ column, score: quickEstimate(grid, ammo, column, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, profile.branch));

  let best = Number.NEGATIVE_INFINITY;

  for (const candidate of quick) {
    const score = evaluateColumn(grid, ammo, candidate.column, depth, profile);
    if (score > best) {
      best = score;
    }
  }

  return best;
}

function quickEstimate(grid, ammo, column, profile) {
  const sim = simulateShot(grid, column, ammo);

  if (sim.blocked) {
    return Number.NEGATIVE_INFINITY;
  }

  return sim.score + evaluateGrid(sim.grid, profile) * 0.5;
}

function evaluateGrid(grid, profile) {
  const metrics = collectMetrics(grid);
  const weights = profile.weights;

  return (
    metrics.empty * (weights.empty ?? 0) +
    metrics.merge * (weights.merge ?? 0) +
    metrics.chain * (weights.chain ?? 0) +
    metrics.mono * (weights.mono ?? 0) +
    metrics.smooth * (weights.smooth ?? 0) +
    metrics.corner * (weights.corner ?? 0) +
    metrics.stability * (weights.stability ?? 0) +
    metrics.max * (weights.max ?? 0) +
    metrics.risk * (weights.risk ?? 0)
  );
}

function collectMetrics(grid) {
  let empty = 0;
  let merge = 0;
  let chain = 0;
  let smooth = 0;
  let mono = 0;
  let maxTile = 0;
  let risk = 0;

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const value = grid[row][col];

      if (value <= 0) {
        if (value === 0) {
          empty += 1;
        } else {
          risk -= 2.5;
        }
        continue;
      }

      maxTile = Math.max(maxTile, value);

      const right = col + 1 < grid[row].length ? grid[row][col + 1] : null;
      const down = row + 1 < grid.length ? grid[row + 1][col] : null;

      if (right !== null) {
        if (right === value) {
          merge += 1;
        }

        if (right > 0) {
          smooth -= Math.abs(Math.log2(value) - Math.log2(right));
        }
      }

      if (down !== null) {
        if (down === value) {
          merge += 1;
        }

        if (down > 0) {
          smooth -= Math.abs(Math.log2(value) - Math.log2(down));
        }
      }

      if (col + 2 < grid[row].length && grid[row][col + 1] === value && grid[row][col + 2] === value) {
        chain += 1;
      }

      if (row + 2 < grid.length && grid[row + 1][col] === value && grid[row + 2][col] === value) {
        chain += 1;
      }
    }
  }

  for (let row = 0; row < grid.length; row += 1) {
    let inc = 0;
    let dec = 0;

    for (let col = 0; col < grid[row].length - 1; col += 1) {
      const a = grid[row][col] <= 0 ? 0 : Math.log2(grid[row][col]);
      const b = grid[row][col + 1] <= 0 ? 0 : Math.log2(grid[row][col + 1]);
      if (a > b) inc += 1;
      if (b > a) dec += 1;
    }

    mono += Math.max(inc, dec);
  }

  for (let col = 0; col < grid[0].length; col += 1) {
    let fill = 0;
    let inc = 0;
    let dec = 0;

    for (let row = 0; row < grid.length; row += 1) {
      if (grid[row][col] !== 0) {
        fill += 1;
      }

      if (row < grid.length - 1) {
        const a = grid[row][col] <= 0 ? 0 : Math.log2(grid[row][col]);
        const b = grid[row + 1][col] <= 0 ? 0 : Math.log2(grid[row + 1][col]);
        if (a > b) inc += 1;
        if (b > a) dec += 1;
      }
    }

    mono += Math.max(inc, dec);

    if (fill >= grid.length - 1) {
      risk -= 3;
    } else if (fill >= grid.length - 2) {
      risk -= 1.5;
    }
  }

  const corner = maxTile > 0 && (grid[0][0] === maxTile || grid[0][grid[0].length - 1] === maxTile) ? 1 : 0;
  const stability = empty + merge * 0.8 + mono * 0.2;

  return {
    empty,
    merge,
    chain,
    mono,
    smooth,
    corner,
    stability,
    max: Math.log2(Math.max(1, maxTile)),
    risk
  };
}

function getSearchAmmoDistribution(modeIndex, samples, actorKind = "ai") {
  const distribution = getAmmoDistribution(modeIndex, actorKind)
    .slice()
    .sort((a, b) => b.probability - a.probability)
    .slice(0, Math.max(1, samples));

  const total = distribution.reduce((sum, item) => sum + item.probability, 0) || 1;

  return distribution.map((item) => ({
    value: item.value,
    probability: item.probability / total
  }));
}

function getAiProfileForLevel(level) {
  const tier = AI_TIERS.find((entry) => level >= entry.from && level <= entry.to) || AI_TIERS[0];
  const span = Math.max(1, tier.to - tier.from);
  const progress = (level - tier.from) / span;
  const calmFactor = state.sessionModifier?.calm ? 1.14 : 1;

  const baseDepth = Math.round(lerp(tier.depth[0], tier.depth[1], progress));
  const easedDepth = Math.max(0, baseDepth - (level <= 75 ? 1 : 0));
  const baseMistake = lerp(tier.mistake[0], tier.mistake[1], progress);
  const mistakeRate = clamp(baseMistake + (state.sessionModifier?.calm ? 0.2 : 0.15), 0.08, 0.95);
  const baseSpeed = Math.round(lerp(tier.speed[0], tier.speed[1], progress));
  const speedMs = Math.round(baseSpeed * 1.22 * calmFactor);
  const speedLabel = speedMs >= 1050 ? "Slow" : speedMs >= 700 ? "Medium" : "Fast";
  const depthDisplay = tier.depth[0] === tier.depth[1] ? String(tier.depth[0]) : `${tier.depth[0]}-${tier.depth[1]}`;

  return {
    ...tier,
    depth: easedDepth,
    depthDisplay,
    mistakeRate,
    speedMs,
    speedLabel
  };
}

function getValidColumns(grid) {
  const valid = [];

  for (let col = 0; col < grid[0].length; col += 1) {
    if (getShotOutcome(grid, col).type !== "blocked") {
      valid.push(col);
    }
  }

  return valid;
}

function simulateShot(grid, column, ammo) {
  const nextGrid = cloneGrid(grid);
  const outcome = getShotOutcome(nextGrid, column);

  if (outcome.type === "blocked") {
    return { blocked: true, grid: nextGrid, score: 0, gameOver: true };
  }

  nextGrid[outcome.row][column] = ammo;
  const merge = resolveAdjacentMerges(nextGrid, { simulate: true });

  return {
    blocked: false,
    grid: nextGrid,
    score: merge.scoreGained,
    gameOver: !hasAnyValidShots(nextGrid)
  };
}

function getShotOutcome(grid, column) {
  for (let row = 0; row < grid.length; row += 1) {
    if (grid[row][column] === 0) {
      return { type: "place", row };
    }
  }

  return { type: "blocked", row: null };
}

function hasAnyValidShots(grid) {
  for (let col = 0; col < grid[0].length; col += 1) {
    if (getShotOutcome(grid, col).type !== "blocked") {
      return true;
    }
  }

  return false;
}

function resolveAdjacentMerges(grid, { simulate = false } = {}) {
  let totalScore = 0;
  let comboCount = 0;
  let maxMergedValue = 0;
  const mergedCells = [];
  let mergedInPass = false;
  let flashConsumed = false;

  do {
    mergedInPass = false;
    const mergedFlags = new Set();
    const merges = [];

    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid[row].length; col += 1) {
        const currentValue = grid[row][col];
        if (currentValue <= 0) {
          continue;
        }

        const currentKey = `${row},${col}`;
        if (mergedFlags.has(currentKey)) {
          continue;
        }

        const rightCol = col + 1;
        const downRow = row + 1;

        if (rightCol < grid[row].length && grid[row][rightCol] === currentValue && !mergedFlags.has(`${row},${rightCol}`)) {
          const hasFlash =
            !simulate &&
            state.flashTile &&
            !flashConsumed &&
            ((state.flashTile.row === row && state.flashTile.col === col) || (state.flashTile.row === row && state.flashTile.col === rightCol));
          merges.push({
            keepRow: row,
            keepCol: col,
            clearRow: row,
            clearCol: rightCol,
            nextValue: currentValue * (hasFlash ? 4 : 2),
            flashMerge: hasFlash
          });
          mergedFlags.add(currentKey);
          mergedFlags.add(`${row},${rightCol}`);
          continue;
        }

        if (downRow < grid.length && grid[downRow][col] === currentValue && !mergedFlags.has(`${downRow},${col}`)) {
          const hasFlash =
            !simulate &&
            state.flashTile &&
            !flashConsumed &&
            ((state.flashTile.row === row && state.flashTile.col === col) || (state.flashTile.row === downRow && state.flashTile.col === col));
          merges.push({
            keepRow: row,
            keepCol: col,
            clearRow: downRow,
            clearCol: col,
            nextValue: currentValue * (hasFlash ? 4 : 2),
            flashMerge: hasFlash
          });
          mergedFlags.add(currentKey);
          mergedFlags.add(`${downRow},${col}`);
        }
      }
    }

    if (merges.length === 0) {
      continue;
    }

    mergedInPass = true;
    comboCount += merges.length;

    for (const merge of merges) {
      grid[merge.keepRow][merge.keepCol] = merge.nextValue;
      grid[merge.clearRow][merge.clearCol] = 0;
      totalScore += merge.nextValue;
      maxMergedValue = Math.max(maxMergedValue, merge.nextValue);
      mergedCells.push({ row: merge.keepRow, col: merge.keepCol });
      if (merge.flashMerge) {
        flashConsumed = true;
      }
    }

    collapseColumnsTopToBottom(grid);
  } while (mergedInPass);

  if (flashConsumed && !simulate) {
    state.flashTile = null;
    showSystemBanner("FLASH MERGE");
  }

  return { scoreGained: totalScore, comboCount, maxMergedValue, mergedCells };
}

function collapseColumnsTopToBottom(grid) {
  for (let col = 0; col < grid[0].length; col += 1) {
    const values = [];
    const lockedRows = new Map();

    for (let row = 0; row < grid.length; row += 1) {
      const locked = state.lockedTiles.find((tile) => tile.row === row && tile.col === col);
      if (locked && grid[row][col] > 0) {
        lockedRows.set(row, grid[row][col]);
        continue;
      }

      if (grid[row][col] !== 0) {
        values.push(grid[row][col]);
      }
    }

    for (let row = 0; row < grid.length; row += 1) {
      if (lockedRows.has(row)) {
        grid[row][col] = lockedRows.get(row) ?? 0;
      } else {
        grid[row][col] = values.shift() ?? 0;
      }
    }
  }
}

async function animateShot(board, column, shotValue, targetRow) {
  if (!board.animationLayer || targetRow === null) {
    return;
  }

  const boardRect = board.boardElement.getBoundingClientRect();
  const targetRect = getCellRect(board, targetRow, column);
  if (!targetRect) {
    return;
  }

  const ghost = createShotGhost(board, shotValue, boardRect, targetRect);
  await nextFrame();
  await animateShotGhost(ghost, boardRect, targetRect);
  ghost.remove();
}

function createShotGhost(board, value, boardRect, targetRect) {
  const ghost = document.createElement("div");
  const left = targetRect.left - boardRect.left;
  const top = boardRect.height + targetRect.height * 0.25;

  ghost.className = `tile ${getTileClass(value)} tile-ghost tile-shot`;
  ghost.dataset.digits = String(formatTileLabel(value).length || 1);
  ghost.dataset.rawValue = String(value);
  ghost.textContent = formatTileLabel(value);
  ghost.style.width = `${targetRect.width}px`;
  ghost.style.height = `${targetRect.height}px`;
  ghost.style.left = `${left}px`;
  ghost.style.top = `${top}px`;
  applyTileVisualStyle(ghost, value, getVisualLevel());

  board.animationLayer.append(ghost);
  return ghost;
}

function animateShotGhost(ghost, boardRect, targetRect) {
  const startTop = boardRect.height + targetRect.height * 0.25;
  const endTop = targetRect.top - boardRect.top;
  const deltaY = endTop - startTop;
  const duration = getShotTravelMs();
  const easing = getThemeAnimationEasing();

  themeEffects.applyMoveEffect(ghost, Number.parseInt(ghost.dataset.rawValue || ghost.textContent || "0", 10));

  if (typeof ghost.animate === "function") {
    const anticipation = Math.max(-12, -4 - Math.abs(deltaY) * 0.04);
    const animation = ghost.animate(
      [
        { transform: "translate3d(0px, 0px, 0px) scale(0.84, 1.14) rotate(-4deg)", opacity: 0.88, filter: "brightness(1.08)" },
        { offset: 0.16, transform: `translate3d(0px, ${anticipation}px, 0px) scale(1.02, 0.96) rotate(0deg)`, opacity: 1, filter: "brightness(1.22)" },
        { offset: 0.82, transform: `translate3d(0px, ${Math.round(deltaY * 0.92)}px, 0px) scale(0.98, 1.04) rotate(1deg)`, opacity: 1, filter: "brightness(1.1)" },
        { transform: `translate3d(0px, ${deltaY}px, 0px) scale(1.02) rotate(0deg)`, opacity: 1, filter: "brightness(1)" }
      ],
      { duration, easing, fill: "forwards" }
    );

    return animation.finished.catch(() => undefined);
  }

  ghost.style.transition = `transform ${duration}ms ${easing}`;
  ghost.style.transform = `translate3d(0px, ${deltaY}px, 0px)`;
  return wait(duration);
}

function addTileEffectClass(board, row, col, className) {
  const tile = getTileElement(board, row, col);

  if (!tile || tile.classList.contains("tile-empty")) {
    return;
  }

  tile.classList.remove(className);
  void tile.offsetWidth;
  tile.classList.add(className);
  tile.addEventListener(
    "animationend",
    () => {
      tile.classList.remove(className);
    },
    { once: true }
  );
}

function triggerBlockedFeedback(board) {
  const speed = themeManager.getTheme().animationProfile?.speed || 1;
  const duration = Math.max(120, Math.round(180 * speed));

  board.boardElement.classList.remove("is-blocked");
  void board.boardElement.offsetWidth;
  board.boardElement.classList.add("is-blocked");

  window.setTimeout(() => {
    board.boardElement.classList.remove("is-blocked");
  }, duration);
}

function triggerMergeFeedback(board, maxMergedValue) {
  const theme = themeManager.getTheme();
  const speed = theme.animationProfile?.speed || 1;
  const intensity = theme.effectIntensity?.multiplier || 1;
  const progressive = Math.min(1, Math.max(0, Math.log2(Math.max(2, maxMergedValue)) / 12));
  const glowStrength = 0.24 + progressive * 0.42 * intensity;
  const shakeThreshold = theme.id === "neon-energy" ? 64 : 128;
  const impactOpacity = Math.min(0.9, 0.34 + progressive * 0.38 * intensity);
  const impactScale = Math.max(0.82, 0.94 - progressive * 0.12);
  const impactHue = Math.round((204 + Math.log2(Math.max(2, maxMergedValue)) * 10) % 360);
  const impactDuration = Math.max(220, Math.round((320 + progressive * 160) * speed));

  board.boardElement.style.filter = `drop-shadow(0 0 ${Math.round(10 + 20 * progressive * intensity)}px rgba(120, 186, 255, ${glowStrength.toFixed(2)}))`;
  board.boardElement.style.setProperty("--impact-opacity", impactOpacity.toFixed(3));
  board.boardElement.style.setProperty("--impact-scale", impactScale.toFixed(3));
  board.boardElement.style.setProperty("--impact-hue", String(impactHue));
  board.boardElement.style.setProperty("--impact-duration", `${impactDuration}ms`);
  board.boardElement.classList.add("is-glow");
  board.boardElement.classList.remove("is-impact");
  void board.boardElement.offsetWidth;
  board.boardElement.classList.add("is-impact");

  if (maxMergedValue >= shakeThreshold) {
    board.boardElement.classList.remove("is-shaking");
    void board.boardElement.offsetWidth;
    board.boardElement.classList.add("is-shaking");
  }

  if (board.feedbackTimeoutId) {
    window.clearTimeout(board.feedbackTimeoutId);
  }

  board.feedbackTimeoutId = window.setTimeout(() => {
    board.boardElement.classList.remove("is-impact");
    board.boardElement.classList.remove("is-glow");
    board.boardElement.classList.remove("is-shaking");
    board.boardElement.style.filter = "";
    board.boardElement.style.removeProperty("--impact-opacity");
    board.boardElement.style.removeProperty("--impact-scale");
    board.boardElement.style.removeProperty("--impact-hue");
    board.boardElement.style.removeProperty("--impact-duration");
  }, Math.max(impactDuration, Math.round(220 * speed)));
}

async function maybePlayComboCinematic(comboCount) {
  if (comboCount < 3) {
    return;
  }

  boardState.boardElement.classList.remove("is-slowmo");
  void boardState.boardElement.offsetWidth;
  boardState.boardElement.classList.add("is-slowmo");
  await wait(Math.min(170, 80 + comboCount * 12));
  boardState.boardElement.classList.remove("is-slowmo");
}

function showComboBanner(actor, comboCount) {
  const celebration = getComboCelebration(comboCount);
  boardState.comboElement.textContent = `${actor.kind === "player" ? "YOU" : "AI"} ${celebration.label} x${comboCount}`;
  boardState.comboElement.classList.toggle("is-ai", actor.kind === "ai");
  boardState.comboElement.classList.toggle("is-big", comboCount >= 4);
  boardState.comboElement.classList.toggle("is-huge", comboCount >= 7);
  boardState.comboElement.classList.remove("is-visible");
  void boardState.comboElement.offsetWidth;
  boardState.comboElement.classList.add("is-visible");
  themeEffects.applyComboEffect(comboCount, boardState.comboElement);

  if (boardState.comboTimeoutId) {
    window.clearTimeout(boardState.comboTimeoutId);
  }

  boardState.comboTimeoutId = window.setTimeout(() => {
    boardState.comboElement.classList.remove("is-visible");
  }, Math.min(820, 560 + comboCount * 36));
}

function clearAnimationLayer(board) {
  if (board.animationLayer) {
    board.animationLayer.innerHTML = "";
  }
}

function getCellIndex(board, row, col) {
  return row * board.cols + col;
}

function getTileElement(board, row, col) {
  return board.tileElements[getCellIndex(board, row, col)] || null;
}

function getCellRect(board, row, col) {
  const cell = board.cellElements[getCellIndex(board, row, col)];
  return cell ? cell.getBoundingClientRect() : null;
}

function updateBestScore(score) {
  if (score > state.bestScore) {
    state.bestScore = score;
    saveBestScore(state.bestScore);
  }
}

function syncThemeProgress() {
  const unlockedNow = themeManager.updateProgress({
    gamesPlayed: themeManager.getProgress().gamesPlayed,
    levelWins: themeManager.getProgress().levelWins,
    bestScore: state.bestScore,
    maxTile: boardState.maxTile,
    coins: state.powerBalance
  });

  if (unlockedNow.length > 0) {
    showSystemBanner(`THEME UNLOCKED: ${unlockedNow[0].name.toUpperCase()}`);
  }
}

function createAmmoValue(modeIndex, actorKind = "player") {
  const distribution = getAmmoDistribution(modeIndex, actorKind);
  const random = Math.random();
  let cumulative = 0;

  for (const item of distribution) {
    cumulative += item.probability;
    if (random <= cumulative) {
      return item.value;
    }
  }

  return distribution[distribution.length - 1].value;
}

function normalizeDistribution(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0) || 1;
  return items.map((item) => ({
    value: item.value,
    probability: item.weight / total
  }));
}

function buildAdaptivePlayerDistribution(modeId) {
  const referenceTile = Math.max(boardState.maxTile, player.currentAmmo, player.nextAmmo, 2);
  const cap = getDynamicPlayerShotCap(referenceTile, state.activeLevel);
  const floor = Math.min(cap, getDynamicPlayerShotFloor(referenceTile, state.activeLevel));
  const values = [];

  for (let value = floor; value <= cap; value *= 2) {
    values.push(value);
  }

  const highest = values[values.length - 1] || 64;
  const maxExp = Math.log2(highest);
  const minExp = 1;
  let curve = referenceTile >= 512 ? 2.2 : 1.2;

  if (modeId === "puzzle") {
    curve -= 0.28;
  } else if (modeId === "speed") {
    curve += 0.16;
  }

  const boosted = values.map((value) => {
    const exp = Math.log2(value);
    const norm = (exp - minExp) / Math.max(1, maxExp - minExp);
    let weight = 1 + Math.pow(Math.max(0, norm), curve) * (8 + Number(state.sessionModifier?.ammoBoost || 0) * 10);

    if (referenceTile >= 512) {
      weight *= 0.45 + norm * 2.1;
      if (value <= 8) {
        weight *= 0.32;
      }
    }

    if (modeId === "puzzle" && value <= 16) {
      weight *= 1.18;
    }

    if (modeId === "speed" && value >= 32) {
      weight *= 1.1;
    }

    if (state.sessionModifier?.id === "high-fours" && value >= 4) {
      weight *= 1.22;
    }

    return { value, weight };
  });

  return normalizeDistribution(boosted);
}

function getAmmoDistribution(modeIndex, actorKind = "player") {
  const modeId = MODES[modeIndex]?.id ?? "classic";
  if (actorKind === "player") {
    return buildAdaptivePlayerDistribution(modeId);
  }

  if (modeId === "speed") {
    return [
      { value: 2, probability: 0.38 },
      { value: 4, probability: 0.26 },
      { value: 8, probability: 0.18 },
      { value: 16, probability: 0.12 },
      { value: 32, probability: 0.06 }
    ];
  }

  if (modeId === "puzzle") {
    return [
      { value: 2, probability: 0.58 },
      { value: 4, probability: 0.24 },
      { value: 8, probability: 0.12 },
      { value: 16, probability: 0.06 }
    ];
  }

  if (modeId === "chaos") {
    return [
      { value: 2, probability: 0.3 },
      { value: 4, probability: 0.23 },
      { value: 8, probability: 0.18 },
      { value: 16, probability: 0.15 },
      { value: 32, probability: 0.1 },
      { value: 64, probability: 0.04 }
    ];
  }

  return [
    { value: 2, probability: 0.44 },
    { value: 4, probability: 0.23 },
    { value: 8, probability: 0.14 },
    { value: 16, probability: 0.1 },
    { value: 32, probability: 0.07 },
    { value: 64, probability: 0.02 }
  ];
}

function getTileClass(value) {
  if (value === BLOCKER_TILE) {
    return "tile-blocker";
  }

  const explicit = new Set([0, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]);

  if (!explicit.has(value)) {
    return "tile-super";
  }

  if (value === 0) {
    return "tile-empty";
  }

  return `tile-${value}`;
}

function getShotTravelMs() {
  const base = isSpeedMode() ? 130 : SHOT_TRAVEL_MS;
  const speed = themeManager.getTheme().animationProfile?.speed || 1;
  const momentumBoost = state.momentumLevel >= 3 ? 0.9 : 1;
  const magnetBoost = state.magnetTurns > 0 ? 0.86 : 1;
  return Math.max(84, Math.round(base * speed * momentumBoost * magnetBoost));
}

function getThemeAnimationEasing(fallback = SHOT_EASING) {
  return themeManager.getTheme().animationProfile?.easing || fallback;
}

function getVisualLevel() {
  if (state.roundActive) {
    return state.activeLevel;
  }

  if (!el.levels.classList.contains("hidden")) {
    return state.selectedLevel;
  }

  return state.unlockedLevel;
}

function getLevelScenePreset(level) {
  const safeLevel = clamp(Math.round(Number(level) || 1), 1, LEVEL_COUNT);
  const sceneLevel = clamp(Math.ceil(safeLevel / 2), 1, LEVEL_SCENE_BACKGROUNDS.length);
  const sceneEffects = LEVEL_SCENE_EFFECTS[sceneLevel] || {};
  return {
    sceneLevel,
    background: LEVEL_SCENE_BACKGROUNDS[sceneLevel - 1],
    backgroundSize: sceneEffects.backgroundSize || "",
    backgroundBlendMode: sceneEffects.backgroundBlendMode || "",
    animation: sceneEffects.animation || "",
    boxShadow: sceneEffects.boxShadow || ""
  };
}

function applyLevelVisualTheme(level) {
  const palette = getLevelPalette(level, themeManager.getTheme());
  const rootStyle = document.documentElement.style;
  const gameStyle = el.game.style;

  rootStyle.setProperty("--bg-1", palette.bg1);
  rootStyle.setProperty("--bg-2", palette.bg2);
  rootStyle.setProperty("--bg-3", palette.bg3);
  rootStyle.setProperty("--glow-1", palette.glow1);
  rootStyle.setProperty("--glow-2", palette.glow2);
  rootStyle.setProperty("--board-field-bg", palette.boardFieldBackground);
  rootStyle.setProperty("--board-field-size", palette.boardBackgroundSize);
  rootStyle.setProperty("--board-field-anim", palette.boardAnimation);
  rootStyle.setProperty("--board-slot-bg", palette.boardCellBackground);
  rootStyle.setProperty("--board-slot-size", palette.boardBackgroundSize);
  rootStyle.setProperty("--board-slot-anim", palette.boardAnimation);

  gameStyle.background = palette.pageBackground;
  gameStyle.backgroundSize = palette.pageBackgroundSize;
  gameStyle.backgroundBlendMode = palette.pageBackgroundBlendMode;
  gameStyle.animation = palette.pageAnimation;
  gameStyle.boxShadow = palette.pageBoxShadow;
}

function getLevelPalette(level, theme) {
  const scene = getLevelScenePreset(level);
  const progress = clamp((scene.sceneLevel - 1) / Math.max(1, LEVEL_SCENE_BACKGROUNDS.length - 1), 0, 1);
  const palette = theme?.palette || {};
  const themeShift = Number(palette.hueShift || 0);
  const glowBoost = Number(palette.glowBoost || 1);
  const hueA = (208 + scene.sceneLevel * 11 + themeShift) % 360;
  const hueB = (hueA + 70 + progress * 90) % 360;
  const hueC = (hueA + 150 + progress * 70) % 360;
  const richness = 54 + progress * 28 + Number(palette.saturationBoost || 0) * 0.14;
  const depth = 7 + progress * 4;
  const boardTopOverlay = (0.15 + progress * 0.09).toFixed(3);
  const boardBottomOverlay = (0.24 + progress * 0.16).toFixed(3);
  const slotTopOverlay = (0.22 - progress * 0.06).toFixed(3);
  const slotBottomOverlay = (0.14 + progress * 0.1).toFixed(3);
  return {
    bg1: `hsl(${hueA} ${richness}% ${depth}%)`,
    bg2: `hsl(${hueB} ${Math.min(92, richness + 8)}% ${depth + 6}%)`,
    bg3: `hsl(${hueC} ${Math.min(94, richness + 12)}% ${depth + 12}%)`,
    glow1: `hsla(${hueA}, ${78 + progress * 18}%, ${56 + progress * 10}%, ${(0.22 + progress * 0.18) * glowBoost})`,
    glow2: `hsla(${hueB}, ${82 + progress * 12}%, ${58 + progress * 10}%, ${(0.18 + progress * 0.16) * glowBoost})`,
    boardFieldBackground: `linear-gradient(180deg, rgba(9, 12, 18, ${boardTopOverlay}), rgba(9, 12, 18, ${boardBottomOverlay})), ${scene.background}`,
    boardCellBackground: `linear-gradient(180deg, rgba(255, 255, 255, ${slotTopOverlay}), rgba(6, 10, 18, ${slotBottomOverlay})), ${scene.background}`,
    boardBackgroundSize: scene.backgroundSize || "260% 260%",
    boardAnimation: scene.animation || "none",
    pageBackground: scene.background,
    pageBackgroundSize: scene.backgroundSize || "",
    pageBackgroundBlendMode: scene.backgroundBlendMode || "",
    pageAnimation: scene.animation || "",
    pageBoxShadow: scene.boxShadow || ""
  };
}

function getTileToneByValue(value) {
  const tones = {
    2: { h: 41, s: 40, l1: 70, l2: 62, text: "#f7f3ea" },
    4: { h: 203, s: 42, l1: 69, l2: 61, text: "#f2f8ff" },
    8: { h: 307, s: 50, l1: 71, l2: 64, text: "#2f2030" },
    16: { h: 282, s: 36, l1: 76, l2: 68, text: "#2d2133" },
    32: { h: 358, s: 55, l1: 72, l2: 65, text: "#301d1f" },
    64: { h: 220, s: 43, l1: 73, l2: 66, text: "#242d3b" },
    128: { h: 41, s: 42, l1: 71, l2: 63, text: "#f7f2e8" },
    256: { h: 158, s: 47, l1: 77, l2: 69, text: "#21342d" },
    512: { h: 203, s: 45, l1: 70, l2: 62, text: "#f2f8ff" },
    1024: { h: 324, s: 48, l1: 74, l2: 66, text: "#2e2028" },
    2048: { h: 75, s: 52, l1: 68, l2: 60, text: "#27301f" },
    4096: { h: 330, s: 56, l1: 74, l2: 66, text: "#2f1f2a" },
    8192: { h: 219, s: 36, l1: 68, l2: 60, text: "#f3f7ff" }
  };

  if (tones[value]) {
    return tones[value];
  }

  const exp = Math.max(1, Math.log2(value));
  return {
    h: (200 + exp * 27) % 360,
    s: 46,
    l1: 72,
    l2: 63,
    text: "#f6fbff"
  };
}

function applyTileVisualStyle(element, value, level, themeOverride = null) {
  if (value === 0) {
    element.style.background = "";
    element.style.color = "";
    element.style.borderColor = "";
    element.style.boxShadow = "";
    element.style.textShadow = "";
    return;
  }

  if (value === BLOCKER_TILE) {
    element.style.background = "linear-gradient(135deg, #6c7387, #353b49)";
    element.style.color = "#eef4ff";
    element.style.borderColor = "rgba(255,255,255,0.18)";
    element.style.boxShadow = "0 10px 18px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.18)";
    element.style.textShadow = "0 1px 0 rgba(0, 0, 0, 0.24)";
    return;
  }

  const theme = themeOverride || themeManager.getTheme();
  const palette = theme.palette || {};
  const scene = getLevelScenePreset(level);
  const tone = getTileToneByValue(value);
  const prestige = getThemePrestige(theme.id);
  const variant = getThemeVariant(theme.id);
  const hueShift = Number(palette.tileHueShift || 0);
  const saturationBoost = Number(palette.saturationBoost || 0) * 0.42;
  const intensity = Number(theme.effectIntensity?.multiplier || 1);
  const progress = clamp((scene.sceneLevel - 1) / Math.max(1, LEVEL_SCENE_BACKGROUNDS.length - 1), 0, 1);
  const levelHueShift = (scene.sceneLevel - 1) * 4.7;
  const hueA = normalizeHue(tone.h + hueShift + levelHueShift + prestige * 12);
  const hueB = normalizeHue(hueA + 7 + progress * 10 + prestige * 16);
  let satA = clamp(tone.s + saturationBoost + scene.sceneLevel * 0.18 + prestige * 10, 22, 98);
  let satB = clamp(tone.s + saturationBoost + 4 + scene.sceneLevel * 0.22 + prestige * 12, 22, 99);
  let topLight = clamp(tone.l1 + intensity * 1.2 + (progress < 0.5 ? 2 : 1) - prestige * 1.4, 32, 88);
  let bottomLight = clamp(tone.l2 + intensity * 0.9 - progress * 2.4 - prestige * 2.2, 22, 80);
  let shadowStrength = 0.24 + Math.min(0.26, Math.log2(Math.max(2, value)) * 0.02) + progress * 0.08 + prestige * 0.05;
  let rimGlow = clamp(0.1 + progress * 0.22 + Math.log2(Math.max(2, value)) * 0.012 + prestige * 0.1, 0.12, 0.68);
  let highlightOpacity = 0.18 + progress * 0.06 + prestige * 0.1;
  let sheenOpacity = 0.12 + prestige * 0.18;
  let innerGlowOpacity = 0.08 + prestige * 0.14;
  let textColor = tone.text;

  if (variant === "electric") {
    topLight = clamp(topLight - 3, 28, 84);
    bottomLight = clamp(bottomLight - 6, 18, 72);
    shadowStrength += 0.04;
    rimGlow = clamp(rimGlow + 0.08, 0.16, 0.76);
    highlightOpacity += 0.04;
    innerGlowOpacity += 0.08;
  } else if (variant === "soft") {
    topLight = clamp(topLight + 4, 36, 90);
    bottomLight = clamp(bottomLight + 3, 26, 82);
    shadowStrength = Math.max(0.22, shadowStrength - 0.04);
    rimGlow = Math.max(0.12, rimGlow - 0.05);
    sheenOpacity = Math.max(0.1, sheenOpacity - 0.04);
    innerGlowOpacity = Math.max(0.06, innerGlowOpacity - 0.03);
  } else if (variant === "ember") {
    topLight = clamp(topLight - 2, 28, 84);
    bottomLight = clamp(bottomLight - 4, 20, 74);
    shadowStrength += 0.06;
    rimGlow = clamp(rimGlow + 0.05, 0.14, 0.74);
    sheenOpacity += 0.05;
  } else if (variant === "organic") {
    satA = clamp(satA + 4, 24, 99);
    satB = clamp(satB + 5, 26, 99);
    highlightOpacity += 0.03;
  } else {
    sheenOpacity += 0.06;
    innerGlowOpacity += 0.04;
  }

  const strokeLight = clamp(topLight + 12, 42, 95);
  const surfaceHighlight = `rgba(255, 255, 255, ${highlightOpacity.toFixed(3)})`;
  const sheenColor = `hsla(${normalizeHue(hueA + 22)}, 94%, 82%, ${sheenOpacity.toFixed(3)})`;
  const innerGlow = `hsla(${normalizeHue(hueB + 12)}, 96%, 78%, ${innerGlowOpacity.toFixed(3)})`;

  element.style.background = `
    radial-gradient(circle at 22% 18%, ${surfaceHighlight}, rgba(255, 255, 255, 0) 40%),
    linear-gradient(135deg, ${sheenColor}, rgba(255, 255, 255, 0) 38%),
    linear-gradient(180deg, hsl(${hueA} ${satA}% ${topLight}%), hsl(${hueB} ${satB}% ${bottomLight}%))
  `;
  element.style.color = textColor;
  element.style.borderColor = `hsla(${hueA}, 84%, ${strokeLight}%, ${clamp(0.32 + prestige * 0.16, 0.3, 0.52)})`;
  element.style.boxShadow = `
    0 12px 18px rgba(0, 0, 0, ${shadowStrength.toFixed(3)}),
    0 0 0 1px hsla(${hueA}, 92%, 84%, ${rimGlow.toFixed(3)}),
    0 0 ${Math.round(10 + prestige * 12)}px ${innerGlow},
    inset 0 1px 0 rgba(255, 255, 255, ${clamp(0.24 + prestige * 0.08, 0.22, 0.38).toFixed(3)})
  `;
  element.style.textShadow =
    variant === "soft"
      ? "0 1px 0 rgba(255, 255, 255, 0.16)"
      : `0 1px 0 rgba(255, 255, 255, ${clamp(0.12 + prestige * 0.06, 0.12, 0.22).toFixed(3)})`;
}

function createHeroState() {
  const grid = createEmptyGrid(4, 4);
  placeHeroRandomTile(grid);
  placeHeroRandomTile(grid);
  return { grid };
}

function startHeroAutoplay() {
  if (heroIntervalId) {
    window.clearInterval(heroIntervalId);
  }

  heroIntervalId = window.setInterval(() => {
    const direction = ["left", "right", "up", "down"][Math.floor(Math.random() * 4)];
    const moveResult = applyHeroMove(heroState.grid, direction);

    if (moveResult.moved) {
      placeHeroRandomTile(heroState.grid);
    } else if (!hasHeroMoves(heroState.grid)) {
      heroState = createHeroState();
    }

    renderHeroBoard();
  }, 620);
}

function renderHeroBoard() {
  el.heroBoard.innerHTML = "";
  const visualLevel = getVisualLevel();

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const value = heroState.grid[row][col];
      const cell = document.createElement("div");
      const tile = document.createElement("div");

      cell.className = "hero-cell";
      tile.className = `hero-tile ${value === 0 ? "is-empty" : getTileClass(value)}`;
      tile.style.animationDelay = `${(row * 4 + col) * 0.06}s`;
      tile.textContent = value === 0 ? "" : String(value);
      applyTileVisualStyle(tile, value, visualLevel);

      cell.append(tile);
      el.heroBoard.append(cell);
    }
  }
}

function hasHeroMoves(grid) {
  const directions = ["left", "right", "up", "down"];
  return directions.some((direction) => {
    const next = cloneGrid(grid);
    return applyHeroMove(next, direction).moved;
  });
}

function applyHeroMove(grid, direction) {
  const before = cloneGrid(grid);

  if (direction === "left" || direction === "right") {
    for (let row = 0; row < 4; row += 1) {
      const line = grid[row].slice();
      const merged = direction === "left" ? mergeHeroLine(line) : mergeHeroLine(line.reverse()).reverse();
      grid[row] = merged;
    }
  } else {
    for (let col = 0; col < 4; col += 1) {
      const line = [];

      for (let row = 0; row < 4; row += 1) {
        line.push(grid[row][col]);
      }

      const merged = direction === "up" ? mergeHeroLine(line) : mergeHeroLine(line.reverse()).reverse();

      for (let row = 0; row < 4; row += 1) {
        grid[row][col] = merged[row];
      }
    }
  }

  return { moved: !gridsEqual(before, grid) };
}

function mergeHeroLine(line) {
  const compact = line.filter((value) => value !== 0);

  for (let i = 0; i < compact.length - 1; i += 1) {
    if (compact[i] === compact[i + 1]) {
      compact[i] *= 2;
      compact[i + 1] = 0;
      i += 1;
    }
  }

  const result = compact.filter((value) => value !== 0);
  while (result.length < 4) {
    result.push(0);
  }

  return result;
}

function placeHeroRandomTile(grid) {
  const empty = [];

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if (grid[row][col] === 0) {
        empty.push({ row, col });
      }
    }
  }

  if (empty.length === 0) {
    return;
  }

  const target = empty[Math.floor(Math.random() * empty.length)];
  grid[target.row][target.col] = Math.random() < 0.9 ? 2 : 4;
}

function unlockAudio() {
  ensureAudioContext();
  primeMergeSfxAudio();
  applyMusicState();
}

function ensureAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => undefined);
  }

  setupAudioBuses(audioContext);
  updateAudioMix();

  return audioContext;
}

function setupAudioBuses(ctx) {
  if (sfxBusGain && bgmBusGain) {
    return;
  }

  sfxBusGain = ctx.createGain();
  bgmBusGain = ctx.createGain();

  sfxBusGain.gain.value = 1;
  bgmBusGain.gain.value = 0.16;

  sfxBusGain.connect(ctx.destination);
  bgmBusGain.connect(ctx.destination);
}

function updateAudioMix() {
  if (!audioContext || !sfxBusGain || !bgmBusGain) {
    return;
  }

  const now = audioContext.currentTime;
  const sfxTarget = state.sfxEnabled ? 1.45 : 0.0001;
  const musicTarget = state.musicEnabled ? 0.2 : 0.0001;

  sfxBusGain.gain.cancelScheduledValues(now);
  sfxBusGain.gain.setValueAtTime(Math.max(0.0001, sfxBusGain.gain.value), now);
  sfxBusGain.gain.exponentialRampToValueAtTime(sfxTarget, now + 0.12);

  bgmBusGain.gain.cancelScheduledValues(now);
  bgmBusGain.gain.setValueAtTime(Math.max(0.0001, bgmBusGain.gain.value), now);
  bgmBusGain.gain.exponentialRampToValueAtTime(musicTarget, now + 0.2);
}

function applyMusicState() {
  const ctx = ensureAudioContext();
  if (!ctx || !bgmBusGain) {
    return;
  }

  updateAudioMix();

  if (!state.musicEnabled) {
    stopBackgroundMusicLoop();
    return;
  }

  startBackgroundMusicLoop();
}

function startBackgroundMusicLoop() {
  if (!audioContext || bgmLoopIntervalId) {
    return;
  }

  const barDuration = 2.4;
  let nextBarTime = audioContext.currentTime + 0.08;

  const scheduleBar = (startTime) => {
    const progression = [
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
      [164.81, 220.0, 261.63],
      [146.83, 196.0, 246.94]
    ];
    const chord = progression[bgmStep % progression.length];
    const profile = getThemeSoundProfile();
    const pitchMul = Number(profile.pitchMultiplier || 1);
    const wave = profile.type === "electronic" ? "triangle" : "sine";

    for (const note of chord) {
      playBackgroundPad(startTime, note * pitchMul, wave);
    }

    playBackgroundPulse(startTime + 0.05, chord[0] * pitchMul * 0.5);
    playBackgroundPulse(startTime + 0.65, chord[1] * pitchMul * 0.5);
    playBackgroundPulse(startTime + 1.2, chord[2] * pitchMul * 0.5);
    playBackgroundPulse(startTime + 1.8, chord[1] * pitchMul * 0.5);

    bgmStep += 1;
  };

  scheduleBar(nextBarTime);

  bgmLoopIntervalId = window.setInterval(() => {
    if (!audioContext || !state.musicEnabled) {
      return;
    }

    while (nextBarTime < audioContext.currentTime + 0.35) {
      nextBarTime += barDuration;
    }

    scheduleBar(nextBarTime);
    nextBarTime += barDuration;
  }, 700);
}

function stopBackgroundMusicLoop() {
  if (bgmLoopIntervalId) {
    window.clearInterval(bgmLoopIntervalId);
    bgmLoopIntervalId = null;
  }
}

function playBackgroundPad(startTime, frequency, waveType) {
  if (!audioContext || !bgmBusGain) {
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = waveType;
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.frequency.exponentialRampToValueAtTime(frequency * 1.01, startTime + 2.05);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.15);

  osc.connect(gain);
  gain.connect(bgmBusGain);
  osc.start(startTime);
  osc.stop(startTime + 2.2);
}

function playBackgroundPulse(startTime, frequency) {
  if (!audioContext || !bgmBusGain) {
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.95, startTime + 0.2);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.04, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.26);

  osc.connect(gain);
  gain.connect(bgmBusGain);
  osc.start(startTime);
  osc.stop(startTime + 0.28);
}

function getThemeSoundProfile() {
  return themeManager.getTheme().soundProfile || {
    shotWave: "triangle",
    mergeWave: "sine",
    blockedWave: "square",
    pitchMultiplier: 1,
    volumeMultiplier: 1
  };
}

function getMergeSfxAudio() {
  if (typeof Audio === "undefined") {
    return null;
  }

  if (!mergeSfxAudio) {
    mergeSfxAudio = document.querySelector('audio[data-merge-sfx]') || new Audio(MERGE_SFX_URL);
    mergeSfxAudio.src = mergeSfxAudio.currentSrc || mergeSfxAudio.src || MERGE_SFX_URL;
    mergeSfxAudio.preload = "auto";
    mergeSfxAudio.playsInline = true;
    mergeSfxAudio.volume = 0.65;
  }

  return mergeSfxAudio;
}

function primeMergeSfxAudio() {
  const audio = getMergeSfxAudio();
  if (!audio) {
    return;
  }

  try {
    audio.load();
  } catch (error) {
    // Ignore preload failures and fall back to synth merges.
  }
}

function playMergeAsset(value, comboCount = 1) {
  const baseAudio = getMergeSfxAudio();
  if (!baseAudio) {
    return false;
  }

  const playback =
    baseAudio.paused
      ? baseAudio
      : new Audio(baseAudio.currentSrc || baseAudio.src || MERGE_SFX_URL);

  playback.preload = "auto";
  playback.playsInline = true;
  playback.volume = Math.min(1, 0.48 + Math.log2(Math.max(2, value)) * 0.03 + comboCount * 0.04);
  playback.playbackRate = Math.min(1.22, 0.94 + Math.log2(Math.max(2, value)) * 0.015);
  try {
    playback.currentTime = 0;
  } catch (error) {
    // Ignore current time reset errors.
  }

  playback.play().catch(() => undefined);
  return true;
}

function playShotSound(value = 2) {
  if (!state.sfxEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx || !sfxBusGain) return;
  const profile = getThemeSoundProfile();
  const pitch = Number(profile.pitchMultiplier || 1);
  const volume = Number(profile.volumeMultiplier || 1);
  const valuePitch = Math.max(0.88, Math.min(1.32, 0.92 + Math.log2(Math.max(2, value)) * 0.035));

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = profile.shotWave || "triangle";
  osc.frequency.setValueAtTime(240 * pitch * valuePitch, now);
  osc.frequency.exponentialRampToValueAtTime(410 * pitch * valuePitch, now + 0.05);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(sfxBusGain);
  osc.start(now);
  osc.stop(now + 0.09);
}

function playLandingSound(value) {
  if (!state.sfxEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx || !sfxBusGain) return;
  const profile = getThemeSoundProfile();
  const pitch = Number(profile.pitchMultiplier || 1);
  const volume = Number(profile.volumeMultiplier || 1);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const frequency = getLandingFrequency(value) * pitch;

  osc.type = profile.shotWave || "sine";
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.86, now + 0.08);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.11 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(sfxBusGain);
  osc.start(now);
  osc.stop(now + 0.1);
}

function playMergeSound(value, comboCount = 1) {
  if (!state.sfxEnabled) return;
  if (playMergeAsset(value, comboCount)) return;
  const ctx = ensureAudioContext();
  if (!ctx || !sfxBusGain) return;
  const profile = getThemeSoundProfile();
  const pitch = Number(profile.pitchMultiplier || 1);
  const volume = Number(profile.volumeMultiplier || 1);

  const now = ctx.currentTime;
  const shift = Math.max(0, Math.min(14, Math.log2(Math.max(2, value)) - 1));
  const root = (310 + shift * 24) * pitch;
  const sparkle = value >= 256 ? 1.9 : 1.65;
  const peak = Math.min(0.26, 0.12 + shift * 0.008) * volume;

  playMergeTone(ctx, now, "triangle", root * 0.52, peak * 0.72, 0.15);
  playMergeTone(ctx, now + 0.01, profile.mergeWave || "sine", root, peak, 0.22);
  playMergeTone(ctx, now + 0.035, "triangle", root * sparkle, peak * 0.84, 0.2);

  if (value >= 2048) {
    playMergeTone(ctx, now + 0.06, "sine", root * 2.35, peak * 0.58, 0.18);
  }

  if (comboCount > 1) {
    const layers = Math.min(3, comboCount - 1);

    for (let i = 0; i < layers; i += 1) {
      playMergeTone(ctx, now + 0.05 + i * 0.018, "triangle", root * (1.28 + i * 0.14), peak * 0.5, 0.16);
    }
  }
}

function playMergeTone(ctx, startTime, waveType, frequency, peakGain, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = waveType;
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.frequency.exponentialRampToValueAtTime(frequency * 1.08, startTime + duration);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(sfxBusGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playBlockedSound() {
  if (!state.sfxEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx || !sfxBusGain) return;
  const profile = getThemeSoundProfile();
  const pitch = Number(profile.pitchMultiplier || 1);
  const volume = Number(profile.volumeMultiplier || 1);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = profile.blockedWave || "square";
  osc.frequency.setValueAtTime(140 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(90 * pitch, now + 0.08);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.095 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(sfxBusGain);
  osc.start(now);
  osc.stop(now + 0.1);
}

function playComboSound(comboCount) {
  if (!state.sfxEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx || !sfxBusGain) return;

  const now = ctx.currentTime;
  const steps = Math.min(4, Math.max(2, comboCount));
  const base = 480;

  for (let i = 0; i < steps; i += 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.04;
    const freq = base * (1 + i * 0.26);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, start + 0.12);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

    osc.connect(gain);
    gain.connect(sfxBusGain);
    osc.start(start);
    osc.stop(start + 0.16);
  }
}

function getLandingFrequency(value) {
  const map = { 2: 261.63, 4: 293.66, 8: 329.63, 16: 392.0, 32: 440.0, 64: 523.25 };

  if (map[value]) {
    return map[value];
  }

  const bounded = Math.max(1, Math.log2(value) - 1);
  return 523.25 + bounded * 28;
}

function getLevelTarget(level) {
  const safeLevel = Math.max(1, Math.round(Number(level) || 1));
  return 512n << BigInt(safeLevel - 1);
}

function hasReachedLevelTarget(maxTile, level) {
  return BigInt(maxTile) >= getLevelTarget(level);
}

function getMaxTile(grid) {
  let maxTile = 0;

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] > 0) {
        maxTile = Math.max(maxTile, grid[row][col]);
      }
    }
  }

  return maxTile;
}

function formatTileLabel(value) {
  const safeValue =
    typeof value === "bigint"
      ? value
      : BigInt(Math.max(0, Math.round(Number(value) || 0)));

  if (safeValue >= 1073741824n && safeValue % 1073741824n === 0n) {
    return `${safeValue / 1073741824n}b`;
  }

  if (safeValue >= 1048576n && safeValue % 1048576n === 0n) {
    return `${safeValue / 1048576n}m`;
  }

  if (safeValue >= 16384n && safeValue % 1024n === 0n) {
    return `${safeValue / 1024n}k`;
  }

  return safeValue.toString();
}

function formatBigInt(value) {
  return formatTileLabel(value);
}

function formatTimeLeft(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const seconds = Math.max(0, totalSeconds % 60);
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getSpeedModeTimeLimit(level) {
  const safeLevel = Math.max(1, Math.round(Number(level) || 1));
  return 180000 + (safeLevel - 1) * 30000;
}

function getPuzzleMoveLimit(level) {
  return Math.max(12, 22 - Math.min(10, Math.floor((level - 1) / 2)));
}

function createPuzzleBoard(level) {
  const grid = createEmptyGrid(boardState.rows, boardState.cols);
  const seed = level * 7919 + 17;
  const rng = createSeededRandom(seed);
  const placements = Math.min(10, 5 + Math.floor(level / 8));
  const values = [2, 4, 8, 16, 32];

  for (let i = 0; i < placements; i += 1) {
    const empties = getEmptyCoordinates(grid);
    if (empties.length === 0) {
      break;
    }

    const target = empties[Math.floor(rng() * empties.length)];
    const band = Math.min(values.length - 1, Math.floor(level / 20));
    const value = values[Math.floor(rng() * (band + 2))] ?? values[0];
    grid[target.row][target.col] = value;
  }

  return grid;
}

function createSeededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function getEmptyCoordinates(grid) {
  const empty = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === 0) {
        empty.push({ row, col });
      }
    }
  }

  return empty;
}

function showSystemBanner(text, { force = false } = {}) {
  if (!force && boardState.powerBannerUntil > Date.now()) {
    boardState.queuedBannerText = text;
    return;
  }

  boardState.comboElement.textContent = text;
  boardState.comboElement.classList.add("is-ai");
  boardState.comboElement.classList.remove("is-big", "is-huge", "is-power-callout");
  boardState.comboElement.classList.remove("is-visible");
  void boardState.comboElement.offsetWidth;
  boardState.comboElement.classList.add("is-visible");

  if (boardState.comboTimeoutId) {
    window.clearTimeout(boardState.comboTimeoutId);
  }

  boardState.comboTimeoutId = window.setTimeout(() => {
    boardState.comboElement.classList.remove("is-visible");
  }, 560);
}

function showPowerTipPopup(powerId) {
  const power = getPowerById(powerId);
  if (!power || !el.powerTipPopup || !el.powerTipTitle || !el.powerTipCopy) {
    return;
  }

  el.powerTipTitle.textContent = power.name;
  el.powerTipCopy.textContent = getPowerAnnouncementCopy(powerId);
  el.powerTipPopup.classList.remove("hidden");
  el.powerTipPopup.classList.remove("is-visible");
  void el.powerTipPopup.offsetWidth;
  el.powerTipPopup.classList.add("is-visible");

  if (boardState.powerTipTimeoutId) {
    window.clearTimeout(boardState.powerTipTimeoutId);
  }

  boardState.powerTipTimeoutId = window.setTimeout(() => {
    el.powerTipPopup.classList.remove("is-visible");
    el.powerTipPopup.classList.add("hidden");
  }, 5000);
}

function showPowerAnnouncement(powerId) {
  showPowerTipPopup(powerId);
  boardState.powerBannerUntil = Date.now() + 5000;
  boardState.queuedBannerText = "";
  boardState.comboElement.textContent = getPowerAnnouncementText(powerId).toUpperCase();
  boardState.comboElement.classList.remove("is-ai");
  boardState.comboElement.classList.add("is-big", "is-huge", "is-power-callout");
  boardState.comboElement.classList.remove("is-visible");
  void boardState.comboElement.offsetWidth;
  boardState.comboElement.classList.add("is-visible");

  if (boardState.comboTimeoutId) {
    window.clearTimeout(boardState.comboTimeoutId);
  }

  boardState.comboTimeoutId = window.setTimeout(() => {
    boardState.powerBannerUntil = 0;
    boardState.comboElement.classList.remove("is-visible");
    boardState.comboElement.classList.remove("is-power-callout");
    if (boardState.queuedBannerText) {
      const queuedText = boardState.queuedBannerText;
      boardState.queuedBannerText = "";
      showSystemBanner(queuedText, { force: true });
    }
  }, 5000);
}

function shuffleBoardTiles(grid) {
  const values = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] !== 0) {
        values.push(grid[row][col]);
        grid[row][col] = 0;
      }
    }
  }

  for (let i = values.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    const temp = values[i];
    values[i] = values[swapIndex];
    values[swapIndex] = temp;
  }

  const empties = getEmptyCoordinates(grid);
  for (let i = 0; i < values.length && i < empties.length; i += 1) {
    const target = empties[i];
    grid[target.row][target.col] = values[i];
  }
}

function triggerRandomMerge(grid) {
  const pairs = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const value = grid[row][col];
      if (value <= 0) {
        continue;
      }

      if (col + 1 < grid[row].length && grid[row][col + 1] === value) {
        pairs.push({ keepRow: row, keepCol: col, clearRow: row, clearCol: col + 1, nextValue: value * 2 });
      }

      if (row + 1 < grid.length && grid[row + 1][col] === value) {
        pairs.push({ keepRow: row, keepCol: col, clearRow: row + 1, clearCol: col, nextValue: value * 2 });
      }
    }
  }

  if (pairs.length === 0) {
    return false;
  }

  const merge = pairs[Math.floor(Math.random() * pairs.length)];
  grid[merge.keepRow][merge.keepCol] = merge.nextValue;
  grid[merge.clearRow][merge.clearCol] = 0;
  collapseColumnsTopToBottom(grid);
  return true;
}

function spawnChaosBlocker(grid) {
  const blockers = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === BLOCKER_TILE) {
        blockers.push({ row, col });
      }
    }
  }

  if (blockers.length >= 3) {
    const removed = blockers[Math.floor(Math.random() * blockers.length)];
    grid[removed.row][removed.col] = 0;
  }

  const empty = getEmptyCoordinates(grid);
  if (empty.length === 0) {
    return false;
  }

  const target = empty[Math.floor(Math.random() * empty.length)];
  grid[target.row][target.col] = BLOCKER_TILE;
  return true;
}

function loadStoredLevel(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? Number.parseInt(stored, 10) : fallback;
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveStoredLevel(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch (error) {
    // Ignore storage write errors.
  }
}

function getModeProgressStorageKey(modeId) {
  return `${MODE_LEVEL_PROGRESS_KEY_PREFIX}${modeId}`;
}

function loadModeLevelProgress(modeId) {
  const fallbackUnlocked = modeId === "classic" ? clampLevel(loadStoredLevel(LEVEL_UNLOCK_KEY, 1)) : 1;
  const fallbackSelected = modeId === "classic" ? clampLevel(loadStoredLevel(LEVEL_SELECTED_KEY, fallbackUnlocked)) : fallbackUnlocked;

  try {
    const raw = window.localStorage.getItem(getModeProgressStorageKey(modeId));
    if (!raw) {
      return {
        unlocked: fallbackUnlocked,
        selected: Math.min(fallbackUnlocked, fallbackSelected)
      };
    }

    const parsed = JSON.parse(raw);
    const unlocked = clampLevel(parsed?.unlocked ?? fallbackUnlocked);
    const selected = Math.min(unlocked, clampLevel(parsed?.selected ?? fallbackSelected));
    return { unlocked, selected };
  } catch (error) {
    return {
      unlocked: fallbackUnlocked,
      selected: Math.min(fallbackUnlocked, fallbackSelected)
    };
  }
}

function loadAllModeLevelProgress() {
  return Object.fromEntries(MODES.map((mode) => [mode.id, loadModeLevelProgress(mode.id)]));
}

function saveModeLevelProgress(modeId, progress) {
  const safeProgress = {
    unlocked: clampLevel(progress?.unlocked ?? 1),
    selected: clampLevel(progress?.selected ?? 1)
  };
  safeProgress.selected = Math.min(safeProgress.unlocked, safeProgress.selected);

  try {
    window.localStorage.setItem(getModeProgressStorageKey(modeId), JSON.stringify(safeProgress));
  } catch (error) {
    // Ignore storage write errors.
  }
}

function persistModeProgress(modeId, unlocked, selected) {
  const next = {
    unlocked: clampLevel(unlocked),
    selected: Math.min(clampLevel(unlocked), clampLevel(selected))
  };
  state.modeProgress[modeId] = next;
  saveModeLevelProgress(modeId, next);
}

function applyModeProgress(modeId) {
  const progress = state.modeProgress[modeId] || loadModeLevelProgress(modeId);
  state.modeProgress[modeId] = progress;
  state.unlockedLevel = clampLevel(progress.unlocked);
  state.selectedLevel = Math.min(state.unlockedLevel, clampLevel(progress.selected));
}

function persistCurrentModeProgress() {
  persistModeProgress(getCurrentMode().id, state.unlockedLevel, state.selectedLevel);
}

function loadStoredBool(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      return fallback;
    }

    return stored === "1";
  } catch (error) {
    return fallback;
  }
}

function saveStoredBool(key, value) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch (error) {
    // Ignore storage write errors.
  }
}

function clampLevel(value) {
  const numeric = Number.parseInt(String(value), 10);

  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.max(1, Math.min(LEVEL_COUNT, numeric));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(resolve);
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
