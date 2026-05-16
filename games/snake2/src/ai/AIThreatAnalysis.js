function cellKey(x, y) {
  return `${x}|${y}`;
}

function toCell(value, size) {
  return Math.max(0, Math.floor(value / size));
}

export class AIThreatAnalysis {
  static buildOccupancy({ ownSegments, enemySegments, cellSize }) {
    const occupied = new Set();
    for (let i = 1; i < ownSegments.length; i += 1) {
      occupied.add(cellKey(toCell(ownSegments[i].x, cellSize), toCell(ownSegments[i].y, cellSize)));
    }
    for (let i = 0; i < enemySegments.length; i += 1) {
      occupied.add(cellKey(toCell(enemySegments[i].x, cellSize), toCell(enemySegments[i].y, cellSize)));
    }
    return occupied;
  }

  static isWallThreat(x, y, bounds, margin = 6) {
    return x <= margin || y <= margin || x >= bounds.width - margin || y >= bounds.height - margin;
  }

  static isObstacleThreat(x, y, obstacles, inflate = 0) {
    for (let i = 0; i < obstacles.length; i += 1) {
      const obstacle = obstacles[i];
      const dx = obstacle.x - x;
      const dy = obstacle.y - y;
      const r = obstacle.radius + inflate;
      if ((dx * dx) + (dy * dy) <= (r * r)) return true;
    }
    return false;
  }

  static estimateOpenSpace(startX, startY, params) {
    const { cols, rows, cellSize, occupied, obstacles } = params;
    const sx = toCell(startX, cellSize);
    const sy = toCell(startY, cellSize);
    const queue = [{ x: sx, y: sy }];
    const seen = new Set([cellKey(sx, sy)]);
    let visited = 0;
    const maxScan = 110;

    while (queue.length > 0 && visited < maxScan) {
      const node = queue.shift();
      visited += 1;
      const neighbors = [
        { x: node.x + 1, y: node.y },
        { x: node.x - 1, y: node.y },
        { x: node.x, y: node.y + 1 },
        { x: node.x, y: node.y - 1 }
      ];
      for (let i = 0; i < neighbors.length; i += 1) {
        const n = neighbors[i];
        if (n.x < 0 || n.y < 0 || n.x >= cols || n.y >= rows) continue;
        const k = cellKey(n.x, n.y);
        if (seen.has(k) || occupied.has(k)) continue;
        const wx = (n.x + 0.5) * cellSize;
        const wy = (n.y + 0.5) * cellSize;
        if (AIThreatAnalysis.isObstacleThreat(wx, wy, obstacles, cellSize * 0.4)) continue;
        seen.add(k);
        queue.push(n);
      }
    }

    return visited;
  }

  static predictEnemyPath(enemySegments, steps, cellSize) {
    if (enemySegments.length < 2) return [];
    const head = enemySegments[0];
    const neck = enemySegments[1];
    const dx = head.x - neck.x;
    const dy = head.y - neck.y;
    const dir = Math.abs(dx) > Math.abs(dy)
      ? { x: dx >= 0 ? 1 : -1, y: 0 }
      : { x: 0, y: dy >= 0 ? 1 : -1 };
    const path = [];
    for (let i = 1; i <= steps; i += 1) {
      path.push({
        x: head.x + (dir.x * cellSize * i),
        y: head.y + (dir.y * cellSize * i)
      });
    }
    return path;
  }
}
