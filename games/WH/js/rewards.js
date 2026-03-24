(() => {
  const COIN_KEY = "whot_coins";
  const DAILY_KEY = "whot_daily";
  const QUEUE_KEY = "whot_reward_queue";
  const STATS_KEY = "whot_reward_stats";

  const DAILY_REWARDS = [200, 300, 500, 650, 800, 900, 1100];
  const COMBO_WINDOW_MS = 4500;

  const defaultStats = {
    matchesPlayed: 0,
    wins: 0,
    cardsPlayed: 0,
    whotUsed: 0,
    winStreak: 0,
    win10Cycles: 0,
    play50Cycles: 0,
    whot20Cycles: 0,
    comboTriggers: 0,
    streak3RewardCount: 0,
    lastComboAt: 0
  };

  let matchState = {
    playerDrawCount: 0,
    usedPick2: false,
    usedPick3: false,
    usedHoldOn: false,
    playTimes: [],
    comboTriggeredThisMatch: false
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

  function loadStats() {
    const stats = loadJSON(STATS_KEY, defaultStats);
    return { ...defaultStats, ...stats };
  }

  function saveStats(stats) {
    saveJSON(STATS_KEY, stats);
  }

  function getCoinBalance() {
    const stored = parseInt(localStorage.getItem(COIN_KEY) || "1200", 10);
    return Number.isNaN(stored) ? 1200 : stored;
  }

  function setCoinBalance(value) {
    localStorage.setItem(COIN_KEY, String(Math.max(0, Math.floor(value))));
  }

  function addCoins(amount) {
    const current = getCoinBalance();
    const next = current + Math.max(0, Math.floor(amount || 0));
    setCoinBalance(next);
    return { current, next };
  }

  function spendCoins(amount) {
    const current = getCoinBalance();
    const next = Math.max(0, current - Math.max(0, Math.floor(amount || 0)));
    setCoinBalance(next);
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
      title: reward?.title || "Reward",
      amount: Math.max(0, Math.floor(reward?.amount || 0))
    };
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
    return { ...info, current, next };
  }

  function startMatch() {
    matchState = {
      playerDrawCount: 0,
      usedPick2: false,
      usedPick3: false,
      usedHoldOn: false,
      playTimes: [],
      comboTriggeredThisMatch: false
    };
  }

  function recordPlayerDraw(count = 1) {
    matchState.playerDrawCount += Math.max(1, Math.floor(count));
  }

  function recordPlayerCardPlayed(card) {
    if (!card) return { comboTriggered: false };
    const stats = loadStats();
    stats.cardsPlayed += 1;

    if (card.shape === "WHOT") stats.whotUsed += 1;
    if (card.number === 2) matchState.usedPick2 = true;
    if (card.number === 5) matchState.usedPick3 = true;
    if (card.number === 1) matchState.usedHoldOn = true;

    const now = Date.now();
    matchState.playTimes = [...matchState.playTimes.filter((ts) => now - ts <= COMBO_WINDOW_MS), now];

    let comboTriggered = false;
    if (matchState.playTimes.length >= 3 && !matchState.comboTriggeredThisMatch) {
      comboTriggered = true;
      matchState.comboTriggeredThisMatch = true;
      stats.comboTriggers += 1;
      stats.lastComboAt = now;
      enqueueReward({ title: "Combo!", amount: 350 });
    }

    while (stats.cardsPlayed >= (stats.play50Cycles + 1) * 50) {
      enqueueReward({ title: "Play 50 Cards", amount: 400 });
      stats.play50Cycles += 1;
    }

    while (stats.whotUsed >= (stats.whot20Cycles + 1) * 20) {
      enqueueReward({ title: "Use WHOT 20 Times", amount: 300 });
      stats.whot20Cycles += 1;
    }

    saveStats(stats);
    return { comboTriggered };
  }

  function recordMatchResult({ won }) {
    const stats = loadStats();
    stats.matchesPlayed += 1;

    const events = [];

    if (won) {
      stats.wins += 1;
      stats.winStreak += 1;
      enqueueReward({ title: "Game Won", amount: 200 });
      events.push("win");

      while (stats.wins >= (stats.win10Cycles + 1) * 10) {
        enqueueReward({ title: "Win 10 Games", amount: 3000 });
        stats.win10Cycles += 1;
        events.push("win10");
      }

      if (matchState.playerDrawCount === 0) {
        enqueueReward({ title: "Win Without Drawing", amount: 1000 });
        events.push("noDraw");
      }

      if (!matchState.usedPick2) {
        enqueueReward({ title: "Win Without Using Pick 2", amount: 500 });
        events.push("noPick2");
      }

      if (!matchState.usedPick3) {
        enqueueReward({ title: "Win Without Using Pick 3", amount: 700 });
        events.push("noPick3");
      }

      if (!matchState.usedHoldOn) {
        enqueueReward({ title: "Win Without Using Hold On", amount: 650 });
        events.push("noHoldOn");
      }

      if (stats.winStreak === 3) {
        enqueueReward({ title: "Win Streak!", amount: 900 });
        stats.streak3RewardCount += 1;
        events.push("streak3");
      }
    } else {
      stats.winStreak = 0;
    }

    saveStats(stats);
    return {
      events,
      matchState: { ...matchState },
      stats: { ...stats }
    };
  }

  function getMissionProgress() {
    const stats = loadStats();
    const win10Progress = stats.wins % 10;
    const play50Progress = stats.cardsPlayed % 50;
    const whot20Progress = stats.whotUsed % 20;
    return [
      {
        id: "win10",
        title: "Win 10 games",
        reward: 3000,
        progress: win10Progress,
        target: 10,
        completed: false,
        cycles: stats.win10Cycles
      },
      {
        id: "play50",
        title: "Play 50 cards",
        reward: 400,
        progress: play50Progress,
        target: 50,
        completed: false,
        cycles: stats.play50Cycles
      },
      {
        id: "whot20",
        title: "Use WHOT 20 times",
        reward: 300,
        progress: whot20Progress,
        target: 20,
        completed: false,
        cycles: stats.whot20Cycles
      }
    ];
  }

  window.WHRewards = {
    getCoinBalance,
    setCoinBalance,
    addCoins,
    spendCoins,
    getRewardQueue,
    enqueueReward,
    claimReward,
    getDailyInfo,
    getDailySchedule,
    claimDailyReward,
    startMatch,
    recordPlayerDraw,
    recordPlayerCardPlayed,
    recordMatchResult,
    getMissionProgress,
    getStats: loadStats
  };
})();
