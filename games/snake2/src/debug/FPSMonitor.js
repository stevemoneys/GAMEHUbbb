export class FPSMonitor {
  constructor(sampleWindow = 24) {
    this.sampleWindow = Math.max(10, Math.floor(sampleWindow));
    this.samples = [];
  }

  push(fps) {
    if (!Number.isFinite(fps)) return;
    this.samples.push(fps);
    if (this.samples.length > this.sampleWindow) {
      this.samples.shift();
    }
  }

  getSmoothedFps() {
    if (this.samples.length === 0) return 60;
    let total = 0;
    for (let i = 0; i < this.samples.length; i += 1) {
      total += this.samples[i];
    }
    return total / this.samples.length;
  }
}