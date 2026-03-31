import { Game } from './game.js';
import { PIECES, PIECE_COLORS, rotateShapeClockwise } from './pieces.js';

const playerCanvas = document.getElementById('playerCanvas');
const aiCanvas = document.getElementById('aiCanvas');
const homeScreen = document.getElementById('homeScreen');
const gameApp = document.getElementById('gameApp');
const btnPlayHome = document.getElementById('btnPlayHome');
const btnBattleHome = document.getElementById('btnBattleHome');
const btnBackToMenu = document.getElementById('btnBackToMenu');
const btnBackToMenuAI = document.getElementById('btnBackToMenuAI');
const btnResetAI = document.getElementById('btnResetAI');
const btnShowAIPage = document.getElementById('btnShowAIPage');
const btnShowPlayerPage = document.getElementById('btnShowPlayerPage');
const btnToggleAIPreview = document.getElementById('btnToggleAIPreview');
const playerPage = document.getElementById('playerPage');
const aiPage = document.getElementById('aiPage');
const pageBody = document.body;
const homeSignal = document.getElementById('homeSignal');
const homeModeName = document.getElementById('homeModeName');
const homeModeDescription = document.getElementById('homeModeDescription');
const modePicker = document.getElementById('modePicker');
const gameSignal = document.getElementById('gameSignal');
const fxBanner = document.getElementById('fxBanner');
const fxSubline = document.getElementById('fxSubline');
const scoreValue = document.getElementById('scoreValue');
const linesValue = document.getElementById('linesValue');
const levelValue = document.getElementById('levelValue');
const comboValue = document.getElementById('comboValue');
const incomingValue = document.getElementById('incomingValue');
const incomingBar = document.getElementById('incomingBar');
const holdStateValue = document.getElementById('holdStateValue');
const dangerValue = document.getElementById('dangerValue');
const currentModeValue = document.getElementById('currentModeValue');
const statusValue = document.getElementById('statusValue');
const aiIncomingValue = document.getElementById('aiIncomingValue');
const aiComboValue = document.getElementById('aiComboValue');
const aiStatusValue = document.getElementById('aiStatusValue');
const aiIncomingBar = document.getElementById('aiIncomingBar');
const nextCanvas = document.getElementById('nextCanvas');
const aiNextCanvas = document.getElementById('aiNextCanvas');
const aiMiniCanvas = document.getElementById('aiMiniCanvas');
const aiPreviewCanvas = document.getElementById('aiPreviewCanvas');
const aiPreviewPanel = document.getElementById('aiPreviewPanel');
const btnCloseAIPreview = document.getElementById('btnCloseAIPreview');
const coinValue = document.getElementById('coinValue');
const coinValueAI = document.getElementById('coinValueAI');
const coinCounter = document.getElementById('coinCounter');
const coinCounterAI = document.getElementById('coinCounterAI');
const coinFxLayer = document.getElementById('coinFxLayer');
const dailyRewardModal = document.getElementById('dailyRewardModal');
const dailyRewardTitle = document.getElementById('dailyRewardTitle');
const dailyRewardAmount = document.getElementById('dailyRewardAmount');
const btnDailyRewardOk = document.getElementById('btnDailyRewardOk');
const matchRewardPanel = document.getElementById('matchRewardPanel');
const rewardLinesText = document.getElementById('rewardLinesText');
const rewardComboText = document.getElementById('rewardComboText');
const rewardSurvivalText = document.getElementById('rewardSurvivalText');
const rewardSkillText = document.getElementById('rewardSkillText');
const rewardTotalText = document.getElementById('rewardTotalText');
const stageResultPanel = document.getElementById('stageResultPanel');
const stageResultTitle = document.getElementById('stageResultTitle');
const stageResultText = document.getElementById('stageResultText');
const btnStageNext = document.getElementById('btnStageNext');
const btnStageRetry = document.getElementById('btnStageRetry');
const btnStageMenu = document.getElementById('btnStageMenu');
const levelSelectScreen = document.getElementById('levelSelectScreen');
const levelStageGrid = document.getElementById('levelStageGrid');
const btnCloseLevelSelect = document.getElementById('btnCloseLevelSelect');
const btnOpenShop = document.getElementById('btnOpenShop');
const btnCloseShop = document.getElementById('btnCloseShop');
const shopScreen = document.getElementById('shopScreen');
const shopGrid = document.getElementById('shopGrid');
const shopCoinValue = document.getElementById('shopCoinValue');
const powerupDock = document.getElementById('powerupDock');
const playerBoardCard = document.querySelector('.board-card-player');
const aiBoardCard = document.querySelector('.board-card-ai');

const PREVIEW_CELL_SIZE = 16;
const CELL_SIZE = 24;
const SOFT_DROP_INTERVAL_MS = 45;
const COMBO_TIERS = [2, 4, 6, 8, 10];
const MUSIC_SOURCE = './assets/audio/bgm.mp3';
const COIN_STORAGE_KEY = 'tetrixa_coin_bank_v1';
const DAILY_STORAGE_KEY = 'tetrixa_daily_reward_v1';
const FIRSTS_STORAGE_KEY = 'tetrixa_first_rewards_v1';
const POWERUP_STORAGE_KEY = 'tetrixa_powerup_inventory_v1';
const SKIN_STORAGE_KEY = 'tetrixa_skin_state_v1';
const TETROMINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const POWERUP_LINE_CLEAR_POINTS = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};
const POWERUP_GARBAGE_BY_CLEAR = {
  1: 0,
  2: 1,
  3: 2,
  4: 4
};
const POWERUP_DEFS = [
  {
    id: 'line_bomb',
    label: 'Line Clear Bomb',
    short: 'BOMB',
    price: 160,
    description: 'Clears one full row instantly.',
    iconPath: './assets/powerups/bomb.webp'
  },
  {
    id: 'time_slow',
    label: 'Time Slow',
    short: 'SLOW',
    price: 120,
    description: 'Slows gameplay for 3 seconds.',
    iconPath: './assets/powerups/timeslow.webp'
  },
  {
    id: 'auto_snap',
    label: 'Auto Snap',
    short: 'SNAP',
    price: 140,
    description: 'Snaps piece to best nearby placement.',
    iconPath: './assets/powerups/autosnap.webp'
  },
  {
    id: 'instant_swap',
    label: 'Instant Swap',
    short: 'SWAP',
    price: 90,
    description: 'Instant hold swap with no delay.',
    iconPath: './assets/powerups/swap.webp'
  },
  {
    id: 'combo_boost',
    label: 'Combo Boost',
    short: 'BOOST',
    price: 150,
    description: 'Boosts combo and coin output briefly.',
    iconPath: './assets/powerups/combo.webp'
  },
  {
    id: 'freeze_stack',
    label: 'Freeze Stack',
    short: 'FREEZE',
    price: 130,
    description: 'Blocks incoming garbage for a short time.',
    iconPath: './assets/powerups/freeze.webp'
  },
  {
    id: 'mini_clear',
    label: 'Mini Clear Burst',
    short: 'BURST',
    price: 110,
    description: 'Clears a 3x3 area.',
    iconPath: './assets/powerups/burst.webp'
  },
  {
    id: 'undo',
    label: 'Undo',
    short: 'UNDO',
    price: 200,
    description: 'Rewinds the last locked piece.',
    iconPath: './assets/powerups/undo.webp'
  }
];

const TETROMINO_SKIN_DEFS = [
  {
    id: 'skin_neon',
    label: 'Neon Core',
    short: 'NEON',
    price: 480,
    description: 'High-contrast neon crystal blocks.',
    folder: 'skin-01'
  },
  {
    id: 'skin_ice',
    label: 'Ice Prism',
    short: 'ICE',
    price: 520,
    description: 'Cool frosted blocks with bright edges.',
    folder: 'skin-02'
  },
  {
    id: 'skin_lava',
    label: 'Lava Flux',
    short: 'LAVA',
    price: 560,
    description: 'Molten core blocks with heavy glow.',
    folder: 'skin-03'
  },
  {
    id: 'skin_astro',
    label: 'Astro Alloy',
    short: 'ASTRO',
    price: 620,
    description: 'Futuristic plated blocks for ranked feel.',
    folder: 'skin-04'
  },
  {
    id: 'skin_retro',
    label: 'Retro Gem',
    short: 'RETRO',
    price: 450,
    description: 'Arcade gem blocks with punchy detail.',
    folder: 'skin-05'
  }
];

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.lastPlayed = {};
  }

  unlock() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  canPlay(name, cooldownMs = 0) {
    const now = performance.now();
    if ((this.lastPlayed[name] || 0) + cooldownMs > now) return false;
    this.lastPlayed[name] = now;
    return true;
  }

  tone({ freq = 440, durationMs = 100, type = 'sine', gain = 0.04, endFreq = null }) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = durationMs / 1000;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
    }

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playMove() {
    if (!this.canPlay('move', 35)) return;
    this.tone({ freq: 260, durationMs: 30, type: 'square', gain: 0.016 });
  }

  playRotate() {
    if (!this.canPlay('rotate', 40)) return;
    this.tone({ freq: 420, endFreq: 620, durationMs: 65, type: 'triangle', gain: 0.03 });
  }

  playHold() {
    if (!this.canPlay('hold', 60)) return;
    this.tone({ freq: 320, endFreq: 240, durationMs: 70, type: 'triangle', gain: 0.028 });
  }

  playLock() {
    if (!this.canPlay('lock', 40)) return;
    this.tone({ freq: 180, endFreq: 130, durationMs: 75, type: 'square', gain: 0.025 });
  }

  playHardDrop() {
    if (!this.canPlay('hardDrop', 40)) return;
    this.tone({ freq: 210, endFreq: 70, durationMs: 110, type: 'sawtooth', gain: 0.045 });
  }

  playLineClear(lines) {
    if (!this.canPlay('lineClear', 80)) return;
    const freq = lines >= 4 ? 920 : 740;
    this.tone({ freq, endFreq: freq * 1.22, durationMs: 130, type: 'triangle', gain: 0.045 });
  }

  playIncoming() {
    if (!this.canPlay('incoming', 85)) return;
    this.tone({ freq: 300, endFreq: 220, durationMs: 70, type: 'square', gain: 0.02 });
  }

  playComboBurst(comboCount) {
    if (!this.canPlay('comboBurst', 120)) return;
    const freq = Math.min(1120, 460 + comboCount * 60);
    this.tone({ freq, endFreq: freq * 1.15, durationMs: 150, type: 'triangle', gain: 0.055 });
  }

  playInsaneMoment() {
    if (!this.canPlay('insaneMoment', 250)) return;
    this.tone({ freq: 680, endFreq: 1120, durationMs: 260, type: 'sawtooth', gain: 0.06 });
  }

  playBassHit() {
    if (!this.canPlay('bassHit', 180)) return;
    this.tone({ freq: 130, endFreq: 62, durationMs: 220, type: 'sawtooth', gain: 0.07 });
  }

  playOverdrivePulse() {
    if (!this.canPlay('overdrivePulse', 580)) return;
    this.tone({ freq: 520, endFreq: 860, durationMs: 210, type: 'triangle', gain: 0.045 });
  }

  playPerfectDrop() {
    if (!this.canPlay('perfectDrop', 120)) return;
    this.tone({ freq: 760, endFreq: 1080, durationMs: 180, type: 'triangle', gain: 0.05 });
  }

  playCoinChing(layered = false) {
    if (!this.canPlay('coinChing', 45)) return;
    this.tone({ freq: 720, endFreq: 980, durationMs: 90, type: 'triangle', gain: 0.032 });
    if (layered) {
      this.tone({ freq: 520, endFreq: 760, durationMs: 120, type: 'sine', gain: 0.02 });
    }
  }

  playNearMiss() {
    if (!this.canPlay('nearMiss', 800)) return;
    this.tone({ freq: 260, endFreq: 620, durationMs: 260, type: 'triangle', gain: 0.05 });
  }

  playDefeat() {
    if (!this.canPlay('defeat', 250)) return;
    this.tone({ freq: 190, endFreq: 65, durationMs: 320, type: 'sawtooth', gain: 0.05 });
  }

  playVictory() {
    if (!this.canPlay('victory', 250)) return;
    this.tone({ freq: 560, endFreq: 920, durationMs: 240, type: 'triangle', gain: 0.05 });
  }
}

class MusicController {
  constructor(src) {
    this.audio = null;
    this.enabled = false;
    if (typeof window === 'undefined') return;
    try {
      this.audio = new Audio(src);
      this.audio.loop = true;
      this.audio.volume = 0.32;
      this.audio.preload = 'auto';
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  unlock() {
    if (!this.enabled || !this.audio) return;
    if (!this.audio.paused) return;
    this.audio.play().catch(() => {});
  }

  setOverdrive(active) {
    if (!this.enabled || !this.audio) return;
    this.audio.playbackRate = active ? 1.08 : 1;
    this.audio.volume = active ? 0.42 : 0.32;
  }
}

function createBoardState(canvasEl, game, tag) {
  const context = canvasEl.getContext('2d');
  canvasEl.width = game.grid.width * CELL_SIZE;
  canvasEl.height = game.grid.height * CELL_SIZE;

  return {
    tag,
    canvas: canvasEl,
    ctx: context,
    game,
    dropAccumulator: 0,
    effects: {
      lineFlashes: [],
      lockPulses: [],
      dropStreaks: [],
      particles: [],
      pulseWaves: []
    },
    shake: {
      duration: 0,
      until: 0,
      intensity: 0
    }
  };
}

const player = createBoardState(playerCanvas, new Game(), 'player');
const ai = createBoardState(aiCanvas, new Game(), 'ai');

const MOBILE_LAYOUT_BREAKPOINT = 900;
const MOBILE_TOP_UI = 80;
const MOBILE_BOTTOM_UI = 100;
const MOBILE_SIDE_UI = 80;

function isMobilePlayViewport() {
  if (window.innerWidth <= MOBILE_LAYOUT_BREAKPOINT) return true;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(pointer: coarse)').matches;
  }
  return false;
}

function computeMobileBoardLayout(board) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const cols = board.game.grid.width;
  const rows = board.game.grid.height;

  const availableWidth = screenWidth - MOBILE_SIDE_UI;
  const availableHeight = screenHeight - MOBILE_TOP_UI - MOBILE_BOTTOM_UI;
  const cellSize = Math.max(1, Math.floor(Math.min(availableWidth / cols, availableHeight / rows)));

  const boardWidth = cellSize * cols;
  const boardHeight = cellSize * rows;
  const offsetX = Math.floor((screenWidth - boardWidth) / 2);
  const offsetY = MOBILE_TOP_UI;
  const dockWidth = Math.max(240, Math.min(screenWidth - 18, 430));

  return { cellSize, boardWidth, boardHeight, offsetX, offsetY, dockWidth };
}

function computeDesktopDisplayCellSize(board) {
  const columns = board.game.grid.width;
  const rows = board.game.grid.height;
  const isCompactViewport = window.innerWidth <= 760;
  const viewportWidthCap = Math.floor(window.innerWidth * (isCompactViewport ? 0.986 : 0.98));
  const viewportHeightCap = Math.floor(
    Math.min(window.innerHeight * (isCompactViewport ? 0.64 : 0.68), isCompactViewport ? 560 : 620)
  );
  const shell = board.canvas.closest('.canvas-shell');
  const shellWidth = shell ? Math.floor(shell.clientWidth) : 0;
  const widthBudget = Math.min(460, viewportWidthCap, shellWidth > 0 ? shellWidth : 460);
  const cellByWidth = Math.floor(widthBudget / columns);
  const cellByHeight = Math.floor(viewportHeightCap / rows);
  return Math.max(12, Math.min(cellByWidth, cellByHeight));
}

function syncBoardCanvasDisplaySize(board, { mobileLayout = null } = {}) {
  if (!board || !board.canvas) return;

  if (mobileLayout) {
    board.canvas.style.width = `${mobileLayout.boardWidth}px`;
    board.canvas.style.height = `${mobileLayout.boardHeight}px`;
    return;
  }

  const columns = board.game.grid.width;
  const rows = board.game.grid.height;
  const displayCellSize = computeDesktopDisplayCellSize(board);
  board.canvas.style.width = `${displayCellSize * columns}px`;
  board.canvas.style.height = `${displayCellSize * rows}px`;
}

