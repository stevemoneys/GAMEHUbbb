import { StageManager } from "./StageManager.js";
import { DifficultyManager } from "./DifficultyManager.js";
import { RewardSystem } from "./RewardSystem.js";

const STORAGE_KEY = "snake2_progression_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_error) {
    return null;
  }
}

export class ProgressionManager {
  constructor() {
    this.stageManager = new StageManager(24, 3);
    this.difficultyManager = new DifficultyManager();
    this.rewardSystem = new RewardSystem();
    this.state = {
      level: 1,
      stage: 1,
      completedStages: 0,
      unlockedLevel: 1
    };
    this.#load();
  }

  #load() {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = safeParse(raw);
    if (!parsed) return;
    this.state.level = Math.max(1, parsed.level || 1);
    this.state.stage = Math.max(1, parsed.stage || 1);
    this.state.completedStages = Math.max(0, parsed.completedStages || 0);
    this.state.unlockedLevel = Math.max(this.state.level, parsed.unlockedLevel || this.state.level || 1);
  }

  #save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  getCurrentStage() {
    return this.stageManager.getCurrent(this.state);
  }

  getUnlockedLevel() {
    return Math.max(1, this.state.unlockedLevel || this.state.level);
  }

  setStage(level, stage = 1) {
    const safeLevel = Math.max(1, Math.floor(level || 1));
    const safeStage = Math.max(1, Math.floor(stage || 1));
    const maxLevel = this.stageManager.getLevelCount();
    const maxStage = this.stageManager.getStagesPerLevel();

    const clampedLevel = Math.min(maxLevel, safeLevel, this.getUnlockedLevel());
    const clampedStage = Math.min(maxStage, safeStage);
    const target = this.stageManager.getStage(clampedLevel, clampedStage);
    if (!target) return false;

    this.state.level = target.level;
    this.state.stage = target.stage;
    this.#save();
    return true;
  }

  getDifficultySettings() {
    return this.difficultyManager.getSettings(this.getCurrentStage());
  }

  getRank() {
    return this.rewardSystem.getRank(this.state.completedStages);
  }

  evaluateStageResult(matchStats) {
    const stage = this.getCurrentStage();
    const passed = stage.objectives.every((objective) => {
      if (objective.type === "survive") return matchStats.survivalTime >= objective.target;
      if (objective.type === "score") return matchStats.playerScore >= objective.target;
      if (objective.type === "combo") return matchStats.maxCombo >= objective.target;
      if (objective.type === "length") return matchStats.playerSnakeLength >= objective.target;
      if (objective.type === "win") return matchStats.playerWon === true;
      return true;
    });

    if (!passed) {
      return {
        stageCleared: false,
        stage,
        rank: this.getRank(),
        rewards: [],
        progress: { ...this.state }
      };
    }

    this.state.completedStages += 1;
    this.state = this.stageManager.advance(this.state);
    this.state.unlockedLevel = Math.max(this.state.unlockedLevel, this.state.level);
    const rewards = this.rewardSystem.unlockForStage(stage.level, stage.stage);
    this.#save();

    return {
      stageCleared: true,
      stage,
      rank: this.getRank(),
      rewards,
      progress: { ...this.state }
    };
  }

  getSnapshot() {
    return {
      stage: this.getCurrentStage(),
      difficulty: this.getDifficultySettings(),
      rank: this.getRank(),
      unlocks: this.rewardSystem.snapshot(),
      progress: { ...this.state },
      meta: {
        maxLevels: this.stageManager.getLevelCount(),
        stagesPerLevel: this.stageManager.getStagesPerLevel()
      }
    };
  }
}
