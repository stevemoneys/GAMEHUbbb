export class EnvironmentalAnimationSystem {
  constructor(systems = []) {
    this.systems = systems;
  }

  update(dt, bounds, context = {}) {
    for (let i = 0; i < this.systems.length; i += 1) {
      const system = this.systems[i];
      if (typeof system.update === "function") {
        system.update(dt, bounds, context);
      }
      if (typeof system.tick === "function") {
        system.tick(dt, bounds, context);
      }
    }
  }
}
