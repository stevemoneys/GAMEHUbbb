export class MotionEffects {
  static easeOutExpo(t) {
    return t === 1 ? 1 : 1 - (2 ** (-10 * t));
  }

  static easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - (((-2 * t) + 2) ** 3) / 2;
  }

  static animate(durationMs, onUpdate, easing = MotionEffects.easeInOutCubic) {
    const start = performance.now();
    function frame(now) {
      const raw = Math.min(1, (now - start) / durationMs);
      const eased = easing(raw);
      onUpdate(eased, raw);
      if (raw < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
