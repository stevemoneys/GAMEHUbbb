export class BackgroundParticles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.width = 0;
    this.height = 0;
    this.particles = [];
    this.pointer = { x: 0, y: 0 };
    this.running = false;
    this.frame = null;
  }

  start() {
    if (this.running || !this.canvas || !this.ctx) return;
    this.running = true;
    this.#resize();
    this.#seed(48);
    window.addEventListener("resize", this.#resizeBound);
    window.addEventListener("pointermove", this.#pointerBound, { passive: true });
    this.#loop();
  }

  stop() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.#resizeBound);
    window.removeEventListener("pointermove", this.#pointerBound);
  }

  #resizeBound = () => this.#resize();
  #pointerBound = (event) => {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  };

  #resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  #seed(count) {
    this.particles.length = 0;
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1.2 + Math.random() * 2.8,
        vx: (-0.08 + Math.random() * 0.16),
        vy: (-0.09 + Math.random() * 0.18),
        alpha: 0.12 + Math.random() * 0.42
      });
    }
  }

  #loop = () => {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      const dx = this.pointer.x - p.x;
      const dy = this.pointer.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const influence = Math.max(0, 1 - (d / 320));
      p.vx += (dx / d) * influence * 0.006;
      p.vy += (dy / d) * influence * 0.006;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      this.ctx.fillStyle = `rgba(85, 222, 255, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.frame = requestAnimationFrame(this.#loop);
  };
}
