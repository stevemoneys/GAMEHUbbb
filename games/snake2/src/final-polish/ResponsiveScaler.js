function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class ResponsiveScaler {
  constructor(root = document.documentElement) {
    this.root = root;
    this.handleResize = this.update.bind(this);
  }

  start() {
    this.update();
    window.addEventListener("resize", this.handleResize, { passive: true });
  }

  stop() {
    window.removeEventListener("resize", this.handleResize);
  }

  update() {
    const width = window.innerWidth || 390;
    const height = window.innerHeight || 844;
    const shortest = Math.min(width, height);
    const orientation = width > height ? "landscape" : "portrait";
    const scale = clamp(shortest / 430, 0.88, 1.14);
    const panelWidth = orientation === "portrait"
      ? Math.min(width - 28, 520)
      : Math.min(width * 0.44, 500);
    const shellWidth = orientation === "portrait"
      ? Math.min(width - 24, 560)
      : Math.min(width * 0.62, 980);
    const primaryWidth = orientation === "portrait"
      ? Math.min(width * 0.74, 420)
      : Math.min(width * 0.4, 360);

    this.root.style.setProperty("--app-scale", scale.toFixed(3));
    this.root.style.setProperty("--panel-max-width", `${Math.round(panelWidth)}px`);
    this.root.style.setProperty("--home-shell-max-width", `${Math.round(shellWidth)}px`);
    this.root.style.setProperty("--primary-action-width", `${Math.round(primaryWidth)}px`);
    this.root.style.setProperty("--chrome-gap", `${Math.round(clamp(shortest * 0.03, 10, 22))}px`);
    this.root.style.setProperty("--edge-safe", `${Math.round(clamp(width * 0.04, 12, 22))}px`);
  }
}
