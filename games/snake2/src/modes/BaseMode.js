import { Collision } from "../systems/Collision.js";

export class BaseMode {
  constructor(context) {
    this.ctx = context;
    this.name = "base";
    this.displayName = "Base";
    this.visualProfile = "classic";
    this.eventWarning = null;
  }

  initialize() {}

  update(_dt) {}

  render(_alpha) {}

  cleanup() {}

  handleDirection(dir) {
    const mapped = this.ctx.mapInputDirection(dir);
    this.ctx.playerSnake.enqueueDirection(mapped);
  }

  getRenderState() {
    return {
      modeName: this.displayName,
      visualProfile: this.visualProfile,
      eventWarning: this.ctx.modeState.warningTimer > 0 ? this.eventWarning : null,
      aiSnake: null
    };
  }

  updateDifficultyMetrics(extra = {}) {
    const metrics = {
      score: this.ctx.scoreManager.getScore(),
      survivalTime: this.ctx.gameState.time,
      combo: this.ctx.scoreManager.getCombo(),
      ...extra
    };
    return this.ctx.difficultyScaler.update(metrics);
  }

  updatePlayerDifficulty(scaling) {
    this.ctx.playerSnake.setDifficultyContext({
      score: this.ctx.scoreManager.getScore() * scaling.speedMultiplier,
      time: this.ctx.gameState.time * scaling.speedMultiplier
    });
  }

  runPlayerCollisionChecks(bounds) {
    const head = this.ctx.playerSnake.getHead();
    const headRadius = this.ctx.playerSnake.getHeadRadius();
    const hitWall = Collision.isWallCollision(head, headRadius, bounds.width, bounds.height);
    const hitSelf = Collision.isSelfCollision(
      this.ctx.playerSnake.segments,
      headRadius,
      this.ctx.config.snake.selfCollisionIgnoreCount
    );
    return { hitWall, hitSelf, head, headRadius };
  }

  handleFoodEatForPlayer(basePoints = this.ctx.config.scoring.foodPoints) {
    return Boolean(this.ctx.collectFoodFor("player", {
      modeName: this.name,
      scoreBonus: Math.max(0, basePoints - this.ctx.config.scoring.foodPoints)
    }));
  }

  getLengthObjectiveTarget() {
    const snapshot = this.ctx.progressionManager.getSnapshot(this.name);
    return snapshot.stage.objectives.find((objective) => objective.type === "length")?.target || 16;
  }

  tryCompleteLengthStage() {
    const targetLength = this.getLengthObjectiveTarget();
    if (this.ctx.playerSnake.getSegmentCount() < targetLength) return false;

    const result = this.ctx.progressionManager.evaluateStageResult({
      playerWon: true,
      playerScore: this.ctx.scoreManager.getScore(),
      maxCombo: this.ctx.scoreManager.getCombo(),
      survivalTime: this.ctx.gameState.time,
      playerSnakeLength: this.ctx.playerSnake.getSegmentCount()
    }, this.name);

    this.eventWarning = "TARGET CLEAR";
    this.ctx.modeState.warningTimer = 1.4;
    this.ctx.onGameOver({
      reason: `${this.name}_length_clear`,
      playerWon: true,
      stageCleared: result.stageCleared === true
    });
    return true;
  }
}
