import { FoodFactory } from "./FoodFactory.js";
import { FoodZoneSystem } from "./FoodZoneSystem.js";
import { RareFoodController } from "./RareFoodController.js";
import { WorldHeatmapSystem } from "../world/WorldHeatmapSystem.js";
import { DynamicSpawnZones } from "../world/DynamicSpawnZones.js";
import { RewardPsychologySystem } from "../gameplay/RewardPsychologySystem.js";

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return (dx * dx) + (dy * dy);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class FoodSpawnManager {
  constructor() {
    this.zoneSystem = new FoodZoneSystem();
    this.rareController = new RareFoodController();
    this.heatmap = new WorldHeatmapSystem();
    this.dynamicZones = new DynamicSpawnZones();
    this.rewardPsychology = new RewardPsychologySystem();
  }

  getTargetProfile(modeName) {
    const mode = String(modeName || "classic").toLowerCase();
    if (mode === "speed") return { common: 14, special: 4, fragment: 1 };
    if (mode === "duel") return { common: 10, special: 4, fragment: 1 };
    if (mode === "survival") return { common: 12, special: 3, fragment: 1 };
    return { common: 12, special: 3, fragment: 1 };
  }

  buildSpawnPlan(state, context) {
    const profile = this.getTargetProfile(context.modeName);
    const worldEvent = context.worldEvent?.type || "";
    const commonCount = state.items.filter((item) => item.type === "energy_orb").length;
    const specialCount = state.items.filter((item) => item.category === "power" || item.category === "rare" || item.category === "risk").length;
    const fragmentCount = state.items.filter((item) => item.type === "evolution_fragment").length;
    const queue = [];

    const psychology = this.rewardPsychology.getProfile(context);
    const commonEventBias = worldEvent === "meteor_shower" ? 2 : worldEvent === "solar_eruption" ? 1 : 0;
    const commonGoal = profile.common + Math.round(psychology.intensity * 2) + commonEventBias;
    for (let i = commonCount; i < commonGoal; i += 1) queue.push("energy_orb");

    const specialGoal = profile.special + ((worldEvent === "crystal_eruption" || worldEvent === "corruption_wave") ? 1 : 0);
    if (specialCount < specialGoal && state.rareTimer >= context.rareInterval) {
      queue.push(this.rareController.pickSpecialType(context));
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
    const heatmap = this.heatmap.build(bounds, context);
    const psychology = this.rewardPsychology.getProfile(context);
    const zones = this.dynamicZones.buildZones(bounds, heatmap, context);
    const zoneCandidates = this.zoneSystem.getCandidates(type, zones, psychology);

    if (type === "energy_orb") {
      return this.#spawnOrbTrail(occupiedPoints, bounds, context, zoneCandidates, psychology);
    }

    const point = this.#findAnchoredPoint(type, occupiedPoints, bounds, context, zoneCandidates, definition.radius);
    return FoodFactory.create(type, point.x, point.y);
  }

  #spawnOrbTrail(occupiedPoints, bounds, context, zoneCandidates, psychology) {
    const definition = FoodFactory.getDefinition("energy_orb");
    const anchors = zoneCandidates.anchors.length > 0 ? zoneCandidates.anchors : zoneCandidates.fallbackAnchors;
    const anchor = anchors[Math.floor(Math.random() * anchors.length)] || {
      x: bounds.x + (bounds.width * 0.5),
      y: bounds.y + (bounds.height * 0.5)
    };
    const angle = Math.random() * Math.PI * 2;
    const trailOffset = (Math.random() * 42) + (Math.random() * 34);
    const point = {
      x: clamp(anchor.x + (Math.cos(angle) * trailOffset), bounds.x + definition.radius, bounds.x + bounds.width - definition.radius),
      y: clamp(anchor.y + (Math.sin(angle) * trailOffset), bounds.y + definition.radius, bounds.y + bounds.height - definition.radius)
    };

    if (this.#isPointSafe(point, occupiedPoints, definition.radius, context.playerHead)) {
      return FoodFactory.create("energy_orb", point.x, point.y);
    }

    const fallback = this.#findSafeRandomPoint(occupiedPoints, bounds, context, definition.radius);
    return FoodFactory.create("energy_orb", fallback.x, fallback.y);
  }

  #findAnchoredPoint(type, occupiedPoints, bounds, context, zoneCandidates, radius) {
    const anchors = [...zoneCandidates.anchors, ...zoneCandidates.fallbackAnchors];
    for (let i = 0; i < anchors.length; i += 1) {
      const anchor = anchors[i];
      const attempts = 10;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 28 + (Math.random() * 96);
        const point = {
          x: clamp(anchor.x + (Math.cos(angle) * distance), bounds.x + radius, bounds.x + bounds.width - radius),
          y: clamp(anchor.y + (Math.sin(angle) * distance), bounds.y + radius, bounds.y + bounds.height - radius)
        };
        if (this.#isPointSafe(point, occupiedPoints, radius, context.playerHead, type)) return point;
      }
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
      if (!this.#isPointSafe(point, occupiedPoints, radius, player)) continue;
      return point;
    }

    return {
      x: bounds.x + (bounds.width * 0.5),
      y: bounds.y + (bounds.height * 0.5)
    };
  }

  #isPointSafe(point, occupiedPoints, radius, playerHead = null, type = "energy_orb") {
    for (let i = 0; i < occupiedPoints.length; i += 1) {
      const occupied = occupiedPoints[i];
      const minDist = (occupied.r || 10) + radius + 10;
      if (distanceSq(point, occupied) < (minDist * minDist)) return false;
    }

    if (playerHead) {
      const distanceLimit = type === "crystal_core" || type === "frenzy_core"
        ? radius + 40
        : type === "energy_orb"
          ? radius + 52
          : radius + 68;
      if (distanceSq(point, playerHead) < (distanceLimit * distanceLimit)) return false;
    }
    return true;
  }
}
