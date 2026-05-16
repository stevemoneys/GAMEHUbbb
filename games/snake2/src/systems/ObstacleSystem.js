function randRange(min, max) {
  return min + (Math.random() * (max - min));
}

function distSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return (dx * dx) + (dy * dy);
}

export class ObstacleSystem {
  constructor() {
    this.obstacles = [];
    this.pool = [];
  }

  clear() {
    while (this.obstacles.length > 0) {
      this.pool.push(this.obstacles.pop());
    }
  }

  #alloc() {
    return this.pool.pop() || {
      type: "static",
      x: 0,
      y: 0,
      radius: 20,
      vx: 0,
      vy: 0,
      ttl: Infinity,
      warningTime: 0
    };
  }

  spawnSafe(bounds, forbiddenPoints, options = {}) {
    const radius = options.radius ?? 20;
    const type = options.type ?? "static";
    const movingSpeed = options.movingSpeed ?? 90;
    const ttl = options.ttl ?? Infinity;
    const warningTime = options.warningTime ?? 0;

    const ox = Number.isFinite(bounds.x) ? bounds.x : 0;
    const oy = Number.isFinite(bounds.y) ? bounds.y : 0;
    const minX = ox + radius + 8;
    const maxX = ox + bounds.width - radius - 8;
    const minY = oy + radius + 8;
    const maxY = oy + bounds.height - radius - 8;

    for (let i = 0; i < 120; i += 1) {
      const x = randRange(minX, maxX);
      const y = randRange(minY, maxY);
      const unsafe = forbiddenPoints.some((point) => distSq(x, y, point.x, point.y) < ((point.r + radius + 22) ** 2));
      if (unsafe) continue;

      const obstacle = this.#alloc();
      obstacle.type = type;
      obstacle.x = x;
      obstacle.y = y;
      obstacle.radius = radius;
      obstacle.ttl = ttl;
      obstacle.warningTime = warningTime;
      if (type === "moving") {
        const angle = randRange(0, Math.PI * 2);
        obstacle.vx = Math.cos(angle) * movingSpeed;
        obstacle.vy = Math.sin(angle) * movingSpeed;
      } else {
        obstacle.vx = 0;
        obstacle.vy = 0;
      }
      this.obstacles.push(obstacle);
      return obstacle;
    }

    return null;
  }

  update(dt, bounds) {
    const ox = Number.isFinite(bounds.x) ? bounds.x : 0;
    const oy = Number.isFinite(bounds.y) ? bounds.y : 0;
    const maxX = ox + bounds.width;
    const maxY = oy + bounds.height;

    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = this.obstacles[i];
      obstacle.warningTime = Math.max(0, obstacle.warningTime - dt);

      if (obstacle.type === "moving") {
        obstacle.x += obstacle.vx * dt;
        obstacle.y += obstacle.vy * dt;

        if (obstacle.x - obstacle.radius < ox || obstacle.x + obstacle.radius > maxX) {
          obstacle.vx *= -1;
          obstacle.x = Math.max(ox + obstacle.radius, Math.min(maxX - obstacle.radius, obstacle.x));
        }
        if (obstacle.y - obstacle.radius < oy || obstacle.y + obstacle.radius > maxY) {
          obstacle.vy *= -1;
          obstacle.y = Math.max(oy + obstacle.radius, Math.min(maxY - obstacle.radius, obstacle.y));
        }
      }

      obstacle.ttl -= dt;
      if (obstacle.ttl <= 0) {
        this.pool.push(obstacle);
        this.obstacles.splice(i, 1);
      }
    }
  }

  collidesCircle(x, y, radius) {
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      const r = radius + obstacle.radius;
      if (distSq(x, y, obstacle.x, obstacle.y) <= (r * r)) return true;
    }
    return false;
  }

  getObstacles() {
    return this.obstacles;
  }
}
