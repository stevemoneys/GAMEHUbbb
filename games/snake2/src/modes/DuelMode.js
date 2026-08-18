import { BaseMode } from "./BaseMode.js";

export class DuelMode extends BaseMode {
  constructor(context) {
    super(context);
    this.name = "duel";
    this.displayName = "Duel";
    this.visualProfile = "duel";
    this.progressSnapshot = null;
    this.outcome = null;
  }

  initialize() {
    this.ctx.resetSharedState();
    const bounds = this.ctx.getBounds();
    const spawn = this.ctx.worldManager.getSpawnPoints("duel");
    this.ctx.playerSnake.setPose(spawn.player.x, spawn.player.y, spawn.player.dir);
    this.ctx.cameraSystem.jumpTo(spawn.player.x, spawn.player.y, 1);
    this.ctx.aiSnake.reset(bounds, "right");
    this.ctx.aiSnake.setPose(spawn.ai.x, spawn.ai.y, spawn.ai.dir);

    this.progressSnapshot = this.ctx.duelManager.initialize();
    this.ctx.aiController.setPersonality(this.progressSnapshot.stage.personality);
    this.ctx.aiController.setLevel(this.progressSnapshot.stage.aiLevel);
    this.ctx.spawnFoodSafe([this.ctx.aiSnake.getSegments()]);
    this.eventWarning = this.ctx.duelManager.warningText;
    this.ctx.modeState.warningTimer = this.ctx.duelManager.warningTimer;
    this.outcome = null;
  }

