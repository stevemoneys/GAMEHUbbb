export const THEME_STORAGE_KEY = "gamehub_2048_active_theme_v2";
export const THEME_UNLOCK_STORAGE_KEY = "gamehub_2048_unlocked_themes_v2";
export const THEME_PROGRESS_STORAGE_KEY = "gamehub_2048_theme_progress_v2";

export const DEFAULT_THEME_ID = "glass-premium";

export const THEME_DEFINITIONS = Object.freeze([
  {
    id: "glass-premium",
    name: "Glass Premium",
    tagline: "Polished clarity, elite balance.",
    description: "Glossy panels, clean light bloom, and smooth premium pacing.",
    unlock: { type: "default", label: "Available from start" },
    colors: {
      bg1: "#04060b",
      bg2: "#0a0f1a",
      bg3: "#131c2c",
      textMain: "#f3f6ff",
      textSoft: "#aab5cc",
      panelTop: "rgba(30, 40, 63, 0.96)",
      panelBottom: "rgba(18, 24, 38, 0.96)",
      boardCellTop: "#151c2d",
      boardCellBottom: "#090c14"
    },
    animationProfile: {
      speed: 1,
      scale: 1,
      easing: "cubic-bezier(0.2, 0.9, 0.2, 1)"
    },
    effectIntensity: {
      level: "medium",
      multiplier: 1
    },
    soundProfile: {
      type: "soft",
      shotWave: "triangle",
      mergeWave: "sine",
      blockedWave: "square",
      pitchMultiplier: 1,
      volumeMultiplier: 0.9
    },
    specialEffects: {
      glow: true,
      trail: false,
      explosion: false
    },
    palette: {
      hueShift: 0,
      tileHueShift: 0,
      saturationBoost: 0,
      glowBoost: 1
    },
    preview: [2, 8, 32, 128]
  },
  {
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
    animationProfile: {
      speed: 0.82,
      scale: 1.18,
      easing: "cubic-bezier(0.14, 0.95, 0.25, 1)"
    },
    effectIntensity: {
      level: "high",
      multiplier: 1.35
    },
    soundProfile: {
      type: "electronic",
      shotWave: "sawtooth",
      mergeWave: "triangle",
      blockedWave: "square",
      pitchMultiplier: 1.1,
      volumeMultiplier: 1
    },
    specialEffects: {
      glow: true,
      trail: true,
      explosion: true
    },
    palette: {
      hueShift: 104,
      tileHueShift: 48,
      saturationBoost: 24,
      glowBoost: 1.45
    },
    preview: [4, 16, 64, 256]
  },
  {
    id: "zen-minimal",
    name: "Zen Minimal",
    tagline: "Calm focus with mindful momentum.",
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
    animationProfile: {
      speed: 1.22,
      scale: 0.92,
      easing: "cubic-bezier(0.24, 0.88, 0.24, 1)"
    },
    effectIntensity: {
      level: "low",
      multiplier: 0.76
    },
    soundProfile: {
      type: "soft",
      shotWave: "sine",
      mergeWave: "sine",
      blockedWave: "triangle",
      pitchMultiplier: 0.92,
      volumeMultiplier: 0.72
    },
    specialEffects: {
      glow: false,
      trail: false,
      explosion: false
    },
    palette: {
      hueShift: -34,
      tileHueShift: -20,
      saturationBoost: -18,
      glowBoost: 0.56
    },
    preview: [2, 4, 16, 64]
  }
]);

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
    maxTile: 0
  };
}

export function normalizeThemeProgress(progress) {
  const defaults = createDefaultThemeProgress();
  return {
    gamesPlayed: Math.max(0, Number(progress?.gamesPlayed || defaults.gamesPlayed)),
    bestScore: Math.max(0, Number(progress?.bestScore || defaults.bestScore)),
    maxTile: Math.max(0, Number(progress?.maxTile || defaults.maxTile))
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

  return false;
}
