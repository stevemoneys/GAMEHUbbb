import { BaseMode } from "./BaseMode.js";

export class ClassicMode extends BaseMode {
  constructor(context) {
    super(context);
    this.name = "classic";
    this.displayName = "Classic";
    this.visualProfile = "classic";
    this.comboTimer = 0;
    this.comboWindow = 2.2;
  }

  initialize() {
    this.ctx.resetSharedState();
    const spawn = this.ctx.worldManager.getSpawnPoints("classic");
    this.ctx.playerSnake.setPose(spawn.player.x, spawn.player.y, spawn.player.dir);
    this.ctx.cameraSystem.jumpTo(spawn.player.x, spawn.player.y, 1);
    this.comboTimer = 0;
    this.ctx.scoreManager.setCombo(0);
    this.ctx.spawnFoodSafe();
  }

  update(dt) {
    const bounds = this.ctx.getBounds();
    this.comboTimer += dt;
    const scaling = this.updateDifficultyMetrics();
    this.updatePlayerDifficulty(scaling);

    this.ctx.playerSnake.update(dt);

    const hit = this.runPlayerCollisionChecks(bounds);
    if (hit.hitWall || hit.hitSelf) {
      if (this.ctx.absorbCollisionIfShielded("player", bounds)) return;
      this.ctx.onGameOver({
        reason: hit.hitWall ? "player_wall" : "player_self"
      });
      return;
    }

    if (this.handleFoodEatForPlayer(this.#getClassicPoints())) {
      if (this.comboTimer <= this.comboWindow) {
        this.ctx.scoreManager.setCombo(this.ctx.scoreManager.getCombo() + 1);
      } else {
        this.ctx.scoreManager.setCombo(1);
      }
      this.comboTimer = 0;
      if (this.tryCompleteLengthStage()) return;
    }

    if (this.comboTimer > this.comboWindow * 1.5) {
      this.ctx.scoreManager.setCombo(0);
    }
  }

  #getClassicPoints() {
    const base = this.ctx.config.scoring.foodPoints;
    const combo = this.ctx.scoreManager.getCombo();
    return base + Math.min(20, combo * 2);
  }
}
