export class NavigationSystem {
  constructor() {
    this.panels = new Map();
    this.current = null;
  }

  register(id, element) {
    if (!element) return;
    this.panels.set(id, element);
  }

  show(id) {
    if (!this.panels.has(id)) return null;
    this.panels.forEach((panel, key) => {
      const visible = key === id;
      panel.classList.toggle("ui-visible", visible);
      panel.classList.toggle("ui-hidden", !visible);
    });
    this.current = id;
    return this.panels.get(id) || null;
  }

  hideAll() {
    this.panels.forEach((panel) => {
      panel.classList.add("ui-hidden");
      panel.classList.remove("ui-visible");
    });
    this.current = null;
  }
}
