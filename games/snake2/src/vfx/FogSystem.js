function wrap(value, max) {
  if (value < 0) return value + max;
  if (value > max) return value - max;
  return value;
}

export class FogSystem {
  constructor() {
    this.layers = [];
    this.lastKey = "";
  }

  ensure(bounds) {
    const key = `${bounds.width}|${bounds.height}`;
    if (this.lastKey === key && this.layers.length > 0) return;
    this.lastKey = key;
    this.layers = Array.from({ length: 11 }, (_, index) => ({
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      radius: 180 + (Math.random() * 320),
      speedX: 4 + (Math.random() * 8),
      speedY: 2 + (Math.random() * 5),
      alpha: 0.055 + (Math.random() * 0.06),
      depth: 0.3 + ((index % 3) * 0.2)
    }));
  }

  update(dt, bounds, context = {}) {
    this.ensure(bounds);
    const eventType = context.activeEvent?.type || "";
    const driftBoost = eventType === "lightning_storm" || eventType === "solar_eruption"
      ? 1.35
      : eventType === "ice_storm"
        ? 0.82
        : 1;
    for (let i = 0; i < this.layers.length; i += 1) {
      const layer = this.layers[i];
      layer.x = wrap(layer.x + (layer.speedX * dt * layer.depth * driftBoost), bounds.width);
      layer.y = wrap(layer.y + (layer.speedY * dt * layer.depth * driftBoost), bounds.height);
    }
  }

  draw(renderer, bounds, theme, heat = 0, lowPowerMode = false) {
    this.ensure(bounds);
    const colors = theme?.fogColors || [
      "0, 229, 255",
      "139, 92, 246",
      "255, 77, 202"
    ];

    renderer.drawWorldLayer((ctx) => {
      for (let i = 0; i < this.layers.length; i += 1) {
        if (lowPowerMode && i % 2 === 1) continue;
        const layer = this.layers[i];
        const gradient = ctx.createRadialGradient(layer.x, layer.y, 1, layer.x, layer.y, layer.radius);
        gradient.addColorStop(0, `rgba(${colors[i % colors.length]}, ${layer.alpha + (heat * 0.03)})`);
        gradient.addColorStop(1, `rgba(${colors[(i + 1) % colors.length]}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(layer.x, layer.y, layer.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}
