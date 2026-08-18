const rewards = window.GameHubRewards;
const coinCountEl = document.getElementById("coin-count");
const backBtn = document.getElementById("btn-back");

function formatNumber(value) {
  if (value === null || value === undefined) return "0";
  if (Number.isNaN(value)) return "0";
  return String(value);
}

function renderStats() {
  if (!rewards?.getStats) return;
  const stats = rewards.getStats();
  const matches = stats.matchesPlayed || 0;
  const wins = stats.wins || 0;
  const losses = stats.losses || Math.max(0, matches - wins);
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const avgDuration = matches > 0 ? Math.round((stats.totalGameDurationSec || 0) / matches) : 0;

  const values = {
    matchesPlayed: matches,
    wins,
    losses,
    winRate,
    totalCoinsEarned: stats.totalCoinsEarned || 0,
    totalCoinsSpent: stats.totalCoinsSpent || 0,
    longestWinStreak: stats.longestWinStreak || 0,
    currentWinStreak: stats.winStreak || 0,
    comebacksWon: stats.comebacksWon || 0,
    fastestWinSec: stats.fastestWinSec || 0,
    avgGameDuration: avgDuration,
    cardsPlayed: stats.cardsPlayed || 0,
    drawCardsTaken: stats.drawCardsTaken || 0,
    draw2Played: stats.draw2Played || 0,
    draw4Played: stats.draw4Played || 0,
    skipPlayed: stats.skipPlayed || 0,
    reversePlayed: stats.reversePlayed || 0,
    wildPlayed: stats.wildPlayed || 0,
    unoCalls: stats.unoCalls || 0,
    maxCardsHeld: stats.maxCardsHeld || 0,
    biggestComeback: stats.biggestComeback || 0,
    mostCardsGiven: stats.mostCardsGiven || 0,
    mostForcedDraws: stats.mostForcedDraws || 0,
    winsWithUno: stats.winsWithUno || 0
  };

  document.querySelectorAll("[data-stat]").forEach((el) => {
    const key = el.getAttribute("data-stat");
    if (!key) return;
    el.textContent = formatNumber(values[key] ?? 0);
  });

  if (coinCountEl) {
    coinCountEl.textContent = formatNumber(rewards.getCoinBalance?.() ?? 0);
  }
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

renderStats();
