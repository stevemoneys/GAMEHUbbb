import { ClassicMode } from "./ClassicMode.js";
import { SpeedMode } from "./SpeedMode.js";
import { SurvivalMode } from "./SurvivalMode.js";
import { DuelMode } from "./DuelMode.js";

export class ModeManager {
  constructor(context) {
    this.context = context;
    this.modes = {
      classic: new ClassicMode(context),
      speed: new SpeedMode(context),
      survival: new SurvivalMode(context),
      duel: new DuelMode(context)
    };
    this.currentModeName = "classic";
    this.currentMode = this.modes.classic;
  }

  setMode(name) {
    const normalized = String(name || "").toLowerCase();
    const next = this.modes[normalized] || this.modes.classic;
    if (this.currentMode && this.currentMode.cleanup) {
      this.currentMode.cleanup();
    }
    this.context.worldManager?.initialize(normalized in this.modes ? normalized : "classic");
    this.context.worldManager?.applyToRenderer?.(this.context.renderer);
    this.currentMode = next;
    this.currentModeName = normalized in this.modes ? normalized : "classic";
    this.currentMode.initialize();
  }

  restartCurrent() {
    this.setMode(this.currentModeName);
  }

  update(dt) {
    this.currentMode.update(dt);
  }

  render(alpha) {
    this.currentMode.render(alpha);
    return this.currentMode.getRenderState();
  }

  handleDirection(dir) {
    this.currentMode.handleDirection(dir);
  }

  getCurrentModeName() {
    return this.currentModeName;
  }
}
