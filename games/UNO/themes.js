const rewards = window.GameHubRewards;
const themes = window.GameHubThemes || [];

const coinCountEl = document.getElementById("coin-count");
const carouselEl = document.getElementById("theme-carousel");
const backBtn = document.getElementById("btn-back");

const OWNED_KEY = "gamehub_uno_themes_owned";
const SELECTED_KEY = "gamehub_uno_theme";
const SELECTED_PATH_KEY = "gamehub_uno_theme_path";

function resolveAssetPath(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return window.location.pathname.includes("/game/") ? `../${path}` : path;
}

function loadOwned() {
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveOwned(list) {
  localStorage.setItem(OWNED_KEY, JSON.stringify(list));
}

function getSelectedId() {
  const stored = parseInt(localStorage.getItem(SELECTED_KEY) || "1", 10);
  return Number.isNaN(stored) ? 1 : stored;
}

function setSelectedTheme(theme) {
  localStorage.setItem(SELECTED_KEY, String(theme.id));
  localStorage.setItem(SELECTED_PATH_KEY, theme.src);
}

function setCoinBalance(value) {
  if (coinCountEl) coinCountEl.textContent = String(value);
}

function renderThemes() {
  if (!carouselEl) return;
  carouselEl.innerHTML = "";

  const owned = loadOwned();
  const selectedId = getSelectedId();
  const balance = rewards?.getCoinBalance?.() ?? 0;

  themes.forEach((theme) => {
    const isOwned = theme.price === 0 || owned.includes(theme.id);
    const isSelected = selectedId === theme.id;
    const canAfford = balance >= theme.price;

    const card = document.createElement("div");
    card.className = "theme-card";
    card.innerHTML = `
      <div class="theme-preview">
        <img src="${resolveAssetPath(theme.src)}" alt="${theme.name}">
      </div>
      <div class="theme-info">
        <div>
          <div class="theme-name">${theme.name}</div>
          <div class="theme-status">${isSelected ? "Active" : isOwned ? "Owned" : "Not owned"}</div>
        </div>
        <div class="theme-price">
          <span class="coin-icon" aria-hidden="true"></span>
          <span>${theme.price}</span>
        </div>
      </div>
      <div class="theme-actions">
        <button class="theme-btn buy" type="button" data-theme-id="${theme.id}" ${isOwned || !canAfford ? "disabled" : ""}>
          Buy
        </button>
        <button class="theme-btn use" type="button" data-theme-id="${theme.id}" ${isOwned ? "" : "disabled"}>
          Use
        </button>
      </div>
    `;
    carouselEl.appendChild(card);
  });
}

function handleBuy(themeId) {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return;
  const owned = loadOwned();
  if (theme.price === 0 || owned.includes(theme.id)) return;
  const balance = rewards?.getCoinBalance?.() ?? 0;
  if (balance < theme.price) return;
  if (rewards?.spendCoins) rewards.spendCoins(theme.price);
  else rewards?.setCoinBalance?.(balance - theme.price);
  owned.push(theme.id);
  saveOwned(owned);
  const nextBalance = rewards?.getCoinBalance?.() ?? balance - theme.price;
  setCoinBalance(nextBalance);
  renderThemes();
}

function handleUse(themeId) {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return;
  const owned = loadOwned();
  if (!(theme.price === 0 || owned.includes(theme.id))) return;
  setSelectedTheme(theme);
  renderThemes();
}

if (carouselEl) {
  carouselEl.addEventListener("click", (event) => {
    const buyBtn = event.target.closest(".theme-btn.buy");
    if (buyBtn) {
      handleBuy(parseInt(buyBtn.dataset.themeId || "0", 10));
      return;
    }
    const useBtn = event.target.closest(".theme-btn.use");
    if (useBtn) {
      handleUse(parseInt(useBtn.dataset.themeId || "0", 10));
    }
  });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

if (rewards) {
  setCoinBalance(rewards.getCoinBalance());
}

renderThemes();
