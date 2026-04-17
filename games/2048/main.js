import { GRID_COLUMNS, GRID_ROWS, cloneGrid, createEmptyGrid, gridsEqual } from "./grid.js";
import { loadBestScore, saveBestScore } from "./state.js";
import { createThemeManager } from "./js/theme/themeManager.js";
import { createThemeEffects } from "./js/theme/themeEffects.js";
import { THEME_DEFINITIONS, getThemeById, getUnlockLabel } from "./js/theme/themes.js";

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
const BLOCKER_TILE = -1;

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
  levels: document.querySelector("[data-level-screen]"),
  game: document.querySelector("[data-game-screen]"),
  heroBoard: document.querySelector("[data-hero-board]"),
  playBtn: document.querySelector("[data-play-btn]"),
  resumeBtn: document.querySelector("[data-resume-btn]"),
  themeBtn: document.querySelector("[data-theme-btn]"),
  themeBackBtn: document.querySelector("[data-theme-back-btn]"),
  modeBtn: document.querySelector("[data-mode-btn]"),
  settingsBtn: document.querySelector("[data-settings-btn]"),
  levelBackBtn: document.querySelector("[data-level-back-btn]"),
  startLevelBtn: document.querySelector("[data-start-level-btn]"),
  levelGrid: document.querySelector("[data-level-grid]"),
  themeGrid: document.querySelector("[data-theme-grid]"),
  bestScoreTheme: document.querySelector("[data-best-score-theme]"),
  themeProgressScore: document.querySelector("[data-theme-progress-score]"),
  themeProgressMaxTile: document.querySelector("[data-theme-progress-max-tile]"),
  themeProgressGames: document.querySelector("[data-theme-progress-games]"),
  unlockedLevel: document.querySelector("[data-unlocked-level]"),
  selectedLevel: document.querySelector("[data-selected-level]"),
  selectedAiName: document.querySelector("[data-selected-ai-name]"),
  profileTitle: document.querySelector("[data-profile-title]"),
  profileSummary: document.querySelector("[data-profile-summary]"),
  profileDepth: document.querySelector("[data-profile-depth]"),
  profileMistake: document.querySelector("[data-profile-mistake]"),
  profileSpeed: document.querySelector("[data-profile-speed]"),
  homeBtn: document.querySelector("[data-home-btn]"),
  overlayHomeBtn: document.querySelector("[data-overlay-home]"),
  overlayRestartBtn: document.querySelector("[data-overlay-restart]"),
  restartBtn: document.querySelector("[data-restart]"),
  soundBtn: document.querySelector("[data-sound-toggle]"),
  board: document.querySelector("[data-board]"),
  comboBanner: document.querySelector("[data-combo-banner]"),
  bestScoreHome: document.querySelector("[data-best-score-home]"),
  bestScoreLevel: document.querySelector("[data-best-score-level]"),
  ammoPlayerCurrent: document.querySelector("[data-current-ammo]"),
  ammoPlayerNext: document.querySelector("[data-next-ammo]"),
  ammoAiCurrent: document.querySelector("[data-ai-current-ammo]"),
  ammoAiNext: document.querySelector("[data-ai-next-ammo]"),
  aiLauncher: document.querySelector("[data-ai-launcher]"),
  targetValue: document.querySelector("[data-target-value]"),
  gameMode: document.querySelector("[data-game-mode]"),
  modeDetailWrap: document.querySelector("[data-mode-detail-wrap]"),
  modeDetail: document.querySelector("[data-mode-detail]"),
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

const state = {
  modeIndex: 0,
  bestScore: loadBestScore(),
  unlockedLevel: clampLevel(loadStoredLevel(LEVEL_UNLOCK_KEY, 1)),
  selectedLevel: 1,
  activeLevel: 1,
  soundEnabled: true,
  roundActive: false,
  roundFinished: false,
  roundResult: "",
  currentTurn: "player",
  timeLeftMs: 0,
  timerIntervalId: null,
  playerMovesLeft: null,
  lastChaosEvent: ""
};

state.selectedLevel = clampLevel(loadStoredLevel(LEVEL_SELECTED_KEY, state.unlockedLevel));
if (state.selectedLevel > state.unlockedLevel) {
  state.selectedLevel = state.unlockedLevel;
}