function syncAllBoardCanvasDisplaySizes() {
  const useMobileLayout = isMobilePlayViewport();
  const mobileLayout = useMobileLayout ? computeMobileBoardLayout(player) : null;
  const showAiPanels = modeRuntime.aiEnabled && !useMobileLayout;

  if (useMobileLayout) {
    if (playerPage) playerPage.classList.remove('app-hidden');
    if (aiPage) aiPage.classList.add('app-hidden');
    if (aiPreviewPanel) aiPreviewPanel.classList.add('app-hidden');
  }
  if (btnShowAIPage) btnShowAIPage.classList.toggle('app-hidden', !showAiPanels);
  if (btnShowPlayerPage) btnShowPlayerPage.classList.toggle('app-hidden', !showAiPanels);
  if (btnToggleAIPreview) btnToggleAIPreview.classList.toggle('app-hidden', !showAiPanels);

  if (pageBody) {
    pageBody.classList.toggle('mobile-play-layout', useMobileLayout);
    if (mobileLayout) {
      pageBody.style.setProperty('--mobile-board-width', `${mobileLayout.boardWidth}px`);
      pageBody.style.setProperty('--mobile-board-height', `${mobileLayout.boardHeight}px`);
      pageBody.style.setProperty('--mobile-board-offset-x', `${mobileLayout.offsetX}px`);
      pageBody.style.setProperty('--mobile-board-offset-y', `${mobileLayout.offsetY}px`);
      pageBody.style.setProperty('--mobile-dock-width', `${mobileLayout.dockWidth}px`);
    } else {
      pageBody.style.removeProperty('--mobile-board-width');
      pageBody.style.removeProperty('--mobile-board-height');
      pageBody.style.removeProperty('--mobile-board-offset-x');
      pageBody.style.removeProperty('--mobile-board-offset-y');
      pageBody.style.removeProperty('--mobile-dock-width');
    }
  }

  syncBoardCanvasDisplaySize(player, { mobileLayout });
  syncBoardCanvasDisplaySize(ai, { mobileLayout });

  [playerBoardCard, aiBoardCard].forEach((card) => {
    if (!card) return;
    card.style.width = mobileLayout ? `${mobileLayout.boardWidth}px` : '';
    card.style.height = mobileLayout ? `${mobileLayout.boardHeight}px` : '';
  });

  const previewCanvases = [nextCanvas, aiNextCanvas];
  const miniPreviewSize = aiMiniCanvas;
  if (mobileLayout) {
    const previewSize = Math.max(34, Math.min(72, Math.round(mobileLayout.cellSize * 2.15)));
    previewCanvases.forEach((canvas) => {
      if (!canvas) return;
      canvas.style.width = `${previewSize}px`;
      canvas.style.height = `${previewSize}px`;
    });
    if (miniPreviewSize) {
      miniPreviewSize.style.width = `${Math.round(previewSize * 0.74)}px`;
      miniPreviewSize.style.height = `${Math.round(previewSize * 1.48)}px`;
    }
  } else {
    previewCanvases.forEach((canvas) => {
      if (!canvas) return;
      canvas.style.width = '';
      canvas.style.height = '';
    });
    if (miniPreviewSize) {
      miniPreviewSize.style.width = '';
      miniPreviewSize.style.height = '';
    }
  }
}

let boardDisplaySyncFrame = 0;
function scheduleBoardCanvasDisplaySync() {
  if (boardDisplaySyncFrame) {
    cancelAnimationFrame(boardDisplaySyncFrame);
  }
  boardDisplaySyncFrame = requestAnimationFrame(() => {
    boardDisplaySyncFrame = 0;
    syncAllBoardCanvasDisplaySizes();
  });
}

const sound = new SoundEngine();
const music = new MusicController(MUSIC_SOURCE);

const nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;
const aiNextCtx = aiNextCanvas ? aiNextCanvas.getContext('2d') : null;
const aiMiniCtx = aiMiniCanvas ? aiMiniCanvas.getContext('2d') : null;
const aiPreviewCtx = aiPreviewCanvas ? aiPreviewCanvas.getContext('2d') : null;

let playerSoftDropHeld = false;
let lastTime = 0;
let playerLastIncoming = 0;
let resultSoundPlayed = false;
let gameSessionActive = false;
let currentModeLabel = 'Play';

const battleState = {
  comboTier: 0,
  comboFxUntil: 0,
  slowMotionUntil: 0,
  nearMissCooldownUntil: 0,
  overdriveUntil: 0,
  flashUntil: 0,
  fxUntil: 0,
  fxPriority: 0,
  dangerLevel: 'stable',
  aiSkill: 0.62,
  aiStepAccumulator: 0
};

const powerupState = {
  inventory: readJsonStorage(POWERUP_STORAGE_KEY, {}),
  comboBoostUntil: 0,
  freezeUntil: 0,
  freezeBlockFxUntil: 0
};

const skinState = {
  owned: {},
  selectedSkinId: 'default',
  tiles: {}
};

const powerupUiState = {
  expandedUntil: 0,
  lastInteractionAt: performance.now()
};

const aiController = {
  lastPieceRef: null,
  plan: null
};

const MODE_DEFS = {
  battle: {
    label: 'Battle Mode',
    description: 'Competitive AI showdown'
  },
  classic: {
    label: 'Classic+',
    description: 'Solo flow with combos and overdrive'
  },
  speed: {
    label: 'Speed Rush',
    description: 'Survive rising speed every 10s'
  },
  puzzle: {
    label: 'Puzzle Mode',
    description: 'Solve pre-built boards'
  },
  chaos: {
    label: 'Chaos Mode',
    description: 'Random bursts, shifts, and control inversion'
  },
  mirror: {
    label: 'Mirror Mode',
    description: 'Board flips during play'
  }
};

const PUZZLE_PRESETS = [
  [
    [19, [1, 4, 7]],
    [18, [0, 6]],
    [17, [2, 8]],
    [16, [3, 5]],
    [15, [4]]
  ],
  [
    [19, [2, 5, 9]],
    [18, [1, 3, 8]],
    [17, [0, 6]],
    [16, [4, 7]],
    [15, [2]]
  ],
  [
    [19, [0, 4, 8]],
    [18, [2, 6]],
    [17, [1, 5, 9]],
    [16, [3, 7]],
    [15, [4]]
  ],
  [
    [19, [3, 6]],
    [18, [1, 4, 8]],
    [17, [0, 5, 9]],
    [16, [2, 7]],
    [15, [4]]
  ]
];

const modeRuntime = {
  selectedMode: 'battle',
  activeMode: 'battle',
  aiEnabled: true,
  speedRushTier: 0,
  chaosNextEventAt: 0,
  chaosEventUntil: 0,
  chaosGravityScale: 1,
  controlsInvertedUntil: 0,
  mirrorFlipped: false,
  mirrorNextFlipAt: 0,
  puzzlePresetIndex: 0,
  puzzleSolved: false,
  puzzleAdvanceOnStart: true
};

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures; gameplay should continue.
  }
}

function readNumberStorage(key, fallback = 0) {
  try {
    const raw = localStorage.getItem(key);
    const num = Number(raw);
    return Number.isFinite(num) ? num : fallback;
  } catch {
    return fallback;
  }
}

function sanitizePowerupInventory(rawInventory) {
  const safe = {};
  POWERUP_DEFS.forEach((def) => {
    const value = rawInventory && typeof rawInventory === 'object' ? rawInventory[def.id] : 0;
    safe[def.id] = Math.max(0, Math.floor(Number(value) || 0));
  });
  return safe;
}

function persistPowerupInventory() {
  writeJsonStorage(POWERUP_STORAGE_KEY, powerupState.inventory);
}

function getPowerupCount(id) {
  return Math.max(0, Math.floor(powerupState.inventory[id] || 0));
}

function addPowerupCount(id, count = 1) {
  if (!Object.prototype.hasOwnProperty.call(powerupState.inventory, id)) return;
  const safeCount = Math.max(0, Math.floor(count));
  powerupState.inventory[id] = getPowerupCount(id) + safeCount;
  persistPowerupInventory();
}

function consumePowerup(id) {
  const owned = getPowerupCount(id);
  if (owned <= 0) return false;
  powerupState.inventory[id] = owned - 1;
  persistPowerupInventory();
  return true;
}

powerupState.inventory = sanitizePowerupInventory(powerupState.inventory);

function getSkinDefinition(skinId) {
  return TETROMINO_SKIN_DEFS.find((def) => def.id === skinId) || null;
}

function buildSkinImageCandidates(skinDef, pieceType) {
  const base = `./assets/skins/${skinDef.folder}/${pieceType}`;
  return [`${base}.webp`, `${base}.png`, `${base}.jpg`, `${base}.jpeg`];
}

function sanitizeSkinState(rawState) {
  const safeOwned = {};
  TETROMINO_SKIN_DEFS.forEach((def) => {
    safeOwned[def.id] = !!(rawState && rawState.owned && rawState.owned[def.id]);
  });

  const requested = rawState && typeof rawState.selectedSkinId === 'string'
    ? rawState.selectedSkinId
    : 'default';
  const selectedSkinId =
    requested === 'default'
      ? 'default'
      : (safeOwned[requested] && getSkinDefinition(requested) ? requested : 'default');

  return {
    owned: safeOwned,
    selectedSkinId
  };
}

function persistSkinState() {
  writeJsonStorage(SKIN_STORAGE_KEY, {
    owned: skinState.owned,
    selectedSkinId: skinState.selectedSkinId
  });
}

function isSkinOwned(skinId) {
  return !!skinState.owned[skinId];
}

function getSkinTileImage(skinId, pieceType) {
  if (!skinId || skinId === 'default') return null;
  const pieceMap = skinState.tiles[skinId];
  if (!pieceMap) return null;
  const tile = pieceMap[pieceType];
  return tile && tile !== 'loading' ? tile : null;
}

function getActiveTetrominoSkinImage(pieceType) {
  return getSkinTileImage(skinState.selectedSkinId, pieceType);
}

function primeSkinTileImage(skinId, pieceType) {
  const skinDef = getSkinDefinition(skinId);
  if (!skinDef || !TETROMINO_TYPES.includes(pieceType)) return;
  if (typeof Image === 'undefined') return;

  const pieceMap = skinState.tiles[skinId] || (skinState.tiles[skinId] = {});
  if (pieceMap[pieceType] !== undefined) return;
  pieceMap[pieceType] = 'loading';

  const candidates = buildSkinImageCandidates(skinDef, pieceType);
  let attempt = 0;
  const image = new Image();

  const tryNext = () => {
    if (attempt >= candidates.length) {
      pieceMap[pieceType] = null;
      return;
    }
    image.src = candidates[attempt];
    attempt += 1;
  };

  image.onload = () => {
    pieceMap[pieceType] = image;
    renderShopGrid();
  };

  image.onerror = () => {
    tryNext();
  };

  tryNext();
}

function preloadSkinTiles(skinId) {
  if (!getSkinDefinition(skinId)) return;
  TETROMINO_TYPES.forEach((pieceType) => {
    primeSkinTileImage(skinId, pieceType);
  });
}

function primeSkinPreviewTiles() {
  TETROMINO_SKIN_DEFS.forEach((skinDef) => {
    primeSkinTileImage(skinDef.id, 'I');
  });
}

const rawSkinState = readJsonStorage(SKIN_STORAGE_KEY, { owned: {}, selectedSkinId: 'default' });
const safeSkinState = sanitizeSkinState(rawSkinState);
skinState.owned = safeSkinState.owned;
skinState.selectedSkinId = safeSkinState.selectedSkinId;
persistSkinState();
primeSkinPreviewTiles();
if (skinState.selectedSkinId !== 'default') {
  preloadSkinTiles(skinState.selectedSkinId);
}

function normalizeModeKey(modeKey) {
  return Object.prototype.hasOwnProperty.call(MODE_DEFS, modeKey) ? modeKey : 'battle';
}

function setHomeMode(modeKey) {
  const safeMode = normalizeModeKey(modeKey);
  modeRuntime.selectedMode = safeMode;
  const def = MODE_DEFS[safeMode];
  if (homeModeName) homeModeName.textContent = def.label;
  if (homeModeDescription) homeModeDescription.textContent = def.description;
  if (btnBattleHome) btnBattleHome.textContent = def.label;

  if (modePicker) {
    modePicker.querySelectorAll('.mode-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === safeMode);
    });
  }
}

function applyPuzzlePreset(game, presetIndex) {
  game.grid.reset();
  const preset = PUZZLE_PRESETS[presetIndex % PUZZLE_PRESETS.length];
  preset.forEach(([rowY, holes]) => {
    if (rowY < 0 || rowY >= game.grid.height) return;
    const row = Array(game.grid.width).fill('G');
    holes.forEach((hole) => {
      const x = clamp(hole, 0, game.grid.width - 1);
      row[x] = 0;
    });
    game.grid.cells[rowY] = row;
  });
}

function countFilledCells(cells) {
  let filled = 0;
  cells.forEach((row) => {
    row.forEach((cell) => {
      if (cell !== 0) filled += 1;
    });
  });
  return filled;
}

function isControlsInverted(now = performance.now()) {
  return modeRuntime.activeMode === 'chaos' && now < modeRuntime.controlsInvertedUntil;
}

const rewardState = {
  coinBank: readNumberStorage(COIN_STORAGE_KEY, 0),
  sessionCoins: 0,
  maxCombo: 0,
  sessionStartAt: performance.now(),
  lastLevel: 1,
  lastActionAt: 0,
  speedBonusCooldownUntil: 0,
  matchRewardGiven: false,
  stageResolved: false,
  challengeLines10Done: false,
  challengeCombo5Done: false,
  firsts: readJsonStorage(FIRSTS_STORAGE_KEY, {
    firstTetris: false,
    firstCombo5: false
  }),
  daily: readJsonStorage(DAILY_STORAGE_KEY, {
    lastClaimDate: '',
    streak: 0
  })
};

function persistCoinBank() {
  try {
    localStorage.setItem(COIN_STORAGE_KEY, String(rewardState.coinBank));
  } catch {
    // Ignore storage write failures.
  }
}

function updateCoinHud() {
  if (coinValue) coinValue.textContent = String(rewardState.coinBank);
  if (coinValueAI) coinValueAI.textContent = String(rewardState.coinBank);
  if (shopCoinValue) shopCoinValue.textContent = String(rewardState.coinBank);
  renderShopGrid();
  renderPowerupDock();
}

function getPowerupDefinition(id) {
  return POWERUP_DEFS.find((def) => def.id === id) || null;
}

function createShopSectionTitle(label) {
  const title = document.createElement('h3');
  title.className = 'shop-section-title';
  title.textContent = label;
  return title;
}

function getSkinPreviewBackground(skinDef) {
  const loadedPreview = getSkinTileImage(skinDef.id, 'I');
  if (loadedPreview && loadedPreview.src) {
    return `url("${loadedPreview.src}")`;
  }
  return `url("./assets/skins/${skinDef.folder}/I.webp")`;
}

function createPowerupShopCard(def) {
  const card = document.createElement('article');
  card.className = 'shop-item';

  const owned = getPowerupCount(def.id);
  const canBuy = rewardState.coinBank >= def.price;

  const icon = document.createElement('div');
  icon.className = 'shop-item-icon';
  icon.style.setProperty('--icon-url', `url("${def.iconPath}")`);

  const main = document.createElement('div');
  main.className = 'shop-item-main';
  main.innerHTML = `
    <strong>${def.label}</strong>
    <p>${def.description}</p>
    <span class="shop-price">${def.price} coins - Owned: ${owned}</span>
  `;

  const actions = document.createElement('div');
  actions.className = 'shop-item-actions';
  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = `shop-buy${canBuy ? '' : ' is-disabled'}`;
  buyBtn.disabled = !canBuy;
  buyBtn.textContent = canBuy ? 'Buy' : 'Need Coins';
  buyBtn.addEventListener('click', () => {
    buyPowerup(def.id);
  });
  actions.appendChild(buyBtn);

  card.appendChild(icon);
  card.appendChild(main);
  card.appendChild(actions);
  return card;
}

