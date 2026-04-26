"use strict";

(function (global) {
  const {
    drawRoundedRectPath,
    hexToRgba,
    DIRS,
    clamp
  } = global.SnakeShared;

  const RARITY_META = {
    Starter: { color: "#aab4c5", glow: "rgba(170,180,197,0.35)" },
    Common: { color: "#57f287", glow: "rgba(87,242,135,0.35)" },
    Rare: { color: "#53a5ff", glow: "rgba(83,165,255,0.4)" },
    Epic: { color: "#b56bff", glow: "rgba(181,107,255,0.45)" },
    Legendary: { color: "#ffd166", glow: "rgba(255,209,102,0.52)" },
    Mythic: { color: "#ff5c6c", glow: "rgba(255,92,108,0.62)" }
  };

  function perkBundle(modifiers) {
    return {
      coinBonus: 0,
      speedBonus: 0,
      powerDurationBonus: 0,
      comboWindowBonus: 0,
      invincibilityDurationBonus: 0,
      powerCooldownReduction: 0,
      ...modifiers
    };
  }

  const SKIN_LIST = [
    {
      id: "classic_green",
      name: "Classic Green",
      rarity: "Starter",
      baseColor: "#2ecc2e",
      accentColor: "#67ff80",
      pattern: "solid",
      patternColor: "#1f8a1f",
      unlockCondition: { type: "start", value: 0 },
      perkDescription: "Starter skin. Balanced baseline.",
      modifiers: perkBundle({})
    },
    {
      id: "neon_blue",
      name: "Neon Blue",
      rarity: "Common",
      baseColor: "#00d4ff",
      accentColor: "#9df4ff",
      pattern: "pulse_glow",
      patternColor: "#ffffff",
      unlockCondition: { type: "level", value: 5 },
      perkDescription: "+5% coins earned",
      modifiers: perkBundle({ coinBonus: 0.05 })
    },
    {
      id: "magma_core",
      name: "Magma Core",
      rarity: "Common",
      baseColor: "#ff5500",
      accentColor: "#ff9d00",
      pattern: "gradient",
      patternColor: "#ffaa00",
      unlockCondition: { type: "score", value: 600 },
      perkDescription: "+5% movement speed",
      modifiers: perkBundle({ speedBonus: 0.05 })
    },
    {
      id: "forest_vine",
      name: "Forest Vine",
      rarity: "Common",
      baseColor: "#228b22",
      accentColor: "#7dff83",
      pattern: "scales",
      patternColor: "#32cd32",
      unlockCondition: { type: "games_played", value: 5 },
      perkDescription: "+5% power-up duration",
      modifiers: perkBundle({ powerDurationBonus: 0.05 })
    },
    {
      id: "ice_shard",
      name: "Ice Shard",
      rarity: "Common",
      baseColor: "#88ccff",
      accentColor: "#e3ffff",
      pattern: "diamond",
      patternColor: "#aaffff",
      unlockCondition: { type: "level", value: 12 },
      perkDescription: "+5% combo window",
      modifiers: perkBundle({ comboWindowBonus: 0.05 })
    },
    {
      id: "steel_armor",
      name: "Steel Armor",
      rarity: "Rare",
      baseColor: "#708090",
      accentColor: "#d5dbe4",
      pattern: "stripes",
      patternColor: "#a9a9a9",
      unlockCondition: { type: "ai_eaten", value: 8 },
      perkDescription: "+10% invincibility duration",
      modifiers: perkBundle({ invincibilityDurationBonus: 0.1 })
    },
    {
      id: "gold_emperor",
      name: "Gold Emperor",
      rarity: "Rare",
      baseColor: "#ffd700",
      accentColor: "#fff4a3",
      pattern: "solid",
      patternColor: "#e0b800",
      unlockCondition: { type: "coins", value: 2500 },
      perkDescription: "+10% coins earned",
      modifiers: perkBundle({ coinBonus: 0.1 })
    },
    {
      id: "shadow_stalker",
      name: "Shadow Stalker",
      rarity: "Rare",
      baseColor: "#2c2c54",
      accentColor: "#7a7ab3",
      pattern: "stripes",
      patternColor: "#5c5c8a",
      unlockCondition: { type: "level", value: 22 },
      perkDescription: "+10% movement speed",
      modifiers: perkBundle({ speedBonus: 0.1 })
    },
    {
      id: "toxic_waste",
      name: "Toxic Waste",
      rarity: "Rare",
      baseColor: "#39ff14",
      accentColor: "#daff77",
      pattern: "dots",
      patternColor: "#00ff00",
      unlockCondition: { type: "ai_eaten", value: 20 },
      perkDescription: "+10% power-up duration",
      modifiers: perkBundle({ powerDurationBonus: 0.1 })
    },
    {
      id: "crystal_prism",
      name: "Crystal Prism",
      rarity: "Rare",
      baseColor: "#e0b0ff",
      accentColor: "#ffffff",
      pattern: "diamond",
      patternColor: "#ffffff",
      unlockCondition: { type: "score", value: 1600 },
      perkDescription: "+10% combo window",
      modifiers: perkBundle({ comboWindowBonus: 0.1 })
    },
    {
      id: "plasma_bolt",
      name: "Plasma Bolt",
      rarity: "Rare",
      baseColor: "#ff00ff",
      accentColor: "#ffd1ff",
      pattern: "pulse_glow",
      patternColor: "#ff66ff",
      unlockCondition: { type: "level", value: 35 },
      perkDescription: "+10% invincibility duration",
      modifiers: perkBundle({ invincibilityDurationBonus: 0.1 })
    },
    {
      id: "inferno_dragon",
      name: "Inferno Dragon",
      rarity: "Epic",
      baseColor: "#8b0000",
      accentColor: "#ff8b3d",
      pattern: "scales",
      patternColor: "#ff4500",
      unlockCondition: { type: "ai_eaten", value: 35 },
      perkDescription: "+10% speed, +5% coins",
      modifiers: perkBundle({ speedBonus: 0.1, coinBonus: 0.05 })
    },
    {
      id: "starlight_nexus",
      name: "Starlight Nexus",
      rarity: "Epic",
      baseColor: "#1a1a4a",
      accentColor: "#5e6dff",
      pattern: "dots",
      patternColor: "#ffff00",
      unlockCondition: { type: "games_played", value: 20 },
      perkDescription: "+10% power-up duration, +5% combo window",
      modifiers: perkBundle({ powerDurationBonus: 0.1, comboWindowBonus: 0.05 })
    },
    {
      id: "phantom_ghost",
      name: "Phantom Ghost",
      rarity: "Epic",
      baseColor: "#dcdcdc",
      accentColor: "#ffffff",
      pattern: "solid",
      patternColor: "#eff3ff",
      unlockCondition: { type: "score", value: 2600 },
      perkDescription: "+15% invincibility, +5% speed",
      modifiers: perkBundle({ invincibilityDurationBonus: 0.15, speedBonus: 0.05 })
    },
    {
      id: "abyssal_lord",
      name: "Abyssal Lord",
      rarity: "Epic",
      baseColor: "#3b0b3b",
      accentColor: "#ca53ff",
      pattern: "stripes",
      patternColor: "#9900ff",
      unlockCondition: { type: "level", value: 55 },
      perkDescription: "+15% combo window, +5% power-up duration",
      modifiers: perkBundle({ comboWindowBonus: 0.15, powerDurationBonus: 0.05 })
    },
    {
      id: "stormbringer",
      name: "Stormbringer",
      rarity: "Epic",
      baseColor: "#000080",
      accentColor: "#56c4ff",
      pattern: "pulse_glow",
      patternColor: "#ffff00",
      unlockCondition: { type: "ai_eaten", value: 50 },
      perkDescription: "+15% speed, +5% invincibility",
      modifiers: perkBundle({ speedBonus: 0.15, invincibilityDurationBonus: 0.05 })
    },
    {
      id: "rainbow_serpent",
      name: "Rainbow Serpent",
      rarity: "Epic",
      baseColor: "#ff2f92",
      accentColor: "#4df5ff",
      pattern: "gradient",
      patternColor: "#7b61ff",
      unlockCondition: { type: "coins", value: 6500 },
      perkDescription: "+10% coins, +10% power-up duration",
      modifiers: perkBundle({ coinBonus: 0.1, powerDurationBonus: 0.1 }),
      dynamicPalette: "rainbow"
    },
    {
      id: "galaxy_tyrant",
      name: "Galaxy Tyrant",
      rarity: "Legendary",
      baseColor: "#0a0a2a",
      accentColor: "#4550ff",
      pattern: "cosmic",
      patternColor: "#ffd700",
      unlockCondition: { type: "level", value: 85 },
      perkDescription: "+15% speed, +10% coins, +10% combo window",
      modifiers: perkBundle({ speedBonus: 0.15, coinBonus: 0.1, comboWindowBonus: 0.1 })
    },
    {
      id: "phoenix_ember",
      name: "Phoenix Ember",
      rarity: "Legendary",
      baseColor: "#ff4500",
      accentColor: "#ffd05f",
      pattern: "ember",
      patternColor: "#ffaa00",
      unlockCondition: { type: "score", value: 4200 },
      perkDescription: "+15% invincibility, +10% power-up duration, +10% coins",
      modifiers: perkBundle({ invincibilityDurationBonus: 0.15, powerDurationBonus: 0.1, coinBonus: 0.1 })
    },
    {
      id: "chrono_weaver",
      name: "Chrono Weaver",
      rarity: "Legendary",
      baseColor: "#c0c0c0",
      accentColor: "#ffffff",
      pattern: "circuit",
      patternColor: "#ffffff",
      unlockCondition: { type: "ai_eaten", value: 80 },
      perkDescription: "+20% combo window, +10% speed, +10% coins",
      modifiers: perkBundle({ comboWindowBonus: 0.2, speedBonus: 0.1, coinBonus: 0.1 })
    },
    {
      id: "prismari_duelist",
      name: "Prismari Duelist",
      rarity: "Legendary",
      baseColor: "#ffffff",
      accentColor: "#76f8ff",
      pattern: "gradient",
      patternColor: "#ff00ff",
      unlockCondition: { type: "coins", value: 12000 },
      perkDescription: "+15% speed, +10% combo, -10% power-up cooldown",
      modifiers: perkBundle({ speedBonus: 0.15, comboWindowBonus: 0.1, powerCooldownReduction: 0.1 })
    },
    {
      id: "elderwood_blessing",
      name: "Elderwood Blessing",
      rarity: "Legendary",
      baseColor: "#556b2f",
      accentColor: "#9fff68",
      pattern: "scales",
      patternColor: "#7cfc00",
      unlockCondition: { type: "level", value: 115 },
      perkDescription: "-20% power-up cooldown, +10% coins, +15% invincibility",
      modifiers: perkBundle({ powerCooldownReduction: 0.2, coinBonus: 0.1, invincibilityDurationBonus: 0.15 })
    },
    {
      id: "jormungandr",
      name: "Jormungandr",
      rarity: "Mythic",
      baseColor: "#1a3300",
      accentColor: "#6bd916",
      pattern: "diamond",
      patternColor: "#ffcc00",
      unlockCondition: { type: "ai_eaten", value: 120 },
      perkDescription: "+25% speed, +20% coins, +20% combo window",
      modifiers: perkBundle({ speedBonus: 0.25, coinBonus: 0.2, comboWindowBonus: 0.2 })
    },
    {
      id: "cosmic_deity",
      name: "Cosmic Deity",
      rarity: "Mythic",
      baseColor: "#000000",
      accentColor: "#6d74ff",
      pattern: "pulse_glow",
      patternColor: "#ffffff",
      unlockCondition: { type: "level", value: 150 },
      perkDescription: "+25% invincibility, +20% power-up duration, +25% combo, +20% coins",
      modifiers: perkBundle({ invincibilityDurationBonus: 0.25, powerDurationBonus: 0.2, comboWindowBonus: 0.25, coinBonus: 0.2 })
    },
    {
      id: "golden_coin",
      name: "Golden Coin",
      rarity: "Mythic",
      baseColor: "#f0c419",
      accentColor: "#fff2a8",
      pattern: "circuit",
      patternColor: "#fffdf0",
      unlockCondition: { type: "achievement", value: "millionaire" },
      perkDescription: "Exclusive achievement skin.",
      modifiers: perkBundle({ coinBonus: 0.2, powerDurationBonus: 0.05 }),
      exclusive: true
    },
    {
      id: "cosmic_conqueror",
      name: "Cosmic Conqueror",
      rarity: "Mythic",
      baseColor: "#090914",
      accentColor: "#5ef0ff",
      pattern: "cosmic",
      patternColor: "#ffd166",
      unlockCondition: { type: "achievement", value: "level_master" },
      perkDescription: "Exclusive achievement skin.",
      modifiers: perkBundle({ speedBonus: 0.2, comboWindowBonus: 0.2, invincibilityDurationBonus: 0.15 }),
      exclusive: true
    },
    {
      id: "god_of_snakes",
      name: "God of Snakes",
      rarity: "Mythic",
      baseColor: "#050505",
      accentColor: "#ff4f7d",
      pattern: "pulse_glow",
      patternColor: "#fff7d6",
      unlockCondition: { type: "achievement", value: "true_champion" },
      perkDescription: "Exclusive achievement skin.",
      modifiers: perkBundle({ coinBonus: 0.25, speedBonus: 0.15, comboWindowBonus: 0.2, powerDurationBonus: 0.15 }),
      exclusive: true
    }
  ].map((skin) => ({ isProcedural: true, ...skin }));

  const SKINS = Object.fromEntries(SKIN_LIST.map((skin) => [skin.id, skin]));

  const THEME_LIST = [
    {
      id: "neon_grid",
      name: "Neon Grid",
      type: "css",
      unlockCondition: { type: "start", value: 0 },
      styles: {
        background: "#0a0a1a",
        gridColor: "rgba(0, 212, 255, 0.18)",
        borderColor: "#00d4ff",
        wallColor: "#243054",
        accent: "#00f3ff",
        pageGlow: "radial-gradient(circle at top, rgba(0, 243, 255, 0.18), transparent 55%)",
        pageGradient: "linear-gradient(180deg, rgba(7,12,32,0.96), rgba(3,6,20,0.98))",
        preview: "linear-gradient(135deg, #071020, #0e2240 58%, #0a1641)"
      }
    },
    {
      id: "dark_void",
      name: "Dark Void",
      type: "css",
      unlockCondition: { type: "level", value: 8 },
      styles: {
        background: "#050510",
        gridColor: "rgba(112, 76, 255, 0.16)",
        borderColor: "#5533aa",
        wallColor: "#28203d",
        accent: "#9c7bff",
        pageGlow: "radial-gradient(circle at 20% 20%, rgba(108, 51, 255, 0.18), transparent 40%)",
        pageGradient: "linear-gradient(180deg, rgba(6,6,18,0.96), rgba(2,2,10,0.99))",
        preview: "linear-gradient(135deg, #080818, #120c2c 62%, #1b1045)"
      }
    },
    {
      id: "paper_world",
      name: "Paper World",
      type: "css",
      unlockCondition: { type: "games_played", value: 6 },
      styles: {
        background: "#f4e8c1",
        gridColor: "rgba(139, 90, 43, 0.12)",
        borderColor: "#8b5a2b",
        wallColor: "#d8c499",
        accent: "#8b5a2b",
        pageGlow: "radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 50%)",
        pageGradient: "linear-gradient(180deg, rgba(244,232,193,0.88), rgba(224,205,157,0.96))",
        preview: "linear-gradient(135deg, #f6edd2, #ead39f 55%, #d9b97a)"
      }
    },
    {
      id: "abyssal_depths",
      name: "Abyssal Depths",
      type: "css",
      unlockCondition: { type: "score", value: 1200 },
      styles: {
        background: "#04131b",
        gridColor: "rgba(77, 216, 255, 0.12)",
        borderColor: "#0aa7d4",
        wallColor: "#123449",
        accent: "#4dd8ff",
        pageGlow: "radial-gradient(circle at 80% 15%, rgba(31, 145, 191, 0.22), transparent 46%)",
        pageGradient: "linear-gradient(180deg, rgba(3,18,28,0.96), rgba(1,7,13,0.99))",
        preview: "linear-gradient(135deg, #04131b, #083042 58%, #0a4b68)"
      }
    },
    {
      id: "pixel_ruins",
      name: "Pixel Ruins",
      type: "css",
      unlockCondition: { type: "coins", value: 2200 },
      styles: {
        background: "#201a1a",
        gridColor: "rgba(255, 189, 89, 0.14)",
        borderColor: "#ff9f43",
        wallColor: "#4a2f2f",
        accent: "#ff9f43",
        pageGlow: "radial-gradient(circle at 30% 12%, rgba(255, 159, 67, 0.18), transparent 42%)",
        pageGradient: "linear-gradient(180deg, rgba(28,20,20,0.96), rgba(15,10,10,0.98))",
        preview: "linear-gradient(135deg, #2b1c1c, #5f3c29 58%, #8e5c33)"
      }
    },
    {
      id: "vibrant_carnival",
      name: "Vibrant Carnival",
      type: "css",
      unlockCondition: { type: "level", value: 40 },
      styles: {
        background: "#2a0422",
        gridColor: "rgba(255, 255, 255, 0.12)",
        borderColor: "#ff4fd8",
        wallColor: "#5a174a",
        accent: "#ffd166",
        pageGlow: "radial-gradient(circle at top, rgba(255, 79, 216, 0.2), transparent 45%), radial-gradient(circle at 78% 16%, rgba(255, 209, 102, 0.14), transparent 25%)",
        pageGradient: "linear-gradient(180deg, rgba(40,5,34,0.95), rgba(19,2,17,0.98))",
        preview: "linear-gradient(135deg, #4d0c3f, #b51d78 55%, #ff9b54)"
      }
    },
    {
      id: "enchanted_jungle",
      name: "Enchanted Jungle",
      type: "image",
      imageUrl: null,
      unlockCondition: { type: "level", value: 18 },
      styles: {
        background: "#102318",
        gridColor: "rgba(124, 252, 0, 0.12)",
        borderColor: "#4fe36e",
        wallColor: "#1d4228",
        accent: "#7cfc00",
        pageGlow: "radial-gradient(circle at top, rgba(124, 252, 0, 0.16), transparent 45%)",
        pageGradient: "linear-gradient(180deg, rgba(8,27,14,0.95), rgba(4,12,7,0.98))",
        preview: "linear-gradient(135deg, #0d2715, #1d5d2c 60%, #62a043)"
      }
    },
    {
      id: "deep_space",
      name: "Deep Space",
      type: "image",
      imageUrl: null,
      unlockCondition: { type: "score", value: 3000 },
      styles: {
        background: "#030311",
        gridColor: "rgba(143, 122, 255, 0.12)",
        borderColor: "#8f7aff",
        wallColor: "#17143f",
        accent: "#c0b3ff",
        pageGlow: "radial-gradient(circle at top, rgba(143, 122, 255, 0.16), transparent 45%)",
        pageGradient: "linear-gradient(180deg, rgba(5,5,20,0.96), rgba(1,1,10,0.99))",
        preview: "linear-gradient(135deg, #030311, #17143f 58%, #36295d)"
      }
    },
    {
      id: "candy_land",
      name: "Candy Land",
      type: "image",
      imageUrl: null,
      unlockCondition: { type: "coins", value: 5000 },
      styles: {
        background: "#2b0f1e",
        gridColor: "rgba(255, 185, 222, 0.14)",
        borderColor: "#ff7abf",
        wallColor: "#66314b",
        accent: "#ffd166",
        pageGlow: "radial-gradient(circle at top, rgba(255, 122, 191, 0.16), transparent 45%)",
        pageGradient: "linear-gradient(180deg, rgba(43,15,30,0.96), rgba(22,6,16,0.99))",
        preview: "linear-gradient(135deg, #5d1837, #ff7abf 58%, #ffd166)"
      }
    },
    {
      id: "cyber_dojo",
      name: "Cyber Dojo",
      type: "image",
      imageUrl: null,
      unlockCondition: { type: "ai_eaten", value: 40 },
      styles: {
        background: "#0d1117",
        gridColor: "rgba(0, 245, 255, 0.12)",
        borderColor: "#ff4d4d",
        wallColor: "#242f39",
        accent: "#00f5ff",
        pageGlow: "radial-gradient(circle at top, rgba(0, 245, 255, 0.16), transparent 45%)",
        pageGradient: "linear-gradient(180deg, rgba(10,17,24,0.96), rgba(5,10,15,0.99))",
        preview: "linear-gradient(135deg, #0d1117, #183046 55%, #b02d2d)"
      }
    },
    {
      id: "frozen_tundra",
      name: "Frozen Tundra",
      type: "image",
      imageUrl: null,
      unlockCondition: { type: "level", value: 90 },
      styles: {
        background: "#07131f",
        gridColor: "rgba(170, 240, 255, 0.16)",
        borderColor: "#a8ecff",
        wallColor: "#21465d",
        accent: "#d9f8ff",
        pageGlow: "radial-gradient(circle at top, rgba(168, 236, 255, 0.16), transparent 42%)",
        pageGradient: "linear-gradient(180deg, rgba(9,20,31,0.96), rgba(4,10,15,0.99))",
        preview: "linear-gradient(135deg, #0a1b2a, #3b84a4 58%, #b8f1ff)"
      }
    },
    {
      id: "steampunk_factory",
      name: "Steampunk Factory",
      type: "image",
      imageUrl: null,
      unlockCondition: { type: "level", value: 130 },
      styles: {
        background: "#1e1410",
        gridColor: "rgba(230, 173, 105, 0.12)",
        borderColor: "#d69047",
        wallColor: "#4b2e24",
        accent: "#ffbe78",
        pageGlow: "radial-gradient(circle at top, rgba(214, 144, 71, 0.18), transparent 42%)",
        pageGradient: "linear-gradient(180deg, rgba(30,20,16,0.96), rgba(15,10,8,0.99))",
        preview: "linear-gradient(135deg, #251611, #7e4f31 58%, #d69047)"
      }
    }
  ];

  const THEMES = Object.fromEntries(THEME_LIST.map((theme) => [theme.id, theme]));

  function getSkinById(id) {
    return SKINS[id] || SKINS.classic_green;
  }

  function getThemeById(id) {
    return THEMES[id] || THEMES.neon_grid;
  }

  function getSkinPerkTotals(skin) {
    return perkBundle((skin || SKINS.classic_green).modifiers || {});
  }

  function pctLabel(value) {
    return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
  }

  function withAlpha(color, alpha) {
    if (!color || typeof color !== "string") return color;
    if (color.startsWith("#")) return hexToRgba(color, alpha);
    if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    if (color.startsWith("hsl(")) return color.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);
    return color;
  }

  function formatUnlockCondition(condition) {
    if (!condition || condition.type === "start") return "Unlocked from the start";
    if (condition.type === "level") return `Reach Level ${condition.value}`;
    if (condition.type === "score") return `Reach a score of ${condition.value}`;
    if (condition.type === "coins") return `Collect ${condition.value} coins`;
    if (condition.type === "games_played") return `Play ${condition.value} games`;
    if (condition.type === "ai_eaten") return `Devour ${condition.value} AI snakes`;
    return "Special unlock";
  }

  function describeModifiers(modifiers) {
    const parts = [];
    if (modifiers.coinBonus) parts.push(`${pctLabel(modifiers.coinBonus)} coins`);
    if (modifiers.speedBonus) parts.push(`${pctLabel(modifiers.speedBonus)} speed`);
    if (modifiers.powerDurationBonus) parts.push(`${pctLabel(modifiers.powerDurationBonus)} power-up duration`);
    if (modifiers.comboWindowBonus) parts.push(`${pctLabel(modifiers.comboWindowBonus)} combo window`);
    if (modifiers.invincibilityDurationBonus) parts.push(`${pctLabel(modifiers.invincibilityDurationBonus)} invincibility`);
    if (modifiers.powerCooldownReduction) parts.push(`${pctLabel(-modifiers.powerCooldownReduction)} power-up cooldown`);
    return parts.length ? parts.join(", ") : "No gameplay perk";
  }

  function resolveDynamicPalette(skin, ts, segmentIndex) {
    if (skin.dynamicPalette !== "rainbow") {
      return {
        baseColor: skin.baseColor,
        accentColor: skin.accentColor || skin.baseColor,
        patternColor: skin.patternColor || skin.accentColor || skin.baseColor
      };
    }

    const hue = (ts * 0.055 + segmentIndex * 32) % 360;
    return {
      baseColor: `hsl(${hue}, 92%, 58%)`,
      accentColor: `hsl(${(hue + 48) % 360}, 95%, 68%)`,
      patternColor: `hsl(${(hue + 100) % 360}, 92%, 72%)`
    };
  }

  function drawSegmentBase(ctx, x, y, size, palette, shadowStrength, outlineColor) {
    const inset = Math.max(1, size * 0.06);
    const w = size - inset * 2;
    const h = size - inset * 2;
    const radius = Math.max(4, size * 0.28);

    const fill = ctx.createLinearGradient(x, y, x + size, y + size);
    fill.addColorStop(0, palette.accentColor);
    fill.addColorStop(0.5, palette.baseColor);
    fill.addColorStop(1, withAlpha(palette.baseColor, 0.82));

    ctx.save();
    ctx.shadowBlur = shadowStrength;
    ctx.shadowColor = withAlpha(palette.patternColor, 0.55);
    drawRoundedRectPath(ctx, x + inset, y + inset, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = outlineColor || withAlpha("#0a0a0a", 0.75);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, x + inset, y + inset, w, h, radius);
    ctx.clip();
    ctx.fillStyle = withAlpha("#ffffff", 0.08);
    ctx.fillRect(x + inset, y + inset, w, h * 0.34);
    ctx.restore();
  }

  function drawPattern(ctx, x, y, size, skin, palette, segmentIndex, ts) {
    const inset = Math.max(2, size * 0.12);
    const innerX = x + inset;
    const innerY = y + inset;
    const innerSize = size - inset * 2;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    ctx.save();
    drawRoundedRectPath(ctx, innerX, innerY, innerSize, innerSize, Math.max(3, innerSize * 0.28));
    ctx.clip();

    switch (skin.pattern) {
      case "solid":
        ctx.fillStyle = withAlpha(palette.accentColor, 0.1);
        ctx.fillRect(innerX, innerY, innerSize, innerSize);
        break;
      case "stripes":
        ctx.strokeStyle = withAlpha(palette.patternColor, 0.8);
        ctx.lineWidth = Math.max(1.2, size * 0.08);
        for (let i = -1; i < 4; i += 1) {
          const yy = innerY + i * innerSize * 0.34;
          ctx.beginPath();
          ctx.moveTo(innerX, yy);
          ctx.lineTo(innerX + innerSize, yy + innerSize * 0.14);
          ctx.stroke();
        }
        break;
      case "dots":
        ctx.fillStyle = withAlpha(palette.patternColor, 0.92);
        for (let row = 0; row < 2; row += 1) {
          for (let col = 0; col < 2; col += 1) {
            ctx.beginPath();
            ctx.arc(innerX + innerSize * (0.28 + col * 0.44), innerY + innerSize * (0.28 + row * 0.44), size * 0.07, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case "scales":
        ctx.strokeStyle = withAlpha(palette.patternColor, 0.85);
        ctx.lineWidth = Math.max(1, size * 0.05);
        for (let row = 0; row < 3; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            const ox = innerX + col * innerSize * 0.34 - (row % 2 ? innerSize * 0.08 : 0);
            const oy = innerY + row * innerSize * 0.28;
            ctx.beginPath();
            ctx.arc(ox, oy, innerSize * 0.14, 0, Math.PI, true);
            ctx.stroke();
          }
        }
        break;
      case "diamond":
        ctx.fillStyle = withAlpha(palette.patternColor, 0.88);
        ctx.beginPath();
        ctx.moveTo(centerX, innerY + innerSize * 0.12);
        ctx.lineTo(innerX + innerSize * 0.82, centerY);
        ctx.lineTo(centerX, innerY + innerSize * 0.88);
        ctx.lineTo(innerX + innerSize * 0.18, centerY);
        ctx.closePath();
        ctx.fill();
        break;
      case "pulse_glow": {
        const glow = 0.4 + 0.25 * Math.sin(ts * 0.01 + segmentIndex * 0.6);
        ctx.shadowBlur = 16;
        ctx.shadowColor = withAlpha(palette.patternColor, 0.55 + glow * 0.2);
        ctx.fillStyle = withAlpha(palette.patternColor, 0.2 + glow * 0.12);
        ctx.fillRect(innerX, innerY, innerSize, innerSize);
        break;
      }
      case "gradient": {
        const gradient = ctx.createLinearGradient(innerX, innerY, innerX + innerSize, innerY + innerSize);
        gradient.addColorStop(0, palette.baseColor);
        gradient.addColorStop(0.55, palette.accentColor);
        gradient.addColorStop(1, palette.patternColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(innerX, innerY, innerSize, innerSize);
        break;
      }
      case "cosmic":
        ctx.fillStyle = withAlpha(palette.patternColor, 0.88);
        for (let i = 0; i < 5; i += 1) {
          const seed = (segmentIndex + 1) * (i + 2) * 13;
          const px = innerX + ((seed * 17) % 100) / 100 * innerSize;
          const py = innerY + ((seed * 29) % 100) / 100 * innerSize;
          ctx.beginPath();
          ctx.arc(px, py, size * 0.035 + (i % 2) * size * 0.012, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = withAlpha(palette.accentColor, 0.4);
        ctx.beginPath();
        ctx.moveTo(innerX, innerY + innerSize * 0.74);
        ctx.quadraticCurveTo(centerX, innerY + innerSize * 0.22, innerX + innerSize, innerY + innerSize * 0.66);
        ctx.stroke();
        break;
      case "ember":
        ctx.fillStyle = withAlpha(palette.patternColor, 0.78);
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.moveTo(innerX + innerSize * (0.2 + i * 0.23), innerY + innerSize * 0.86);
          ctx.quadraticCurveTo(innerX + innerSize * (0.3 + i * 0.22), innerY + innerSize * 0.25, innerX + innerSize * (0.38 + i * 0.2), innerY + innerSize * 0.7);
          ctx.quadraticCurveTo(innerX + innerSize * (0.32 + i * 0.2), innerY + innerSize * 0.76, innerX + innerSize * (0.2 + i * 0.23), innerY + innerSize * 0.86);
          ctx.fill();
        }
        break;
      case "circuit":
        ctx.strokeStyle = withAlpha(palette.patternColor, 0.85);
        ctx.lineWidth = Math.max(1, size * 0.05);
        ctx.beginPath();
        ctx.moveTo(innerX + innerSize * 0.2, centerY);
        ctx.lineTo(innerX + innerSize * 0.48, centerY);
        ctx.lineTo(innerX + innerSize * 0.48, innerY + innerSize * 0.24);
        ctx.lineTo(innerX + innerSize * 0.8, innerY + innerSize * 0.24);
        ctx.moveTo(innerX + innerSize * 0.52, centerY);
        ctx.lineTo(innerX + innerSize * 0.52, innerY + innerSize * 0.78);
        ctx.lineTo(innerX + innerSize * 0.82, innerY + innerSize * 0.78);
        ctx.stroke();
        ctx.fillStyle = withAlpha(palette.patternColor, 0.9);
        [
          [innerX + innerSize * 0.2, centerY],
          [innerX + innerSize * 0.8, innerY + innerSize * 0.24],
          [innerX + innerSize * 0.82, innerY + innerSize * 0.78]
        ].forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, size * 0.04, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      case "chevrons":
        ctx.strokeStyle = withAlpha(palette.patternColor, 0.85);
        ctx.lineWidth = Math.max(1, size * 0.06);
        for (let i = 0; i < 2; i += 1) {
          const oy = innerY + innerSize * (0.32 + i * 0.22);
          ctx.beginPath();
          ctx.moveTo(innerX + innerSize * 0.2, oy - innerSize * 0.08);
          ctx.lineTo(centerX, oy + innerSize * 0.06);
          ctx.lineTo(innerX + innerSize * 0.8, oy - innerSize * 0.08);
          ctx.stroke();
        }
        break;
      default:
        ctx.fillStyle = withAlpha(palette.patternColor, 0.12);
        ctx.fillRect(innerX, innerY, innerSize, innerSize);
        break;
    }

    ctx.restore();
  }

  function drawEyes(ctx, x, y, size, direction, eyeColor, pupilColor, extraGlow) {
    const dir = DIRS[direction] || DIRS.right;
    const sideX = -dir.y;
    const sideY = dir.x;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const forward = size * 0.18;
    const side = size * 0.18;
    const eyeRadius = size * 0.115;
    const pupilRadius = eyeRadius * 0.46;

    const eyes = [
      { x: cx + dir.x * forward + sideX * side, y: cy + dir.y * forward + sideY * side },
      { x: cx + dir.x * forward - sideX * side, y: cy + dir.y * forward - sideY * side }
    ];

    ctx.save();
    if (extraGlow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = extraGlow;
    }

    eyes.forEach((eye) => {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(eye.x + dir.x * eyeRadius * 0.35, eye.y + dir.y * eyeRadius * 0.35, pupilRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawSkinSegment(ctx, x, y, size, skin, isHead, segmentIndex, meta = {}) {
    const activeSkin = getSkinById(skin && skin.id ? skin.id : skin);
    const ts = meta.ts || 0;
    const palette = resolveDynamicPalette(activeSkin, ts, segmentIndex);
    const flashColor = meta.flashColor || null;
    const flashStrength = clamp(meta.flashStrength || 0, 0, 1);
    const outlineColor = meta.outlineColor || withAlpha("#02040a", 0.72);
    const shadowStrength = activeSkin.rarity === "Mythic" ? 18 : activeSkin.pattern === "pulse_glow" ? 14 : 8;

    drawSegmentBase(ctx, x, y, size, palette, shadowStrength, outlineColor);
    drawPattern(ctx, x, y, size, activeSkin, palette, segmentIndex, ts);

    if (flashColor && flashStrength > 0) {
      ctx.save();
      ctx.globalAlpha = 0.18 + flashStrength * 0.32;
      drawRoundedRectPath(ctx, x + 1, y + 1, size - 2, size - 2, Math.max(4, size * 0.25));
      ctx.fillStyle = flashColor;
      ctx.fill();
      ctx.restore();
    }

    if (isHead) {
      const eyeGlow = activeSkin.rarity === "Mythic" ? withAlpha(palette.patternColor, 0.8) : null;
      drawEyes(ctx, x, y, size, meta.direction || "right", "#ffffff", "#0b0d12", eyeGlow);
    }
  }

  function renderSkinPreview(canvas, skin, ts = performance.now()) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const activeSkin = getSkinById(skin && skin.id ? skin.id : skin);
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvas.width || 76;
    const height = canvas.clientHeight || canvas.height || 76;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const size = Math.min(width, height) * 0.26;
    const startX = width * 0.2;
    const y = height * 0.5 - size * 0.5;

    for (let i = 3; i >= 0; i -= 1) {
      drawSkinSegment(ctx, startX + i * size * 0.72, y + (i % 2 ? size * 0.08 : 0), size, activeSkin, i === 0, i, {
        direction: "right",
        ts
      });
    }
  }

  function buildThemePreviewStyle(theme) {
    const activeTheme = getThemeById(theme && theme.id ? theme.id : theme);
    const image = activeTheme.type === "image" && activeTheme.imageUrl ? `url(${activeTheme.imageUrl})` : activeTheme.styles.preview;
    return {
      background: image,
      borderColor: activeTheme.styles.borderColor,
      accent: activeTheme.styles.accent,
      gridColor: activeTheme.styles.gridColor
    };
  }

  global.SnakeCosmetics = {
    RARITY_META,
    SKIN_LIST,
    SKINS,
    THEME_LIST,
    THEMES,
    getSkinById,
    getThemeById,
    getSkinPerkTotals,
    describeModifiers,
    formatUnlockCondition,
    drawSkinSegment,
    renderSkinPreview,
    buildThemePreviewStyle
  };
})(window);
