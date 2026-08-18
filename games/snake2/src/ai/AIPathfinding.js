import { AIThreatAnalysis } from "./AIThreatAnalysis.js";

const CARDINAL = [
  { name: "up", x: 0, y: -1 },
  { name: "down", x: 0, y: 1 },
  { name: "left", x: -1, y: 0 },
  { name: "right", x: 1, y: 0 }
];

function reverseDirName(dir) {
  if (!dir) return null;
  return CARDINAL.find((item) => item.x + dir.x === 0 && item.y + dir.y === 0)?.name || null;
}

function nearestDistance(points, x, y) {
  let best = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i].x - x;
    const dy = points[i].y - y;
    const d = Math.hypot(dx, dy);
    if (d < best) best = d;
  }
  return best;
}

export class AIPathfinding {
  static evaluateDirections(input) {
    const {
      head,
      currentDirection,
      food,
      bounds,
      cellSize,
      ownSegments,
      enemySegments,
      obstacles,
      personality,
      levelConfig
    } = input;

    const cols = Math.max(1, Math.floor(bounds.width / cellSize));
    const rows = Math.max(1, Math.floor(bounds.height / cellSize));
    const occupied = AIThreatAnalysis.buildOccupancy({ ownSegments, enemySegments, cellSize });
    const reverse = reverseDirName(currentDirection);
    const enemyPrediction = AIThreatAnalysis.predictEnemyPath(enemySegments, levelConfig.lookAheadDepth, cellSize);

    const candidates = [];
    for (let i = 0; i < CARDINAL.length; i += 1) {
      const dir = CARDINAL[i];
      if (reverse && reverse === dir.name) continue;
      const result = AIPathfinding.#scoreRoute({
        dir,
        head,
        food,
        bounds,
        cellSize,
        cols,
        rows,
        occupied,
        ownSegments,
        obstacles,
        enemyPrediction,
        personality,
        levelConfig
      });
      candidates.push(result);
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates;
  }

  static #scoreRoute(params) {
    const {
      dir,
      head,
      food,
      bounds,
      cellSize,
      cols,
      rows,
      occupied,
      ownSegments,
      obstacles,
      enemyPrediction,
      personality,
      levelConfig
    } = params;

    const nextX = head.x + (dir.x * cellSize);
    const nextY = head.y + (dir.y * cellSize);
    const immediateWall = AIThreatAnalysis.isWallThreat(nextX, nextY, bounds, 5);
    const immediateObstacle = AIThreatAnalysis.isObstacleThreat(nextX, nextY, obstacles, cellSize * 0.42);
    const foodDist = Math.hypot(food.x - nextX, food.y - nextY);

    const collisionRisk = immediateWall || immediateObstacle ? 1 : 0;
    const openSpace = AIThreatAnalysis.estimateOpenSpace(nextX, nextY, {
      cols,
      rows,
      cellSize,
      occupied,
      obstacles
    });
    const selfSpacing = nearestDistance(ownSegments.slice(2), nextX, nextY);
    const enemyDist = nearestDistance(enemyPrediction, nextX, nextY);
    const pressure = Math.max(0, (cellSize * 6) - enemyDist);
    const trappedPenalty = openSpace < 12 ? (12 - openSpace) * 8 : 0;
    const uncertainty = (Math.random() - 0.5) * personality.unpredictability * 70;

    const score = (
      (openSpace * personality.safetyWeight * levelConfig.trapDetection)
      - (foodDist * personality.foodWeight * levelConfig.optimizationWeight * 0.08)
      - (collisionRisk * 100000)
      - (trappedPenalty * personality.safetyWeight)
      + (pressure * personality.aggressionWeight * levelConfig.pressureTactics * 0.9)
      + (selfSpacing * personality.safetyWeight * 0.22)
      + uncertainty
    );

    return { dir: dir.name, score, openSpace, foodDist, collisionRisk };
  }
}