function createSkinShopCard(skinDef) {
  const card = document.createElement('article');
  card.className = 'shop-item shop-item-skin';

  const owned = isSkinOwned(skinDef.id);
  const selected = skinState.selectedSkinId === skinDef.id;
  const canBuy = rewardState.coinBank >= skinDef.price;
  if (selected) {
    card.classList.add('shop-item-active');
  }

  const icon = document.createElement('div');
  icon.className = 'shop-item-icon shop-skin-icon';
  icon.style.setProperty('--icon-url', getSkinPreviewBackground(skinDef));

  const main = document.createElement('div');
  main.className = 'shop-item-main';
  main.innerHTML = `
    <strong>${skinDef.label}</strong>
    <p>${skinDef.description}</p>
    <span class="shop-price">${skinDef.price} coins - ${owned ? 'Owned' : 'Not owned'} - 7-piece set</span>
  `;

  const actions = document.createElement('div');
  actions.className = 'shop-item-actions';

  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = `shop-buy${canBuy ? '' : ' is-disabled'}`;
  buyBtn.disabled = owned || !canBuy;
  buyBtn.textContent = owned ? 'Owned' : (canBuy ? 'Buy' : 'Need Coins');
  buyBtn.addEventListener('click', () => {
    buySkin(skinDef.id);
  });

  const useBtn = document.createElement('button');
  useBtn.type = 'button';
  useBtn.className = `shop-use${owned && !selected ? '' : ' is-disabled'}`;
  useBtn.disabled = !owned || selected;
  useBtn.textContent = selected ? 'In Use' : 'Use';
  useBtn.addEventListener('click', () => {
    useSkin(skinDef.id);
  });

  actions.appendChild(buyBtn);
  actions.appendChild(useBtn);
  card.appendChild(icon);
  card.appendChild(main);
  card.appendChild(actions);
  return card;
}

function renderShopGrid() {
  if (!shopGrid) return;
  shopGrid.innerHTML = '';

  shopGrid.appendChild(createShopSectionTitle('Power Ups'));
  POWERUP_DEFS.forEach((def) => {
    shopGrid.appendChild(createPowerupShopCard(def));
  });

  shopGrid.appendChild(createShopSectionTitle('Tetromino Skins'));
  TETROMINO_SKIN_DEFS.forEach((skinDef) => {
    shopGrid.appendChild(createSkinShopCard(skinDef));
  });
}

