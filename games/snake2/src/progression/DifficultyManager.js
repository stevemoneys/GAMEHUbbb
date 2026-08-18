function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class DifficultyManager {
  getSettings(stageInfo) {
    const level = stageInfo.aiLevel;
    const t = (level - 1) / 23;
    return {
      aiLevel: level,
      aiThinkInterval: clamp(0.22 - (t * 0.15), 0.06, 0.22),
      playerSpeedBias: 1 + (t * 0.08),
      aiSpeedBias: 1 + (t * 0.16),
      overtimeSeconds: clamp(75 - (t * 20), 45, 75),
      eventRate: 1 + (t * 0.55)
    };
  }
}
