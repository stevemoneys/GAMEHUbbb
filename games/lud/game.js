import { generatePaths, PATHS, HOME_SLOTS, ENTRY_CELLS } from "./board.js";

const tokenEls = {};
let isMoving = false;
let gameOver = false;
let hasRolledThisTurn = false;
let waitingForTokenMove = false;
const LUDO_RESUME_KEY = "ludo_saved_match_v1";

const stageEl = document.querySelector(".ludo-stage");
const boardEl = document.querySelector(".ludo-board");
generatePaths(boardEl);
const ALL_COLORS_CLOCKWISE = ["red", "green", "yellow", "blue"];

const params = new URLSearchParams(window.location.search);
const matchMode = (params.get("mode") || "vs-computer").toLowerCase();
const requestedPlayers = Number(params.get("players")) || 4;
const requestedHumanColor = (params.get("human") || "red").toLowerCase();
const currentLevel = Math.max(1, Number(params.get("level")) || 1);
const playerCount = Math.min(4, Math.max(2, requestedPlayers));
const humanColor = ALL_COLORS_CLOCKWISE.includes(requestedHumanColor) ? requestedHumanColor : "red";
const aiDifficulty = Math.min(3, Math.floor((currentLevel - 1) / 5) + 1);

let gameMode = (params.get("gm") || localStorage.getItem("ludo_game_mode") || "classic").toLowerCase();
const MODES = {
  classic: {},
  chaos: { snakes: true, ladders: true },
  power: { powerTiles: true },
  battle: { aggressive: true },
  arena: { allEvents: true }
};
if (!Object.prototype.hasOwnProperty.call(MODES, gameMode)) {
  gameMode = "classic";
}

const CHAOS_LADDER_PAIRS = [
  { start: 46, end: 52, side: "left" },
  { start: 20, end: 26, side: "right" }
];
const CHAOS_SNAKE_PAIRS = [
  { mouth: 14, tail: 8, side: "top" },
  { mouth: 40, tail: 34, side: "bottom" }
];
const CHAOS_ENDPOINT_TILES = new Set([
  ...CHAOS_LADDER_PAIRS.flatMap(({ start, end }) => [start, end]),
  ...CHAOS_SNAKE_PAIRS.flatMap(({ mouth, tail }) => [mouth, tail])
]);
const CHAOS_REWARD_COINS = 200;
const SVG_NS = "http://www.w3.org/2000/svg";
const SPEED_TILES = [8, 21];
const TELEPORT_TILES = [12];
const SHIELD_TILES = [30];
const POWER_TILE_COUNTS = {
  speed: 2,
  shield: 2,
  teleport: 1
};
const BATTLE_TILE_COUNTS = {
  risk: 3,
  block: 2
};
const BATTLE_CAPTURE_COINS = 12;
const BATTLE_STREAK_STEP_COINS = 6;
const ARENA_REWARD_COINS = 400;
const ARENA_WIN_MULTIPLIER = 5;
const ARENA_REWARD_TILE_COUNT = 2;

const humanIndexInCycle = ALL_COLORS_CLOCKWISE.indexOf(humanColor);
const activeColors = playerCount === 2
  ? [humanColor, ALL_COLORS_CLOCKWISE[(humanIndexInCycle + 2) % ALL_COLORS_CLOCKWISE.length]]
  : Array.from({ length: playerCount }, (_, i) => {
    return ALL_COLORS_CLOCKWISE[(humanIndexInCycle + i) % ALL_COLORS_CLOCKWISE.length];
  });

function clearResumeSnapshot() {
  localStorage.removeItem(LUDO_RESUME_KEY);
}

const TURN_COORD_BY_COLOR = {
  red: [8, 1],
  green: [1, 8],
  yellow: [8, 15],
  blue: [15, 8]
};

const HOME_PATH_KEY_BY_COLOR = {
  red: "redHome",
  green: "greenHome",
  yellow: "yellowHome",
  blue: "blueHome"
};

const STAR_COORDS = [
  [9, 3],
  [3, 7],
  [7, 13],
  [13, 9]
];

const ENTRY_INDEX_BY_COLOR = {};
const TURN_INDEX_BY_COLOR = {};
const SAFE_INDICES = new Set();

Object.keys(HOME_PATH_KEY_BY_COLOR).forEach(color => {
  ENTRY_INDEX_BY_COLOR[color] = PATHS.common.findIndex(p => p.el === ENTRY_CELLS[color]);

  const [r, c] = TURN_COORD_BY_COLOR[color];
  TURN_INDEX_BY_COLOR[color] = PATHS.common.findIndex(p => p.row === r && p.col === c);
});

STAR_COORDS.forEach(([r, c]) => {
  const index = PATHS.common.findIndex(p => p.row === r && p.col === c);
  if (index >= 0) SAFE_INDICES.add(index);
});

const diceEls = {
  red: document.getElementById("dice-red"),
  green: document.getElementById("dice-green"),
  yellow: document.getElementById("dice-yellow"),
  blue: document.getElementById("dice-blue")
};

const diceFaces = {
  red: diceEls.red.querySelectorAll(".face img"),
  green: diceEls.green.querySelectorAll(".face img"),
  yellow: diceEls.yellow.querySelectorAll(".face img"),
  blue: diceEls.blue.querySelectorAll(".face img")
};

const goalEls = {
  red: document.getElementById("goal-red"),
  green: document.getElementById("goal-green"),
  yellow: document.getElementById("goal-yellow"),
  blue: document.getElementById("goal-blue")
};
const dicePanelsByColor = {
  red: diceEls.red.closest(".dice-panel"),
  green: diceEls.green.closest(".dice-panel"),
  yellow: diceEls.yellow.closest(".dice-panel"),
  blue: diceEls.blue.closest(".dice-panel")
};

const resultModalEl = document.getElementById("result-modal");
const resultTitleEl = document.getElementById("result-title");
const resultSubtitleEl = document.getElementById("result-subtitle");
const btnPlayAgainEl = document.getElementById("btn-play-again");
const btnCancelEl = document.getElementById("btn-cancel");
const btnNextLevelEl = document.getElementById("btn-next-level");
const levelBadgeEl = document.getElementById("level-badge");
const backLevelsBtnEl = document.getElementById("back-levels-btn");
const restartBtnEl = document.getElementById("restart-btn");
const pauseBtnEl = document.getElementById("pause-btn");
const coinTotalEl = document.getElementById("coin-total");
const toastLayerEl = document.getElementById("toast-layer");
const coinHudEl = document.getElementById("coin-hud");
const coinFxLayerEl = document.getElementById("coin-fx-layer");
const sparkLayerEl = document.getElementById("spark-layer");
const chaosOverlayEl = document.getElementById("chaos-overlay");
const pauseModalEl = document.getElementById("pause-modal");
const pauseResumeBtnEl = document.getElementById("pause-resume-btn");
const pauseExitBtnEl = document.getElementById("pause-exit-btn");

const BACKGROUND_IMAGES = Array.from({ length: 20 }, (_, i) => {
  return `backgrounds/bg${i + 1}_result.webp`;
});

const SOUND_FILES = {
  step: "sounds/step.wav",
  entry: "sounds/entry.mp3",
  goal: "sounds/goal.mp3",
  win: "sounds/win.mp3",
  bgm: "sounds/bgm.mp3"
};

const bgMusic = new Audio(SOUND_FILES.bgm);
bgMusic.loop = true;
bgMusic.volume = 0.22;

let bgMusicStarted = false;
const BGM_ENABLED_KEY = "ludo_bgm_enabled";
const SFX_ENABLED_KEY = "ludo_sfx_enabled";
let isBgmEnabled = localStorage.getItem(BGM_ENABLED_KEY) !== "0";
let isSfxEnabled = localStorage.getItem(SFX_ENABLED_KEY) !== "0";

const EVENT_COIN_REWARDS = {
  rollSix: 2,
  capture: 9,
  blockade: 6,
  home: 15
};

const REACTION_LINES = {
  rollSix: ["Perfect!", "Great Roll!", "Lucky 6!"],
  capture: ["Nice Move!", "Clean Capture!", "Sharp Play!"],
  blockade: ["Solid Blockade!", "Great Defense!", "Board Control!"],
  home: ["Perfect Finish!", "Token Home!", "Excellent Push!"],
  unlucky: ["Unlucky!", "Tough Break!", "So Close!"],
  almost: ["Almost There!", "Final Push!", "One More!"]
};

const nearWinAnnounced = new Set();

const DAILY_LOGIN_COINS = 25;
const DAILY_LOGIN_KEY = "ludo_last_login_date";
let totalCoins = Math.max(0, Number(localStorage.getItem("ludo_coins") || "0"));

if (levelBadgeEl) {
  levelBadgeEl.textContent = String(currentLevel);
}
if (coinTotalEl) {
  coinTotalEl.textContent = String(totalCoins);
}

function applyDailyLoginReward() {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const last = localStorage.getItem(DAILY_LOGIN_KEY);
  if (last === todayKey) return;
  localStorage.setItem(DAILY_LOGIN_KEY, todayKey);
  totalCoins += DAILY_LOGIN_COINS;
  localStorage.setItem("ludo_coins", String(totalCoins));
  if (coinTotalEl) coinTotalEl.textContent = String(totalCoins);
}

applyDailyLoginReward();

function addCoins(amount) {
  const safeAmount = Math.floor(Number(amount) || 0);
  if (safeAmount <= 0) return;
  totalCoins += safeAmount;
  localStorage.setItem("ludo_coins", String(totalCoins));
  if (coinTotalEl) coinTotalEl.textContent = String(totalCoins);
}

function pickReactionLine(type) {
  const list = REACTION_LINES[type];
  if (!Array.isArray(list) || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}

function getElementCenter(el) {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return null;
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function pulseCoinHud() {
  const el = coinTotalEl || coinHudEl;
  if (!el) return;
  el.classList.remove("coin-hud-pop");
  // Force restart so repeated rewards can retrigger animation.
  void el.offsetWidth;
  el.classList.add("coin-hud-pop");
}

function animateCoinGain(amount, sourceEl = null, sourcePoint = null) {
  if (!coinFxLayerEl) return;
  const safeAmount = Math.floor(Number(amount) || 0);
  if (safeAmount <= 0) return;

  const target = getElementCenter(coinHudEl || coinTotalEl);
  if (!target) return;

  const fromPoint = sourcePoint || getElementCenter(sourceEl) || getElementCenter(boardEl) || target;
  const coinCount = Math.max(4, Math.min(16, Math.ceil(safeAmount / 2)));
  let finished = 0;

  for (let i = 0; i < coinCount; i++) {
    const coin = document.createElement("span");
    coin.className = "coin-fly";

    const spread = 18 + Math.random() * 26;
    const angle = (Math.PI * 2 * i) / coinCount;
    const sx = fromPoint.x + Math.cos(angle) * spread + (Math.random() * 12 - 6);
    const sy = fromPoint.y + Math.sin(angle) * spread + (Math.random() * 10 - 5);
    const duration = 560 + Math.floor(Math.random() * 260);
    const delay = i * 36;

    coin.style.setProperty("--x0", `${sx}px`);
    coin.style.setProperty("--y0", `${sy}px`);
    coin.style.setProperty("--x1", `${target.x}px`);
    coin.style.setProperty("--y1", `${target.y}px`);
    coin.style.setProperty("--duration", `${duration}ms`);
    coin.style.setProperty("--delay", `${delay}ms`);
    coin.style.setProperty("--spin", `${540 + Math.floor(Math.random() * 720)}deg`);

    coin.addEventListener("animationend", () => {
      coin.remove();
      finished += 1;
      if (finished >= coinCount) pulseCoinHud();
    });
    coinFxLayerEl.appendChild(coin);
  }
}

function rewardHumanEvent(type, sourceEl = null, sourcePoint = null, multiplier = 1) {
  const amount = Math.floor((EVENT_COIN_REWARDS[type] || 0) * Math.max(1, Number(multiplier) || 1));
  if (amount <= 0) return;
  addCoins(amount);
  animateCoinGain(amount, sourceEl, sourcePoint);
  const line = pickReactionLine(type);
  if (line) {
    showToast(`${line} +${amount}`);
  }
}

const rotations = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(-90deg) rotateY(0deg)",
  3: "rotateX(0deg) rotateY(90deg)",
  4: "rotateX(0deg) rotateY(-90deg)",
  5: "rotateX(90deg) rotateY(0deg)",
  6: "rotateX(180deg) rotateY(0deg)"
};

const diceSkins = {
  classic: ["dice/1_result.webp", "dice/4_result.webp", "dice/6_result.webp", "dice/3_result.webp", "dice/2_result.webp", "dice/5_result.webp"]
};
const ACTIVE_DICE_SKIN_KEY = "ludo_active_dice_skin";
const OWNED_DICE_SKINS_KEY = "ludo_owned_dice_skins";
const ACTIVE_TOKEN_SKIN_KEY = "ludo_active_token_skin";
const OWNED_TOKEN_SKINS_KEY = "ludo_owned_token_skins";
const SKIN_EFFECTS = {
  1: { price: 100, bonusMatchCoins: 0, bonusWinCoins: 0 },
  2: { price: 200, bonusMatchCoins: 2 },
  3: { price: 400, bonusWinCoins: 5 },
  4: { price: 700, plusSixChance: 0.03 },
  5: { price: 1000, lessOneChance: 0.05 },
  6: { price: 1500, bonusWinCoins: 10 },
  7: { price: 2500, bonusCaptureCoins: 5 },
  8: { price: 3200, shieldOnce: true },
  9: { price: 4000, plusOneRollOnce: true },
  10: { price: 5500, highRollBoost: 0.08 },
  11: { price: 7000, replayLastRollOnce: true },
  12: { price: 8500, reenterAfterCapture: true },
  13: { price: 10000, nextRollBoostAfterCapture: true },
  14: { price: 13000, safeSquareExtraTurn: true },
  15: { price: 17000, guaranteedSixAfterTenRolls: true },
  16: { price: 22000, doubleMoveOnce: true },
  17: { price: 28000, extraTurnEveryTwoHomes: true },
  18: { price: 35000, repeatRollChance: 0.10 },
  19: { price: 35000, repeatRollChance: 0.10 },
  20: { price: 50000, guaranteedSixOnce: true, winBonusPercent: 0.15, shieldOnce: true }
};

function getActiveDiceSkin() {
  const skin = (localStorage.getItem(ACTIVE_DICE_SKIN_KEY) || "classic").trim();
  if (skin === "classic") return "classic";

  try {
    const owned = JSON.parse(localStorage.getItem(OWNED_DICE_SKINS_KEY) || "[]");
    if (!Array.isArray(owned)) return "classic";
    return owned.includes(skin) ? skin : "classic";
  } catch {
    return "classic";
  }
}

function getActiveSkinIndex() {
  const active = getActiveDiceSkin();
  if (active === "classic") return 1;
  const m = active.match(/^skin(\d+)$/);
  if (!m) return 1;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 20) return 1;
  return n;
}

