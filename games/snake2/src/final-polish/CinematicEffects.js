export class CinematicEffects {
  constructor(root) {
    this.root = root;
    this.pointerHandler = this.#onPointerMove.bind(this);
  }

  start() {
    if (!this.root) return;
    this.root.addEventListener("pointermove", this.pointerHandler, { passive: true });
  }

  stop() {
    if (!this.root) return;
    this.root.removeEventListener("pointermove", this.pointerHandler);
  }

  pulseAccent() {
    if (!this.root) return;
    this.root.classList.remove("cinematic-accent-pulse");
    void this.root.offsetWidth;
    this.root.classList.add("cinematic-accent-pulse");
  }

  #onPointerMove(event) {
    const rect = this.root.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / Math.max(1, rect.width)) - 0.5;
    const py = ((event.clientY - rect.top) / Math.max(1, rect.height)) - 0.5;
    this.root.style.setProperty("--ambient-shift-x", `${(px * 18).toFixed(2)}px`);
    this.root.style.setProperty("--ambient-shift-y", `${(py * 14).toFixed(2)}px`);
  }
}
