export class PerformanceOverlay {
  constructor(options = {}) {
    this.root = options.root || document.body;
    this.visible = false;
    this.el = null;
  }

  init() {
    if (this.el) return;
    this.el = document.createElement("aside");
    this.el.className = "perf-overlay hidden";
    this.el.innerHTML = `
      <p data-perf-fps>FPS: --</p>
      <p data-perf-frame>Frame: --ms</p>
      <p data-perf-p95>P95: --ms</p>
      <p data-perf-quality>Quality: --</p>
      <p data-perf-memory>Memory: --</p>
      <p data-perf-particles>Particles: --</p>
      <p data-perf-jank>Jank: --</p>
    `;
    this.root.appendChild(this.el);
  }

  setVisible(nextVisible) {
    this.visible = Boolean(nextVisible);
    if (!this.el) return;
    this.el.classList.toggle("hidden", !this.visible);
  }

  toggle() {
    this.setVisible(!this.visible);
  }

  update(metrics) {
    if (!this.visible || !this.el || !metrics) return;

    const setLine = (selector, value) => {
      const node = this.el.querySelector(selector);
      if (node) node.textContent = value;
    };

    const particles = metrics.extras?.particles ?? 0;
    setLine("[data-perf-fps]", `FPS: ${metrics.fps.toFixed(1)}`);
    setLine("[data-perf-frame]", `Frame: ${metrics.frameMs.toFixed(2)}ms`);
    setLine("[data-perf-p95]", `P95: ${metrics.p95Ms.toFixed(2)}ms`);
    setLine("[data-perf-quality]", `Quality: ${metrics.quality.toUpperCase()}`);
    if (Number.isFinite(metrics.memoryMB) && Number.isFinite(metrics.memoryLimitMB) && metrics.memoryLimitMB > 0) {
      setLine("[data-perf-memory]", `Memory: ${metrics.memoryMB.toFixed(1)}MB / ${metrics.memoryLimitMB.toFixed(0)}MB`);
    } else {
      setLine("[data-perf-memory]", "Memory: unavailable");
    }
    setLine("[data-perf-particles]", `Particles: ${particles}`);
    setLine("[data-perf-jank]", `Jank/min: ${metrics.jankPerMinute.toFixed(1)}`);
  }
}