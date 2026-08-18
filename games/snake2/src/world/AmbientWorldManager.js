import { WorldLifeSystem } from "./WorldLifeSystem.js";
import { DynamicEventSystem } from "./DynamicEventSystem.js";

export class AmbientWorldManager {
  constructor() {
    this.life = new WorldLifeSystem();
    this.events = new DynamicEventSystem();
    this.lastContext = {
      modeName: "classic",
      timeSec: 0,
      heat: 0,
      playerHead: null,
      aiHead: null,
      theme: null
    };
  }

  update(dt, bounds, context = {}) {
    this.lastContext = {
      ...this.lastContext,
      ...context
    };
    const activeEvent = this.events.update(dt, this.lastContext);
    this.life.update(dt, bounds, {
      ...this.lastContext,
      activeEvent
    });
  }

  getActiveEvent() {
    return this.events.getActiveEvent();
  }
}
