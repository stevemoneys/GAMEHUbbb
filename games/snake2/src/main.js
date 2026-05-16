import { gameConfig } from "./config/gameConfig.js";
import { SnakeSystem } from "./systems/SnakeSystem.js";
import { CanvasRenderer } from "./rendering/CanvasRenderer.js";
import { InputController } from "./input/InputController.js";
import { GameEngine } from "./core/GameEngine.js";
import { GameState } from "./core/GameState.js";
import { Collision } from "./systems/Collision.js";
import { ScoreManager } from "./systems/ScoreManager.js";
import { ParticleSystem } from "./rendering/ParticleSystem.js";
import { ScreenShake } from "./rendering/ScreenShake.js";
import { ObstacleSystem } from "./systems/ObstacleSystem.js";
import { ModifierSystem } from "./systems/ModifierSystem.js";
import { DifficultyScaler } from "./systems/DifficultyScaler.js";
import { AISnake } from "./ai/AISnake.js";
import { AIController } from "./ai/AIController.js";
import { ModeManager } from "./modes/ModeManager.js";
import { ProgressionManager } from "./progression/ProgressionManager.js";
import { DuelManager } from "./duel/DuelManager.js";
import { HomeScreen } from "./ui/HomeScreen.js";
import { HUDSystem } from "./ui/HUDSystem.js";
import { ThemeManager } from "./themes/ThemeManager.js";
import { CosmeticShop } from "./shop/CosmeticShop.js";
import { PerformanceManager } from "./performance/PerformanceManager.js";
import { AdaptiveQuality } from "./performance/AdaptiveQuality.js";
import { RenderOptimizer } from "./performance/RenderOptimizer.js";
import { FPSMonitor } from "./debug/FPSMonitor.js";
import { PerformanceOverlay } from "./debug/PerformanceOverlay.js";
import { WorldManager } from "./world/WorldManager.js";
import { CameraSystem } from "./camera/CameraSystem.js";
import { WorldRenderer } from "./rendering/WorldRenderer.js";
import { FoodManager } from "./food/FoodManager.js";
import { FoodEffects } from "./food/FoodEffects.js";
import { PowerUpManager } from "./powerups/PowerUpManager.js";
import { EvolutionFragmentSystem } from "./progression/EvolutionFragmentSystem.js";

const canvas = document.getElementById("gameCanvas");
const appRoot = document.querySelector(".app");
const gameShell = document.querySelector(".game-shell");
const pauseBtn = document.getElementById("pauseBtn");
const homeRoot = document.getElementById("homeScreen");
const touchButtons = Array.from(document.querySelectorAll(".touch-btn[data-dir]"));

if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Missing #gameCanvas element");
if (!(pauseBtn instanceof HTMLButtonElement)) throw new Error("Missing #pauseBtn element");
if (!(gameShell instanceof HTMLElement)) throw new Error("Missing .game-shell element");
if (!(appRoot instanceof HTMLElement)) throw new Error("Missing .app element");

const runtimeConfig = structuredClone(gameConfig);
const modeLabels = {
  classic: "Classic",
  speed: "Speed",
  survival: "Survival",
  duel: "Duel"
};
const UI_SETTINGS_KEY = "snake2_ui_settings_v1";
const QUALITY_OPTIONS = ["auto", "low", "medium", "high", "ultra"];

function loadUISettings() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function saveUISettings(settings) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (_error) {
    // Ignore storage write errors in restricted contexts.
  }
}

const persistedUISettings = loadUISettings();

function sanitizeQualityMode(value, fallback = "auto") {
  const normalized = String(value || "").toLowerCase();
  if (QUALITY_OPTIONS.includes(normalized)) return normalized;
  return fallback;
}

const uiSettings = {
  quality: sanitizeQualityMode(persistedUISettings.quality, runtimeConfig.render.quality),
  vibration: typeof persistedUISettings.vibration === "boolean"
    ? persistedUISettings.vibration
    : true,
  audio: typeof persistedUISettings.audio === "boolean"
    ? persistedUISettings.audio
    : true,
  reducedMotion: typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false
};
const QUALITY_CYCLE = ["low", "medium", "high", "ultra"];

const themeManager = new ThemeManager();
let currentThemeVisuals = themeManager.getRuntimeVisuals();

