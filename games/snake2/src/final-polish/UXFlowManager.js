export class UXFlowManager {
  constructor(root) {
    this.root = root;
  }

  setFlow(state) {
    if (!this.root) return;
    this.root.dataset.flow = state;
  }

  enterHome() {
    this.setFlow("home");
  }

  enterPanel(panelId) {
    this.setFlow(panelId || "panel");
  }

  enterPlay() {
    this.setFlow("play");
  }
}
