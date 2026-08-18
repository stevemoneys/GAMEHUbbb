const RANKS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 8 },
  { name: "Gold", min: 20 },
  { name: "Platinum", min: 34 },
  { name: "Diamond", min: 48 },
  { name: "Master", min: 62 },
  { name: "Apex", min: 70 }
];

export class RewardSystem {
  constructor() {
    this.unlocks = {
      personalities: new Set(["cautious"]),
      arenas: new Set(["neon_core"]),
      skins: new Set(["viper_default"]),
      fx: new Set(["base_trail"])
    };
  }

  unlockForStage(level, stage) {
    const rewards = [];
    if (level >= 4) {
      this.unlocks.personalities.add("aggressive");
    }
    if (level >= 8) {
      this.unlocks.personalities.add("tactical");
      this.unlocks.arenas.add("pulse_grid");
    }
    if (level >= 12) {
      this.unlocks.personalities.add("chaotic");
      this.unlocks.skins.add("chromatic_viper");
    }
    if (level >= 16) {
      this.unlocks.fx.add("ion_trail");
    }
    if (level >= 20) {
      this.unlocks.personalities.add("elite");
      this.unlocks.arenas.add("obsidian_arena");
    }
    if (stage === 3) {
      rewards.push(`Level ${level} cleared`);
    }
    return rewards;
  }

  getRank(completedStages) {
    const score = completedStages;
    let rank = RANKS[0].name;
    for (let i = 0; i < RANKS.length; i += 1) {
      if (score >= RANKS[i].min) rank = RANKS[i].name;
    }
    return rank;
  }

  snapshot() {
    return {
      personalities: Array.from(this.unlocks.personalities),
      arenas: Array.from(this.unlocks.arenas),
      skins: Array.from(this.unlocks.skins),
      fx: Array.from(this.unlocks.fx)
    };
  }
}
