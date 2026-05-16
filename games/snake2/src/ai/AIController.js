import { AIEngine } from "./AIEngine.js";
import { getPersonality } from "./AIProfiles.js";

export class AIController {
  constructor(options = {}) {
    this.engine = new AIEngine({
      level: options.level ?? 1,
      personality: options.personality ?? "tactical"
    });
    this.personality = getPersonality(options.personality ?? "tactical");
    this.thinkTimer = 0;
    this.lastDirection = "right";
  }

  setPersonality(name) {
    this.engine.setPersonality(name);
    this.personality = getPersonality(name);
  }

  setLevel(level) {
    this.engine.setLevel(level);
  }

  adapt(performanceSignal) {
    this.engine.adapt(performanceSignal);
  }

  getRuntimeConfig() {
    return this.engine.getRuntimeConfig();
  }

  update(dt, context) {
    const runtime = this.engine.getRuntimeConfig();
    const thinkInterval = context.thinkInterval ?? runtime.reactionInterval;
    this.thinkTimer += dt;
    if (this.thinkTimer < thinkInterval) return this.lastDirection;
    this.thinkTimer = 0;

    const next = this.engine.think({
      ownSegments: context.aiSnakeSegments,
      enemySegments: context.playerSnakeSegments,
      head: context.aiHead,
      food: typeof context.food?.getAITarget === "function"
        ? context.food.getAITarget(context.aiHead, context.playerSnakeSegments?.[0])
        : context.food,
      bounds: context.bounds,
      cellSize: context.cellSize,
      obstacles: context.obstacles
    });

    this.lastDirection = next;
    context.enqueueDirection(next);
    return next;
  }
}
