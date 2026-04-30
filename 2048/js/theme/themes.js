export const THEME_STORAGE_KEY = "gamehub_2048_active_theme_v2";
export const THEME_UNLOCK_STORAGE_KEY = "gamehub_2048_unlocked_themes_v2";
export const THEME_PROGRESS_STORAGE_KEY = "gamehub_2048_theme_progress_v2";

export const DEFAULT_THEME_ID = "glass-premium";

function createTheme({
  id,
  name,
  tagline,
  description,
  unlock,
  colors,
  animationProfile,
  effectIntensity,
  soundProfile,
  specialEffects,
  palette,
  preview
}) {
  return {
    id,
    name,
    tagline,
    description,
    unlock,
    colors: {
      bg1: colors.bg1,
      bg2: colors.bg2,
      bg3: colors.bg3,
      textMain: colors.textMain || "#f3f6ff",
      textSoft: colors.textSoft || "#aab5cc",
      panelTop: colors.panelTop,
      panelBottom: colors.panelBottom,
      boardCellTop: colors.boardCellTop,
      boardCellBottom: colors.boardCellBottom
    },
    animationProfile: {
      speed: animationProfile.speed,
      scale: animationProfile.scale,
      easing: animationProfile.easing
    },
    effectIntensity: {
      level: effectIntensity.level,
      multiplier: effectIntensity.multiplier
    },
    soundProfile: {
      type: soundProfile.type,
      shotWave: soundProfile.shotWave,
      mergeWave: soundProfile.mergeWave,
      blockedWave: soundProfile.blockedWave,
      pitchMultiplier: soundProfile.pitchMultiplier,
      volumeMultiplier: soundProfile.volumeMultiplier
    },
    specialEffects: {
      glow: Boolean(specialEffects.glow),
      trail: Boolean(specialEffects.trail),
      explosion: Boolean(specialEffects.explosion)
    },
    palette: {
      hueShift: palette.hueShift,
      tileHueShift: palette.tileHueShift,
      saturationBoost: palette.saturationBoost,
      glowBoost: palette.glowBoost
    },
    preview
  };
}

