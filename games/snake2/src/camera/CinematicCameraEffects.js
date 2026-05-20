function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class CinematicCameraEffects {
  getBreathingOffset(timeSec, speedPxPerSec = 0, heat = 0) {
    const speedRatio = clamp(speedPxPerSec / 420, 0, 1);
    return {
      x: Math.sin(timeSec * 0.52) * (1.6 + heat * 1.3),
      y: Math.cos(timeSec * 0.4) * (2.4 + (speedRatio * 1.8))
    };
  }

  getDriftZoom(timeSec, heat = 0) {
    return 1 + (Math.sin(timeSec * 0.35) * 0.004) + (heat * 0.01);
  }
}
