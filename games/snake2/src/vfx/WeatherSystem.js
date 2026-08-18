export class WeatherSystem {
  drawScreenEvent(renderer, viewport, activeEvent, timeSec, lowPowerMode = false) {
    if (!activeEvent) return;
    renderer.drawScreenLayer((ctx, metrics) => {
      if (activeEvent.type === "lightning_storm") {
        const alpha = 0.08 + (Math.sin(timeSec * 6.4) * 0.06);
        ctx.fillStyle = `rgba(160, 220, 255, ${Math.max(0, alpha)})`;
        ctx.fillRect(0, 0, metrics.width, metrics.height);
      } else if (activeEvent.type === "corruption_wave") {
        ctx.fillStyle = `rgba(198, 110, 255, ${0.05 + ((Math.sin(timeSec * 2.2) + 1) * 0.03)})`;
        ctx.fillRect(0, 0, metrics.width, metrics.height);
      } else if (activeEvent.type === "ice_storm") {
        ctx.fillStyle = `rgba(175, 235, 255, ${0.04 + ((Math.sin(timeSec * 1.7) + 1) * 0.025)})`;
        ctx.fillRect(0, 0, metrics.width, metrics.height);
      }

      if (lowPowerMode) return;

      if (activeEvent.type === "meteor_shower" || activeEvent.type === "solar_eruption") {
        ctx.save();
        ctx.strokeStyle = activeEvent.type === "meteor_shower"
          ? "rgba(255, 214, 152, 0.4)"
          : "rgba(255, 143, 92, 0.36)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
          const startX = ((i * 143) + (timeSec * 90)) % (metrics.width + 120);
          const startY = (i * 48) % metrics.height;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX - 34, startY + 56);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (activeEvent.type === "crystal_eruption") {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 179, 240, 0.34)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i += 1) {
          const cx = ((i * 180) + (timeSec * 18)) % (metrics.width + 80);
          const cy = 80 + ((i * 72) % Math.max(120, metrics.height - 160));
          ctx.beginPath();
          ctx.moveTo(cx, cy - 18);
          ctx.lineTo(cx + 14, cy);
          ctx.lineTo(cx, cy + 18);
          ctx.lineTo(cx - 14, cy);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "700 14px 'Trebuchet MS', 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(236, 246, 255, 0.78)";
      ctx.shadowColor = "rgba(0, 229, 255, 0.22)";
      ctx.shadowBlur = 10;
      const label = (activeEvent.title || activeEvent.type.replaceAll("_", " ")).toUpperCase();
      ctx.fillText(label, metrics.width * 0.5, 18);
      ctx.restore();
    });
  }
}
