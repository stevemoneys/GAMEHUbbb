const HIGH_SCORE_KEY = "snake2_best_score_v1";

export class ScoreManager {
  constructor() {
    // Current run score.
    this.score = 0;
    // Persist-ready fields for later phases (high score, combo, multiplier).
    this.highScore = this.#loadHighScore();
    this.combo = 0;
    this.multiplier = 1;
  }

  addPoints(amount) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const applied = Math.max(0, Math.floor(safeAmount * this.multiplier));
    this.score += applied;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.#saveHighScore();
    }
    return applied;
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.multiplier = 1;
  }

  getScore() {
    return this.score;
  }

  getHighScore() {
    return this.highScore;
  }

  setCombo(nextCombo) {
    this.combo = Math.max(0, Math.floor(nextCombo));
  }

  getCombo() {
    return this.combo;
  }

  setMultiplier(nextMultiplier) {
    if (!Number.isFinite(nextMultiplier)) return;
    this.multiplier = Math.max(1, nextMultiplier);
  }

  getMultiplier() {
    return this.multiplier;
  }

  #loadHighScore() {
    if (typeof localStorage === "undefined") return 0;
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  #saveHighScore() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
  }
}
