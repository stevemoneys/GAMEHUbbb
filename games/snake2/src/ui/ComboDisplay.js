const COMBO_TIERS = [
  { min: 8, label: "PERFECT RUN", className: "combo-tier-elite" },
  { min: 5, label: "HOT STREAK", className: "combo-tier-hot" },
  { min: 3, label: "COMBO", className: "combo-tier-base" }
];

export class ComboDisplay {
  constructor(options = {}) {
    this.root = options.root;
    this.text = options.text;
    this.ux = options.ux;
    this.currentCombo = 0;
  }

  reset() {
    this.currentCombo = 0;
    if (this.root) this.root.classList.remove("combo-visible");
    if (this.text) this.text.textContent = "";
  }

  update(combo) {
    const safeCombo = Math.max(0, Math.floor(combo || 0));
    if (!this.root || !this.text) return;

    if (safeCombo < 2) {
      this.root.classList.remove("combo-visible", "combo-tier-base", "combo-tier-hot", "combo-tier-elite");
      this.text.textContent = "";
      this.currentCombo = safeCombo;
      return;
    }

    const tier = COMBO_TIERS.find((item) => safeCombo >= item.min) || COMBO_TIERS[COMBO_TIERS.length - 1];
    this.root.classList.add("combo-visible");
    this.root.classList.remove("combo-tier-base", "combo-tier-hot", "combo-tier-elite");
    this.root.classList.add(tier.className);
    this.text.textContent = `${tier.label} x${safeCombo}`;

    if (safeCombo !== this.currentCombo && this.ux) {
      this.ux.glowBurst(this.root);
    }

    this.currentCombo = safeCombo;
  }
}