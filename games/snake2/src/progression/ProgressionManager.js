import { StageManager } from "./StageManager.js";
import { DifficultyManager } from "./DifficultyManager.js";
import { RewardSystem } from "./RewardSystem.js";

const STORAGE_KEY = "snake2_progression_v2";
const DEFAULT_MODE = "classic";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_error) {
    return null;
  }
}

function createModeState() {
  return {
    level: 1,
    stage: 1,
    unlockedLevel: 1
  };
}

export class ProgressionManager {
  constructor() {
    this.stageManager = new StageManager(24, 3);
    this.difficultyManager = new DifficultyManager();
    this.rewardSystem = new RewardSystem();
    this.currentMode = DEFAULT_MODE;
    this.state = {
      completedStages: 0,
      modes: {}
    };

    const modeOrder = this.stageManager.getModeOrder();
    for (let i = 0; i < modeOrder.length; i += 1) {
      this.state.modes[modeOrder[i]] = createModeState();
    }
    this.#load();
  }

  #load() {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== "object") return;

    this.state.completedStages = Math.max(0, parsed.completedStages || 0);
    const parsedModes = parsed.modes && typeof parsed.modes === "object" ? parsed.modes : {};
    const modeOrder = this.stageManager.getModeOrder();

    for (let i = 0; i < modeOrder.length; i += 1) {
      const mode = modeOrder[i];
      const saved = parsedModes[mode] || parsed[mode] || {};
      const state = this.state.modes[mode];
      state.level = Math.max(1, saved.level || 1);
      state.stage = Math.max(1, saved.stage || 1);
      state.unlockedLevel = Math.max(state.level, saved.unlockedLevel || state.level || 1);
    }
  }

  #save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  setMode(mode) {
    const normalized = String(mode || DEFAULT_MODE).toLowerCase();
    if (!this.state.modes[normalized]) {
      this.currentMode = DEFAULT_MODE;
      return;
    }
    this.currentMode = normalized;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  #getModeState(mode = this.currentMode) {
    return this.state.modes[mode] || this.state.modes[DEFAULT_MODE];
  }

  getCurrentStage(mode = this.currentMode) {
    return this.stageManager.getCurrent(mode, this.#getModeState(mode));
  }

  getUnlockedLevel(mode = this.currentMode) {
    const state = this.#getModeState(mode);
    return Math.max(1, state.unlockedLevel || state.level || 1);
  }

  setStage(level, stage = 1, mode = this.currentMode) {
    const state = this.#getModeState(mode);
    const safeLevel = Math.max(1, Math.floor(level || 1));
    const safeStage = Math.max(1, Math.floor(stage || 1));
    const maxLevel = this.stageManager.getLevelCount();
    const maxStage = this.stageManager.getStagesPerLevel();

    const clampedLevel = Math.min(maxLevel, safeLevel, this.getUnlockedLevel(mode));
    const clampedStage = Math.min(maxStage, safeStage);
    const target = this.stageManager.getStage(mode, clampedLevel, clampedStage);
    if (!target) return false;

    state.level = target.level;
    state.stage = target.stage;
    this.#save();
    return true;
  }

  getDifficultySettings(mode = this.currentMode) {
    return this.difficultyManager.getSettings(this.getCurrentStage(mode));
  }

  getRank() {
    return this.rewardSystem.getRank(this.state.completedStages);
  }

  evaluateStageResult(matchStats = {}, mode = this.currentMode) {
    const stage = this.getCurrentStage(mode);
    const passed = stage.objectives.every((objective) => {
      if (objective.type === "length") return matchStats.playerSnakeLength >= objective.target;
      if (objective.type === "survive") return matchStats.survivalTime >= objective.target;
      if (objective.type === "score") return matchStats.playerScore >= objective.target;
      if (objective.type === "combo") return matchStats.maxCombo >= objective.target;
      if (objective.type === "win") return matchStats.playerWon === true;
      return true;
    });

    if (!passed) {
      return {
        stageCleared: false,
        stage,
        rank: this.getRank(),
        rewards: [],
        progress: { ...this.#getModeState(mode) }
      };
    }

    this.state.completedStages += 1;
    const modeState = this.#getModeState(mode);
    const nextState = this.stageManager.advance(mode, modeState);
    modeState.level = nextState.level;
    modeState.stage = nextState.stage;
    modeState.unlockedLevel = Math.max(modeState.unlockedLevel, modeState.level);
    const rewards = this.rewardSystem.unlockForStage(stage.level, stage.stage);
    this.#save();

    return {
      stageCleared: true,
      stage,
      rank: this.getRank(),
      rewards,
      progress: { ...modeState }
    };
  }

  getSnapshot(mode = this.currentMode) {
    const modeState = this.#getModeState(mode);
    const stage = this.getCurrentStage(mode);
    return {
      mode,
      stage,
      difficulty: this.getDifficultySettings(mode),
      rank: this.getRank(),
      unlocks: this.rewardSystem.snapshot(),
      progress: {
        ...modeState,
        completedStages: this.state.completedStages
      },
      modeProgress: { ...modeState },
      meta: {
        maxLevels: this.stageManager.getLevelCount(),
        stagesPerLevel: this.stageManager.getStagesPerLevel()
      }
    };
  }
}
