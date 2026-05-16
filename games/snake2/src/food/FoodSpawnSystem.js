import { FoodFactory } from "./FoodFactory.js";

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return (dx * dx) + (dy * dy);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class FoodSpawnSystem {
  getTargetProfile(modeName) {
    const mode = String(modeName || "classic").toLowerCase();
    if (mode === "speed") return { common: 14, special: 4, fragment: 1 };
    if (mode === "duel") return { common: 10, special: 4, fragment: 1 };
    if (mode === "survival") return { common: 12, special: 3, fragment: 1 };
    return { common: 12, special: 3, fragment: 1 };
  }

  pickSpecialType(context) {
    const pool = [
      "crystal_core",
      "speed_boost",
      "shield_core",
      "magnet_core",
      "frenzy_core",
      "freeze_pulse",
      "corrupted_core"
    ];
    const weights = new Map([
      ["crystal_core", 1.35],
      ["speed_boost", 1.25],
      ["shield_core", 1.05],
      ["magnet_core", 1.05],
      ["frenzy_core", context.modeName === "speed" ? 1.35 : 1.1],
      ["freeze_pulse", context.modeName === "duel" ? 1.35 : 0.95],
      ["corrupted_core", context.score >= 40 ? 0.75 : 0.28]
    ]);

    let total = 0;
    for (let i = 0; i < pool.length; i += 1) total += weights.get(pool[i]) || 1;
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= weights.get(pool[i]) || 1;
      if (roll <= 0) return pool[i];
    }
    return "crystal_core";
  }

  buildSpawnPlan(state, context) {
    const profile = this.getTargetProfile(context.modeName);
    const commonCount = state.items.filter((item) => item.type === "energy_orb").length;
    const specialCount = state.items.filter((item) => item.category === "power" || item.category === "rare" || item.category === "risk").length;
    const fragmentCount = state.items.filter((item) => item.type === "evolution_fragment").length;
    const queue = [];

    for (let i = commonCount; i < profile.common; i += 1) queue.push("energy_orb");

    if (specialCount < profile.special && state.rareTimer >= context.rareInterval) {
      queue.push(this.pickSpecialType(context));
      state.rareTimer = 0;
    }

    if (fragmentCount < profile.fragment && state.fragmentTimer >= context.fragmentInterval && context.score >= 18) {
      queue.push("evolution_fragment");
      state.fragmentTimer = 0;
    }

    return queue;
  }

  spawn(type, occupiedPoints, bounds, context) {
    const definition = FoodFactory.getDefinition(type);
    const spawnPoint = definition.contested
      ? this.#findContestedPoint(occupiedPoints, bounds, context, definition.radius)
      : this.#findSafeRandomPoint(occupiedPoints, bounds, context, definition.radius);
    return FoodFactory.create(type, spawnPoint.x, spawnPoint.y);
  }

  #findContestedPoint(occupiedPoints, bounds, context, radius) {
    const player = context.playerHead;
    const ai = context.aiHead;
    if (!player || !ai) {
      return this.#findSafeRandomPoint(occupiedPoints, bounds, context, radius);
    }

    const mid = {
      x: (player.x + ai.x) * 0.5,
      y: (player.y + ai.y) * 0.5
    };

    for (let i = 0; i < 24; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 28 + (Math.random() * 72);
      const candidate = {
        x: clamp(mid.x + (Math.cos(angle) * dist), bounds.x + radius, bounds.x + bounds.width - radius),
        y: clamp(mid.y + (Math.sin(angle) * dist), bounds.y + radius, bounds.y + bounds.height - radius)
      };
      if (this.#isPointSafe(candidate, occupiedPoints, radius)) return candidate;
    }

    return this.#findSafeRandomPoint(occupiedPoints, bounds, context, radius);
  }

  #findSafeRandomPoint(occupiedPoints, bounds, context, radius) {
    const player = context.playerHead;
    const maxAttempts = context.maxAttempts || 260;
    for (let i = 0; i < maxAttempts; i += 1) {
      const point = {
        x: bounds.x + radius + (Math.random() * Math.max(1, bounds.width - (radius * 2))),
        y: bounds.y + radius + (Math.random() * Math.max(1, bounds.height - (radius * 2)))
      };
      if (!this.#isPointSafe(point, occupiedPoints, radius)) continue;
      if (player && distanceSq(point, player) < ((radius + 80) * (radius + 80))) continue;
      return point;
    }

    return {
      x: bounds.x + (bounds.width * 0.5),
      y: bounds.y + (bounds.height * 0.5)
    };
  }

  #isPointSafe(point, occupiedPoints, radius) {
    for (let i = 0; i < occupiedPoints.length; i += 1) {
      const occupied = occupiedPoints[i];
      const minDist = (occupied.r || 10) + radius + 10;
      if (distanceSq(point, occupied) < (minDist * minDist)) return false;
    }
    return true;
  }
}