const RAW_THEME_DEFINITIONS = [
  createTheme({
    id: "glass-premium",
    name: "Glass Premium",
    tagline: "Polished clarity, elite balance.",
    description: "Glossy panels, clean light bloom, and smooth premium pacing.",
    unlock: { type: "default", label: "Available from start" },
    colors: {
      bg1: "#04060b",
      bg2: "#0a0f1a",
      bg3: "#131c2c",
      panelTop: "rgba(30, 40, 63, 0.96)",
      panelBottom: "rgba(18, 24, 38, 0.96)",
      boardCellTop: "#151c2d",
      boardCellBottom: "#090c14"
    },
    animationProfile: { speed: 1, scale: 1, easing: "cubic-bezier(0.2, 0.9, 0.2, 1)" },
    effectIntensity: { level: "medium", multiplier: 1 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "sine", blockedWave: "square", pitchMultiplier: 1, volumeMultiplier: 0.9 },
    specialEffects: { glow: true, trail: false, explosion: false },
    palette: { hueShift: 0, tileHueShift: 0, saturationBoost: 0, glowBoost: 1 },
    preview: [2, 8, 32, 128]
  }),
  createTheme({
    id: "neon-energy",
    name: "Neon Energy",
    tagline: "Arcade voltage and sharp adrenaline.",
    description: "Electric glow trails, faster pulse merges, and high-impact feedback.",
    unlock: { type: "max_tile", target: 1024, label: "Reach tile 1024" },
    colors: {
      bg1: "#030915",
      bg2: "#091631",
      bg3: "#112348",
      textMain: "#eff8ff",
      textSoft: "#9ec4e2",
      panelTop: "rgba(20, 40, 78, 0.96)",
      panelBottom: "rgba(8, 20, 46, 0.96)",
      boardCellTop: "#0c1d3d",
      boardCellBottom: "#060f25"
    },
    animationProfile: { speed: 0.82, scale: 1.18, easing: "cubic-bezier(0.14, 0.95, 0.25, 1)" },
    effectIntensity: { level: "high", multiplier: 1.35 },
    soundProfile: { type: "electronic", shotWave: "sawtooth", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.1, volumeMultiplier: 1 },
    specialEffects: { glow: true, trail: true, explosion: true },
    palette: { hueShift: 104, tileHueShift: 48, saturationBoost: 24, glowBoost: 1.45 },
    preview: [4, 16, 64, 256]
  }),
  createTheme({
    id: "zen-minimal",
    name: "Zen Minimal",
    tagline: "Calm focus with mindful rhythm.",
    description: "Pastel gradients, relaxed motion, and soft tactile feedback.",
    unlock: { type: "games_and_score", gamesPlayed: 18, score: 14000, label: "Play 18 games and score 14,000" },
    colors: {
      bg1: "#0c1218",
      bg2: "#18222e",
      bg3: "#243344",
      textMain: "#f5f8ff",
      textSoft: "#c2cfe0",
      panelTop: "rgba(40, 52, 74, 0.92)",
      panelBottom: "rgba(25, 33, 49, 0.94)",
      boardCellTop: "#1a2738",
      boardCellBottom: "#111b28"
    },
    animationProfile: { speed: 1.22, scale: 0.92, easing: "cubic-bezier(0.24, 0.88, 0.24, 1)" },
    effectIntensity: { level: "low", multiplier: 0.76 },
    soundProfile: { type: "soft", shotWave: "sine", mergeWave: "sine", blockedWave: "triangle", pitchMultiplier: 0.92, volumeMultiplier: 0.72 },
    specialEffects: { glow: false, trail: false, explosion: false },
    palette: { hueShift: -34, tileHueShift: -20, saturationBoost: -18, glowBoost: 0.56 },
    preview: [2, 4, 16, 64]
  }),
  createTheme({
    id: "aurora-luxe",
    name: "Aurora Luxe",
    tagline: "Cold light and floating silk.",
    description: "Luminous polar tones with velvet glows and smooth premium drift.",
    unlock: { type: "max_tile", target: 2048, label: "Reach tile 2048" },
    colors: {
      bg1: "#07101a",
      bg2: "#122637",
      bg3: "#1b3f54",
      textSoft: "#b7e3e8",
      panelTop: "rgba(19, 54, 76, 0.94)",
      panelBottom: "rgba(8, 29, 44, 0.96)",
      boardCellTop: "#0d2537",
      boardCellBottom: "#081924"
    },
    animationProfile: { speed: 0.94, scale: 1.08, easing: "cubic-bezier(0.18, 0.92, 0.26, 1)" },
    effectIntensity: { level: "high", multiplier: 1.28 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "sine", blockedWave: "triangle", pitchMultiplier: 1.05, volumeMultiplier: 0.88 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: 66, tileHueShift: 22, saturationBoost: 14, glowBoost: 1.34 },
    preview: [8, 32, 128, 512]
  }),
  createTheme({
    id: "midnight-gold",
    name: "Midnight Gold",
    tagline: "Black lacquer with gold heat.",
    description: "Luxury noir panels, cinematic gold flares, and heavy prestige feedback.",
    unlock: { type: "score", score: 22000, label: "Score 22,000" },
    colors: {
      bg1: "#09080a",
      bg2: "#171116",
      bg3: "#26171a",
      textSoft: "#e7d3aa",
      panelTop: "rgba(59, 39, 26, 0.96)",
      panelBottom: "rgba(26, 18, 12, 0.97)",
      boardCellTop: "#27180f",
      boardCellBottom: "#140b07"
    },
    animationProfile: { speed: 0.9, scale: 1.14, easing: "cubic-bezier(0.17, 0.96, 0.28, 1)" },
    effectIntensity: { level: "high", multiplier: 1.4 },
    soundProfile: { type: "punchy", shotWave: "square", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 0.96, volumeMultiplier: 1.04 },
    specialEffects: { glow: true, trail: false, explosion: true },
    palette: { hueShift: 20, tileHueShift: 8, saturationBoost: 8, glowBoost: 1.48 },
    preview: [4, 64, 256, 1024]
  }),
  createTheme({
    id: "coral-pop",
    name: "Coral Pop",
    tagline: "Sweet energy with punchy color.",
    description: "Glossy candy warmth, playful pops, and feel-good merge punches.",
    unlock: { type: "games_played", gamesPlayed: 8, label: "Play 8 games" },
    colors: {
      bg1: "#190b12",
      bg2: "#3a1730",
      bg3: "#5b2640",
      textSoft: "#ffd5de",
      panelTop: "rgba(84, 34, 61, 0.94)",
      panelBottom: "rgba(42, 17, 33, 0.96)",
      boardCellTop: "#4a2034",
      boardCellBottom: "#27101e"
    },
    animationProfile: { speed: 0.88, scale: 1.16, easing: "cubic-bezier(0.12, 0.96, 0.22, 1)" },
    effectIntensity: { level: "high", multiplier: 1.32 },
    soundProfile: { type: "electronic", shotWave: "triangle", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.14, volumeMultiplier: 0.96 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: 132, tileHueShift: 70, saturationBoost: 18, glowBoost: 1.22 },
    preview: [2, 8, 64, 256]
  }),
  createTheme({
    id: "cyber-grid",
    name: "Cyber Grid",
    tagline: "Precision code in motion.",
    description: "Hard-edged teal circuitry with bright scanline energy and quick motion.",
    unlock: { type: "score", score: 32000, label: "Score 32,000" },
    colors: {
      bg1: "#041014",
      bg2: "#0a2229",
      bg3: "#12363a",
      textSoft: "#9feef0",
      panelTop: "rgba(12, 58, 67, 0.95)",
      panelBottom: "rgba(5, 29, 35, 0.97)",
      boardCellTop: "#0a2830",
      boardCellBottom: "#07171d"
    },
    animationProfile: { speed: 0.8, scale: 1.15, easing: "cubic-bezier(0.08, 0.96, 0.2, 1)" },
    effectIntensity: { level: "high", multiplier: 1.38 },
    soundProfile: { type: "electronic", shotWave: "sawtooth", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.16, volumeMultiplier: 1.02 },
    specialEffects: { glow: true, trail: true, explosion: true },
    palette: { hueShift: 152, tileHueShift: 88, saturationBoost: 20, glowBoost: 1.52 },
    preview: [4, 32, 128, 512]
  }),
  createTheme({
    id: "ember-noir",
    name: "Ember Noir",
    tagline: "Smoke, fire, and heavy contrast.",
    description: "Molten sparks over deep charcoal with crisp punchy merge reactions.",
    unlock: { type: "max_tile", target: 4096, label: "Reach tile 4096" },
    colors: {
      bg1: "#0b0807",
      bg2: "#20100d",
      bg3: "#35130c",
      textSoft: "#ffc3a6",
      panelTop: "rgba(74, 28, 20, 0.95)",
      panelBottom: "rgba(34, 12, 8, 0.98)",
      boardCellTop: "#32120d",
      boardCellBottom: "#170906"
    },
    animationProfile: { speed: 0.84, scale: 1.2, easing: "cubic-bezier(0.14, 0.92, 0.22, 1)" },
    effectIntensity: { level: "high", multiplier: 1.5 },
    soundProfile: { type: "punchy", shotWave: "square", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 0.94, volumeMultiplier: 1.08 },
    specialEffects: { glow: true, trail: false, explosion: true },
    palette: { hueShift: -12, tileHueShift: -10, saturationBoost: 12, glowBoost: 1.56 },
    preview: [8, 64, 256, 2048]
  }),
  createTheme({
    id: "ocean-silk",
    name: "Ocean Silk",
    tagline: "Soft tide and clean flow.",
    description: "Deep sea gradients with silky transitions and polished calming glow.",
    unlock: { type: "games_and_score", gamesPlayed: 24, score: 24000, label: "Play 24 games and score 24,000" },
    colors: {
      bg1: "#07121b",
      bg2: "#102536",
      bg3: "#163c52",
      textSoft: "#c2f2ff",
      panelTop: "rgba(18, 58, 78, 0.92)",
      panelBottom: "rgba(10, 29, 44, 0.95)",
      boardCellTop: "#112738",
      boardCellBottom: "#091826"
    },
    animationProfile: { speed: 1.08, scale: 0.98, easing: "cubic-bezier(0.24, 0.86, 0.24, 1)" },
    effectIntensity: { level: "medium", multiplier: 0.92 },
    soundProfile: { type: "soft", shotWave: "sine", mergeWave: "sine", blockedWave: "triangle", pitchMultiplier: 0.98, volumeMultiplier: 0.78 },
    specialEffects: { glow: true, trail: false, explosion: false },
    palette: { hueShift: 34, tileHueShift: 12, saturationBoost: -4, glowBoost: 0.84 },
    preview: [2, 16, 128, 1024]
  }),
  createTheme({
    id: "royal-velvet",
    name: "Royal Velvet",
    tagline: "Elegant depth and dramatic shine.",
    description: "Deep regal gradients with rich jewel glow and stately cadence.",
    unlock: { type: "score", score: 44000, label: "Score 44,000" },
    colors: {
      bg1: "#100918",
      bg2: "#211231",
      bg3: "#37204b",
      textSoft: "#dfc6ff",
      panelTop: "rgba(61, 33, 88, 0.94)",
      panelBottom: "rgba(25, 14, 39, 0.97)",
      boardCellTop: "#2b163d",
      boardCellBottom: "#160b22"
    },
    animationProfile: { speed: 0.96, scale: 1.1, easing: "cubic-bezier(0.19, 0.93, 0.24, 1)" },
    effectIntensity: { level: "high", multiplier: 1.26 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "sine", blockedWave: "triangle", pitchMultiplier: 0.9, volumeMultiplier: 0.86 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: 204, tileHueShift: 116, saturationBoost: 6, glowBoost: 1.3 },
    preview: [4, 32, 256, 1024]
  }),
  createTheme({
    id: "forest-spark",
    name: "Forest Spark",
    tagline: "Fresh growth with bright charge.",
    description: "Botanic glow, bright sparks, and grounded kinetic feedback.",
    unlock: { type: "games_played", gamesPlayed: 14, label: "Play 14 games" },
    colors: {
      bg1: "#08110a",
      bg2: "#102217",
      bg3: "#1b3924",
      textSoft: "#d0f5c8",
      panelTop: "rgba(28, 67, 36, 0.94)",
      panelBottom: "rgba(12, 31, 17, 0.97)",
      boardCellTop: "#16311e",
      boardCellBottom: "#0c1a10"
    },
    animationProfile: { speed: 0.9, scale: 1.06, easing: "cubic-bezier(0.16, 0.9, 0.22, 1)" },
    effectIntensity: { level: "medium", multiplier: 1.02 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.03, volumeMultiplier: 0.84 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: -70, tileHueShift: -26, saturationBoost: 10, glowBoost: 1.08 },
    preview: [2, 16, 64, 512]
  }),
  createTheme({
    id: "mono-ink",
    name: "Mono Ink",
    tagline: "Minimal contrast, maximum focus.",
    description: "Sharp monochrome panels with restrained motion and premium clarity.",
    unlock: { type: "games_and_score", gamesPlayed: 12, score: 18000, label: "Play 12 games and score 18,000" },
    colors: {
      bg1: "#09090b",
      bg2: "#15171b",
      bg3: "#252930",
      textSoft: "#d7dbe3",
      panelTop: "rgba(52, 58, 68, 0.94)",
      panelBottom: "rgba(21, 24, 30, 0.97)",
      boardCellTop: "#222732",
      boardCellBottom: "#101319"
    },
    animationProfile: { speed: 1.04, scale: 0.96, easing: "cubic-bezier(0.25, 0.88, 0.25, 1)" },
    effectIntensity: { level: "low", multiplier: 0.74 },
    soundProfile: { type: "soft", shotWave: "sine", mergeWave: "triangle", blockedWave: "triangle", pitchMultiplier: 0.88, volumeMultiplier: 0.7 },
    specialEffects: { glow: false, trail: false, explosion: false },
    palette: { hueShift: 0, tileHueShift: -6, saturationBoost: -30, glowBoost: 0.42 },
    preview: [2, 8, 32, 256]
  }),
  createTheme({
    id: "synthwave-sunset",
    name: "Synthwave Sunset",
    tagline: "Retro heat with polished speed.",
    description: "Sunset magentas, electric cyan rims, and stylish arcade motion.",
    unlock: { type: "score", score: 52000, label: "Score 52,000" },
    colors: {
      bg1: "#12051b",
      bg2: "#2b0d3e",
      bg3: "#48145a",
      textSoft: "#ffc4ef",
      panelTop: "rgba(88, 24, 118, 0.94)",
      panelBottom: "rgba(34, 10, 48, 0.97)",
      boardCellTop: "#3c1450",
      boardCellBottom: "#1a0926"
    },
    animationProfile: { speed: 0.82, scale: 1.22, easing: "cubic-bezier(0.1, 0.96, 0.18, 1)" },
    effectIntensity: { level: "high", multiplier: 1.46 },
    soundProfile: { type: "electronic", shotWave: "sawtooth", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.18, volumeMultiplier: 1.02 },
    specialEffects: { glow: true, trail: true, explosion: true },
    palette: { hueShift: 236, tileHueShift: 148, saturationBoost: 28, glowBoost: 1.62 },
    preview: [8, 64, 512, 2048]
  }),
  createTheme({
    id: "moon-pearl",
    name: "Moon Pearl",
    tagline: "Bright ivory with cool bloom.",
    description: "Soft moonlit sheen, pearl panels, and airy clean transitions.",
    unlock: { type: "games_played", gamesPlayed: 20, label: "Play 20 games" },
    colors: {
      bg1: "#0c0f15",
      bg2: "#1a2230",
      bg3: "#2b3b4f",
      textSoft: "#edf5ff",
      panelTop: "rgba(84, 99, 126, 0.9)",
      panelBottom: "rgba(35, 44, 60, 0.94)",
      boardCellTop: "#39485f",
      boardCellBottom: "#202837"
    },
    animationProfile: { speed: 1.14, scale: 0.94, easing: "cubic-bezier(0.28, 0.84, 0.28, 1)" },
    effectIntensity: { level: "low", multiplier: 0.8 },
    soundProfile: { type: "soft", shotWave: "sine", mergeWave: "sine", blockedWave: "triangle", pitchMultiplier: 1, volumeMultiplier: 0.74 },
    specialEffects: { glow: true, trail: false, explosion: false },
    palette: { hueShift: 14, tileHueShift: 2, saturationBoost: -10, glowBoost: 0.72 },
    preview: [2, 16, 128, 512]
  }),
  createTheme({
    id: "magma-core",
    name: "Magma Core",
    tagline: "Heavy impact from the deep.",
    description: "Volcanic reds, hot amber glow, and explosive premium merge force.",
    unlock: { type: "max_tile", target: 8192, label: "Reach tile 8192" },
    colors: {
      bg1: "#0d0706",
      bg2: "#24110d",
      bg3: "#3f1a11",
      textSoft: "#ffc3a3",
      panelTop: "rgba(90, 32, 18, 0.95)",
      panelBottom: "rgba(36, 13, 8, 0.97)",
      boardCellTop: "#3a180f",
      boardCellBottom: "#180907"
    },
    animationProfile: { speed: 0.8, scale: 1.24, easing: "cubic-bezier(0.14, 0.98, 0.2, 1)" },
    effectIntensity: { level: "high", multiplier: 1.58 },
    soundProfile: { type: "punchy", shotWave: "square", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 0.9, volumeMultiplier: 1.12 },
    specialEffects: { glow: true, trail: false, explosion: true },
    palette: { hueShift: -20, tileHueShift: -18, saturationBoost: 16, glowBoost: 1.7 },
    preview: [16, 64, 512, 4096]
  }),
  createTheme({
    id: "sky-circuit",
    name: "Sky Circuit",
    tagline: "Bright air and futuristic polish.",
    description: "Crisp sky blues, luminous white rims, and swift top-tier feedback.",
    unlock: { type: "score", score: 61000, label: "Score 61,000" },
    colors: {
      bg1: "#06111d",
      bg2: "#10263b",
      bg3: "#1a4160",
      textSoft: "#d6f3ff",
      panelTop: "rgba(24, 84, 128, 0.92)",
      panelBottom: "rgba(11, 34, 52, 0.96)",
      boardCellTop: "#153149",
      boardCellBottom: "#0b1d2c"
    },
    animationProfile: { speed: 0.86, scale: 1.16, easing: "cubic-bezier(0.1, 0.95, 0.22, 1)" },
    effectIntensity: { level: "high", multiplier: 1.34 },
    soundProfile: { type: "electronic", shotWave: "triangle", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.12, volumeMultiplier: 0.94 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: 82, tileHueShift: 34, saturationBoost: 18, glowBoost: 1.28 },
    preview: [4, 32, 256, 1024]
  }),
  createTheme({
    id: "rose-crystal",
    name: "Rose Crystal",
    tagline: "Luxurious gem light and sparkle.",
    description: "Crystal rose gradients with soft glitter bloom and premium finesse.",
    unlock: { type: "games_and_score", gamesPlayed: 30, score: 30000, label: "Play 30 games and score 30,000" },
    colors: {
      bg1: "#120915",
      bg2: "#281226",
      bg3: "#48203c",
      textSoft: "#ffd4ef",
      panelTop: "rgba(92, 42, 87, 0.92)",
      panelBottom: "rgba(38, 16, 35, 0.96)",
      boardCellTop: "#3f1a39",
      boardCellBottom: "#1d0b1a"
    },
    animationProfile: { speed: 0.98, scale: 1.08, easing: "cubic-bezier(0.22, 0.9, 0.24, 1)" },
    effectIntensity: { level: "medium", multiplier: 1.04 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "sine", blockedWave: "triangle", pitchMultiplier: 1.06, volumeMultiplier: 0.84 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: 286, tileHueShift: 182, saturationBoost: 12, glowBoost: 1.12 },
    preview: [2, 32, 128, 1024]
  }),
  createTheme({
    id: "pixel-party",
    name: "Pixel Party",
    tagline: "Arcade chaos with premium polish.",
    description: "Bright playful punch, brisk motion, and satisfying retro celebration.",
    unlock: { type: "games_played", gamesPlayed: 36, label: "Play 36 games" },
    colors: {
      bg1: "#120d1f",
      bg2: "#23163e",
      bg3: "#35256a",
      textSoft: "#d7d0ff",
      panelTop: "rgba(68, 56, 127, 0.95)",
      panelBottom: "rgba(28, 21, 58, 0.97)",
      boardCellTop: "#30255e",
      boardCellBottom: "#17122d"
    },
    animationProfile: { speed: 0.78, scale: 1.22, easing: "cubic-bezier(0.08, 0.98, 0.18, 1)" },
    effectIntensity: { level: "high", multiplier: 1.44 },
    soundProfile: { type: "electronic", shotWave: "square", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.2, volumeMultiplier: 1 },
    specialEffects: { glow: true, trail: true, explosion: true },
    palette: { hueShift: 256, tileHueShift: 204, saturationBoost: 24, glowBoost: 1.54 },
    preview: [4, 16, 256, 2048]
  }),
  createTheme({
    id: "desert-opal",
    name: "Desert Opal",
    tagline: "Warm dust and jewel flashes.",
    description: "Sunbaked stone tones with opal highlights and clean tactile feedback.",
    unlock: { type: "score", score: 70000, label: "Score 70,000" },
    colors: {
      bg1: "#140d09",
      bg2: "#2b1c14",
      bg3: "#4a2f1f",
      textSoft: "#f7d9b9",
      panelTop: "rgba(99, 65, 39, 0.94)",
      panelBottom: "rgba(42, 27, 17, 0.97)",
      boardCellTop: "#442a1a",
      boardCellBottom: "#21150c"
    },
    animationProfile: { speed: 0.95, scale: 1.04, easing: "cubic-bezier(0.2, 0.9, 0.22, 1)" },
    effectIntensity: { level: "medium", multiplier: 0.96 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 0.98, volumeMultiplier: 0.84 },
    specialEffects: { glow: true, trail: false, explosion: false },
    palette: { hueShift: -4, tileHueShift: 4, saturationBoost: 4, glowBoost: 0.94 },
    preview: [8, 64, 256, 1024]
  }),
  createTheme({
    id: "prism-bloom",
    name: "Prism Bloom",
    tagline: "Shifting color with luxe spark.",
    description: "Prismatic transitions, blooming highlights, and joyful premium energy.",
    unlock: { type: "games_and_score", gamesPlayed: 42, score: 42000, label: "Play 42 games and score 42,000" },
    colors: {
      bg1: "#0d0c18",
      bg2: "#1b1638",
      bg3: "#2e2662",
      textSoft: "#efe6ff",
      panelTop: "rgba(70, 66, 145, 0.94)",
      panelBottom: "rgba(28, 24, 70, 0.97)",
      boardCellTop: "#38327a",
      boardCellBottom: "#18163d"
    },
    animationProfile: { speed: 0.84, scale: 1.18, easing: "cubic-bezier(0.14, 0.95, 0.2, 1)" },
    effectIntensity: { level: "high", multiplier: 1.42 },
    soundProfile: { type: "electronic", shotWave: "triangle", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.14, volumeMultiplier: 0.98 },
    specialEffects: { glow: true, trail: true, explosion: true },
    palette: { hueShift: 118, tileHueShift: 236, saturationBoost: 22, glowBoost: 1.58 },
    preview: [4, 32, 512, 2048]
  }),
  createTheme({
    id: "obsidian-frost",
    name: "Obsidian Frost",
    tagline: "Dark stone with icy cuts.",
    description: "Jet black depth, frozen cyan edges, and controlled powerful feedback.",
    unlock: { type: "max_tile", target: 16384, label: "Reach tile 16384" },
    colors: {
      bg1: "#05080c",
      bg2: "#0d151c",
      bg3: "#182630",
      textSoft: "#cff4ff",
      panelTop: "rgba(27, 46, 56, 0.95)",
      panelBottom: "rgba(10, 18, 24, 0.97)",
      boardCellTop: "#15242e",
      boardCellBottom: "#091218"
    },
    animationProfile: { speed: 0.86, scale: 1.12, easing: "cubic-bezier(0.15, 0.94, 0.23, 1)" },
    effectIntensity: { level: "high", multiplier: 1.3 },
    soundProfile: { type: "punchy", shotWave: "square", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 0.92, volumeMultiplier: 1 },
    specialEffects: { glow: true, trail: false, explosion: true },
    palette: { hueShift: 48, tileHueShift: 28, saturationBoost: -2, glowBoost: 1.42 },
    preview: [16, 128, 512, 4096]
  }),
  createTheme({
    id: "sunrise-candy",
    name: "Sunrise Candy",
    tagline: "Bright optimism with soft bounce.",
    description: "Peach, pink, and mint tones with cheerful motion and addictively clean pops.",
    unlock: { type: "games_played", gamesPlayed: 50, label: "Play 50 games" },
    colors: {
      bg1: "#160b10",
      bg2: "#341723",
      bg3: "#56263a",
      textSoft: "#ffe4ef",
      panelTop: "rgba(99, 54, 79, 0.93)",
      panelBottom: "rgba(42, 18, 31, 0.96)",
      boardCellTop: "#4d2137",
      boardCellBottom: "#230d19"
    },
    animationProfile: { speed: 0.9, scale: 1.12, easing: "cubic-bezier(0.16, 0.92, 0.24, 1)" },
    effectIntensity: { level: "medium", multiplier: 1.08 },
    soundProfile: { type: "soft", shotWave: "triangle", mergeWave: "triangle", blockedWave: "triangle", pitchMultiplier: 1.08, volumeMultiplier: 0.9 },
    specialEffects: { glow: true, trail: true, explosion: false },
    palette: { hueShift: 172, tileHueShift: 96, saturationBoost: 16, glowBoost: 1.18 },
    preview: [2, 16, 64, 512]
  }),
  createTheme({
    id: "starlight-opera",
    name: "Starlight Opera",
    tagline: "Grand, dramatic, and luminous.",
    description: "A flagship high-end theme with theatrical bloom, rich motion, and elite presence.",
    unlock: { type: "games_and_score", gamesPlayed: 60, score: 90000, label: "Play 60 games and score 90,000" },
    colors: {
      bg1: "#090714",
      bg2: "#16132f",
      bg3: "#291f4e",
      textSoft: "#e4dcff",
      panelTop: "rgba(55, 49, 112, 0.95)",
      panelBottom: "rgba(22, 18, 57, 0.98)",
      boardCellTop: "#2c2666",
      boardCellBottom: "#140f34"
    },
    animationProfile: { speed: 0.78, scale: 1.26, easing: "cubic-bezier(0.08, 0.98, 0.16, 1)" },
    effectIntensity: { level: "high", multiplier: 1.65 },
    soundProfile: { type: "electronic", shotWave: "sawtooth", mergeWave: "triangle", blockedWave: "square", pitchMultiplier: 1.22, volumeMultiplier: 1.04 },
    specialEffects: { glow: true, trail: true, explosion: true },
    palette: { hueShift: 268, tileHueShift: 244, saturationBoost: 30, glowBoost: 1.76 },
    preview: [8, 64, 1024, 4096]
  })
];

