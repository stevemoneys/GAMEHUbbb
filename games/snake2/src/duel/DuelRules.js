import { Collision } from "../systems/Collision.js";

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
  // Any body hit beyond the enemy head can become a bite.
  // Near-head bites are riskier and should pay out more.
  if (hitIndex < 1 || victimSegments.length <= 8) return null;
  const normalizedDepth = 1 - ((hitIndex - 1) / Math.max(1, victimSegments.length - 2));
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

    let reason = "collision";
    if (headToHead) reason = "head_to_head";
    else if (playerWall) reason = "player_wall";
    else if (playerSelf) reason = "player_self";
    else if (playerObstacle) reason = "player_obstacle";
    else if (playerEnemy) reason = "player_enemy";
    else if (aiWall) reason = "ai_wall";
    else if (aiSelf) reason = "ai_self";
    else if (aiObstacle) reason = "ai_obstacle";
    else if (aiEnemy) reason = "ai_enemy";

    return {
      playerDead,
      aiDead,
      playerWall,
      aiWall,
      playerSelf,
      aiSelf,
      playerObstacle,
      aiObstacle,
      playerEnemy,
      aiEnemy,
      playerBite,
      aiBite,
      headToHead,
      reason
    };
  }
}
