const cardinalDirs = [
  { name: "up", x: 0, y: -1 },
  { name: "down", x: 0, y: 1 },
  { name: "left", x: -1, y: 0 },
  { name: "right", x: 1, y: 0 }
];

function key(x, y) {
  return `${x}|${y}`;
}

function toCell(value, cellSize) {
  return Math.max(0, Math.floor(value / cellSize));
}

function nearestDistanceToSegments(x, y, segments) {
  let best = Infinity;
  for (let i = 0; i < segments.length; i += 1) {
    const dx = segments[i].x - x;
    const dy = segments[i].y - y;
    const d = Math.hypot(dx, dy);
    if (d < best) best = d;
  }
  return best;
}

export class Pathfinding {
  static chooseDirection(params) {
    const {
      head,
      currentDir,
      food,
      bounds,
      cellSize,
      ownSegments,
      opponentSegments,
      obstacles,
      personality,
      difficulty
    } = params;

    const cols = Math.max(1, Math.floor(bounds.width / cellSize));
    const rows = Math.max(1, Math.floor(bounds.height / cellSize));
    const occupied = new Set();

    for (let i = 1; i < ownSegments.length; i += 1) {
      occupied.add(key(toCell(ownSegments[i].x, cellSize), toCell(ownSegments[i].y, cellSize)));
    }
    for (let i = 0; i < opponentSegments.length; i += 1) {
      occupied.add(key(toCell(opponentSegments[i].x, cellSize), toCell(opponentSegments[i].y, cellSize)));
    }

    const reverseName = currentDir ? cardinalDirs.find(
      (dir) => (dir.x + currentDir.x === 0) && (dir.y + currentDir.y === 0)
    )?.name : null;

    let best = null;
    for (let i = 0; i < cardinalDirs.length; i += 1) {
      const dir = cardinalDirs[i];
      if (reverseName && dir.name === reverseName) continue;
      const score = Pathfinding.#scoreDirection({
        dir,
        head,
        food,
        bounds,
        cols,
        rows,
        cellSize,
        occupied,
        ownSegments,
        opponentSegments,
        obstacles,
        personality,
        difficulty
      });
      if (!best || score > best.score) {
        best = { dir: dir.name, score };
      }
    }

    return best?.dir || "right";
  }

  static #scoreDirection(args) {
    const {
      dir,
      head,
      food,
      bounds,
      cols,
      rows,
      cellSize,
      occupied,
      ownSegments,
      opponentSegments,
      obstacles,
      personality,
      difficulty
    } = args;

    const nextX = head.x + (dir.x * cellSize);
    const nextY = head.y + (dir.y * cellSize);
    if (nextX < 8 || nextX > bounds.width - 8 || nextY < 8 || nextY > bounds.height - 8) {
      return -99999;
    }

    for (let i = 0; i < obstacles.length; i += 1) {
      const obstacle = obstacles[i];
      const dx = obstacle.x - nextX;
      const dy = obstacle.y - nextY;
      const avoidR = obstacle.radius + (cellSize * 0.45);
      if ((dx * dx) + (dy * dy) <= (avoidR * avoidR)) {
        return -80000;
      }
    }

    const nextCellKey = key(toCell(nextX, cellSize), toCell(nextY, cellSize));
    if (occupied.has(nextCellKey)) {
      return -85000;
    }

    // Fast local flood-fill to estimate open space safety.
    const openSpaceScore = Pathfinding.#estimateOpenSpace(nextX, nextY, cols, rows, cellSize, occupied);
    const foodDist = Math.hypot(food.x - nextX, food.y - nextY);
    const oppDist = nearestDistanceToSegments(nextX, nextY, opponentSegments);
    const selfDist = nearestDistanceToSegments(nextX, nextY, ownSegments.slice(2));
    const riskPenalty = Math.max(0, (cellSize * 3.6) - Math.min(oppDist, selfDist));
    const randomDrift = (Math.random() - 0.5) * personality.randomness * 40;

    return (
      (openSpaceScore * personality.safetyWeight * (0.9 + difficulty.aiRisk * 0.1))
      - (foodDist * personality.foodWeight * 0.075)
      - (riskPenalty * personality.safetyWeight * 2.6)
      + ((bounds.width - oppDist) * personality.aggressionWeight * 0.02)
      + randomDrift
    );
  }

  static #estimateOpenSpace(startX, startY, cols, rows, cellSize, occupied) {
    const sx = toCell(startX, cellSize);
    const sy = toCell(startY, cellSize);
    const queue = [{ x: sx, y: sy }];
    const visited = new Set([key(sx, sy)]);
    let count = 0;
    const maxScan = 64;

    while (queue.length > 0 && count < maxScan) {
      const cell = queue.shift();
      count += 1;
      const neighbors = [
        { x: cell.x + 1, y: cell.y },
        { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 },
        { x: cell.x, y: cell.y - 1 }
      ];
      for (let i = 0; i < neighbors.length; i += 1) {
        const n = neighbors[i];
        if (n.x < 0 || n.y < 0 || n.x >= cols || n.y >= rows) continue;
        const k = key(n.x, n.y);
        if (visited.has(k) || occupied.has(k)) continue;
        visited.add(k);
        queue.push(n);
      }
    }

    return count;
  }
}
