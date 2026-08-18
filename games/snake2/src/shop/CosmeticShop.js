import { RaritySystem } from "./RaritySystem.js";
import { ThemePreviewRenderer } from "../themes/ThemePreviewRenderer.js";
import { UnlockEffects } from "./UnlockEffects.js";

export class CosmeticShop {
  constructor(options = {}) {
    this.root = options.root;
    this.themeManager = options.themeManager;
    this.onThemeEquipped = options.onThemeEquipped || (() => {});
    this.onNotify = options.onNotify || (() => {});

    this.previewRenderer = null;
    this.unlockEffects = null;
    this.selectedThemeId = null;
    this.cardsHost = null;
    this.collectionText = null;
    this.rarityFilter = "all";
  }

  init() {
    if (!this.root || !this.themeManager) return;
    this.#renderShell();

    const previewCanvas = this.root.querySelector("[data-theme-preview-canvas]");
    this.cardsHost = this.root.querySelector("[data-theme-cards]");
    this.collectionText = this.root.querySelector("[data-theme-collection]");

    this.previewRenderer = new ThemePreviewRenderer(previewCanvas);
    this.previewRenderer.start();

    this.unlockEffects = new UnlockEffects(this.root);

    this.root.querySelectorAll("[data-theme-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.getAttribute("data-theme-filter") || "all";
        this.rarityFilter = filter;
        this.root.querySelectorAll("[data-theme-filter]").forEach((node) => node.classList.toggle("active", node === button));
        this.renderCards();
      });
    });

    this.selectedThemeId = this.themeManager.getActiveThemeId();
    this.previewRenderer.setTheme(this.themeManager.getActiveTheme());
    this.themeManager.evaluateUnlocks();
    this.renderCards();
    this.refreshCollection();
    this.#applyAtmosphere(this.themeManager.getRuntimeVisuals());
  }

  dispose() {
    if (this.previewRenderer) this.previewRenderer.stop();
  }

  syncProgress(progressSnapshot) {
    this.themeManager.updateProgress(progressSnapshot);
    this.themeManager.evaluateUnlocks();
    this.refreshCollection();
    this.renderCards();
  }

  recordMatchAndUnlock(matchSummary, progressSnapshot) {
    if (progressSnapshot) this.themeManager.updateProgress(progressSnapshot);
    this.themeManager.recordMatch(matchSummary);
    const unlockedThemes = this.themeManager.evaluateUnlocks();
    if (unlockedThemes.length > 0) {
      unlockedThemes.forEach((theme) => {
        this.unlockEffects?.show(theme);
        this.onNotify(`Unlocked: ${theme.name}`, "success", 1800);
      });
      this.renderCards();
      this.refreshCollection();
    }
    return unlockedThemes;
  }

  setTheme(themeId) {
    const theme = this.themeManager.getThemeById(themeId);
    this.selectedThemeId = theme.id;
    this.previewRenderer?.setTheme(theme);
    this.renderCards();
  }

  refreshCollection() {
    if (!this.collectionText) return;
    const completion = this.themeManager.getCollectionProgress();
    const percent = Math.round(completion.ratio * 100);
    this.collectionText.textContent = `${completion.unlocked}/${completion.total} unlocked (${percent}%)`;
  }

  renderCards() {
    if (!this.cardsHost) return;

    const themes = [...this.themeManager.getThemes()].sort((a, b) => {
      const rarity = RaritySystem.compare(b.rarity, a.rarity);
      if (rarity !== 0) return rarity;
      return a.name.localeCompare(b.name);
    });

    const filtered = themes.filter((theme) => this.rarityFilter === "all" || theme.rarity === this.rarityFilter);

    this.cardsHost.innerHTML = filtered.map((theme) => {
      const meta = RaritySystem.getMeta(theme.rarity);
      const unlocked = this.themeManager.isUnlocked(theme.id);
      const active = theme.id === this.themeManager.getActiveThemeId();
      const selected = theme.id === this.selectedThemeId;
      const lockText = this.themeManager.getRequirementText(theme);

      return `
        <article class="theme-cos-card ${unlocked ? "unlocked" : "locked"} ${active ? "equipped" : ""} ${selected ? "selected" : ""}" data-theme-id="${theme.id}" style="--rarity-accent:${meta.accent};--rarity-glow:${meta.glow};--theme-shop-ambient:${theme.visuals.shopAmbient}">
          <div class="theme-cos-header">
            <span class="theme-rarity ${meta.badgeClass}">${meta.label}</span>
            <span class="theme-state">${active ? "Equipped" : unlocked ? "Owned" : "Locked"}</span>
          </div>
          <h3>${theme.name}</h3>
          <p class="theme-lore">${theme.lore}</p>
          <p class="theme-requirement">${lockText}</p>
          <button class="theme-action" type="button" data-theme-action="${unlocked ? "equip" : "inspect"}" data-theme-id="${theme.id}">
            ${active ? "Equipped" : unlocked ? "Equip" : "Preview"}
          </button>
        </article>
      `;
    }).join("");

    this.cardsHost.querySelectorAll(".theme-cos-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target instanceof HTMLButtonElement) return;
        const themeId = card.getAttribute("data-theme-id");
        if (!themeId) return;
        this.selectedThemeId = themeId;
        this.previewRenderer?.setTheme(this.themeManager.getThemeById(themeId));
        this.#applyAtmosphere(this.themeManager.getThemeById(themeId).visuals);
        this.renderCards();
      });
    });

    this.cardsHost.querySelectorAll("[data-theme-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const themeId = button.getAttribute("data-theme-id");
        if (!themeId) return;
        const unlocked = this.themeManager.isUnlocked(themeId);
        this.selectedThemeId = themeId;
        this.previewRenderer?.setTheme(this.themeManager.getThemeById(themeId));

        if (!unlocked) {
          this.onNotify("Theme is locked. Complete challenge to unlock.", "warning", 1100);
          this.renderCards();
          return;
        }

        const changed = this.themeManager.equip(themeId, { root: document.body, animate: true });
        if (changed) {
          const theme = this.themeManager.getThemeById(themeId);
          this.onThemeEquipped(theme);
          this.onNotify(`${theme.name} equipped`, "info", 1100);
          this.#applyAtmosphere(theme.visuals);
          this.renderCards();
        }
      });
    });
  }

  #applyAtmosphere(visuals) {
    if (!this.root || !visuals) return;
    this.root.style.setProperty("--shop-ambient", visuals.shopAmbient || "linear-gradient(145deg, rgba(10,28,54,0.9), rgba(4,10,24,0.94))");
  }

  #renderShell() {
    this.root.innerHTML = `
      <div class="cosmetics-root">
        <header class="cosmetics-head">
          <div>
            <h3>Theme Vault</h3>
            <p data-theme-collection>0/0 unlocked (0%)</p>
          </div>
          <div class="theme-filters">
            <button type="button" data-theme-filter="all" class="active">All</button>
            <button type="button" data-theme-filter="common">C</button>
            <button type="button" data-theme-filter="rare">R</button>
            <button type="button" data-theme-filter="epic">E</button>
            <button type="button" data-theme-filter="legendary">L</button>
            <button type="button" data-theme-filter="mythic">M</button>
            <button type="button" data-theme-filter="ultimate">U</button>
          </div>
        </header>

        <section class="theme-preview-stage">
          <canvas data-theme-preview-canvas aria-label="Theme preview canvas"></canvas>
        </section>

        <section class="theme-card-track" data-theme-cards></section>
      </div>
    `;
  }
}
