const avatarGrid = document.getElementById("avatar-grid");
const backBtn = document.getElementById("btn-back");
const avatars = window.GameHubAvatars || [];
const PROGRESS_KEYS = [
  "gamehub_uno_progress",
  "gamehub_uno_progress_tournament",
  "gamehub_uno_progress_quick_play",
  "gamehub_uno_progress_team_battle"
];
const AVATAR_KEY = "gamehub_uno_avatar";

function getProgress() {
  const values = PROGRESS_KEYS.map((key) => {
    const parsed = parseInt(localStorage.getItem(key) || "1", 10);
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return parsed;
  });
  return Math.min(Math.max(...values), 100);
}

function getUnlockedCount() {
  const progress = getProgress();
  return Math.min(20, progress);
}

function getSelectedAvatar() {
  const stored = parseInt(localStorage.getItem(AVATAR_KEY) || "1", 10);
  return Number.isNaN(stored) ? 1 : stored;
}

function setSelectedAvatar(id) {
  localStorage.setItem(AVATAR_KEY, String(id));
}

function renderAvatars() {
  if (!avatarGrid) return;
  const unlockedCount = getUnlockedCount();
  const selected = getSelectedAvatar();
  avatarGrid.innerHTML = "";

  avatars.forEach((avatar, index) => {
    const isUnlocked = index + 1 <= unlockedCount;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "avatar-card";
    if (!isUnlocked) card.classList.add("locked");
    if (avatar.id === selected) card.classList.add("selected");

    const circle = document.createElement("div");
    circle.className = "avatar-circle";
    if (avatar.src) {
      circle.style.backgroundImage = `url(${resolveAssetPath(avatar.src)})`;
      circle.style.backgroundSize = "cover";
      circle.style.backgroundPosition = "center";
      circle.textContent = "";
    } else {
      circle.style.background = `radial-gradient(circle at 30% 30%, #ffffff, ${avatar.color})`;
      circle.textContent = avatar.label;
    }

    const label = document.createElement("div");
    label.className = "avatar-label";
    label.textContent = avatar.name ? `${avatar.name}` : `Avatar ${avatar.id}`;

    card.appendChild(circle);
    card.appendChild(label);

    card.addEventListener("click", () => {
      if (!isUnlocked) return;
      setSelectedAvatar(avatar.id);
      renderAvatars();
    });

    avatarGrid.appendChild(card);
  });
}

function resolveAssetPath(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  const inGame = window.location.pathname.includes("/game/");
  return inGame ? `../${path}` : path;
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

renderAvatars();
