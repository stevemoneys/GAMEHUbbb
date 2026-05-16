const QUALITY_LEVELS = ["low", "medium", "high", "ultra"];

export class AdaptiveQuality {
  constructor(options = {}) {
    this.mode = options.initialMode || "high";
    this.auto = options.auto !== false;
    this.cooldownSeconds = 0;
    this.minFpsByMode = {
      ultra: 56,
      high: 52,
      medium: 46,
      low: 38
    };
  }

  setMode(mode, auto = false) {
    if (!QUALITY_LEVELS.includes(mode)) return;
    this.mode = mode;
    this.auto = auto;
    this.cooldownSeconds = 1.2;
  }

  update(snapshot, dt) {
    this.cooldownSeconds = Math.max(0, this.cooldownSeconds - Math.max(0, dt || 0));
    if (!this.auto || this.cooldownSeconds > 0 || !snapshot) {
      return { changed: false, mode: this.mode };
    }

    const fps = snapshot.fps;
    const currentIndex = QUALITY_LEVELS.indexOf(this.mode);

    // Step down gently on sustained drops.
    if (fps < this.minFpsByMode[this.mode] && currentIndex > 0) {
      this.mode = QUALITY_LEVELS[currentIndex - 1];
      this.cooldownSeconds = 3.5;
      return { changed: true, mode: this.mode, reason: "fps_drop" };
    }

    // Step up slowly when device is stable.
    if (fps > (this.minFpsByMode[this.mode] + 12) && currentIndex < QUALITY_LEVELS.length - 1) {
      this.mode = QUALITY_LEVELS[currentIndex + 1];
      this.cooldownSeconds = 5.5;
      return { changed: true, mode: this.mode, reason: "fps_stable" };
    }

    return { changed: false, mode: this.mode };
  }

  getMode() {
    return this.mode;
  }

  static getQualityProfile(mode) {
    if (mode === "low") {
      return {
        trailMaxPoints: 34,
        foodOrbitCount: 1,
        particleMax: 48,
        particleBurst: 9,
        glowScale: 0.64,
        shadowScale: 0.68,
        resolutionScale: 0.86,
        aiThinkBoost: 0.06
      };
    }
    if (mode === "medium") {
      return {
        trailMaxPoints: 48,
        foodOrbitCount: 2,
        particleMax: 78,
        particleBurst: 12,
        glowScale: 0.82,
        shadowScale: 0.85,
        resolutionScale: 0.93,
        aiThinkBoost: 0.03
      };
    }
    if (mode === "ultra") {
      return {
        trailMaxPoints: 96,
        foodOrbitCount: 5,
        particleMax: 180,
        particleBurst: 22,
        glowScale: 1.15,
        shadowScale: 1.12,
        resolutionScale: 1,
        aiThinkBoost: 0
      };
    }

    return {
      trailMaxPoints: 72,
      foodOrbitCount: 4,
      particleMax: 130,
      particleBurst: 18,
      glowScale: 1,
      shadowScale: 1,
      resolutionScale: 1,
      aiThinkBoost: 0
    };
  }
}