function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class WorldHeatmapSystem {
  build(bounds, context = {}) {
    const player = context.playerHead || null;
    const ai = context.aiHead || null;
    const center = {
      x: bounds.x + (bounds.width * 0.5),
      y: bounds.y + (bounds.height * 0.5)
    };

    return {
      bounds,
      center,
      player,
      ai,
      score: context.score || 0,
      modeName: context.modeName || "classic",
      getSafety(point) {
        const edgeInset = Math.min(
          point.x - bounds.x,
          point.y - bounds.y,
          (bounds.x + bounds.width) - point.x,
          (bounds.y + bounds.height) - point.y
        );
        const edgeRatio = clamp(edgeInset / Math.max(1, Math.min(bounds.width, bounds.height) * 0.24), 0, 1);
        const aiPressure = ai ? clamp(distance(point, ai) / Math.max(1, bounds.width * 0.2), 0, 1) : 1;
        return clamp((edgeRatio * 0.58) + (aiPressure * 0.42), 0, 1);
      },
      getContest(point) {
        if (!player || !ai) return 0;
        const midpoint = {
          x: (player.x + ai.x) * 0.5,
          y: (player.y + ai.y) * 0.5
        };
        const toMid = distance(point, midpoint);
        const toPlayer = distance(point, player);
        const toAI = distance(point, ai);
        const balance = 1 - clamp(Math.abs(toPlayer - toAI) / Math.max(1, bounds.width * 0.25), 0, 1);
        const centerBias = 1 - clamp(toMid / Math.max(1, bounds.width * 0.18), 0, 1);
        return clamp((balance * 0.6) + (centerBias * 0.4), 0, 1);
      },
      getExploration(point) {
        const centerDist = distance(point, center);
        const cornerBias = clamp(centerDist / Math.max(1, bounds.width * 0.42), 0, 1);
        const playerDist = player ? clamp(distance(point, player) / Math.max(1, bounds.width * 0.18), 0, 1) : 0.6;
        return clamp((cornerBias * 0.55) + (playerDist * 0.45), 0, 1);
      },
      getHazard(point) {
        const edgeInset = Math.min(
          point.x - bounds.x,
          point.y - bounds.y,
          (bounds.x + bounds.width) - point.x,
          (bounds.y + bounds.height) - point.y
        );
        return 1 - clamp(edgeInset / Math.max(1, Math.min(bounds.width, bounds.height) * 0.18), 0, 1);
      }
    };
  }
}
