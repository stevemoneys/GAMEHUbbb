export class RenderOptimizer {
  constructor(renderer) {
    this.renderer = renderer;
    this.lowPowerMode = false;
  }

  setLowPowerMode(enabled) {
    this.lowPowerMode = Boolean(enabled);
    this.renderer?.setLowPowerMode?.(this.lowPowerMode);
  }

  applyQualityProfile(profile) {
    if (!profile || !this.renderer) return;
    this.renderer.setPerformanceProfile?.({
      glowScale: profile.glowScale,
      shadowScale: profile.shadowScale,
      resolutionScale: profile.resolutionScale
    });
  }

  shouldRenderOptionalEffects(snapshot) {
    if (this.lowPowerMode) return false;
    if (!snapshot) return true;
    return snapshot.fps >= 42;
  }
}