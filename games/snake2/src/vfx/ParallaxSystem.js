export class ParallaxSystem {
  constructor() {
    this.layers = [];
    this.lastKey = "";
  }

  ensure(bounds) {
    const key = `${bounds.width}|${bounds.height}`;
    if (this.lastKey === key && this.layers.length > 0) return;
    this.lastKey = key;
    this.layers = [
      this.#buildLayer(bounds, 18, 0.08, 0.24, 38),
      this.#buildLayer(bounds, 11, 0.14, 0.34, 62),
      this.#buildLayer(bounds, 7, 0.2, 0.42, 92)
    ];
  }

  #buildLayer(bounds, count, drift, alpha, size) {
    return {
      drift,
      alpha,
      size,
      nodes: Array.from({ length: count }, () => ({
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        scale: 0.7 + (Math.random() * 0.8)
      }))
    };
  }

  draw(renderer, bounds, cameraState, timeSec, lowPowerMode = false) {
    this.ensure(bounds);
    renderer.drawWorldLayer((ctx) => {
      for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex += 1) {
        const layer = this.layers[layerIndex];
        if (lowPowerMode && layerIndex > 1) continue;
        for (let i = 0; i < layer.nodes.length; i += 1) {
          const node = layer.nodes[i];
          const driftX = Math.sin((timeSec * layer.drift) + i) * (16 + (layerIndex * 12));
          const driftY = Math.cos((timeSec * layer.drift * 0.7) + i) * (10 + (layerIndex * 8));
          const radius = layer.size * node.scale;
          const gradient = ctx.createRadialGradient(node.x + driftX, node.y + driftY, 1, node.x + driftX, node.y + driftY, radius);
          gradient.addColorStop(0, `rgba(214, 239, 255, ${layer.alpha})`);
          gradient.addColorStop(1, "rgba(214, 239, 255, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x + driftX, node.y + driftY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }
}
