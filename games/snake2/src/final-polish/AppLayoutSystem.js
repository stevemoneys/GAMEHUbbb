export class AppLayoutSystem {
  constructor(root = document.documentElement, body = document.body) {
    this.root = root;
    this.body = body;
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
    const tier = shortest < 380 ? "compact" : shortest < 760 ? "phone" : "tablet";

    this.root.dataset.orientation = orientation;
    this.root.dataset.sizeTier = tier;
    this.body.dataset.orientation = orientation;
    this.body.dataset.sizeTier = tier;
  }
}
