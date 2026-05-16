import { Food } from "../systems/Food.js";

const FOOD_LIBRARY = {
  energy_orb: {
    type: "energy_orb",
    rarity: "common",
    score: 10,
    growth: 0.72,
    radius: 11,
    ttl: 0,
    aiPriority: 1,
    category: "core",
    visual: { family: "orb", accent: "cyan" },
    feedback: { label: "", burstScale: 1, shake: 0.9 }
  },
  crystal_core: {
    type: "crystal_core",
    rarity: "rare",
    score: 32,
    growth: 1.8,
    radius: 14,
    ttl: 11,
    aiPriority: 2.8,
    category: "rare",
    contested: true,
    powerUp: { type: "crystal_focus", duration: 8, value: 1.35 },
    comboBonus: 2,
    visual: { family: "crystal", accent: "magenta" },
    feedback: { label: "Crystal Core", burstScale: 1.8, shake: 2.2 }
  },
  speed_boost: {
    type: "speed_boost",
    rarity: "rare",
    score: 18,
    growth: 0.85,
    radius: 12,
    ttl: 10,
    aiPriority: 1.85,
    category: "power",
    powerUp: { type: "speed_boost", duration: 5.2, value: 1.22 },
    visual: { family: "lightning", accent: "amber" },
    feedback: { label: "Speed Surge", burstScale: 1.2, shake: 1.4 }
  },
  shield_core: {
    type: "shield_core",
    rarity: "rare",
    score: 20,
    growth: 0.95,
    radius: 12.5,
    ttl: 12,
    aiPriority: 1.55,
    category: "power",
    powerUp: { type: "shielded", duration: 12, value: 1 },
    visual: { family: "shield", accent: "blue" },
    feedback: { label: "Shield Ready", burstScale: 1.25, shake: 1.2 }
  },
  magnet_core: {
    type: "magnet_core",
    rarity: "epic",
    score: 22,
    growth: 1,
    radius: 12.5,
    ttl: 10,
    aiPriority: 1.65,
    category: "power",
    powerUp: { type: "magnetized", duration: 7.5, value: 1 },
    visual: { family: "magnet", accent: "purple" },
    feedback: { label: "Magnet Online", burstScale: 1.35, shake: 1.5 }
  },
  frenzy_core: {
    type: "frenzy_core",
    rarity: "epic",
    score: 28,
    growth: 1.55,
    radius: 13.5,
    ttl: 9,
    aiPriority: 2.1,
    category: "power",
    contested: true,
    powerUp: { type: "frenzy", duration: 5.6, value: 1.55 },
    visual: { family: "frenzy", accent: "orange" },
    feedback: { label: "Frenzy!", burstScale: 1.9, shake: 2.6 }
  },
  freeze_pulse: {
    type: "freeze_pulse",
    rarity: "epic",
    score: 20,
    growth: 0.9,
    radius: 12.5,
    ttl: 10,
    aiPriority: 1.6,
    category: "power",
    powerUp: { type: "freeze_field", duration: 5.2, value: 1 },
    visual: { family: "freeze", accent: "ice" },
    feedback: { label: "Freeze Pulse", burstScale: 1.3, shake: 1.3 }
  },
  corrupted_core: {
    type: "corrupted_core",
    rarity: "legendary",
    score: 40,
    growth: 2.45,
    radius: 14,
    ttl: 10,
    aiPriority: 2.5,
    category: "risk",
    contested: true,
    powerUp: { type: "corrupted_overload", duration: 6.2, value: 1 },
    visual: { family: "corrupt", accent: "void" },
    feedback: { label: "Corrupted Core", burstScale: 2.1, shake: 2.8 }
  },
  evolution_fragment: {
    type: "evolution_fragment",
    rarity: "legendary",
    score: 14,
    growth: 0.45,
    radius: 10.5,
    ttl: 14,
    aiPriority: 1.3,
    category: "progression",
    fragments: 1,
    visual: { family: "fragment", accent: "cosmic" },
    feedback: { label: "Evolution Fragment", burstScale: 1.6, shake: 1.8 }
  }
};

export class FoodFactory {
  static getDefinition(type) {
    return FOOD_LIBRARY[type] || FOOD_LIBRARY.energy_orb;
  }

  static listTypes() {
    return Object.keys(FOOD_LIBRARY);
  }

  static create(type, x = 0, y = 0) {
    const definition = FoodFactory.getDefinition(type);
    const food = new Food({ food: { radiusPx: definition.radius, spawnPaddingPx: 0, maxSpawnAttempts: 1 } });
    food.id = `${definition.type}_${Math.random().toString(36).slice(2, 9)}`;
    food.type = definition.type;
    food.rarity = definition.rarity;
    food.category = definition.category;
    food.radius = definition.radius;
    food.x = x;
    food.y = y;
    food.scoreValue = definition.score;
    food.growthValue = definition.growth;
    food.aiPriority = definition.aiPriority;
    food.contested = Boolean(definition.contested);
    food.fragments = definition.fragments || 0;
    food.comboBonus = definition.comboBonus || 0;
    food.powerUp = definition.powerUp || null;
    food.ttl = definition.ttl || 0;
    food.age = 0;
    food.life = definition.ttl || 0;
    food.rotation = Math.random() * Math.PI * 2;
    food.phase = Math.random() * Math.PI * 2;
    food.orbitPhase = Math.random() * Math.PI * 2;
    food.wobbleSeed = Math.random() * Math.PI * 2;
    food.visual = { ...definition.visual };
    food.feedback = { ...definition.feedback };
    return food;
  }
}
