// Pure collision helpers. They only return booleans and do not change game state.
export class Collision {
  static isFoodCollision(head, headRadius, food) {
    const dx = head.x - food.x;
    const dy = head.y - food.y;
    const hitDistance = headRadius + food.radius;
    return (dx * dx) + (dy * dy) <= (hitDistance * hitDistance);
  }

  static isWallCollision(head, headRadius, worldWidth, worldHeight) {
    return (
      head.x - headRadius < 0
      || head.y - headRadius < 0
      || head.x + headRadius > worldWidth
      || head.y + headRadius > worldHeight
    );
  }

  static isSelfCollision(segments, headRadius, ignoreCount = 4) {
    const head = segments[0];
    const startIndex = Math.max(1, ignoreCount);

    for (let i = startIndex; i < segments.length; i += 1) {
      const segment = segments[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      const minDistance = headRadius * 1.05;

      if ((dx * dx) + (dy * dy) <= (minDistance * minDistance)) {
        return true;
      }
    }

    return false;
  }
}
