export class FoodEffects {
  static getBurstColor(type, themeVisuals) {
    const base = themeVisuals?.particleColor || "rgba(124,255,220,1)";
    const map = {
      energy_orb: base,
      crystal_core: "rgba(255, 164, 229, 1)",
      speed_boost: "rgba(255, 233, 154, 1)",
      shield_core: "rgba(145, 221, 255, 1)",
      magnet_core: "rgba(184, 134, 255, 1)",
      frenzy_core: "rgba(255, 146, 84, 1)",
      freeze_pulse: "rgba(178, 241, 255, 1)",
      corrupted_core: "rgba(219, 110, 255, 1)",
      evolution_fragment: "rgba(255, 214, 156, 1)"
    };
    return map[type] || base;
  }

  static getNotification(item) {
    if (!item?.feedback?.label) return null;
    const type = item.rarity === "common" ? "info" : item.type === "corrupted_core" ? "warning" : "success";
    return {
      message: item.feedback.label,
      type,
      durationMs: item.rarity === "common" ? 700 : 1200
    };
  }

  static getParticleOptions(item, themeVisuals, byAI = false) {
    const burstScale = item?.feedback?.burstScale || 1;
    return {
      color: byAI ? "rgba(255,170,225,1)" : FoodEffects.getBurstColor(item.type, themeVisuals),
      count: Math.max(8, Math.round((byAI ? 10 : 12) * burstScale)),
      minSpeed: 95,
      maxSpeed: 310,
      minLife: 0.24,
      maxLife: 0.72,
      minSize: 3,
      maxSize: 9.5
    };
  }
}
