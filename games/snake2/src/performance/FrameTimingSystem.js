export class FrameTimingSystem {
  constructor(options = {}) {
    this.sampleSize = Number.isFinite(options.sampleSize) ? Math.max(15, Math.floor(options.sampleSize)) : 90;
    this.frameTimes = [];
    this.lastFps = 60;
    this.lastDt = 1 / 60;
    this.jankCount = 0;
  }

  recordFrame(deltaSeconds) {
    const dt = Math.max(0.0001, Math.min(0.25, Number(deltaSeconds) || (1 / 60)));
    this.lastDt = dt;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }
    if (dt > 0.03) this.jankCount += 1;
  }

  getSnapshot() {
    if (this.frameTimes.length === 0) {
      return {
        fps: this.lastFps,
        frameMs: 16.67,
        p95Ms: 16.67,
        jankPerMinute: 0
      };
    }

    let total = 0;
    for (let i = 0; i < this.frameTimes.length; i += 1) {
      total += this.frameTimes[i];
    }

    const avg = total / this.frameTimes.length;
    const fps = 1 / avg;
    this.lastFps = fps;

    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)];

    return {
      fps,
      frameMs: avg * 1000,
      p95Ms: p95 * 1000,
      jankPerMinute: (this.jankCount / Math.max(1, this.frameTimes.length)) * 3600
    };
  }

  resetJankCounter() {
    this.jankCount = 0;
  }
}