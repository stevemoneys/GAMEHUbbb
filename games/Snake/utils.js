"use strict";

(function (global) {
  const PRIMARY_STORAGE_KEY = "snakeGameProgressV5";
  const LEGACY_STORAGE_KEYS = ["snakeGameProgressV4", "snakeGameProgressV3"];
  const LEVEL_COUNT = 150;
  const GRID_COLS = 40;
  const GRID_ROWS = 30;
  const CELL_SIZE = 20;

  const BASE_COLORS = {
    bg: "#0a0a1a",
    arena: "#1a1a2e",
    neon: "#00f3ff",
    player: "#00ff88"
  };

  const POWER_UPS = {
    speed: { id: "speed", name: "Speed Boost", icon: "SPD", color: "#4de7ff", durationMs: 8000 },
    shield: { id: "shield", name: "Shield", icon: "SHD", color: "#ffd54f", durationMs: 6000 },
    magnet: { id: "magnet", name: "Magnet", icon: "MAG", color: "#b56bff", durationMs: 5000 },
    doublePoints: { id: "doublePoints", name: "Double Points", icon: "2X", color: "#ff8c2e", durationMs: 10000 }
  };

  const POWER_UP_POOL = ["speed", "magnet", "doublePoints", "speed", "doublePoints", "shield"];

  const SHOP_ITEMS = [
    { id: "boost_magnet", name: "Magnet+ 10%", desc: "Magnet lasts 10% longer.", cost: 800, type: "booster", key: "magnetDurationBonus", increment: 0.1 },
    { id: "boost_speed", name: "Speed+ 8%", desc: "Speed Boost lasts 8% longer.", cost: 850, type: "booster", key: "speedDurationBonus", increment: 0.08 },
    { id: "boost_shield", name: "Shield+ 10%", desc: "Shield lasts 10% longer.", cost: 900, type: "booster", key: "shieldDurationBonus", increment: 0.1 },
    { id: "boost_double", name: "Double+ 10%", desc: "Double Points lasts 10% longer.", cost: 950, type: "booster", key: "doublePointsDurationBonus", increment: 0.1 }
  ];

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const OPPOSITE = {
    up: "down",
    down: "up",
    left: "right",
    right: "left"
  };

  const LEGACY_SKIN_MAP = {
    default: "classic_green",
    skin_cobalt: "neon_blue",
    skin_gold: "gold_emperor"
  };

  const LEGACY_THEME_MAP = {
    "neo-night": "neon_grid",
    crimson: "vibrant_carnival",
    emerald: "enchanted_jungle"
  };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randItem = (arr) => arr[rand(0, arr.length - 1)];
  const keyOf = (x, y) => `${x},${y}`;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  function formatMs(ms) {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  function formatSeconds(ms) {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const shortHex = clean.length === 3;
    const r = parseInt(shortHex ? clean[0] + clean[0] : clean.slice(0, 2), 16);
    const g = parseInt(shortHex ? clean[1] + clean[1] : clean.slice(2, 4), 16);
    const b = parseInt(shortHex ? clean[2] + clean[2] : clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawRoundedRectPath(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function uniq(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function mapLegacySkin(id) {
    return LEGACY_SKIN_MAP[id] || id;
  }

  function mapLegacyTheme(id) {
    return LEGACY_THEME_MAP[id] || id;
  }

  function defaultProgress() {
    return {
      highestLevelUnlocked: 1,
      completedLevels: [],
      totalCoins: 0,
      totalCoinsSpent: 0,
      lifetimeCoinsEarned: 0,
      totalPlayMs: 0,
      highScore: 0,
      gamesPlayed: 0,
      totalAISnakesEaten: 0,
      totalPowerUpsCollected: 0,
      totalFeverActivations: 0,
      highestCombo: 0,
      mazeGamesCompleted: 0,
      bossRushWins: 0,
      winsWithoutPowerUps: 0,
      shopPurchases: 0,
      bestStreak: 1,
      equippedSkinHistory: ["classic_green"],
      completedDailyChallenges: [],
      achievementsEarned: [],
      replayMetaByMode: {
        campaign: null,
        classic: null,
        time_attack: null,
        maze: null,
        zen: null,
        boss_rush: null
      },
      stats: {
        playerName: "Guest",
        totalGamesStarted: 0,
        totalGamesFinished: 0,
        totalTimePlayed: 0,
        totalCoinsEarned: 0,
        totalCoinsSpent: 0,
        highestScoreOverall: 0,
        highestCombo: 0,
        longestSnake: 5,
        totalAISnakesEaten: 0,
        totalPowerUpsCollected: 0,
        totalFeverModesActivated: 0,
        highestLevelCompleted: 0,
        totalLevelsCompleted: 0,
        bestScoresByMode: {
          campaign: 0,
          classic: 0,
          time_attack: 0,
          maze: 0,
          zen: 0,
          boss_rush: 0
        },
        longestStreak: 1,
        totalDailyChallengesCompleted: 0,
        skinsUnlocked: 1,
        themesUnlocked: 1,
        upgradesPurchased: 0
      },
      unlockedSkins: ["classic_green"],
      equippedSkin: "classic_green",
      unlockedThemes: ["neon_grid"],
      equippedTheme: "neon_grid",
      purchasedItems: [],
      streakData: {
        currentStreak: 1,
        lastPlayedDate: null,
        multiplier: 1
      },
      dailyChallenge: {
        id: null,
        description: "",
        metric: "",
        target: 0,
        rewardCoins: 250,
        currentProgress: 0,
        completed: false,
        date: null
      },
      bonusWheel: {
        lastSpinDate: null
      },
      upgrades: {
        speedDuration: 0,
        invincibleDuration: 0,
        magnetRadius: 0,
        permanentCoinBonus: 0
      },
      boosters: {
        magnetDurationBonus: 0,
        speedDurationBonus: 0,
        shieldDurationBonus: 0,
        doublePointsDurationBonus: 0
      },
      settings: {
        sfx: true,
        soundEnabled: true,
        musicEnabled: true,
        soundVolume: 0.72,
        musicVolume: 0.48,
        hapticsEnabled: true
      }
    };
  }

  function loadRawProgress() {
    const keys = [PRIMARY_STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  function loadProgress() {
    const fallback = defaultProgress();
    const parsed = loadRawProgress();
    if (!parsed) return fallback;

    const legacyOwnedSkins = Array.isArray(parsed.ownedSkins) ? parsed.ownedSkins.map(mapLegacySkin) : [];
    const legacyOwnedThemes = Array.isArray(parsed.ownedThemes) ? parsed.ownedThemes.map(mapLegacyTheme) : [];
    const unlockedSkins = uniq([...(parsed.unlockedSkins || []), ...legacyOwnedSkins, fallback.equippedSkin]);
    const unlockedThemes = uniq([...(parsed.unlockedThemes || []), ...legacyOwnedThemes, fallback.equippedTheme]);

    const equippedSkin = unlockedSkins.includes(parsed.equippedSkin)
      ? parsed.equippedSkin
      : unlockedSkins.includes(mapLegacySkin(parsed.selectedSkin))
        ? mapLegacySkin(parsed.selectedSkin)
        : fallback.equippedSkin;

    const equippedTheme = unlockedThemes.includes(parsed.equippedTheme)
      ? parsed.equippedTheme
      : unlockedThemes.includes(mapLegacyTheme(parsed.selectedTheme))
        ? mapLegacyTheme(parsed.selectedTheme)
        : fallback.equippedTheme;

    return {
      ...fallback,
      ...parsed,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      unlockedSkins,
      equippedSkin,
      unlockedThemes,
      equippedTheme,
      purchasedItems: Array.isArray(parsed.purchasedItems) ? parsed.purchasedItems : [],
      equippedSkinHistory: Array.isArray(parsed.equippedSkinHistory) ? parsed.equippedSkinHistory : fallback.equippedSkinHistory,
      completedDailyChallenges: Array.isArray(parsed.completedDailyChallenges) ? parsed.completedDailyChallenges : [],
      achievementsEarned: Array.isArray(parsed.achievementsEarned) ? parsed.achievementsEarned : [],
      replayMetaByMode: {
        ...fallback.replayMetaByMode,
        ...(parsed.replayMetaByMode || {})
      },
      stats: {
        ...fallback.stats,
        ...(parsed.stats || {}),
        bestScoresByMode: {
          ...fallback.stats.bestScoresByMode,
          ...(parsed.stats?.bestScoresByMode || {})
        }
      },
      boosters: {
        ...fallback.boosters,
        ...(parsed.boosters || {})
      },
      upgrades: {
        ...fallback.upgrades,
        ...(parsed.upgrades || {})
      },
      streakData: {
        ...fallback.streakData,
        ...(parsed.streakData || {})
      },
      dailyChallenge: {
        ...fallback.dailyChallenge,
        ...(parsed.dailyChallenge || {})
      },
      bonusWheel: {
        ...fallback.bonusWheel,
        ...(parsed.bonusWheel || {})
      },
      settings: {
        ...fallback.settings,
        ...(parsed.settings || {}),
        soundEnabled: parsed.settings?.soundEnabled ?? parsed.settings?.sfx ?? fallback.settings.soundEnabled,
        sfx: parsed.settings?.sfx ?? parsed.settings?.soundEnabled ?? fallback.settings.sfx
      },
      totalCoinsSpent: Number.isFinite(parsed.totalCoinsSpent) ? parsed.totalCoinsSpent : 0,
      gamesPlayed: Number.isFinite(parsed.gamesPlayed) ? parsed.gamesPlayed : 0,
      totalAISnakesEaten: Number.isFinite(parsed.totalAISnakesEaten) ? parsed.totalAISnakesEaten : 0,
      totalPowerUpsCollected: Number.isFinite(parsed.totalPowerUpsCollected) ? parsed.totalPowerUpsCollected : 0,
      totalFeverActivations: Number.isFinite(parsed.totalFeverActivations) ? parsed.totalFeverActivations : 0,
      highestCombo: Number.isFinite(parsed.highestCombo) ? parsed.highestCombo : 0,
      mazeGamesCompleted: Number.isFinite(parsed.mazeGamesCompleted) ? parsed.mazeGamesCompleted : 0,
      bossRushWins: Number.isFinite(parsed.bossRushWins) ? parsed.bossRushWins : 0,
      winsWithoutPowerUps: Number.isFinite(parsed.winsWithoutPowerUps) ? parsed.winsWithoutPowerUps : 0,
      shopPurchases: Number.isFinite(parsed.shopPurchases) ? parsed.shopPurchases : 0,
      bestStreak: Number.isFinite(parsed.bestStreak) ? parsed.bestStreak : 1,
      lifetimeCoinsEarned: Number.isFinite(parsed.lifetimeCoinsEarned) ? parsed.lifetimeCoinsEarned : (Number.isFinite(parsed.totalCoins) ? parsed.totalCoins : 0)
    };
  }

  function saveProgress(progress) {
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(progress));
  }

  function createEmptyMaze() {
    const maze = Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => 0));
    for (let x = 0; x < GRID_COLS; x += 1) {
      maze[0][x] = 1;
      maze[GRID_ROWS - 1][x] = 1;
    }
    for (let y = 0; y < GRID_ROWS; y += 1) {
      maze[y][0] = 1;
      maze[y][GRID_COLS - 1] = 1;
    }
    return maze;
  }

  function carveSafeZone(maze, cx = 20, cy = 15, radius = 2) {
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        if (y > 0 && y < GRID_ROWS - 1 && x > 0 && x < GRID_COLS - 1) {
          maze[y][x] = 0;
        }
      }
    }
  }

  function generateMazePattern(seed) {
    const maze = createEmptyMaze();
    const spacingX = 4 + (seed % 3);
    const spacingY = 4 + ((seed + 1) % 3);

    for (let x = 3; x < GRID_COLS - 3; x += spacingX) {
      const gapY = 2 + ((x + seed * 3) % (GRID_ROWS - 4));
      for (let y = 1; y < GRID_ROWS - 1; y += 1) {
        if (y === gapY || y === gapY + 1) continue;
        maze[y][x] = 1;
      }
    }

    for (let y = 4; y < GRID_ROWS - 4; y += spacingY) {
      const gapX = 2 + ((y + seed * 5) % (GRID_COLS - 4));
      for (let x = 1; x < GRID_COLS - 1; x += 1) {
        if (x === gapX || x === gapX + 1) continue;
        if (maze[y][x] === 1) continue;
        maze[y][x] = 1;
      }
    }

    carveSafeZone(maze, 20, 15, 2);
    carveSafeZone(maze, 5 + (seed % 5), 5 + (seed % 4), 1);
    carveSafeZone(maze, 34 - (seed % 5), 24 - (seed % 4), 1);
    return maze;
  }

  function buildMazeLayouts() {
    const map = {};
    for (let i = 1; i <= 15; i += 1) {
      map[`maze_${i}`] = generateMazePattern(i + 3);
    }
    return map;
  }

  const MAZE_LAYOUTS = buildMazeLayouts();

  function generateLevels() {
    const levelList = [];
    for (let i = 1; i <= LEVEL_COUNT; i += 1) {
      const difficulty = 1 + i / 100;
      const targetLength = Math.floor(10 + i / 2.5);
      const baseAISpeed = 1.0 + i / 250;
      const aiCount = Math.min(7, Math.floor(1 + i / 25));
      let mazeLayout = null;
      if (i >= 10 && i % 10 === 0) mazeLayout = `maze_${i / 10}`;

      levelList.push({
        id: i,
        name: `Level ${i}`,
        objective: `Reach length ${targetLength}`,
        targetLength,
        targetTime: null,
        baseAISpeed,
        aiCount,
        minAILength: Math.floor(5 * difficulty),
        maxAILength: Math.floor(15 * difficulty),
        powerUpSpawnRate: Math.max(8000, 25000 - i * 100),
        mazeLayout,
        rewardCoins: Math.floor(100 + i * 5)
      });
    }
    return levelList;
  }

  const LEVELS = generateLevels();

  global.SnakeShared = {
    STORAGE_KEY: PRIMARY_STORAGE_KEY,
    LEGACY_STORAGE_KEYS,
    LEVEL_COUNT,
    GRID_COLS,
    GRID_ROWS,
    CELL_SIZE,
    BASE_COLORS,
    POWER_UPS,
    POWER_UP_POOL,
    SHOP_ITEMS,
    DIRS,
    OPPOSITE,
    LEVELS,
    MAZE_LAYOUTS,
    rand,
    randItem,
    keyOf,
    clamp,
    dist,
    formatMs,
    formatSeconds,
    deepClone,
    hexToRgba,
    drawRoundedRectPath,
    defaultProgress,
    loadProgress,
    saveProgress
  };
})(window);
