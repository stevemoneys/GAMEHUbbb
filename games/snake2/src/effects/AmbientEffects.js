export class AmbientEffects {
  constructor(root) {
    this.root = root;
    this.running = false;
    this.frame = null;
    this.startTime = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this.#loop();
  }

  stop() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
  }

  #loop = () => {
    if (!this.running) return;
    const t = (performance.now() - this.startTime) / 1000;
    const shiftX = Math.sin(t * 0.14) * 18;
    const shiftY = Math.cos(t * 0.11) * 16;
    const glow = 0.42 + (Math.sin(t * 0.5) * 0.08);
    this.root.style.setProperty("--ambient-shift-x", `${shiftX}%`);
    this.root.style.setProperty("--ambient-shift-y", `${shiftY}%`);
    this.root.style.setProperty("--ambient-glow", String(glow));
    this.frame = requestAnimationFrame(this.#loop);
  };
}
