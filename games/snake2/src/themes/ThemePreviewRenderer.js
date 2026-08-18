function withAlpha(color, alpha) {
  const match = String(color || "").match(/rgba?\(([^)]+)\)/i);
  if (!match) return color;
  const rgb = match[1].split(",").slice(0, 3).join(",");
  return `rgba(${rgb}, ${alpha})`;
}

export class ThemePreviewRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.theme = null;
    this.width = 1;
    this.height = 1;
    this.time = 0;
    this.frameId = null;
    this.running = false;
  }

  setTheme(theme) {
    this.theme = theme;
  }

  start() {
    if (!this.canvas || !this.ctx || this.running) return;
    this.running = true;
    this.#resize();
    this.time = 0;
    this.#loop();
    window.addEventListener("resize", this.#onResize);
  }

  stop() {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.#onResize);
  }

  #onResize = () => {
    this.#resize();
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

  #loop = () => {
    if (!this.running) return;
    this.time += 1 / 60;
    this.#render();
    this.frameId = requestAnimationFrame(this.#loop);
  };

  #render() {
    const ctx = this.ctx;
    if (!ctx) return;

    const visuals = this.theme?.visuals || {};
    const top = visuals.worldTop || "rgba(10,35,64,0.95)";
    const bottom = visuals.worldBottom || "rgba(2,9,19,0.96)";

    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, top);
    bg.addColorStop(1, bottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.35;
    const orb = ctx.createRadialGradient(this.width * 0.72, this.height * 0.22, 4, this.width * 0.72, this.height * 0.22, this.width * 0.5);
    orb.addColorStop(0, withAlpha(visuals.uiAccent || "#00e5ff", 0.44));
    orb.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    this.#drawSnake(visuals);
    this.#drawFood(visuals);
  }

  #drawSnake(visuals) {
    const ctx = this.ctx;
    const palette = visuals.snakePalette;
    if (!palette) return;

    const count = 14;
    const spacing = this.width * 0.045;
    const baseY = this.height * 0.56;
    const startX = this.width * 0.22;
    const pulse = Math.sin(this.time * 2.2) * 0.5 + 0.5;

    const points = [];
    for (let i = 0; i < count; i += 1) {
      const x = startX + i * spacing;
      const wave = Math.sin((this.time * 2.8) + (i * 0.42)) * 8;
      points.push({ x, y: baseY + wave });
    }

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(10, this.width * 0.04);
    const gradient = ctx.createLinearGradient(points[0].x, points[0].y, points[count - 1].x, points[count - 1].y);
    gradient.addColorStop(0, palette.spineStart);
    gradient.addColorStop(0.6, palette.spineMid);
    gradient.addColorStop(1, palette.spineEnd);
    ctx.strokeStyle = gradient;
    ctx.shadowColor = visuals.trailGlow || "rgba(88,222,255,0.84)";
    ctx.shadowBlur = 14 + pulse * 7;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();

    const head = points[0];
    ctx.save();
    ctx.shadowColor = palette.shadowHead;
    ctx.shadowBlur = 18 + pulse * 8;
    ctx.fillStyle = palette.beadA;
    ctx.beginPath();
    ctx.arc(head.x, head.y, Math.max(8, this.width * 0.032) + pulse * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  #drawFood(visuals) {
    const ctx = this.ctx;
    const food = visuals.foodStyle;
    if (!food) return;

    const pulse = Math.sin(this.time * 2.4) * 0.5 + 0.5;
    const radius = Math.max(7, this.width * 0.026) + pulse * 2.5;
    const x = this.width * 0.78;
    const y = this.height * 0.45 + Math.sin(this.time * 1.6) * 5;

    const grad = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.28, 1, x, y, radius);
    grad.addColorStop(0, food.center);
    grad.addColorStop(0.45, food.middle);
    grad.addColorStop(1, food.edge);

    ctx.save();
    ctx.shadowColor = food.glow;
    ctx.shadowBlur = 16 + pulse * 8;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}