import { MenuAnimations } from "./MenuAnimations.js";

const MODES = [
  { id: "classic", title: "Classic", desc: "Pure neon arcade flow", difficulty: "Balanced", icon: "C", meter: 35, accent: "var(--ui-cyan)" },
  { id: "speed", title: "Speed", desc: "High-intensity pressure", difficulty: "Hard", icon: "S", meter: 74, accent: "var(--ui-amber)" },
  { id: "survival", title: "Survival", desc: "Hazards and adaptation", difficulty: "Dynamic", icon: "V", meter: 68, accent: "var(--ui-purple)" },
  { id: "duel", title: "Duel", desc: "Player vs adaptive AI", difficulty: "Competitive", icon: "D", meter: 82, accent: "var(--ui-magenta)" }
];

export class ModeSelection {
  constructor(root) {
    this.root = root;
    this.track = root ? root.querySelector("[data-mode-track]") : null;
    this.mode = "classic";
    this.onChange = () => {};
  }

  init() {
    if (!this.track) return;
    this.track.innerHTML = MODES.map((mode) => `
      <button class="mode-card ${mode.id === this.mode ? "active" : ""}" data-mode="${mode.id}" data-accent="${mode.accent}" type="button" style="--mode-accent:${mode.accent}">
        <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
        <span class="mode-title">${mode.title}</span>
        <span class="mode-desc">${mode.desc}</span>
        <span class="mode-diff">${mode.difficulty}</span>
        <span class="mode-meter" aria-hidden="true">
          <span class="mode-meter-fill" style="width:${mode.meter}%"></span>
        </span>
      </button>
    `).join("");
    const cards = Array.from(this.track.querySelectorAll(".mode-card"));
    MenuAnimations.revealCards(cards);
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        this.setMode(card.dataset.mode);
        MenuAnimations.pulse(card);
      });
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const tiltY = (px - 0.5) * 8;
        const tiltX = (0.5 - py) * 6;
        card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
      });
    });
  }

  setMode(modeId) {
    if (!modeId || !this.track) return;
    this.mode = modeId;
    Array.from(this.track.children).forEach((card) => {
      card.classList.toggle("active", card.dataset.mode === modeId);
    });
    this.onChange(modeId);
  }

  getMode() {
    return this.mode;
  }
}
