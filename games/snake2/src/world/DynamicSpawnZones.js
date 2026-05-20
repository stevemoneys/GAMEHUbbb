function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ringPoint(cx, cy, angle, radiusX, radiusY) {
  return {
    x: cx + (Math.cos(angle) * radiusX),
    y: cy + (Math.sin(angle) * radiusY)
  };
}

export class DynamicSpawnZones {
  buildZones(bounds, heatmap, context = {}) {
    const center = heatmap.center;
    const safeInset = Math.min(bounds.width, bounds.height) * 0.18;
    const exploreInset = Math.min(bounds.width, bounds.height) * 0.28;
    const ringX = bounds.width * 0.26;
    const ringY = bounds.height * 0.22;
    const mode = context.modeName || "classic";

    const combatShift = mode === "duel" ? 0.55 : mode === "speed" ? 0.35 : 0.18;

    return {
      safe: [
        { x: center.x - ringX, y: center.y - (ringY * 0.2) },
        { x: center.x - (ringX * 0.15), y: center.y - ringY },
        { x: center.x + (ringX * 0.7), y: center.y + (ringY * 0.25) }
      ],
      combat: [
        { x: center.x, y: center.y },
        { x: center.x + (ringX * combatShift), y: center.y - (ringY * 0.2) },
        { x: center.x - (ringX * combatShift), y: center.y + (ringY * 0.15) }
      ],
      exploration: [
        { x: bounds.x + exploreInset, y: bounds.y + (bounds.height * 0.24) },
        { x: bounds.x + bounds.width - exploreInset, y: bounds.y + (bounds.height * 0.72) },
        { x: bounds.x + (bounds.width * 0.16), y: bounds.y + bounds.height - exploreInset }
      ],
      hazard: [
        { x: bounds.x + safeInset, y: center.y },
        { x: bounds.x + bounds.width - safeInset, y: center.y },
        { x: center.x, y: bounds.y + safeInset },
        { x: center.x, y: bounds.y + bounds.height - safeInset }
      ],
      routes: Array.from({ length: 6 }, (_, index) => {
        const angle = ((Math.PI * 2) / 6) * index;
        const point = ringPoint(center.x, center.y, angle, ringX * 1.15, ringY * 1.15);
        return {
          x: clamp(point.x, bounds.x + safeInset, bounds.x + bounds.width - safeInset),
          y: clamp(point.y, bounds.y + safeInset, bounds.y + bounds.height - safeInset)
        };
      })
    };
  }
}
