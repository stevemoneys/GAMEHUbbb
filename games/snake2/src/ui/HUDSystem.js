import { UXEffects } from "./UXEffects.js";
import { UIButtonSystem } from "./UIButtonSystem.js";
import { NotificationSystem } from "./NotificationSystem.js";
import { ScoreDisplay } from "./ScoreDisplay.js";
import { ComboDisplay } from "./ComboDisplay.js";
import { PauseMenu } from "./PauseMenu.js";

export class HUDSystem {
  constructor(options = {}) {
    this.host = options.host;
    this.onPause = options.onPause || (() => {});
    this.onResume = options.onResume || (() => {});
    this.onRestart = options.onRestart || (() => {});
    this.onHome = options.onHome || (() => {});
    this.onNextStage = options.onNextStage || (() => {});
    this.onSettings = options.onSettings || (() => {});
    this.vibrationEnabled = true;
    this.modeLabel = "Classic";

    this.root = null;
    this.nodes = {};
    this.ux = new UXEffects();
    this.buttons = null;
    this.notifications = null;
    this.scoreDisplay = null;
    this.comboDisplay = null;
    this.pauseMenu = null;
  }

  mount() {
    if (!this.host || this.root) return;
    this.host.insertAdjacentHTML("beforeend", this.#template());
    this.root = this.host.querySelector("#gameHud");

    this.nodes.scoreValue = this.root.querySelector("[data-hud-score]");
    this.nodes.bestValue = this.root.querySelector("[data-hud-best]");
    this.nodes.bestBadge = this.root.querySelector("[data-hud-best-badge]");
    this.nodes.scoreDeltaHost = this.root.querySelector("[data-hud-score-delta]");
    this.nodes.comboRoot = this.root.querySelector("[data-hud-combo]");
    this.nodes.comboText = this.root.querySelector("[data-hud-combo-text]");
    this.nodes.progressFill = this.root.querySelector("[data-hud-progress-fill]");
    this.nodes.progressLabel = this.root.querySelector("[data-hud-progress-label]");
    this.nodes.modeLabel = this.root.querySelector("[data-hud-mode]");
    this.nodes.notificationRoot = this.root.querySelector("[data-hud-notifications]");

    this.notifications = new NotificationSystem({ root: this.nodes.notificationRoot });
    this.scoreDisplay = new ScoreDisplay({
      scoreEl: this.nodes.scoreValue,
      bestEl: this.nodes.bestValue,
      deltaHost: this.nodes.scoreDeltaHost,
      bestBadge: this.nodes.bestBadge,
      ux: this.ux,
      notifications: this.notifications
    });
    this.comboDisplay = new ComboDisplay({
      root: this.nodes.comboRoot,
      text: this.nodes.comboText,
      ux: this.ux
    });
    this.pauseMenu = new PauseMenu({
      overlay: this.root.querySelector("[data-hud-overlay]"),
      title: this.root.querySelector("[data-hud-overlay-title]"),
      subtitle: this.root.querySelector("[data-hud-overlay-subtitle]"),
      actionsRoot: this.root.querySelector("[data-hud-overlay-actions]"),
      nextBtn: this.root.querySelector("[data-ui-action='next-stage']"),
      resumeBtn: this.root.querySelector("[data-ui-action='resume']")
    });

    this.buttons = new UIButtonSystem({
      root: this.root,
      ux: this.ux,
      vibrationEnabled: this.vibrationEnabled,
      onAction: (action) => this.#handleAction(action)
    });
    this.buttons.bind();

    this.root.classList.add("hud-root-hidden");
  }

  show() {
    if (!this.root) return;
    this.root.classList.remove("hud-root-hidden");
  }

  hide() {
    if (!this.root) return;
    this.root.classList.add("hud-root-hidden");
    this.pauseMenu?.hide();
  }

  setModeLabel(label) {
    this.modeLabel = label || this.modeLabel;
    if (this.nodes.modeLabel) this.nodes.modeLabel.textContent = this.modeLabel;
  }

  setSettings(settings = {}) {
    if ("vibration" in settings) {
      this.vibrationEnabled = Boolean(settings.vibration);
      if (this.buttons) this.buttons.setVibrationEnabled(this.vibrationEnabled);
    }
    if ("reducedMotion" in settings) {
      this.ux.setReducedMotion(Boolean(settings.reducedMotion));
    }
  }

  resetRun(payload = {}) {
    this.pauseMenu?.hide();
    this.notifications?.clear();
    this.scoreDisplay?.reset(payload.score || 0, payload.best || 0);
    this.comboDisplay?.reset();
    this.updateProgress(0, payload.progressLabel || "Stage Progress");
    if (payload.modeName) this.setModeLabel(payload.modeName);
  }

  updateScore(score, best, delta = 0) {
    this.scoreDisplay?.update(score, best, delta);
  }

  updateCombo(combo) {
    this.comboDisplay?.update(combo);
  }

  updateProgress(ratio, label) {
    if (this.nodes.progressLabel && label) this.nodes.progressLabel.textContent = label;
    this.ux.animateProgress(this.nodes.progressFill, ratio);
  }

  notify(message, type = "info", durationMs = 1700) {
    this.notifications?.notify(message, type, durationMs);
  }

  showPauseMenu() {
    this.pauseMenu?.showPause(this.modeLabel);
  }

  hidePauseMenu() {
    this.pauseMenu?.hide();
  }

  showGameOver(payload = {}) {
    this.pauseMenu?.showGameOver(payload);
  }

  showStageIntro(payload = {}) {
    this.pauseMenu?.showBriefing(payload);
  }

  isOverlayVisible() {
    return this.pauseMenu?.isVisible() || false;
  }

  isPauseOverlay() {
    return this.pauseMenu?.isPausedMenu() || false;
  }

  #handleAction(action) {
    if (action === "pause") this.onPause();
    else if (action === "resume") this.onResume();
    else if (action === "restart") this.onRestart();
    else if (action === "home") this.onHome();
    else if (action === "next-stage") this.onNextStage();
    else if (action === "settings") this.onSettings();
  }

