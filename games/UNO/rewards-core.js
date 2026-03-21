(() => {
  const COIN_KEY = "gamehub_uno_coins";
  const QUEUE_KEY = "gamehub_uno_reward_queue";
  const STATS_KEY = "gamehub_uno_reward_stats";
  const ACH_KEY = "gamehub_uno_reward_achievements";
  const DAILY_KEY = "gamehub_uno_daily";

  const DAILY_REWARDS = [200, 300, 500, 650, 800, 900, 1100];

  const defaultStats = {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winStreak: 0,
    longestWinStreak: 0,
    lastStreakReward: 0,
    cardsPlayed: 0,
    drawCardsTaken: 0,
    draw2Played: 0,
    draw4Played: 0,
    skipPlayed: 0,
    reversePlayed: 0,
    wildPlayed: 0,
    unoCalls: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    totalGameDurationSec: 0,
    fastestWinSec: null,
    maxCardsHeld: 0,
    comebacksWon: 0,
    biggestComeback: 0,
    winsWithUno: 0,
    mostCardsGiven: 0,
    mostForcedDraws: 0,
    matchStart: 0,
    matchMaxDeficit: 0,
    matchForcedDraws: 0,
    matchCardsGiven: 0,
    matchMaxHand: 0,
    calledUnoThisMatch: false
  };

  const defaultAchievements = {
    firstWin: false,
    win5: false,
    play3: false,
    play100cards: false
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getCoinBalance() {
    const stored = parseInt(localStorage.getItem(COIN_KEY) || "1200", 10);
    return Number.isNaN(stored) ? 1200 : stored;
  }

  function setCoinBalance(value) {
    localStorage.setItem(COIN_KEY, String(value));
  }

  function addCoins(amount) {
    const current = getCoinBalance();
    const next = current + amount;
    setCoinBalance(next);
    return { current, next };
  }

  function spendCoins(amount) {
    const current = getCoinBalance();
    const next = Math.max(0, current - amount);
    setCoinBalance(next);
    const stats = loadStats();
    stats.totalCoinsSpent += amount;
    saveStats(stats);
    return { current, next };
  }

  function getRewardQueue() {
    const list = loadJSON(QUEUE_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveRewardQueue(list) {
    saveJSON(QUEUE_KEY, list);
  }

  function enqueueReward(reward) {
    const list = getRewardQueue();
    const entry = {
      entryId: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      earnedAt: Date.now(),
      ...reward
    };
    const stats = loadStats();
    stats.totalCoinsEarned += reward.amount || 0;
    saveStats(stats);
    list.push(entry);
    saveRewardQueue(list);
    return entry;
  }

  function claimReward(entryId) {
    const list = getRewardQueue();
    const index = list.findIndex((item) => item.entryId === entryId);
    if (index === -1) return null;
    const [entry] = list.splice(index, 1);
    saveRewardQueue(list);
    const { current, next } = addCoins(entry.amount);
    return { entry, current, next };
  }

  function loadStats() {
    const stats = loadJSON(STATS_KEY, defaultStats);
    return { ...defaultStats, ...stats };
  }

  function saveStats(stats) {
    saveJSON(STATS_KEY, stats);
  }

  function loadAchievements() {
    const achievements = loadJSON(ACH_KEY, defaultAchievements);
    return { ...defaultAchievements, ...achievements };
  }

  function saveAchievements(achievements) {
    saveJSON(ACH_KEY, achievements);
  }

  function recordCardPlayed(playerIndex, card) {
    if (playerIndex !== 0 || !card) return;
    const stats = loadStats();
    const achievements = loadAchievements();

    stats.cardsPlayed += 1;
    if (card.type === "wild") stats.wildPlayed += 1;
    if (card.value === "draw2") {
      stats.draw2Played += 1;
      stats.matchCardsGiven += 2;
    }
    if (card.value === "wild4") {
      stats.draw4Played += 1;
      stats.matchCardsGiven += 4;
    }
    if (card.value === "skip") stats.skipPlayed += 1;
    if (card.value === "reverse") stats.reversePlayed += 1;

    if (card.value === "wild4") {
      enqueueReward({ title: "Use Draw 4", amount: 50 });
    }
    if (card.value === "reverse") {
      enqueueReward({ title: "Use Reverse", amount: 30 });
    }
    if (stats.cardsPlayed >= 100 && !achievements.play100cards) {
      enqueueReward({ title: "Play 100 Cards", amount: 300 });
      achievements.play100cards = true;
    }

    saveStats(stats);
    saveAchievements(achievements);
  }

  function recordUnoCall(playerIndex) {
    if (playerIndex !== 0) return;
    const stats = loadStats();
    stats.calledUnoThisMatch = true;
    stats.unoCalls += 1;
    saveStats(stats);
  }

  function recordDraw(playerIndex, count = 1, wasPenalty = false) {
    if (playerIndex !== 0) return;
    const stats = loadStats();
    stats.drawCardsTaken += count;
    if (wasPenalty) stats.matchForcedDraws += count;
    saveStats(stats);
  }

  function recordHandSnapshot(playerIndex, handSize, opponentSizes = []) {
    if (playerIndex !== 0) return;
    const stats = loadStats();
    stats.maxCardsHeld = Math.max(stats.maxCardsHeld, handSize);
    stats.matchMaxHand = Math.max(stats.matchMaxHand, handSize);
    if (opponentSizes.length > 0) {
      const minOpp = Math.min(...opponentSizes);
      const deficit = handSize - minOpp;
      stats.matchMaxDeficit = Math.max(stats.matchMaxDeficit, deficit);
    }
    saveStats(stats);
  }

  function recordMatchResult({ winnerIndex, placements }) {
    const stats = loadStats();
    const achievements = loadAchievements();
    const placement = placements?.[0] ?? 4;
    const now = Date.now();
    const durationSec = stats.matchStart ? Math.max(1, Math.round((now - stats.matchStart) / 1000)) : 0;

    stats.matchesPlayed += 1;
    if (winnerIndex === 0) {
      stats.wins += 1;
      stats.winStreak += 1;
      stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.winStreak);
      if (durationSec > 0) {
        stats.totalGameDurationSec += durationSec;
        if (!stats.fastestWinSec || durationSec < stats.fastestWinSec) stats.fastestWinSec = durationSec;
      }
    } else {
      stats.losses += 1;
      stats.winStreak = 0;
      stats.lastStreakReward = 0;
      if (durationSec > 0) stats.totalGameDurationSec += durationSec;
    }

    if (placement === 1) enqueueReward({ title: "Win", amount: 100 });
    if (placement === 2) enqueueReward({ title: "Second Place", amount: 60 });
    if (placement === 3) enqueueReward({ title: "Third Place", amount: 30 });
    if (placement >= 4) enqueueReward({ title: "Last Place", amount: 15 });

    if (winnerIndex === 0 && !achievements.firstWin) {
      enqueueReward({ title: "First Win", amount: 100 });
      achievements.firstWin = true;
    }
    if (stats.wins >= 5 && !achievements.win5) {
      enqueueReward({ title: "Win 5 Matches", amount: 200 });
      achievements.win5 = true;
    }
    if (stats.matchesPlayed >= 3 && !achievements.play3) {
      enqueueReward({ title: "Play 3 Matches", amount: 50 });
      achievements.play3 = true;
    }

    if (stats.winStreak >= 2 && stats.lastStreakReward < 2) {
      enqueueReward({ title: "2 Wins Streak", amount: 50 });
      stats.lastStreakReward = 2;
    }
    if (stats.winStreak >= 3 && stats.lastStreakReward < 3) {
      enqueueReward({ title: "3 Wins Streak", amount: 100 });
      stats.lastStreakReward = 3;
    }
    if (stats.winStreak >= 5 && stats.lastStreakReward < 5) {
      enqueueReward({ title: "5 Wins Streak", amount: 300 });
      stats.lastStreakReward = 5;
    }

    if (winnerIndex === 0 && stats.calledUnoThisMatch) {
      enqueueReward({ title: "Win with 1 Card Left", amount: 70 });
      stats.winsWithUno += 1;
    }

    if (winnerIndex === 0 && stats.matchMaxDeficit >= 5) {
      stats.comebacksWon += 1;
      stats.biggestComeback = Math.max(stats.biggestComeback, stats.matchMaxDeficit);
    }

    stats.mostCardsGiven = Math.max(stats.mostCardsGiven, stats.matchCardsGiven);
    stats.mostForcedDraws = Math.max(stats.mostForcedDraws, stats.matchForcedDraws);

    stats.calledUnoThisMatch = false;
    stats.matchMaxDeficit = 0;
    stats.matchForcedDraws = 0;
    stats.matchCardsGiven = 0;
    stats.matchMaxHand = 0;
    stats.matchStart = 0;
    saveStats(stats);
    saveAchievements(achievements);
  }

  function startNewMatch() {
    const stats = loadStats();
    stats.calledUnoThisMatch = false;
    stats.matchMaxDeficit = 0;
    stats.matchForcedDraws = 0;
    stats.matchCardsGiven = 0;
    stats.matchMaxHand = 0;
    stats.matchStart = Date.now();
    saveStats(stats);
  }

  function formatDateKey(date) {
    return date.toLocaleDateString("en-CA");
  }

  function getDailyInfo() {
    const state = loadJSON(DAILY_KEY, {});
    const today = new Date();
    const todayKey = formatDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    const lastClaim = state.lastClaim || "";
    const streak = typeof state.streak === "number" ? state.streak : 0;
    const alreadyClaimed = lastClaim === todayKey;
    const nextStreak = alreadyClaimed
      ? Math.max(1, Math.min(streak || 1, DAILY_REWARDS.length))
      : (lastClaim === yesterdayKey ? Math.min(streak + 1, DAILY_REWARDS.length) : 1);
    const dayIndex = Math.max(1, Math.min(nextStreak, DAILY_REWARDS.length));

    return {
      canClaim: !alreadyClaimed,
      day: dayIndex,
      amount: DAILY_REWARDS[dayIndex - 1]
    };
  }

  function getDailySchedule() {
    return DAILY_REWARDS.slice();
  }

  function claimDailyReward() {
    const info = getDailyInfo();
    if (!info.canClaim) return null;
    const todayKey = formatDateKey(new Date());
    saveJSON(DAILY_KEY, { lastClaim: todayKey, streak: info.day });
    const { current, next } = addCoins(info.amount);
    const stats = loadStats();
    stats.totalCoinsEarned += info.amount;
    saveStats(stats);
    return { ...info, current, next };
  }

  window.GameHubRewards = {
    getCoinBalance,
    setCoinBalance,
    addCoins,
    spendCoins,
    getRewardQueue,
    claimReward,
    enqueueReward,
    recordCardPlayed,
    recordDraw,
    recordHandSnapshot,
    recordUnoCall,
    recordMatchResult,
    startNewMatch,
    getDailyInfo,
    getDailySchedule,
    claimDailyReward,
    getStats: loadStats
  };
})();
