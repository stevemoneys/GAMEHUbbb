function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class WorldBounds {
  constructor(width, height, options = {}) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.softMargin = Math.max(80, options.softMargin ?? 220);
    this.boundaryFade = Math.max(60, options.boundaryFade ?? 180);
    this.spawnInset = Math.max(90, options.spawnInset ?? 260);
  }

  getSize() {
    return { width: this.width, height: this.height };
  }

  getCollisionBounds() {
    return { width: this.width, height: this.height };
  }

  getSpawnBounds() {
    return {
      x: this.spawnInset,
      y: this.spawnInset,
      width: Math.max(1, this.width - (this.spawnInset * 2)),
      height: Math.max(1, this.height - (this.spawnInset * 2))
    };
  }

  getSoftBoundary() {
    return {
      width: this.width,
      height: this.height,
      softMargin: this.softMargin,
      boundaryFade: this.boundaryFade
    };
  }

  clampCamera(x, y, halfViewWidth, halfViewHeight) {
    const minX = halfViewWidth;
    const maxX = Math.max(halfViewWidth, this.width - halfViewWidth);
    const minY = halfViewHeight;
    const maxY = Math.max(halfViewHeight, this.height - halfViewHeight);
    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY)
    };
  }
}
