import { WeatherSystem } from "../vfx/WeatherSystem.js";

export class AtmosphericRenderer {
  constructor(ambientWorldManager) {
    this.ambientWorldManager = ambientWorldManager;
    this.weather = new WeatherSystem();
  }

  draw(renderer, bounds, cameraState, timeSec, options = {}) {
    const ambient = this.ambientWorldManager;
    const theme = options.theme || {};
    const heat = options.heat || 0;
    const lowPowerMode = Boolean(options.lowPowerMode);

    ambient.life.parallax.draw(renderer, bounds, cameraState, timeSec, lowPowerMode);
    ambient.life.fog.draw(renderer, bounds, theme, heat, lowPowerMode);
    ambient.life.rivers.draw(renderer, bounds, timeSec, theme, heat, lowPowerMode);
    ambient.life.objects.draw(renderer, lowPowerMode);
    ambient.life.creatures.draw(renderer, lowPowerMode);
    ambient.life.terrain.draw(renderer, theme, lowPowerMode);

    const pulseAmount = ambient.life.pulse.getPulse(timeSec, heat);
    renderer.drawScreenLayer((ctx, viewport) => {
      const overlay = ctx.createLinearGradient(0, 0, viewport.width, viewport.height);
      overlay.addColorStop(0, `rgba(16, 42, 76, ${0.08 + pulseAmount * 0.3})`);
      overlay.addColorStop(0.58, "rgba(0, 0, 0, 0)");
      overlay.addColorStop(1, `rgba(111, 58, 158, ${0.04 + pulseAmount * 0.18})`);
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, viewport.width, viewport.height);
    });

    const event = ambient.getActiveEvent();
    if (event?.tint) {
      renderer.drawWorldLayer((ctx) => {
        ctx.save();
        ctx.fillStyle = event.tint;
        ctx.fillRect(0, 0, bounds.width, bounds.height);
        ctx.restore();
      });
    }

    this.weather.drawScreenEvent(renderer, renderer.getViewportMetrics(), event, timeSec, lowPowerMode);
  }
}
