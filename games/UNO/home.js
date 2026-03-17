const avatarBtn = document.getElementById("avatar-btn");
const avatarLabel = document.getElementById("avatar-label");
const coinCountEl = document.getElementById("coin-count");
const playerLevelEl = document.getElementById("player-level");
const dailyBtn = document.querySelector('.action-icon[data-action="daily-reward"]');
const avatars = window.GameHubAvatars || [];
const rewards = window.GameHubRewards;
const AVATAR_KEY = "gamehub_uno_avatar";
const PROGRESS_KEY = "gamehub_uno_progress";

document.querySelector(".play-btn").addEventListener("click", () => {
  window.location.href = "levels.html";
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

setAvatarButton();

function updatePlayerLevel() {
  if (!playerLevelEl) return;
  const progress = parseInt(localStorage.getItem(PROGRESS_KEY) || "1", 10);
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
