import { DuelRules } from "./DuelRules.js";

export class DuelManager {
  constructor(config, progressionManager) {
    this.config = config;
    this.progression = progressionManager;
    this.reset();
  }

  reset() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.maxCombo = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboWindow = 2.2;
    this.elapsed = 0;
    this.warningText = null;
    this.warningTimer = 0;
  }

  initialize() {
    this.reset();
    const snapshot = this.progression.getSnapshot();
    this.warningText = `Stage ${snapshot.stage.level}-${snapshot.stage.stage} | ${snapshot.stage.personality.toUpperCase()}`;
    this.warningTimer = 2;
    return snapshot;
  }

  update(dt) {
    this.elapsed += dt;
    this.comboTimer += dt;
    this.warningTimer = Math.max(0, this.warningTimer - dt);
    if (this.comboTimer > this.comboWindow * 1.5) this.combo = 0;
  }

  onFoodCollected(by) {
    if (by === "player") {
      this.playerScore += 1;
      if (this.comboTimer <= this.comboWindow) this.combo += 1;
      else this.combo = 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.comboTimer = 0;
    } else if (by === "ai") {
      this.aiScore += 1;
      this.combo = 0;
    } else {
      this.playerScore += 1;
      this.aiScore += 1;
      this.combo = 0;
    }
  }

  evaluateCollisions(snapshot) {
    return DuelRules.evaluateCollisionState(snapshot);
  }

  resolveMatchOutcome(playerDead, aiDead, matchStats = {}) {
    let playerWon = false;
    if (playerDead && !aiDead) playerWon = false;
    else if (!playerDead && aiDead) playerWon = true;
    else if (playerDead && aiDead) playerWon = this.playerScore >= this.aiScore;
    else playerWon = this.playerScore > this.aiScore;

    const stageResult = this.progression.evaluateStageResult({
      playerWon,
      playerScore: this.playerScore,
      maxCombo: this.maxCombo,
      survivalTime: this.elapsed,
      playerSnakeLength: matchStats.playerSnakeLength || 0
    });

    return {
      playerWon,
      aiWon: !playerWon,
      playerScore: this.playerScore,
      aiScore: this.aiScore,
      maxCombo: this.maxCombo,
      playerSnakeLength: matchStats.playerSnakeLength || 0,
      stageResult
    };
  }
}