function getDiceSkinFaces(skinKey) {
  if (skinKey === "classic") {
    return diceSkins.classic;
  }
  // cube face order must match existing classic face mapping
  return [
    `dice/skins/${skinKey}/1_result.webp`,
    `dice/skins/${skinKey}/4_result.webp`,
    `dice/skins/${skinKey}/6_result.webp`,
    `dice/skins/${skinKey}/3_result.webp`,
    `dice/skins/${skinKey}/2_result.webp`,
    `dice/skins/${skinKey}/5_result.webp`
  ];
}

const activeSkinIndex = getActiveSkinIndex();
const activeSkinEffects = SKIN_EFFECTS[activeSkinIndex] || SKIN_EFFECTS[1];
const matchEffectState = {
  shieldUsed: false,
  plusOneUsed: false,
  replayUsed: false,
  replayPending: false,
  guaranteedSixUsed: false,
  doubleMoveUsed: false,
  homesCount: 0,
  capturedTokenPendingReentry: null,
  reentryTurnsLeft: 0,
  nextRollBoost: 0,
  totalRolls: 0,
  guaranteedAfterTenUsed: false
};

function getActiveTokenSkin() {
  const skin = (localStorage.getItem(ACTIVE_TOKEN_SKIN_KEY) || "classic").trim();
  if (skin === "classic") return "classic";
  try {
    const owned = JSON.parse(localStorage.getItem(OWNED_TOKEN_SKINS_KEY) || "[]");
    if (!Array.isArray(owned)) return "classic";
    return owned.includes(skin) ? skin : "classic";
  } catch {
    return "classic";
  }
}

function getTokenImageSrc(color) {
  const skin = getActiveTokenSkin();
  if (skin === "classic") return `tokens/${color}_result.webp`;
  return `tokens/skins/${skin}/${color}_result.webp`;
}

const state = {
  currentPlayer: 0,
  diceValue: null,
  players: activeColors.map(color => ({
    color,
    tokens: [-1, -1, -1, -1],
    finished: [false, false, false, false],
    shields: [0, 0, 0, 0],
    riskVulnerable: [0, 0, 0, 0],
    isAI: matchMode === "vs-computer" ? color !== humanColor : false,
    sixStreak: 0,
    battleStreak: 0,
    battleCapturedThisTurn: false
  }))
};
let pendingBonusTurn = false;
let activeRollMultiplier = 1;
let arenaTurns = 0;
let arenaNextEventAt = 3 + Math.floor(Math.random() * 3);
let arenaDoubleRollColor = null;
let chaosRewardTile = null;
let chaosRenderRaf = null;
let powerTileState = {
  speed: [],
  shield: [],
  teleport: []
};
let battleTileState = {
  risk: [],
  block: []
};
const battleActiveBlocks = new Map();
let arenaTileState = {
  reward: []
};
let isPaused = false;
let bgmWasPlayingBeforePause = false;

function saveResumeSnapshot() {
  const players = state.players.map(player => {
    const tokens = player.tokens.map((pos, tokenIndex) => {
      const tokenEl = tokenEls[player.color]?.[tokenIndex];
      return {
        pos,
        finished: Boolean(player.finished[tokenIndex]),
        path: tokenEl?.dataset?.path || "common"
      };
    });
    return {
      color: player.color,
      isAI: Boolean(player.isAI),
      sixStreak: Number(player.sixStreak || 0),
      shields: Array.isArray(player.shields) ? player.shields.slice(0, 4) : [0, 0, 0, 0],
      riskVulnerable: Array.isArray(player.riskVulnerable) ? player.riskVulnerable.slice(0, 4) : [0, 0, 0, 0],
      battleStreak: Number(player.battleStreak || 0),
      tokens
    };
  });

  const payload = {
    matchMode,
    ruleMode: gameMode,
    gameMode,
    playerCount,
    humanColor,
    currentLevel,
    currentPlayer: state.currentPlayer,
    players,
    returnUrl: window.location.href,
    savedAt: Date.now()
  };

  localStorage.setItem(LUDO_RESUME_KEY, JSON.stringify(payload));
}

function placeTokenByState(color, tokenIndex, tokenState) {
  const token = tokenEls[color]?.[tokenIndex];
  if (!token || !tokenState) return;

  const path = tokenState.path || "common";
  const pos = Number(tokenState.pos);

  if (path === "goal" || pos === -2) {
    goalEls[color].appendChild(token);
    token.dataset.path = "goal";
    return;
  }

  if (pos === -1) {
    const homeEl = HOME_SLOTS[color][tokenIndex]?.el || HOME_SLOTS[color][0].el;
    homeEl.appendChild(token);
    token.dataset.path = "common";
    return;
  }

  if (path === "common" && PATHS.common[pos]) {
    PATHS.common[pos].el.appendChild(token);
    token.dataset.path = "common";
    return;
  }

  if (PATHS[path] && PATHS[path][pos]) {
    PATHS[path][pos].el.appendChild(token);
    token.dataset.path = path;
    return;
  }

  const fallbackHome = HOME_SLOTS[color][tokenIndex]?.el || HOME_SLOTS[color][0].el;
  fallbackHome.appendChild(token);
  token.dataset.path = "common";
}

function maybeRestoreSavedGame() {
  let parsed = null;
  try {
    const raw = localStorage.getItem(LUDO_RESUME_KEY);
    if (!raw) return;
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!parsed || typeof parsed !== "object") return;
  const savedRuleMode = Object.prototype.hasOwnProperty.call(MODES, parsed.ruleMode)
    ? parsed.ruleMode
    : (Object.prototype.hasOwnProperty.call(MODES, parsed.gameMode) ? parsed.gameMode : "classic");
  if (
    (parsed.matchMode || parsed.gameMode) !== matchMode ||
    savedRuleMode !== gameMode ||
    Number(parsed.playerCount) !== playerCount ||
    parsed.humanColor !== humanColor ||
    Number(parsed.currentLevel) !== currentLevel
  ) {
    return;
  }

  if (!Array.isArray(parsed.players)) return;

  state.players.forEach((player, playerIndex) => {
    const savedPlayer = parsed.players.find(p => p && p.color === player.color) || parsed.players[playerIndex];
    if (!savedPlayer || !Array.isArray(savedPlayer.tokens)) return;

    player.sixStreak = Number(savedPlayer.sixStreak || 0);
    player.shields = Array.isArray(savedPlayer.shields)
      ? savedPlayer.shields.map(v => Math.max(0, Number(v) || 0)).slice(0, 4)
      : [0, 0, 0, 0];
    while (player.shields.length < 4) player.shields.push(0);
    player.riskVulnerable = Array.isArray(savedPlayer.riskVulnerable)
      ? savedPlayer.riskVulnerable.map(v => Math.max(0, Number(v) || 0)).slice(0, 4)
      : [0, 0, 0, 0];
    while (player.riskVulnerable.length < 4) player.riskVulnerable.push(0);
    player.battleStreak = Math.max(0, Number(savedPlayer.battleStreak || 0));
    player.battleCapturedThisTurn = false;

    savedPlayer.tokens.forEach((tokenState, tokenIndex) => {
      if (!tokenState) return;
      const safePos = Number(tokenState.pos);
      player.tokens[tokenIndex] = Number.isFinite(safePos) ? safePos : -1;
      player.finished[tokenIndex] = Boolean(tokenState.finished);
      placeTokenByState(player.color, tokenIndex, tokenState);
    });
  });

  const savedCurrent = Number(parsed.currentPlayer);
  if (Number.isInteger(savedCurrent) && savedCurrent >= 0 && savedCurrent < state.players.length) {
    state.currentPlayer = savedCurrent;
  }

  state.diceValue = null;
  gameOver = false;
  isMoving = false;
  hasRolledThisTurn = false;
  waitingForTokenMove = false;
  clearHighlights();
  activeRollMultiplier = 1;
  arenaTurns = 0;
  arenaNextEventAt = 3 + Math.floor(Math.random() * 3);
  arenaDoubleRollColor = null;
  refreshNearWinEffects();
}

document.body.classList.add(`orient-${humanColor}`);
document.body.classList.add(`mode-${gameMode}`);
localStorage.setItem("ludo_game_mode", gameMode);

const DICE_SLOTS = ["top-left", "top-right", "bottom-right", "bottom-left"];
ALL_COLORS_CLOCKWISE.forEach((_, offset) => {
  const color = ALL_COLORS_CLOCKWISE[(humanIndexInCycle + offset) % ALL_COLORS_CLOCKWISE.length];
  const panel = dicePanelsByColor[color];
  if (!panel) return;
  panel.classList.remove("top-left", "top-right", "bottom-right", "bottom-left");
  panel.classList.add(DICE_SLOTS[offset]);
});

ALL_COLORS_CLOCKWISE.forEach(color => {
  if (activeColors.includes(color)) return;

  const homeEl = document.querySelector(`.home.${color}`);
  if (homeEl) homeEl.classList.add("disabled-home");

  const diceEl = diceEls[color];
  if (diceEl) {
    const panel = diceEl.closest(".dice-panel");
    if (panel) panel.classList.add("inactive");
  }

  const goalEl = goalEls[color];
  if (goalEl) goalEl.classList.add("inactive");
});

state.players.forEach(player => {
  tokenEls[player.color] = [];

  for (let i = 0; i < 4; i++) {
    const token = document.createElement("div");
    token.className = `token ${player.color}`;
    token.dataset.color = player.color;

    const img = document.createElement("img");
    img.src = getTokenImageSrc(player.color);
    img.onerror = () => {
      img.src = `tokens/${player.color}_result.webp`;
    };
    img.draggable = false;
    token.appendChild(img);

    HOME_SLOTS[player.color][i].el.appendChild(token);
    tokenEls[player.color].push(token);

    token.addEventListener("click", () => {
      if (gameOver) return;
      if (isPaused) return;
      const activePlayer = state.players[state.currentPlayer];
      if (!activePlayer) return;
      if (activePlayer.isAI) return;
      if (player.color !== activePlayer.color) return;
      if (state.diceValue === null) return;
      if (!waitingForTokenMove) return;
      if (!canTokenMove(state.currentPlayer, i, getCurrentMoveSteps(state.currentPlayer))) return;

      if (state.diceValue === 6 && !token.classList.contains("selectable-gold")) return;
      if (state.diceValue !== 6 && !token.classList.contains("selectable-black")) return;

      clearHighlights();
      triggerFeedback(token, "token-selected", 240);
      executeMove({ playerIndex: state.currentPlayer, tokenIndex: i }).catch(() => {
        isMoving = false;
        nextTurn(false);
      });
    });
  }
});

function loadDiceSkin(skin) {
  const resolvedFacesHuman = getDiceSkinFaces(skin);
  const resolvedFacesClassic = getDiceSkinFaces("classic");
  Object.keys(diceFaces).forEach(color => {
    const faces = color === humanColor ? resolvedFacesHuman : resolvedFacesClassic;
    faces.forEach((src, i) => {
      diceFaces[color][i].src = src;
      diceFaces[color][i].onerror = () => {
        diceFaces[color][i].src = diceSkins.classic[i];
      };
    });
  });
}

loadDiceSkin(getActiveDiceSkin());
setupTileGlowSeeds();
setupSparkParticles();
setupBackgroundSlideshow();
setupSoundBootstrap();
setupChaosMode();
setupPowerMode();
setupBattleMode();
setupArenaMode();
window.addEventListener("resize", scheduleChaosOverlayRender);
window.addEventListener("orientationchange", scheduleChaosOverlayRender);

