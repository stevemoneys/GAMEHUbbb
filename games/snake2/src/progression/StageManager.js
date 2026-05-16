const MODE_ORDER = ["classic", "speed", "survival", "duel"];
const PERSONALITY_ORDER = ["cautious", "aggressive", "tactical", "chaotic", "elite"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLengthTarget(mode, level, stage) {
  const stageOffset = (stage - 1) * 2;
  if (mode === "speed") return 13 + (level * 2) + stageOffset;
  if (mode === "survival") return 12 + Math.floor(level * 1.9) + stageOffset;
  if (mode === "duel") return 14 + (level * 2) + stageOffset;
  return 12 + (level * 2) + stageOffset;
}

function getModeFlavor(mode, level, stage) {
  if (mode === "speed") {
    return {
      subtitle: "Push forward with clean turns and control the faster pace.",
      accent: "speed",
      aiLevel: clamp(level + stage - 1, 1, 24)
    };
  }
  if (mode === "survival") {
    return {
      subtitle: "Grow while hazards and arena pressure keep climbing.",
      accent: "survival",
      aiLevel: clamp(level, 1, 24)
    };
  }
  if (mode === "duel") {
    return {
      subtitle: "Outgrow the rival snake and own the arena before it owns you.",
      accent: "duel",
      aiLevel: clamp(level, 1, 24),
      personality: PERSONALITY_ORDER[(level + stage - 2) % PERSONALITY_ORDER.length]
    };
  }
  return {
    subtitle: "Grow smoothly, stay alive, and hit the target length.",
    accent: "classic",
    aiLevel: clamp(level, 1, 24)
  };
}

function buildStage(mode, level, stage) {
  const flavor = getModeFlavor(mode, level, stage);
  const lengthTarget = getLengthTarget(mode, level, stage);
  return {
    id: `${mode}-L${level}-S${stage}`,
    mode,
    level,
    stage,
    aiLevel: flavor.aiLevel,
    personality: flavor.personality || "cautious",
    subtitle: flavor.subtitle,
    accent: flavor.accent,
    objectives: [
      { type: "length", target: lengthTarget }
    ]
  };
}

export class StageManager {
  constructor(levelCount = 24, stagesPerLevel = 3) {
    this.levelCount = levelCount;
    this.stagesPerLevel = stagesPerLevel;
    this.stagesByMode = new Map();
    this.#buildStages();
  }

  getModeOrder() {
    return [...MODE_ORDER];
  }

  getLevelCount() {
    return this.levelCount;
  }

  getStagesPerLevel() {
    return this.stagesPerLevel;
  }

  #buildStages() {
    for (let modeIndex = 0; modeIndex < MODE_ORDER.length; modeIndex += 1) {
      const mode = MODE_ORDER[modeIndex];
      const stages = [];
      for (let level = 1; level <= this.levelCount; level += 1) {
        for (let stage = 1; stage <= this.stagesPerLevel; stage += 1) {
          stages.push(buildStage(mode, level, stage));
        }
      }
      this.stagesByMode.set(mode, stages);
    }
  }

  getStage(mode, level, stage) {
    const list = this.stagesByMode.get(mode) || this.stagesByMode.get("classic") || [];
    return list.find((item) => item.level === level && item.stage === stage) || null;
  }

  getCurrent(mode, progressState) {
    return this.getStage(mode, progressState.level, progressState.stage)
      || this.getStage(mode, this.levelCount, this.stagesPerLevel);
  }

  advance(mode, progressState) {
    const next = { ...progressState };
    if (next.stage < this.stagesPerLevel) {
      next.stage += 1;
      return next;
    }

    next.stage = 1;
    next.level = Math.min(this.levelCount, next.level + 1);
    return next;
  }
}
