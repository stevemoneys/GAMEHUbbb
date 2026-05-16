import { AIPathfinding } from "./AIPathfinding.js";

export class AIDecisionSystem {
  static decide(context) {
    const candidates = AIPathfinding.evaluateDirections(context);
    if (candidates.length === 0) return "right";

    // Layer 1: immediate survival.
    const survivalFiltered = candidates.filter((item) => item.collisionRisk === 0);
    const safeSet = survivalFiltered.length > 0 ? survivalFiltered : candidates;

    // Layer 2/3: path safety + food optimization is already reflected in scores.
    // Layer 4/5: pressure/aggression incorporated by personality and level tuning.
    const best = safeSet[0];
    const second = safeSet[1] || best;

    // Imperfection model to avoid robotic "perfect play".
    if (Math.random() < context.levelConfig.mistakeChance && second.score > -80000) {
      return second.dir;
    }

    return best.dir;
  }
}