if (pauseBtnEl) {
  pauseBtnEl.addEventListener("click", () => {
    togglePause();
  });
}
pauseResumeBtnEl?.addEventListener("click", () => {
  setPaused(false);
});
pauseExitBtnEl?.addEventListener("click", () => {
  exitPausedMatch();
});
window.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (gameOver) return;
  togglePause();
});

if (restartBtnEl) {
  restartBtnEl.addEventListener("click", () => {
    setPaused(false);
    clearResumeSnapshot();
    window.location.reload();
  });
}

if (backLevelsBtnEl) {
  backLevelsBtnEl.addEventListener("click", () => {
    setPaused(false);
    saveResumeSnapshot();
    if (matchMode === "pass-play") {
      const query = new URLSearchParams({ mode: "pass-play", gm: gameMode });
      window.location.href = `vs-computer.html?${query.toString()}`;
      return;
    }
    const query = new URLSearchParams({
      mode: matchMode,
      players: String(playerCount),
      human: humanColor,
      gm: gameMode
    });
    window.location.href = `level-select.html?${query.toString()}`;
  });
}

if (btnPlayAgainEl) {
  btnPlayAgainEl.addEventListener("click", () => {
    setPaused(false);
    clearResumeSnapshot();
    window.location.reload();
  });
}

if (btnCancelEl) {
  btnCancelEl.addEventListener("click", () => {
    setPaused(false);
    saveResumeSnapshot();
    const query = new URLSearchParams({ gm: gameMode });
    window.location.href = `index.html?${query.toString()}`;
  });
}

if (btnNextLevelEl) {
  btnNextLevelEl.addEventListener("click", () => {
    setPaused(false);
    clearResumeSnapshot();
    const query = new URLSearchParams({
      mode: "vs-computer",
      players: String(playerCount),
      human: humanColor,
      gm: gameMode,
      level: String(currentLevel + 1)
    });
    window.location.href = `ludo.html?${query.toString()}`;
  });
}

function clearHighlights() {
  Object.values(tokenEls).flat().forEach(t => {
    t.classList.remove("selectable-gold");
    t.classList.remove("selectable-black");
  });
}

// Gameplay feedback is deliberately presentation-only: every effect is a
// short-lived CSS class and does not participate in turn or movement state.
function triggerFeedback(el, className, duration = 320) {
  if (!el) return;
  const key = `feedback${className.replace(/[^a-z0-9]/gi, "")}`;
  const id = Number(el.dataset[key] || 0) + 1;
  el.dataset[key] = String(id);
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => {
    if (el.dataset[key] === String(id)) el.classList.remove(className);
  }, duration);
}

function announceTurn(player) {
  if (!player || gameOver) return;
  const panel = dicePanelsByColor[player.color];
  triggerFeedback(panel, player.isAI ? "ai-turn-start" : "human-turn-start", 520);
  showToast(player.isAI ? `${player.color.toUpperCase()} AI TURN` : "YOUR TURN");
}

function isHumanVsComputerTurn(color) {
  return matchMode === "vs-computer" && color === humanColor;
}

function consumeBonusTurn(baseTurn) {
  if (pendingBonusTurn) {
    pendingBonusTurn = false;
    return true;
  }
  return baseTurn;
}

function computeRollValue(color) {
  activeRollMultiplier = 1;
  let value = Math.ceil(Math.random() * 6);
  if (isHumanVsComputerTurn(color)) {

    matchEffectState.totalRolls += 1;

  if (activeSkinEffects.guaranteedSixOnce && !matchEffectState.guaranteedSixUsed) {
    value = 6;
    matchEffectState.guaranteedSixUsed = true;
  }

  if (
    activeSkinEffects.guaranteedSixAfterTenRolls &&
    matchEffectState.totalRolls >= 10 &&
    !matchEffectState.guaranteedAfterTenUsed
  ) {
    value = 6;
    matchEffectState.guaranteedAfterTenUsed = true;
  }

  if (activeSkinEffects.plusSixChance && value !== 6 && Math.random() < activeSkinEffects.plusSixChance) {
    value = 6;
  }

  if (activeSkinEffects.lessOneChance && value === 1 && Math.random() < activeSkinEffects.lessOneChance) {
    value = 2 + Math.floor(Math.random() * 5);
  }

  if (activeSkinEffects.highRollBoost && Math.random() < activeSkinEffects.highRollBoost) {
    value = Math.random() < 0.5 ? 5 : 6;
  }

  if (matchEffectState.nextRollBoost > 0) {
    value = Math.min(6, value + matchEffectState.nextRollBoost);
    matchEffectState.nextRollBoost = 0;
  }

  if (activeSkinEffects.plusOneRollOnce && !matchEffectState.plusOneUsed && value < 6) {
    value += 1;
    matchEffectState.plusOneUsed = true;
  }

  if (activeSkinEffects.replayLastRollOnce && !matchEffectState.replayUsed) {
    pendingBonusTurn = true;
    matchEffectState.replayUsed = true;
  }

  if (activeSkinEffects.repeatRollChance && Math.random() < activeSkinEffects.repeatRollChance) {
    pendingBonusTurn = true;
  }

    if (matchEffectState.capturedTokenPendingReentry !== null && matchEffectState.reentryTurnsLeft > 0) {
      if (value === 6) {
        const tokenIndex = matchEffectState.capturedTokenPendingReentry;
        const human = state.players.find(p => p.color === humanColor);
        if (human && human.tokens[tokenIndex] === -1) {
          const token = tokenEls[humanColor][tokenIndex];
          const entryCell = ENTRY_CELLS[humanColor];
          entryCell.appendChild(token);
          token.style.position = "";
          token.style.transform = "";
          token.dataset.path = "common";
          human.tokens[tokenIndex] = PATHS.common.findIndex(p => p.el === entryCell);
          human.finished[tokenIndex] = false;
        }
        matchEffectState.capturedTokenPendingReentry = null;
        matchEffectState.reentryTurnsLeft = 0;
      } else {
        matchEffectState.reentryTurnsLeft -= 1;
        if (matchEffectState.reentryTurnsLeft <= 0) {
          matchEffectState.capturedTokenPendingReentry = null;
        }
      }
    }
  }

  if (gameMode === "arena" && arenaDoubleRollColor === color) {
    activeRollMultiplier = 2;
    arenaDoubleRollColor = null;
    showToast("Arena Surge x2");
  }

  return value;
}

function canTokenMove(playerIndex, tokenIndex, dice, rawDice = state.diceValue) {
  const player = state.players[playerIndex];
  const color = player.color;
  const pos = player.tokens[tokenIndex];
  const token = tokenEls[color][tokenIndex];
  const pathKey = token.dataset.path || "common";

  if (dice === null) return false;
  if (player.finished[tokenIndex]) return false;
  if (pathKey === "goal") return false;
  if (pos === -1) {
    if (rawDice !== 6) return false;
    const entryIndex = ENTRY_INDEX_BY_COLOR[color];
    return !isBlockedByEnemyBlockade(entryIndex, color) && !isBlockedByBattleTile(entryIndex, color);
  }

  if (pathKey !== "common") {
    const path = PATHS[pathKey];
    if (!path) return false;
    const remainingToGoal = path.length - pos;
    return dice <= remainingToGoal;
  }
  return canMoveOnCommonPath(playerIndex, tokenIndex, dice);
}

function getValidMovesForPlayer(playerIndex, dice) {
  const player = state.players[playerIndex];
  const moves = [];

  player.tokens.forEach((_, tokenIndex) => {
    if (canTokenMove(playerIndex, tokenIndex, dice)) {
      moves.push({ playerIndex, tokenIndex });
    }
  });
  return moves;
}

function simulateLanding(playerIndex, tokenIndex, dice) {
  const player = state.players[playerIndex];
  const color = player.color;
  const pos = player.tokens[tokenIndex];
  const token = tokenEls[color][tokenIndex];
  const pathKey = token.dataset.path || "common";

  if (pos === -1) {
    if (dice !== 6) return null;
    return { pathKey: "common", index: ENTRY_INDEX_BY_COLOR[color], goal: false };
  }

  if (pathKey !== "common") {
    const path = PATHS[pathKey];
    const landing = pos + dice;
    if (landing === path.length) {
      return { pathKey: "goal", index: -1, goal: true };
    }
    return { pathKey, index: landing, goal: false };
  }

  const turnIndex = TURN_INDEX_BY_COLOR[color];
  if (pos === turnIndex && dice === 6) {
    return { pathKey: "goal", index: -1, goal: true };
  }

  const homePathKey = HOME_PATH_KEY_BY_COLOR[color];
  const homePath = PATHS[homePathKey];
  const commonLen = PATHS.common.length;
  let commonPos = pos;
  let enteredHome = false;
  let homePos = -1;

  for (let step = 1; step <= dice; step++) {
    if (!enteredHome && commonPos === turnIndex) {
      enteredHome = true;
      homePos = 0;
      continue;
    }

    if (!enteredHome) {
      commonPos = (commonPos + 1) % commonLen;
      continue;
    }

    homePos += 1;
  }

  if (enteredHome) {
    if (homePos >= homePath.length) {
      return { pathKey: "goal", index: -1, goal: true };
    }
    return { pathKey: homePathKey, index: homePos, goal: false };
  }

  return { pathKey: "common", index: commonPos, goal: false };
}

function getCaptureAt(index, movingColor) {
  if (isBlockedByEnemyBlockade(index, movingColor)) return false;
  const cell = PATHS.common[index].el;
  const tokens = Array.from(cell.querySelectorAll(".token"));
  if (tokens.length <= 1) return false;
  return tokens.some(t => {
    if (!t.dataset.color || t.dataset.color === movingColor) return false;
    if (SAFE_INDICES.has(index) && !isTokenRiskVulnerable(t)) return false;
    return true;
  });
}

function pickAiMove(playerIndex, moves, dice) {
  if (moves.length <= 1) return moves[0] || null;

  if (aiDifficulty === 1) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const scored = moves.map(move => {
    const { tokenIndex } = move;
    const landing = simulateLanding(playerIndex, tokenIndex, dice);
    if (!landing) return { move, score: -999 };

    let score = 0;
    const player = state.players[playerIndex];
    const color = player.color;
    const pos = player.tokens[tokenIndex];

    if (landing.goal) score += 200;
    if (landing.pathKey === "common" && getCaptureAt(landing.index, color)) score += 120;
    if (pos === -1 && dice === 6) score += 60;
    if (landing.pathKey !== "common" && !landing.goal) score += 50;
    if (landing.pathKey === "common" && SAFE_INDICES.has(landing.index)) score += 10;

    score += dice;

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (aiDifficulty === 2) {
    return scored[0].move;
  }

  return scored[0].move;
}

function findTokenOwner(tokenEl) {
  const color = tokenEl.dataset.color || "";
  const playerIndex = state.players.findIndex(p => p.color === color);
  if (playerIndex === -1) return null;

  const tokenIndex = tokenEls[color].findIndex(t => t === tokenEl);
  if (tokenIndex === -1) return null;

  return { playerIndex, tokenIndex, color };
}

function getFreeHomeSlotEl(color) {
  for (const slot of HOME_SLOTS[color]) {
    if (!slot.el.querySelector(".token")) return slot.el;
  }
  return HOME_SLOTS[color][0].el;
}

function sendTokenHome(tokenEl, color, attackerColor = "") {
  const owner = findTokenOwner(tokenEl);
  if (!owner) return;
  const ownerPlayer = state.players[owner.playerIndex];
  const riskyTarget = ownerPlayer && Array.isArray(ownerPlayer.riskVulnerable)
    ? (Number(ownerPlayer.riskVulnerable[owner.tokenIndex]) || 0) > 0
    : false;
  if (ownerPlayer && !riskyTarget && (ownerPlayer.shields?.[owner.tokenIndex] || 0) > 0) {
    ownerPlayer.shields[owner.tokenIndex] = Math.max(0, ownerPlayer.shields[owner.tokenIndex] - 1);
    if (color === humanColor) showToast("Shield Blocked Capture");
    return;
  }

  if (
    matchMode === "vs-computer" &&
    color === humanColor &&
    activeSkinEffects.shieldOnce &&
    !matchEffectState.shieldUsed
  ) {
    matchEffectState.shieldUsed = true;
    return;
  }

  if (
    matchMode === "vs-computer" &&
    color === humanColor &&
    activeSkinEffects.reenterAfterCapture
  ) {
    if (Math.random() < 0.5) {
      matchEffectState.capturedTokenPendingReentry = owner.tokenIndex;
      matchEffectState.reentryTurnsLeft = 2;
    }
  }

  tokenEl.classList.add("capturing");
  triggerFeedback(tokenEl, "token-captured", 260);
  setTimeout(() => {
    const homeEl = getFreeHomeSlotEl(color);
    homeEl.appendChild(tokenEl);
    tokenEl.classList.remove("capturing");
  }, 120);

  const player = state.players[owner.playerIndex];
  player.tokens[owner.tokenIndex] = -1;
  player.finished[owner.tokenIndex] = false;
  if (Array.isArray(player.riskVulnerable)) {
    player.riskVulnerable[owner.tokenIndex] = 0;
  }
  tokenEl.dataset.path = "common";
  refreshRiskTokenVisuals();

  if (color === humanColor && attackerColor && attackerColor !== humanColor) {
    const line = pickReactionLine("unlucky");
    if (line) showToast(line);
  }
  refreshNearWinEffects();
}

function handleCaptureAt(index, movingToken) {
  if (isBlockedByEnemyBlockade(index, movingToken.dataset.color)) return 0;
  const cell = PATHS.common[index].el;
  const tokens = Array.from(cell.querySelectorAll(".token"));
  if (tokens.length <= 1) return 0;

  const movingColor = movingToken.dataset.color;
  let captures = 0;
  tokens.forEach(t => {
    if (t === movingToken) return;
    const color = t.dataset.color;
    if (SAFE_INDICES.has(index) && !isTokenRiskVulnerable(t)) return;
    if (color && color !== movingColor) {
      captures += 1;
      sendTokenHome(t, color, movingColor);
    }
  });
  if (captures > 0) triggerFeedback(movingToken, "token-capture-impact", 300);
  return captures;
}

function setActiveDieGlow(color) {
  Object.keys(diceEls).forEach(c => {
    const panel = diceEls[c].closest(".dice-panel");
    if (!panel) return;
    const isActiveColor = c === color;
    const canGlow =
      isActiveColor &&
      !isPaused &&
      !isMoving &&
      state.diceValue === null &&
      !hasRolledThisTurn &&
      !waitingForTokenMove;
    panel.classList.toggle("dice-active", canGlow);
  });
}

let toastTimer = null;
function showToast(message) {
  if (!toastLayerEl) return;
  toastLayerEl.textContent = message;
  toastLayerEl.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastLayerEl.classList.remove("show");
  }, 1700);
}

