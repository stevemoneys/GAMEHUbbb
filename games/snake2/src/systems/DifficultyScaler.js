const difficultyProfiles = {
  easy: {
    speedMultiplier: 0.9,
    aiThinkInterval: 0.2,
    aiRisk: 0.8,
    obstacleRate: 0.7,
    eventRate: 0.75
  },
  normal: {
    speedMultiplier: 1,
    aiThinkInterval: 0.15,
    aiRisk: 1,
    obstacleRate: 1,
    eventRate: 1
  },
  hard: {
    speedMultiplier: 1.12,
    aiThinkInterval: 0.11,
    aiRisk: 1.12,
    obstacleRate: 1.2,
    eventRate: 1.18
  },
  insane: {
    speedMultiplier: 1.26,
    aiThinkInterval: 0.08,
    aiRisk: 1.3,
    obstacleRate: 1.45,
    eventRate: 1.4
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class DifficultyScaler {
  constructor() {
    this.level = "normal";
    this.dynamicBias = 0;
  }

  setLevel(level) {
    const normalized = String(level || "").toLowerCase();
    this.level = difficultyProfiles[normalized] ? normalized : "normal";
  }

  // Dynamic adaptation: if player is doing too well, intensity slowly rises.
  update(metrics) {
    const profile = difficultyProfiles[this.level];
    const score = Number.isFinite(metrics.score) ? Math.max(0, metrics.score) : 0;
    const survival = Number.isFinite(metrics.survivalTime) ? Math.max(0, metrics.survivalTime) : 0;
    const combo = Number.isFinite(metrics.combo) ? Math.max(0, metrics.combo) : 0;

    const skillSignal = (score / 220) + (survival / 140) + (combo * 0.08);
    this.dynamicBias = clamp((skillSignal * 0.08), -0.06, 0.32);

    return {
      speedMultiplier: profile.speedMultiplier + this.dynamicBias,
      aiThinkInterval: clamp(profile.aiThinkInterval - (this.dynamicBias * 0.04), 0.05, 0.28),
      aiRisk: profile.aiRisk + this.dynamicBias,
      obstacleRate: profile.obstacleRate + (this.dynamicBias * 0.8),
      eventRate: profile.eventRate + (this.dynamicBias * 0.65)
    };
  }
}
