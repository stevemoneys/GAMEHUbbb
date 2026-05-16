function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class BuffManager {
  static buildModifiers(statuses, snapshot = {}) {
    const modifiers = {
      snake: {
        speedMultiplier: 1,
        accelerationMultiplier: 1,
        turnRateMultiplier: 1,
        growthMultiplier: 1
      },
      scoreMultiplier: 1,
      magnetRadius: 0,
      magnetStrength: 0,
      shielded: false
    };

    for (let i = 0; i < statuses.length; i += 1) {
      const status = statuses[i];
      if (status.type === "orb_haste") {
        modifiers.snake.speedMultiplier *= 1.04;
        modifiers.snake.accelerationMultiplier *= 1.08;
      } else if (status.type === "speed_boost") {
        modifiers.snake.speedMultiplier *= status.value;
        modifiers.snake.accelerationMultiplier *= 1.16;
        modifiers.snake.turnRateMultiplier *= 0.96;
      } else if (status.type === "magnetized") {
        modifiers.magnetRadius = Math.max(modifiers.magnetRadius, 220);
        modifiers.magnetStrength = Math.max(modifiers.magnetStrength, 4.1);
      } else if (status.type === "frenzy") {
        modifiers.snake.speedMultiplier *= 1.16;
        modifiers.snake.accelerationMultiplier *= 1.18;
        modifiers.snake.turnRateMultiplier *= 1.04;
        modifiers.snake.growthMultiplier *= status.value;
        modifiers.scoreMultiplier *= 1.65;
      } else if (status.type === "freeze_slow") {
        modifiers.snake.speedMultiplier *= 0.76;
        modifiers.snake.turnRateMultiplier *= 0.84;
        modifiers.snake.accelerationMultiplier *= 0.84;
      } else if (status.type === "crystal_focus") {
        modifiers.scoreMultiplier *= status.value;
        modifiers.snake.growthMultiplier *= 1.22;
      } else if (status.type === "corrupted_overload") {
        const pulse = 1 + (Math.sin((snapshot.time || 0) * 8.5) * 0.1);
        modifiers.snake.speedMultiplier *= 1.12 * pulse;
        modifiers.snake.accelerationMultiplier *= 1.08;
        modifiers.snake.turnRateMultiplier *= 0.82;
        modifiers.snake.growthMultiplier *= 1.45;
        modifiers.scoreMultiplier *= 2.05;
      } else if (status.type === "shielded") {
        modifiers.shielded = true;
      }
    }

    const massRatio = snapshot.massRatio || 0;
    modifiers.snake.turnRateMultiplier *= clamp(1 - (massRatio * 0.08), 0.72, 1);
    return modifiers;
  }
}
