export class ReactiveTerrainSystem {
  constructor() {
    this.traces = [];
    this.lastHead = null;
  }

  update(head, timeSec) {
    if (!head) return;
    if (!this.lastHead) {
      this.lastHead = { x: head.x, y: head.y };
      return;
    }
    const dx = head.x - this.lastHead.x;
    const dy = head.y - this.lastHead.y;
    if ((dx * dx) + (dy * dy) > 160) {
      this.traces.push({
        x: head.x,
        y: head.y,
        age: 0,
        radius: 18 + Math.random() * 10
      });
      if (this.traces.length > 42) this.traces.shift();
      this.lastHead = { x: head.x, y: head.y };
    }
  }

  tick(dt) {
    for (let i = this.traces.length - 1; i >= 0; i -= 1) {
      this.traces[i].age += dt;
      if (this.traces[i].age > 1.4) this.traces.splice(i, 1);
    }
  }

  draw(renderer, theme, lowPowerMode = false) {
    if (lowPowerMode || this.traces.length === 0) return;
    const color = theme?.terrainTraceColor || "rgba(0, 229, 255, 0.12)";
    renderer.drawWorldLayer((ctx) => {
      for (let i = 0; i < this.traces.length; i += 1) {
        const trace = this.traces[i];
        const alpha = Math.max(0, 1 - (trace.age / 1.4)) * 0.65;
        const radius = trace.radius + (trace.age * 22);
        const gradient = ctx.createRadialGradient(trace.x, trace.y, 1, trace.x, trace.y, radius);
        gradient.addColorStop(0, color.replace("0.12", `${alpha * 0.7}`));
        gradient.addColorStop(1, "rgba(0, 229, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(trace.x, trace.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}
