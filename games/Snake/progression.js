"use strict";

(function (global) {
  const STREAK_MULTIPLIERS = [1, 1.2, 1.4, 1.6, 1.8, 2, 2.5];

  const RARITY_PRICES = {
    Starter: 0,
    Common: 100,
    Rare: 250,
    Epic: 500,
    Legendary: 1000,
    Mythic: 2500
  };

  const THEME_PRICE = 200;

  const UPGRADE_DEFS = [
    {
      id: "speedDuration",
      name: "Speed Boost Duration",
      icon: "SPD",
      description: "Make the speed power-up last longer in every mode.",
      levels: [
        { cost: 200, label: "+1 second", value: 1 },
        { cost: 400, label: "+2 seconds", value: 2 },
        { cost: 800, label: "+3 seconds", value: 3 }
      ]
    },
    {
      id: "invincibleDuration",
      name: "Invincibility Duration",
      icon: "SHD",
      description: "Extend Shield / invincibility uptime permanently.",
      levels: [
        { cost: 150, label: "+1 second", value: 1 },
        { cost: 300, label: "+2 seconds", value: 2 },
        { cost: 600, label: "+3 seconds", value: 3 }
      ]
    },
    {
      id: "magnetRadius",
      name: "Magnet Pull Radius",
      icon: "MAG",
      description: "Increase how far food can be dragged into your snake.",
      levels: [
        { cost: 100, label: "+30 px", value: 30 },
        { cost: 250, label: "+60 px", value: 60 },
        { cost: 500, label: "+100 px", value: 100 }
      ]
    },
    {
      id: "permanentCoinBonus",
      name: "Coin Multiplier",
      icon: "COIN",
      description: "Add a permanent multiplier to all future coin rewards.",
      levels: [
        { cost: 500, label: "+5% coins", value: 0.05 },
        { cost: 1000, label: "+10% coins", value: 0.1 },
        { cost: 2000, label: "+20% coins", value: 0.2 }
      ]
    }
  ];

  const WHEEL_SEGMENTS = [
    { label: "50", value: 50, color: "#60d9ff" },
    { label: "100", value: 100, color: "#8bff72" },
    { label: "150", value: 150, color: "#ffd166" },
    { label: "200", value: 200, color: "#ff8c66" },
    { label: "250", value: 250, color: "#ff66c4" },
    { label: "300", value: 300, color: "#a67cff" },
    { label: "400", value: 400, color: "#7fffd4" },
    { label: "JACKPOT", value: 1000, color: "#ffe55c" }
  ];

  const DAILY_CHALLENGES = [
    { id: "reach_length_30", description: "Reach length 30 in any mode", metric: "maxLength", target: 30, rewardCoins: 250 },
    { id: "eat_3_ai", description: "Eat 3 smaller AI snakes", metric: "aiEaten", target: 3, rewardCoins: 250 },
    { id: "collect_5_powerups", description: "Collect 5 power-ups", metric: "powerUpsCollected", target: 5, rewardCoins: 250 },
    { id: "combo_15", description: "Achieve a combo of 15", metric: "maxCombo", target: 15, rewardCoins: 250 },
    { id: "survive_120_time_attack", description: "Survive 120 seconds in Time Attack", metric: "timeAttackSurvivalMs", target: 120000, rewardCoins: 300 },
    { id: "win_level_no_powerup", description: "Win a level without using any power-up", metric: "campaignWinsWithoutPower", target: 1, rewardCoins: 300 },
    { id: "eat_20_food_maze", description: "Eat 20 food items in Maze Mode", metric: "mazeFoodEaten", target: 20, rewardCoins: 275 },
    { id: "score_1500", description: "Reach a score of 1,500", metric: "maxScore", target: 1500, rewardCoins: 250 },
    { id: "fever_3", description: "Trigger Fever Mode 3 times", metric: "feverActivations", target: 3, rewardCoins: 275 },
    { id: "boss_win", description: "Defeat a Boss Rush boss", metric: "bossWins", target: 1, rewardCoins: 325 },
    { id: "food_12", description: "Eat 12 food items in one run", metric: "foodEaten", target: 12, rewardCoins: 225 },
    { id: "reach_length_45_arcade", description: "Reach length 45 in Arcade", metric: "arcadeMaxLength", target: 45, rewardCoins: 325 },
    { id: "zen_survive_180", description: "Survive 180 seconds in Zen", metric: "zenSurvivalMs", target: 180000, rewardCoins: 275 },
    { id: "complete_2_levels", description: "Win 2 campaign levels today", metric: "levelsWon", target: 2, rewardCoins: 300 },
    { id: "powerup_types_3", description: "Collect 3 different power-up types", metric: "uniquePowerUps", target: 3, rewardCoins: 250 },
    { id: "coins_earn_1200", description: "Earn 1,200 score points in one run", metric: "maxScore", target: 1200, rewardCoins: 240 }
  ];

  const ACHIEVEMENTS = [
    { id: "first_blood", name: "First Blood", description: "Eat your first AI snake", rewardCoins: 50, metric: "totalAISnakesEaten", target: 1 },
    { id: "combo_beginner", name: "Combo Beginner", description: "Reach combo 10", rewardCoins: 100, metric: "highestCombo", target: 10 },
    { id: "combo_master", name: "Combo Master", description: "Reach combo 50", rewardCoins: 500, metric: "highestCombo", target: 50 },
    { id: "powerup_enthusiast", name: "Power-Up Enthusiast", description: "Collect 100 power-ups total", rewardCoins: 200, metric: "totalPowerUpsCollected", target: 100 },
    { id: "snake_collector", name: "Snake Collector", description: "Unlock 10 skins", rewardCoins: 300, metric: "unlockedSkinCount", target: 10 },
    { id: "theme_curator", name: "Theme Curator", description: "Unlock 6 themes", rewardCoins: 200, metric: "unlockedThemeCount", target: 6 },
    { id: "campaign_hero", name: "Campaign Hero", description: "Complete 50 levels", rewardCoins: 500, metric: "completedLevelCount", target: 50 },
    { id: "legendary_slayer", name: "Legendary Slayer", description: "Eat 100 AI snakes", rewardCoins: 750, metric: "totalAISnakesEaten", target: 100 },
    { id: "speed_demon", name: "Speed Demon", description: "Reach Fever Mode 20 times", rewardCoins: 400, metric: "totalFeverActivations", target: 20 },
    { id: "millionaire", name: "Millionaire", description: "Earn 10,000 total coins", rewardCoins: 1000, rewardSkinId: "golden_coin", metric: "lifetimeCoinsEarned", target: 10000 },
    { id: "daily_devotee", name: "Daily Devotee", description: "Achieve a 7-day streak", rewardCoins: 500, metric: "bestStreak", target: 7 },
    { id: "maze_runner", name: "Maze Runner", description: "Complete 20 Maze Mode games", rewardCoins: 300, metric: "mazeGamesCompleted", target: 20 },
    { id: "boss_killer", name: "Boss Killer", description: "Defeat 10 Boss Rush bosses", rewardCoins: 600, metric: "bossRushWins", target: 10 },
    { id: "no_powerup_hero", name: "No Power-Up Hero", description: "Win 5 games without using any power-up", rewardCoins: 250, metric: "winsWithoutPowerUps", target: 5 },
    { id: "perfectionist", name: "Perfectionist", description: "Achieve a combo of 99", rewardCoins: 2000, metric: "highestCombo", target: 99 },
    { id: "level_master", name: "Level Master", description: "Complete all 150 levels", rewardCoins: 5000, rewardSkinId: "cosmic_conqueror", metric: "completedLevelCount", target: 150 },
    { id: "shopaholic", name: "Shopaholic", description: "Buy 10 items from the shop", rewardCoins: 300, metric: "shopPurchases", target: 10 },
    { id: "upgrade_expert", name: "Upgrade Expert", description: "Max out any one upgrade", rewardCoins: 400, metric: "maxedUpgradeCount", target: 1 },
    { id: "skin_unlocker", name: "Skin Unlocker", description: "Equip 15 different skins", rewardCoins: 500, metric: "equippedSkinVariety", target: 15 },
    { id: "true_champion", name: "True Champion", description: "Earn every achievement", rewardCoins: 10000, rewardSkinId: "god_of_snakes", metric: "allOtherAchievements", target: 19 }
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function getLocalDateString(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseLocalDateString(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  function diffCalendarDays(a, b) {
    const dateA = parseLocalDateString(a);
    const dateB = parseLocalDateString(b);
    if (!dateA || !dateB) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((dateB - dateA) / msPerDay);
  }

  function getStreakMultiplier(streak) {
    return STREAK_MULTIPLIERS[Math.max(0, Math.min(6, (streak || 1) - 1))];
  }

  function getTimeUntilNextDay(now = new Date()) {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return Math.max(0, next.getTime() - now.getTime());
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  function getSkinShopPrice(skin) {
    return RARITY_PRICES[skin.rarity] || 0;
  }

  function getThemeShopPrice() {
    return THEME_PRICE;
  }

  function getUpgradeLevelValue(def, level) {
    if (!level || level <= 0) return 0;
    const entry = def.levels[level - 1];
    return entry ? entry.value : 0;
  }

  function makeChallengeState(definition, today, previousId = null) {
    const fallback = DAILY_CHALLENGES.find((entry) => entry.id !== previousId) || DAILY_CHALLENGES[0];
    const selected = definition || fallback;
    return {
      id: selected.id,
      description: selected.description,
      metric: selected.metric,
      target: selected.target,
      rewardCoins: selected.rewardCoins,
      currentProgress: 0,
      completed: false,
      date: today
    };
  }

  global.SnakeProgression = {
    STREAK_MULTIPLIERS,
    RARITY_PRICES,
    THEME_PRICE,
    UPGRADE_DEFS,
    WHEEL_SEGMENTS,
    DAILY_CHALLENGES,
    ACHIEVEMENTS,
    getLocalDateString,
    parseLocalDateString,
    diffCalendarDays,
    getStreakMultiplier,
    getTimeUntilNextDay,
    formatCountdown,
    getSkinShopPrice,
    getThemeShopPrice,
    getUpgradeLevelValue,
    makeChallengeState
  };
})(window);
