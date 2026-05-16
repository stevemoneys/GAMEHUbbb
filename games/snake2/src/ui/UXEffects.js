export class UXEffects {
  constructor(options = {}) {
    this.reducedMotion = Boolean(options.reducedMotion);
  }

  setReducedMotion(enabled) {
    this.reducedMotion = Boolean(enabled);
  }

  pulse(element, options = {}) {
    if (!element) return;
    const className = options.className || "ui-pulse";
    this.#restartClassAnimation(element, className, options.durationMs);
  }

  pop(element, options = {}) {
    if (!element) return;
    const className = options.className || "ui-pop";
    this.#restartClassAnimation(element, className, options.durationMs);
  }

  glowBurst(element, options = {}) {
    if (!element) return;
    const className = options.className || "ui-glow-burst";
    this.#restartClassAnimation(element, className, options.durationMs);
  }

  floatNumber(container, text, options = {}) {
    if (!container || !text) return;
    const node = document.createElement("div");
    node.className = `ui-float-number ${options.className || ""}`.trim();
    node.textContent = text;
    container.appendChild(node);

    requestAnimationFrame(() => {
      node.classList.add("ui-float-number-active");
    });

    const duration = this.reducedMotion ? 320 : (options.durationMs || 860);
    window.setTimeout(() => {
      node.remove();
    }, duration);
  }

  animateProgress(element, ratio) {
    if (!element) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    element.style.transform = `scaleX(${clamped})`;
  }

  vibrate(pattern, enabled = true) {
    if (!enabled) return;
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    navigator.vibrate(pattern);
  }

  #restartClassAnimation(element, className, durationMs) {
    element.classList.remove(className);
    // Force layout so the CSS animation can restart on quick consecutive events.
    void element.offsetWidth;
    element.classList.add(className);
    const timeout = this.reducedMotion ? 120 : (durationMs || 420);
    window.setTimeout(() => element.classList.remove(className), timeout);
  }
}
