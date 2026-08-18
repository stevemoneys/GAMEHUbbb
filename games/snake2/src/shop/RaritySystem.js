const RARITY_ORDER = ["common", "rare", "epic", "legendary", "mythic", "ultimate"];

const RARITY_META = {
  common: {
    id: "common",
    label: "Common",
    accent: "#9fb0c9",
    glow: "rgba(158, 186, 229, 0.35)",
    badgeClass: "rarity-common"
  },
  rare: {
    id: "rare",
    label: "Rare",
    accent: "#00ff99",
    glow: "rgba(0, 255, 153, 0.38)",
    badgeClass: "rarity-rare"
  },
  epic: {
    id: "epic",
    label: "Epic",
    accent: "#4fa5ff",
    glow: "rgba(84, 158, 255, 0.4)",
    badgeClass: "rarity-epic"
  },
  legendary: {
    id: "legendary",
    label: "Legendary",
    accent: "#a971ff",
    glow: "rgba(169, 113, 255, 0.46)",
    badgeClass: "rarity-legendary"
  },
  mythic: {
    id: "mythic",
    label: "Mythic",
    accent: "#ffcf57",
    glow: "rgba(255, 207, 87, 0.5)",
    badgeClass: "rarity-mythic"
  },
  ultimate: {
    id: "ultimate",
    label: "Ultimate",
    accent: "#ff4f66",
    glow: "rgba(255, 79, 102, 0.52)",
    badgeClass: "rarity-ultimate"
  }
};

export class RaritySystem {
  static getMeta(rarityId = "common") {
    return RARITY_META[rarityId] || RARITY_META.common;
  }

  static compare(a, b) {
    const ai = RARITY_ORDER.indexOf(a);
    const bi = RARITY_ORDER.indexOf(b);
    const safeA = ai >= 0 ? ai : 0;
    const safeB = bi >= 0 ? bi : 0;
    return safeA - safeB;
  }

  static toCssVars(rarityId = "common") {
    const meta = RaritySystem.getMeta(rarityId);
    return {
      "--rarity-accent": meta.accent,
      "--rarity-glow": meta.glow
    };
  }
}