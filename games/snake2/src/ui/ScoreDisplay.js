export class ScoreDisplay {
  constructor(options = {}) {
    this.scoreEl = options.scoreEl;
    this.bestEl = options.bestEl;
    this.deltaHost = options.deltaHost;
    this.badgeEl = options.bestBadge;
    this.ux = options.ux;
    this.notifications = options.notifications;
    this.score = 0;
    this.best = 0;
    this.bestCelebrated = false;
  }

  reset(score = 0, best = 0) {
    this.score = Math.max(0, Math.floor(score));
    this.best = Math.max(0, Math.floor(best));
    this.bestCelebrated = false;
    this.#render();
    if (this.badgeEl) this.badgeEl.classList.remove("best-badge-new");
  }

  update(score, best, delta = 0) {
    const nextScore = Math.max(0, Math.floor(score));
    const nextBest = Math.max(0, Math.floor(best));

    if (nextScore !== this.score && this.scoreEl && this.ux) {
      this.ux.pop(this.scoreEl);
      if (delta > 0) {
        this.ux.floatNumber(this.deltaHost || this.scoreEl.parentElement, `+${delta}`, {
          className: "ui-float-positive"
        });
      }
    }

    const reachedNewBest = nextBest > this.best;
    this.score = nextScore;
    this.best = nextBest;
    this.#render();

    if (reachedNewBest && !this.bestCelebrated) {
      this.bestCelebrated = true;
      if (this.badgeEl && this.ux) this.ux.glowBurst(this.badgeEl, { className: "best-badge-new", durationMs: 920 });
      if (this.notifications) this.notifications.notify("New High Score!", "success", 2100);
    }
  }

  #render() {
    if (this.scoreEl) this.scoreEl.textContent = String(this.score);
    if (this.bestEl) this.bestEl.textContent = String(this.best);
  }
}
