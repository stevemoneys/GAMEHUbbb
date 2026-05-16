import { NavigationSystem } from "./NavigationSystem.js";
import { ModeSelection } from "./ModeSelection.js";
import { LevelSelection } from "./LevelSelection.js";
import { ThemePreview } from "./ThemePreview.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { BackgroundParticles } from "../effects/BackgroundParticles.js";
import { AmbientEffects } from "../effects/AmbientEffects.js";
import { MenuAnimations } from "./MenuAnimations.js";
import { ProductionPolishManager } from "../final-polish/ProductionPolishManager.js";

function buildModeGoal(modeId, selection, progressSnapshot) {
  const level = Math.max(1, selection?.level || progressSnapshot?.stage?.level || 1);
  const stage = Math.max(1, selection?.stage || progressSnapshot?.stage?.stage || 1);
  const lengthTarget = 12 + (level * 2) + ((stage - 1) * 2);
  const scoreTarget = 10 + (level * 4) + (stage * 3);
  const surviveTarget = 24 + (level * 3) + (stage * 5);

  if (modeId === "speed") {
    return {
      title: `Speed • Level ${level}`,
      copy: `Reach length ${lengthTarget + 2} while handling faster bursts and pushing toward score ${scoreTarget + 6}.`
    };
  }

  if (modeId === "survival") {
    return {
      title: `Survival • Level ${level}`,
      copy: `Grow to length ${lengthTarget + 1} and survive about ${surviveTarget}s while hazards and arena pressure increase.`
    };
  }

  if (modeId === "duel") {
    const duelLength = 14 + (level * 2) + ((stage - 1) * 3);
    const duelScore = 8 + (level * 2) + (stage * 4);
    const duelSurvive = 22 + (level * 2) + (stage * 6);
    const duelCombo = Math.min(12, 1 + Math.floor(level / 3) + stage);
    const objectiveParts = stage === 1
      ? [`grow to length ${duelLength}`, `survive ${duelSurvive}s`]
      : stage === 2
        ? [`grow to length ${duelLength}`, `reach score ${duelScore}`, "defeat the rival AI"]
        : [`grow to length ${duelLength}`, `survive ${duelSurvive}s`, `reach score ${duelScore}`, `build combo x${duelCombo}`, "defeat the rival AI"];
    return {
      title: `Duel • Level ${level} Stage ${stage}`,
      copy: `Win by ${objectiveParts.join(", ")}.`
    };
  }

  return {
    title: `Classic • Level ${level}`,
    copy: `Grow your snake to length ${lengthTarget} to win. Clean pickups and safe movement matter most here.`
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
    this.polish.init();
    this.modeSelection.onChange = (mode) => this.onModeChange(mode);
    this.modeSelection.init();
    this.modeSelection.onChange = (mode) => {
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
    this.levelSelection.render(snapshot);
    this.#updateProgressHint(snapshot);
    this.#updateGoalPreview();
  }

  setMode(modeId) {
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
    hint.textContent = `Continue: Level ${stage.level} Stage ${stage.stage} - ${snapshot.rank} Rank`;
  }

  #updateGoalPreview() {
    const title = this.root?.querySelector("[data-goal-title]");
    const copy = this.root?.querySelector("[data-goal-copy]");
    if (!title || !copy) return;
    const mode = this.modeSelection.getMode();
    const selection = this.levelSelection.getSelection();
    const goal = buildModeGoal(mode, selection, this.progressSnapshot);
    title.textContent = goal.title;
    copy.textContent = goal.copy;
  }
}
