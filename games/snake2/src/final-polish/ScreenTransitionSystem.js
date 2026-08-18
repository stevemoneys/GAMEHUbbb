export class ScreenTransitionSystem {
  constructor(options = {}) {
    this.screenDurationMs = options.screenDurationMs ?? 360;
    this.panelDurationMs = options.panelDurationMs ?? 280;
    this.pendingHide = null;
  }

  showScreen(element) {
    if (!element) return;
    if (this.pendingHide) {
      clearTimeout(this.pendingHide);
      this.pendingHide = null;
    }
    element.classList.remove("hidden", "screen-leaving");
    requestAnimationFrame(() => {
      element.classList.add("screen-visible");
    });
  }

  hideScreen(element, onHidden = () => {}) {
    if (!element) return;
    element.classList.remove("screen-visible");
    element.classList.add("screen-leaving");
    this.pendingHide = window.setTimeout(() => {
      element.classList.add("hidden");
      element.classList.remove("screen-leaving");
      this.pendingHide = null;
      onHidden();
    }, this.screenDurationMs);
  }

  showPanel(element) {
    if (!element) return;
    element.classList.add("ui-visible", "panel-cinematic-active");
    element.classList.remove("ui-hidden");
  }

  hidePanel(element) {
    if (!element) return;
    element.classList.remove("ui-visible", "panel-cinematic-active");
    element.classList.add("ui-hidden");
  }
}