const THEME_COIN_TARGETS = Object.freeze([
  0,
  300,
  800,
  1600,
  2600,
  3900,
  5500,
  7400,
  9600,
  12200,
  15100,
  18300,
  21800,
  25600,
  29700,
  34100,
  38800,
  43800,
  49100,
  54700,
  60600,
  66800,
  73300,
  80100
]);

function withSequentialCoinUnlocks(theme, index) {
  if (index === 0) {
    return {
      ...theme,
      unlock: { type: "default", target: 0, label: "Unlocked" }
    };
  }

  const target = THEME_COIN_TARGETS[index] || THEME_COIN_TARGETS[THEME_COIN_TARGETS.length - 1];
  return {
    ...theme,
    unlock: {
      type: "coins",
      target,
      label: `${target.toLocaleString()} coins`
    }
  };
}

export const THEME_DEFINITIONS = Object.freeze(RAW_THEME_DEFINITIONS.map(withSequentialCoinUnlocks));

export const THEME_BY_ID = new Map(THEME_DEFINITIONS.map((theme) => [theme.id, theme]));

export function getThemeById(themeId) {
  return THEME_BY_ID.get(themeId) || THEME_BY_ID.get(DEFAULT_THEME_ID);
}

export function getUnlockLabel(theme) {
  return theme?.unlock?.label || "Locked";
}

