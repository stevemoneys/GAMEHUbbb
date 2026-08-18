import { FrameTimingSystem } from "./FrameTimingSystem.js";
import { AdaptiveQuality } from "./AdaptiveQuality.js";
import { MemoryManager } from "./MemoryManager.js";

export class PerformanceManager {
  constructor(options = {}) {
    this.frameTiming = new FrameTimingSystem({ sampleSize: 120 });
    this.adaptiveQuality = new AdaptiveQuality({
      initialMode: options.initialMode || "high",
      auto: options.autoQuality !== false
    });
    this.memoryManager = new MemoryManager();
    this.onQualityChange = options.onQualityChange || (() => {});
    this.lastFrameTime = 0;
    this.statsProviders = new Map();
    this.lastMetrics = {
      fps: 60,
      frameMs: 16.67,
      p95Ms: 16.67,
      jankPerMinute: 0,
      quality: this.adaptiveQuality.getMode(),
      memoryMB: 0,
      memoryLimitMB: 0,
      extras: {}
    };
  }

  beginFrame(nowMs) {
    const now = Number(nowMs) || performance.now();
    if (this.lastFrameTime <= 0) {
      this.lastFrameTime = now;
      return this.lastMetrics;
    }

    const dt = Math.max(0.0001, Math.min(0.25, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    this.frameTiming.recordFrame(dt);
    const timing = this.frameTiming.getSnapshot();

    const qualityChange = this.adaptiveQuality.update(timing, dt);
    if (qualityChange.changed) {
      this.onQualityChange(qualityChange.mode, qualityChange.reason);
    }

    const memory = this.memoryManager.getSnapshot();
    const extras = {};
    this.statsProviders.forEach((provider, key) => {
      try {
        extras[key] = provider();
      } catch (_error) {
        extras[key] = null;
      }
    });

    this.lastMetrics = {
      ...timing,
      quality: this.adaptiveQuality.getMode(),
      memoryMB: memory.usedMB,
      memoryLimitMB: memory.limitMB,
      extras
    };

    return this.lastMetrics;
  }

  registerStatsProvider(key, provider) {
    if (!key || typeof provider !== "function") return;
    this.statsProviders.set(String(key), provider);
  }

  getMetrics() {
    return this.lastMetrics;
  }

  setManualQuality(mode) {
    this.adaptiveQuality.setMode(mode, false);
  }

  setAutoQuality(mode) {
    this.adaptiveQuality.setMode(mode, true);
  }

  getCurrentQualityMode() {
    return this.adaptiveQuality.getMode();
  }
}