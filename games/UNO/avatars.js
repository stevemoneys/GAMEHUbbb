const avatarGrid = document.getElementById("avatar-grid");
const backBtn = document.getElementById("btn-back");
const avatars = window.GameHubAvatars || [];
const PROGRESS_KEY = "gamehub_uno_progress";
const AVATAR_KEY = "gamehub_uno_avatar";

function getProgress() {
  const stored = parseInt(localStorage.getItem(PROGRESS_KEY) || "1", 10);
  if (Number.isNaN(stored) || stored < 1) return 1;
  return Math.min(stored, 100);
}

function getUnlockedCount() {
  const progress = getProgress();
  return Math.min(20, 1 + Math.floor((progress - 1) / 5));
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
