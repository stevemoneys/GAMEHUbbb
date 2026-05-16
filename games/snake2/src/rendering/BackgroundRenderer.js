export class BackgroundRenderer {
  constructor(worldManager) {
    this.worldManager = worldManager;
    this.nodes = [];
    this.lastKey = "";
  }

  ensureNodes() {
    const bounds = this.worldManager.getBounds();
    const key = `${bounds.width}|${bounds.height}`;
    if (this.lastKey === key && this.nodes.length > 0) return;
    this.lastKey = key;
    this.nodes = [];

    const count = Math.max(48, Math.round((bounds.width * bounds.height) / 88000));
    for (let i = 0; i < count; i += 1) {
      this.nodes.push({
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        radius: 8 + (Math.random() * 26),
        alpha: 0.06 + (Math.random() * 0.12),
        speed: 0.12 + (Math.random() * 0.34)
      });
    }
  }

  draw(renderer, cameraState, timeSec, lowPowerMode = false) {
    this.ensureNodes();
    renderer.drawWorldLayer((ctx) => {
      for (let i = 0; i < this.nodes.length; i += 1) {
        if (lowPowerMode && i % 2 === 1) continue;
        const node = this.nodes[i];
        const wobbleX = Math.cos((timeSec * node.speed) + i) * 12;
        const wobbleY = Math.sin((timeSec * node.speed * 0.8) + i) * 8;
        const gradient = ctx.createRadialGradient(
          node.x + wobbleX,
          node.y + wobbleY,
          1,
          node.x + wobbleX,
          node.y + wobbleY,
          node.radius
        );
        gradient.addColorStop(0, `rgba(112, 238, 255, ${node.alpha})`);
        gradient.addColorStop(1, "rgba(112, 238, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x + wobbleX, node.y + wobbleY, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    renderer.drawScreenLayer((ctx, viewport) => {
      const overlay = ctx.createLinearGradient(0, 0, viewport.width, viewport.height);
      overlay.addColorStop(0, "rgba(14, 35, 58, 0.12)");
      overlay.addColorStop(0.45, "rgba(2, 8, 16, 0)");
      overlay.addColorStop(1, "rgba(120, 54, 165, 0.08)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, viewport.width, viewport.height);
    });
  }
}