function renderPowerupDock() {
  if (!powerupDock) return;
  powerupDock.innerHTML = '';

  POWERUP_DEFS.forEach((def) => {
    const count = getPowerupCount(def.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `powerup-btn${count <= 0 ? ' is-empty' : ''}`;
    btn.disabled = count <= 0;
    btn.setAttribute('aria-label', `${def.label}. ${def.description}. Owned ${count}.`);
    btn.setAttribute('title', `${def.label}: ${def.description}`);
    btn.innerHTML = `
      <span class="powerup-icon-wrap" style="--icon-url: url('${def.iconPath}')"></span>
      <span class="powerup-count">${count}</span>
      <span class="powerup-meta">
        <strong class="powerup-name">${def.short}</strong>
        <small class="powerup-effect">${def.description}</small>
      </span>
    `;
    btn.addEventListener('click', () => {
      markPowerupDockInteraction();
      activatePowerup(def.id);
    });
    powerupDock.appendChild(btn);
  });

  updatePowerupDockState();
}

function markPowerupDockInteraction(now = performance.now()) {
  powerupUiState.lastInteractionAt = now;
  powerupUiState.expandedUntil = now + 2200;
  updatePowerupDockState(now);
}

function updatePowerupDockState(now = performance.now()) {
  if (!powerupDock) return;
  const expanded = now < powerupUiState.expandedUntil;
  const idle = now - powerupUiState.lastInteractionAt > 2400;
  powerupDock.classList.toggle('is-expanded', expanded);
  powerupDock.classList.toggle('is-collapsed', !expanded);
  powerupDock.classList.toggle('is-idle', idle);
}

function buyPowerup(powerupId) {
  const def = getPowerupDefinition(powerupId);
  if (!def) return;
  if (rewardState.coinBank < def.price) {
    setFxMessage('Not enough coins', `${def.price} coins required`, 800, 4);
    return;
  }

  rewardState.coinBank -= def.price;
  persistCoinBank();
  addPowerupCount(def.id, 1);
  updateCoinHud();
  setFxMessage('Purchased', `${def.label} added`, 900, 5);
  sound.playCoinChing(true);
}

function buySkin(skinId) {
  const skinDef = getSkinDefinition(skinId);
  if (!skinDef) return;
  if (isSkinOwned(skinId)) {
    setFxMessage('Already owned', `${skinDef.label} is in your locker`, 820, 4);
    return;
  }
  if (rewardState.coinBank < skinDef.price) {
    setFxMessage('Not enough coins', `${skinDef.price} coins required`, 800, 4);
    return;
  }

  rewardState.coinBank -= skinDef.price;
  persistCoinBank();
  skinState.owned[skinId] = true;
  persistSkinState();
  preloadSkinTiles(skinId);
  updateCoinHud();
  setFxMessage('Skin purchased', `${skinDef.label} unlocked`, 950, 5);
  sound.playCoinChing(true);
}

function useSkin(skinId) {
  if (skinId !== 'default' && !isSkinOwned(skinId)) {
    setFxMessage('Skin locked', 'Buy this skin first', 820, 4);
    return;
  }

  const skinDef = getSkinDefinition(skinId);
  skinState.selectedSkinId = skinId;
  persistSkinState();
  if (skinId !== 'default') {
    preloadSkinTiles(skinId);
  }
  renderShopGrid();
  setFxMessage('Skin equipped', skinDef ? skinDef.label : 'Classic', 950, 6);
}

function popCoinCounter() {
  [coinCounter, coinCounterAI].forEach((counter) => {
    if (!counter) return;
    counter.classList.remove('pop');
    void counter.offsetWidth;
    counter.classList.add('pop');
  });
}

function createCoinFlyToCounter(options = {}) {
  if (!coinFxLayer || !coinCounter) return;
  const {
    fromX = window.innerWidth * 0.5,
    fromY = window.innerHeight * 0.5,
    count = 3,
    special = false,
    reason = ''
  } = options;

  const targetRect = coinCounter.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width * 0.5;
  const targetY = targetRect.top + targetRect.height * 0.5;

  if (reason) {
    const reasonEl = document.createElement('div');
    reasonEl.className = 'coin-reason';
    reasonEl.textContent = reason;
    reasonEl.style.left = `${fromX}px`;
    reasonEl.style.top = `${fromY}px`;
    coinFxLayer.appendChild(reasonEl);
    setTimeout(() => {
      reasonEl.remove();
    }, 900);
  }

  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div');
    coin.className = `coin-fly${special ? ' special' : ''}`;
    coin.style.left = `${fromX + randomRange(-16, 16)}px`;
    coin.style.top = `${fromY + randomRange(-12, 12)}px`;
    coinFxLayer.appendChild(coin);

    const duration = 620 + i * 45 + randomRange(-40, 40);
    const delay = i * 38;
    const startX = parseFloat(coin.style.left);
    const startY = parseFloat(coin.style.top);
    const midX = (startX + targetX) * 0.5 + randomRange(-36, 36);
    const midY = (startY + targetY) * 0.5 - randomRange(28, 74);
    const start = performance.now() + delay;

    const animate = (now) => {
      const t = (now - start) / duration;
      if (t <= 0) {
        requestAnimationFrame(animate);
        return;
      }
      if (t >= 1) {
        coin.remove();
        sound.playCoinChing(special);
        popCoinCounter();
        return;
      }

      const inv = 1 - t;
      const x = inv * inv * startX + 2 * inv * t * midX + t * t * targetX;
      const y = inv * inv * startY + 2 * inv * t * midY + t * t * targetY;
      coin.style.left = `${x}px`;
      coin.style.top = `${y}px`;
      coin.style.opacity = `${0.45 + (1 - t) * 0.55}`;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

function rewardCoins(amount, reason, options = {}) {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (safeAmount <= 0) return;
  rewardState.coinBank += safeAmount;
  rewardState.sessionCoins += safeAmount;
  persistCoinBank();
  updateCoinHud();
  setFxMessage(`+${safeAmount} Coins`, reason, 800, 4);
  createCoinFlyToCounter({
    fromX: options.fromX,
    fromY: options.fromY,
    count: options.count || clamp(Math.ceil(safeAmount / 8), 2, 12),
    special: !!options.special,
    reason
  });
}

function getLocalDateInfo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}-${mm}-${dd}`;
  return { now, dateKey };
}

function daysBetweenISO(dateA, dateB) {
  const a = new Date(`${dateA}T00:00:00`);
  const b = new Date(`${dateB}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function showDailyRewardModal(streak, coins) {
  if (!dailyRewardModal) return;
  if (dailyRewardTitle) dailyRewardTitle.textContent = `Day ${streak} reward unlocked`;
  if (dailyRewardAmount) dailyRewardAmount.textContent = `+${coins} Coins`;
  dailyRewardModal.classList.remove('app-hidden');
}

function hideDailyRewardModal() {
  if (!dailyRewardModal) return;
  dailyRewardModal.classList.add('app-hidden');
}

function collectDailyReward() {
  hideDailyRewardModal();
}

function claimDailyRewardIfEligible() {
  const tiers = [50, 100, 150, 250, 300, 450, 600];
  const { dateKey } = getLocalDateInfo();
  const daily = rewardState.daily;
  if (daily.lastClaimDate === dateKey) return;

  if (!daily.lastClaimDate) {
    daily.streak = 1;
  } else {
    const diff = daysBetweenISO(daily.lastClaimDate, dateKey);
    daily.streak = diff === 1 ? daily.streak + 1 : 1;
  }

  daily.lastClaimDate = dateKey;
  const tierIndex = Math.min(tiers.length - 1, Math.max(0, daily.streak - 1));
  const dailyCoins = tiers[tierIndex];
  writeJsonStorage(DAILY_STORAGE_KEY, daily);
  rewardCoins(dailyCoins, `Daily Reward Day ${daily.streak}`, {
    fromX: window.innerWidth * 0.52,
    fromY: 82,
    count: 7,
    special: daily.streak >= 7
  });
  showDailyRewardModal(daily.streak, dailyCoins);
}

updateCoinHud();

const STAGES_PER_LEVEL = 5;
const TOTAL_LEVELS = 20;
const TOTAL_STAGES = TOTAL_LEVELS * STAGES_PER_LEVEL;
const STAGE_UNLOCK_STORAGE_KEY = 'tetrixa_stage_unlock_v1';
const THEME_FALLBACK_BG = './assets/backgrounds/playingpg.webp';

const progressionState = {
  unlockedStageIndex: readNumberStorage(STAGE_UNLOCK_STORAGE_KEY, 0),
  selectedStageIndex: 0,
  goalLines: 9,
  aiLevel: 1
};
progressionState.unlockedStageIndex = clamp(progressionState.unlockedStageIndex, 0, TOTAL_STAGES - 1);

const stageResultState = {
  nextStageIndex: null,
  retryStageIndex: null
};

const boardThemeState = {
  levelTheme: 1,
  tileImage: null,
  tileReady: false
};

const aiProfileState = {
  baseSkill: 0.42,
  randomFactor: 0.4,
  comboAggression: 0.3,
  attackMultiplier: 0.2,
  reactionScale: 1.2,
  clutchMode: false
};

function stageIndexToLevelStage(stageIndex) {
  const safe = clamp(stageIndex, 0, TOTAL_STAGES - 1);
  const level = Math.floor(safe / STAGES_PER_LEVEL) + 1;
  const stage = (safe % STAGES_PER_LEVEL) + 1;
  return { level, stage };
}

function linesGoalForStage(stageIndex) {
  return 9 + stageIndex * 2;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function buildThemeBackgroundPath(level) {
  return `./assets/themes/backgrounds/theme-${pad2(level)}.webp`;
}

function buildThemeTilePath(level) {
  return `./assets/themes/tiles/theme-${pad2(level)}.png`;
}

function buildThemeTileFallbackPath(level) {
  return `./assets/themes/tiles/theme-${pad2(level)}.webp`;
}

function hideStageResultPanel() {
  if (!stageResultPanel) return;
  stageResultPanel.classList.add('app-hidden');
  stageResultState.nextStageIndex = null;
  stageResultState.retryStageIndex = null;
}

function showStageResultPanel({ title, message, canGoNext, canRetry }) {
  if (!stageResultPanel) return;
  if (stageResultTitle) stageResultTitle.textContent = title;
  if (stageResultText) stageResultText.textContent = message;
  if (btnStageNext) btnStageNext.classList.toggle('app-hidden', !canGoNext);
  if (btnStageRetry) btnStageRetry.classList.toggle('app-hidden', !canRetry);
  stageResultPanel.classList.remove('app-hidden');
}

function applyBoardThemeForLevel(level) {
  const safeLevel = clamp(level, 1, TOTAL_LEVELS);
  boardThemeState.levelTheme = safeLevel;
  boardThemeState.tileImage = null;
  boardThemeState.tileReady = false;

  const bgPath = buildThemeBackgroundPath(safeLevel);
  if (pageBody && typeof Image !== 'undefined') {
    const bgProbe = new Image();
    bgProbe.onload = () => {
      if (boardThemeState.levelTheme !== safeLevel) return;
      pageBody.style.setProperty('--play-bg-image', `url("${bgPath}")`);
    };
    bgProbe.onerror = () => {
      if (boardThemeState.levelTheme !== safeLevel) return;
      pageBody.style.setProperty('--play-bg-image', `url("${THEME_FALLBACK_BG}")`);
    };
    bgProbe.src = bgPath;
  }

  const tilePath = buildThemeTilePath(safeLevel);
  const tileFallbackPath = buildThemeTileFallbackPath(safeLevel);
  if (typeof Image !== 'undefined') {
    const img = new Image();
    let triedFallback = false;
    img.onload = () => {
      if (boardThemeState.levelTheme !== safeLevel) return;
      boardThemeState.tileImage = img;
      boardThemeState.tileReady = true;
    };
    img.onerror = () => {
      if (!triedFallback) {
        triedFallback = true;
        img.src = tileFallbackPath;
        return;
      }
      if (boardThemeState.levelTheme !== safeLevel) return;
      boardThemeState.tileImage = null;
      boardThemeState.tileReady = false;
    };
    img.src = tilePath;
  }
}

function stageLabel(stageIndex) {
  const { level, stage } = stageIndexToLevelStage(stageIndex);
  return `Level ${level} - Stage ${stage}`;
}

function startStageByIndex(stageIndex) {
  const safeStageIndex = clamp(stageIndex, 0, TOTAL_STAGES - 1);
  const { level, stage } = stageIndexToLevelStage(safeStageIndex);
  progressionState.selectedStageIndex = safeStageIndex;
  progressionState.goalLines = linesGoalForStage(safeStageIndex);
  applyAIProfile(level);
  applyBoardThemeForLevel(level);
  hideStageResultPanel();
  openGame(`L${level}-S${stage}`);
}

function updateModeUiVisibility() {
  const aiEnabled = modeRuntime.aiEnabled;
  const singlePageMobile = isMobilePlayViewport();
  const showAiPanels = aiEnabled && !singlePageMobile;
  if (btnShowAIPage) btnShowAIPage.classList.toggle('app-hidden', !showAiPanels);
  if (btnShowPlayerPage) btnShowPlayerPage.classList.toggle('app-hidden', !showAiPanels);
  if (btnToggleAIPreview) btnToggleAIPreview.classList.toggle('app-hidden', !showAiPanels);
  if (!aiEnabled || singlePageMobile) {
    setActiveBoardPage('player');
  }
}

function configureModeSession(now = performance.now()) {
  const mode = modeRuntime.activeMode;
  modeRuntime.aiEnabled = mode === 'battle';
  modeRuntime.speedRushTier = 0;
  modeRuntime.chaosEventUntil = 0;
  modeRuntime.chaosGravityScale = 1;
  modeRuntime.controlsInvertedUntil = 0;
  modeRuntime.mirrorFlipped = false;
  modeRuntime.mirrorNextFlipAt = now + randomRange(6500, 9400);
  modeRuntime.chaosNextEventAt = now + randomRange(7000, 10500);
  modeRuntime.puzzleSolved = false;

  if (modeRuntime.aiEnabled) {
    ai.game.gameOver = false;
  } else {
    ai.game.gameOver = true;
  }

  if (mode === 'puzzle') {
    if (modeRuntime.puzzleAdvanceOnStart) {
      modeRuntime.puzzlePresetIndex = (modeRuntime.puzzlePresetIndex + 1) % PUZZLE_PRESETS.length;
    }
    modeRuntime.puzzleAdvanceOnStart = true;
    applyPuzzlePreset(player.game, modeRuntime.puzzlePresetIndex);
    setFxMessage('Puzzle Board', 'Clear the board to solve', 1200, 4, now);
  }
  if (mode === 'speed') {
    setFxMessage('Speed Rush', 'Speed increases every 10 seconds', 1200, 4, now);
  }
  if (mode === 'chaos') {
    setFxMessage('Chaos Mode', 'Expect random events', 1200, 4, now);
  }
  if (mode === 'mirror') {
    setFxMessage('Mirror Mode', 'Board may flip during play', 1200, 4, now);
  }
  if (mode === 'classic') {
    setFxMessage('Classic+', 'Solo focus with rewards and overdrive', 1200, 4, now);
  }
  if (mode === 'battle') {
    setFxMessage('Battle Mode', `Goal: ${progressionState.goalLines} lines`, 1200, 1, now);
  }

  updateModeUiVisibility();
}

function triggerChaosEvent(now) {
  const roll = Math.random();
  if (roll < 0.34) {
    modeRuntime.chaosGravityScale = 0.58;
    modeRuntime.chaosEventUntil = now + 4300;
    setFxMessage('CHAOS: SPEED BURST', 'Rapid drop burst active', 1100, 5, now);
  } else if (roll < 0.68) {
    modeRuntime.chaosGravityScale = Math.random() < 0.5 ? 0.72 : 1.32;
    modeRuntime.chaosEventUntil = now + 4600;
    setFxMessage('CHAOS: GRAVITY SHIFT', 'Gravity pattern changed', 1100, 5, now);
  } else {
    modeRuntime.controlsInvertedUntil = now + 3600;
    modeRuntime.chaosEventUntil = Math.max(modeRuntime.chaosEventUntil, now + 3600);
    setFxMessage('CHAOS: INVERTED', 'Controls inverted briefly', 1100, 6, now);
  }
}

function updateModeDynamics(now) {
  if (modeRuntime.activeMode === 'chaos') {
    if (now >= modeRuntime.chaosNextEventAt) {
      triggerChaosEvent(now);
      modeRuntime.chaosNextEventAt = now + randomRange(8500, 12500);
    }
    if (now >= modeRuntime.chaosEventUntil) {
      modeRuntime.chaosGravityScale = 1;
    }
  }

  if (modeRuntime.activeMode === 'mirror' && now >= modeRuntime.mirrorNextFlipAt) {
    modeRuntime.mirrorFlipped = !modeRuntime.mirrorFlipped;
    modeRuntime.mirrorNextFlipAt = now + randomRange(6500, 9600);
    setFxMessage('MIRROR SHIFT', modeRuntime.mirrorFlipped ? 'Board flipped' : 'Board restored', 900, 5, now);
  }

  if (modeRuntime.activeMode === 'puzzle' && !modeRuntime.puzzleSolved && !rewardState.stageResolved) {
    if (countFilledCells(player.game.grid.cells) === 0 && player.game.linesCleared > 0) {
      modeRuntime.puzzleSolved = true;
      rewardState.stageResolved = true;
      gameSessionActive = false;
      rewardCoins(70, 'Puzzle Solved', {
        fromX: window.innerWidth * 0.5,
        fromY: window.innerHeight * 0.35,
        count: 11,
        special: true
      });
      stageResultState.nextStageIndex = null;
      stageResultState.retryStageIndex = null;
      showStageResultPanel({
        title: 'Puzzle Cleared',
        message: 'Board solved. Continue to the next puzzle.',
        canGoNext: true,
        canRetry: true
      });
    }
  }
}

function getModeGravityInterval(baseInterval, now) {
  if (modeRuntime.activeMode === 'speed') {
    const elapsed = Math.max(0, now - rewardState.sessionStartAt);
    const tier = Math.floor(elapsed / 10000);
    if (tier > modeRuntime.speedRushTier) {
      modeRuntime.speedRushTier = tier;
      setFxMessage('Speed Up', `Tier ${tier + 1}`, 700, 3, now);
    }
    const scale = clamp(1 - tier * 0.08, 0.34, 1);
    return baseInterval * scale;
  }

  if (modeRuntime.activeMode === 'chaos') {
    return baseInterval * modeRuntime.chaosGravityScale;
  }

  return baseInterval;
}

function startSelectedModeFromHome() {
  const mode = modeRuntime.selectedMode;
  const def = MODE_DEFS[mode];
  if (mode === 'battle') {
    openLevelSelect();
    return;
  }
  progressionState.selectedStageIndex = 0;
  progressionState.goalLines = 0;
  if (mode === 'puzzle') {
    modeRuntime.puzzleAdvanceOnStart = true;
  }
  applyBoardThemeForLevel(1);
  hideStageResultPanel();
  openGame(def.label, mode);
}

function persistStageUnlock() {
  try {
    localStorage.setItem(STAGE_UNLOCK_STORAGE_KEY, String(progressionState.unlockedStageIndex));
  } catch {
    // Ignore storage write failure.
  }
}

function profileForLevel(level) {
  if (level <= 3) {
    return { baseSkill: 0.34, randomFactor: 0.7, comboAggression: 0.05, attackMultiplier: 0.1, reactionScale: 1.5, clutchMode: false };
  }
  if (level <= 6) {
    return { baseSkill: 0.45, randomFactor: 0.52, comboAggression: 0.2, attackMultiplier: 0.25, reactionScale: 1.3, clutchMode: false };
  }
  if (level <= 9) {
    return { baseSkill: 0.58, randomFactor: 0.34, comboAggression: 0.36, attackMultiplier: 0.45, reactionScale: 1.1, clutchMode: false };
  }
  if (level <= 12) {
    return { baseSkill: 0.68, randomFactor: 0.24, comboAggression: 0.52, attackMultiplier: 0.65, reactionScale: 0.95, clutchMode: false };
  }
  if (level <= 15) {
    return { baseSkill: 0.78, randomFactor: 0.16, comboAggression: 0.68, attackMultiplier: 0.82, reactionScale: 0.85, clutchMode: false };
  }
  if (level <= 18) {
    return { baseSkill: 0.88, randomFactor: 0.09, comboAggression: 0.82, attackMultiplier: 0.95, reactionScale: 0.72, clutchMode: false };
  }
  return { baseSkill: 0.94, randomFactor: 0.05, comboAggression: 1, attackMultiplier: 1.2, reactionScale: 0.62, clutchMode: true };
}

function applyAIProfile(level) {
  progressionState.aiLevel = level;
  const profile = profileForLevel(level);
  Object.assign(aiProfileState, profile);
  battleState.aiSkill = profile.baseSkill;
}

function openLevelSelect() {
  if (!levelSelectScreen || !levelStageGrid) return;
  levelStageGrid.innerHTML = '';

  for (let idx = 0; idx < TOTAL_STAGES; idx++) {
    const { level, stage } = stageIndexToLevelStage(idx);
    const unlocked = idx <= progressionState.unlockedStageIndex;
    const cleared = idx < progressionState.unlockedStageIndex;
    const current = idx === progressionState.unlockedStageIndex;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `stage-card${unlocked ? '' : ' locked'}${cleared ? ' cleared' : ''}${current ? ' current' : ''}`;
    card.disabled = !unlocked;
    const stateLabel = unlocked ? (cleared ? 'Cleared' : 'Ready') : 'Locked';
    card.innerHTML = `
      <div class="stage-top">
        <span class="stage-chip">L${level}-S${stage}</span>
        <span class="stage-state">${stateLabel}</span>
      </div>
      <strong>Level ${level}</strong>
      <p>Stage ${stage}</p>
    `;
    if (unlocked) {
      card.addEventListener('click', () => {
        closeLevelSelect();
        startStageByIndex(idx);
      });
    }
    levelStageGrid.appendChild(card);
  }

  levelSelectScreen.classList.remove('app-hidden');
}

function closeLevelSelect() {
  if (!levelSelectScreen) return;
  levelSelectScreen.classList.add('app-hidden');
}

applyAIProfile(1);
applyBoardThemeForLevel(1);

function maybeRewardChallenges() {
  if (!rewardState.challengeLines10Done && player.game.linesCleared >= 10) {
    rewardState.challengeLines10Done = true;
    rewardCoins(30, 'Challenge Complete: 10 Lines', {
      fromX: window.innerWidth * 0.48,
      fromY: window.innerHeight * 0.26,
      count: 8
    });
  }
  if (!rewardState.challengeCombo5Done && rewardState.maxCombo >= 5) {
    rewardState.challengeCombo5Done = true;
    rewardCoins(35, 'Challenge Complete: Combo 5', {
      fromX: window.innerWidth * 0.52,
      fromY: window.innerHeight * 0.24,
      count: 8
    });
  }
}

function maybeRewardLevelUp() {
  if (player.game.level <= rewardState.lastLevel) return;
  const gainedLevels = player.game.level - rewardState.lastLevel;
  rewardState.lastLevel = player.game.level;
  rewardCoins(22 * gainedLevels, `Level Up x${player.game.level}`, {
    fromX: window.innerWidth * 0.5,
    fromY: window.innerHeight * 0.22,
    count: 10 + gainedLevels * 2,
    special: true
  });
}

function showMatchRewardBreakdown(linesCoins, comboCoins, survivalCoins, skillCoins, total) {
  if (!matchRewardPanel) return;
  if (rewardLinesText) rewardLinesText.textContent = `Lines Cleared: +${linesCoins}`;
  if (rewardComboText) rewardComboText.textContent = `Max Combo: +${comboCoins}`;
  if (rewardSurvivalText) rewardSurvivalText.textContent = `Survival Time: +${survivalCoins}`;
  if (rewardSkillText) rewardSkillText.textContent = `Skill Bonus: +${skillCoins}`;
  if (rewardTotalText) rewardTotalText.textContent = `TOTAL: +${total} coins`;
  matchRewardPanel.classList.remove('app-hidden');
  setTimeout(() => {
    matchRewardPanel.classList.add('app-hidden');
  }, 5200);
}

function maybeRewardMatchEnd(now) {
  if (rewardState.matchRewardGiven) return;
  if (modeRuntime.activeMode === 'battle') {
    if (!player.game.gameOver && !ai.game.gameOver) return;
  } else if (!player.game.gameOver) {
    return;
  }
  rewardState.matchRewardGiven = true;

  const linesCoins = player.game.linesCleared * 2;
  const comboCoins = rewardState.maxCombo * 4;
  const survivalSeconds = Math.max(0, Math.floor((now - rewardState.sessionStartAt) / 1000));
  const survivalCoins = Math.floor(survivalSeconds / 5);
  const skillCoins = modeRuntime.activeMode === 'battle'
    ? (ai.game.gameOver && !player.game.gameOver ? 80 : 24)
    : Math.max(18, 16 + player.game.level * 2);
  const total = linesCoins + comboCoins + survivalCoins + skillCoins;

  rewardCoins(total, 'Match End Reward', {
    fromX: window.innerWidth * 0.5,
    fromY: window.innerHeight * 0.45,
    count: 14,
    special: true
  });
  showMatchRewardBreakdown(linesCoins, comboCoins, survivalCoins, skillCoins, total);
}

function evaluateStageRaceOutcome(now) {
  if (modeRuntime.activeMode !== 'battle') return;
  if (rewardState.stageResolved || !gameSessionActive) return;
  const goal = progressionState.goalLines;
  if (goal <= 0) return;

  const playerReached = player.game.linesCleared >= goal;
  const aiReached = ai.game.linesCleared >= goal;
  if (!playerReached && !aiReached) return;

  rewardState.stageResolved = true;
  if (playerReached && !aiReached) {
    ai.game.gameOver = true;
    setFxMessage('Stage Clear', `You hit ${goal} lines first`, 1300, 7, now);
    const stageBonus = 55 + progressionState.aiLevel * 6;
    rewardCoins(stageBonus, 'Stage Victory Bonus', {
      fromX: window.innerWidth * 0.5,
      fromY: window.innerHeight * 0.38,
      count: 12,
      special: true
    });
    if (progressionState.selectedStageIndex >= progressionState.unlockedStageIndex) {
      progressionState.unlockedStageIndex = Math.min(TOTAL_STAGES - 1, progressionState.unlockedStageIndex + 1);
      persistStageUnlock();
    }
    stageResultState.nextStageIndex = Math.min(TOTAL_STAGES - 1, progressionState.selectedStageIndex + 1);
    stageResultState.retryStageIndex = progressionState.selectedStageIndex;
    showStageResultPanel({
      title: 'Stage Cleared',
      message: `${stageLabel(progressionState.selectedStageIndex)} complete.`,
      canGoNext: progressionState.selectedStageIndex < TOTAL_STAGES - 1,
      canRetry: false
    });
  } else if (aiReached && !playerReached) {
    player.game.gameOver = true;
    setFxMessage('Stage Lost', `AI reached ${goal} lines first`, 1300, 7, now);
    stageResultState.nextStageIndex = null;
    stageResultState.retryStageIndex = progressionState.selectedStageIndex;
    showStageResultPanel({
      title: 'Stage Lost',
      message: `${stageLabel(progressionState.selectedStageIndex)} failed. Retry and beat AI.`,
      canGoNext: false,
      canRetry: true
    });
  } else {
    setFxMessage('Photo Finish', `Both reached ${goal} lines`, 1200, 7, now);
    stageResultState.nextStageIndex = null;
    stageResultState.retryStageIndex = progressionState.selectedStageIndex;
    showStageResultPanel({
      title: 'Draw',
      message: `${stageLabel(progressionState.selectedStageIndex)} ended in a tie.`,
      canGoNext: false,
      canRetry: true
    });
  }
  gameSessionActive = false;
}

function evaluateSoloOutcome(now) {
  if (modeRuntime.activeMode === 'battle') return;
  if (rewardState.stageResolved || !gameSessionActive) return;
  if (!player.game.gameOver) return;

  rewardState.stageResolved = true;
  gameSessionActive = false;
  const survivedSeconds = Math.max(0, Math.floor((now - rewardState.sessionStartAt) / 1000));
  showStageResultPanel({
    title: `${MODE_DEFS[modeRuntime.activeMode]?.label || 'Mode'} Ended`,
    message: `Survived ${survivedSeconds}s. Tap retry to run again.`,
    canGoNext: false,
    canRetry: true
  });
}

function getBoardCellViewportPosition(board, cell) {
  const rect = board.canvas.getBoundingClientRect();
  const scaleX = rect.width / board.canvas.width;
  const scaleY = rect.height / board.canvas.height;
  return {
    x: rect.left + (cell.x * CELL_SIZE + CELL_SIZE * 0.5) * scaleX,
    y: rect.top + (cell.y * CELL_SIZE + CELL_SIZE * 0.5) * scaleY
  };
}

function registerPlayerActionMomentum() {
  const now = performance.now();
  if (rewardState.lastActionAt > 0) {
    const delta = now - rewardState.lastActionAt;
    if (delta < 210 && now >= rewardState.speedBonusCooldownUntil) {
      rewardState.speedBonusCooldownUntil = now + 420;
      rewardCoins(1, 'Speed Bonus', {
        fromX: window.innerWidth * 0.54,
        fromY: window.innerHeight * 0.28,
        count: 2
      });
    }
  }
  rewardState.lastActionAt = now;
}

function maybeRewardLuckyDrop(board, event) {
  if (Math.random() > 0.08) return;
  const firstCell = event.cells && event.cells.length ? event.cells[0] : { x: 5, y: 5 };
  const source = getBoardCellViewportPosition(board, firstCell);
  rewardCoins(4, 'Lucky Drop', {
    fromX: source.x,
    fromY: source.y,
    count: 3,
    special: true
  });
}

function colorForCell(value) {
  return PIECE_COLORS[value] || '#00f0ff';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function setFxMessage(title = '', subtitle = '', durationMs = 0, priority = 0, now = performance.now()) {
  if (battleState.fxUntil > now && priority < battleState.fxPriority) return;

  if (fxBanner && fxSubline) {
    fxBanner.textContent = title;
    fxSubline.textContent = subtitle;
  }
  if (gameSignal) {
    gameSignal.textContent = subtitle ? `${title} - ${subtitle}` : title;
  }
  battleState.fxUntil = now + durationMs;
  battleState.fxPriority = priority;
}

function syncBodyFx(now) {
  if (!pageBody) return;

  pageBody.classList.toggle('fx-show', battleState.fxUntil > now);
  COMBO_TIERS.forEach((tier) => {
    pageBody.classList.toggle(`combo-tier-${tier}`, battleState.comboTier === tier && battleState.comboFxUntil > now);
  });
  pageBody.classList.toggle('near-miss-active', battleState.slowMotionUntil > now);
  pageBody.classList.toggle('overdrive-active', battleState.overdriveUntil > now);
  pageBody.classList.toggle('screen-flash', battleState.flashUntil > now);
  pageBody.classList.toggle('combo-boost-active', powerupState.comboBoostUntil > now);
  pageBody.classList.toggle('freeze-active', powerupState.freezeUntil > now);

  if (battleState.fxUntil <= now) {
    if (fxBanner && fxSubline) {
      fxBanner.textContent = '';
      fxSubline.textContent = '';
    }
    if (gameSignal) {
      gameSignal.textContent = '';
    }
    battleState.fxPriority = 0;
  }
}

function addShake(board, intensity, durationMs) {
  const now = performance.now();
  if (board.shake.until > now) {
    board.shake.intensity = Math.max(board.shake.intensity, intensity);
    board.shake.until = Math.max(board.shake.until, now + durationMs);
    board.shake.duration = Math.max(board.shake.duration, durationMs);
    return;
  }
  board.shake.intensity = intensity;
  board.shake.duration = durationMs;
  board.shake.until = now + durationMs;
}

function getShakeOffset(board, now) {
  if (now >= board.shake.until || board.shake.duration <= 0) return { x: 0, y: 0 };
  const life = (board.shake.until - now) / board.shake.duration;
  const amount = board.shake.intensity * life;
  return { x: (Math.random() * 2 - 1) * amount, y: (Math.random() * 2 - 1) * amount };
}

function emitParticles(board, cells, config = {}) {
  const {
    color = '#ffffff',
    countPerCell = 3,
    life = 500,
    speed = 2.8,
    spread = 1.5,
    gravity = 0.03,
    size = [3, 7]
  } = config;

  const now = performance.now();
  cells.forEach((cell) => {
    const originX = cell.x * CELL_SIZE + CELL_SIZE / 2;
    const originY = cell.y * CELL_SIZE + CELL_SIZE / 2;
    for (let i = 0; i < countPerCell; i++) {
      const angle = randomRange(-Math.PI, 0);
      const velocity = randomRange(speed * 0.45, speed);
      board.effects.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity * spread,
        vy: Math.sin(angle) * velocity,
        gravity,
        size: randomRange(size[0], size[1]),
        color,
        start: now,
        duration: life
      });
    }
  });
}

function emitPulseWave(board, config = {}) {
  const {
    color = '#8fe7ff',
    startRadius = CELL_SIZE * 1.5,
    endRadius = board.canvas.width * 0.7,
    duration = 560,
    strength = 1
  } = config;

  board.effects.pulseWaves.push({
    x: board.canvas.width / 2,
    y: board.canvas.height * 0.55,
    start: performance.now(),
    duration,
    startRadius,
    endRadius,
    color,
    strength
  });
}

function drawCell(ctx, x, y, color, cellType = '') {
  const px = x * CELL_SIZE;
  const py = y * CELL_SIZE;
  const skinImage = getActiveTetrominoSkinImage(cellType);

  if (skinImage) {
    drawImageSquareFit(ctx, skinImage, px, py, CELL_SIZE);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    return;
  }

  ctx.shadowColor = color;
  ctx.shadowBlur = 7;
  ctx.fillStyle = color;
  ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, 6);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
}

function drawImageSquareFit(ctx, image, dx, dy, size) {
  const srcW = image.naturalWidth || image.width || size;
  const srcH = image.naturalHeight || image.height || size;
  const srcSize = Math.min(srcW, srcH);
  const srcX = (srcW - srcSize) * 0.5;
  const srcY = (srcH - srcSize) * 0.5;
  ctx.drawImage(image, srcX, srcY, srcSize, srcSize, dx, dy, size, size);
}

function drawBoardTileLayer(board) {
  if (!boardThemeState.tileReady || !boardThemeState.tileImage) return;
  const { ctx, game } = board;
  ctx.save();
  ctx.globalAlpha = 1;
  for (let y = 0; y < game.grid.height; y++) {
    for (let x = 0; x < game.grid.width; x++) {
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;
      drawImageSquareFit(ctx, boardThemeState.tileImage, px, py, CELL_SIZE);
    }
  }
  ctx.restore();
}

function drawGrid(board) {
  const { ctx, game } = board;
  drawBoardTileLayer(board);
  game.grid.cells.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) drawCell(ctx, x, y, colorForCell(cell), cell);
    });
  });

  if (boardThemeState.tileReady && boardThemeState.tileImage) {
    ctx.strokeStyle = 'rgba(12, 58, 70, 0.14)';
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  }

  for (let x = 0; x <= game.grid.width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, board.canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= game.grid.height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(board.canvas.width, y * CELL_SIZE);
    ctx.stroke();
  }
}

