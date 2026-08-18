export class LayerRenderer {
  static cullCircles(items, viewBounds, getRadius = (item) => item.radius || item.size || 0) {
    if (!Array.isArray(items) || !viewBounds) return [];
    const minX = viewBounds.x;
    const minY = viewBounds.y;
    const maxX = viewBounds.x + viewBounds.width;
    const maxY = viewBounds.y + viewBounds.height;

    return items.filter((item) => {
      const radius = Math.max(0, getRadius(item));
      return (
        item.x + radius >= minX
        && item.y + radius >= minY
        && item.x - radius <= maxX
        && item.y - radius <= maxY
      );
    });
  }

  static isPointVisible(point, viewBounds, padding = 0) {
    if (!point || !viewBounds) return false;
    return (
      point.x >= viewBounds.x - padding
      && point.y >= viewBounds.y - padding
      && point.x <= viewBounds.x + viewBounds.width + padding
      && point.y <= viewBounds.y + viewBounds.height + padding
    );
  }
}
