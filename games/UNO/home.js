const avatarBtn = document.getElementById("avatar-btn");
const avatarLabel = document.getElementById("avatar-label");
const coinCountEl = document.getElementById("coin-count");
const playerLevelEl = document.getElementById("player-level");
const dailyBtn = document.querySelector('.action-icon[data-action="daily-reward"]');
const settingsBtn = document.querySelector(".settings-btn");
const avatars = window.GameHubAvatars || [];
const rewards = window.GameHubRewards;

const AVATAR_KEY = "gamehub_uno_avatar";
const MODE_KEY = "gamehub_uno_home_mode";
const MODE_CONFIG = {
  tournament: {
    progressKey: "gamehub_uno_progress_tournament",
    levelsUrl: "levels.html?mode=tournament"
  },
  "quick-play": {
    progressKey: "gamehub_uno_progress_quick_play",
    levelsUrl: "levels.html?mode=quick-play"
  },
  "team-battle": {
    progressKey: "gamehub_uno_progress_team_battle",
    levelsUrl: "levels.html?mode=team-battle"
  }
};

function getSelectedMode() {
  const stored = localStorage.getItem(MODE_KEY) || "tournament";
  return MODE_CONFIG[stored] ? stored : "tournament";
}

function goToMode(mode) {
  const safeMode = MODE_CONFIG[mode] ? mode : "tournament";
  localStorage.setItem(MODE_KEY, safeMode);
  window.location.href = MODE_CONFIG[safeMode].levelsUrl;
}

document.querySelector(".play-btn")?.addEventListener("click", () => {
  goToMode("tournament");
});

document.querySelectorAll(".mode-card[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    goToMode(btn.dataset.mode || "tournament");
  });
});

function getSelectedAvatar() {
  const stored = parseInt(localStorage.getItem(AVATAR_KEY) || "1", 10);
  if (Number.isNaN(stored)) return 1;
  return stored;
}

function setAvatarButton() {
  if (!avatarBtn || avatars.length === 0) return;
  const selectedId = getSelectedAvatar();
  const selected = avatars.find((a) => a.id === selectedId) || avatars[0];
  if (selected.src) {
    avatarBtn.style.backgroundImage = `url(${resolveAssetPath(selected.src)})`;
    avatarBtn.style.backgroundSize = "cover";
    avatarBtn.style.backgroundPosition = "center";
    if (avatarLabel) avatarLabel.textContent = "";
  } else {
    avatarBtn.style.background = `radial-gradient(circle at 30% 30%, #ffffff, ${selected.color} 65%)`;
    if (avatarLabel) avatarLabel.textContent = selected.label;
  }
}

function resolveAssetPath(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  const inGame = window.location.pathname.includes("/game/");
  return inGame ? `../${path}` : path;
}

if (avatarBtn) {
  avatarBtn.addEventListener("click", () => {
    window.location.href = "avatars.html";
  });
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    window.location.href = "settings.html";
  });
}

setAvatarButton();

function updatePlayerLevel() {
  if (!playerLevelEl) return;
  const mode = getSelectedMode();
  const progressKey = MODE_CONFIG[mode].progressKey;
  const stored = localStorage.getItem(progressKey);
  const fallback = localStorage.getItem("gamehub_uno_progress") || "1";
  const progress = parseInt(stored || fallback, 10);
  const safe = Number.isNaN(progress) || progress < 1 ? 1 : progress;
  const level = Math.min(10, Math.ceil(safe / 10));
  playerLevelEl.textContent = `Level ${level}`;
}

updatePlayerLevel();

if (coinCountEl) {
  const balance = rewards?.getCoinBalance ? rewards.getCoinBalance() : 1200;
  coinCountEl.textContent = String(balance);
}

if (dailyBtn && rewards?.getDailyInfo) {
  const info = rewards.getDailyInfo();
  dailyBtn.classList.toggle("is-claimable", info.canClaim);
  dailyBtn.classList.toggle("is-claimed", !info.canClaim);
}

function updateRewardBadge() {
  if (!dailyBtn || !rewards) return;
  const queue = rewards.getRewardQueue ? rewards.getRewardQueue() : [];
  const dailyInfo = rewards.getDailyInfo ? rewards.getDailyInfo() : { canClaim: false };
  const hasRewards = (queue?.length || 0) > 0 || dailyInfo.canClaim;
  dailyBtn.classList.toggle("has-badge", hasRewards);
}

updateRewardBadge();

document.querySelectorAll(".action-icon").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.getAttribute("data-action");
    if (action === "daily-reward") window.location.href = "rewards.html";
    if (action === "customize") window.location.href = "themes.html";
    if (action === "stats") window.location.href = "stats.html";
  });
});