function drawCurrentPiece(board) {
  const { ctx, game } = board;
  const overdrive = board.tag === 'player' && battleState.overdriveUntil > performance.now();
  game.currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      const boardY = game.currentPiece.y + y;
      if (value && boardY >= 0) {
        if (overdrive) {
          const px = (game.currentPiece.x + x) * CELL_SIZE;
          const py = boardY * CELL_SIZE;
          ctx.fillStyle = 'rgba(255, 176, 98, 0.28)';
          ctx.fillRect(px - 2, py - 2, CELL_SIZE + 4, CELL_SIZE + 4);
        }
        drawCell(ctx, game.currentPiece.x + x, boardY, colorForCell(game.currentPiece.type), game.currentPiece.type);
      }
    });
  });
}

function getGhostPieceY(game) {
  let ghostY = game.currentPiece.y;
  while (
    !game.grid.checkCollision({
      ...game.currentPiece,
      y: ghostY + 1
    })
  ) {
    ghostY += 1;
  }
  return ghostY;
}

function drawGhostPiece(board) {
  if (board.game.gameOver) return;

  const { ctx, game } = board;
  const ghostY = getGhostPieceY(game);
  if (ghostY === game.currentPiece.y) return;

  ctx.save();
  ctx.globalAlpha = 0.28;
  game.currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      const boardY = ghostY + y;
      if (!value || boardY < 0) return;
      drawCell(ctx, game.currentPiece.x + x, boardY, colorForCell(game.currentPiece.type), game.currentPiece.type);
    });
  });
  ctx.restore();
}

function drawNeonTrails(board) {
  if (board.game.gameOver) return;
  const { ctx, game } = board;
  const ghostY = getGhostPieceY(game);
  const trailRows = Math.max(0, ghostY - game.currentPiece.y);
  if (trailRows <= 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  game.currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      const px = (game.currentPiece.x + x) * CELL_SIZE + CELL_SIZE * 0.38;
      const py = (game.currentPiece.y + y) * CELL_SIZE + CELL_SIZE * 0.5;
      const length = trailRows * CELL_SIZE;
      const gradient = ctx.createLinearGradient(px, py, px, py + length);
      gradient.addColorStop(0, 'rgba(150, 240, 255, 0.36)');
      gradient.addColorStop(1, 'rgba(140, 190, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(px, py, CELL_SIZE * 0.24, length);
    });
  });
  ctx.restore();
}

function pruneEffects(board, now) {
  const { effects } = board;
  while (effects.lineFlashes.length && effects.lineFlashes[0].start + effects.lineFlashes[0].duration <= now) {
    effects.lineFlashes.shift();
  }
  while (effects.lockPulses.length && effects.lockPulses[0].start + effects.lockPulses[0].duration <= now) {
    effects.lockPulses.shift();
  }
  while (effects.dropStreaks.length && effects.dropStreaks[0].start + effects.dropStreaks[0].duration <= now) {
    effects.dropStreaks.shift();
  }
  while (effects.particles.length && effects.particles[0].start + effects.particles[0].duration <= now) {
    effects.particles.shift();
  }
  while (effects.pulseWaves.length && effects.pulseWaves[0].start + effects.pulseWaves[0].duration <= now) {
    effects.pulseWaves.shift();
  }
}

function drawDropStreaks(board, now) {
  const { ctx, effects } = board;
  effects.dropStreaks.forEach((effect) => {
    const t = (now - effect.start) / effect.duration;
    const alpha = Math.max(0, 1 - t);
    const streakLength = effect.dropDistance * CELL_SIZE * (1 - t);
    ctx.fillStyle = `rgba(170, 236, 255, ${0.18 * alpha})`;
    effect.cells.forEach((cell) => {
      const x = cell.x * CELL_SIZE + CELL_SIZE * 0.22;
      const y = cell.y * CELL_SIZE - streakLength;
      ctx.fillRect(x, y, CELL_SIZE * 0.56, streakLength + CELL_SIZE);
    });
  });
}

function drawLockPulses(board, now) {
  const { ctx, effects } = board;
  effects.lockPulses.forEach((effect) => {
    const t = (now - effect.start) / effect.duration;
    const alpha = Math.max(0, (1 - t) * 0.45 * effect.strength);
    const expand = 2 + 5 * t;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    effect.cells.forEach((cell) => {
      const x = cell.x * CELL_SIZE - expand / 2;
      const y = cell.y * CELL_SIZE - expand / 2;
      ctx.fillRect(x, y, CELL_SIZE + expand, CELL_SIZE + expand);
    });
  });
}

function drawLineFlashes(board, now) {
  const { ctx, effects } = board;
  effects.lineFlashes.forEach((effect) => {
    const t = (now - effect.start) / effect.duration;
    const alpha = Math.max(0, (1 - t) * 0.62);
    ctx.fillStyle = `rgba(185, 245, 255, ${alpha})`;
    effect.lines.forEach((line) => {
      ctx.fillRect(0, line * CELL_SIZE, board.canvas.width, CELL_SIZE);
    });
  });
}