function resetDiceInteractivity() {
  const activePlayer = state.players[state.currentPlayer];
  if (!activePlayer) return;
  const activeColor = activePlayer.color;
  Object.keys(diceEls).forEach(color => {
    const die = diceEls[color];
    const panel = dicePanelsByColor[color];
    if (!die) return;
    const canRoll =
      color === activeColor &&
      !isPaused &&
      !isMoving &&
      state.diceValue === null &&
      !hasRolledThisTurn &&
      !waitingForTokenMove;
    die.style.pointerEvents = canRoll ? "auto" : "none";
    if (panel) {
      panel.style.pointerEvents = canRoll ? "auto" : "none";
      panel.classList.toggle("clickable", canRoll);
    }
  });
  setActiveDieGlow(activeColor);
}

function getBlockadeColorAt(index) {
  if (index < 0) return null;

  for (const player of state.players) {
    let count = 0;
    for (let tokenIndex = 0; tokenIndex < player.tokens.length; tokenIndex++) {
      const token = tokenEls[player.color][tokenIndex];
      if (!token) continue;
      if ((token.dataset.path || "common") !== "common") continue;
      if (player.tokens[tokenIndex] === index && !player.finished[tokenIndex]) {
        count += 1;
      }
    }
    if (count >= 2) return player.color;
  }

  return null;
}

function isBlockedByEnemyBlockade(index, movingColor) {
  const blockadeColor = getBlockadeColorAt(index);
  return !!blockadeColor && blockadeColor !== movingColor;
}

function countColorTokensOnCommonAt(index, color) {
  if (index < 0) return 0;
  const player = state.players.find(p => p.color === color);
  if (!player) return 0;

  let count = 0;
  for (let tokenIndex = 0; tokenIndex < player.tokens.length; tokenIndex++) {
    const token = tokenEls[color]?.[tokenIndex];
    if (!token) continue;
    if ((token.dataset.path || "common") !== "common") continue;
    if (player.tokens[tokenIndex] === index && !player.finished[tokenIndex]) {
      count += 1;
    }
  }
  return count;
}

function getModeConfig() {
  return MODES[gameMode] || MODES.classic;
}

function toCommonIndex(tileNumber) {
  const len = PATHS.common.length || 1;
  const normalized = ((Number(tileNumber) || 1) - 1) % len;
  return (normalized + len) % len;
}

function moveTokenToCommonIndex(playerIndex, tokenIndex, index, toast = "") {
  const player = state.players[playerIndex];
  if (!player) return false;
  const token = tokenEls[player.color]?.[tokenIndex];
  if (!token) return false;
  if (index < 0 || index >= PATHS.common.length) return false;
  if ((token.dataset.path || "common") !== "common") return false;
  if (player.tokens[tokenIndex] < 0) return false;

  PATHS.common[index].el.appendChild(token);
  token.dataset.path = "common";
  player.tokens[tokenIndex] = index;
  if (toast) showToast(toast);
  return true;
}

function createSvgNode(tagName, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tagName);
  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, String(value));
  });
  return node;
}

function getCommonPointForTile(tileNumber, stageRect) {
  const index = toCommonIndex(tileNumber);
  const cell = PATHS.common[index]?.el;
  if (!cell || !stageRect) return null;
  const rect = cell.getBoundingClientRect();
  return {
    x: rect.left - stageRect.left + rect.width / 2,
    y: rect.top - stageRect.top + rect.height / 2
  };
}

function clearChaosRewardTileMarker() {
  PATHS.common.forEach(node => {
    if (node?.el) node.el.classList.remove("chaos-reward-tile");
  });
}

function isChaosRewardCandidate(tileNumber) {
  const index = toCommonIndex(tileNumber);
  const cell = PATHS.common[index]?.el;
  if (!cell) return false;
  if (SAFE_INDICES.has(index)) return false;
  if (CHAOS_ENDPOINT_TILES.has(tileNumber)) return false;
  if (cell.classList.contains("safe-star")) return false;
  if (cell.classList.contains("red") || cell.classList.contains("green") || cell.classList.contains("yellow") || cell.classList.contains("blue")) {
    return false;
  }
  return true;
}

function pickChaosRewardTile() {
  const candidates = [];
  for (let tile = 1; tile <= PATHS.common.length; tile++) {
    if (isChaosRewardCandidate(tile)) candidates.push(tile);
  }
  if (candidates.length === 0) {
    chaosRewardTile = null;
    return null;
  }
  chaosRewardTile = candidates[Math.floor(Math.random() * candidates.length)];
  return chaosRewardTile;
}

function applyChaosRewardTileMarker() {
  clearChaosRewardTileMarker();
  if (chaosRewardTile === null) return;
  const index = toCommonIndex(chaosRewardTile);
  const rewardCell = PATHS.common[index]?.el;
  if (!rewardCell) return;
  rewardCell.classList.add("chaos-reward-tile");
}

function buildPolylinePath(points) {
  if (!Array.isArray(points) || points.length === 0) return "";
  return points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function drawChaosLadder(overlay, startPoint, endPoint, side = "left") {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || len < 2) return;

  const sideBias = side === "left" ? -1 : 1;
  const px = -dy / len;
  const py = dx / len;
  const railGap = Math.max(6, Math.min(12, len / 5));
  const rungCount = Math.max(3, Math.min(8, Math.round(len / 30)));

  const railAStart = { x: startPoint.x + px * railGap, y: startPoint.y + py * railGap };
  const railAEnd = { x: endPoint.x + px * railGap, y: endPoint.y + py * railGap };
  const railBStart = { x: startPoint.x - px * railGap, y: startPoint.y - py * railGap };
  const railBEnd = { x: endPoint.x - px * railGap, y: endPoint.y - py * railGap };

  overlay.appendChild(createSvgNode("line", {
    class: "chaos-ladder-rail",
    x1: railAStart.x.toFixed(2),
    y1: railAStart.y.toFixed(2),
    x2: railAEnd.x.toFixed(2),
    y2: railAEnd.y.toFixed(2)
  }));
  overlay.appendChild(createSvgNode("line", {
    class: "chaos-ladder-rail",
    x1: railBStart.x.toFixed(2),
    y1: railBStart.y.toFixed(2),
    x2: railBEnd.x.toFixed(2),
    y2: railBEnd.y.toFixed(2)
  }));

  for (let i = 1; i <= rungCount; i++) {
    const t = i / (rungCount + 1);
    const shift = sideBias * (i % 2 === 0 ? 0.9 : -0.9);
    const ax = railAStart.x + (railAEnd.x - railAStart.x) * t;
    const ay = railAStart.y + (railAEnd.y - railAStart.y) * t;
    const bx = railBStart.x + (railBEnd.x - railBStart.x) * t;
    const by = railBStart.y + (railBEnd.y - railBStart.y) * t;
    overlay.appendChild(createSvgNode("line", {
      class: "chaos-ladder-rung",
      x1: (ax + shift).toFixed(2),
      y1: (ay + shift).toFixed(2),
      x2: (bx + shift).toFixed(2),
      y2: (by + shift).toFixed(2)
    }));
  }
}

function drawChaosSnake(overlay, mouthPoint, tailPoint, side) {
  const dx = tailPoint.x - mouthPoint.x;
  const dy = tailPoint.y - mouthPoint.y;
  const len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || len < 2) return;

  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const sideBias = side === "top" ? -1 : 1;
  const waveCount = 4;
  const segments = 24;
  const amplitude = Math.max(4, Math.min(10, len / 10));

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseX = mouthPoint.x + dx * t;
    const baseY = mouthPoint.y + dy * t;
    const envelope = Math.sin(Math.PI * t);
    const wiggle = Math.sin(t * Math.PI * waveCount * 2) * amplitude * envelope * sideBias;
    points.push({
      x: baseX + px * wiggle,
      y: baseY + py * wiggle
    });
  }

  const pathD = buildPolylinePath(points);
  if (!pathD) return;
  overlay.appendChild(createSvgNode("path", {
    class: "chaos-snake-body",
    d: pathD
  }));
  overlay.appendChild(createSvgNode("path", {
    class: "chaos-snake-highlight",
    d: pathD
  }));

  const eyeForward = 3.2;
  const eyeSide = 3.4;
  const eyeCenterX = mouthPoint.x + ux * eyeForward;
  const eyeCenterY = mouthPoint.y + uy * eyeForward;

  overlay.appendChild(createSvgNode("circle", {
    class: "chaos-snake-head",
    "data-side": side,
    cx: mouthPoint.x.toFixed(2),
    cy: mouthPoint.y.toFixed(2),
    r: "8.4"
  }));
  overlay.appendChild(createSvgNode("circle", {
    class: "chaos-snake-eye",
    cx: (eyeCenterX + px * eyeSide).toFixed(2),
    cy: (eyeCenterY + py * eyeSide).toFixed(2),
    r: "1.8"
  }));
  overlay.appendChild(createSvgNode("circle", {
    class: "chaos-snake-eye",
    cx: (eyeCenterX - px * eyeSide).toFixed(2),
    cy: (eyeCenterY - py * eyeSide).toFixed(2),
    r: "1.8"
  }));
  overlay.appendChild(createSvgNode("circle", {
    class: "chaos-snake-tail",
    cx: tailPoint.x.toFixed(2),
    cy: tailPoint.y.toFixed(2),
    r: "5.4"
  }));
}

function renderChaosOverlay() {
  if (!chaosOverlayEl || !stageEl) return;

  const isChaosMode = gameMode === "chaos";
  chaosOverlayEl.classList.toggle("active", isChaosMode);
  if (!isChaosMode) {
    chaosOverlayEl.replaceChildren();
    clearChaosRewardTileMarker();
    return;
  }

  if (chaosRewardTile === null) pickChaosRewardTile();
  applyChaosRewardTileMarker();

  const stageRect = stageEl.getBoundingClientRect();
  if (stageRect.width <= 0 || stageRect.height <= 0) return;

  chaosOverlayEl.setAttribute("width", stageRect.width.toFixed(2));
  chaosOverlayEl.setAttribute("height", stageRect.height.toFixed(2));
  chaosOverlayEl.setAttribute("viewBox", `0 0 ${stageRect.width.toFixed(2)} ${stageRect.height.toFixed(2)}`);
  chaosOverlayEl.replaceChildren();

  CHAOS_LADDER_PAIRS.forEach(pair => {
    const startPoint = getCommonPointForTile(pair.start, stageRect);
    const endPoint = getCommonPointForTile(pair.end, stageRect);
    if (!startPoint || !endPoint) return;
    drawChaosLadder(chaosOverlayEl, startPoint, endPoint, pair.side);
  });

  CHAOS_SNAKE_PAIRS.forEach(pair => {
    const mouthPoint = getCommonPointForTile(pair.mouth, stageRect);
    const tailPoint = getCommonPointForTile(pair.tail, stageRect);
    if (!mouthPoint || !tailPoint) return;
    drawChaosSnake(chaosOverlayEl, mouthPoint, tailPoint, pair.side);
  });
}

function scheduleChaosOverlayRender() {
  if (chaosRenderRaf !== null) return;
  chaosRenderRaf = requestAnimationFrame(() => {
    chaosRenderRaf = null;
    renderChaosOverlay();
  });
}

