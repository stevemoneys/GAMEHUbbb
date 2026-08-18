export class RewardPsychologySystem {
  getProfile(context = {}) {
    const score = context.score || 0;
    const modeName = context.modeName || "classic";
    const intensity = Math.min(1, score / 90);

    return {
      modeName,
      intensity,
      commonTrailLength: modeName === "speed" ? 4 : modeName === "survival" ? 3 : 5,
      explorationBias: modeName === "survival" ? 0.9 : modeName === "duel" ? 0.4 : 0.6,
      contestBias: modeName === "duel" ? 1 : modeName === "speed" ? 0.75 : 0.45,
      rareUrgency: 0.45 + (intensity * 0.55)
    };
  }
}
