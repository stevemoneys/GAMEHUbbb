function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class CameraEffects {
  constructor(config) {
    this.config = config;
  }

  getLookAhead(direction, speedPxPerSec) {
    const safeDirection = direction || { x: 1, y: 0 };
    const speedRatio = clamp(speedPxPerSec / 560, 0, 1);
    const lookAheadDistance = 54 + (speedRatio * 72);
    return {
      x: safeDirection.x * lookAheadDistance,
      y: safeDirection.y * lookAheadDistance
    };
  }

  getTargetZoom(speedPxPerSec, snakeLength) {
    const speedRatio = clamp(speedPxPerSec / 620, 0, 1);
    const lengthRatio = clamp((snakeLength - 10) / 42, 0, 1);
    const widerView = 0.16 + (lengthRatio * 0.12) + (speedRatio * 0.07);
    return clamp(1 - widerView, 0.72, 1.02);
  }
}
