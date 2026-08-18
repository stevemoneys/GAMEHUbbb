import { THEME_DATA, getThemeById } from "./ThemeData.js";
import { ThemeUnlockSystem } from "./ThemeUnlockSystem.js";
import { ThemeAnimationSystem } from "./ThemeAnimationSystem.js";

export class ThemeManager {
  constructor() {
    this.themes = THEME_DATA;
    this.unlockSystem = new ThemeUnlockSystem();
    this.animation = new ThemeAnimationSystem();
    this.listeners = new Set();

    this.unlockSystem.ensureDefaults(this.themes);
    this.activeThemeId = this.unlockSystem.getEquippedId() || this.themes[0].id;
  }

  onChange(callback) {
    if (typeof callback !== "function") return () => {};
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emitChange(payload) {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (_error) {
        // Isolated listener errors should not break theme updates.
      }
    });
  }

  getThemes() {
    return this.themes;
  }

  getThemeById(themeId) {
    return getThemeById(themeId);
  }

  getActiveTheme() {
    return this.getThemeById(this.activeThemeId);
  }

  getActiveThemeId() {
    return this.activeThemeId;
  }

  isUnlocked(themeId) {
    return this.unlockSystem.isUnlocked(themeId);
  }

  getUnlockedIds() {
    return this.unlockSystem.getUnlockedIds();
  }

  evaluateUnlocks() {
    const unlockedIds = this.unlockSystem.evaluateUnlocks(this.themes);
    return unlockedIds.map((id) => this.getThemeById(id));
  }

  updateProgress(snapshot) {
    this.unlockSystem.updateFromProgress(snapshot);
  }

  recordMatch(data) {
    this.unlockSystem.recordMatch(data);
  }

  equip(themeId, options = {}) {
    if (!this.unlockSystem.setEquippedId(themeId)) return false;

    this.activeThemeId = themeId;
    const theme = this.getActiveTheme();
    if (options.animate !== false) {
      this.animation.transition(theme, options.root || document.body);
    }

    this.emitChange({ type: "equipped", theme });
    return true;
  }

  unlockAndEquip(themeId, options = {}) {
    if (!this.isUnlocked(themeId)) return false;
    return this.equip(themeId, options);
  }

  getCollectionProgress() {
    return this.unlockSystem.getCompletion(this.themes);
  }

  getRequirementText(theme) {
    if (!theme?.unlock) return "Free";
    if (this.isUnlocked(theme.id)) return "Unlocked";
    return theme.unlock.text || "Locked";
  }

  getRuntimeVisuals() {
    const theme = this.getActiveTheme();
    return {
      id: theme.id,
      name: theme.name,
      uiAccent: theme.visuals.uiAccent,
      worldTop: theme.visuals.worldTop,
      worldBottom: theme.visuals.worldBottom,
      hudText: theme.visuals.hudText,
      gridMinor: theme.visuals.gridMinor,
      gridMajor: theme.visuals.gridMajor,
      snakePalette: theme.visuals.snakePalette,
      trailColor: theme.visuals.trailColor,
      trailGlow: theme.visuals.trailGlow,
      foodStyle: theme.visuals.foodStyle,
      particleColor: theme.visuals.particleColor,
      shopAmbient: theme.visuals.shopAmbient
    };
  }
}