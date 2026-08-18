import { MotionEffects } from "../effects/MotionEffects.js";

export class ThemeAnimationSystem {
  constructor() {
    this.overlay = null;
  }

  transition(theme, root = document.body) {
    if (!root) return;
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.className = "theme-transition-overlay";
      root.appendChild(this.overlay);
    }

    const accent = theme?.visuals?.uiAccent || "#00e5ff";
    this.overlay.style.setProperty("--theme-flash", accent);
    this.overlay.classList.add("theme-transition-overlay-active");

    MotionEffects.animate(620, (_eased, raw) => {
      if (raw >= 1) {
        this.overlay.classList.remove("theme-transition-overlay-active");
      }
    }, MotionEffects.easeOutExpo);
  }

  unlockReveal(cardElement) {
    if (!cardElement) return;
    cardElement.classList.remove("theme-card-unlock-reveal");
    void cardElement.offsetWidth;
    cardElement.classList.add("theme-card-unlock-reveal");
    window.setTimeout(() => {
      cardElement.classList.remove("theme-card-unlock-reveal");
    }, 900);
  }
}