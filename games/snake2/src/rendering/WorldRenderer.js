import { BackgroundRenderer } from "./BackgroundRenderer.js";
import { LayerRenderer } from "./LayerRenderer.js";
import { AmbientWorldManager } from "../world/AmbientWorldManager.js";
import { AtmosphericRenderer } from "../world/AtmosphericRenderer.js";

export class WorldRenderer {
  constructor(renderer, worldManager) {
    this.renderer = renderer;
    this.worldManager = worldManager;
    this.background = new BackgroundRenderer(worldManager);
    this.ambient = new AmbientWorldManager();
    this.atmosphere = new AtmosphericRenderer(this.ambient);
  }

  drawAtmosphere(cameraState, timeSec, lowPowerMode = false, options = {}) {
    const bounds = this.worldManager.getBounds();
    const dt = Number.isFinite(options.dt) ? options.dt : (1 / 60);
    this.ambient.update(dt, bounds, {
      modeName: options.modeName || "classic",
      timeSec,
      heat: options.heat || 0,
      playerHead: options.playerHead || null,
      aiHead: options.aiHead || null,
      theme: options.theme || null
    });

    this.background.draw(this.renderer, cameraState, timeSec, lowPowerMode);
    this.atmosphere.draw(this.renderer, bounds, cameraState, timeSec, {
      lowPowerMode,
      heat: options.heat || 0,
      theme: options.theme || null
    });
    this.drawSoftBounds();
  }

  getWorldEvent() {
    return this.ambient.getActiveEvent();
  }

  drawSoftBounds() {
    const bounds = this.worldManager.getSoftBoundary();
    this.renderer.drawWorldLayer((ctx) => {
      const margin = bounds.softMargin;
      const fade = bounds.boundaryFade;
      const width = bounds.width;
      const height = bounds.height;

      const left = ctx.createLinearGradient(0, 0, margin + fade, 0);
      left.addColorStop(0, "rgba(0, 0, 0, 0.68)");
      left.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, margin + fade, height);

      const right = ctx.createLinearGradient(width - margin - fade, 0, width, 0);
      right.addColorStop(0, "rgba(0, 0, 0, 0)");
      right.addColorStop(1, "rgba(0, 0, 0, 0.68)");
      ctx.fillStyle = right;
      ctx.fillRect(width - margin - fade, 0, margin + fade, height);

      const top = ctx.createLinearGradient(0, 0, 0, margin + fade);
      top.addColorStop(0, "rgba(0, 0, 0, 0.62)");
      top.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, width, margin + fade);

      const bottom = ctx.createLinearGradient(0, height - margin - fade, 0, height);
      bottom.addColorStop(0, "rgba(0, 0, 0, 0)");
      bottom.addColorStop(1, "rgba(0, 0, 0, 0.62)");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, height - margin - fade, width, margin + fade);

      ctx.strokeStyle = "rgba(90, 228, 255, 0.12)";
      ctx.lineWidth = 5;
      ctx.strokeRect(margin * 0.35, margin * 0.35, width - (margin * 0.7), height - (margin * 0.7));
    });
  }

  getVisibleObstacles(obstacles, cameraState) {
    return LayerRenderer.cullCircles(obstacles, this.worldManager.getVisibleBounds(cameraState), (item) => item.radius || 0);
  }

  getVisibleParticles(particles, cameraState) {
    return LayerRenderer.cullCircles(particles, this.worldManager.getVisibleBounds(cameraState), (item) => item.size || 0);
  }

  isFoodVisible(food, cameraState) {
    return LayerRenderer.isPointVisible(food, this.worldManager.getVisibleBounds(cameraState), 80);
  }

  getVisibleFoods(items, cameraState) {
    return LayerRenderer.cullCircles(items, this.worldManager.getVisibleBounds(cameraState), (item) => item.radius || 0);
  }
}
