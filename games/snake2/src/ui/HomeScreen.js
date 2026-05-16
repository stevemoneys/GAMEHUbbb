import { NavigationSystem } from "./NavigationSystem.js";
import { ModeSelection } from "./ModeSelection.js";
import { LevelSelection } from "./LevelSelection.js";
import { ThemePreview } from "./ThemePreview.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { BackgroundParticles } from "../effects/BackgroundParticles.js";
import { AmbientEffects } from "../effects/AmbientEffects.js";
import { MenuAnimations } from "./MenuAnimations.js";
import { ProductionPolishManager } from "../final-polish/ProductionPolishManager.js";

function buildModeGoal(modeId, progressSnapshot) {
  const stage = progressSnapshot?.stage;
  const level = Math.max(1, stage?.level || 1);
  const section = Math.max(1, stage?.stage || 1);
  const lengthTarget = stage?.objectives?.find((objective) => objective.type === "length")?.target || 16;

  if (modeId === "speed") {
    return {
      title: `Speed • Level ${level} Stage ${section}`,
      copy: `Reach length ${lengthTarget} to win. The pace climbs fast here, so cleaner turns beat panic.`
    };
  }

  if (modeId === "survival") {
    return {
      title: `Survival • Level ${level} Stage ${section}`,
      copy: `Reach length ${lengthTarget} to win while the arena gets more dangerous around you.`
    };
  }

  if (modeId === "duel") {
    return {
      title: `Duel • Level ${level} Stage ${section}`,
      copy: `Reach length ${lengthTarget} first to clear the stage. Bite smart, steal growth, and do not get cornered.`
    };
  }

  return {
    title: `Classic • Level ${level} Stage ${section}`,
    copy: `Reach length ${lengthTarget} to win. Regular energy orbs grow your snake by +1, so every pickup counts.`
  };
}

export class HomeScreen {
  constructor(options) {
    this.root = options.root;
    this.onPlay = options.onPlay || (() => {});
    this.onModeChange = options.onModeChange || (() => {});
    this.onQualityChange = options.onQualityChange || (() => {});
    this.onLevelSelect = options.onLevelSelect || (() => {});
    this.onThemeChange = options.onThemeChange || (() => {});
    this.onAudioToggle = options.onAudioToggle || (() => {});
    this.disableLegacyThemePreview = Boolean(options.disableLegacyThemePreview);
    this.currentAudio = true;
    this.currentMode = "classic";
    this.audioButton = null;
    this.progressSnapshot = null;

    this.nav = new NavigationSystem();
    this.modeSelection = new ModeSelection(this.root?.querySelector("[data-mode-selection]") || null);
    this.levelSelection = new LevelSelection(this.root?.querySelector("[data-level-selection]") || null);
    this.themePreview = this.disableLegacyThemePreview
      ? null
      : new ThemePreview(this.root?.querySelector("[data-theme-preview]") || null);
    this.settingsPanel = new SettingsPanel(this.root?.querySelector("[data-settings-panel]") || null);
    this.bgParticles = new BackgroundParticles(this.root?.querySelector("[data-home-particles]") || null);
    this.ambient = new AmbientEffects(this.root || document.body);
    this.polish = new ProductionPolishManager({ root: this.root });
  }

