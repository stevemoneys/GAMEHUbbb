export class Food {
  constructor(config) {
    this.config = config;
    this.radius = config.food.radiusPx;
    this.x = 0;
    this.y = 0;
  }

  // Spawns food in a safe random spot that does not overlap snake body.
  spawn(snakeBody, canvasWidthOrBounds, canvasHeight) {
    const area = typeof canvasWidthOrBounds === "object" && canvasWidthOrBounds !== null
      ? {
        x: Number.isFinite(canvasWidthOrBounds.x) ? canvasWidthOrBounds.x : 0,
        y: Number.isFinite(canvasWidthOrBounds.y) ? canvasWidthOrBounds.y : 0,
        width: Number.isFinite(canvasWidthOrBounds.width) ? canvasWidthOrBounds.width : 0,
        height: Number.isFinite(canvasWidthOrBounds.height) ? canvasWidthOrBounds.height : 0
      }
      : {
        x: 0,
        y: 0,
        width: Number.isFinite(canvasWidthOrBounds) ? canvasWidthOrBounds : 0,
        height: Number.isFinite(canvasHeight) ? canvasHeight : 0
      };
    const maxAttempts = this.config.food.maxSpawnAttempts;
    const padding = Math.max(this.config.food.spawnPaddingPx, this.radius + 1);
    const minX = area.x + padding;
    const maxX = Math.max(minX, area.x + area.width - padding);
    const minY = area.y + padding;
    const maxY = Math.max(minY, area.y + area.height - padding);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const nextX = minX + (Math.random() * (maxX - minX));
      const nextY = minY + (Math.random() * (maxY - minY));

      const overlapsSnake = snakeBody.some((segment) => {
        const dx = segment.x - nextX;
        const dy = segment.y - nextY;
        const minDistance = this.radius * 1.85;
        return (dx * dx) + (dy * dy) < (minDistance * minDistance);
      });

      if (!overlapsSnake) {
        this.x = nextX;
        this.y = nextY;
        return;
      }
    }

    // Fallback: if random search fails, place near center safely.
    this.x = area.x + (area.width * 0.5);
    this.y = area.y + (area.height * 0.5);
  }
}