  update(dt) {
    const bounds = this.ctx.getBounds();
    this.ctx.duelManager.update(dt);
    const difficulty = this.ctx.progressionManager.getDifficultySettings();
    const stageTarget = this.progressSnapshot?.stage?.objectives?.find((objective) => objective.type === "length")?.target || 0;

    const scoreDelta = (this.ctx.scoreManager.getScore() * 0.12) - (this.ctx.duelManager.aiScore * 0.09);
    this.ctx.aiController.adapt(scoreDelta);

    this.ctx.playerSnake.setDifficultyContext({
      score: this.ctx.scoreManager.getScore() * difficulty.playerSpeedBias,
      time: this.ctx.gameState.time * difficulty.playerSpeedBias
    });
    this.ctx.aiSnake.setDifficultyContext({
      score: this.ctx.duelManager.aiScore * 10 * difficulty.aiSpeedBias,
      time: this.ctx.gameState.time * difficulty.aiSpeedBias
    });

    this.ctx.aiController.update(dt, {
      aiHead: this.ctx.aiSnake.getHead(),
      aiSnakeSegments: this.ctx.aiSnake.getSegments(),
      playerSnakeSegments: this.ctx.playerSnake.segments,
      food: this.ctx.foodSystem,
      bounds,
      cellSize: this.ctx.config.world.cellSize,
      obstacles: this.ctx.obstacleSystem.getObstacles(),
      thinkInterval: difficulty.aiThinkInterval + (this.ctx.config.ai.dynamicThinkBoost || 0),
      enqueueDirection: (dir) => this.ctx.aiSnake.enqueueDirection(dir)
    });

    this.ctx.playerSnake.update(dt);
    this.ctx.aiSnake.update(dt);

    const collisions = this.ctx.duelManager.evaluateCollisions({
      playerSegments: this.ctx.playerSnake.segments,
      aiSegments: this.ctx.aiSnake.getSegments(),
      playerHeadRadius: this.ctx.playerSnake.getHeadRadius(),
      aiHeadRadius: this.ctx.aiSnake.getHeadRadius(),
      bounds,
      obstacleSystem: this.ctx.obstacleSystem,
      ignoreCount: this.ctx.config.snake.selfCollisionIgnoreCount
    });

    if (collisions.playerDead && this.ctx.absorbCollisionIfShielded("player", bounds)) {
      collisions.playerDead = false;
    }
    if (collisions.aiDead && this.ctx.absorbCollisionIfShielded("ai", bounds)) {
      collisions.aiDead = false;
    }

    if (collisions.playerBite) {
      const removed = this.ctx.aiSnake.shrink(collisions.playerBite.victimLoss);
      if (removed > 0) {
        this.ctx.playerSnake.grow(collisions.playerBite.attackerGain);
        this.ctx.playerSnake.triggerEatHeadPop(0.18 + (collisions.playerBite.severity * 0.12));
        this.ctx.scoreManager.addPoints(6 + (removed * 3));
        this.ctx.duelManager.onFoodCollected("player");
        this.eventWarning = `BITE x${removed}`;
        this.ctx.modeState.warningTimer = 0.8;
      }
    }

    if (collisions.aiBite) {
      const removed = this.ctx.playerSnake.shrink(collisions.aiBite.victimLoss);
      if (removed > 0) {
        this.ctx.aiSnake.grow(collisions.aiBite.attackerGain);
        this.ctx.duelManager.onFoodCollected("ai");
        this.eventWarning = "AI BITE";
        this.ctx.modeState.warningTimer = 0.75;
      }
    }

    if (collisions.playerDead || collisions.aiDead) {
      this.outcome = this.ctx.duelManager.resolveMatchOutcome(collisions.playerDead, collisions.aiDead, {
        playerSnakeLength: this.ctx.playerSnake.getSegmentCount()
      });
      this.eventWarning = this.outcome.playerWon ? "STAGE CLEAR" : "AI WINS";
      this.ctx.modeState.warningTimer = 1.8;
      this.ctx.onGameOver({
        reason: collisions.reason,
        playerWon: this.outcome.playerWon,
        stageCleared: this.outcome.stageResult?.stageCleared === true
      });
      return;
    }

    if (stageTarget > 0 && this.ctx.playerSnake.getSegmentCount() >= stageTarget) {
      this.outcome = this.ctx.duelManager.resolveMatchOutcome(false, true, {
        playerSnakeLength: this.ctx.playerSnake.getSegmentCount()
      });
      this.eventWarning = "LENGTH TARGET";
      this.ctx.modeState.warningTimer = 1.8;
      this.ctx.onGameOver({
        reason: "duel_length_clear",
        playerWon: true,
        stageCleared: this.outcome.stageResult?.stageCleared === true
      });
      return;
    }

    const playerCollect = this.ctx.collectFoodFor("player", {
      modeName: this.name,
      scoreBonus: 4
    });
    const aiCollect = this.ctx.collectFoodFor("ai", {
      modeName: this.name
    });

    if (playerCollect || aiCollect) {
      if (playerCollect && !aiCollect) {
        this.ctx.duelManager.onFoodCollected("player");
      } else if (!playerCollect && aiCollect) {
        this.ctx.duelManager.onFoodCollected("ai");
      } else if (playerCollect && aiCollect) {
        this.ctx.duelManager.onFoodCollected("both");
      }
    }

    if (stageTarget > 0 && this.ctx.playerSnake.getSegmentCount() >= stageTarget) {
      this.outcome = this.ctx.duelManager.resolveMatchOutcome(false, true, {
        playerSnakeLength: this.ctx.playerSnake.getSegmentCount()
      });
      this.eventWarning = "LENGTH TARGET";
      this.ctx.modeState.warningTimer = 1.8;
      this.ctx.onGameOver({
        reason: "duel_length_clear",
        playerWon: true,
        stageCleared: this.outcome.stageResult?.stageCleared === true
      });
    }
  }

  getRenderState() {
    const current = this.progressSnapshot || this.ctx.progressionManager.getSnapshot();
    return {
      ...super.getRenderState(),
      modeName: `Duel L${current.stage.level}-S${current.stage.stage}`,
      rank: current.rank,
      aiSnake: {
        segments: this.ctx.aiSnake.getSegments(),
        segmentSpacingPx: this.ctx.aiSnake.getSegmentSpacingPx(),
        headScale: this.ctx.aiSnake.getCurrentHeadScale(),
        speedPxPerSec: this.ctx.aiSnake.getCurrentSpeedPxPerSecond(),
        score: this.ctx.duelManager.aiScore
      },
      eventWarning: this.ctx.modeState.warningTimer > 0
        ? (this.eventWarning || this.ctx.duelManager.warningText)
        : null
    };
  }
}
