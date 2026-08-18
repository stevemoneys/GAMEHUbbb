export class RareFoodController {
  pickSpecialType(context = {}) {
    const worldEvent = context.worldEvent?.type || "";
    const pool = [
      { type: "crystal_core", weight: 1.3 },
      { type: "speed_boost", weight: context.modeName === "speed" || worldEvent === "solar_eruption" ? 1.35 : 1.1 },
      { type: "shield_core", weight: 1.05 },
      { type: "magnet_core", weight: 1.08 },
      { type: "frenzy_core", weight: context.modeName === "duel" ? 1.18 : 0.9 },
      { type: "freeze_pulse", weight: context.modeName === "duel" || worldEvent === "ice_storm" ? 1.24 : 0.72 },
      { type: "corrupted_core", weight: context.score >= 50 || worldEvent === "corruption_wave" ? 0.78 : 0.24 }
    ];

    let total = 0;
    for (let i = 0; i < pool.length; i += 1) total += pool[i].weight;
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= pool[i].weight;
      if (roll <= 0) return pool[i].type;
    }
    return "crystal_core";
  }
}