function applyQualityProfile(config, requestedProfile) {
  let profile = String(requestedProfile || config.render.quality || "high").toLowerCase();
  if (profile === "auto") {
    const cores = Number.isFinite(navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : 6;
    const memory = Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : 8;
    if (cores <= 4 || memory <= 3) profile = "low";
    else if (cores <= 6 || memory <= 6) profile = "medium";
    else profile = "high";
  }
  if (!QUALITY_OPTIONS.includes(profile)) profile = "high";

  config.render.quality = profile;

  if (profile === "low") {
    config.render.trailMaxPoints = 40;
    config.render.foodOrbitCount = 2;
    config.vfx.particles.maxParticles = 60;
    config.vfx.particles.burstCount = 10;
    return profile;
  }
  if (profile === "medium") {
    config.render.trailMaxPoints = 56;
    config.render.foodOrbitCount = 3;
    config.vfx.particles.maxParticles = 92;
    config.vfx.particles.burstCount = 14;
    return profile;
  }

  if (profile === "ultra") {
    config.render.trailMaxPoints = 96;
    config.render.foodOrbitCount = 5;
    config.vfx.particles.maxParticles = 180;
    config.vfx.particles.burstCount = 22;
    return profile;
  }

  config.render.trailMaxPoints = 72;
  config.render.foodOrbitCount = 4;
  config.vfx.particles.maxParticles = 130;
  config.vfx.particles.burstCount = 18;
  return profile;
}

function applyThemeVisuals(visuals, config) {
  if (!visuals) return;
  config.render.worldBackgroundTop = visuals.worldTop;
  config.render.worldBackgroundBottom = visuals.worldBottom;
  config.render.hudTextColor = visuals.hudText;
  config.render.gridMinorAlpha = visuals.gridMinor;
  config.render.gridMajorAlpha = visuals.gridMajor;

  currentThemeVisuals = visuals;

  document.documentElement.setAttribute("data-theme", visuals.id || "neon_velocity");
  document.documentElement.style.setProperty("--active-theme-accent", visuals.uiAccent || "#00e5ff");
  document.documentElement.style.setProperty("--active-theme-accent-soft", `${visuals.uiAccent || "#00e5ff"}44`);
  document.documentElement.style.setProperty("--active-theme-bg-a", config.render.worldBackgroundTop);
  document.documentElement.style.setProperty("--active-theme-bg-b", config.render.worldBackgroundBottom);
}

applyQualityProfile(runtimeConfig);
runtimeConfig.world.cellSize = runtimeConfig.render.worldWidth / runtimeConfig.world.cols;
applyThemeVisuals(currentThemeVisuals, runtimeConfig);

const renderer = new CanvasRenderer(canvas, runtimeConfig);
const worldManager = new WorldManager(runtimeConfig);
worldManager.initialize(runtimeConfig.modes.defaultMode);
worldManager.applyToRenderer(renderer);
renderer.resizeToParent();
const cameraSystem = new CameraSystem(runtimeConfig, worldManager);
const worldRenderer = new WorldRenderer(renderer, worldManager);
const initialViewport = renderer.getViewportMetrics();
cameraSystem.setViewportPixels(initialViewport.viewportWidth, initialViewport.viewportHeight);

const renderOptimizer = new RenderOptimizer(renderer);
const fpsMonitor = new FPSMonitor(24);
const perfOverlay = new PerformanceOverlay({ root: document.body });
perfOverlay.init();

const playerSnake = new SnakeSystem(runtimeConfig);
const foodSystem = new FoodManager(runtimeConfig);
const scoreManager = new ScoreManager();
const gameState = new GameState();
const particleSystem = new ParticleSystem(runtimeConfig);
const screenShake = new ScreenShake(runtimeConfig);
const obstacleSystem = new ObstacleSystem();
const modifierSystem = new ModifierSystem();
const difficultyScaler = new DifficultyScaler();
difficultyScaler.setLevel(runtimeConfig.modes.difficulty);
const aiSnake = new AISnake(runtimeConfig);
const aiController = new AIController({ personality: runtimeConfig.ai.defaultPersonality });
const progressionManager = new ProgressionManager();
const duelManager = new DuelManager(runtimeConfig, progressionManager);
const powerUpManager = new PowerUpManager(runtimeConfig);
const evolutionFragmentSystem = new EvolutionFragmentSystem();
const perfManager = new PerformanceManager({
  initialMode: runtimeConfig.render.quality,
  autoQuality: true,
  onQualityChange: (mode, reason) => {
    applyRuntimeQualityMode(mode, `auto:${reason}`);
  }
});

const modeState = { warningTimer: 0 };

let foodImpactFlash = 0;
let input = null;
let homeScreen = null;
let cosmeticShop = null;
let currentRenderState = null;
let selectedMode = runtimeConfig.modes.defaultMode;
let runStartStageId = progressionManager.getSnapshot().stage.id;
let previousScore = 0;
let previousCombo = 0;
let runMaxCombo = 0;
let isPaused = false;
let lowPowerMode = false;
let visibilityLowPower = false;
let hudSystem = null;

function applyRuntimeQualityMode(mode, source = "manual") {
  const normalized = applyQualityProfile(runtimeConfig, mode);
  const profile = AdaptiveQuality.getQualityProfile(normalized);

  runtimeConfig.render.trailMaxPoints = profile.trailMaxPoints;
  runtimeConfig.render.foodOrbitCount = profile.foodOrbitCount;
  runtimeConfig.vfx.particles.maxParticles = profile.particleMax;
  runtimeConfig.vfx.particles.burstCount = profile.particleBurst;
  runtimeConfig.ai.dynamicThinkBoost = profile.aiThinkBoost;
  renderOptimizer.applyQualityProfile(profile);
  particleSystem.reconfigureFromConfig();

  lowPowerMode = normalized === "low";
  renderOptimizer.setLowPowerMode(lowPowerMode || visibilityLowPower);

  if (source.startsWith("auto") && hudSystem) {
    hudSystem.notify(`Quality ${normalized.toUpperCase()}`, "info", 800);
  }

  return normalized;
}

function applyQualitySetting(requestedQuality, source = "settings") {
  const next = sanitizeQualityMode(requestedQuality, "auto");
  uiSettings.quality = next;
  saveUISettings(uiSettings);

  if (next === "auto") {
    const seedMode = applyQualityProfile(runtimeConfig, "auto");
    perfManager.setAutoQuality(seedMode);
    return applyRuntimeQualityMode(seedMode, `${source}:auto`);
  }

  perfManager.setManualQuality(next);
  return applyRuntimeQualityMode(next, `${source}:manual`);
}

function cycleQualityPreset() {
  if (uiSettings.quality === "auto") {
    const first = QUALITY_CYCLE[2];
    applyQualitySetting(first, "hotkey");
    hudSystem?.notify(`Quality ${first.toUpperCase()}`, "info", 900);
    return;
  }

  const current = runtimeConfig.render.quality;
  const idx = QUALITY_CYCLE.indexOf(current);
  const next = QUALITY_CYCLE[(idx + 1) % QUALITY_CYCLE.length];
  applyQualitySetting(next, "hotkey");
  hudSystem?.notify(`Quality ${next.toUpperCase()}`, "info", 900);
}

function isGameActive() {
  return document.body.classList.contains("game-active");
}

function mapInputDirection(dir) {
  if (!modifierSystem.isActive("reverse_controls")) return dir;
  if (dir === "up") return "down";
  if (dir === "down") return "up";
  if (dir === "left") return "right";
  if (dir === "right") return "left";
  return dir;
}

function collectForbiddenPoints(extraBodies = []) {
  const points = [];
  const pushSegments = (segments, inflate = 10) => {
    for (let i = 0; i < segments.length; i += 1) {
      points.push({ x: segments[i].x, y: segments[i].y, r: inflate });
    }
  };
  pushSegments(playerSnake.segments, playerSnake.getHeadRadius());
  for (let i = 0; i < extraBodies.length; i += 1) pushSegments(extraBodies[i], 12);
  const foods = typeof foodSystem.getItems === "function" ? foodSystem.getItems() : [foodSystem];
  for (let i = 0; i < foods.length; i += 1) {
    points.push({ x: foods[i].x, y: foods[i].y, r: foods[i].radius + 8 });
  }
  return points;
}

function spawnFoodSafe(extraBodies = []) {
  foodSystem.refill({
    modeName: selectedMode,
    spawnBounds: worldManager.getSpawnBounds(),
    occupiedPoints: collectForbiddenPoints(extraBodies),
    playerHead: playerSnake.getHead(),
    aiHead: selectedMode === "duel" ? aiSnake.getHead() : null,
    score: scoreManager.getScore()
  });
}

function updateVisualFeedback(dt) {
  particleSystem.update(dt);
  screenShake.update(dt);
  modifierSystem.update(dt);
  powerUpManager.update(dt, {
    config: runtimeConfig,
    time: gameState.time,
    foodSystem,
    playerSnake,
    aiSnake,
    scoreManager
  });
  foodSystem.update(dt, {
    modeName: selectedMode,
    spawnBounds: worldManager.getSpawnBounds(),
    occupiedPoints: collectForbiddenPoints(selectedMode === "duel" ? [aiSnake.getSegments()] : []),
    playerHead: playerSnake.getHead(),
    aiHead: selectedMode === "duel" ? aiSnake.getHead() : null,
    score: scoreManager.getScore()
  });
  foodImpactFlash = Math.max(0, foodImpactFlash - (runtimeConfig.render.flashDecayPerSecond * dt));
  modeState.warningTimer = Math.max(0, modeState.warningTimer - dt);
}

function emitFoodFeedback(x, y, byAI) {
  const playerColor = currentThemeVisuals?.particleColor || "rgba(124,255,220,1)";
  particleSystem.emitBurst(x, y, {
    count: byAI ? Math.max(8, runtimeConfig.vfx.particles.burstCount - 6) : runtimeConfig.vfx.particles.burstCount,
    minSpeed: runtimeConfig.vfx.particles.minSpeed,
    maxSpeed: runtimeConfig.vfx.particles.maxSpeed,
    color: byAI ? "rgba(255,170,225,1)" : playerColor
  });

  if (!byAI) {
    foodImpactFlash = 1;
    screenShake.addImpulse(runtimeConfig.vfx.shake.eatIntensity);
  } else {
    screenShake.addImpulse(runtimeConfig.vfx.shake.eatIntensity * 0.5);
  }
}

function resetSharedState() {
  playerSnake.reset();
  scoreManager.reset();
  obstacleSystem.clear();
  modifierSystem.clear();
  powerUpManager.reset();
  foodSystem.reset(selectedMode);
  gameState.setPlaying();
  gameState.resetTime();
  particleSystem.clear();
  foodImpactFlash = 0;
  modeState.warningTimer = 0;
  renderer.setCameraShake(0, 0);
  if (input) input.clearBuffer();
}

function getSnakeByOwner(owner) {
  return owner === "ai" ? aiSnake : playerSnake;
}

function applyFoodReward(item, owner, options = {}) {
  const snake = getSnakeByOwner(owner);
  const isAI = owner === "ai";

  snake.grow(item.growthValue || 0.5);
  if (!isAI) snake.triggerEatHeadPop();

  if (!isAI) {
    if (item.comboBonus) scoreManager.setCombo(scoreManager.getCombo() + item.comboBonus);
    scoreManager.addPoints((item.scoreValue || runtimeConfig.scoring.foodPoints) + (options.scoreBonus || 0));
  }

  if (item.fragments && !isAI) {
    const fragmentTotal = evolutionFragmentSystem.add(item.fragments);
    hudSystem?.notify(`Fragments ${fragmentTotal}`, "success", 1100);
  }

  if (item.type === "corrupted_core" && !isAI) {
    modifierSystem.apply({
      type: "reverse_controls",
      duration: 1.6,
      value: 1,
      stackable: false,
      label: "Control Glitch"
    });
  }

  powerUpManager.applyFoodEffect(owner, item, {
    hasOpponent: selectedMode === "duel"
  });

  particleSystem.emitBurst(item.x, item.y, FoodEffects.getParticleOptions(item, currentThemeVisuals, isAI));
  screenShake.addImpulse(item.feedback?.shake || (isAI ? 0.85 : runtimeConfig.vfx.shake.eatIntensity));
  if (!isAI) foodImpactFlash = Math.max(foodImpactFlash, 0.75);

  const notice = FoodEffects.getNotification(item);
  if (notice && !isAI) {
    hudSystem?.notify(notice.message, notice.type, notice.durationMs);
  }

  spawnFoodSafe(selectedMode === "duel" ? [aiSnake.getSegments()] : []);
  return item;
}

function collectFoodFor(owner, options = {}) {
  const snake = getSnakeByOwner(owner);
  const item = foodSystem.collectForSnake(snake.getHead(), snake.getHeadRadius());
  if (!item) return null;
  return applyFoodReward(item, owner, options);
}

function absorbCollisionIfShielded(owner, bounds) {
  if (!powerUpManager.hasShield(owner)) return false;
  powerUpManager.consumeShield(owner);
  const snake = getSnakeByOwner(owner);
  snake.stabilizeInside(bounds, snake.getHeadRadius() + 6);
  if (owner === "player") {
    snake.triggerEatHeadPop(0.16);
    hudSystem?.notify("Shield Broken", "warning", 950);
  }
  screenShake.addImpulse(1.25);
  modeState.warningTimer = Math.max(modeState.warningTimer, 0.85);
  return true;
}

function updateCamera(dt) {
  const head = playerSnake.getHead();
  cameraSystem.update(dt, {
    x: head.x,
    y: head.y,
    direction: playerSnake.getCurrentDirectionVector(),
    speedPxPerSec: playerSnake.getCurrentSpeedPxPerSecond(),
    snakeLength: playerSnake.getSegmentCount(),
    shake: screenShake.getOffset()
  });
}

function syncProgressToHome() {
  const snapshot = progressionManager.getSnapshot();
  if (homeScreen) homeScreen.updateProgress(snapshot);
  if (cosmeticShop) cosmeticShop.syncProgress(snapshot);
  themeManager.updateProgress(snapshot);
}

function formatObjectiveText(objective) {
  if (!objective) return "stay alive and keep growing";
  if (objective.type === "length") return `grow to length ${objective.target}`;
  if (objective.type === "survive") return `survive for ${objective.target} seconds`;
  if (objective.type === "score") return `reach score ${objective.target}`;
  if (objective.type === "combo") return `build combo x${objective.target}`;
  if (objective.type === "win") return "defeat the rival snake";
  return "complete the objective";
}

function getOpeningBriefing(modeName) {
  if (modeName === "duel") {
    const snapshot = progressionManager.getSnapshot();
    const stage = snapshot.stage;
    return {
      title: `Level ${stage.level} • Stage ${stage.stage}`,
      subtitle: `Win by ${stage.objectives.map(formatObjectiveText).join(", ")}.`,
      durationMs: 3000
    };
  }

  if (modeName === "speed") {
    return {
      title: "Speed Mode",
      subtitle: "Win by controlling the faster snake, chaining food, and avoiding crashes.",
      durationMs: 2300
    };
  }

  if (modeName === "survival") {
    return {
      title: "Survival Mode",
      subtitle: "Win by growing steadily, dodging hazards, and lasting through the pressure.",
      durationMs: 2300
    };
  }

  return {
    title: "Classic Mode",
    subtitle: "Win by growing your snake, chaining clean pickups, and staying alive.",
    durationMs: 2200
  };
}

hudSystem = new HUDSystem({
  host: gameShell,
  onPause: () => {
    if (!isGameActive() || gameState.isGameOver()) return;
    setPaused(true, true);
  },
  onResume: () => {
    if (!gameState.isPlaying()) return;
    setPaused(false, false);
  },
  onRestart: () => {
    restartCurrentRun();
  },
  onHome: () => {
    openHome();
  },
  onNextStage: () => {
    selectedMode = "duel";
    startGame("duel");
  },
  onSettings: () => {
    openHome();
    homeScreen?.openPanel("settings");
  }
});
hudSystem.mount();
hudSystem.setSettings(uiSettings);
perfManager.registerStatsProvider("particles", () => particleSystem.getActiveCount());
perfManager.registerStatsProvider("mode", () => selectedMode);
perfManager.registerStatsProvider("foods", () => foodSystem.getActiveCount());
perfManager.memoryManager.registerCleanup("particle_trim", () => {
  particleSystem.trimToActive(Math.floor(runtimeConfig.vfx.particles.maxParticles * 0.6));
});
applyQualitySetting(uiSettings.quality, "startup");
saveUISettings(uiSettings);

function onGameOver(payload) {
  const reason = typeof payload === "string" ? payload : payload?.reason;
  if (gameState.isGameOver()) return;

  gameState.setGameOver();
  const crashHead = playerSnake.getHead();
  particleSystem.emitBurst(crashHead.x, crashHead.y, {
    count: runtimeConfig.vfx.particles.burstCount + 8,
    minSpeed: runtimeConfig.vfx.particles.minSpeed * 1.15,
    maxSpeed: runtimeConfig.vfx.particles.maxSpeed * 1.45,
    color: "rgba(255,150,180,1)"
  });
  screenShake.addImpulse(runtimeConfig.vfx.shake.crashIntensity);
  modeState.warningTimer = 1.4;

  if (!currentRenderState?.eventWarning) {
    currentRenderState = {
      ...(currentRenderState || {}),
      eventWarning: reason === "duel_crash" ? "DUEL OVER" : "GAME OVER"
    };
  }

  const before = runStartStageId;
  const progressSnapshot = progressionManager.getSnapshot();
  const afterStage = progressSnapshot.stage.id;
  const stageCleared = selectedMode === "duel" && before !== afterStage;
  const score = scoreManager.getScore();
  const best = scoreManager.getHighScore();
  const almost = best > 0 && score > 0 && score >= Math.floor(best * 0.85) && score < best;

  if (cosmeticShop) {
    cosmeticShop.recordMatchAndUnlock({
      score,
      maxCombo: runMaxCombo,
      survivalTime: gameState.time,
      mode: selectedMode,
      playerWon: stageCleared,
      aiLevel: progressSnapshot.stage.aiLevel
    }, progressSnapshot);
  }

  hudSystem.showGameOver({
    title: stageCleared ? "Stage Cleared" : "Game Over",
    subtitle: stageCleared
      ? "Strong win. Push into the next duel stage."
      : almost
        ? "Almost beat your best. One more run."
        : "Reset fast and keep the streak alive.",
    showNextStage: stageCleared
  });

  hudSystem.updateScore(score, best, 0);
  hudSystem.notify(stageCleared ? "Stage Complete!" : "Run Ended", stageCleared ? "success" : "warning", 1500);
  setPaused(true, false);
  syncProgressToHome();
}

const modeContext = {
  config: runtimeConfig,
  renderer,
  gameState,
  playerSnake,
  foodSystem,
  scoreManager,
  particleSystem,
  screenShake,
  obstacleSystem,
  modifierSystem,
  powerUpManager,
  worldManager,
  cameraSystem,
  worldRenderer,
  difficultyScaler,
  progressionManager,
  duelManager,
  aiSnake,
  aiController,
  collision: Collision,
  modeState,
  evolutionFragmentSystem,
  mapInputDirection,
  getBounds: () => worldManager.getCollisionBounds(),
  spawnFoodSafe,
  collectFoodFor,
  absorbCollisionIfShielded,
  emitFoodFeedback,
  onGameOver,
  collectForbiddenPoints,
  resetSharedState
};

const modeManager = new ModeManager(modeContext);
modeManager.setMode(selectedMode);

function formatModeLabel(modeName) {
  return modeLabels[modeName] || String(modeName || "Classic");
}

function computeHUDProgress() {
  if (selectedMode === "duel") {
    const snapshot = progressionManager.getSnapshot();
    const lengthObjective = snapshot.stage.objectives.find((objective) => objective.type === "length");
    const targetLength = lengthObjective?.target || snapshot.stage.level + 14;
    const ratio = Math.max(0, Math.min(1, playerSnake.getSegmentCount() / Math.max(1, targetLength)));
    return {
      ratio,
      label: `Length ${playerSnake.getSegmentCount()}/${targetLength}`
    };
  }

  const speedRatio = playerSnake.getCurrentSpeedPxPerSecond()
    / Math.max(1, runtimeConfig.snake.maxSpeedCellsPerSecond * runtimeConfig.world.cellSize);
  return {
    ratio: Math.max(0, Math.min(1, speedRatio)),
    label: `Intensity ${Math.round(Math.max(0, Math.min(1, speedRatio)) * 100)}%`
  };
}

function syncHUDStats() {
  const score = scoreManager.getScore();
  const best = scoreManager.getHighScore();
  const delta = Math.max(0, score - previousScore);
  if (delta > 0 || score !== previousScore) {
    hudSystem.updateScore(score, best, delta);
  }

  const combo = scoreManager.getCombo();
  runMaxCombo = Math.max(runMaxCombo, combo);
  if (combo !== previousCombo) {
    hudSystem.updateCombo(combo);
    if (combo >= 3 && combo > previousCombo) {
      hudSystem.notify(`Combo x${combo}!`, "success", 920);
    }
  }

  const progress = computeHUDProgress();
  hudSystem.updateProgress(progress.ratio, progress.label);

  previousScore = score;
  previousCombo = combo;
}

function updatePerformanceMetrics() {
  const metrics = perfManager.beginFrame(performance.now());
  fpsMonitor.push(metrics.fps);
  perfOverlay.update(metrics);

  const memoryPressure = metrics.memoryLimitMB > 0
    ? metrics.memoryMB / metrics.memoryLimitMB
    : 0;
  if (memoryPressure >= 0.82) {
    perfManager.memoryManager.runCleanup();
  }

  return metrics;
}

const engine = new GameEngine({
  gameState,
  onUpdate: (dt) => {
    input.consumeBufferedDirections();
    modeManager.update(dt);
    updateVisualFeedback(dt);
    updateCamera(dt);
    syncHUDStats();
  },
  onIdleUpdate: (dt) => {
    updateVisualFeedback(dt);
    updateCamera(dt);
  },
  onRender: (alpha) => {
    const perfMetrics = updatePerformanceMetrics();
    const renderOptionalEffects = renderOptimizer.shouldRenderOptionalEffects(perfMetrics);
    currentRenderState = modeManager.render(alpha);
    hudSystem.setModeLabel(currentRenderState.modeName || formatModeLabel(selectedMode));
    const cameraState = cameraSystem.getState(alpha);
    renderer.setCameraState({
      x: cameraState.x,
      y: cameraState.y,
      zoom: cameraState.zoom
    });
    renderer.setCameraShake(cameraState.shakeX, cameraState.shakeY);

    const useInterpolation = runtimeConfig.vfx.interpolation.enabled;
    const drawSegments = useInterpolation
      ? playerSnake.getInterpolatedSegments(alpha)
      : playerSnake.segments;
    const drawHeadScale = useInterpolation
      ? playerSnake.getInterpolatedHeadScale(alpha)
      : playerSnake.getHeadScale();
    const trailPoints = playerSnake.getHeadTrailPoints(
      runtimeConfig.render.trailMaxPoints,
      runtimeConfig.render.trailStep
    );
    const visibleObstacles = currentRenderState.obstacles
      ? worldRenderer.getVisibleObstacles(currentRenderState.obstacles, cameraState)
      : null;
    const visibleParticles = worldRenderer.getVisibleParticles(particleSystem.getActiveParticles(), cameraState);
    const visibleFoods = worldRenderer.getVisibleFoods(foodSystem.getItems(), cameraState);

    renderer.clear(gameState.time);
    worldRenderer.drawAtmosphere(cameraState, gameState.time, lowPowerMode);
    renderer.drawModeTheme(currentRenderState.visualProfile);
    renderer.drawGrid(runtimeConfig.world.cellSize);
    if (Number.isFinite(currentRenderState.arenaPadding)) {
      renderer.drawArenaPadding(currentRenderState.arenaPadding);
    }
    if (renderOptionalEffects) {
      renderer.drawSnakeTrail(trailPoints, playerSnake.segmentSpacingPx, {
        color: currentThemeVisuals.trailColor,
        glow: currentThemeVisuals.trailGlow
      });
    }
    renderer.drawFoods(visibleFoods, { flash: foodImpactFlash, style: currentThemeVisuals.foodStyle });
    renderer.drawParticles(visibleParticles);
    if (visibleObstacles) renderer.drawObstacles(visibleObstacles);

    renderer.drawSnake(drawSegments, playerSnake.segmentSpacingPx, {
      headScale: drawHeadScale,
      speedPxPerSec: playerSnake.getCurrentSpeedPxPerSecond(),
      palette: currentThemeVisuals.snakePalette
    });

    if (currentRenderState.aiSnake) {
      const aiDrawSegments = useInterpolation
        ? aiSnake.getInterpolatedSegments(alpha)
        : aiSnake.getSegments();
      const aiHeadScale = useInterpolation
        ? aiSnake.getHeadScale(alpha)
        : aiSnake.getCurrentHeadScale();
      renderer.drawSnake(aiDrawSegments, currentRenderState.aiSnake.segmentSpacingPx, {
        headScale: aiHeadScale,
        speedPxPerSec: currentRenderState.aiSnake.speedPxPerSec,
        palette: {
          spineStart: "rgba(255, 180, 231, 0.95)",
          spineMid: "rgba(244, 128, 189, 0.84)",
          spineEnd: "rgba(118, 35, 84, 0.75)",
          shadowHead: "rgba(255, 161, 225, 0.85)",
          shadowBody: "rgba(255, 128, 205, 0.48)",
          beadA: "rgba(255, 225, 244, 1)",
          beadB: "rgba(250, 160, 216, 1)",
          beadC: "rgba(125, 42, 92, 1)"
        }
      });
    }

    if (renderOptionalEffects) {
      renderer.drawEffects();
    }
    renderer.drawEventWarning(currentRenderState.eventWarning, modeState.warningTimer);
  }
});

function setPaused(nextPaused, showPauseMenu = false) {
  isPaused = nextPaused;
  engine.setPause(nextPaused);

  if (nextPaused && showPauseMenu && gameState.isPlaying()) {
    hudSystem.showPauseMenu();
  } else if (!nextPaused) {
    hudSystem.hidePauseMenu();
  }

  pauseBtn.textContent = nextPaused ? "Resume" : "Pause";
}

function restartCurrentRun() {
  isPaused = false;
  pauseBtn.textContent = "Pause";
  engine.setPause(false);
  modeManager.restartCurrent();

  runStartStageId = progressionManager.getSnapshot().stage.id;
  previousScore = 0;
  previousCombo = 0;
  runMaxCombo = 0;
  hudSystem.resetRun({
    score: 0,
    best: scoreManager.getHighScore(),
    modeName: formatModeLabel(selectedMode)
  });
  hudSystem.show();
  hudSystem.showStageIntro(getOpeningBriefing(selectedMode));
}

function startGame(modeName = selectedMode) {
  selectedMode = modeName;
  modeManager.setMode(selectedMode);
  runStartStageId = progressionManager.getSnapshot().stage.id;

  previousScore = scoreManager.getScore();
  previousCombo = scoreManager.getCombo();
  runMaxCombo = previousCombo;

  hudSystem.resetRun({
    score: scoreManager.getScore(),
    best: scoreManager.getHighScore(),
    modeName: formatModeLabel(selectedMode)
  });
  hudSystem.show();

  document.body.classList.add("game-active");
  if (homeScreen) homeScreen.hide();
  setPaused(false, false);
  hudSystem.showStageIntro(getOpeningBriefing(selectedMode));
}

function openHome() {
  document.body.classList.remove("game-active");
  if (homeScreen) {
    homeScreen.setMode(selectedMode);
    homeScreen.show();
    syncProgressToHome();
  }

  hudSystem.hide();
  isPaused = true;
  pauseBtn.textContent = "Play";
  engine.setPause(true);
}

input = new InputController({
  canvas,
  touchButtons,
  onDirection: (dir) => {
    if (!gameState.isPlaying() || isPaused) return;
    modeManager.handleDirection(dir);
  }
});
input.bind();
input.setBufferSize(runtimeConfig.input.bufferSize);

homeScreen = homeRoot
  ? new HomeScreen({
    root: homeRoot,
    disableLegacyThemePreview: true,
    onPlay: (modeName) => {
      startGame(modeName);
    },
    onModeChange: (modeName) => {
      selectedMode = modeName;
      if (isGameActive()) {
        modeManager.setMode(modeName);
        runStartStageId = progressionManager.getSnapshot().stage.id;
        hudSystem.setModeLabel(formatModeLabel(modeName));
      }
    },
    onQualityChange: (settings) => {
      applyQualitySetting(settings.quality, "settings");
      uiSettings.vibration = Boolean(settings.vibration);
      uiSettings.audio = Boolean(settings.audio);
      if (input) input.setBufferSize(runtimeConfig.input.bufferSize);

      hudSystem.setSettings({ vibration: uiSettings.vibration, reducedMotion: uiSettings.reducedMotion });
      saveUISettings(uiSettings);
    },
    onLevelSelect: (payload) => {
      progressionManager.setStage(payload.level, payload.stage);
      selectedMode = "duel";
      if (homeScreen) homeScreen.setMode("duel");
      syncProgressToHome();
    },
    onThemeChange: (_themeId) => {
      // Legacy ThemePreview is disabled in Phase 12; CosmeticShop handles themes.
    },
    onAudioToggle: (enabled) => {
      uiSettings.audio = Boolean(enabled);
      hudSystem.notify(uiSettings.audio ? "Audio Enabled" : "Audio Muted", "info", 900);
      saveUISettings(uiSettings);
    }
  })
  : null;

if (homeScreen) {
  homeScreen.init(progressionManager.getSnapshot());
  homeScreen.setMode(selectedMode);
  homeScreen.setAudioEnabled(uiSettings.audio);
  homeScreen.settingsPanel?.setState({
    quality: uiSettings.quality,
    vibration: uiSettings.vibration,
    audio: uiSettings.audio
  });
}

const shopRoot = homeRoot?.querySelector("[data-theme-preview]") || null;
if (shopRoot) {
  cosmeticShop = new CosmeticShop({
    root: shopRoot,
    themeManager,
    onThemeEquipped: (theme) => {
      applyThemeVisuals(themeManager.getRuntimeVisuals(), runtimeConfig);
      hudSystem.notify(`${theme.name} activated`, "success", 1000);
    },
    onNotify: (message, type, durationMs) => {
      hudSystem.notify(message, type, durationMs);
    }
  });
  cosmeticShop.init();
  cosmeticShop.syncProgress(progressionManager.getSnapshot());
  cosmeticShop.setTheme(themeManager.getActiveThemeId());
}

pauseBtn.addEventListener("click", () => {
  if (!isGameActive()) {
    startGame(selectedMode);
    return;
  }

  if (gameState.isGameOver()) {
    restartCurrentRun();
    return;
  }

  setPaused(!isPaused, !isPaused);
});

window.addEventListener("keydown", (event) => {
  const modeMap = {
    Digit1: "classic",
    Digit2: "speed",
    Digit3: "survival",
    Digit4: "duel"
  };

  if (event.code in modeMap) {
    selectedMode = modeMap[event.code];
    if (homeScreen) homeScreen.setMode(selectedMode);
    if (isGameActive()) {
      startGame(selectedMode);
    }
    return;
  }

  if (event.code === "Escape") {
    if (isGameActive() && !gameState.isGameOver()) {
      setPaused(!isPaused, !isPaused);
    } else {
      openHome();
    }
    return;
  }

  if (event.code === "KeyH") {
    openHome();
    return;
  }

  if (event.code === "KeyR" && gameState.isGameOver() && isGameActive()) {
    restartCurrentRun();
    return;
  }

  if (event.code === "F3") {
    event.preventDefault();
    perfOverlay.toggle();
    return;
  }

  if (event.code === "F4") {
    event.preventDefault();
    cycleQualityPreset();
  }
});

window.addEventListener("resize", () => {
  renderer.resizeToParent();
  const viewport = renderer.getViewportMetrics();
  cameraSystem.setViewportPixels(viewport.viewportWidth, viewport.viewportHeight);
});

document.addEventListener("visibilitychange", () => {
  visibilityLowPower = document.hidden;
  renderOptimizer.setLowPowerMode(lowPowerMode || visibilityLowPower);
  if (visibilityLowPower) {
    perfManager.memoryManager.runCleanup();
  }
});

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotionPreference = () => {
    uiSettings.reducedMotion = motionMedia.matches;
    hudSystem?.setSettings({
      vibration: uiSettings.vibration,
      reducedMotion: uiSettings.reducedMotion
    });
    saveUISettings(uiSettings);
  };

  if (typeof motionMedia.addEventListener === "function") {
    motionMedia.addEventListener("change", syncMotionPreference);
  } else if (typeof motionMedia.addListener === "function") {
    motionMedia.addListener(syncMotionPreference);
  }
}

engine.start();
openHome();