  init(progressSnapshot) {
    if (!this.root) return;
    this.progressSnapshot = progressSnapshot;
    this.currentMode = progressSnapshot?.mode || this.currentMode;
    this.polish.init();
    this.modeSelection.onChange = (mode) => this.onModeChange(mode);
    this.modeSelection.init();
    this.modeSelection.onChange = (mode) => {
      this.currentMode = mode;
      this.onModeChange(mode);
      this.#updateGoalPreview();
    };

    this.levelSelection.onSelect = (payload) => this.onLevelSelect(payload);
    this.levelSelection.onSelect = (payload) => {
      this.onLevelSelect(payload);
      this.#updateGoalPreview();
    };
    this.levelSelection.render(progressSnapshot);
    this.#updateProgressHint(progressSnapshot);

    if (this.themePreview) {
      this.themePreview.onChange = (themeId) => this.onThemeChange(themeId);
      this.themePreview.init();
    }
    this.settingsPanel.onChange = (state) => this.onQualityChange(state);
    this.settingsPanel.init();

    const playBtn = this.root.querySelector("[data-play-btn]");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        MenuAnimations.pulse(playBtn);
        this.polish.pulsePrimary(playBtn);
        this.onPlay(this.modeSelection.getMode());
      });
    }

    const navButtons = Array.from(this.root.querySelectorAll("[data-nav]"));
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.getAttribute("data-nav");
        if (!panel) return;
        if (this.nav.current === panel) {
          this.nav.hideAll();
          this.polish.closePanels(this.#getPanels(), navButtons);
        } else {
          const panelElement = this.nav.show(panel);
          this.polish.openPanel(panel, panelElement, navButtons, btn);
        }
      });
    });

    this.root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!this.nav.current) return;
      if (target.closest("[data-panel]")) return;
      if (target.closest("[data-nav]")) return;
      if (target.closest("[data-play-btn]")) return;
      this.nav.hideAll();
      this.polish.closePanels(this.#getPanels(), navButtons);
    });

    this.nav.register("settings", this.root.querySelector("[data-panel='settings']"));
    this.nav.register("themes", this.root.querySelector("[data-panel='themes']"));
    this.nav.register("levels", this.root.querySelector("[data-panel='levels']"));
    this.nav.hideAll();

    this.audioButton = this.root.querySelector("[data-audio-toggle]");
    if (this.audioButton) {
      this.audioButton.textContent = this.currentAudio ? "Audio On" : "Audio Off";
      this.audioButton.addEventListener("click", () => {
        this.currentAudio = !this.currentAudio;
        this.audioButton.textContent = this.currentAudio ? "Audio On" : "Audio Off";
        this.settingsPanel.setAudioEnabled(this.currentAudio);
        this.onAudioToggle(this.currentAudio);
      });
    }

    this.bgParticles.start();
    this.ambient.start();
    this.#updateGoalPreview();
  }

  show() {
    if (!this.root) return;
    this.root.classList.remove("hidden");
    this.polish.showHome();
    this.bgParticles.start();
    this.ambient.start();
  }

  hide() {
    if (!this.root) return;
    this.nav.hideAll();
    this.polish.closePanels(this.#getPanels(), Array.from(this.root.querySelectorAll("[data-nav]")));
    this.polish.hideHome(() => {
      this.bgParticles.stop();
      this.ambient.stop();
    });
  }

  updateProgress(snapshot) {
    if (!this.root) return;
    this.progressSnapshot = snapshot;
    this.currentMode = snapshot?.mode || this.currentMode;
    this.levelSelection.render(snapshot);
    this.#updateProgressHint(snapshot);
    this.#updateGoalPreview();
  }

  setMode(modeId) {
    this.currentMode = modeId;
    this.modeSelection.setMode(modeId);
    this.#updateGoalPreview();
  }

  openPanel(panelId) {
    if (!this.root) return;
    const panelElement = this.nav.show(panelId);
    const navButtons = Array.from(this.root.querySelectorAll("[data-nav]"));
    const activeButton = navButtons.find((button) => button.getAttribute("data-nav") === panelId) || null;
    this.polish.openPanel(panelId, panelElement, navButtons, activeButton);
  }

  setAudioEnabled(enabled) {
    this.currentAudio = Boolean(enabled);
    if (this.audioButton) {
      this.audioButton.textContent = this.currentAudio ? "Audio On" : "Audio Off";
    }
    this.settingsPanel.setState({ audio: this.currentAudio });
  }

  #getPanels() {
    return Array.from(this.root.querySelectorAll("[data-panel]"));
  }

  #updateProgressHint(snapshot) {
    const hint = this.root.querySelector("[data-progress-hint]");
    if (!hint || !snapshot?.stage) return;
    const stage = snapshot.stage;
    hint.textContent = `Continue: ${snapshot.mode.toUpperCase()} • Level ${stage.level} Stage ${stage.stage} • ${snapshot.rank} Rank`;
  }

  #updateGoalPreview() {
    const title = this.root?.querySelector("[data-goal-title]");
    const copy = this.root?.querySelector("[data-goal-copy]");
    if (!title || !copy) return;
    const mode = this.modeSelection.getMode();
    const goal = buildModeGoal(mode, this.progressSnapshot);
    title.textContent = goal.title;
    copy.textContent = goal.copy;
  }
}