const boardState = createBoardState(el.board, el.comboBanner);
const player = createActor("player", el.ammoPlayerCurrent, el.ammoPlayerNext);
const ai = createActor("ai", el.ammoAiCurrent, el.ammoAiNext);

let audioContext = null;
let heroState = createHeroState();
let heroIntervalId = null;
let aiMoveTimeoutId = null;
let activeAiProfile = getAiProfileForLevel(state.selectedLevel);
const levelButtons = [];
const themeCards = [];
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
    feedbackTimeoutId: null
  };
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

function initialize() {
  buildBoard(boardState);
  buildLevelGrid();
  buildThemeGrid();
  bindEvents();
  themeManager.loadTheme();
  renderHeroBoard();
  startHeroAutoplay();
  resetRound();
  syncThemeProgress();
  renderAll();
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

  el.modeBtn.addEventListener("click", () => {
    if (state.roundActive && !state.roundFinished) {
      stopAiLoop();
      stopModeTimer();
      state.roundActive = false;
      state.roundFinished = false;
      state.roundResult = "";
      state.currentTurn = "player";
    }

    state.modeIndex = (state.modeIndex + 1) % MODES.length;
    renderMetaButtons();
    renderGameHeader();
  });

  const toggleSound = () => {
    state.soundEnabled = !state.soundEnabled;
    renderSound();
  };

  el.settingsBtn.addEventListener("click", toggleSound);
  el.soundBtn.addEventListener("click", toggleSound);

  el.levelBackBtn.addEventListener("click", showHome);
  el.themeBackBtn.addEventListener("click", showHome);
  el.startLevelBtn.addEventListener("click", startSelectedLevel);

  el.homeBtn.addEventListener("click", showHome);
  el.overlayHomeBtn.addEventListener("click", showHome);
  el.restartBtn.addEventListener("click", restartLevel);
  el.overlayRestartBtn.addEventListener("click", restartLevel);

  window.addEventListener("resize", updateBoardScale, { passive: true });
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);
}

