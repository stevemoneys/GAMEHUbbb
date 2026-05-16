const PERSONALITY_ORDER = ["cautious", "aggressive", "tactical", "chaotic", "elite"];

function buildObjectives(level, stage) {
  const surviveTarget = 22 + (level * 2) + (stage * 6);
  const scoreTarget = 8 + (level * 2) + (stage * 4);
  const comboTarget = Math.min(12, 1 + Math.floor(level / 3) + stage);
  const lengthTarget = 14 + (level * 2) + ((stage - 1) * 3);

  if (stage === 1) {
    return [
      { type: "survive", target: surviveTarget },
      { type: "length", target: lengthTarget }
    ];
  }
  if (stage === 2) {
    return [
      { type: "length", target: lengthTarget },
      { type: "score", target: scoreTarget },
      { type: "win", target: 1 }
    ];
  }
  return [
    { type: "length", target: lengthTarget },
    { type: "survive", target: surviveTarget },
    { type: "score", target: scoreTarget },
    { type: "combo", target: comboTarget },
    { type: "win", target: 1 }
  ];
}

export class StageManager {
  constructor(levelCount = 24, stagesPerLevel = 3) {
    this.levelCount = levelCount;
    this.stagesPerLevel = stagesPerLevel;
    this.stages = this.#buildStages();
  }

  getLevelCount() {
    return this.levelCount;
  }

  getStagesPerLevel() {
    return this.stagesPerLevel;
  }

  #buildStages() {
    const stages = [];
    for (let level = 1; level <= this.levelCount; level += 1) {
      for (let stage = 1; stage <= this.stagesPerLevel; stage += 1) {
        stages.push({
          id: `L${level}-S${stage}`,
          level,
          stage,
          aiLevel: level,
          personality: PERSONALITY_ORDER[(level + stage - 2) % PERSONALITY_ORDER.length],
          objectives: buildObjectives(level, stage)
        });
      }
    }
    return stages;
  }

  getStage(level, stage) {
    return this.stages.find((item) => item.level === level && item.stage === stage) || null;
  }

  getCurrent(progressState) {
    return this.getStage(progressState.level, progressState.stage) || this.stages[this.stages.length - 1];
  }

  advance(progressState) {
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
