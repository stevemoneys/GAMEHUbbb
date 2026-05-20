export class AmbientCreatureSystem {
  constructor() {
    this.creatures = [];
    this.lastKey = "";
    this.types = ["butterfly", "jelly", "drone", "spirit_bird"];
  }

  ensure(bounds) {
    const key = `${bounds.width}|${bounds.height}`;
    if (this.lastKey === key && this.creatures.length > 0) return;
    this.lastKey = key;
    this.creatures = Array.from({ length: 14 }, (_, index) => ({
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      speed: 14 + (Math.random() * 24),
      radius: 7 + (Math.random() * 10),
      phase: Math.random() * Math.PI * 2,
      lane: index % 4,
      type: this.types[index % this.types.length],
      driftY: 12 + (Math.random() * 22)
    }));
  }

  update(dt, bounds, context = {}) {
    this.ensure(bounds);
    const playerHead = context.playerHead || null;
    const activeEvent = context.activeEvent?.type || "";
    const alertBoost = activeEvent === "lightning_storm" || activeEvent === "corruption_wave" ? 1.45 : 1;
    const calmBoost = activeEvent === "ice_storm" ? 0.84 : 1;
    for (let i = 0; i < this.creatures.length; i += 1) {
      const creature = this.creatures[i];
      const speed = creature.speed * alertBoost * calmBoost;
      creature.x += speed * dt;
      if (creature.x > bounds.width + 40) {
        creature.x = -40;
        creature.y = Math.random() * bounds.height;
      }
      if (playerHead) {
        const dx = creature.x - playerHead.x;
        const dy = creature.y - playerHead.y;
        const distSq = (dx * dx) + (dy * dy);
        if (distSq < 42000) {
          creature.y += (dy >= 0 ? 1 : -1) * 34 * alertBoost * dt;
        }
      }
      creature.alert = activeEvent !== "";
      creature.phase += dt * 1.6;
    }
  }

  draw(renderer, lowPowerMode = false) {
    if (lowPowerMode) return;
    renderer.drawWorldLayer((ctx) => {
      for (let i = 0; i < this.creatures.length; i += 1) {
        const creature = this.creatures[i];
        const y = creature.y + (Math.sin(creature.phase) * creature.driftY);
        const wing = 0.65 + ((Math.sin(creature.phase * 6) + 1) * 0.18);
        const rotation = Math.sin(creature.phase) * 0.18;
        const glowAlpha = creature.alert ? 0.58 : 0.38;

        ctx.save();
        ctx.translate(creature.x, y);
        ctx.rotate(rotation);
        ctx.shadowColor = `rgba(143, 232, 255, ${glowAlpha})`;
        ctx.shadowBlur = creature.alert ? 20 : 14;

        if (creature.type === "butterfly") {
          ctx.fillStyle = creature.alert ? "rgba(216, 250, 255, 0.72)" : "rgba(186, 245, 255, 0.56)";
          ctx.beginPath();
          ctx.ellipse(-creature.radius * 0.6, 0, creature.radius * wing, creature.radius * 0.72, -0.4, 0, Math.PI * 2);
          ctx.ellipse(creature.radius * 0.6, 0, creature.radius * wing, creature.radius * 0.72, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255, 198, 239, 0.82)";
          ctx.fillRect(-1.2, -creature.radius * 0.9, 2.4, creature.radius * 1.8);
        } else if (creature.type === "spirit_bird") {
          ctx.strokeStyle = creature.alert ? "rgba(236, 252, 255, 0.82)" : "rgba(206, 244, 255, 0.68)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-creature.radius, creature.radius * 0.3);
          ctx.quadraticCurveTo(0, -creature.radius * wing, creature.radius, creature.radius * 0.3);
          ctx.stroke();
        } else if (creature.type === "drone") {
          ctx.fillStyle = creature.alert ? "rgba(208, 240, 255, 0.58)" : "rgba(177, 226, 255, 0.44)";
          ctx.beginPath();
          ctx.arc(0, 0, creature.radius * 0.58, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-creature.radius, 0);
          ctx.lineTo(creature.radius, 0);
          ctx.moveTo(0, -creature.radius);
          ctx.lineTo(0, creature.radius);
          ctx.stroke();
        } else {
          ctx.fillStyle = creature.alert ? "rgba(194, 255, 255, 0.52)" : "rgba(165, 247, 255, 0.38)";
          ctx.beginPath();
          ctx.ellipse(0, 0, creature.radius * 0.8, creature.radius * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(210, 255, 255, 0.26)";
          for (let t = 0; t < 4; t += 1) {
            ctx.beginPath();
            ctx.moveTo((-creature.radius * 0.45) + (t * creature.radius * 0.3), creature.radius * 0.35);
            ctx.lineTo((-creature.radius * 0.35) + (t * creature.radius * 0.28), creature.radius * 1.1);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    });
  }
}