function setupChaosMode() {
  if (gameMode !== "chaos") {
    chaosRewardTile = null;
    renderChaosOverlay();
    return;
  }
  if (chaosRewardTile === null) pickChaosRewardTile();
  applyChaosRewardTileMarker();
  scheduleChaosOverlayRender();
}

async function wait(ms) {
  let remaining = Math.max(0, Number(ms) || 0);
  while (remaining > 0) {
    if (isPaused) {
      await new Promise(resolve => setTimeout(resolve, 70));
      continue;
    }
    const slice = Math.min(remaining, 70);
    await new Promise(resolve => setTimeout(resolve, slice));
    remaining -= slice;
  }
}

function animateWithFallback(el, keyframes, options = {}) {
  const duration = Math.max(0, Number(options.duration) || 0);
  return new Promise(resolve => {
    if (!el || typeof el.animate !== "function") {
      setTimeout(resolve, duration);
      return;
    }
    const animation = el.animate(keyframes, options);
    let finished = false;
    let elapsed = 0;
    let tickerId = null;
    const done = () => {
      if (finished) return;
      finished = true;
      if (tickerId !== null) {
        clearInterval(tickerId);
        tickerId = null;
      }
      resolve();
    };
    const syncPauseState = () => {
      if (finished) return;
      if (isPaused && animation.playState === "running") {
        animation.pause();
      } else if (!isPaused && animation.playState === "paused") {
        animation.play();
      }
    };
    tickerId = setInterval(() => {
      syncPauseState();
      if (isPaused) return;
      elapsed += 50;
      if (duration > 0 && elapsed >= duration + 140) {
        done();
      }
    }, 50);
    syncPauseState();
    animation.addEventListener("finish", done, { once: true });
    animation.addEventListener("cancel", done, { once: true });
    if (duration <= 0) setTimeout(done, 120);
  });
}

function createTransitTrail(fromPoint, toPoint, type = "ladder") {
  if (!fromPoint || !toPoint) return;
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 8) return;

  const trail = document.createElement("span");
  trail.className = `event-transit-trail ${type === "snake" ? "snake" : "ladder"}`;
  trail.style.setProperty("--trail-x", `${fromPoint.x}px`);
  trail.style.setProperty("--trail-y", `${fromPoint.y}px`);
  trail.style.setProperty("--trail-angle", `${Math.atan2(dy, dx) * (180 / Math.PI)}deg`);
  trail.style.setProperty("--trail-len", `${length}px`);
  document.body.appendChild(trail);
  trail.addEventListener("animationend", () => trail.remove(), { once: true });
}

function createImpactPulse(point, type = "ladder") {
  if (!point) return;
  const pulse = document.createElement("span");
  const pulseType = type === "snake" || type === "battle" ? type : "ladder";
  pulse.className = `event-impact-pulse ${pulseType}`;
  pulse.style.left = `${point.x}px`;
  pulse.style.top = `${point.y}px`;
  document.body.appendChild(pulse);
  pulse.addEventListener("animationend", () => pulse.remove(), { once: true });
}

function createTokenGhost(token, sourcePoint = null) {
  if (!token) return null;
  const rect = token.getBoundingClientRect();
  const fallbackPoint = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
  const point = sourcePoint || fallbackPoint;
  if (!point) return null;

  const ghost = token.cloneNode(true);
  ghost.classList.add("event-token-ghost");
  ghost.classList.remove("selectable-black", "selectable-gold", "near-win-heartbeat", "event-hidden");
  ghost.style.width = `${Math.max(22, rect.width)}px`;
  ghost.style.height = `${Math.max(22, rect.height)}px`;
  ghost.style.left = `${point.x - Math.max(22, rect.width) / 2}px`;
  ghost.style.top = `${point.y - Math.max(22, rect.height) / 2}px`;
  document.body.appendChild(ghost);
  return ghost;
}

function triggerSnakeHeadChomp(side) {
  if (!chaosOverlayEl) return;
  const head = chaosOverlayEl.querySelector(`.chaos-snake-head[data-side="${side}"]`);
  if (!head) return;
  head.classList.remove("is-chomp");
  // Restart animation so repeated hits always play.
  void head.getBoundingClientRect();
  head.classList.add("is-chomp");
  setTimeout(() => {
    head.classList.remove("is-chomp");
  }, 520);
}

async function animateLadderTransfer(playerIndex, tokenIndex, fromIndex, toIndex, side = "left") {
  const player = state.players[playerIndex];
  if (!player) return;
  const token = tokenEls[player.color]?.[tokenIndex];
  if (!token) return;

  const fromPoint = getElementCenter(PATHS.common[fromIndex]?.el);
  const toPoint = getElementCenter(PATHS.common[toIndex]?.el);
  if (!fromPoint || !toPoint) return;

  token.classList.add("event-hidden");
  const ghost = createTokenGhost(token, fromPoint);
  if (!ghost) {
    token.classList.remove("event-hidden");
    return;
  }

  createTransitTrail(fromPoint, toPoint, "ladder");

  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const arcY = Math.max(26, Math.min(70, Math.abs(dx) * 0.22 + 20));
  const arcX = side === "left" ? -16 : 16;

  await animateWithFallback(ghost, [
    { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
    { transform: `translate3d(${dx * 0.55 + arcX}px, ${dy * 0.42 - arcY}px, 0) scale(1.12) rotate(${side === "left" ? -8 : 8}deg)`, opacity: 1, offset: 0.56 },
    { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.98) rotate(${side === "left" ? -4 : 4}deg)`, opacity: 0.96, offset: 1 }
  ], {
    duration: 460,
    easing: "cubic-bezier(.16,.86,.2,1)",
    fill: "forwards"
  });

  ghost.remove();
  token.classList.remove("event-hidden");
  createImpactPulse(toPoint, "ladder");
}

async function animateSnakeTransfer(playerIndex, tokenIndex, fromIndex, toIndex, side = "top") {
  const player = state.players[playerIndex];
  if (!player) return;
  const token = tokenEls[player.color]?.[tokenIndex];
  if (!token) return;

  const fromPoint = getElementCenter(PATHS.common[fromIndex]?.el);
  const toPoint = getElementCenter(PATHS.common[toIndex]?.el);
  if (!fromPoint || !toPoint) return;

  triggerSnakeHeadChomp(side);
  token.classList.add("event-hidden");
  const ghost = createTokenGhost(token, fromPoint);
  if (!ghost) {
    token.classList.remove("event-hidden");
    return;
  }

  createTransitTrail(fromPoint, toPoint, "snake");

  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const sideBias = side === "top" ? -1 : 1;
  const bendX = sideBias * 22;
  const bendY = sideBias * 14;

  await animateWithFallback(ghost, [
    { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
    { transform: "translate3d(-5px, -2px, 0) scale(1.04) rotate(-10deg)", opacity: 1, offset: 0.14 },
    { transform: "translate3d(5px, 1px, 0) scale(0.8) rotate(8deg)", opacity: 0.96, offset: 0.27 },
    { transform: `translate3d(${dx * 0.52 + bendX}px, ${dy * 0.46 + bendY}px, 0) scale(0.72) rotate(${sideBias * 16}deg)`, opacity: 0.94, offset: 0.58 },
    { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.98) rotate(0deg)`, opacity: 0.96, offset: 1 }
  ], {
    duration: 560,
    easing: "cubic-bezier(.22,.74,.2,1)",
    fill: "forwards"
  });

  ghost.remove();
  token.classList.remove("event-hidden");
  createImpactPulse(toPoint, "snake");
}

function clearPowerTileMarkers() {
  PATHS.common.forEach(node => {
    const cell = node?.el;
    if (!cell) return;
    cell.classList.remove("power-tile", "power-speed", "power-shield", "power-teleport");
    delete cell.dataset.powerType;
  });
}

function isPowerTileCandidate(tileNumber, blocked = new Set()) {
  const index = toCommonIndex(tileNumber);
  const cell = PATHS.common[index]?.el;
  if (!cell) return false;
  if (blocked.has(tileNumber)) return false;
  if (SAFE_INDICES.has(index)) return false;
  if (CHAOS_ENDPOINT_TILES.has(tileNumber)) return false;
  if (cell.classList.contains("safe-star")) return false;
  if (cell.classList.contains("red-home-turn") || cell.classList.contains("green-home-turn") || cell.classList.contains("yellow-home-turn") || cell.classList.contains("blue-home-turn")) {
    return false;
  }
  if (cell.classList.contains("red") || cell.classList.contains("green") || cell.classList.contains("yellow") || cell.classList.contains("blue")) {
    return false;
  }
  return true;
}

