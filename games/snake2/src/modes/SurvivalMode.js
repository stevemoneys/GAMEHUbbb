import { BaseMode } from "./BaseMode.js";
import { Collision } from "../systems/Collision.js";

export class SurvivalMode extends BaseMode {
  constructor(context) {
    super(context);
    this.name = "survival";
    this.displayName = "Survival";
    this.visualProfile = "survival";
    this.spawnTimer = 0;
    this.eventTimer = 0;
    this.dynamicPadding = 0;
    this.maxPadding = 140;
  }

  initialize() {
    this.ctx.resetSharedState();
    const spawn = this.ctx.worldManager.getSpawnPoints("survival");
    this.ctx.playerSnake.setPose(spawn.player.x, spawn.player.y, spawn.player.dir);
    this.ctx.cameraSystem.jumpTo(spawn.player.x, spawn.player.y, 1);
    this.ctx.obstacleSystem.clear();
    this.spawnTimer = 0;
    this.eventTimer = 0;
    this.dynamicPadding = 0;
    this.ctx.spawnFoodSafe();
  }

  update(dt) {
    const baseBounds = this.ctx.getBounds();
    this.spawnTimer += dt;
    this.eventTimer += dt;

    const scaling = this.updateDifficultyMetrics();
    this.updatePlayerDifficulty(scaling);

    // Arena slowly shrinks to increase long-term tension.
    this.dynamicPadding = Math.min(
      this.maxPadding,
      this.dynamicPadding + (dt * 1.8 * scaling.eventRate)
    );
    const arena = this.#getArena(baseBounds);

    this.ctx.playerSnake.update(dt);
    this.ctx.obstacleSystem.update(dt, arena);

    const hit = this.#checkPlayerInArena(arena);
    if (hit.hitWall || hit.hitSelf || hit.hitObstacle) {
      if (this.ctx.absorbCollisionIfShielded("player", arena)) return;
      this.ctx.onGameOver({
        reason: hit.hitObstacle ? "player_obstacle" : hit.hitWall ? "player_wall" : "player_self"
      });
      return;
    }

    const spawnInterval = Math.max(1.1, 4.2 / scaling.obstacleRate);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.#spawnObstacle(arena);
    }

    if (this.eventTimer >= Math.max(9.5, 15 / scaling.eventRate)) {
      this.eventTimer = 0;
      this.#triggerRandomEvent();
    }

    if (this.handleFoodEatForPlayer(this.ctx.config.scoring.foodPoints + 3)) {
      this.ctx.scoreManager.setCombo(this.ctx.scoreManager.getCombo() + 1);
    }
  }

  #getArena(bounds) {
    return {
      x: this.dynamicPadding,
      y: this.dynamicPadding,
      width: bounds.width - (this.dynamicPadding * 2),
      height: bounds.height - (this.dynamicPadding * 2)
    };
  }

  #checkPlayerInArena(arena) {
    const head = this.ctx.playerSnake.getHead();
    const headRadius = this.ctx.playerSnake.getHeadRadius();
    const hitWall = (
      head.x - headRadius < arena.x
      || head.y - headRadius < arena.y
      || head.x + headRadius > arena.x + arena.width
      || head.y + headRadius > arena.y + arena.height
    );
    const hitSelf = Collision.isSelfCollision(
      this.ctx.playerSnake.segments,
      headRadius,
      this.ctx.config.snake.selfCollisionIgnoreCount
    );
    const hitObstacle = this.ctx.obstacleSystem.collidesCircle(head.x, head.y, headRadius);
    return { hitWall, hitSelf, hitObstacle };
  }

  #spawnObstacle(arena) {
    const forbidden = this.ctx.collectForbiddenPoints();
    const roll = Math.random();
    if (roll < 0.6) {
      this.ctx.obstacleSystem.spawnSafe(arena, forbidden, {
        type: "static",
        radius: 18 + (Math.random() * 9),
        warningTime: 0.8
      });
      return;
    }
    if (roll < 0.86) {
      this.ctx.obstacleSystem.spawnSafe(arena, forbidden, {
        type: "moving",
        radius: 16 + (Math.random() * 8),
        movingSpeed: 75 + (Math.random() * 55),
        warningTime: 0.8
      });
      return;
    }

    // Temporary danger zone.
    this.ctx.obstacleSystem.spawnSafe(arena, forbidden, {
      type: "static",
      radius: 24 + (Math.random() * 12),
      ttl: 6 + (Math.random() * 4),
      warningTime: 1.2
    });
  }

  #triggerRandomEvent() {
    if (Math.random() < 0.5) {
      this.eventWarning = "ARENA SHRINK";
      this.ctx.modeState.warningTimer = 1.1;
      this.dynamicPadding = Math.min(this.maxPadding, this.dynamicPadding + 26);
    } else {
      this.eventWarning = "HAZARD SURGE";
      this.ctx.modeState.warningTimer = 1.1;
      this.spawnTimer = 999;
    }
  }

  getRenderState() {
    return {
      ...super.getRenderState(),
      obstacles: this.ctx.obstacleSystem.getObstacles(),
      arenaPadding: this.dynamicPadding
    };
  }
}
