import { FogSystem } from "../vfx/FogSystem.js";
import { ParallaxSystem } from "../vfx/ParallaxSystem.js";
import { EnergyRiverSystem } from "../vfx/EnergyRiverSystem.js";
import { ReactiveTerrainSystem } from "../vfx/ReactiveTerrainSystem.js";
import { AmbientCreatureSystem } from "../environment/AmbientCreatureSystem.js";
import { FloatingObjectSystem } from "../environment/FloatingObjectSystem.js";
import { WorldPulseSystem } from "../environment/WorldPulseSystem.js";
import { EnvironmentalAnimationSystem } from "./EnvironmentalAnimationSystem.js";

export class WorldLifeSystem {
  constructor() {
    this.fog = new FogSystem();
    this.parallax = new ParallaxSystem();
    this.rivers = new EnergyRiverSystem();
    this.terrain = new ReactiveTerrainSystem();
    this.creatures = new AmbientCreatureSystem();
    this.objects = new FloatingObjectSystem();
    this.pulse = new WorldPulseSystem();
    this.animations = new EnvironmentalAnimationSystem([
      this.fog,
      this.creatures,
      this.objects
    ]);
  }

  update(dt, bounds, context = {}) {
    this.animations.update(dt, bounds, context);
    if (context.playerHead) {
      this.terrain.update(context.playerHead, context.timeSec || 0);
    }
  }
}