function drawPulseWaves(board, now) {
  const { ctx, effects } = board;
  effects.pulseWaves.forEach((wave) => {
    const t = (now - wave.start) / wave.duration;
    if (t < 0 || t > 1) return;
    const radius = wave.startRadius + (wave.endRadius - wave.startRadius) * t;
    const alpha = (1 - t) * 0.36 * wave.strength;
    ctx.strokeStyle = `rgba(143, 231, 255, ${alpha})`;
    ctx.lineWidth = 3 + (1 - t) * 3;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawParticles(board, now) {
  const { ctx, effects } = board;
  effects.particles.forEach((particle) => {
    const life = (now - particle.start) / particle.duration;
    if (life < 0 || life > 1) return;

    const x = particle.x + particle.vx * life * 28;
    const y = particle.y + particle.vy * life * 28 + particle.gravity * life * life * 420;
    const alpha = 1 - life;

    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(x, y, particle.size * (1 - life * 0.35), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawBoardGameOver(board) {
  if (!board.game.gameOver) return;
  const { ctx } = board;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, 0, board.canvas.width, board.canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText('KO', board.canvas.width / 2, board.canvas.height / 2);
}

function drawBoard(board, now) {
  const { ctx, canvas } = board;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const offset = getShakeOffset(board, now);

  ctx.save();
  ctx.translate(offset.x, offset.y);
  if (board.tag === 'player' && modeRuntime.activeMode === 'mirror' && modeRuntime.mirrorFlipped) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  drawGrid(board);
  drawDropStreaks(board, now);
  drawNeonTrails(board);
  drawGhostPiece(board);
  drawCurrentPiece(board);
  drawLockPulses(board, now);
  drawLineFlashes(board, now);
  drawPulseWaves(board, now);
  drawParticles(board, now);
  drawBoardGameOver(board);
  ctx.restore();
}

function getShapeBounds(shape) {
  let minX = Infinity;
  let maxX = -1;
  let minY = Infinity;
  let maxY = -1;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX === -1 || maxY === -1) return null;
  return { minX, maxX, minY, maxY };
}

function drawPreview(ctxRef, pieceType) {
  if (!ctxRef) return;
  const { canvas } = ctxRef;
  ctxRef.clearRect(0, 0, canvas.width, canvas.height);
  if (!pieceType) return;

  const shape = PIECES[pieceType];
  const bounds = getShapeBounds(shape);
  if (!bounds) return;

  const cellsWide = bounds.maxX - bounds.minX + 1;
  const cellsHigh = bounds.maxY - bounds.minY + 1;
  const startX = (canvas.width - cellsWide * PREVIEW_CELL_SIZE) / 2;
  const startY = (canvas.height - cellsHigh * PREVIEW_CELL_SIZE) / 2;
  const color = colorForCell(pieceType);
  const previewSkinImage = getActiveTetrominoSkinImage(pieceType);

  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      if (!shape[y][x]) continue;
      const drawX = startX + (x - bounds.minX) * PREVIEW_CELL_SIZE;
      const drawY = startY + (y - bounds.minY) * PREVIEW_CELL_SIZE;
      if (previewSkinImage) {
        drawImageSquareFit(ctxRef, previewSkinImage, drawX, drawY, PREVIEW_CELL_SIZE);
        ctxRef.strokeStyle = 'rgba(0, 0, 0, 0.26)';
        ctxRef.strokeRect(drawX + 0.5, drawY + 0.5, PREVIEW_CELL_SIZE - 1, PREVIEW_CELL_SIZE - 1);
      } else {
        ctxRef.shadowColor = color;
        ctxRef.shadowBlur = 6;
        ctxRef.fillStyle = color;
        ctxRef.fillRect(drawX, drawY, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
        ctxRef.shadowBlur = 0;
        ctxRef.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctxRef.fillRect(drawX + 1.5, drawY + 1.5, PREVIEW_CELL_SIZE - 3, 4.5);
        ctxRef.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctxRef.strokeRect(drawX + 0.5, drawY + 0.5, PREVIEW_CELL_SIZE - 1, PREVIEW_CELL_SIZE - 1);
      }
    }
  }
}

function drawMiniLiveBoard(ctxRef, boardState) {
  if (!ctxRef || !boardState || !boardState.canvas) return;
  const { canvas } = ctxRef;
  ctxRef.clearRect(0, 0, canvas.width, canvas.height);
  ctxRef.drawImage(boardState.canvas, 0, 0, canvas.width, canvas.height);
  ctxRef.strokeStyle = 'rgba(160, 234, 255, 0.35)';
  ctxRef.lineWidth = 1;
  ctxRef.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
}

function getBoardTopFilledRow(game) {
  for (let y = 0; y < game.grid.height; y++) {
    if (game.grid.cells[y].some((cell) => cell !== 0)) {
      return y;
    }
  }
  return game.grid.height;
}

function getDangerState(game) {
  const topRow = getBoardTopFilledRow(game);
  if (topRow <= 1) return 'critical';
  if (topRow <= 3) return 'danger';
  if (topRow <= 6) return 'warning';
  return 'stable';
}

function describeDanger(level) {
  if (level === 'critical') return 'Critical';
  if (level === 'danger') return 'Danger';
  if (level === 'warning') return 'Warning';
  return 'Stable';
}

function getComboTier(comboCount) {
  if (comboCount >= 10) return 10;
  if (comboCount >= 8) return 8;
  if (comboCount >= 6) return 6;
  if (comboCount >= 4) return 4;
  if (comboCount >= 2) return 2;
  return 0;
}

function getComboCoinMultiplier(comboCount) {
  if (comboCount >= 8) return 3;
  if (comboCount >= 6) return 2;
  if (comboCount >= 4) return 1.5;
  if (comboCount >= 2) return 1.2;
  return 1;
}

function getBaseLineClearCoins(lines) {
  if (lines >= 4) return 28;
  if (lines === 3) return 16;
  if (lines === 2) return 9;
  if (lines === 1) return 4;
  return 0;
}

function triggerComboMoment(event, now) {
  const comboTier = getComboTier(event.comboCount);
  if (comboTier === 0) return;

  battleState.comboTier = comboTier;
  battleState.comboFxUntil = now + (comboTier >= 10 ? 2400 : 1200);
  emitPulseWave(player, { strength: 0.8 + comboTier * 0.08, duration: 600 + comboTier * 40 });

  if (comboTier === 2) {
    setFxMessage(`Combo ${event.comboCount}`, 'Glow pulse', 700, 1, now);
  }
  if (comboTier === 4) {
    sound.playComboBurst(event.comboCount);
    setFxMessage(`Combo ${event.comboCount}`, 'Screen shake', 900, 2, now);
    addShake(player, 2.6, 160);
  }
  if (comboTier === 6) {
    sound.playComboBurst(event.comboCount);
    setFxMessage(`Combo ${event.comboCount}`, 'Particle burst', 1050, 3, now);
    addShake(player, 4.6, 220);
    emitParticles(player, event.lines.flatMap((line) =>
      Array.from({ length: player.game.grid.width }, (_, x) => ({ x, y: line }))
    ), {
      color: '#9cf4ff',
      countPerCell: 3,
      life: 700,
      speed: 3.6,
      spread: 1.5,
      gravity: 0.05
    });
  }
  if (comboTier === 8) {
    sound.playBassHit();
    battleState.flashUntil = now + 240;
    setFxMessage('COMBO 8', 'Flash + bass hit', 1200, 4, now);
    addShake(player, 6.5, 260);
  }
  if (comboTier >= 10) {
    battleState.overdriveUntil = now + 4200;
    sound.playInsaneMoment();
    setFxMessage('OVERDRIVE MODE', `Combo chain x${event.comboCount}`, 1800, 6, now);
    addShake(player, 8, 320);
  }
}

function triggerNearMiss(now) {
  battleState.slowMotionUntil = now + 1050;
  battleState.nearMissCooldownUntil = now + 7000;
  player.game.grantForgiveness(2);
  sound.playNearMiss();
  setFxMessage('CLUTCH SAVE', 'Slow motion engaged', 1100, 6, now);
  addShake(player, 4.2, 240);

  const emergencyCells = [];
  const topRow = Math.max(0, getBoardTopFilledRow(player.game));
  for (let x = 0; x < player.game.grid.width; x++) {
    emergencyCells.push({ x, y: topRow });
  }

  emitParticles(player, emergencyCells, {
    color: '#ffd7a1',
    countPerCell: 2,
    life: 700,
    speed: 2.6,
    spread: 1.1,
    gravity: 0.04
  });

  rewardCoins(12, 'Clutch Save Reward', {
    fromX: window.innerWidth * 0.5,
    fromY: window.innerHeight * 0.34,
    count: 8,
    special: true
  });
}

function forceClearRowsWithPowerup(board, rows, now = performance.now()) {
  const game = board.game;
  if (game.gameOver) return 0;

  const rowIndices = [...new Set(rows)]
    .filter((row) => Number.isInteger(row) && row >= 0 && row < game.grid.height)
    .sort((a, b) => a - b);
  if (!rowIndices.length) return 0;

  const removeSet = new Set(rowIndices);
  const remaining = game.grid.cells.filter((_, rowIdx) => !removeSet.has(rowIdx));
  while (remaining.length < game.grid.height) {
    remaining.unshift(Array(game.grid.width).fill(0));
  }
  game.grid.cells = remaining;

  const cleared = rowIndices.length;
  game.linesCleared += cleared;
  game.level = 1 + Math.floor(game.linesCleared / 10);
  const lineClearScore = (POWERUP_LINE_CLEAR_POINTS[Math.min(4, cleared)] || 0) + Math.max(0, cleared - 4) * 260;
  game.score += lineClearScore * game.level;

  game.comboCount += 1;
  game.comboMultiplier = 1 + Math.max(0, game.comboCount - 1) * 0.25;

  const comboBoostActive = powerupState.comboBoostUntil > now;
  let garbageSent = Math.floor((POWERUP_GARBAGE_BY_CLEAR[cleared] || 0) * game.comboMultiplier * (comboBoostActive ? 1.35 : 1));
  if (garbageSent > 0 && game.pendingGarbage > 0) {
    const canceled = Math.min(game.pendingGarbage, garbageSent);
    game.pendingGarbage -= canceled;
    garbageSent -= canceled;
    game.emitEvent({ type: 'incomingGarbage', pending: game.pendingGarbage });
  }

  game.emitEvent({
    type: 'lineClear',
    source: 'powerup',
    count: cleared,
    lines: rowIndices,
    chainCount: 0,
    comboCount: game.comboCount,
    comboMultiplier: game.comboMultiplier,
    garbageSent
  });
  return cleared;
}

function getBestBombRow(game) {
  let bestRow = -1;
  let bestFilled = 0;
  for (let y = game.grid.height - 1; y >= 0; y--) {
    const filled = game.grid.cells[y].reduce((sum, cell) => (cell !== 0 ? sum + 1 : sum), 0);
    if (filled <= 0) continue;
    if (filled > bestFilled || (filled === bestFilled && y > bestRow)) {
      bestFilled = filled;
      bestRow = y;
    }
  }
  return bestRow;
}

function triggerLineBombPowerup() {
  const targetRow = getBestBombRow(player.game);
  if (targetRow < 0) return false;
  const rowCells = Array.from({ length: player.game.grid.width }, (_, x) => ({ x, y: targetRow }));
  emitParticles(player, rowCells, {
    color: '#ffd89a',
    countPerCell: 4,
    life: 620,
    speed: 3.4,
    spread: 1.6,
    gravity: 0.04
  });
  emitPulseWave(player, { color: '#ffd89a', duration: 520, strength: 1.35 });
  addShake(player, 7.2, 240);
  sound.playBassHit();
  setFxMessage('LINE BOMB', 'Row cleared instantly', 900, 7);
  return forceClearRowsWithPowerup(player, [targetRow]) > 0;
}

function triggerTimeSlowPowerup() {
  const now = performance.now();
  battleState.slowMotionUntil = Math.max(battleState.slowMotionUntil, now + 3000);
  setFxMessage('TIME SLOW', '3 seconds of clutch control', 1000, 7, now);
  emitPulseWave(player, { color: '#9ed9ff', duration: 620, strength: 1.05 });
  sound.playNearMiss();
  return true;
}

function buildAutoSnapPlan(game) {
  const currentX = game.currentPiece.x;
  const options = getUniqueRotationOptions(game.currentPiece);
  let best = null;

  options.forEach(({ shape, turns }) => {
    const bounds = getShapeBounds(shape);
    if (!bounds) return;
    const minX = -bounds.minX;
    const maxX = game.grid.width - 1 - bounds.maxX;
    for (let x = minX; x <= maxX; x++) {
      const simulation = simulateMoveAndScore(game, shape, x, 0.94);
      if (!simulation) continue;
      const distancePenalty = Math.abs(x - currentX) * 20 + turns * 9;
      const score = simulation.score - distancePenalty;
      if (!best || score > best.score) {
        best = { turns, targetX: x, score };
      }
    }
  });

  return best;
}

function triggerAutoSnapPowerup() {
  const plan = buildAutoSnapPlan(player.game);
  if (!plan) return false;
  for (let i = 0; i < plan.turns; i++) {
    player.game.rotate(1);
  }
  while (player.game.currentPiece.x < plan.targetX && player.game.moveRight()) {}
  while (player.game.currentPiece.x > plan.targetX && player.game.moveLeft()) {}
  player.game.hardDrop();
  setFxMessage('AUTO SNAP', 'Best placement locked', 820, 7);
  sound.playHardDrop();
  return true;
}

function triggerInstantSwapPowerup() {
  const previousCanHold = player.game.canHold;
  player.game.canHold = true;
  const swapped = player.game.holdPiece();
  if (!swapped) {
    player.game.canHold = previousCanHold;
    return false;
  }
  player.game.canHold = true;
  setFxMessage('INSTANT SWAP', 'Hold swap executed', 760, 6);
  sound.playHold();
  return true;
}

function triggerComboBoostPowerup() {
  const now = performance.now();
  powerupState.comboBoostUntil = Math.max(powerupState.comboBoostUntil, now + 7000);
  setFxMessage('COMBO BOOST', 'Coin and combo burst active', 1000, 7, now);
  emitPulseWave(player, { color: '#ffcf95', duration: 620, strength: 1.2 });
  sound.playInsaneMoment();
  return true;
}

function triggerFreezeStackPowerup() {
  const now = performance.now();
  powerupState.freezeUntil = Math.max(powerupState.freezeUntil, now + 4500);
  player.game.pendingGarbage = 0;
  player.game.emitEvent({ type: 'incomingGarbage', pending: 0 });
  setFxMessage('FREEZE STACK', 'Incoming pressure blocked', 980, 7, now);
  emitPulseWave(player, { color: '#9ceeff', duration: 700, strength: 1.05 });
  sound.playIncoming();
  return true;
}

function triggerMiniClearBurstPowerup() {
  const game = player.game;
  const ghostY = getGhostPieceY(game);
  const centerX = clamp(game.currentPiece.x + Math.floor(game.currentPiece.shape[0].length / 2), 0, game.grid.width - 1);
  const centerY = clamp(ghostY + Math.floor(game.currentPiece.shape.length / 2), 0, game.grid.height - 1);
  const clearedCells = [];
  const touchedRows = new Set();

  for (let y = centerY - 1; y <= centerY + 1; y++) {
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      if (x < 0 || x >= game.grid.width || y < 0 || y >= game.grid.height) continue;
      if (game.grid.cells[y][x] === 0) continue;
      game.grid.cells[y][x] = 0;
      touchedRows.add(y);
      clearedCells.push({ x, y });
    }
  }

  if (!clearedCells.length) return false;
  emitParticles(player, clearedCells, {
    color: '#a8f7ff',
    countPerCell: 4,
    life: 560,
    speed: 2.8,
    spread: 1.35,
    gravity: 0.04
  });
  addShake(player, 4.8, 200);
  setFxMessage('MINI CLEAR', 'Burst zone exploded', 780, 6);
  sound.playLineClear(1);

  const completedRows = [...touchedRows].filter((row) => game.grid.cells[row].every((cell) => cell !== 0));
  if (completedRows.length) {
    forceClearRowsWithPowerup(player, completedRows);
  }
  return true;
}

function triggerUndoPowerup() {
  const reverted = player.game.undoLastLock();
  if (!reverted) return false;
  setFxMessage('UNDO', 'Last lock reverted', 860, 7);
  emitPulseWave(player, { color: '#ffd8a3', duration: 640, strength: 0.95 });
  sound.playRotate();
  return true;
}

function activatePowerup(powerupId) {
  if (!gameSessionActive || player.game.gameOver) return;
  markPowerupDockInteraction();
  if (!consumePowerup(powerupId)) {
    setFxMessage('No power-up', 'Buy more from the shop', 760, 4);
    return;
  }

  let success = false;
  if (powerupId === 'line_bomb') success = triggerLineBombPowerup();
  if (powerupId === 'time_slow') success = triggerTimeSlowPowerup();
  if (powerupId === 'auto_snap') success = triggerAutoSnapPowerup();
  if (powerupId === 'instant_swap') success = triggerInstantSwapPowerup();
  if (powerupId === 'combo_boost') success = triggerComboBoostPowerup();
  if (powerupId === 'freeze_stack') success = triggerFreezeStackPowerup();
  if (powerupId === 'mini_clear') success = triggerMiniClearBurstPowerup();
  if (powerupId === 'undo') success = triggerUndoPowerup();

  if (!success) {
    addPowerupCount(powerupId, 1);
    setFxMessage('Power-up canceled', 'Try again when board state allows', 760, 4);
  } else {
    registerPlayerActionMomentum();
  }
  renderPowerupDock();
}

function processBoardEvents(attacker, defender, now) {
  const events = attacker.game.consumeEvents();
  events.forEach((event) => {
    if (event.type === 'pieceLock') {
      attacker.effects.lockPulses.push({
        cells: event.cells,
        start: now,
        duration: 140,
        strength: event.source === 'hardDrop' ? 1 : 0.65
      });

      if (attacker.tag === 'player' && event.tightPlacement) {
        setFxMessage('PERFECT!', event.perfectFit ? 'Spark fit bonus' : 'Tight placement', 680, 4, now);
        sound.playPerfectDrop();
        emitParticles(attacker, event.cells, {
          color: event.perfectFit ? '#fff1a6' : '#c8f4ff',
          countPerCell: event.perfectFit ? 3 : 2,
          life: 520,
          speed: 2.4,
          spread: 1.1,
          gravity: 0.04
        });
        const source = event.cells && event.cells[0]
          ? getBoardCellViewportPosition(attacker, event.cells[0])
          : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        rewardCoins(event.perfectFit ? 6 : 3, event.perfectFit ? 'Perfect Move Bonus' : 'Tight Placement Bonus', {
          fromX: source.x,
          fromY: source.y,
          count: event.perfectFit ? 5 : 3
        });
      }

      if (event.source === 'hardDrop' && event.dropDistance > 0) {
        attacker.effects.dropStreaks.push({
          cells: event.cells,
          dropDistance: event.dropDistance,
          start: now,
          duration: 170
        });
        addShake(attacker, Math.min(7, 2 + event.dropDistance * 0.35), 135);
        emitParticles(attacker, event.cells, {
          color: attacker.tag === 'player' ? '#8fe7ff' : '#ffc2ce',
          countPerCell: 1,
          life: 300,
          speed: 1.4,
          spread: 0.7,
          gravity: 0.03
        });
        if (attacker.tag === 'player') sound.playHardDrop();
      } else if (attacker.tag === 'player') {
        sound.playLock();
      }

      if (attacker.tag === 'ai' && aiProfileState.comboAggression < 0.2 && Math.random() < 0.82) {
        attacker.game.comboCount = 0;
        attacker.game.comboMultiplier = 1;
      }

      if (attacker.tag === 'player') {
        maybeRewardLuckyDrop(attacker, event);
      }
    }

    if (event.type === 'lineClear') {
      event.lines.forEach((line, index) => {
        attacker.effects.lineFlashes.push({
          lines: [line],
          start: now + index * 55,
          duration: 230
        });
      });
      addShake(attacker, 1.5 + event.count * 0.9, 120 + event.count * 35);

      const particleCells = event.lines.flatMap((line) =>
        Array.from({ length: attacker.game.grid.width }, (_, x) => ({ x, y: line }))
      );
      emitParticles(attacker, particleCells, {
        color: attacker.tag === 'player' ? '#8ff0ff' : '#ffb1c2',
        countPerCell: attacker.tag === 'player' ? 2 : 1,
        life: 520,
        speed: 3,
        spread: 1.3,
        gravity: 0.05
      });
      emitPulseWave(attacker, { duration: 520 + event.count * 60, strength: 0.7 + event.count * 0.15 });
      if (attacker.tag === 'player' && event.chainCount > 0) {
        setFxMessage('CHAIN REACTION', `Extra clears x${event.chainCount}`, 900, 4, now);
        addShake(attacker, 4 + event.chainCount, 220);
      }

      if (attacker.tag === 'player') {
        sound.playLineClear(event.count);
        triggerComboMoment(event, now);

        const baseCoins = getBaseLineClearCoins(event.count);
        const comboMult = getComboCoinMultiplier(event.comboCount || 0);
        const comboCoins = Math.floor(baseCoins * (comboMult - 1));
        const totalCoins = baseCoins + Math.max(0, comboCoins);
        const comboBoostActive = powerupState.comboBoostUntil > now;
        const comboBoostMultiplier = comboBoostActive ? 1.7 : 1;
        const boostedTotalCoins = Math.max(0, Math.floor(totalCoins * comboBoostMultiplier));
        const boostedComboCoins = Math.max(0, Math.floor(comboCoins * comboBoostMultiplier));

        const rowCenter = event.lines && event.lines.length ? event.lines[Math.floor(event.lines.length / 2)] : 10;
        const source = getBoardCellViewportPosition(attacker, { x: 5, y: rowCenter });
        rewardCoins(boostedTotalCoins, comboBoostActive ? `Line Clear x${event.count} - Boost` : `Line Clear x${event.count}`, {
          fromX: source.x,
          fromY: source.y,
          count: clamp(3 + event.count * 2, 4, 12),
          special: event.comboCount >= 8
        });

        if (boostedComboCoins > 0) {
          rewardCoins(boostedComboCoins, comboBoostActive ? `Combo x${event.comboCount} Boost Bonus` : `Combo x${event.comboCount} Bonus`, {
            fromX: source.x + 18,
            fromY: source.y - 16,
            count: clamp(2 + event.comboCount, 4, 12),
            special: event.comboCount >= 8
          });
        }

        if (event.count >= 4 && !rewardState.firsts.firstTetris) {
          rewardState.firsts.firstTetris = true;
          writeJsonStorage(FIRSTS_STORAGE_KEY, rewardState.firsts);
          rewardCoins(40, 'First Tetris Clear', {
            fromX: source.x,
            fromY: source.y - 24,
            count: 10,
            special: true
          });
        }

        if ((event.comboCount || 0) >= 5 && !rewardState.firsts.firstCombo5) {
          rewardState.firsts.firstCombo5 = true;
          writeJsonStorage(FIRSTS_STORAGE_KEY, rewardState.firsts);
          rewardCoins(35, 'First Combo 5+', {
            fromX: source.x,
            fromY: source.y - 28,
            count: 9,
            special: true
          });
        }
      }

      if (event.garbageSent > 0) {
        const freezeActive = powerupState.freezeUntil > now;
        const defenderIsFrozenPlayer = defender.tag === 'player' && freezeActive;
        if (defenderIsFrozenPlayer) {
          if (now >= powerupState.freezeBlockFxUntil) {
            powerupState.freezeBlockFxUntil = now + 580;
            setFxMessage('FREEZE BLOCK', 'Incoming attack negated', 680, 6, now);
          }
          return;
        }

        if (attacker.tag === 'ai') {
          const sendChance = clamp(0.12 + aiProfileState.comboAggression * 0.9, 0.08, 1);
          if (Math.random() <= sendChance) {
            const adjusted = Math.max(0, Math.floor(event.garbageSent * aiProfileState.attackMultiplier));
            if (adjusted > 0) defender.game.enqueueIncomingGarbage(adjusted);
          }
        } else {
          defender.game.enqueueIncomingGarbage(event.garbageSent);
        }
      }
    }

    if (event.type === 'garbageApplied' && event.count > 0) {
      addShake(attacker, 2 + event.count * 0.6, 120);
      if (attacker.tag === 'player') sound.playIncoming();
    }

    if (event.type === 'forgivenessUsed' && attacker.tag === 'player') {
      setFxMessage('SAVE BOOST', 'Forgiving lock assist', 700, 5, now);
      emitPulseWave(attacker, { color: '#ffb9c9', duration: 500, strength: 0.8 });
    }

    if (event.type === 'undoApplied' && attacker.tag === 'player') {
      attacker.effects.lockPulses.length = 0;
      attacker.effects.lineFlashes.length = 0;
      attacker.effects.dropStreaks.length = 0;
      setFxMessage('UNDO', 'Board rewind complete', 740, 7, now);
    }

    if (event.type === 'gameOver') {
      addShake(attacker, 8, 260);
      resultSoundPlayed = false;
    }
  });
}

function stepBoardGravity(board, delta, softDropActive = false, gravityIntervalOverride = null) {
  if (board.game.gameOver) return;
  const interval = softDropActive
    ? SOFT_DROP_INTERVAL_MS
    : gravityIntervalOverride ?? board.game.getGravityIntervalMs();
  board.dropAccumulator += delta;

  while (board.dropAccumulator >= interval) {
    const moved = softDropActive ? board.game.softDrop() : board.game.moveDown();
    board.dropAccumulator -= interval;
    if (!moved) break;
  }
}

function cloneCells(cells) {
  return cells.map((row) => [...row]);
}

function getCollisionOnCells(cells, width, height, shape, pieceX, pieceY) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const boardX = pieceX + x;
      const boardY = pieceY + y;

      if (boardX < 0 || boardX >= width || boardY >= height) {
        return true;
      }
      if (boardY >= 0 && cells[boardY][boardX] !== 0) {
        return true;
      }
    }
  }
  return false;
}

function getUniqueRotationOptions(piece) {
  const options = [];
  const seen = new Set();

  for (let turns = 0; turns < 4; turns++) {
    let rotated = piece.shape;
    for (let i = 0; i < turns; i++) {
      rotated = rotateShapeClockwise(rotated);
    }
    const signature = JSON.stringify(rotated);
    if (seen.has(signature)) continue;
    seen.add(signature);
    options.push({ shape: rotated, turns });
  }

  return options;
}

function clearLinesInSimulation(cells, width, height) {
  const remainingRows = cells.filter((row) => row.some((cell) => cell === 0));
  const linesCleared = height - remainingRows.length;

  while (remainingRows.length < height) {
    remainingRows.unshift(Array(width).fill(0));
  }

  return { cells: remainingRows, linesCleared };
}

function calculateBoardMetrics(cells, width, height) {
  const columnHeights = Array(width).fill(0);
  let holes = 0;

  for (let x = 0; x < width; x++) {
    let seenFilled = false;
    for (let y = 0; y < height; y++) {
      if (cells[y][x] !== 0) {
        if (!seenFilled) {
          columnHeights[x] = height - y;
          seenFilled = true;
        }
      } else if (seenFilled) {
        holes += 1;
      }
    }
  }

  let bumpiness = 0;
  for (let x = 0; x < width - 1; x++) {
    bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
  }

  const totalHeight = columnHeights.reduce((sum, value) => sum + value, 0);
  const topRow = height - Math.max(...columnHeights);
  return { holes, bumpiness, totalHeight, topRow };
}

function simulateMoveAndScore(game, shape, targetX, skill = 0.65) {
  const width = game.grid.width;
  const height = game.grid.height;
  const simCells = cloneCells(game.grid.cells);
  let y = game.currentPiece.y;

  if (getCollisionOnCells(simCells, width, height, shape, targetX, y)) {
    return null;
  }

  while (!getCollisionOnCells(simCells, width, height, shape, targetX, y + 1)) {
    y += 1;
  }

  let toppedOut = false;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const boardX = targetX + col;
      const boardY = y + row;
      if (boardY < 0) {
        toppedOut = true;
      } else {
        simCells[boardY][boardX] = game.currentPiece.type;
      }
    }
  }

  if (toppedOut) {
    return null;
  }

  const { cells: clearedCells, linesCleared } = clearLinesInSimulation(simCells, width, height);
  const { holes, bumpiness, totalHeight, topRow } = calculateBoardMetrics(clearedCells, width, height);
  const comboBonus = linesCleared > 0 ? game.comboCount + 1 : 0;
  const efficiencyWeight = 35 + skill * 50;
  const survivalWeight = 16 + skill * 8;

  const score =
    -(holes * survivalWeight) -
    (bumpiness * (4.5 - skill * 1.4)) -
    (totalHeight * (1.8 - skill * 0.5)) +
    (linesCleared * efficiencyWeight) +
    (comboBonus * (22 + skill * 20)) +
    ((height - topRow) * 1.2);

  return { score, linesCleared, totalHeight };
}

