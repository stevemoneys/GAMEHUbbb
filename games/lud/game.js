import { generatePaths, PATHS, HOME_SLOTS, ENTRY_CELLS } from "./board.js";

const tokenEls = {};
let isMoving = false;
let gameOver = false;
let hasRolledThisTurn = false;
let waitingForTokenMove = false;
const LUDO_RESUME_KEY = "ludo_saved_match_v1";

const boardEl = document.querySelector(".ludo-board");
generatePaths(boardEl);
const ALL_COLORS_CLOCKWISE = ["red", "green", "yellow", "blue"];

const params = new URLSearchParams(window.location.search);
const gameMode = (params.get("mode") || "vs-computer").toLowerCase();
const requestedPlayers = Number(params.get("players")) || 4;
const requestedHumanColor = (params.get("human") || "red").toLowerCase();
const currentLevel = Math.max(1, Number(params.get("level")) || 1);
const playerCount = Math.min(4, Math.max(2, requestedPlayers));
const humanColor = ALL_COLORS_CLOCKWISE.includes(requestedHumanColor) ? requestedHumanColor : "red";
const aiDifficulty = Math.min(3, Math.floor((currentLevel - 1) / 5) + 1);

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
  [3, 9],
  [9, 13],
  [13, 7]
];

const ENTRY_INDEX_BY_COLOR = {};
const TURN_INDEX_BY_COLOR = {};
const SAFE_INDICES = new Set();

