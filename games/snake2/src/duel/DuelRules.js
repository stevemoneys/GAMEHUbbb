import { Collision } from "../systems/Collision.js";

function collidesWithSnake(head, headRadius, segments, ignoreHead = true) {
  const start = ignoreHead ? 1 : 0;
  for (let i = start; i < segments.length; i += 1) {
    const seg = segments[i];
    const dx = seg.x - head.x;
    const dy = seg.y - head.y;
    if ((dx * dx) + (dy * dy) <= ((headRadius * 1.02) ** 2)) return true;
  }
  return false;
}

function findBodyContact(head, headRadius, segments, startIndex = 1) {
  for (let i = startIndex; i < segments.length; i += 1) {
    const seg = segments[i];
    const dx = seg.x - head.x;
    const dy = seg.y - head.y;
    if ((dx * dx) + (dy * dy) <= ((headRadius * 1.02) ** 2)) {
      return i;
    }
  }
  return -1;
}

function buildBiteEvent(attackerSegments, victimSegments, hitIndex) {
  if (hitIndex < 2 || victimSegments.length <= 8) return null;
  const normalizedDepth = 1 - ((hitIndex - 2) / Math.max(1, victimSegments.length - 3));
  const severity = Math.max(0.18, Math.min(1, normalizedDepth));
  const victimLoss = Math.max(1, Math.min(6, Math.round(1 + (severity * 5))));
  const attackerGain = Math.max(1, Math.min(5, Math.round(1 + (severity * 4))));
  return {
    hitIndex,
    severity,
    victimLoss,
    attackerGain
  };
}

export class DuelRules {
  static evaluateCollisionState(snapshot) {
    const {
      playerSegments,
      aiSegments,
      playerHeadRadius,
      aiHeadRadius,
      bounds,
      obstacleSystem,
      ignoreCount
    } = snapshot;

    const playerHead = playerSegments[0];
    const aiHead = aiSegments[0];

    const playerWall = Collision.isWallCollision(playerHead, playerHeadRadius, bounds.width, bounds.height);
    const aiWall = Collision.isWallCollision(aiHead, aiHeadRadius, bounds.width, bounds.height);
    const playerSelf = Collision.isSelfCollision(playerSegments, playerHeadRadius, ignoreCount);
    const aiSelf = Collision.isSelfCollision(aiSegments, aiHeadRadius, ignoreCount);
    const playerEnemyHitIndex = findBodyContact(playerHead, playerHeadRadius, aiSegments, 1);
    const aiEnemyHitIndex = findBodyContact(aiHead, aiHeadRadius, playerSegments, 1);
    const playerBite = buildBiteEvent(playerSegments, aiSegments, playerEnemyHitIndex);
    const aiBite = buildBiteEvent(aiSegments, playerSegments, aiEnemyHitIndex);
    const playerEnemy = playerEnemyHitIndex >= 0 && !playerBite;
    const aiEnemy = aiEnemyHitIndex >= 0 && !aiBite;
    const playerObstacle = obstacleSystem ? obstacleSystem.collidesCircle(playerHead.x, playerHead.y, playerHeadRadius) : false;
    const aiObstacle = obstacleSystem ? obstacleSystem.collidesCircle(aiHead.x, aiHead.y, aiHeadRadius) : false;

    // Head-to-head tie check.
    const dx = playerHead.x - aiHead.x;
    const dy = playerHead.y - aiHead.y;
    const headToHead = ((dx * dx) + (dy * dy)) <= ((playerHeadRadius + aiHeadRadius) ** 2);

    const playerDead = playerWall || playerSelf || playerEnemy || playerObstacle || headToHead;
    const aiDead = aiWall || aiSelf || aiEnemy || aiObstacle || headToHead;

    return {
      playerDead,
      aiDead,
      playerBite,
      aiBite,
      headToHead,
      reason: headToHead ? "head_to_head" : "collision"
    };
  }
}