function calculateAISkill() {
  const playerDanger = getDangerState(player.game);
  const scorePressure = clamp(player.game.score / 6500, 0, 1);
  const linePressure = clamp(player.game.linesCleared / 28, 0, 1);
  const comboPressure = clamp((player.game.comboCount - 1) / 6, 0, 1);
  const incomingPressure = clamp(player.game.pendingGarbage / 8, 0, 1);

  let skill =
    aiProfileState.baseSkill +
    scorePressure * 0.12 +
    linePressure * 0.1 +
    comboPressure * (aiProfileState.clutchMode ? 0.16 : 0.08) +
    incomingPressure * 0.06;

  if (playerDanger === 'danger') skill -= 0.06;
  if (playerDanger === 'critical') {
    skill -= 0.12;
    if (aiProfileState.clutchMode) {
      skill += 0.08;
    }
  }

  return clamp(skill, 0.24, 0.98);
}

function createAIPlan(game, skill) {
  const width = game.grid.width;
  const rotationOptions = getUniqueRotationOptions(game.currentPiece);
  const moves = [];

  rotationOptions.forEach(({ shape, turns }) => {
    const bounds = getShapeBounds(shape);
    if (!bounds) return;

    const minX = -bounds.minX;
    const maxX = width - 1 - bounds.maxX;

    for (let x = minX; x <= maxX; x++) {
      const simulation = simulateMoveAndScore(game, shape, x, skill);
      if (!simulation) continue;

      moves.push({
        turns,
        targetX: x,
        score: simulation.score,
        linesCleared: simulation.linesCleared,
        totalHeight: simulation.totalHeight
      });
    }
  });

  if (moves.length === 0) {
    return { rotations: 0, targetX: game.currentPiece.x };
  }

  moves.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.linesCleared !== a.linesCleared) return b.linesCleared - a.linesCleared;
    return a.totalHeight - b.totalHeight;
  });

  const mistakeChance = clamp(aiProfileState.randomFactor + (0.22 - skill * 0.16), 0.02, 0.72);
  const altChoices = Math.min(3, moves.length - 1);
  const choiceIndex = altChoices > 0 && Math.random() < mistakeChance
    ? 1 + Math.floor(Math.random() * altChoices)
    : 0;

  return {
    rotations: moves[choiceIndex].turns,
    targetX: moves[choiceIndex].targetX
  };
}

function getAIStepIntervalMs() {
  const sharedGravity = player.game.getGravityIntervalMs();
  let interval = sharedGravity * aiProfileState.reactionScale;
  return clamp(interval, 70, 320);
}

function runAIStep() {
  if (ai.game.gameOver) return;

  if (aiController.lastPieceRef !== ai.game.currentPiece) {
    aiController.lastPieceRef = ai.game.currentPiece;
    aiController.plan = createAIPlan(ai.game, battleState.aiSkill);
  }

  if (!aiController.plan) return;

  if (aiController.plan.rotations > 0) {
    ai.game.rotate(1);
    aiController.plan.rotations -= 1;
    return;
  }

  if (ai.game.currentPiece.x < aiController.plan.targetX) {
    const moved = ai.game.moveRight();
    if (!moved) {
      aiController.plan.targetX = ai.game.currentPiece.x;
    }
    return;
  }
  if (ai.game.currentPiece.x > aiController.plan.targetX) {
    const moved = ai.game.moveLeft();
    if (!moved) {
      aiController.plan.targetX = ai.game.currentPiece.x;
    }
    return;
  }

  const fakeHesitationChance = clamp(aiProfileState.randomFactor * 0.42 + (0.16 - battleState.aiSkill * 0.11), 0.01, 0.35);
  if (Math.random() < fakeHesitationChance && getDangerState(ai.game) === 'stable') {
    return;
  }

  // Keep AI drop rhythm matched to gravity for parity with player speed.
}

function updateHud() {
  if (scoreValue) scoreValue.textContent = String(player.game.score);
  if (linesValue) linesValue.textContent = String(player.game.linesCleared);
  if (levelValue) levelValue.textContent = String(player.game.level);
  if (comboValue) comboValue.textContent = player.game.comboMultiplier.toFixed(2);
  if (incomingValue) incomingValue.textContent = String(player.game.pendingGarbage);
  if (incomingBar) {
    incomingBar.style.width = `${Math.min(100, player.game.pendingGarbage * 12)}%`;
  }
  if (holdStateValue) holdStateValue.textContent = player.game.canHold ? 'Ready' : 'Locked';
  if (dangerValue) dangerValue.textContent = describeDanger(battleState.dangerLevel);
  if (currentModeValue) {
    currentModeValue.textContent = currentModeLabel;
  }
  if (!modeRuntime.aiEnabled) {
    if (statusValue) statusValue.textContent = player.game.gameOver ? 'Defeated' : 'Running';
  } else if (player.game.gameOver) {
    if (statusValue) statusValue.textContent = 'Defeated';
  } else if (ai.game.gameOver) {
    if (statusValue) statusValue.textContent = 'Victory';
  } else if (battleState.slowMotionUntil > performance.now()) {
    if (statusValue) statusValue.textContent = 'Clutch';
  } else {
    if (statusValue) statusValue.textContent = 'Running';
  }

  if (aiIncomingValue) aiIncomingValue.textContent = String(ai.game.pendingGarbage);
  if (aiComboValue) aiComboValue.textContent = ai.game.comboMultiplier.toFixed(2);
  if (aiIncomingBar) {
    aiIncomingBar.style.width = `${Math.min(100, ai.game.pendingGarbage * 12)}%`;
  }
  if (!modeRuntime.aiEnabled) {
    if (aiStatusValue) aiStatusValue.textContent = 'Offline';
  } else if (ai.game.gameOver) {
    if (aiStatusValue) aiStatusValue.textContent = 'Defeated';
  } else if (player.game.gameOver) {
    if (aiStatusValue) aiStatusValue.textContent = 'Victory';
  } else if (battleState.aiSkill > 0.84) {
    if (aiStatusValue) aiStatusValue.textContent = 'Adaptive';
  } else {
    if (aiStatusValue) aiStatusValue.textContent = 'Running';
  }
}

function resetBattle() {
  player.game.reset();
  ai.game.reset();
  player.effects.lineFlashes.length = 0;
  player.effects.lockPulses.length = 0;
  player.effects.dropStreaks.length = 0;
  player.effects.particles.length = 0;
  player.effects.pulseWaves.length = 0;
  ai.effects.lineFlashes.length = 0;
  ai.effects.lockPulses.length = 0;
  ai.effects.dropStreaks.length = 0;
  ai.effects.particles.length = 0;
  ai.effects.pulseWaves.length = 0;
  player.dropAccumulator = 0;
  ai.dropAccumulator = 0;
  playerSoftDropHeld = false;
  playerLastIncoming = 0;
  aiController.lastPieceRef = null;
  aiController.plan = null;
  battleState.comboTier = 0;
  battleState.comboFxUntil = 0;
  battleState.slowMotionUntil = 0;
  battleState.nearMissCooldownUntil = 0;
  battleState.overdriveUntil = 0;
  battleState.flashUntil = 0;
  battleState.fxUntil = 0;
  battleState.fxPriority = 0;
  battleState.dangerLevel = 'stable';
  battleState.aiSkill = 0.62;
  battleState.aiStepAccumulator = 0;
  powerupState.comboBoostUntil = 0;
  powerupState.freezeUntil = 0;
  powerupState.freezeBlockFxUntil = 0;
  powerupUiState.expandedUntil = 0;
  powerupUiState.lastInteractionAt = performance.now();
  rewardState.sessionCoins = 0;
  rewardState.maxCombo = 0;
  rewardState.lastLevel = 1;
  rewardState.lastActionAt = 0;
  rewardState.speedBonusCooldownUntil = 0;
  rewardState.matchRewardGiven = false;
  rewardState.stageResolved = false;
  rewardState.challengeLines10Done = false;
  rewardState.challengeCombo5Done = false;
  rewardState.sessionStartAt = performance.now();
  if (matchRewardPanel) matchRewardPanel.classList.add('app-hidden');
  hideDailyRewardModal();
  hideStageResultPanel();
  resultSoundPlayed = false;
  syncBodyFx(performance.now());
  updateHud();
  updateCoinHud();
}

function doPlayerAction(action, soundAction = null) {
  const changed = action();
  if (changed) {
    registerPlayerActionMomentum();
    if (soundAction) soundAction();
  }
  return changed;
}

function doPlayerHardDrop() {
  if (player.game.gameOver) return;
  registerPlayerActionMomentum();
  player.game.hardDrop();
}

function doPlayerHorizontalMove(direction) {
  if (direction < 0) {
    doPlayerAction(() => player.game.moveLeft(), () => sound.playMove());
  } else {
    doPlayerAction(() => player.game.moveRight(), () => sound.playMove());
  }
}

function doPlayerRotate(direction = 1) {
  doPlayerAction(() => player.game.rotate(direction), () => sound.playRotate());
}

