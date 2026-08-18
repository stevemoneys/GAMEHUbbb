export class EnergyRiverSystem {
  constructor() {
    this.paths = [];
    this.lastKey = "";
  }

  ensure(bounds) {
    const key = `${bounds.width}|${bounds.height}`;
    if (this.lastKey === key && this.paths.length > 0) return;
    this.lastKey = key;
    const centerY = bounds.height * 0.5;
    this.paths = [
      { offsetY: centerY - (bounds.height * 0.2), amplitude: bounds.height * 0.05, width: 26, speed: 0.55 },
      { offsetY: centerY + (bounds.height * 0.17), amplitude: bounds.height * 0.07, width: 18, speed: 0.72 }
    ];
  }

  draw(renderer, bounds, timeSec, theme, heat = 0, lowPowerMode = false) {
    this.ensure(bounds);
    const colorA = theme?.riverColorA || "rgba(0, 229, 255, 0.12)";
    const colorB = theme?.riverColorB || "rgba(139, 92, 246, 0.08)";
    renderer.drawWorldLayer((ctx) => {
      for (let i = 0; i < this.paths.length; i += 1) {
        if (lowPowerMode && i > 0) continue;
        const path = this.paths[i];
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = i === 0 ? colorA : colorB;
        ctx.shadowBlur = 20 + (heat * 14);
        ctx.lineWidth = path.width + (heat * 4);
        ctx.strokeStyle = i === 0 ? colorA : colorB;
        ctx.beginPath();
        for (let x = 0; x <= bounds.width; x += 48) {
          const y = path.offsetY + (Math.sin((x * 0.005) + (timeSec * path.speed * 3)) * path.amplitude);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    });
  }
}
