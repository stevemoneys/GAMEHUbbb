import { BaseMode } from "./BaseMode.js";

function minDistanceToWall(head, bounds) {
  return Math.min(head.x, head.y, bounds.width - head.x, bounds.height - head.y);
}

export class SpeedMode extends BaseMode {
  constructor(context) {
    super(context);
    this.name = "speed";
    this.displayName = "Speed";
    this.visualProfile = "speed";
    this.burstTimer = 0;
    this.burstInterval = 8;
  }

  initialize() {
    this.ctx.resetSharedState();
    const spawn = this.ctx.worldManager.getSpawnPoints("speed");
    this.ctx.playerSnake.setPose(spawn.player.x, spawn.player.y, spawn.player.dir);
    this.ctx.cameraSystem.jumpTo(spawn.player.x, spawn.player.y, 1);
    this.ctx.modifierSystem.clear();
    this.burstTimer = 0;
    this.ctx.spawnFoodSafe();
  }

  update(dt) {
    const bounds = this.ctx.getBounds();
    this.burstTimer += dt;

    const scaling = this.updateDifficultyMetrics();
    const speedBoost = this.ctx.modifierSystem.getCombinedValue("double_speed", 1, "multiply");
    const aggressiveSpeed = (1.18 + (this.ctx.gameState.time * 0.012)) * scaling.speedMultiplier * speedBoost;
    this.ctx.playerSnake.setDifficultyContext({
      score: this.ctx.scoreManager.getScore() * aggressiveSpeed,
      time: this.ctx.gameState.time * aggressiveSpeed
    });

    if (this.burstTimer >= this.burstInterval / scaling.eventRate) {
      this.burstTimer = 0;
      this.ctx.modifierSystem.apply({
        type: "double_speed",
        value: 1.22,
        duration: 2.7,
        stackable: false,
        label: "Speed Burst"
      });
      this.eventWarning = "SPEED BURST";
      this.ctx.modeState.warningTimer = 1.1;
    }

    this.ctx.playerSnake.update(dt);
    const hit = this.runPlayerCollisionChecks(bounds);
    if (hit.hitWall || hit.hitSelf) {
      if (this.ctx.absorbCollisionIfShielded("player", bounds)) return;
      this.ctx.onGameOver("speed_crash");
      return;
    }

    const wallDist = minDistanceToWall(hit.head, bounds);
    if (wallDist < hit.headRadius * 2.1) {
      this.ctx.screenShake.addImpulse(0.45);
      this.eventWarning = "NEAR DEATH";
      this.ctx.modeState.warningTimer = 0.2;
    }

    if (this.handleFoodEatForPlayer(this.ctx.config.scoring.foodPoints + 2)) {
      this.ctx.scoreManager.setCombo(this.ctx.scoreManager.getCombo() + 1);
    }
  }
}