function loop(time = 0) {
  const rawDelta = Math.min(time - lastTime, 1000);
  lastTime = time;

  if (!gameSessionActive) {
    requestAnimationFrame(loop);
    return;
  }

  const timeScale = battleState.slowMotionUntil > time ? 0.42 : (battleState.overdriveUntil > time ? 0.86 : 1);
  const delta = rawDelta * timeScale;
  updateModeDynamics(time);
  const sharedGravityInterval = getModeGravityInterval(player.game.getGravityIntervalMs(), time);

  stepBoardGravity(player, delta, playerSoftDropHeld, sharedGravityInterval);
  if (modeRuntime.aiEnabled) {
    stepBoardGravity(ai, delta, false, sharedGravityInterval);
  }

  if (modeRuntime.aiEnabled) {
    battleState.aiSkill = calculateAISkill();
    battleState.aiStepAccumulator += delta;
    const aiStepInterval = getAIStepIntervalMs();
    while (battleState.aiStepAccumulator >= aiStepInterval) {
      runAIStep();
      battleState.aiStepAccumulator -= aiStepInterval;
    }
  }

  processBoardEvents(player, ai, time);
  if (modeRuntime.aiEnabled) {
    processBoardEvents(ai, player, time);
  }
  if (powerupState.freezeUntil > time && player.game.pendingGarbage > 0) {
    player.game.pendingGarbage = 0;
    player.game.emitEvent({ type: 'incomingGarbage', pending: 0 });
  }
  pruneEffects(player, time);
  if (modeRuntime.aiEnabled) {
    pruneEffects(ai, time);
  }

  rewardState.maxCombo = Math.max(rewardState.maxCombo, player.game.comboCount);
  maybeRewardChallenges();
  maybeRewardLevelUp();
  evaluateStageRaceOutcome(time);
  evaluateSoloOutcome(time);

  battleState.dangerLevel = getDangerState(player.game);
  if (
    !player.game.gameOver &&
    (battleState.dangerLevel === 'danger' || battleState.dangerLevel === 'critical') &&
    time >= battleState.nearMissCooldownUntil &&
    battleState.slowMotionUntil <= time
  ) {
    triggerNearMiss(time);
  }

  if (player.game.pendingGarbage > playerLastIncoming) {
    sound.playIncoming();
  }
  if (battleState.overdriveUntil > time) {
    sound.playOverdrivePulse();
  }
  music.setOverdrive(battleState.overdriveUntil > time);
  playerLastIncoming = player.game.pendingGarbage;

  const battleEnded = modeRuntime.aiEnabled
    ? (player.game.gameOver || ai.game.gameOver)
    : player.game.gameOver;
  if (battleEnded && !resultSoundPlayed) {
    if (!modeRuntime.aiEnabled) {
      sound.playDefeat();
    } else if (player.game.gameOver && !ai.game.gameOver) {
      sound.playDefeat();
    } else if (ai.game.gameOver && !player.game.gameOver) {
      sound.playVictory();
    } else {
      sound.playDefeat();
    }
    resultSoundPlayed = true;
  }
  if ((!modeRuntime.aiEnabled && !player.game.gameOver) || (modeRuntime.aiEnabled && !player.game.gameOver && !ai.game.gameOver)) {
    resultSoundPlayed = false;
  }

  syncBodyFx(time);
  drawBoard(player, time);
  if (modeRuntime.aiEnabled) {
    drawBoard(ai, time);
  }
  drawPreview(nextCtx, player.game.nextPiece.type);
  if (modeRuntime.aiEnabled) {
    drawPreview(aiNextCtx, ai.game.nextPiece.type);
    drawMiniLiveBoard(aiMiniCtx, ai);
    drawMiniLiveBoard(aiPreviewCtx, ai);
  }
  updatePowerupDockState(time);
  updateHud();

  maybeRewardMatchEnd(time);

  requestAnimationFrame(loop);
}

loop();

document.addEventListener('keydown', (e) => {
  if (!gameSessionActive) return;
  sound.unlock();

  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'Shift'].includes(e.key) || e.code === 'Space') {
    e.preventDefault();
  }

  if (
    e.repeat &&
    (e.code === 'Space' ||
      e.key === 'ArrowUp' ||
      e.key.toLowerCase() === 'x' ||
      e.key.toLowerCase() === 'z' ||
      e.key.toLowerCase() === 'r' ||
      e.key.toLowerCase() === 'c' ||
      e.key === 'Shift')
  ) {
    return;
  }

  const inverted = isControlsInverted();
  if (e.key === 'ArrowLeft') doPlayerHorizontalMove(inverted ? 1 : -1);
  if (e.key === 'ArrowRight') doPlayerHorizontalMove(inverted ? -1 : 1);
  if (e.key === 'ArrowDown') {
    if (!playerSoftDropHeld) {
      playerSoftDropHeld = true;
      doPlayerAction(() => player.game.softDrop(), null);
    }
  }
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'x') {
    doPlayerRotate(inverted ? -1 : 1);
  }
  if (e.key.toLowerCase() === 'z') {
    doPlayerRotate(inverted ? 1 : -1);
  }
  if (e.code === 'Space') {
    doPlayerHardDrop();
  }
  if (e.key.toLowerCase() === 'c' || e.key === 'Shift') {
    doPlayerAction(() => player.game.holdPiece(), () => sound.playHold());
  }
  if (e.key.toLowerCase() === 'r') {
    resetBattle();
  }
});

document.addEventListener('keyup', (e) => {
  if (!gameSessionActive) return;
  if (e.key === 'ArrowDown') {
    playerSoftDropHeld = false;
    player.dropAccumulator = 0;
  }
});

document.addEventListener('pointerdown', () => {
  sound.unlock();
  music.unlock();
});

function setupTouchBoardControls() {
  if (!playerCanvas) return;

  const touchState = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    holdZone: 'center',
    holdDelayTimer: null,
    holdRepeatTimer: null,
    holdTriggered: false,
    startTime: 0,
    lastX: 0,
    lastY: 0
  };

  const TAP_DISTANCE = 14;
  const SOFT_DROP_STEP = 18;
  const HARD_DROP_DISTANCE = 140;
  const HOLD_START_MS = 180;
  const HOLD_REPEAT_MS = 70;

  const clearHoldTimers = () => {
    if (touchState.holdDelayTimer) {
      clearTimeout(touchState.holdDelayTimer);
      touchState.holdDelayTimer = null;
    }
    if (touchState.holdRepeatTimer) {
      clearInterval(touchState.holdRepeatTimer);
      touchState.holdRepeatTimer = null;
    }
  };

  const moveFromZone = (zone) => {
    const inverted = isControlsInverted();
    if (zone === 'left') {
      doPlayerHorizontalMove(inverted ? 1 : -1);
    } else if (zone === 'right') {
      doPlayerHorizontalMove(inverted ? -1 : 1);
    }
  };

  const getTouchZone = (clientX) => {
    const rect = playerCanvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    if (localX < rect.width * 0.35) return 'left';
    if (localX > rect.width * 0.65) return 'right';
    return 'center';
  };

  playerCanvas.addEventListener('pointerdown', (e) => {
    if (!gameSessionActive || e.pointerType !== 'touch') return;
    e.preventDefault();
    sound.unlock();
    touchState.active = true;
    touchState.pointerId = e.pointerId;
    touchState.startX = e.clientX;
    touchState.startY = e.clientY;
    touchState.lastX = e.clientX;
    touchState.lastY = e.clientY;
    touchState.holdZone = getTouchZone(e.clientX);
    touchState.holdTriggered = false;
    touchState.startTime = performance.now();
    clearHoldTimers();
    touchState.holdDelayTimer = setTimeout(() => {
      if (!touchState.active) return;
      if (touchState.holdZone === 'center') {
        doPlayerAction(() => player.game.holdPiece(), () => sound.playHold());
        touchState.holdTriggered = true;
        return;
      }
      moveFromZone(touchState.holdZone);
      touchState.holdRepeatTimer = setInterval(() => {
        moveFromZone(touchState.holdZone);
      }, HOLD_REPEAT_MS);
      touchState.holdTriggered = true;
    }, HOLD_START_MS);
    playerCanvas.setPointerCapture(e.pointerId);
  });

  playerCanvas.addEventListener('pointermove', (e) => {
    if (!touchState.active || touchState.pointerId !== e.pointerId || e.pointerType !== 'touch') return;
    e.preventDefault();

    const totalDy = e.clientY - touchState.startY;
    const stepDy = e.clientY - touchState.lastY;
    touchState.holdZone = getTouchZone(e.clientX);

    if (stepDy >= SOFT_DROP_STEP && Math.abs(totalDy) >= SOFT_DROP_STEP) {
      doPlayerAction(() => player.game.softDrop(), null);
      touchState.lastY = e.clientY;
    }
  });

  playerCanvas.addEventListener('pointerup', (e) => {
    if (!touchState.active || touchState.pointerId !== e.pointerId || e.pointerType !== 'touch') return;
    e.preventDefault();

    const dx = e.clientX - touchState.startX;
    const dy = e.clientY - touchState.startY;
    const duration = performance.now() - touchState.startTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const zone = getTouchZone(e.clientX);
    clearHoldTimers();

    if (!touchState.holdTriggered && absDx <= TAP_DISTANCE && absDy <= TAP_DISTANCE && duration <= 260) {
      if (zone === 'center') {
        doPlayerRotate(isControlsInverted() ? -1 : 1);
      } else {
        moveFromZone(zone);
      }
    } else if (dy >= HARD_DROP_DISTANCE && absDy > absDx) {
      doPlayerHardDrop();
    }

    touchState.active = false;
    touchState.pointerId = null;
  });

  playerCanvas.addEventListener('pointercancel', () => {
    clearHoldTimers();
    touchState.active = false;
    touchState.pointerId = null;
  });
}

function wireButton(id, handler) {
  const button = document.getElementById(id);
  if (!button) return;
  button.addEventListener('click', (e) => {
    e.preventDefault();
    sound.unlock();
    handler();
  });
}

function wireHoldButton(id, onStart, onEnd, intervalMs = 85) {
  const button = document.getElementById(id);
  if (!button) return;

  let holdTimer = null;
  const stopHold = () => {
    if (holdTimer !== null) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
    if (onEnd) onEnd();
  };

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sound.unlock();
    onStart();
    holdTimer = setInterval(onStart, intervalMs);
  });

  button.addEventListener('pointerup', stopHold);
  button.addEventListener('pointercancel', stopHold);
  button.addEventListener('pointerleave', stopHold);
}

wireHoldButton('btnLeft', () => doPlayerHorizontalMove(isControlsInverted() ? 1 : -1), null);
wireHoldButton('btnRight', () => doPlayerHorizontalMove(isControlsInverted() ? -1 : 1), null);
wireHoldButton(
  'btnDown',
  () => {
    playerSoftDropHeld = true;
    doPlayerAction(() => player.game.softDrop(), null);
  },
  () => {
    playerSoftDropHeld = false;
    player.dropAccumulator = 0;
  },
  45
);
wireButton('btnRotate', () => doPlayerRotate(isControlsInverted() ? -1 : 1));
wireButton('btnHold', () => doPlayerAction(() => player.game.holdPiece(), () => sound.playHold()));
wireButton('btnDrop', () => doPlayerHardDrop());
wireButton('btnReset', () => resetBattle());
wireButton('btnResetAI', () => resetBattle());

function showHomeScreen() {
  gameSessionActive = false;
  currentModeLabel = 'Play';
  if (homeSignal) {
    homeSignal.textContent = 'Ready for the next upgrade.';
  }
  if (pageBody) {
    pageBody.classList.remove('shop-mode');
    pageBody.classList.remove('game-mode');
    pageBody.classList.add('home-mode');
  }
  if (shopScreen) shopScreen.classList.add('app-hidden');
  if (gameApp) gameApp.classList.add('app-hidden');
  if (homeScreen) homeScreen.style.display = '';
  setHomeMode(modeRuntime.selectedMode);
  hideDailyRewardModal();
  closeLevelSelect();
  setActiveBoardPage('player');
  resetBattle();
  renderShopGrid();
  renderPowerupDock();
}

function setActiveBoardPage(page) {
  const singlePageMobile = isMobilePlayViewport();
  const target = modeRuntime.aiEnabled && !singlePageMobile && page === 'ai' ? 'ai' : 'player';
  if (playerPage) playerPage.classList.toggle('app-hidden', target !== 'player');
  if (aiPage) aiPage.classList.toggle('app-hidden', target !== 'ai');
  if (target !== 'player' && aiPreviewPanel) {
    aiPreviewPanel.classList.add('app-hidden');
  }
  if (singlePageMobile && aiPreviewPanel) {
    aiPreviewPanel.classList.add('app-hidden');
  }
  scheduleBoardCanvasDisplaySync();
}

function openGame(modeLabel, modeKey = 'battle') {
  modeRuntime.activeMode = normalizeModeKey(modeKey);
  resetBattle();
  gameSessionActive = true;
  currentModeLabel = modeLabel;
  music.unlock();
  claimDailyRewardIfEligible();
  setActiveBoardPage('player');
  if (pageBody) {
    pageBody.classList.remove('shop-mode');
    pageBody.classList.remove('home-mode');
    pageBody.classList.add('game-mode');
  }
  if (shopScreen) shopScreen.classList.add('app-hidden');
  if (homeScreen) homeScreen.style.display = 'none';
  if (gameApp) gameApp.classList.remove('app-hidden');
  if (currentModeValue) currentModeValue.textContent = modeLabel;
  if (statusValue) statusValue.textContent = 'Running';
  configureModeSession(performance.now());
  renderPowerupDock();
  scheduleBoardCanvasDisplaySync();
}

function openShopScreen() {
  gameSessionActive = false;
  if (pageBody) {
    pageBody.classList.remove('game-mode');
    pageBody.classList.remove('home-mode');
    pageBody.classList.add('shop-mode');
  }
  if (homeScreen) homeScreen.style.display = 'none';
  if (gameApp) gameApp.classList.add('app-hidden');
  if (shopScreen) shopScreen.classList.remove('app-hidden');
  closeLevelSelect();
  renderShopGrid();
}

function closeShopScreen() {
  if (shopScreen) shopScreen.classList.add('app-hidden');
  if (pageBody) {
    pageBody.classList.remove('shop-mode');
    pageBody.classList.remove('game-mode');
    pageBody.classList.add('home-mode');
  }
  if (homeScreen) homeScreen.style.display = '';
  if (gameApp) gameApp.classList.add('app-hidden');
  setHomeMode(modeRuntime.selectedMode);
}

if (btnPlayHome) {
  btnPlayHome.addEventListener('click', () => startSelectedModeFromHome());
}
if (btnBattleHome) {
  btnBattleHome.addEventListener('click', () => startSelectedModeFromHome());
}
if (btnOpenShop) {
  btnOpenShop.addEventListener('click', () => openShopScreen());
}
if (btnCloseShop) {
  btnCloseShop.addEventListener('click', () => closeShopScreen());
}
if (btnCloseLevelSelect) {
  btnCloseLevelSelect.addEventListener('click', () => closeLevelSelect());
}
if (btnDailyRewardOk) {
  btnDailyRewardOk.addEventListener('click', (e) => {
    e.preventDefault();
    collectDailyReward();
  });
}
if (dailyRewardModal) {
  dailyRewardModal.addEventListener('click', (e) => {
    if (e.target === dailyRewardModal) {
      collectDailyReward();
    }
  });
}
if (btnStageNext) {
  btnStageNext.addEventListener('click', () => {
    const target = stageResultState.nextStageIndex;
    if (typeof target === 'number') {
      startStageByIndex(target);
      return;
    }
    if (modeRuntime.activeMode === 'puzzle') {
      modeRuntime.puzzleAdvanceOnStart = true;
      openGame(MODE_DEFS.puzzle.label, 'puzzle');
    }
  });
}
if (btnStageRetry) {
  btnStageRetry.addEventListener('click', () => {
    const target = stageResultState.retryStageIndex ?? progressionState.selectedStageIndex;
    if (typeof target === 'number' && modeRuntime.activeMode === 'battle') {
      startStageByIndex(target);
      return;
    }
    if (modeRuntime.activeMode === 'puzzle') {
      modeRuntime.puzzleAdvanceOnStart = false;
      openGame(MODE_DEFS.puzzle.label, 'puzzle');
      return;
    }
    openGame(MODE_DEFS[modeRuntime.activeMode]?.label || 'Play', modeRuntime.activeMode);
  });
}
if (btnStageMenu) {
  btnStageMenu.addEventListener('click', () => showHomeScreen());
}
if (btnBackToMenu) {
  btnBackToMenu.addEventListener('click', () => showHomeScreen());
}
if (btnBackToMenuAI) {
  btnBackToMenuAI.addEventListener('click', () => showHomeScreen());
}
if (btnShowAIPage) {
  btnShowAIPage.addEventListener('click', () => setActiveBoardPage('ai'));
}
if (btnShowPlayerPage) {
  btnShowPlayerPage.addEventListener('click', () => setActiveBoardPage('player'));
}
if (btnToggleAIPreview && aiPreviewPanel) {
  btnToggleAIPreview.addEventListener('click', () => {
    aiPreviewPanel.classList.toggle('app-hidden');
  });
}
if (btnCloseAIPreview && aiPreviewPanel) {
  btnCloseAIPreview.addEventListener('click', () => {
    aiPreviewPanel.classList.add('app-hidden');
  });
}
if (modePicker) {
  modePicker.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const pill = target.closest('.mode-pill');
    if (!pill) return;
    const mode = pill.getAttribute('data-mode') || 'battle';
    setHomeMode(mode);
  });
}
if (powerupDock) {
  powerupDock.addEventListener('pointerdown', () => {
    markPowerupDockInteraction();
  });
}
window.addEventListener('resize', () => {
  scheduleBoardCanvasDisplaySync();
});
window.addEventListener('orientationchange', () => {
  scheduleBoardCanvasDisplaySync();
});
setHomeMode('battle');
setActiveBoardPage('player');
setupTouchBoardControls();
renderShopGrid();
renderPowerupDock();
scheduleBoardCanvasDisplaySync();
