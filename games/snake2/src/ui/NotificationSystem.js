export class NotificationSystem {
  constructor(options = {}) {
    this.root = options.root;
    this.queue = [];
    this.active = false;
  }

  notify(message, type = "info", durationMs = 1900) {
    if (!message || !this.root) return;
    this.queue.push({ message, type, durationMs });
    this.#pump();
  }

  clear() {
    this.queue.length = 0;
    this.active = false;
    if (this.root) this.root.innerHTML = "";
  }

  #pump() {
    if (this.active || this.queue.length === 0 || !this.root) return;
    this.active = true;
    const next = this.queue.shift();

    const item = document.createElement("div");
    item.className = `hud-notification hud-notification-${next.type}`;
    item.textContent = next.message;
    this.root.appendChild(item);

    requestAnimationFrame(() => item.classList.add("hud-notification-show"));

    window.setTimeout(() => {
      item.classList.remove("hud-notification-show");
      item.classList.add("hud-notification-hide");
      window.setTimeout(() => {
        item.remove();
        this.active = false;
        this.#pump();
      }, 260);
    }, next.durationMs);
  }
}