function pickRandomPowerTile(blocked = new Set()) {
  const candidates = [];
  for (let tile = 1; tile <= PATHS.common.length; tile++) {
    if (isPowerTileCandidate(tile, blocked)) candidates.push(tile);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function randomizePowerTiles() {
  const used = new Set();
  const speed = [];
  const shield = [];
  const teleport = [];

  for (let i = 0; i < POWER_TILE_COUNTS.speed; i++) {
    const tile = pickRandomPowerTile(used);
    if (tile === null) break;
    speed.push(tile);
    used.add(tile);
  }
  for (let i = 0; i < POWER_TILE_COUNTS.shield; i++) {
    const tile = pickRandomPowerTile(used);
    if (tile === null) break;
    shield.push(tile);
    used.add(tile);
  }
  for (let i = 0; i < POWER_TILE_COUNTS.teleport; i++) {
    const tile = pickRandomPowerTile(used);
    if (tile === null) break;
    teleport.push(tile);
    used.add(tile);
  }

  powerTileState = {
    speed,
    shield,
    teleport
  };
}

function getActivePowerTiles() {
  const speed = powerTileState.speed.length > 0 ? powerTileState.speed : SPEED_TILES;
  const shield = powerTileState.shield.length > 0 ? powerTileState.shield : SHIELD_TILES;
  const teleport = powerTileState.teleport.length > 0 ? powerTileState.teleport : TELEPORT_TILES;
  return { speed, shield, teleport };
}

function pickRandomTeleportDestination(currentTile) {
  const blocked = new Set([currentTile]);
  const activePowerTiles = getActivePowerTiles();
  activePowerTiles.speed.forEach(tile => blocked.add(tile));
  activePowerTiles.shield.forEach(tile => blocked.add(tile));
  activePowerTiles.teleport.forEach(tile => blocked.add(tile));
  return pickRandomPowerTile(blocked);
}

function applyPowerTileMarkers() {
  clearPowerTileMarkers();
  if (gameMode !== "power") return;
  const activePowerTiles = getActivePowerTiles();

  activePowerTiles.speed.forEach(tile => {
    const cell = PATHS.common[toCommonIndex(tile)]?.el;
    if (!cell) return;
    cell.classList.add("power-tile", "power-speed");
    cell.dataset.powerType = "speed";
  });
  activePowerTiles.shield.forEach(tile => {
    const cell = PATHS.common[toCommonIndex(tile)]?.el;
    if (!cell) return;
    cell.classList.add("power-tile", "power-shield");
    cell.dataset.powerType = "shield";
  });
  activePowerTiles.teleport.forEach(tile => {
    const cell = PATHS.common[toCommonIndex(tile)]?.el;
    if (!cell) return;
    cell.classList.add("power-tile", "power-teleport");
    cell.dataset.powerType = "teleport";
  });
}

function setupPowerMode() {
  if (gameMode !== "power") {
    powerTileState = { speed: [], shield: [], teleport: [] };
    clearPowerTileMarkers();
    return;
  }
  randomizePowerTiles();
  applyPowerTileMarkers();
}

function clearBattleTileMarkers() {
  PATHS.common.forEach(node => {
    const cell = node?.el;
    if (!cell) return;
    cell.classList.remove("battle-tile", "battle-risk", "battle-block", "battle-block-active", "battle-block-owner-red", "battle-block-owner-green", "battle-block-owner-yellow", "battle-block-owner-blue");
    delete cell.dataset.blockOwner;
  });
}

function isBattleTileCandidate(tileNumber, blocked = new Set()) {
  const index = toCommonIndex(tileNumber);
  const cell = PATHS.common[index]?.el;
  if (!cell) return false;
  if (blocked.has(tileNumber)) return false;
  if (SAFE_INDICES.has(index)) return false;
  if (CHAOS_ENDPOINT_TILES.has(tileNumber)) return false;
  if (cell.classList.contains("safe-star")) return false;
  if (cell.classList.contains("red-home-turn") || cell.classList.contains("green-home-turn") || cell.classList.contains("yellow-home-turn") || cell.classList.contains("blue-home-turn")) {
    return false;
  }
  if (cell.classList.contains("red") || cell.classList.contains("green") || cell.classList.contains("yellow") || cell.classList.contains("blue")) {
    return false;
  }
  return true;
}

function pickRandomBattleTile(blocked = new Set()) {
  const candidates = [];
  for (let tile = 1; tile <= PATHS.common.length; tile++) {
    if (isBattleTileCandidate(tile, blocked)) candidates.push(tile);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function randomizeBattleTiles() {
  const used = new Set();
  const risk = [];
  const block = [];

  for (let i = 0; i < BATTLE_TILE_COUNTS.risk; i++) {
    const tile = pickRandomBattleTile(used);
    if (tile === null) break;
    risk.push(tile);
    used.add(tile);
  }
  for (let i = 0; i < BATTLE_TILE_COUNTS.block; i++) {
    const tile = pickRandomBattleTile(used);
    if (tile === null) break;
    block.push(tile);
    used.add(tile);
  }

  battleTileState = { risk, block };
}

function getActiveBattleTiles() {
  const fallbackRisk = [11, 21, 37];
  const fallbackBlock = [6, 30];
  return {
    risk: battleTileState.risk.length > 0 ? battleTileState.risk : fallbackRisk,
    block: battleTileState.block.length > 0 ? battleTileState.block : fallbackBlock
  };
}

function applyBattleTileMarkers() {
  clearBattleTileMarkers();
  if (gameMode !== "battle") return;
  const activeBattleTiles = getActiveBattleTiles();

  activeBattleTiles.risk.forEach(tile => {
    const cell = PATHS.common[toCommonIndex(tile)]?.el;
    if (!cell) return;
    cell.classList.add("battle-tile", "battle-risk");
  });
  activeBattleTiles.block.forEach(tile => {
    const cell = PATHS.common[toCommonIndex(tile)]?.el;
    if (!cell) return;
    cell.classList.add("battle-tile", "battle-block");
  });
}

function setupBattleMode() {
  battleActiveBlocks.clear();
  if (gameMode !== "battle") {
    battleTileState = { risk: [], block: [] };
    clearBattleTileMarkers();
    refreshRiskTokenVisuals();
    return;
  }
  randomizeBattleTiles();
  applyBattleTileMarkers();
  refreshRiskTokenVisuals();
}

function activateBattleBlockTile(index, ownerColor) {
  if (gameMode !== "battle") return;
  if (!Number.isInteger(index) || index < 0 || index >= PATHS.common.length) return;
  const cell = PATHS.common[index]?.el;
  if (!cell) return;
  cell.classList.remove("battle-block-owner-red", "battle-block-owner-green", "battle-block-owner-yellow", "battle-block-owner-blue");
  battleActiveBlocks.set(index, {
    ownerColor,
    turnsLeft: 2
  });
  cell.classList.add("battle-block-active", `battle-block-owner-${ownerColor}`);
  cell.dataset.blockOwner = ownerColor;
}

function tickBattleBlocks() {
  if (battleActiveBlocks.size === 0) return;
  Array.from(battleActiveBlocks.entries()).forEach(([index, blockState]) => {
    const nextTurns = (Number(blockState.turnsLeft) || 0) - 1;
    const cell = PATHS.common[index]?.el;
    if (nextTurns <= 0) {
      battleActiveBlocks.delete(index);
      if (cell) {
        cell.classList.remove("battle-block-active", "battle-block-owner-red", "battle-block-owner-green", "battle-block-owner-yellow", "battle-block-owner-blue");
        delete cell.dataset.blockOwner;
      }
      return;
    }
    battleActiveBlocks.set(index, {
      ownerColor: blockState.ownerColor,
      turnsLeft: nextTurns
    });
  });
}

function isBlockedByBattleTile(index, movingColor) {
  if (gameMode !== "battle") return false;
  const blockState = battleActiveBlocks.get(index);
  if (!blockState) return false;
  return blockState.ownerColor !== movingColor;
}

function isTokenRiskVulnerable(tokenEl) {
  const owner = findTokenOwner(tokenEl);
  if (!owner) return false;
  const player = state.players[owner.playerIndex];
  if (!player || !Array.isArray(player.riskVulnerable)) return false;
  return (Number(player.riskVulnerable[owner.tokenIndex]) || 0) > 0;
}

function refreshRiskTokenVisuals() {
  state.players.forEach(player => {
    if (!player || !Array.isArray(player.riskVulnerable)) return;
    player.riskVulnerable.forEach((value, tokenIndex) => {
      const token = tokenEls[player.color]?.[tokenIndex];
      if (!token) return;
      const isVulnerable = (Number(value) || 0) > 0;
      token.classList.toggle("battle-risk-vulnerable", isVulnerable);
    });
  });
}

function handleBattleCaptureBonus(playerIndex, captures, sourceEl = null) {
  const player = state.players[playerIndex];
  if (!player || captures <= 0) return;

  player.battleCapturedThisTurn = true;
  player.battleStreak = Math.max(1, Number(player.battleStreak || 0) + captures);

  let coinBonus = BATTLE_CAPTURE_COINS * captures;
  if (player.battleStreak >= 2) {
    coinBonus += (player.battleStreak - 1) * BATTLE_STREAK_STEP_COINS;
    showToast(`Kill Streak x${player.battleStreak}`);
  } else {
    showToast("Capture Bonus");
  }
  createImpactPulse(getElementCenter(sourceEl), "battle");

  if (player.color === humanColor) {
    addCoins(coinBonus);
    animateCoinGain(coinBonus, sourceEl);
  }
}

function clearArenaTileMarkers() {
  PATHS.common.forEach(node => {
    const cell = node?.el;
    if (!cell) return;
    cell.classList.remove("arena-reward-tile");
  });
}

function isArenaTileCandidate(tileNumber, blocked = new Set()) {
  const index = toCommonIndex(tileNumber);
  const cell = PATHS.common[index]?.el;
  if (!cell) return false;
  if (blocked.has(tileNumber)) return false;
  if (SAFE_INDICES.has(index)) return false;
  if (CHAOS_ENDPOINT_TILES.has(tileNumber)) return false;
  if (cell.classList.contains("safe-star")) return false;
  if (cell.classList.contains("red-home-turn") || cell.classList.contains("green-home-turn") || cell.classList.contains("yellow-home-turn") || cell.classList.contains("blue-home-turn")) {
    return false;
  }
  if (cell.classList.contains("red") || cell.classList.contains("green") || cell.classList.contains("yellow") || cell.classList.contains("blue")) {
    return false;
  }
  return true;
}

function pickRandomArenaTile(blocked = new Set()) {
  const candidates = [];
  for (let tile = 1; tile <= PATHS.common.length; tile++) {
    if (isArenaTileCandidate(tile, blocked)) candidates.push(tile);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function randomizeArenaTiles() {
  const blocked = new Set();
  const reward = [];
  for (let i = 0; i < ARENA_REWARD_TILE_COUNT; i++) {
    const tile = pickRandomArenaTile(blocked);
    if (tile === null) break;
    reward.push(tile);
    blocked.add(tile);
  }
  arenaTileState = { reward };
}

function getActiveArenaTiles() {
  return {
    reward: arenaTileState.reward.length > 0 ? arenaTileState.reward : [18, 44]
  };
}

function applyArenaTileMarkers() {
  clearArenaTileMarkers();
  if (gameMode !== "arena") return;
  const activeArenaTiles = getActiveArenaTiles();
  activeArenaTiles.reward.forEach(tile => {
    const cell = PATHS.common[toCommonIndex(tile)]?.el;
    if (!cell) return;
    cell.classList.add("arena-reward-tile");
  });
}

function setupArenaMode() {
  if (gameMode !== "arena") {
    arenaTileState = { reward: [] };
    clearArenaTileMarkers();
    return;
  }
  randomizeArenaTiles();
  applyArenaTileMarkers();
}

function setPaused(nextPaused) {
  const paused = Boolean(nextPaused);
  if (paused === isPaused) return;
  if (gameOver && paused) return;
  isPaused = paused;
  document.body.classList.toggle("game-paused", isPaused);

  if (pauseModalEl) {
    pauseModalEl.classList.toggle("show", isPaused);
    pauseModalEl.setAttribute("aria-hidden", isPaused ? "false" : "true");
  }
  if (pauseBtnEl) {
    pauseBtnEl.textContent = isPaused ? "Paused" : "Pause";
    pauseBtnEl.setAttribute("aria-pressed", isPaused ? "true" : "false");
  }
  Object.values(dicePanelsByColor).forEach(panel => {
    panel?.classList.remove("ai-anticipation");
  });

  if (isPaused) {
    bgmWasPlayingBeforePause = !bgMusic.paused;
    bgMusic.pause();
  } else if (bgmWasPlayingBeforePause && isBgmEnabled && !gameOver) {
    bgMusic.play().catch(() => {});
  }

  resetDiceInteractivity();
  if (!isPaused && !gameOver) {
    const current = state.players[state.currentPlayer];
    if (current && current.isAI && !isMoving) {
      setTimeout(runAITurn, 140);
    }
  }
}

function togglePause() {
  setPaused(!isPaused);
}

function exitPausedMatch() {
  setPaused(false);
  clearResumeSnapshot();
  const query = new URLSearchParams({ gm: gameMode });
  window.location.href = `index.html?${query.toString()}`;
}

function getCurrentMoveSteps(playerIndex) {
  if (state.diceValue === null) return 0;
  return state.diceValue * activeRollMultiplier;
}

function applyPostLandingEffects(playerIndex, tokenIndex, options = {}) {
  const { skipSafeBonus = false } = options;
  const player = state.players[playerIndex];
  if (!player) return;
  const color = player.color;
  const token = tokenEls[color]?.[tokenIndex];
  if (!token) return;

  const finalPath = token.dataset.path || "common";
  const finalPos = player.tokens[tokenIndex];
  if (finalPath !== "common" || finalPos < 0) return;

  const captures = handleCaptureAt(finalPos, token);
  if (color === humanColor && captures > 0) {
    rewardHumanEvent("capture", PATHS.common[finalPos].el, null, captures);
  }
  if (color === humanColor && countColorTokensOnCommonAt(finalPos, color) === 2) {
    rewardHumanEvent("blockade", PATHS.common[finalPos].el);
  }

  if (gameMode === "battle" && captures > 0) {
    handleBattleCaptureBonus(playerIndex, captures, PATHS.common[finalPos].el);
  } else if (gameMode === "arena" && captures > 0) {
    if (color === humanColor) {
      addCoins(4 * captures);
      animateCoinGain(4 * captures, PATHS.common[finalPos].el);
    }
    showToast("Battle Bonus");
  }

  if (isHumanVsComputerTurn(color) && captures > 0) {
    if (activeSkinEffects.bonusCaptureCoins) {
      addCoins(activeSkinEffects.bonusCaptureCoins * captures);
    }
    if (activeSkinEffects.nextRollBoostAfterCapture) {
      matchEffectState.nextRollBoost = 1;
    }
  }
  if (!skipSafeBonus && isHumanVsComputerTurn(color) && activeSkinEffects.safeSquareExtraTurn && SAFE_INDICES.has(finalPos)) {
    pendingBonusTurn = true;
  }
}

async function handleTileEvent(playerIndex, tokenIndex) {
  const modeConfig = getModeConfig();
  if (!modeConfig || gameMode === "classic") return;

  const player = state.players[playerIndex];
  if (!player) return;
  const token = tokenEls[player.color]?.[tokenIndex];
  if (!token) return;
  if ((token.dataset.path || "common") !== "common") return;
  if (player.tokens[tokenIndex] < 0) return;

  let currentPos = player.tokens[tokenIndex];
  let currentTile = currentPos + 1;
  let iterations = 0;
  const activePowerTiles = getActivePowerTiles();
  const activeBattleTiles = getActiveBattleTiles();

  while (iterations < 5) {
    iterations += 1;
    let moved = false;
    const ladderPair = (modeConfig.ladders || modeConfig.allEvents)
      ? CHAOS_LADDER_PAIRS.find(pair => pair.start === currentTile)
      : null;
    const snakePair = (modeConfig.snakes || modeConfig.allEvents)
      ? CHAOS_SNAKE_PAIRS.find(pair => pair.mouth === currentTile)
      : null;

    if (ladderPair) {
      const fromPos = currentPos;
      const target = toCommonIndex(ladderPair.end);
      moved = moveTokenToCommonIndex(playerIndex, tokenIndex, target, "Ladder Boost");
      if (moved) {
        await animateLadderTransfer(playerIndex, tokenIndex, fromPos, target, ladderPair.side);
        playSfx("entry", 0.46);
      }
    } else if (snakePair) {
      const fromPos = currentPos;
      const target = toCommonIndex(snakePair.tail);
      moved = moveTokenToCommonIndex(playerIndex, tokenIndex, target, "Snake Drop");
      if (moved) {
        await animateSnakeTransfer(playerIndex, tokenIndex, fromPos, target, snakePair.side);
        playSfx("goal", 0.24);
      }
    } else if ((modeConfig.powerTiles || modeConfig.allEvents) && activePowerTiles.speed.includes(currentTile)) {
      const target = (currentPos + 3) % PATHS.common.length;
      moved = moveTokenToCommonIndex(playerIndex, tokenIndex, target, "Speed +3");
      if (moved) playSfx("step", 0.4);
    } else if ((modeConfig.powerTiles || modeConfig.allEvents) && activePowerTiles.teleport.includes(currentTile)) {
      const toTile = pickRandomTeleportDestination(currentTile);
      if (toTile !== null) {
        moved = moveTokenToCommonIndex(playerIndex, tokenIndex, toCommonIndex(toTile), "Teleport");
        if (moved) playSfx("entry", 0.6);
      }
    } else if ((modeConfig.powerTiles || modeConfig.allEvents) && activePowerTiles.shield.includes(currentTile)) {
      player.shields[tokenIndex] = 1;
      showToast("Shield Ready");
      break;
    } else if (modeConfig.aggressive && activeBattleTiles.risk.includes(currentTile)) {
      player.riskVulnerable[tokenIndex] = 2;
      refreshRiskTokenVisuals();
      const target = (currentPos + 2) % PATHS.common.length;
      moved = moveTokenToCommonIndex(playerIndex, tokenIndex, target, "Risk Dash +2");
      if (moved) {
        showToast("Risk Tile: Fast but Exposed");
        playSfx("step", 0.44);
      }
    } else if (modeConfig.aggressive && activeBattleTiles.block.includes(currentTile)) {
      activateBattleBlockTile(currentPos, player.color);
      showToast("Block Tile Armed");
      playSfx("entry", 0.48);
      break;
    }

    if (!moved) break;

    await wait(110);
    currentPos = player.tokens[tokenIndex];
    currentTile = currentPos + 1;
  }

  if (gameMode === "chaos" && chaosRewardTile === null) {
    pickChaosRewardTile();
    applyChaosRewardTileMarker();
  }

  if (gameMode === "chaos" && player.color === humanColor && chaosRewardTile !== null && currentTile === chaosRewardTile) {
    const rewardCell = PATHS.common[currentPos]?.el || null;
    addCoins(CHAOS_REWARD_COINS);
    animateCoinGain(CHAOS_REWARD_COINS, rewardCell);
    showToast(`Chaos Reward +${CHAOS_REWARD_COINS}`);
    playSfx("entry", 0.54);
  }

  if (gameMode === "arena") {
    const activeArenaTiles = getActiveArenaTiles();
    if (player.color === humanColor && activeArenaTiles.reward.includes(currentTile)) {
      const rewardCell = PATHS.common[currentPos]?.el || null;
      addCoins(ARENA_REWARD_COINS);
      animateCoinGain(ARENA_REWARD_COINS, rewardCell);
      showToast(`Arena Reward +${ARENA_REWARD_COINS}`);
      playSfx("entry", 0.62);
    }
  }
}

function triggerRandomEvent() {
  if (gameMode !== "arena") return;
  if (isPaused) return;
  const events = ["all_step_two", "double_next_roll"];
  const selected = events[Math.floor(Math.random() * events.length)];

  if (selected === "all_step_two") {
    state.players.forEach((player, playerIndex) => {
      const tokenIndex = player.tokens.findIndex((pos, idx) => {
        if (pos < 0 || player.finished[idx]) return false;
        const token = tokenEls[player.color]?.[idx];
        return !!token && (token.dataset.path || "common") === "common";
      });
      if (tokenIndex < 0) return;
      const target = (player.tokens[tokenIndex] + 2) % PATHS.common.length;
      moveTokenToCommonIndex(playerIndex, tokenIndex, target);
      applyPostLandingEffects(playerIndex, tokenIndex, { skipSafeBonus: true });
    });
    showToast("Arena Event: All +2");
  }

  if (selected === "double_next_roll") {
    const current = state.players[state.currentPlayer];
    if (current) {
      arenaDoubleRollColor = current.color;
      showToast("Arena Event: Next Roll x2");
    }
  }

  refreshNearWinEffects();
}

function clearNearWinEffects() {
  Object.values(tokenEls).flat().forEach(token => {
    token.classList.remove("near-win-heartbeat");
  });

  Object.values(HOME_PATH_KEY_BY_COLOR).forEach(pathKey => {
    const path = PATHS[pathKey] || [];
    path.forEach(node => node.el.classList.remove("near-win-glow"));
  });
}

function refreshNearWinEffects() {
  clearNearWinEffects();
  const activeNearWin = new Set();

  state.players.forEach(player => {
    const finishedCount = player.finished.filter(Boolean).length;
    if (finishedCount !== 3) return;

    const tokenIndex = player.finished.findIndex(done => !done);
    if (tokenIndex < 0) return;

    const token = tokenEls[player.color]?.[tokenIndex];
    if (!token) return;

    const pathKey = token.dataset.path || "common";
    const pos = player.tokens[tokenIndex];
    const homePathKey = HOME_PATH_KEY_BY_COLOR[player.color];
    const homePath = PATHS[homePathKey] || [];
    if (pathKey !== homePathKey || pos < 0 || homePath.length === 0) return;

    const nearStart = Math.max(0, homePath.length - 3);
    if (pos < nearStart) return;

    activeNearWin.add(player.color);
    token.classList.add("near-win-heartbeat");
    for (let i = nearStart; i < homePath.length; i++) {
      homePath[i].el.classList.add("near-win-glow");
    }

    if (!nearWinAnnounced.has(player.color)) {
      nearWinAnnounced.add(player.color);
      if (player.color === humanColor) {
        const line = pickReactionLine("almost");
        if (line) showToast(line);
        playSfx("goal", 0.24);
      }
    }
  });

  Array.from(nearWinAnnounced).forEach(color => {
    if (!activeNearWin.has(color)) nearWinAnnounced.delete(color);
  });
}

function canMoveOnCommonPath(playerIndex, tokenIndex, dice) {
  const player = state.players[playerIndex];
  const color = player.color;
  const token = tokenEls[color][tokenIndex];
  const pos = player.tokens[tokenIndex];
  const pathKey = token.dataset.path || "common";

  if (pathKey !== "common") return true;

  const turnIndex = TURN_INDEX_BY_COLOR[color];
  const homePathKey = HOME_PATH_KEY_BY_COLOR[color];
  const homeLen = PATHS[homePathKey].length;

  if (pos === turnIndex && dice === 6) return true;

  let commonPos = pos;
  let enteredHome = false;
  let homePos = -1;

  for (let step = 1; step <= dice; step++) {
    if (!enteredHome && commonPos === turnIndex) {
      enteredHome = true;
      homePos = 0;
      continue;
    }

    if (!enteredHome) {
      const nextCommon = (commonPos + 1) % PATHS.common.length;
      if (isBlockedByEnemyBlockade(nextCommon, color)) return false;
      if (isBlockedByBattleTile(nextCommon, color)) return false;
      commonPos = nextCommon;
      continue;
    }

    homePos += 1;
    if (homePos > homeLen) return false;
  }

  if (enteredHome) {
    return homePos <= homeLen;
  }

  return !isBlockedByEnemyBlockade(commonPos, color) && !isBlockedByBattleTile(commonPos, color);
}

function setupTileGlowSeeds() {
  const paths = [
    ...PATHS.common,
    ...PATHS.redHome,
    ...PATHS.greenHome,
    ...PATHS.yellowHome,
    ...PATHS.blueHome
  ];

  paths.forEach(node => {
    if (!node?.el) return;
    const delay = (Math.random() * 2.8).toFixed(2);
    node.el.style.setProperty("--glow-delay", `${delay}s`);
  });
}

function setupSparkParticles() {
  if (!sparkLayerEl || !boardEl) return;

  function spawnSpark() {
    if (document.hidden) return;
    if (isPaused) return;
    if (sparkLayerEl.childElementCount > 28) return;

    const layerRect = sparkLayerEl.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    const offsetX = boardRect.left - layerRect.left;
    const offsetY = boardRect.top - layerRect.top;

    const spark = document.createElement("span");
    spark.className = "spark-particle";

    const x = offsetX + Math.random() * boardRect.width;
    const y = offsetY + Math.random() * boardRect.height;
    const driftX = (Math.random() - 0.5) * 36;
    const driftY = -26 - Math.random() * 36;
    const size = 3 + Math.random() * 4;
    const duration = 900 + Math.floor(Math.random() * 900);

    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    spark.style.setProperty("--drift-x", `${driftX}px`);
    spark.style.setProperty("--drift-y", `${driftY}px`);
    spark.style.setProperty("--spark-duration", `${duration}ms`);

    spark.addEventListener("animationend", () => spark.remove());
    sparkLayerEl.appendChild(spark);
  }

  setInterval(spawnSpark, 220);
}

function setupBackgroundSlideshow() {
  const layerA = document.querySelector(".bg-layer.bg-a");
  const layerB = document.querySelector(".bg-layer.bg-b");
  if (!layerA || !layerB || BACKGROUND_IMAGES.length === 0) return;

  let active = layerA;
  let inactive = layerB;
  let index = 0;

  active.style.backgroundImage = `url("${BACKGROUND_IMAGES[index]}")`;

  setInterval(() => {
    if (isPaused) return;
    index = (index + 1) % BACKGROUND_IMAGES.length;
    inactive.style.backgroundImage = `url("${BACKGROUND_IMAGES[index]}")`;
    inactive.style.opacity = "1";
    active.style.opacity = "0";
    const prev = active;
    active = inactive;
    inactive = prev;
  }, 10000);
}

function playSfx(type, volume = 0.7) {
  if (isPaused) return;
  if (!isSfxEnabled) return;
  const src = SOUND_FILES[type];
  if (!src) return;
  const sound = new Audio(src);
  sound.volume = Math.min(1, Math.max(0, (Number(volume) || 0) * 1.35));
  sound.play().catch(() => {});
}

function setupSoundBootstrap() {
  const startMusic = () => {
    if (!isBgmEnabled) return;
    if (bgMusicStarted) return;
    bgMusicStarted = true;
    bgMusic.play().catch(() => {});
  };

  window.addEventListener("click", startMusic, { once: true });
  window.addEventListener("keydown", startMusic, { once: true });
  window.addEventListener("touchstart", startMusic, { once: true });
}

function openResultModal({ title, subtitle, showNextLevel }) {
  if (resultTitleEl) resultTitleEl.textContent = title;
  if (resultSubtitleEl) resultSubtitleEl.textContent = subtitle || "";
  if (btnNextLevelEl) {
    btnNextLevelEl.style.display = showNextLevel ? "inline-block" : "none";
  }

  resultModalEl.classList.add("show");
  resultModalEl.setAttribute("aria-hidden", "false");
}

function checkAndShowWinner(playerIndex) {
  const player = state.players[playerIndex];
  if (!player.finished.every(Boolean)) return false;

  gameOver = true;
  document.body.classList.add("match-won");
  player.tokens.forEach((_, tokenIndex) => {
    triggerFeedback(tokenEls[player.color]?.[tokenIndex], "token-winner", 720);
  });
  if (isPaused) setPaused(false);
  clearResumeSnapshot();
  isMoving = false;
  clearHighlights();

  Object.keys(diceEls).forEach(c => {
    diceEls[c].style.pointerEvents = "none";
    const panel = diceEls[c].closest(".dice-panel");
    if (panel) panel.classList.remove("dice-active");
  });

  if (matchMode === "vs-computer" && player.color === humanColor) {
    let winCoins = 100 * (gameMode === "arena" ? ARENA_WIN_MULTIPLIER : 1);
    winCoins += activeSkinEffects.bonusWinCoins || 0;
    if (activeSkinEffects.winBonusPercent) {
      winCoins += Math.floor(winCoins * activeSkinEffects.winBonusPercent);
    }
    addCoins(winCoins);
  }

  if (matchMode === "vs-computer" && activeSkinEffects.bonusMatchCoins) {
    addCoins(activeSkinEffects.bonusMatchCoins);
  }

  if (matchMode === "vs-computer" && player.color === humanColor) {
    const storageKey = "ludo_unlocked_level";
    const unlocked = Math.max(1, Number(localStorage.getItem(storageKey) || "1"));
    const nextUnlocked = Math.max(unlocked, currentLevel + 1);
    localStorage.setItem(storageKey, String(nextUnlocked));
  }

  if (matchMode === "pass-play") {
    playSfx("win", 0.8);
    openResultModal({
      title: `${player.color.toUpperCase()} WINS`,
      subtitle: "",
      showNextLevel: false
    });
  } else {
    if (player.color === humanColor) {
      playSfx("win", 0.8);
      openResultModal({
        title: "YOU WON",
        subtitle: "",
        showNextLevel: true
      });
    } else {
      openResultModal({
        title: "You lose",
        subtitle: `${player.color.toUpperCase()} AI won`,
        showNextLevel: false
      });
    }
  }

  return true;
}

function highlightMoves(playerIndex, dice, moveSteps = dice) {
  clearHighlights();
  const player = state.players[playerIndex];
  if (player.isAI) return 0;

  const moves = getValidMovesForPlayer(playerIndex, moveSteps);
  moves.forEach(({ tokenIndex }) => {
    const token = tokenEls[player.color][tokenIndex];
    if (dice === 6) token.classList.add("selectable-gold");
    else token.classList.add("selectable-black");
  });
  return moves.length;
}

function animateDiceRoll(color, onDone) {
  const diceEl = diceEls[color];
  const panel = dicePanelsByColor[color];
  triggerFeedback(panel, "dice-rolling", 620);
  diceEl.style.pointerEvents = "none";
  const spinX = 720 + Math.floor(Math.random() * 720);
  const spinY = 720 + Math.floor(Math.random() * 720);
  diceEl.style.transition = "transform 560ms cubic-bezier(.18,.78,.2,1)";
  diceEl.style.transform = `rotateX(${spinX}deg) rotateY(${spinY}deg)`;

  setTimeout(function finishDiceRoll() {
    if (isPaused) {
      setTimeout(finishDiceRoll, 90);
      return;
    }
    const value = computeRollValue(color);
    state.diceValue = value;
    triggerFeedback(panel, "dice-landed", 300);
    if (value === 6) {
      triggerFeedback(panel, "dice-six", 520);
      if (color === humanColor) playSfx("entry", 0.28);
    }

    const player = state.players[state.currentPlayer];
    if (player && color === humanColor && value === 6) {
      rewardHumanEvent("rollSix", diceEl);
    }

    if (player) {
      if (value === 6) {
        player.sixStreak += 1;
      } else {
        player.sixStreak = 0;
      }

      if (player.sixStreak >= 3) {
        player.sixStreak = 0;
        state.diceValue = null;
        diceEl.style.transition = "transform 260ms cubic-bezier(.2,.7,.2,1)";
        diceEl.style.transform = rotations[value];
        showToast("TRIPLE 6 - TURN LOST");
        onDone(value);
        return;
      }
    }

    diceEl.style.transition = "transform 260ms cubic-bezier(.2,.7,.2,1)";
    diceEl.style.transform = rotations[value];
    onDone(value);
  }, 560);
}

function nextTurn(extraTurn = false) {
  if (gameOver) return;
  if (isPaused) {
    setTimeout(() => nextTurn(extraTurn), 120);
    return;
  }
  const previousPlayerIndex = state.currentPlayer;
  if (!extraTurn) {
    const previous = state.players[previousPlayerIndex];
    if (previous) {
      if (!previous.battleCapturedThisTurn) {
        previous.battleStreak = 0;
      }
      previous.battleCapturedThisTurn = false;
    }
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  }
  if (!extraTurn) {
    const current = state.players[state.currentPlayer];
    if (current) current.sixStreak = 0;
  }

  state.diceValue = null;
  activeRollMultiplier = 1;
  hasRolledThisTurn = false;
  waitingForTokenMove = false;
  isMoving = false;
  clearHighlights();
  refreshNearWinEffects();

  if (!extraTurn) {
    const player = state.players[state.currentPlayer];
    if (player) {
      if (Array.isArray(player.shields)) {
        player.shields = player.shields.map(value => Math.max(0, (Number(value) || 0) - 1));
      }
      if (Array.isArray(player.riskVulnerable)) {
        player.riskVulnerable = player.riskVulnerable.map(value => Math.max(0, (Number(value) || 0) - 1));
      }
    }
    refreshRiskTokenVisuals();
    if (gameMode === "battle") {
      tickBattleBlocks();
    }
    if (gameMode === "arena") {
      arenaTurns += 1;
      if (arenaTurns >= arenaNextEventAt) {
        arenaTurns = 0;
        arenaNextEventAt = 3 + Math.floor(Math.random() * 3);
        triggerRandomEvent();
      }
    }
  }
  resetDiceInteractivity();

  const currentPlayer = state.players[state.currentPlayer];
  announceTurn(currentPlayer);
  if (currentPlayer.isAI) {
    setTimeout(runAITurn, 700);
  }
}

function handleTurn() {
  if (gameOver) return;
  if (isPaused) return;
  const playerIndex = state.currentPlayer;
  if (state.players[playerIndex].isAI) return;
  if (state.diceValue === null) {
    waitingForTokenMove = false;
    state.players[playerIndex].sixStreak = 0;
    setTimeout(() => nextTurn(false), 250);
    return;
  }

  const movesCount = highlightMoves(playerIndex, state.diceValue, getCurrentMoveSteps(playerIndex));
  waitingForTokenMove = movesCount > 0;
  resetDiceInteractivity();
  if (movesCount === 0) {
    const line = pickReactionLine("unlucky");
    if (line) showToast(line);
    waitingForTokenMove = false;
    state.players[playerIndex].sixStreak = 0;
    setTimeout(() => nextTurn(false), 400);
  }
}

function rollDice() {
  if (gameOver) return;
  if (isPaused) return;
  if (isMoving) return;
  if (state.players[state.currentPlayer].isAI) return;
  if (state.diceValue !== null) return;
  if (hasRolledThisTurn) return;
  if (waitingForTokenMove) return;

  hasRolledThisTurn = true;
  isMoving = true;
  const color = state.players[state.currentPlayer].color;
  animateDiceRoll(color, () => {
    isMoving = false;
    handleTurn();
  });
}

function runAITurn() {
  if (gameOver) return;
  if (isPaused) return;
  if (isMoving) return;

  const playerIndex = state.currentPlayer;
  const player = state.players[playerIndex];
  if (!player || !player.isAI) return;

  isMoving = true;
  const panel = dicePanelsByColor[player.color];
  const anticipationDelay = 360 + Math.floor(Math.random() * 540);
  if (panel) panel.classList.add("ai-anticipation");

  setTimeout(() => {
    if (isPaused) {
      if (panel) panel.classList.remove("ai-anticipation");
      isMoving = false;
      return;
    }
    if (panel) panel.classList.remove("ai-anticipation");
    if (gameOver) {
      isMoving = false;
      return;
    }

    const current = state.players[state.currentPlayer];
    if (!current || !current.isAI || current.color !== player.color) {
      isMoving = false;
      return;
    }

    animateDiceRoll(player.color, () => {
      resetDiceInteractivity();
      if (state.diceValue === null) {
        player.sixStreak = 0;
        isMoving = false;
        nextTurn(false);
        return;
      }
      const moveSteps = getCurrentMoveSteps(playerIndex);
      const moves = getValidMovesForPlayer(playerIndex, moveSteps);
      if (moves.length === 0) {
        player.sixStreak = 0;
        isMoving = false;
        nextTurn(false);
        return;
      }
      const chosen = pickAiMove(playerIndex, moves, moveSteps);
      executeMove(chosen || moves[0]).catch(() => {
        isMoving = false;
        nextTurn(false);
      });
    });
  }, anticipationDelay);
}

async function moveIntoGoal(player, tokenIndex, token, color, extraTurn) {
  goalEls[color].appendChild(token);
  playSfx("goal", 0.65);
  token.dataset.path = "goal";
  player.tokens[tokenIndex] = -2;
  player.finished[tokenIndex] = true;
  triggerFeedback(token, "token-finished", 460);
  if (Array.isArray(player.riskVulnerable)) {
    player.riskVulnerable[tokenIndex] = 0;
  }
  refreshRiskTokenVisuals();

  if (color === humanColor) {
    rewardHumanEvent("home", goalEls[color]);
  }

  if (isHumanVsComputerTurn(color) && activeSkinEffects.extraTurnEveryTwoHomes) {
    matchEffectState.homesCount += 1;
    if (matchEffectState.homesCount % 2 === 0) {
      pendingBonusTurn = true;
    }
  }

  refreshNearWinEffects();
  if (checkAndShowWinner(state.currentPlayer)) return;
  isMoving = false;
  nextTurn(consumeBonusTurn(extraTurn));
}

async function executeMove(move) {
  try {
    if (gameOver) return;
    if (isPaused) return;
    isMoving = true;
    waitingForTokenMove = false;
    if (!move) {
      isMoving = false;
      nextTurn(false);
      return;
    }

    const { playerIndex, tokenIndex } = move;
    const player = state.players[playerIndex];
    if (!player) {
      isMoving = false;
      nextTurn(false);
      return;
    }

    const color = player.color;
    const token = tokenEls[color][tokenIndex];
    const dice = state.diceValue;
    const baseMoveSteps = getCurrentMoveSteps(playerIndex);
    if (!Number.isFinite(baseMoveSteps) || baseMoveSteps <= 0) {
      isMoving = false;
      nextTurn(false);
      return;
    }
    let moveSteps = (
      isHumanVsComputerTurn(color) &&
      activeSkinEffects.doubleMoveOnce &&
      !matchEffectState.doubleMoveUsed
    ) ? baseMoveSteps * 2 : baseMoveSteps;
    if (
      isHumanVsComputerTurn(color) &&
      activeSkinEffects.doubleMoveOnce &&
      !matchEffectState.doubleMoveUsed
    ) {
      matchEffectState.doubleMoveUsed = true;
      if (!canTokenMove(playerIndex, tokenIndex, moveSteps)) {
        moveSteps = baseMoveSteps;
        matchEffectState.doubleMoveUsed = false;
      }
    }
    const pos = player.tokens[tokenIndex];

    let pathKey = "common";
    let path = PATHS.common;
    if (token.dataset.path && PATHS[token.dataset.path]) {
      pathKey = token.dataset.path;
      path = PATHS[pathKey];
    }
    if (token.dataset.path === "goal") {
      isMoving = false;
      nextTurn(false);
      return;
    }

    if (pos === -1) {
      if (dice !== 6) {
        isMoving = false;
        nextTurn(false);
        return;
      }

      const entryCell = ENTRY_CELLS[color];
      entryCell.appendChild(token);
      token.style.position = "";
      token.style.transform = "";
      token.dataset.path = "common";
      playSfx("entry", 0.75);
      player.tokens[tokenIndex] = PATHS.common.findIndex(p => p.el === entryCell);
      player.finished[tokenIndex] = false;
      triggerFeedback(token, "token-entered", 360);
      await handleTileEvent(playerIndex, tokenIndex);
      applyPostLandingEffects(playerIndex, tokenIndex);
      refreshNearWinEffects();
      isMoving = false;
      nextTurn(consumeBonusTurn(true));
      return;
    }

    if (pathKey !== "common") {
      const remainingToGoal = path.length - pos;
      if (moveSteps === remainingToGoal) {
        for (let i = 1; i < moveSteps; i++) {
          path[pos + i].el.appendChild(token);
          triggerFeedback(token, "token-step", 150);
          playSfx("step", 0.35);
          await wait(180);
        }
        await moveIntoGoal(player, tokenIndex, token, color, dice === 6);
        return;
      }

      for (let i = 1; i <= moveSteps; i++) {
        path[pos + i].el.appendChild(token);
        triggerFeedback(token, "token-step", 150);
        playSfx("step", 0.35);
        await wait(180);
      }
      player.tokens[tokenIndex] += moveSteps;
      await handleTileEvent(playerIndex, tokenIndex);
      applyPostLandingEffects(playerIndex, tokenIndex);
      triggerFeedback(token, "token-landed", 260);
      refreshNearWinEffects();
      isMoving = false;
      nextTurn(consumeBonusTurn(dice === 6));
      return;
    }

    const turnIndex = TURN_INDEX_BY_COLOR[color];
    if (pos === turnIndex && dice === 6) {
      await moveIntoGoal(player, tokenIndex, token, color, true);
      return;
    }

    const homePathKey = HOME_PATH_KEY_BY_COLOR[color];
    const homePath = PATHS[homePathKey];
    const commonLen = PATHS.common.length;
    let commonPos = pos;
    let enteredHome = false;
    let homePos = -1;

    for (let step = 1; step <= moveSteps; step++) {
      if (!enteredHome && commonPos === turnIndex) {
        enteredHome = true;
        homePos = 0;
        if (homePath[homePos]) {
          homePath[homePos].el.appendChild(token);
        }
        triggerFeedback(token, "token-home-lane", 360);
        playSfx("step", 0.35);
        await wait(180);
        continue;
      }

      if (!enteredHome) {
        commonPos = (commonPos + 1) % commonLen;
        PATHS.common[commonPos].el.appendChild(token);
        triggerFeedback(token, "token-step", 150);
        playSfx("step", 0.35);
        await wait(180);
        continue;
      }

      homePos += 1;
      if (homePos === homePath.length) {
        await moveIntoGoal(player, tokenIndex, token, color, dice === 6);
        return;
      }

      if (!homePath[homePos]) {
        isMoving = false;
        nextTurn(false);
        return;
      }

      homePath[homePos].el.appendChild(token);
      triggerFeedback(token, "token-step", 150);
      playSfx("step", 0.35);
      await wait(180);
    }

    if (enteredHome) {
      token.dataset.path = homePathKey;
      player.tokens[tokenIndex] = homePos;
      triggerFeedback(token, "token-landed", 260);
    } else {
      player.tokens[tokenIndex] = commonPos;
      await handleTileEvent(playerIndex, tokenIndex);
      applyPostLandingEffects(playerIndex, tokenIndex);
      triggerFeedback(token, "token-landed", 260);
    }

    refreshNearWinEffects();
    isMoving = false;
    nextTurn(consumeBonusTurn(dice === 6));
  } catch (error) {
    isMoving = false;
    nextTurn(false);
  }
}

maybeRestoreSavedGame();

activeColors.forEach(color => {
  const die = diceEls[color];
  const panel = dicePanelsByColor[color];
  if (panel) {
    panel.addEventListener("click", rollDice);
  } else if (die) {
    die.addEventListener("click", rollDice);
  }
});
refreshNearWinEffects();
resetDiceInteractivity();
scheduleChaosOverlayRender();
refreshRiskTokenVisuals();
announceTurn(state.players[state.currentPlayer]);

// A saved match may resume while an AI player owns the turn.  Restoring clears
// transient locks by design, so explicitly restart that AI turn instead of
// leaving the match waiting for a human-only dice click.
if (state.players[state.currentPlayer]?.isAI) {
  setTimeout(runAITurn, 140);
}