export function createDefaultThemeProgress() {
  return {
    gamesPlayed: 0,
    bestScore: 0,
    maxTile: 0,
    coins: 0
  };
}

export function normalizeThemeProgress(progress) {
  const defaults = createDefaultThemeProgress();
  return {
    gamesPlayed: Math.max(0, Number(progress?.gamesPlayed || defaults.gamesPlayed)),
    bestScore: Math.max(0, Number(progress?.bestScore || defaults.bestScore)),
    maxTile: Math.max(0, Number(progress?.maxTile || defaults.maxTile)),
    coins: Math.max(0, Number(progress?.coins || defaults.coins))
  };
}

export function isThemeUnlockedByProgress(theme, progress) {
  if (!theme || !theme.unlock || theme.unlock.type === "default") {
    return true;
  }

  const safeProgress = normalizeThemeProgress(progress);
  const unlock = theme.unlock;

  if (unlock.type === "max_tile") {
    return safeProgress.maxTile >= Number(unlock.target || 0);
  }

  if (unlock.type === "games_played") {
    return safeProgress.gamesPlayed >= Number(unlock.gamesPlayed || 0);
  }

  if (unlock.type === "score") {
    return safeProgress.bestScore >= Number(unlock.score || 0);
  }

  if (unlock.type === "games_and_score") {
    return safeProgress.gamesPlayed >= Number(unlock.gamesPlayed || 0) && safeProgress.bestScore >= Number(unlock.score || 0);
  }

  if (unlock.type === "coins") {
    return safeProgress.coins >= Number(unlock.target || 0);
  }

  return false;
}
