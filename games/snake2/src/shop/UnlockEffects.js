import { RaritySystem } from "./RaritySystem.js";

export class UnlockEffects {
  constructor(root) {
    this.root = root;
  }

  show(theme) {
    if (!this.root || !theme) return;

    const rarity = RaritySystem.getMeta(theme.rarity);
    const popup = document.createElement("div");
    popup.className = "unlock-popup";
    popup.innerHTML = `
      <div class="unlock-popup-shell" style="--rarity-accent:${rarity.accent};--rarity-glow:${rarity.glow}">
        <p class="unlock-title">Theme Unlocked</p>
        <h3>${theme.name}</h3>
        <p class="unlock-rarity">${rarity.label.toUpperCase()}</p>
      </div>
    `;

    this.root.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add("unlock-popup-active"));

    window.setTimeout(() => {
      popup.classList.remove("unlock-popup-active");
      popup.classList.add("unlock-popup-hide");
      window.setTimeout(() => popup.remove(), 380);
    }, 2200);
  }
}