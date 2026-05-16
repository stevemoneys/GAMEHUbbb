import { AppLayoutSystem } from "./AppLayoutSystem.js";
import { ResponsiveScaler } from "./ResponsiveScaler.js";
import { ScreenTransitionSystem } from "./ScreenTransitionSystem.js";
import { CinematicEffects } from "./CinematicEffects.js";
import { NavigationAnimator } from "./NavigationAnimator.js";
import { UXFlowManager } from "./UXFlowManager.js";

export class ProductionPolishManager {
  constructor(options = {}) {
    this.root = options.root || null;
    this.layout = new AppLayoutSystem();
    this.scaler = new ResponsiveScaler();
    this.transitions = new ScreenTransitionSystem();
    this.cinematics = new CinematicEffects(this.root);
    this.navigation = new NavigationAnimator();
    this.flow = new UXFlowManager(this.root);
  }

  init() {
    this.layout.start();
    this.scaler.start();
    this.cinematics.start();
    this.flow.enterHome();
  }

  destroy() {
    this.layout.stop();
    this.scaler.stop();
    this.cinematics.stop();
  }

  showHome() {
    this.flow.enterHome();
    this.transitions.showScreen(this.root);
  }

  hideHome(onHidden) {
    this.flow.enterPlay();
    this.transitions.hideScreen(this.root, onHidden);
  }

  openPanel(panelId, panelElement, navButtons = [], activeButton = null) {
    this.flow.enterPanel(panelId);
    this.transitions.showPanel(panelElement);
    this.navigation.setActiveButton(navButtons, panelId);
    this.navigation.press(activeButton);
    this.cinematics.pulseAccent();
  }

  closePanels(panelElements = [], navButtons = []) {
    this.flow.enterHome();
    panelElements.forEach((panel) => this.transitions.hidePanel(panel));
    this.navigation.setActiveButton(navButtons, "__none__");
  }

  pulsePrimary(button) {
    this.navigation.press(button);
    this.cinematics.pulseAccent();
  }
}
