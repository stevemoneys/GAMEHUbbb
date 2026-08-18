export const AI_PERSONALITIES = {
  cautious: {
    id: "cautious",
    label: "Cautious",
    foodWeight: 0.88,
    safetyWeight: 1.35,
    aggressionWeight: 0.4,
    unpredictability: 0.04
  },
  aggressive: {
    id: "aggressive",
    label: "Aggressive",
    foodWeight: 1.2,
    safetyWeight: 0.82,
    aggressionWeight: 1.35,
    unpredictability: 0.07
  },
  tactical: {
    id: "tactical",
    label: "Tactical",
    foodWeight: 1.04,
    safetyWeight: 1.16,
    aggressionWeight: 0.92,
    unpredictability: 0.03
  },
  chaotic: {
    id: "chaotic",
    label: "Chaotic",
    foodWeight: 0.95,
    safetyWeight: 0.74,
    aggressionWeight: 0.98,
    unpredictability: 0.22
  },
  elite: {
    id: "elite",
    label: "Elite",
    foodWeight: 1.18,
    safetyWeight: 1.25,
    aggressionWeight: 1.12,
    unpredictability: 0.02
  }
};

const DIFFICULTY_LEVELS = 24;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildLevel(level) {
  const t = (level - 1) / (DIFFICULTY_LEVELS - 1);
  return {
    level,
    reactionInterval: clamp(0.24 - (t * 0.17), 0.06, 0.24),
    lookAheadDepth: Math.floor(3 + (t * 8)),
    optimizationWeight: 0.76 + (t * 0.64),
    trapDetection: 0.45 + (t * 0.55),
    pressureTactics: 0.25 + (t * 0.85),
    mistakeChance: clamp(0.2 - (t * 0.18), 0.01, 0.2),
    adaptiveGain: 0.18 + (t * 0.42)
  };
}

export const AI_LEVEL_LADDER = Array.from({ length: DIFFICULTY_LEVELS }, (_, i) => buildLevel(i + 1));

export function getAILevelConfig(level = 1) {
  const clamped = clamp(Math.floor(level), 1, AI_LEVEL_LADDER.length);
  return AI_LEVEL_LADDER[clamped - 1];
}

export function getPersonality(id = "tactical") {
  return AI_PERSONALITIES[id] || AI_PERSONALITIES.tactical;
}
