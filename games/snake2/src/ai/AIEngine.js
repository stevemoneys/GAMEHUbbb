import { getAILevelConfig, getPersonality } from "./AIProfiles.js";
import { AIDecisionSystem } from "./AIDecisionSystem.js";

function inferCurrentDirection(segments) {
  if (!segments || segments.length < 2) return { x: 1, y: 0 };
  const head = segments[0];
  const neck = segments[1];
  const dx = head.x - neck.x;
  const dy = head.y - neck.y;
  if (Math.abs(dx) > Math.abs(dy)) return { x: dx >= 0 ? 1 : -1, y: 0 };
  return { x: 0, y: dy >= 0 ? 1 : -1 };
}

export class AIEngine {
  constructor(options = {}) {
    this.level = options.level ?? 1;
    this.personalityId = options.personality ?? "tactical";
    this.dynamicBias = 0;
  }

  setLevel(level) {
    this.level = Math.max(1, Math.floor(level));
  }

  setPersonality(id) {
    this.personalityId = id;
  }

  adapt(performanceSignal) {
    const signal = Number.isFinite(performanceSignal) ? performanceSignal : 0;
    this.dynamicBias = Math.max(-0.25, Math.min(0.35, this.dynamicBias + (signal * 0.02)));
  }

  getRuntimeConfig() {
    const base = getAILevelConfig(this.level);
    return {
      ...base,
      reactionInterval: Math.max(0.05, base.reactionInterval - (this.dynamicBias * 0.03)),
      optimizationWeight: base.optimizationWeight + (this.dynamicBias * 0.25),
      trapDetection: base.trapDetection + (this.dynamicBias * 0.22),
      pressureTactics: base.pressureTactics + (this.dynamicBias * 0.24),
      adaptiveGain: base.adaptiveGain + (this.dynamicBias * 0.18)
    };
  }

  think(context) {
    const personality = getPersonality(this.personalityId);
    const levelConfig = this.getRuntimeConfig();
    return AIDecisionSystem.decide({
      ...context,
      currentDirection: inferCurrentDirection(context.ownSegments),
      personality,
      levelConfig
    });
  }
}
