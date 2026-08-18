export class UIButtonSystem {
  constructor(options = {}) {
    this.root = options.root;
    this.onAction = options.onAction || (() => {});
    this.ux = options.ux;
    this.vibrationEnabled = options.vibrationEnabled !== false;
  }

  bind() {
    if (!this.root) return;
    this.root.querySelectorAll("[data-ui-action]").forEach((button) => {
      button.addEventListener("pointerdown", () => {
        button.classList.add("ui-button-pressed");
      });
      button.addEventListener("pointerup", () => {
        button.classList.remove("ui-button-pressed");
      });
      button.addEventListener("pointercancel", () => {
        button.classList.remove("ui-button-pressed");
      });
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-ui-action");
        if (!action) return;
        if (this.ux) {
          this.ux.pop(button);
          this.ux.vibrate(12, this.vibrationEnabled);
        }
        this.onAction(action, button);
      });
    });
  }

  setVibrationEnabled(enabled) {
    this.vibrationEnabled = Boolean(enabled);
  }
}