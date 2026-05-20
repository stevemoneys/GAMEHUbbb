export class FoodZoneSystem {
  chooseZoneForType(type, zones, psychology) {
    if (type === "energy_orb") {
      return psychology.explorationBias > 0.7 ? "routes" : "safe";
    }
    if (type === "crystal_core") return "combat";
    if (type === "speed_boost") return "routes";
    if (type === "shield_core") return "hazard";
    if (type === "magnet_core") return "exploration";
    if (type === "frenzy_core") return "combat";
    if (type === "freeze_pulse") return "combat";
    if (type === "corrupted_core") return "hazard";
    if (type === "evolution_fragment") return "exploration";
    return "safe";
  }

  getCandidates(type, zones, psychology) {
    const primary = this.chooseZoneForType(type, zones, psychology);
    const fallback = primary === "combat" ? "routes" : primary === "exploration" ? "safe" : "combat";
    return {
      primary,
      anchors: zones[primary] || [],
      fallbackAnchors: zones[fallback] || []
    };
  }
}