  #template() {
    return `
      <section id="gameHud" class="hud-root" aria-label="In-game HUD">
        <header class="hud-top-row">
          <div class="hud-score-card glass-card" data-hud-score-delta>
            <p class="hud-label">Score</p>
            <p class="hud-value" data-hud-score>0</p>
          </div>

          <button class="hud-pause-btn" data-ui-action="pause" type="button" aria-label="Pause game">II</button>

          <div class="hud-best-card glass-card" data-hud-best-badge>
            <p class="hud-label">Best</p>
            <p class="hud-value" data-hud-best>0</p>
          </div>
        </header>

        <section class="hud-middle-row">
          <p class="hud-mode" data-hud-mode>Classic</p>
          <div class="hud-progress">
            <div class="hud-progress-fill" data-hud-progress-fill></div>
          </div>
          <p class="hud-progress-label" data-hud-progress-label>Stage Progress</p>
        </section>

        <section class="hud-combo" data-hud-combo>
          <p data-hud-combo-text></p>
        </section>

        <section class="hud-notifications" data-hud-notifications></section>

        <section class="hud-overlay hud-overlay-hidden" data-hud-overlay>
          <div class="hud-overlay-dim"></div>
          <div class="hud-overlay-panel glass-card">
            <h2 data-hud-overlay-title>Paused</h2>
            <p data-hud-overlay-subtitle>Take a breath. Resume when ready.</p>
            <div class="hud-overlay-actions" data-hud-overlay-actions>
              <button class="hud-action-primary" data-ui-action="resume" type="button">Resume</button>
              <button class="hud-action-secondary" data-ui-action="restart" type="button">Restart</button>
              <button class="hud-action-secondary" data-ui-action="settings" type="button">Settings</button>
              <button class="hud-action-secondary hidden" data-ui-action="next-stage" type="button">Next Stage</button>
              <button class="hud-action-secondary" data-ui-action="home" type="button">Home</button>
            </div>
          </div>
        </section>
      </section>
    `;
  }
}