Object.keys(HOME_PATH_KEY_BY_COLOR).forEach(color => {
  ENTRY_INDEX_BY_COLOR[color] = PATHS.common.findIndex(p => p.el === ENTRY_CELLS[color]);

  const [r, c] = TURN_COORD_BY_COLOR[color];
  TURN_INDEX_BY_COLOR[color] = PATHS.common.findIndex(p => p.row === r && p.col === c);

  SAFE_INDICES.add(ENTRY_INDEX_BY_COLOR[color]);
  SAFE_INDICES.add(TURN_INDEX_BY_COLOR[color]);
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
const coinTotalEl = document.getElementById("coin-total");
const toastLayerEl = document.getElementById("toast-layer");

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
bgMusic.volume = 0.45;

let bgMusicStarted = false;
const BGM_ENABLED_KEY = "ludo_bgm_enabled";
const SFX_ENABLED_KEY = "ludo_sfx_enabled";
let isBgmEnabled = localStorage.getItem(BGM_ENABLED_KEY) !== "0";
let isSfxEnabled = localStorage.getItem(SFX_ENABLED_KEY) !== "0";

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
  if (skin === "classic") return `tokens/${color}.png`;
  return `tokens/skins/${skin}/${color}_result.webp`;
}

const state = {
  currentPlayer: 0,
  diceValue: null,
  players: activeColors.map(color => ({
    color,
    tokens: [-1, -1, -1, -1],
    finished: [false, false, false, false],
    isAI: gameMode === "vs-computer" ? color !== humanColor : false,
    sixStreak: 0
  }))
};
let pendingBonusTurn = false;

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
      tokens
    };
  });

  const payload = {
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
  if (
    parsed.gameMode !== gameMode ||
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
}

document.body.classList.add(`orient-${humanColor}`);

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
      const activePlayer = state.players[state.currentPlayer];
      if (!activePlayer) return;
      if (activePlayer.isAI) return;
      if (player.color !== activePlayer.color) return;
      if (state.diceValue === null) return;
      if (!waitingForTokenMove) return;
      if (!canTokenMove(state.currentPlayer, i, state.diceValue)) return;

      if (state.diceValue === 6 && !token.classList.contains("selectable-gold")) return;
      if (state.diceValue !== 6 && !token.classList.contains("selectable-black")) return;

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
setupBackgroundSlideshow();
setupSoundBootstrap();

if (restartBtnEl) {
  restartBtnEl.addEventListener("click", () => {
    clearResumeSnapshot();
    window.location.reload();
  });
}

if (backLevelsBtnEl) {
  backLevelsBtnEl.addEventListener("click", () => {
    saveResumeSnapshot();
    const query = new URLSearchParams({
      mode: gameMode,
      players: String(playerCount),
      human: humanColor
    });
    window.location.href = `level-select.html?${query.toString()}`;
  });
}

if (btnPlayAgainEl) {
  btnPlayAgainEl.addEventListener("click", () => {
    clearResumeSnapshot();
    window.location.reload();
  });
}

if (btnCancelEl) {
  btnCancelEl.addEventListener("click", () => {
    saveResumeSnapshot();
    window.location.href = "index.html";
  });
}

if (btnNextLevelEl) {
  btnNextLevelEl.addEventListener("click", () => {
    clearResumeSnapshot();
    const query = new URLSearchParams({
      mode: "vs-computer",
      players: String(playerCount),
      human: humanColor,
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

function isHumanVsComputerTurn(color) {
  return gameMode === "vs-computer" && color === humanColor;
}

function consumeBonusTurn(baseTurn) {
  if (pendingBonusTurn) {
    pendingBonusTurn = false;
    return true;
  }
  return baseTurn;
}

function computeRollValue(color) {
  let value = Math.ceil(Math.random() * 6);
  if (!isHumanVsComputerTurn(color)) return value;

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

  return value;
}

function canTokenMove(playerIndex, tokenIndex, dice) {
  const player = state.players[playerIndex];
  const color = player.color;
  const pos = player.tokens[tokenIndex];
  const token = tokenEls[color][tokenIndex];
  const pathKey = token.dataset.path || "common";

  if (dice === null) return false;
  if (player.finished[tokenIndex]) return false;
  if (pathKey === "goal") return false;
  if (pos === -1) {
    if (dice !== 6) return false;
    const entryIndex = ENTRY_INDEX_BY_COLOR[color];
    return !isBlockedByEnemyBlockade(entryIndex, color);
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
  if (SAFE_INDICES.has(index)) return false;
  if (isBlockedByEnemyBlockade(index, movingColor)) return false;
  const cell = PATHS.common[index].el;
  const tokens = Array.from(cell.querySelectorAll(".token"));
  return tokens.some(t => t.dataset.color && t.dataset.color !== movingColor);
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

function sendTokenHome(tokenEl, color) {
  const owner = findTokenOwner(tokenEl);
  if (!owner) return;

  if (
    gameMode === "vs-computer" &&
    color === humanColor &&
    activeSkinEffects.shieldOnce &&
    !matchEffectState.shieldUsed
  ) {
    matchEffectState.shieldUsed = true;
    return;
  }

  if (
    gameMode === "vs-computer" &&
    color === humanColor &&
    activeSkinEffects.reenterAfterCapture
  ) {
    if (Math.random() < 0.5) {
      matchEffectState.capturedTokenPendingReentry = owner.tokenIndex;
      matchEffectState.reentryTurnsLeft = 2;
    }
  }

  tokenEl.classList.add("capturing");
  setTimeout(() => {
    const homeEl = getFreeHomeSlotEl(color);
    homeEl.appendChild(tokenEl);
    tokenEl.classList.remove("capturing");
  }, 120);

  const player = state.players[owner.playerIndex];
  player.tokens[owner.tokenIndex] = -1;
  player.finished[owner.tokenIndex] = false;
  tokenEl.dataset.path = "common";
}

function handleCaptureAt(index, movingToken) {
  if (SAFE_INDICES.has(index)) return 0;
  if (isBlockedByEnemyBlockade(index, movingToken.dataset.color)) return 0;
  const cell = PATHS.common[index].el;
  const tokens = Array.from(cell.querySelectorAll(".token"));
  if (tokens.length <= 1) return 0;

  const movingColor = movingToken.dataset.color;
  let captures = 0;
  tokens.forEach(t => {
    if (t === movingToken) return;
    const color = t.dataset.color;
    if (color && color !== movingColor) {
      captures += 1;
      sendTokenHome(t, color);
    }
  });
  return captures;
}

function setActiveDieGlow(color) {
  Object.keys(diceEls).forEach(c => {
    const panel = diceEls[c].closest(".dice-panel");
    if (!panel) return;
    const isActiveColor = c === color;
    const canGlow =
      isActiveColor &&
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
      commonPos = nextCommon;
      continue;
    }

    homePos += 1;
    if (homePos > homeLen) return false;
  }

  if (enteredHome) {
    return homePos <= homeLen;
  }

  return !isBlockedByEnemyBlockade(commonPos, color);
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
  if (!isSfxEnabled) return;
  const src = SOUND_FILES[type];
  if (!src) return;
  const sound = new Audio(src);
  sound.volume = volume;
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
  clearResumeSnapshot();
  isMoving = false;
  clearHighlights();

  Object.keys(diceEls).forEach(c => {
    diceEls[c].style.pointerEvents = "none";
    const panel = diceEls[c].closest(".dice-panel");
    if (panel) panel.classList.remove("dice-active");
  });

  if (gameMode === "vs-computer" && player.color === humanColor) {
    let winCoins = 100;
    winCoins += activeSkinEffects.bonusWinCoins || 0;
    if (activeSkinEffects.winBonusPercent) {
      winCoins += Math.floor(winCoins * activeSkinEffects.winBonusPercent);
    }
    addCoins(winCoins);
  }

  if (gameMode === "vs-computer" && activeSkinEffects.bonusMatchCoins) {
    addCoins(activeSkinEffects.bonusMatchCoins);
  }

  if (gameMode === "vs-computer" && player.color === humanColor) {
    const storageKey = "ludo_unlocked_level";
    const unlocked = Math.max(1, Number(localStorage.getItem(storageKey) || "1"));
    const nextUnlocked = Math.max(unlocked, currentLevel + 1);
    localStorage.setItem(storageKey, String(nextUnlocked));
  }

  if (gameMode === "pass-play") {
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

function highlightMoves(playerIndex, dice) {
  clearHighlights();
  const player = state.players[playerIndex];
  if (player.isAI) return 0;

  const moves = getValidMovesForPlayer(playerIndex, dice);
  moves.forEach(({ tokenIndex }) => {
    const token = tokenEls[player.color][tokenIndex];
    if (dice === 6) token.classList.add("selectable-gold");
    else token.classList.add("selectable-black");
  });
  return moves.length;
}

function animateDiceRoll(color, onDone) {
  const diceEl = diceEls[color];
  diceEl.style.pointerEvents = "none";
  const spinX = 720 + Math.floor(Math.random() * 720);
  const spinY = 720 + Math.floor(Math.random() * 720);
  diceEl.style.transition = "transform 560ms cubic-bezier(.18,.78,.2,1)";
  diceEl.style.transform = `rotateX(${spinX}deg) rotateY(${spinY}deg)`;

  setTimeout(() => {
    const value = computeRollValue(color);
    state.diceValue = value;

     const player = state.players[state.currentPlayer];
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
  if (!extraTurn) {
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  }
  if (!extraTurn) {
    const current = state.players[state.currentPlayer];
    if (current) current.sixStreak = 0;
  }

  state.diceValue = null;
  hasRolledThisTurn = false;
  waitingForTokenMove = false;
  isMoving = false;
  clearHighlights();
  resetDiceInteractivity();

  if (state.players[state.currentPlayer].isAI) {
    setTimeout(runAITurn, 700);
  }
}

function handleTurn() {
  if (gameOver) return;
  const playerIndex = state.currentPlayer;
  if (state.players[playerIndex].isAI) return;
  if (state.diceValue === null) {
    waitingForTokenMove = false;
    state.players[playerIndex].sixStreak = 0;
    setTimeout(() => nextTurn(false), 250);
    return;
  }

  const movesCount = highlightMoves(playerIndex, state.diceValue);
  waitingForTokenMove = movesCount > 0;
  resetDiceInteractivity();
  if (movesCount === 0) {
    waitingForTokenMove = false;
    state.players[playerIndex].sixStreak = 0;
    setTimeout(() => nextTurn(false), 400);
  }
}

function rollDice() {
  if (gameOver) return;
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
  if (isMoving) return;

  const playerIndex = state.currentPlayer;
  const player = state.players[playerIndex];
  if (!player || !player.isAI) return;

  isMoving = true;
  animateDiceRoll(player.color, () => {
    resetDiceInteractivity();
    if (state.diceValue === null) {
      player.sixStreak = 0;
      isMoving = false;
      nextTurn(false);
      return;
    }
    const moves = getValidMovesForPlayer(playerIndex, state.diceValue);
    if (moves.length === 0) {
      player.sixStreak = 0;
      isMoving = false;
      nextTurn(false);
      return;
    }
    const chosen = pickAiMove(playerIndex, moves, state.diceValue);
    executeMove(chosen || moves[0]).catch(() => {
      isMoving = false;
      nextTurn(false);
    });
  });
}

async function moveIntoGoal(player, tokenIndex, token, color, extraTurn) {
  goalEls[color].appendChild(token);
  playSfx("goal", 0.65);
  token.dataset.path = "goal";
  player.tokens[tokenIndex] = -2;
  player.finished[tokenIndex] = true;

  if (isHumanVsComputerTurn(color) && activeSkinEffects.extraTurnEveryTwoHomes) {
    matchEffectState.homesCount += 1;
    if (matchEffectState.homesCount % 2 === 0) {
      pendingBonusTurn = true;
    }
  }

  if (checkAndShowWinner(state.currentPlayer)) return;
  isMoving = false;
  nextTurn(consumeBonusTurn(extraTurn));
}

async function executeMove(move) {
  try {
    if (gameOver) return;
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
    let moveSteps = (
      isHumanVsComputerTurn(color) &&
      activeSkinEffects.doubleMoveOnce &&
      !matchEffectState.doubleMoveUsed
    ) ? dice * 2 : dice;
    if (
      isHumanVsComputerTurn(color) &&
      activeSkinEffects.doubleMoveOnce &&
      !matchEffectState.doubleMoveUsed
    ) {
      matchEffectState.doubleMoveUsed = true;
      if (!canTokenMove(playerIndex, tokenIndex, moveSteps)) {
        moveSteps = dice;
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
    isMoving = false;
    nextTurn(consumeBonusTurn(true));
    return;
  }

    if (pathKey !== "common") {
    const remainingToGoal = path.length - pos;
    if (moveSteps === remainingToGoal) {
      for (let i = 1; i < moveSteps; i++) {
        path[pos + i].el.appendChild(token);
        playSfx("step", 0.35);
        await new Promise(r => setTimeout(r, 180));
      }
      await moveIntoGoal(player, tokenIndex, token, color, dice === 6);
      return;
    }

    for (let i = 1; i <= moveSteps; i++) {
      path[pos + i].el.appendChild(token);
      playSfx("step", 0.35);
      await new Promise(r => setTimeout(r, 180));
    }
    player.tokens[tokenIndex] += moveSteps;
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
      playSfx("step", 0.35);
      await new Promise(r => setTimeout(r, 180));
      continue;
    }

    if (!enteredHome) {
      commonPos = (commonPos + 1) % commonLen;
      PATHS.common[commonPos].el.appendChild(token);
      playSfx("step", 0.35);
      await new Promise(r => setTimeout(r, 180));
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
    playSfx("step", 0.35);
    await new Promise(r => setTimeout(r, 180));
  }

    if (enteredHome) {
      token.dataset.path = homePathKey;
      player.tokens[tokenIndex] = homePos;
    } else {
      player.tokens[tokenIndex] = commonPos;
      const captures = handleCaptureAt(commonPos, token);
      if (isHumanVsComputerTurn(color) && captures > 0) {
        if (activeSkinEffects.bonusCaptureCoins) {
          addCoins(activeSkinEffects.bonusCaptureCoins * captures);
        }
        if (activeSkinEffects.nextRollBoostAfterCapture) {
          matchEffectState.nextRollBoost = 1;
        }
      }
      if (isHumanVsComputerTurn(color) && activeSkinEffects.safeSquareExtraTurn && SAFE_INDICES.has(commonPos)) {
        pendingBonusTurn = true;
      }
    }

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
resetDiceInteractivity();
