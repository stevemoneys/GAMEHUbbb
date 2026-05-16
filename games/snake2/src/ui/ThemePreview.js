const THEMES = [
  { id: "neon_core", title: "Neon Core", tint: "#00E5FF" },
  { id: "pulse_grid", title: "Pulse Grid", tint: "#8B5CF6" },
  { id: "obsidian", title: "Obsidian", tint: "#FF4DCA" }
];

export class ThemePreview {
  constructor(root) {
    this.root = root;
    this.track = root ? root.querySelector("[data-theme-track]") : null;
    this.onChange = () => {};
    this.active = THEMES[0].id;
  }

  init() {
    if (!this.track) return;
    this.track.innerHTML = THEMES.map((theme) => `
      <button class="theme-card ${theme.id === this.active ? "active" : ""}" data-theme="${theme.id}" type="button" style="--theme-tint:${theme.tint}">
        <span>${theme.title}</span>
      </button>
    `).join("");
    Array.from(this.track.querySelectorAll(".theme-card")).forEach((card) => {
      card.addEventListener("click", () => {
        this.active = card.dataset.theme;
        this.track.querySelectorAll(".theme-card").forEach((item) => item.classList.remove("active"));
        card.classList.add("active");
        this.onChange(this.active);
      });
    });
  }
}
