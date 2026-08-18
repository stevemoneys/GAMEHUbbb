export class ScreenShake {
  constructor(config) {
    this.decayPerSecond = config.vfx.shake.decayPerSecond;
    this.intensity = 0;
    this.x = 0;
    this.y = 0;
  }

  addImpulse(amount) {
    if (!Number.isFinite(amount)) return;
    this.intensity += Math.max(0, amount);
  }

  update(dt) {
    this.intensity = Math.max(0, this.intensity - (this.decayPerSecond * dt));
    if (this.intensity <= 0) {
      this.x = 0;
      this.y = 0;
      return;
    }

    const angle = Math.random() * Math.PI * 2;
    const radius = this.intensity * (0.4 + Math.random() * 0.6);
    this.x = Math.cos(angle) * radius;
    this.y = Math.sin(angle) * radius;
  }

  getOffset() {
    return { x: this.x, y: this.y };
  }
}