function showHome() {
  stopAiLoop();
  stopModeTimer();
  el.home.classList.remove("hidden");
  el.themes.classList.add("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.add("hidden");
  renderAll();
}

function showThemes() {
  stopAiLoop();
  stopModeTimer();
  el.home.classList.add("hidden");
  el.themes.classList.remove("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.add("hidden");
  renderThemeScreen();
}

function showLevels() {
  stopAiLoop();
  stopModeTimer();
  el.home.classList.add("hidden");
  el.themes.classList.add("hidden");
  el.levels.classList.remove("hidden");
  el.game.classList.add("hidden");
  renderLevels();
}

function showGame() {
  el.home.classList.add("hidden");
  el.themes.classList.add("hidden");
  el.levels.classList.add("hidden");
  el.game.classList.remove("hidden");
  if (isSpeedMode() && state.roundActive && !state.roundFinished) {
    startModeTimer();
  }
  window.requestAnimationFrame(updateBoardScale);
}

function isGameVisible() {
  return !el.game.classList.contains("hidden");
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
      saveStoredLevel(LEVEL_SELECTED_KEY, level);
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
    button.innerHTML = `
      <div class="theme-card-head">
        <h3 class="theme-card-title">${theme.name}</h3>
        <span class="theme-card-status" data-theme-card-status>${theme.unlock.type === "default" ? "Default" : "Locked"}</span>
      </div>
      <p class="theme-card-tagline">${theme.tagline}</p>
      <div class="theme-preview" data-theme-preview>${previewTiles}</div>
      <p class="theme-card-copy">${theme.description}</p>
      <div class="theme-card-footer">
        <span class="theme-card-unlock">${getUnlockLabel(theme)}</span>
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

function renderThemeScreen() {
  const activeTheme = themeManager.getTheme();
  const unlocked = new Set(themeManager.getUnlockedThemeIds());
  const progress = themeManager.getProgress();

  el.bestScoreTheme.textContent = state.bestScore.toLocaleString();
  el.themeProgressScore.textContent = progress.bestScore.toLocaleString();
  el.themeProgressMaxTile.textContent = String(progress.maxTile);
  el.themeProgressGames.textContent = String(progress.gamesPlayed);

  for (const card of themeCards) {
    const themeId = card.dataset.themeId || "";
    const theme = getThemeById(themeId);
    const isUnlocked = unlocked.has(themeId);
    const isActive = activeTheme.id === themeId;
    const status = card.querySelector("[data-theme-card-status]");

    card.classList.toggle("is-locked", !isUnlocked);
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-label", `${theme.name}${isUnlocked ? "" : " locked"}`);
    card.disabled = false;

    if (status) {
      status.textContent = isUnlocked ? (isActive ? "Active" : "Unlocked") : "Locked";
      status.classList.toggle("is-locked", !isUnlocked);
    }

    const previewTiles = card.querySelectorAll("[data-preview-value]");
    for (const previewTile of previewTiles) {
      const value = Number.parseInt(previewTile.dataset.previewValue || "0", 10);
      applyTileVisualStyle(previewTile, value, getVisualLevel());
    }
  }
}

function renderLevels() {
  const profile = getAiProfileForLevel(state.selectedLevel);
  const targetText = formatBigInt(getLevelTarget(state.selectedLevel));

  el.unlockedLevel.textContent = String(state.unlockedLevel);
  el.selectedLevel.textContent = String(state.selectedLevel);
  el.selectedAiName.textContent = profile.name;

  el.profileTitle.textContent = profile.name;
  el.profileSummary.textContent = `${profile.summary} Target: ${targetText}`;
  el.profileDepth.textContent = `Depth: ${profile.depthDisplay}`;
  el.profileMistake.textContent = `Mistake: ${Math.round(profile.mistakeRate * 100)}%`;
  el.profileSpeed.textContent = `Speed: ${profile.speedLabel}`;

  el.startLevelBtn.textContent = `START LEVEL ${state.selectedLevel} - ${targetText}`;

  for (const button of levelButtons) {
    const level = Number.parseInt(button.dataset.level || "", 10);
    const locked = level > state.unlockedLevel;

    button.classList.toggle("is-locked", locked);
    button.classList.toggle("is-selected", level === state.selectedLevel);
    button.disabled = locked;
  }

  renderScoreboard();
}

function startSelectedLevel() {
  state.activeLevel = state.selectedLevel;
  activeAiProfile = getAiProfileForLevel(state.activeLevel);
  state.roundActive = true;
  state.roundFinished = false;
  state.roundResult = "";
  state.currentTurn = "player";

  const unlockedNow = themeManager.incrementGamesPlayed();
  if (unlockedNow.length > 0) {
    showSystemBanner(`THEME UNLOCKED: ${unlockedNow[0].name.toUpperCase()}`);
  }

  resetRound();
  syncThemeProgress();
  renderAll();
  showGame();
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

  resetRound();
  renderAll();
  showGame();
}

function resetRound() {
  stopAiLoop();
  stopModeTimer();
  resetBoard(boardState);
  resetActor(player);
  resetActor(ai);
  setupModeState();
  hideGameOverPanel();
  updateBoardScale();
}

function resetBoard(board) {
  board.grid = createEmptyGrid(board.rows, board.cols);
  board.score = 0;
  board.maxTile = 0;
  board.isAnimating = false;
  clearAnimationLayer(board);
  board.boardElement.classList.remove("is-game-over", "is-glow", "is-shaking", "is-blocked");
}

function resetActor(actor) {
  actor.score = 0;
  actor.shotCount = 0;
  actor.currentAmmo = createAmmoValue(state.modeIndex);
  actor.nextAmmo = createAmmoValue(state.modeIndex);
}

function getCurrentMode() {
  return MODES[state.modeIndex];
}

function isSoloMode() {
  return getCurrentMode().id === "solo";
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

function setupModeState() {
  state.timeLeftMs = 0;
  state.playerMovesLeft = null;
  state.lastChaosEvent = "";

  if (isSpeedMode()) {
    state.timeLeftMs = 60000;
    startModeTimer();
  }

  if (isPuzzleMode()) {
    state.playerMovesLeft = getPuzzleMoveLimit(state.activeLevel);
    boardState.grid = createPuzzleBoard(state.activeLevel);
    boardState.maxTile = getMaxTile(boardState.grid);
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

function applyScoreMultiplier(score) {
  if (!isSpeedMode()) {
    return score;
  }

  return Math.round(score * 1.75);
}

function applyModeAfterShot(actor) {
  if (isPuzzleMode() && actor.kind === "player") {
    state.playerMovesLeft = Math.max(0, (state.playerMovesLeft ?? 0) - 1);
  }

  if (isChaosMode()) {
    triggerChaosEvent();
  }
}

function triggerChaosEvent() {
  if (Math.random() > 0.34) {
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

  const result = await executeShot(player, column, true);
  if (result === "placed" && !state.roundFinished) {
    if (isSoloMode()) {
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

  const outcome = getShotOutcome(boardState.grid, column);
  if (outcome.type === "blocked") {
    triggerBlockedFeedback(boardState);
    if (withAudio) {
      playBlockedSound();
    }

    if (!hasAnyValidShots(boardState.grid)) {
      finishRound("board-full");
    }

    renderAll();
    return "blocked";
  }

  boardState.isAnimating = true;

  if (withAudio) {
    playShotSound();
  }

  try {
    await animateShot(boardState, column, actor.currentAmmo, outcome.row);
  } catch (error) {
    clearAnimationLayer(boardState);
  }

  boardState.grid[outcome.row][column] = actor.currentAmmo;
  addTileEffectClass(boardState, outcome.row, column, "tile-spawn-pop");
  themeEffects.applySpawnEffect(getTileElement(boardState, outcome.row, column), actor.currentAmmo);

  if (withAudio) {
    playLandingSound(actor.currentAmmo);
  }

  const mergeResult = resolveAdjacentMerges(boardState.grid);
  const scoreGained = applyScoreMultiplier(mergeResult.scoreGained);
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
    }

    triggerMergeFeedback(boardState, mergeResult.maxMergedValue);

    if (mergeResult.comboCount > 1) {
      showComboBanner(actor, mergeResult.comboCount);
      await wait(Math.min(150, 55 + mergeResult.comboCount * 20));
    }
  }

  actor.shotCount += 1;
  actor.currentAmmo = actor.nextAmmo;
  actor.nextAmmo = createAmmoValue(state.modeIndex);
  applyModeAfterShot(actor);
  boardState.isAnimating = false;

  renderAll();

  if (hasReachedLevelTarget(boardState.maxTile, state.activeLevel)) {
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
  stopAiLoop();
  stopModeTimer();
  boardState.boardElement.classList.add("is-game-over");

  const targetText = formatBigInt(getLevelTarget(state.activeLevel));

  if (result === "player-win") {
    if (state.activeLevel === state.unlockedLevel && state.unlockedLevel < LEVEL_COUNT) {
      state.unlockedLevel += 1;
      saveStoredLevel(LEVEL_UNLOCK_KEY, state.unlockedLevel);
    }

    state.roundResult = `You reached ${targetText}.`;
    showGameOverPanel("Level Cleared", "You Win", `You reached the ${targetText} tile before the AI.`);
  } else if (result === "ai-win") {
    state.roundResult = `AI reached ${targetText}.`;
    showGameOverPanel("Level Lost", "AI Wins", `The AI reached the ${targetText} tile first.`);
  } else if (result === "timeout") {
    state.roundResult = `Time expired before ${targetText}.`;
    showGameOverPanel("Time Up", "Level Failed", `The timer hit zero before anyone reached ${targetText}.`);
  } else if (result === "moves-over") {
    state.roundResult = `Moves exhausted before ${targetText}.`;
    showGameOverPanel("Puzzle Failed", "Out of Moves", `You used all available moves before reaching ${targetText}.`);
  } else {
    state.roundResult = `Board locked before ${targetText}.`;
    showGameOverPanel("Level Failed", "Board Locked", `No more valid shots were left before anyone reached ${targetText}.`);
  }

  syncThemeProgress();
  renderAll();
}

function showGameOverPanel(kicker, title, copy) {
  el.gameOverKicker.textContent = kicker;
  el.gameOverTitle.textContent = title;
  el.gameOverCopy.textContent = copy;
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
  renderStatus();
  renderSound();
  renderMetaButtons();
  renderThemeScreen();
  renderLevels();
}

function renderBoard(board) {
  const visualLevel = getVisualLevel();
  let index = 0;

  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const value = board.grid[row][col];
      const tile = board.tileElements[index];

      tile.className = `tile ${getTileClass(value)}`;
      tile.dataset.value = String(value);
      tile.dataset.digits = String(value).length;
      tile.textContent = value === 0 ? "" : value === BLOCKER_TILE ? "X" : String(value);
      applyTileVisualStyle(tile, value, visualLevel);
      index += 1;
    }
  }

  applyNearMergeHints(board);
  board.boardElement.classList.toggle("is-game-over", state.roundFinished);
}

function renderAmmo() {
  renderAmmoTile(player.currentAmmoElement, player.currentAmmo, "Your current tile");
  renderAmmoTile(player.nextAmmoElement, player.nextAmmo, "Your next tile");
  renderAmmoTile(ai.currentAmmoElement, ai.currentAmmo, "AI current tile");
  renderAmmoTile(ai.nextAmmoElement, ai.nextAmmo, "AI next tile");
}

function renderAmmoTile(element, value, label) {
  const baseClass = element.classList.contains("shot-tile") ? "shot-tile" : "shot-next";
  element.className = `${baseClass} tile ${getTileClass(value)}`;
  element.dataset.value = String(value);
  element.dataset.digits = String(value).length;
  element.textContent = String(value);
  element.setAttribute("aria-label", `${label}: ${value}`);
  applyTileVisualStyle(element, value, getVisualLevel());
}

function renderScoreboard() {
  const best = state.bestScore.toLocaleString();
  el.bestScoreHome.textContent = best;
  el.bestScoreLevel.textContent = best;
  el.bestScoreTheme.textContent = best;
}

function renderGameHeader() {
  el.targetValue.textContent = formatBigInt(getLevelTarget(state.activeLevel));
  const mode = getCurrentMode();
  el.gameMode.textContent = mode.label;
  el.aiLauncher.classList.toggle("hidden", isSoloMode());

  let detailText = "";
  if (isSpeedMode()) {
    detailText = formatTimeLeft(state.timeLeftMs);
  } else if (isPuzzleMode()) {
    detailText = `${state.playerMovesLeft ?? 0} moves`;
  } else if (isChaosMode() && state.lastChaosEvent) {
    detailText = state.lastChaosEvent;
  }

  el.modeDetailWrap.classList.toggle("hidden", detailText === "");
  el.modeDetail.textContent = detailText;
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
    el.status.textContent = `Your turn. Place ${player.currentAmmo}.${modeText}`;
    return;
  }

  el.status.textContent = `AI is placing ${ai.currentAmmo}.`;
}

function renderSound() {
  el.soundBtn.classList.toggle("is-muted", !state.soundEnabled);
  el.soundBtn.textContent = state.soundEnabled ? "||" : "x";
  el.soundBtn.setAttribute("aria-label", state.soundEnabled ? "Sound on" : "Sound off");
  el.settingsBtn.setAttribute("aria-label", state.soundEnabled ? "Sound on" : "Sound off");
}

function renderMetaButtons() {
  el.themeBtn.textContent = `Theme: ${themeManager.getTheme().name}`;
  el.modeBtn.textContent = `Mode: ${MODES[state.modeIndex].homeLabel}`;
}

function updateBoardScale() {
  updateBoardScaleFor(boardState);

  const cellRect = boardState.cellElements[0]?.getBoundingClientRect();
  if (cellRect && cellRect.width > 0) {
    document.documentElement.style.setProperty("--cell-size", `${cellRect.width}px`);
  }
}

function updateBoardScaleFor(board) {
  const width = board.boardElement.getBoundingClientRect().width;
  if (!Number.isFinite(width) || width <= 0) {
    return;
  }

  const size = Math.max(10, Math.min(28, width / (board.cols * 1.25)));
  board.boardElement.style.setProperty("--tile-font-size-base", `${size}px`);
}

function applyNearMergeHints(board) {
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const tile = getTileElement(board, row, col);
      if (tile) {
        tile.classList.remove("tile-near-merge");
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
  }
}

function scheduleAiTurn(immediate = false) {
  if (!state.roundActive || state.roundFinished || isSoloMode() || state.currentTurn !== "ai" || boardState.isAnimating || !isGameVisible()) {
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
  if (!state.roundActive || state.roundFinished || isSoloMode() || state.currentTurn !== "ai" || boardState.isAnimating || !isGameVisible()) {
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

  const ammos = getSearchAmmoDistribution(state.modeIndex, profile.ammoSamples);
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

function getSearchAmmoDistribution(modeIndex, samples) {
  const distribution = getAmmoDistribution(modeIndex)
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

  const depth = Math.round(lerp(tier.depth[0], tier.depth[1], progress));
  const mistakeRate = clamp(lerp(tier.mistake[0], tier.mistake[1], progress), 0, 1);
  const speedMs = Math.round(lerp(tier.speed[0], tier.speed[1], progress));
  const speedLabel = speedMs >= 1050 ? "Slow" : speedMs >= 700 ? "Medium" : "Fast";
  const depthDisplay = tier.depth[0] === tier.depth[1] ? String(tier.depth[0]) : `${tier.depth[0]}-${tier.depth[1]}`;

  return {
    ...tier,
    depth,
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
  const merge = resolveAdjacentMerges(nextGrid);

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

function resolveAdjacentMerges(grid) {
  let totalScore = 0;
  let comboCount = 0;
  let maxMergedValue = 0;
  const mergedCells = [];
  let mergedInPass = false;

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
          merges.push({ keepRow: row, keepCol: col, clearRow: row, clearCol: rightCol, nextValue: currentValue * 2 });
          mergedFlags.add(currentKey);
          mergedFlags.add(`${row},${rightCol}`);
          continue;
        }

        if (downRow < grid.length && grid[downRow][col] === currentValue && !mergedFlags.has(`${downRow},${col}`)) {
          merges.push({ keepRow: row, keepCol: col, clearRow: downRow, clearCol: col, nextValue: currentValue * 2 });
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
    }

    collapseColumnsTopToBottom(grid);
  } while (mergedInPass);

  return { scoreGained: totalScore, comboCount, maxMergedValue, mergedCells };
}

function collapseColumnsTopToBottom(grid) {
  for (let col = 0; col < grid[0].length; col += 1) {
    const values = [];

    for (let row = 0; row < grid.length; row += 1) {
      if (grid[row][col] !== 0) {
        values.push(grid[row][col]);
      }
    }

    for (let row = 0; row < grid.length; row += 1) {
      grid[row][col] = values[row] ?? 0;
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
  ghost.textContent = String(value);
  ghost.style.width = `${targetRect.width}px`;
  ghost.style.height = `${targetRect.height}px`;
  ghost.style.left = `${left}px`;
  ghost.style.top = `${top}px`;

  board.animationLayer.append(ghost);
  return ghost;
}

function animateShotGhost(ghost, boardRect, targetRect) {
  const startTop = boardRect.height + targetRect.height * 0.25;
  const endTop = targetRect.top - boardRect.top;
  const deltaY = endTop - startTop;
  const duration = getShotTravelMs();
  const easing = getThemeAnimationEasing();

  themeEffects.applyMoveEffect(ghost, Number.parseInt(ghost.textContent || "0", 10));

  if (typeof ghost.animate === "function") {
    const animation = ghost.animate(
      [
        { transform: "translate3d(0px, 0px, 0px) scale(0.92)", opacity: 0.96 },
        { transform: `translate3d(0px, ${deltaY}px, 0px) scale(1)`, opacity: 1 }
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

  board.boardElement.style.filter = `drop-shadow(0 0 ${Math.round(10 + 20 * progressive * intensity)}px rgba(120, 186, 255, ${glowStrength.toFixed(2)}))`;
  board.boardElement.classList.add("is-glow");

  if (maxMergedValue >= shakeThreshold) {
    board.boardElement.classList.remove("is-shaking");
    void board.boardElement.offsetWidth;
    board.boardElement.classList.add("is-shaking");
  }

  if (board.feedbackTimeoutId) {
    window.clearTimeout(board.feedbackTimeoutId);
  }

  board.feedbackTimeoutId = window.setTimeout(() => {
    board.boardElement.classList.remove("is-glow");
    board.boardElement.classList.remove("is-shaking");
    board.boardElement.style.filter = "";
  }, Math.max(120, Math.round(220 * speed)));
}

function showComboBanner(actor, comboCount) {
  boardState.comboElement.textContent = `${actor.kind === "player" ? "YOU" : "AI"} COMBO x${comboCount}`;
  boardState.comboElement.classList.toggle("is-ai", actor.kind === "ai");
  boardState.comboElement.classList.remove("is-visible");
  void boardState.comboElement.offsetWidth;
  boardState.comboElement.classList.add("is-visible");
  themeEffects.applyComboEffect(comboCount, boardState.comboElement);

  if (boardState.comboTimeoutId) {
    window.clearTimeout(boardState.comboTimeoutId);
  }

  boardState.comboTimeoutId = window.setTimeout(() => {
    boardState.comboElement.classList.remove("is-visible");
  }, 560);
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
    bestScore: state.bestScore,
    maxTile: boardState.maxTile
  });

  if (unlockedNow.length > 0) {
    showSystemBanner(`THEME UNLOCKED: ${unlockedNow[0].name.toUpperCase()}`);
  }
}

function createAmmoValue(modeIndex) {
  const distribution = getAmmoDistribution(modeIndex);
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

function getAmmoDistribution(modeIndex) {
  const modeId = MODES[modeIndex]?.id ?? "classic";

  if (modeId === "speed") {
    return [
      { value: 2, probability: 0.3 },
      { value: 4, probability: 0.28 },
      { value: 8, probability: 0.22 },
      { value: 16, probability: 0.14 },
      { value: 32, probability: 0.06 }
    ];
  }

  if (modeId === "puzzle") {
    return [
      { value: 2, probability: 0.52 },
      { value: 4, probability: 0.24 },
      { value: 8, probability: 0.16 },
      { value: 16, probability: 0.08 }
    ];
  }

  if (modeId === "chaos") {
    return [
      { value: 2, probability: 0.22 },
      { value: 4, probability: 0.22 },
      { value: 8, probability: 0.2 },
      { value: 16, probability: 0.18 },
      { value: 32, probability: 0.12 },
      { value: 64, probability: 0.06 }
    ];
  }

  return [
    { value: 2, probability: 0.4 },
    { value: 4, probability: 0.22 },
    { value: 8, probability: 0.16 },
    { value: 16, probability: 0.12 },
    { value: 32, probability: 0.07 },
    { value: 64, probability: 0.03 }
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
  return Math.max(90, Math.round(base * speed));
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

function applyLevelVisualTheme(level) {
  const palette = getLevelPalette(level, themeManager.getTheme());

  document.body.style.setProperty("--bg-1", palette.bg1);
  document.body.style.setProperty("--bg-2", palette.bg2);
  document.body.style.setProperty("--bg-3", palette.bg3);
  document.body.style.setProperty("--glow-1", palette.glow1);
  document.body.style.setProperty("--glow-2", palette.glow2);
}

function getLevelPalette(level, theme) {
  const progress = clamp((level - 1) / Math.max(1, LEVEL_COUNT - 1), 0, 1);
  const palette = theme?.palette || {};
  const themeShift = Number(palette.hueShift || 0);
  const glowBoost = Number(palette.glowBoost || 1);
  const hueA = (208 + level * 11 + themeShift) % 360;
  const hueB = (hueA + 70 + progress * 90) % 360;
  const hueC = (hueA + 150 + progress * 70) % 360;
  const richness = 54 + progress * 28 + Number(palette.saturationBoost || 0) * 0.14;
  const depth = 7 + progress * 4;
  return {
    bg1: `hsl(${hueA} ${richness}% ${depth}%)`,
    bg2: `hsl(${hueB} ${Math.min(92, richness + 8)}% ${depth + 6}%)`,
    bg3: `hsl(${hueC} ${Math.min(94, richness + 12)}% ${depth + 12}%)`,
    glow1: `hsla(${hueA}, ${78 + progress * 18}%, ${56 + progress * 10}%, ${(0.22 + progress * 0.18) * glowBoost})`,
    glow2: `hsla(${hueB}, ${82 + progress * 12}%, ${58 + progress * 10}%, ${(0.18 + progress * 0.16) * glowBoost})`
  };
}

function applyTileVisualStyle(element, value, level) {
  if (value === 0) {
    element.style.background = "";
    element.style.color = "";
    element.style.borderColor = "";
    element.style.boxShadow = "";
    return;
  }

  if (value === BLOCKER_TILE) {
    element.style.background = "linear-gradient(135deg, #6c7387, #353b49)";
    element.style.color = "#eef4ff";
    element.style.borderColor = "rgba(255,255,255,0.18)";
    element.style.boxShadow = "0 10px 18px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.18)";
    return;
  }

  const theme = themeManager.getTheme();
  const palette = theme.palette || {};
  const intensity = theme.effectIntensity?.multiplier || 1;
  const progress = clamp((level - 1) / Math.max(1, LEVEL_COUNT - 1), 0, 1);
  const exp = Math.max(1, Math.log2(value));
  const hueA = (level * 17 + exp * 23 + 190 + Number(palette.tileHueShift || 0)) % 360;
  const hueB = (hueA + 32 + progress * 110) % 360;
  const sat = 52 + progress * 34 + Number(palette.saturationBoost || 0);
  const topLight = Math.max(42, 74 - exp * 2 + progress * 5 + intensity * 2);
  const bottomLight = Math.max(28, 56 - exp * 1.6 + progress * 4);
  const textColor = topLight > 64 ? "#122340" : "#f8fbff";

  element.style.background = `linear-gradient(135deg, hsl(${hueA} ${sat}% ${topLight}%), hsl(${hueB} ${Math.min(98, sat + 10)}% ${bottomLight}%))`;
  element.style.color = textColor;
  element.style.borderColor = `hsla(${hueB}, 96%, ${Math.min(92, 74 + progress * 16)}%, 0.34)`;
  element.style.boxShadow = `0 10px 18px rgba(0, 0, 0, 0.34), inset 0 1px 0 hsla(${hueA}, 100%, 96%, ${0.18 + progress * 0.18})`;
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
}

function ensureAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }

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

  return audioContext;
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

function playShotSound() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const profile = getThemeSoundProfile();
  const pitch = Number(profile.pitchMultiplier || 1);
  const volume = Number(profile.volumeMultiplier || 1);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = profile.shotWave || "triangle";
  osc.frequency.setValueAtTime(240 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(380 * pitch, now + 0.05);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.028 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

function playLandingSound(value) {
  const ctx = ensureAudioContext();
  if (!ctx) return;
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
  gain.gain.exponentialRampToValueAtTime(0.05 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

function playMergeSound(value, comboCount = 1) {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const profile = getThemeSoundProfile();
  const pitch = Number(profile.pitchMultiplier || 1);
  const volume = Number(profile.volumeMultiplier || 1);

  const now = ctx.currentTime;
  const shift = Math.max(0, Math.min(10, Math.log2(value) - 1));
  const root = (360 + shift * 26) * pitch;

  playMergeTone(ctx, now, profile.mergeWave || "sine", root, 0.09 * volume, 0.22);
  playMergeTone(ctx, now + 0.02, profile.mergeWave || "triangle", root * 1.5, 0.06 * volume, 0.21);

  if (comboCount > 1) {
    const layers = Math.min(3, comboCount - 1);

    for (let i = 0; i < layers; i += 1) {
      playMergeTone(ctx, now + 0.03 + i * 0.016, profile.mergeWave || "sine", root * (1.2 + i * 0.15), 0.045 * volume, 0.16);
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
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playBlockedSound() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
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
  gain.gain.exponentialRampToValueAtTime(0.028 * volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
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
  return 256n << BigInt(Math.max(0, level - 1));
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

function formatBigInt(value) {
  return value.toLocaleString();
}

function formatTimeLeft(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const seconds = Math.max(0, totalSeconds % 60);
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getPuzzleMoveLimit(level) {
  return Math.max(8, 16 - Math.min(8, Math.floor((level - 1) / 2)));
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

function showSystemBanner(text) {
  boardState.comboElement.textContent = text;
  boardState.comboElement.classList.add("is-ai");
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
