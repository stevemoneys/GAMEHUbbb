export class PauseMenu {
  constructor(options = {}) {
    this.overlay = options.overlay;
    this.title = options.title;
    this.subtitle = options.subtitle;
    this.nextBtn = options.nextBtn;
    this.resumeBtn = options.resumeBtn;
    this.actionsRoot = options.actionsRoot;
    this.state = "hidden";
    this.hideTimer = 0;
  }

  hide() {
    if (!this.overlay) return;
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }
    this.overlay.classList.remove("hud-overlay-visible", "hud-overlay-gameover");
    this.overlay.classList.remove("hud-overlay-briefing");
    this.overlay.classList.add("hud-overlay-hidden");
    document.body.classList.remove("hud-overlay-open");
    this.state = "hidden";
  }

  showPause(modeLabel) {
    if (!this.overlay || !this.title || !this.subtitle) return;
    this.overlay.classList.remove("hud-overlay-hidden", "hud-overlay-gameover");
    this.overlay.classList.add("hud-overlay-visible");
    this.title.textContent = "Paused";
    this.subtitle.textContent = modeLabel || "Take a breath. Resume when ready.";
    if (this.nextBtn) this.nextBtn.classList.add("hidden");
    if (this.resumeBtn) this.resumeBtn.classList.remove("hidden");
    if (this.actionsRoot) this.actionsRoot.classList.remove("hidden");
    document.body.classList.add("hud-overlay-open");
    this.state = "paused";
  }

  showGameOver(payload = {}) {
    if (!this.overlay || !this.title || !this.subtitle) return;
    this.overlay.classList.remove("hud-overlay-hidden");
    this.overlay.classList.add("hud-overlay-visible", "hud-overlay-gameover");

    this.title.textContent = payload.title || "Game Over";
    this.subtitle.textContent = payload.subtitle || "Retry and chase a higher score.";

    if (this.nextBtn) {
      if (payload.showNextStage) {
        this.nextBtn.classList.remove("hidden");
      } else {
        this.nextBtn.classList.add("hidden");
      }
    }
    if (this.resumeBtn) this.resumeBtn.classList.add("hidden");
    if (this.actionsRoot) this.actionsRoot.classList.remove("hidden");

    document.body.classList.add("hud-overlay-open");
    this.state = "gameover";
  }

  showBriefing(payload = {}) {
    if (!this.overlay || !this.title || !this.subtitle) return;
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }
    this.overlay.classList.remove("hud-overlay-hidden", "hud-overlay-gameover");
    this.overlay.classList.add("hud-overlay-visible", "hud-overlay-briefing");
    this.title.textContent = payload.title || "Level Brief";
    this.subtitle.textContent = payload.subtitle || "Grow, survive, and stay sharp.";
    if (this.nextBtn) this.nextBtn.classList.add("hidden");
    if (this.resumeBtn) this.resumeBtn.classList.add("hidden");
    if (this.actionsRoot) this.actionsRoot.classList.add("hidden");
    document.body.classList.add("hud-overlay-open");
    this.state = "briefing";

    const durationMs = Math.max(1200, payload.durationMs || 2400);
    this.hideTimer = window.setTimeout(() => {
      this.hide();
    }, durationMs);
  }

  isVisible() {
    return this.state !== "hidden";
  }

  isPausedMenu() {
    return this.state === "paused";
  }

  isGameOverMenu() {
    return this.state === "gameover";
  }
}
