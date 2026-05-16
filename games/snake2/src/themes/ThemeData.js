function buildSnakePalette(primary, mid, tail, glowHead, glowBody, beadA, beadB, beadC) {
  return {
    spineStart: primary,
    spineMid: mid,
    spineEnd: tail,
    shadowHead: glowHead,
    shadowBody: glowBody,
    beadA,
    beadB,
    beadC
  };
}

function buildFood(center, middle, edge, glow, sparkle) {
  return { center, middle, edge, glow, sparkle };
}

export const THEME_DATA = [
  {
    id: "neon_velocity",
    name: "Neon Velocity",
    rarity: "common",
    defaultUnlocked: true,
    lore: "Factory fresh neon frame built for high-flow runs.",
    unlock: { type: "starter", value: 0, text: "Starter theme" },
    visuals: {
      uiAccent: "#00e5ff",
      worldTop: "rgba(10, 35, 64, 0.95)",
      worldBottom: "rgba(2, 9, 19, 0.96)",
      hudText: "#d9f4ff",
      gridMinor: 0.07,
      gridMajor: 0.14,
      snakePalette: buildSnakePalette(
        "rgba(149,255,227,0.95)", "rgba(91,220,174,0.82)", "rgba(44,112,84,0.7)",
        "rgba(112,255,214,0.9)", "rgba(89,224,255,0.5)",
        "rgba(201,255,238,1)", "rgba(113,242,191,1)", "rgba(34,102,74,1)"
      ),
      trailColor: "rgba(102,234,205,0.34)",
      trailGlow: "rgba(88,222,255,0.85)",
      foodStyle: buildFood("rgba(255,247,179,1)", "rgba(255,126,175,0.98)", "rgba(119,24,69,0.95)", "rgba(255,130,193,0.85)", "rgba(255,239,197,0.8)"),
      particleColor: "rgba(124,255,220,1)",
      shopAmbient: "linear-gradient(145deg, rgba(10,28,54,0.9), rgba(4,10,24,0.94))"
    }
  },
  {
    id: "cosmic_void",
    name: "Cosmic Void",
    rarity: "rare",
    lore: "Nebula currents bend around every turn.",
    unlock: { type: "score", value: 120, text: "Reach score 120" },
    visuals: {
      uiAccent: "#8b5cf6",
      worldTop: "rgba(26, 18, 67, 0.96)",
      worldBottom: "rgba(5, 5, 20, 0.98)",
      hudText: "#efe3ff",
      gridMinor: 0.08,
      gridMajor: 0.15,
      snakePalette: buildSnakePalette(
        "rgba(208,180,255,0.96)", "rgba(152,123,255,0.86)", "rgba(72,42,150,0.72)",
        "rgba(199,168,255,0.9)", "rgba(142,109,255,0.6)",
        "rgba(245,230,255,1)", "rgba(180,140,255,1)", "rgba(73,50,155,1)"
      ),
      trailColor: "rgba(168,133,255,0.36)",
      trailGlow: "rgba(167,120,255,0.82)",
      foodStyle: buildFood("rgba(255,237,250,1)", "rgba(193,131,255,0.98)", "rgba(57,29,125,0.95)", "rgba(173,124,255,0.92)", "rgba(228,209,255,0.85)"),
      particleColor: "rgba(179,137,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(35,21,72,0.94), rgba(8,8,23,0.94))"
    }
  },
  {
    id: "royal_gold",
    name: "Royal Gold",
    rarity: "epic",
    lore: "Luxury plating for champions only.",
    unlock: { type: "completedStages", value: 6, text: "Complete 6 stages" },
    visuals: {
      uiAccent: "#ffcf57",
      worldTop: "rgba(48, 33, 10, 0.94)",
      worldBottom: "rgba(16, 12, 5, 0.98)",
      hudText: "#fff2cc",
      gridMinor: 0.06,
      gridMajor: 0.12,
      snakePalette: buildSnakePalette(
        "rgba(255,226,160,0.98)", "rgba(236,184,78,0.88)", "rgba(120,78,18,0.76)",
        "rgba(255,215,123,0.9)", "rgba(241,183,79,0.6)",
        "rgba(255,244,207,1)", "rgba(246,201,106,1)", "rgba(141,90,23,1)"
      ),
      trailColor: "rgba(245,193,95,0.35)",
      trailGlow: "rgba(255,207,87,0.86)",
      foodStyle: buildFood("rgba(255,252,221,1)", "rgba(255,211,108,0.98)", "rgba(124,76,19,0.95)", "rgba(255,210,99,0.9)", "rgba(255,238,170,0.85)"),
      particleColor: "rgba(255,215,116,1)",
      shopAmbient: "linear-gradient(145deg, rgba(53,37,12,0.94), rgba(18,12,5,0.94))"
    }
  },
  {
    id: "inferno_core",
    name: "Inferno Core",
    rarity: "rare",
    lore: "Molten pressure surges through every segment.",
    unlock: { type: "survival", value: 150, text: "Survive 150s total" },
    visuals: {
      uiAccent: "#ff7a45",
      worldTop: "rgba(66, 20, 8, 0.96)",
      worldBottom: "rgba(20, 6, 4, 0.98)",
      hudText: "#ffe0cc",
      gridMinor: 0.07,
      gridMajor: 0.14,
      snakePalette: buildSnakePalette(
        "rgba(255,188,120,0.95)", "rgba(255,108,54,0.85)", "rgba(122,33,15,0.74)",
        "rgba(255,138,77,0.92)", "rgba(255,95,44,0.55)",
        "rgba(255,229,193,1)", "rgba(255,140,74,1)", "rgba(128,36,20,1)"
      ),
      trailColor: "rgba(255,132,68,0.35)",
      trailGlow: "rgba(255,110,64,0.84)",
      foodStyle: buildFood("rgba(255,236,188,1)", "rgba(255,129,80,0.98)", "rgba(133,33,23,0.95)", "rgba(255,117,70,0.9)", "rgba(255,220,160,0.84)"),
      particleColor: "rgba(255,134,83,1)",
      shopAmbient: "linear-gradient(145deg, rgba(68,22,9,0.95), rgba(20,6,4,0.94))"
    }
  },
  {
    id: "frozen_pulse",
    name: "Frozen Pulse",
    rarity: "rare",
    lore: "Cryo circuits with precision drift.",
    unlock: { type: "score", value: 180, text: "Reach score 180" },
    visuals: {
      uiAccent: "#6be6ff",
      worldTop: "rgba(11, 35, 55, 0.96)",
      worldBottom: "rgba(3, 12, 22, 0.98)",
      hudText: "#e7f9ff",
      gridMinor: 0.08,
      gridMajor: 0.15,
      snakePalette: buildSnakePalette(
        "rgba(191,246,255,0.96)", "rgba(116,215,255,0.86)", "rgba(33,94,143,0.74)",
        "rgba(155,230,255,0.9)", "rgba(94,200,255,0.58)",
        "rgba(236,252,255,1)", "rgba(147,229,255,1)", "rgba(47,106,158,1)"
      ),
      trailColor: "rgba(144,226,255,0.35)",
      trailGlow: "rgba(106,218,255,0.84)",
      foodStyle: buildFood("rgba(248,255,255,1)", "rgba(145,230,255,0.98)", "rgba(38,102,155,0.95)", "rgba(130,224,255,0.92)", "rgba(220,248,255,0.84)"),
      particleColor: "rgba(144,230,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(12,36,58,0.95), rgba(4,14,25,0.95))"
    }
  },
  {
    id: "toxic_reactor",
    name: "Toxic Reactor",
    rarity: "epic",
    lore: "Radioactive pulses force risky high-speed lines.",
    unlock: { type: "combo", value: 5, text: "Hit combo x5" },
    visuals: {
      uiAccent: "#6dff56",
      worldTop: "rgba(20, 48, 14, 0.96)",
      worldBottom: "rgba(5, 15, 5, 0.98)",
      hudText: "#e6ffde",
      gridMinor: 0.08,
      gridMajor: 0.16,
      snakePalette: buildSnakePalette(
        "rgba(204,255,166,0.96)", "rgba(134,246,84,0.86)", "rgba(45,120,27,0.74)",
        "rgba(165,255,98,0.9)", "rgba(110,220,67,0.56)",
        "rgba(240,255,224,1)", "rgba(154,248,102,1)", "rgba(50,123,28,1)"
      ),
      trailColor: "rgba(138,245,89,0.35)",
      trailGlow: "rgba(118,231,76,0.84)",
      foodStyle: buildFood("rgba(247,255,226,1)", "rgba(154,243,93,0.98)", "rgba(54,122,31,0.95)", "rgba(144,241,91,0.92)", "rgba(223,255,190,0.84)"),
      particleColor: "rgba(152,245,97,1)",
      shopAmbient: "linear-gradient(145deg, rgba(18,45,13,0.95), rgba(6,17,6,0.95))"
    }
  },
  {
    id: "shadow_phantom",
    name: "Shadow Phantom",
    rarity: "legendary",
    lore: "Stealth-grade shell that vanishes into darkness.",
    unlock: { type: "duelWins", value: 8, text: "Win 8 duel matches" },
    visuals: {
      uiAccent: "#7a7f9a",
      worldTop: "rgba(13, 14, 22, 0.97)",
      worldBottom: "rgba(3, 4, 8, 0.99)",
      hudText: "#e6ebff",
      gridMinor: 0.05,
      gridMajor: 0.1,
      snakePalette: buildSnakePalette(
        "rgba(210,217,240,0.9)", "rgba(96,103,131,0.85)", "rgba(28,31,46,0.82)",
        "rgba(173,183,230,0.7)", "rgba(92,101,140,0.46)",
        "rgba(238,243,255,1)", "rgba(130,138,176,1)", "rgba(31,34,49,1)"
      ),
      trailColor: "rgba(126,137,180,0.3)",
      trailGlow: "rgba(88,100,153,0.76)",
      foodStyle: buildFood("rgba(240,245,255,1)", "rgba(146,157,204,0.98)", "rgba(47,53,83,0.95)", "rgba(133,145,196,0.84)", "rgba(220,227,255,0.75)"),
      particleColor: "rgba(136,147,198,1)",
      shopAmbient: "linear-gradient(145deg, rgba(13,14,22,0.96), rgba(5,6,12,0.98))"
    }
  },
  {
    id: "prism_energy",
    name: "Prism Energy",
    rarity: "legendary",
    lore: "Fractured light engine cycling spectrum bursts.",
    unlock: { type: "score", value: 260, text: "Reach score 260" },
    visuals: {
      uiAccent: "#ff6de5",
      worldTop: "rgba(21, 18, 44, 0.96)",
      worldBottom: "rgba(7, 7, 22, 0.98)",
      hudText: "#ffeaff",
      gridMinor: 0.085,
      gridMajor: 0.17,
      snakePalette: buildSnakePalette(
        "rgba(255,209,233,0.95)", "rgba(255,127,219,0.86)", "rgba(120,39,100,0.75)",
        "rgba(255,172,232,0.92)", "rgba(180,92,230,0.58)",
        "rgba(255,236,248,1)", "rgba(255,156,226,1)", "rgba(123,45,109,1)"
      ),
      trailColor: "rgba(246,138,227,0.34)",
      trailGlow: "rgba(190,116,255,0.82)",
      foodStyle: buildFood("rgba(255,243,255,1)", "rgba(255,152,230,0.98)", "rgba(92,41,130,0.95)", "rgba(255,142,224,0.9)", "rgba(237,196,255,0.84)"),
      particleColor: "rgba(255,146,228,1)",
      shopAmbient: "linear-gradient(145deg, rgba(28,20,54,0.95), rgba(10,9,26,0.95))"
    }
  },
  {
    id: "cyber_brain",
    name: "Cyber Brain",
    rarity: "epic",
    lore: "Holographic cognition mesh tuned for duel predictions.",
    unlock: { type: "aiLevel", value: 12, text: "Reach AI Level 12" },
    visuals: {
      uiAccent: "#59e3ff",
      worldTop: "rgba(12, 33, 50, 0.96)",
      worldBottom: "rgba(3, 12, 20, 0.98)",
      hudText: "#e6f8ff",
      gridMinor: 0.08,
      gridMajor: 0.16,
      snakePalette: buildSnakePalette(
        "rgba(208,248,255,0.96)", "rgba(97,216,248,0.86)", "rgba(35,95,128,0.74)",
        "rgba(133,230,255,0.9)", "rgba(91,185,255,0.56)",
        "rgba(234,252,255,1)", "rgba(130,228,255,1)", "rgba(44,103,139,1)"
      ),
      trailColor: "rgba(114,221,255,0.34)",
      trailGlow: "rgba(89,211,255,0.84)",
      foodStyle: buildFood("rgba(247,254,255,1)", "rgba(124,225,255,0.98)", "rgba(38,97,137,0.95)", "rgba(111,215,255,0.92)", "rgba(212,247,255,0.84)"),
      particleColor: "rgba(111,221,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(10,34,54,0.95), rgba(5,14,24,0.95))"
    }
  },
  {
    id: "crimson_fury",
    name: "Crimson Fury",
    rarity: "epic",
    lore: "Aggression protocol unlocked. No hesitation.",
    unlock: { type: "duelWins", value: 12, text: "Win 12 duel matches" },
    visuals: {
      uiAccent: "#ff4f66",
      worldTop: "rgba(55, 14, 22, 0.96)",
      worldBottom: "rgba(15, 4, 8, 0.98)",
      hudText: "#ffe3e8",
      gridMinor: 0.07,
      gridMajor: 0.14,
      snakePalette: buildSnakePalette(
        "rgba(255,184,196,0.96)", "rgba(255,95,119,0.86)", "rgba(126,26,45,0.74)",
        "rgba(255,141,167,0.92)", "rgba(255,81,122,0.58)",
        "rgba(255,230,236,1)", "rgba(255,132,151,1)", "rgba(133,35,52,1)"
      ),
      trailColor: "rgba(255,109,138,0.34)",
      trailGlow: "rgba(255,94,125,0.84)",
      foodStyle: buildFood("rgba(255,241,244,1)", "rgba(255,124,148,0.98)", "rgba(131,35,60,0.95)", "rgba(255,112,139,0.92)", "rgba(255,203,214,0.82)"),
      particleColor: "rgba(255,122,148,1)",
      shopAmbient: "linear-gradient(145deg, rgba(56,14,22,0.95), rgba(16,5,9,0.95))"
    }
  },
  {
    id: "aurora_drift",
    name: "Aurora Drift",
    rarity: "rare",
    lore: "Polar skies painted over kinetic arcs.",
    unlock: { type: "survival", value: 210, text: "Survive 210s total" },
    visuals: {
      uiAccent: "#70ffc8",
      worldTop: "rgba(10, 36, 39, 0.95)",
      worldBottom: "rgba(4, 11, 18, 0.98)",
      hudText: "#defef4",
      gridMinor: 0.08,
      gridMajor: 0.15,
      snakePalette: buildSnakePalette(
        "rgba(202,255,240,0.96)", "rgba(104,249,202,0.86)", "rgba(32,116,90,0.74)",
        "rgba(147,255,217,0.9)", "rgba(93,229,187,0.56)",
        "rgba(236,255,248,1)", "rgba(134,255,216,1)", "rgba(36,118,96,1)"
      ),
      trailColor: "rgba(124,244,205,0.35)",
      trailGlow: "rgba(100,238,198,0.82)",
      foodStyle: buildFood("rgba(245,255,251,1)", "rgba(121,252,210,0.98)", "rgba(39,118,97,0.95)", "rgba(109,243,202,0.92)", "rgba(217,255,241,0.84)"),
      particleColor: "rgba(126,250,212,1)",
      shopAmbient: "linear-gradient(145deg, rgba(9,35,38,0.95), rgba(4,12,18,0.95))"
    }
  },
  {
    id: "storm_circuit",
    name: "Storm Circuit",
    rarity: "rare",
    lore: "Charged arcs and rainline reflections.",
    unlock: { type: "score", value: 220, text: "Reach score 220" },
    visuals: {
      uiAccent: "#6da9ff",
      worldTop: "rgba(16, 29, 62, 0.96)",
      worldBottom: "rgba(6, 10, 25, 0.98)",
      hudText: "#e4edff",
      gridMinor: 0.08,
      gridMajor: 0.16,
      snakePalette: buildSnakePalette(
        "rgba(196,220,255,0.96)", "rgba(112,161,255,0.86)", "rgba(40,69,136,0.74)",
        "rgba(145,188,255,0.9)", "rgba(92,140,232,0.58)",
        "rgba(232,240,255,1)", "rgba(135,178,255,1)", "rgba(44,73,141,1)"
      ),
      trailColor: "rgba(122,170,255,0.35)",
      trailGlow: "rgba(109,158,255,0.84)",
      foodStyle: buildFood("rgba(246,249,255,1)", "rgba(133,178,255,0.98)", "rgba(45,72,144,0.95)", "rgba(124,171,255,0.92)", "rgba(218,231,255,0.84)"),
      particleColor: "rgba(127,174,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(15,30,63,0.95), rgba(6,10,24,0.96))"
    }
  },
  {
    id: "lunar_silk",
    name: "Lunar Silk",
    rarity: "common",
    lore: "Soft moonlight weave for calm precision.",
    unlock: { type: "score", value: 80, text: "Reach score 80" },
    visuals: {
      uiAccent: "#b8c1ff",
      worldTop: "rgba(20, 24, 46, 0.96)",
      worldBottom: "rgba(7, 9, 20, 0.98)",
      hudText: "#edf0ff",
      gridMinor: 0.07,
      gridMajor: 0.14,
      snakePalette: buildSnakePalette(
        "rgba(232,236,255,0.96)", "rgba(183,192,255,0.86)", "rgba(68,74,133,0.74)",
        "rgba(214,220,255,0.9)", "rgba(152,165,241,0.56)",
        "rgba(246,248,255,1)", "rgba(199,206,255,1)", "rgba(72,79,138,1)"
      ),
      trailColor: "rgba(188,197,255,0.34)",
      trailGlow: "rgba(164,176,250,0.82)",
      foodStyle: buildFood("rgba(250,251,255,1)", "rgba(194,202,255,0.98)", "rgba(72,78,140,0.95)", "rgba(181,190,255,0.92)", "rgba(232,235,255,0.84)"),
      particleColor: "rgba(188,196,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(20,24,46,0.95), rgba(8,9,20,0.96))"
    }
  },
  {
    id: "mint_glacier",
    name: "Mint Glacier",
    rarity: "common",
    lore: "Clean mint frost with sharp visibility.",
    unlock: { type: "starter", value: 0, text: "Starter rotation" },
    defaultUnlocked: true,
    visuals: {
      uiAccent: "#8fffe1",
      worldTop: "rgba(10, 32, 34, 0.95)",
      worldBottom: "rgba(4, 11, 14, 0.98)",
      hudText: "#e7fff8",
      gridMinor: 0.07,
      gridMajor: 0.14,
      snakePalette: buildSnakePalette(
        "rgba(213,255,245,0.96)", "rgba(129,248,218,0.86)", "rgba(42,117,95,0.74)",
        "rgba(168,255,229,0.9)", "rgba(104,226,198,0.56)",
        "rgba(241,255,251,1)", "rgba(154,253,226,1)", "rgba(48,120,98,1)"
      ),
      trailColor: "rgba(139,248,220,0.34)",
      trailGlow: "rgba(117,241,211,0.82)",
      foodStyle: buildFood("rgba(247,255,252,1)", "rgba(144,250,222,0.98)", "rgba(43,118,96,0.95)", "rgba(125,240,211,0.92)", "rgba(220,255,244,0.84)"),
      particleColor: "rgba(145,248,221,1)",
      shopAmbient: "linear-gradient(145deg, rgba(9,33,34,0.95), rgba(4,12,14,0.96))"
    }
  },
  {
    id: "sunset_arc",
    name: "Sunset Arc",
    rarity: "common",
    lore: "Late light spectrum for relaxed sessions.",
    unlock: { type: "score", value: 60, text: "Reach score 60" },
    visuals: {
      uiAccent: "#ff9b7d",
      worldTop: "rgba(49, 24, 24, 0.95)",
      worldBottom: "rgba(16, 8, 11, 0.98)",
      hudText: "#ffe8df",
      gridMinor: 0.07,
      gridMajor: 0.13,
      snakePalette: buildSnakePalette(
        "rgba(255,222,202,0.96)", "rgba(255,163,123,0.86)", "rgba(133,61,37,0.74)",
        "rgba(255,190,156,0.9)", "rgba(238,132,92,0.56)",
        "rgba(255,241,228,1)", "rgba(255,182,145,1)", "rgba(137,65,41,1)"
      ),
      trailColor: "rgba(255,171,133,0.34)",
      trailGlow: "rgba(243,149,111,0.82)",
      foodStyle: buildFood("rgba(255,247,239,1)", "rgba(255,174,138,0.98)", "rgba(136,66,42,0.95)", "rgba(250,160,121,0.92)", "rgba(255,221,202,0.84)"),
      particleColor: "rgba(255,172,137,1)",
      shopAmbient: "linear-gradient(145deg, rgba(50,24,24,0.95), rgba(17,8,11,0.96))"
    }
  },
  {
    id: "void_revenant",
    name: "Void Revenant",
    rarity: "mythic",
    lore: "Fragments of broken arenas stitched into armor.",
    unlock: { type: "completedStages", value: 24, text: "Complete 24 stages" },
    visuals: {
      uiAccent: "#ff6be3",
      worldTop: "rgba(25, 8, 40, 0.97)",
      worldBottom: "rgba(6, 3, 12, 0.99)",
      hudText: "#ffe8ff",
      gridMinor: 0.09,
      gridMajor: 0.18,
      snakePalette: buildSnakePalette(
        "rgba(255,202,246,0.96)", "rgba(245,109,224,0.88)", "rgba(97,24,96,0.78)",
        "rgba(255,154,236,0.94)", "rgba(210,91,255,0.62)",
        "rgba(255,232,251,1)", "rgba(252,134,229,1)", "rgba(104,27,102,1)"
      ),
      trailColor: "rgba(245,120,225,0.36)",
      trailGlow: "rgba(210,94,255,0.88)",
      foodStyle: buildFood("rgba(255,243,255,1)", "rgba(248,130,234,0.98)", "rgba(92,27,122,0.95)", "rgba(244,114,227,0.94)", "rgba(239,188,255,0.86)"),
      particleColor: "rgba(247,136,232,1)",
      shopAmbient: "linear-gradient(145deg, rgba(27,9,43,0.97), rgba(8,3,14,0.99))"
    }
  },
  {
    id: "dragon_fire",
    name: "Dragon Fire",
    rarity: "mythic",
    lore: "Ancient reactor core with heavy infernal wake.",
    unlock: { type: "combo", value: 9, text: "Hit combo x9" },
    visuals: {
      uiAccent: "#ff7d36",
      worldTop: "rgba(64, 14, 6, 0.97)",
      worldBottom: "rgba(21, 5, 4, 0.99)",
      hudText: "#ffe7d8",
      gridMinor: 0.08,
      gridMajor: 0.16,
      snakePalette: buildSnakePalette(
        "rgba(255,214,152,0.97)", "rgba(255,122,56,0.9)", "rgba(126,32,14,0.8)",
        "rgba(255,148,81,0.95)", "rgba(255,93,41,0.66)",
        "rgba(255,235,201,1)", "rgba(255,145,78,1)", "rgba(136,35,16,1)"
      ),
      trailColor: "rgba(255,135,71,0.36)",
      trailGlow: "rgba(255,106,58,0.9)",
      foodStyle: buildFood("rgba(255,243,219,1)", "rgba(255,143,84,0.98)", "rgba(128,36,16,0.96)", "rgba(255,125,69,0.96)", "rgba(255,214,159,0.86)"),
      particleColor: "rgba(255,142,84,1)",
      shopAmbient: "linear-gradient(145deg, rgba(67,15,7,0.97), rgba(24,6,4,0.99))"
    }
  },
  {
    id: "celestial_choir",
    name: "Celestial Choir",
    rarity: "mythic",
    lore: "Harmony fields ripple with every survival streak.",
    unlock: { type: "survival", value: 360, text: "Survive 360s total" },
    visuals: {
      uiAccent: "#9fbaff",
      worldTop: "rgba(17, 25, 56, 0.97)",
      worldBottom: "rgba(5, 8, 24, 0.99)",
      hudText: "#eaf0ff",
      gridMinor: 0.09,
      gridMajor: 0.17,
      snakePalette: buildSnakePalette(
        "rgba(226,234,255,0.97)", "rgba(154,178,255,0.89)", "rgba(58,74,153,0.78)",
        "rgba(192,208,255,0.94)", "rgba(128,153,246,0.64)",
        "rgba(246,249,255,1)", "rgba(180,199,255,1)", "rgba(62,79,159,1)"
      ),
      trailColor: "rgba(166,188,255,0.36)",
      trailGlow: "rgba(136,164,255,0.88)",
      foodStyle: buildFood("rgba(249,251,255,1)", "rgba(179,198,255,0.99)", "rgba(63,81,160,0.96)", "rgba(170,190,255,0.95)", "rgba(220,230,255,0.86)"),
      particleColor: "rgba(179,199,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(18,27,58,0.97), rgba(6,9,26,0.99))"
    }
  },
  {
    id: "hyper_pop",
    name: "Hyper Pop",
    rarity: "epic",
    lore: "Arcade synthwave burst tuned for speed mode.",
    unlock: { type: "score", value: 300, text: "Reach score 300" },
    visuals: {
      uiAccent: "#ff66c4",
      worldTop: "rgba(33, 14, 46, 0.96)",
      worldBottom: "rgba(10, 6, 24, 0.98)",
      hudText: "#ffe7f7",
      gridMinor: 0.09,
      gridMajor: 0.18,
      snakePalette: buildSnakePalette(
        "rgba(255,210,239,0.96)", "rgba(255,114,203,0.88)", "rgba(127,36,106,0.76)",
        "rgba(255,157,220,0.93)", "rgba(212,94,240,0.6)",
        "rgba(255,235,249,1)", "rgba(255,140,216,1)", "rgba(131,42,111,1)"
      ),
      trailColor: "rgba(247,124,211,0.36)",
      trailGlow: "rgba(214,100,255,0.88)",
      foodStyle: buildFood("rgba(255,245,252,1)", "rgba(255,138,219,0.98)", "rgba(103,35,133,0.95)", "rgba(247,124,208,0.94)", "rgba(237,195,255,0.86)"),
      particleColor: "rgba(250,136,219,1)",
      shopAmbient: "linear-gradient(145deg, rgba(34,14,48,0.96), rgba(11,6,26,0.98))"
    }
  },
  {
    id: "deep_ocean",
    name: "Deep Ocean",
    rarity: "rare",
    lore: "Pressure-blue currents with stealth calm.",
    unlock: { type: "duelWins", value: 4, text: "Win 4 duel matches" },
    visuals: {
      uiAccent: "#4db7ff",
      worldTop: "rgba(8, 29, 52, 0.96)",
      worldBottom: "rgba(3, 9, 20, 0.98)",
      hudText: "#ddf0ff",
      gridMinor: 0.075,
      gridMajor: 0.145,
      snakePalette: buildSnakePalette(
        "rgba(198,234,255,0.96)", "rgba(94,184,255,0.86)", "rgba(35,86,136,0.75)",
        "rgba(127,210,255,0.9)", "rgba(81,160,240,0.57)",
        "rgba(231,247,255,1)", "rgba(126,207,255,1)", "rgba(42,92,141,1)"
      ),
      trailColor: "rgba(105,194,255,0.34)",
      trailGlow: "rgba(84,171,248,0.82)",
      foodStyle: buildFood("rgba(245,252,255,1)", "rgba(120,208,255,0.98)", "rgba(39,89,140,0.95)", "rgba(109,198,255,0.92)", "rgba(214,240,255,0.84)"),
      particleColor: "rgba(118,205,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(8,30,54,0.95), rgba(4,10,22,0.96))"
    }
  },
  {
    id: "wasteland_rust",
    name: "Wasteland Rust",
    rarity: "rare",
    lore: "Scarred metal from old competitive arenas.",
    unlock: { type: "completedStages", value: 12, text: "Complete 12 stages" },
    visuals: {
      uiAccent: "#d68f62",
      worldTop: "rgba(45, 25, 17, 0.96)",
      worldBottom: "rgba(15, 8, 6, 0.98)",
      hudText: "#f6e4d8",
      gridMinor: 0.07,
      gridMajor: 0.14,
      snakePalette: buildSnakePalette(
        "rgba(237,206,184,0.96)", "rgba(207,134,90,0.86)", "rgba(105,59,37,0.75)",
        "rgba(221,164,128,0.9)", "rgba(186,116,79,0.56)",
        "rgba(247,230,216,1)", "rgba(219,151,112,1)", "rgba(112,66,41,1)"
      ),
      trailColor: "rgba(210,146,108,0.34)",
      trailGlow: "rgba(194,126,88,0.82)",
      foodStyle: buildFood("rgba(255,244,232,1)", "rgba(221,157,117,0.98)", "rgba(111,66,42,0.95)", "rgba(212,145,105,0.92)", "rgba(242,212,187,0.84)"),
      particleColor: "rgba(220,153,114,1)",
      shopAmbient: "linear-gradient(145deg, rgba(47,26,18,0.95), rgba(16,8,6,0.96))"
    }
  },
  {
    id: "bio_mech",
    name: "Bio Mech",
    rarity: "legendary",
    lore: "Organic machine core that adapts in combat.",
    unlock: { type: "aiLevel", value: 18, text: "Reach AI Level 18" },
    visuals: {
      uiAccent: "#70ff8d",
      worldTop: "rgba(12, 38, 23, 0.96)",
      worldBottom: "rgba(4, 14, 9, 0.98)",
      hudText: "#e7ffeb",
      gridMinor: 0.09,
      gridMajor: 0.17,
      snakePalette: buildSnakePalette(
        "rgba(214,255,201,0.96)", "rgba(122,247,112,0.88)", "rgba(39,116,38,0.78)",
        "rgba(161,255,138,0.94)", "rgba(96,218,98,0.62)",
        "rgba(240,255,230,1)", "rgba(146,249,132,1)", "rgba(45,121,44,1)"
      ),
      trailColor: "rgba(130,245,121,0.36)",
      trailGlow: "rgba(98,232,104,0.88)",
      foodStyle: buildFood("rgba(246,255,238,1)", "rgba(145,250,131,0.98)", "rgba(45,121,44,0.95)", "rgba(133,240,121,0.93)", "rgba(220,255,207,0.85)"),
      particleColor: "rgba(145,247,132,1)",
      shopAmbient: "linear-gradient(145deg, rgba(12,39,24,0.96), rgba(5,15,10,0.98))"
    }
  },
  {
    id: "sakura_wisp",
    name: "Sakura Wisp",
    rarity: "epic",
    lore: "Petal-light drift with balanced flow.",
    unlock: { type: "score", value: 340, text: "Reach score 340" },
    visuals: {
      uiAccent: "#ff9ecb",
      worldTop: "rgba(44, 20, 36, 0.96)",
      worldBottom: "rgba(14, 8, 16, 0.98)",
      hudText: "#ffeaf4",
      gridMinor: 0.08,
      gridMajor: 0.16,
      snakePalette: buildSnakePalette(
        "rgba(255,218,235,0.96)", "rgba(255,145,194,0.87)", "rgba(128,53,95,0.76)",
        "rgba(255,183,219,0.93)", "rgba(225,109,171,0.6)",
        "rgba(255,239,247,1)", "rgba(255,170,211,1)", "rgba(133,60,101,1)"
      ),
      trailColor: "rgba(247,155,204,0.35)",
      trailGlow: "rgba(231,130,186,0.86)",
      foodStyle: buildFood("rgba(255,247,252,1)", "rgba(255,166,211,0.98)", "rgba(132,59,101,0.95)", "rgba(246,148,197,0.93)", "rgba(255,220,239,0.85)"),
      particleColor: "rgba(252,167,213,1)",
      shopAmbient: "linear-gradient(145deg, rgba(46,21,38,0.96), rgba(15,8,17,0.98))"
    }
  },
  {
    id: "chrome_overdrive",
    name: "Chrome Overdrive",
    rarity: "legendary",
    lore: "Mirror chassis designed for speed champions.",
    unlock: { type: "speedRuns", value: 14, text: "Play 14 speed matches" },
    visuals: {
      uiAccent: "#b8d8ff",
      worldTop: "rgba(23, 29, 40, 0.96)",
      worldBottom: "rgba(8, 10, 16, 0.98)",
      hudText: "#ebf4ff",
      gridMinor: 0.08,
      gridMajor: 0.16,
      snakePalette: buildSnakePalette(
        "rgba(233,240,255,0.96)", "rgba(154,181,218,0.87)", "rgba(72,87,109,0.76)",
        "rgba(198,220,247,0.93)", "rgba(133,157,192,0.6)",
        "rgba(248,251,255,1)", "rgba(179,206,239,1)", "rgba(77,94,116,1)"
      ),
      trailColor: "rgba(167,194,226,0.35)",
      trailGlow: "rgba(141,168,200,0.86)",
      foodStyle: buildFood("rgba(251,253,255,1)", "rgba(187,211,241,0.98)", "rgba(77,94,116,0.95)", "rgba(174,199,232,0.93)", "rgba(227,237,250,0.85)"),
      particleColor: "rgba(185,210,242,1)",
      shopAmbient: "linear-gradient(145deg, rgba(24,30,42,0.96), rgba(8,11,17,0.98))"
    }
  },
  {
    id: "mythic_prism",
    name: "Mythic Prism",
    rarity: "ultimate",
    lore: "Collection-complete construct with shifting crystal core.",
    unlock: { type: "collection", value: 85, text: "Unlock 85% of themes" },
    visuals: {
      uiAccent: "#ff5cc9",
      worldTop: "rgba(34, 15, 54, 0.97)",
      worldBottom: "rgba(9, 6, 24, 0.99)",
      hudText: "#ffe6ff",
      gridMinor: 0.1,
      gridMajor: 0.2,
      snakePalette: buildSnakePalette(
        "rgba(255,218,250,0.98)", "rgba(255,116,222,0.9)", "rgba(99,36,131,0.8)",
        "rgba(255,168,236,0.96)", "rgba(209,96,255,0.68)",
        "rgba(255,238,252,1)", "rgba(255,146,229,1)", "rgba(106,43,140,1)"
      ),
      trailColor: "rgba(249,133,226,0.38)",
      trailGlow: "rgba(208,96,255,0.92)",
      foodStyle: buildFood("rgba(255,245,255,1)", "rgba(255,150,233,0.99)", "rgba(106,40,140,0.96)", "rgba(246,132,226,0.96)", "rgba(240,198,255,0.88)"),
      particleColor: "rgba(250,142,229,1)",
      shopAmbient: "linear-gradient(145deg, rgba(35,15,56,0.97), rgba(10,6,26,0.99))"
    }
  },
  {
    id: "apex_core",
    name: "Apex Core",
    rarity: "ultimate",
    lore: "Highest mastery insignia for elite duel pilots.",
    unlock: { type: "aiLevel", value: 24, text: "Reach AI Level 24" },
    visuals: {
      uiAccent: "#ff4f66",
      worldTop: "rgba(42, 10, 20, 0.97)",
      worldBottom: "rgba(11, 4, 9, 0.99)",
      hudText: "#ffe7ec",
      gridMinor: 0.1,
      gridMajor: 0.2,
      snakePalette: buildSnakePalette(
        "rgba(255,198,212,0.98)", "rgba(255,88,117,0.9)", "rgba(102,21,41,0.8)",
        "rgba(255,142,167,0.96)", "rgba(236,80,112,0.68)",
        "rgba(255,232,239,1)", "rgba(255,121,148,1)", "rgba(112,27,48,1)"
      ),
      trailColor: "rgba(255,113,144,0.38)",
      trailGlow: "rgba(238,82,116,0.92)",
      foodStyle: buildFood("rgba(255,246,248,1)", "rgba(255,129,156,0.99)", "rgba(111,27,49,0.96)", "rgba(247,110,141,0.96)", "rgba(255,205,217,0.88)"),
      particleColor: "rgba(255,122,149,1)",
      shopAmbient: "linear-gradient(145deg, rgba(44,10,21,0.97), rgba(13,4,10,0.99))"
    }
  },
  {
    id: "oblivion_signal",
    name: "Oblivion Signal",
    rarity: "ultimate",
    lore: "Secret broadcast only decoded by relentless players.",
    unlock: { type: "secret", value: 1, text: "Secret unlock challenge" },
    visuals: {
      uiAccent: "#8f86ff",
      worldTop: "rgba(16, 14, 38, 0.98)",
      worldBottom: "rgba(4, 4, 12, 0.99)",
      hudText: "#e9e7ff",
      gridMinor: 0.1,
      gridMajor: 0.2,
      snakePalette: buildSnakePalette(
        "rgba(221,216,255,0.98)", "rgba(149,134,255,0.9)", "rgba(58,45,134,0.8)",
        "rgba(187,176,255,0.96)", "rgba(126,112,235,0.68)",
        "rgba(244,241,255,1)", "rgba(171,158,255,1)", "rgba(65,52,141,1)"
      ),
      trailColor: "rgba(152,141,255,0.38)",
      trailGlow: "rgba(130,118,239,0.92)",
      foodStyle: buildFood("rgba(250,249,255,1)", "rgba(174,163,255,0.99)", "rgba(67,54,141,0.96)", "rgba(162,150,250,0.96)", "rgba(216,209,255,0.88)"),
      particleColor: "rgba(171,160,255,1)",
      shopAmbient: "linear-gradient(145deg, rgba(16,14,40,0.98), rgba(4,4,13,0.99))"
    }
  }
];

export function getThemeById(themeId) {
  return THEME_DATA.find((theme) => theme.id === themeId) || THEME_DATA[0];
}