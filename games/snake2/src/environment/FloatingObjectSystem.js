export class FloatingObjectSystem {
  constructor() {
    this.objects = [];
    this.lastKey = "";
  }

  ensure(bounds) {
    const key = `${bounds.width}|${bounds.height}`;
    if (this.lastKey === key && this.objects.length > 0) return;
    this.lastKey = key;
    this.objects = Array.from({ length: 8 }, (_, index) => ({
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      size: 32 + Math.random() * 58,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: 0.04 + Math.random() * 0.09,
      drift: 4 + Math.random() * 8,
      kind: index % 3
    }));
  }

  update(dt, bounds, context = {}) {
    this.ensure(bounds);
    const eventType = context.activeEvent?.type || "";
    const rotationBoost = eventType === "meteor_shower" || eventType === "corruption_wave"
      ? 1.35
      : eventType === "ice_storm"
        ? 0.84
        : 1;
    for (let i = 0; i < this.objects.length; i += 1) {
      const object = this.objects[i];
      object.rotation += dt * object.rotationSpeed * rotationBoost;
      object.y += Math.sin(object.rotation) * object.drift * rotationBoost * dt;
    }
  }

  draw(renderer, lowPowerMode = false) {
    renderer.drawWorldLayer((ctx) => {
      for (let i = 0; i < this.objects.length; i += 1) {
        if (lowPowerMode && i > 2) continue;
        const object = this.objects[i];
        ctx.save();
        ctx.translate(object.x, object.y);
        ctx.rotate(object.rotation);
        ctx.strokeStyle = "rgba(154, 214, 255, 0.2)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(102, 206, 255, 0.24)";
        ctx.shadowBlur = 14;
        if (object.kind === 0) {
          ctx.strokeRect(-object.size * 0.5, -object.size * 0.18, object.size, object.size * 0.36);
        } else if (object.kind === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, object.size * 0.42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-object.size * 0.6, 0);
          ctx.lineTo(object.size * 0.6, 0);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -object.size * 0.5);
          ctx.lineTo(object.size * 0.45, 0);
          ctx.lineTo(0, object.size * 0.5);
          ctx.lineTo(-object.size * 0.45, 0);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }
    });
  }
}
