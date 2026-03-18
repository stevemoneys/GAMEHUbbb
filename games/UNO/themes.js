const rewards = window.GameHubRewards;
const themes = window.GameHubThemes || [];
const cardPacks = window.GameHubCardPacks || [];

const coinCountEl = document.getElementById("coin-count");
const carouselEl = document.getElementById("theme-carousel");
const cardPackCarouselEl = document.getElementById("card-pack-carousel");
const backBtn = document.getElementById("btn-back");

const OWNED_KEY = "gamehub_uno_themes_owned";
const SELECTED_KEY = "gamehub_uno_theme";
const SELECTED_PATH_KEY = "gamehub_uno_theme_path";
const CARD_PACK_OWNED_KEY = "gamehub_uno_card_packs_owned";
const CARD_PACK_SELECTED_KEY = "gamehub_uno_card_pack";
const CARD_PACK_SELECTED_PATH_KEY = "gamehub_uno_card_pack_path";

function resolveAssetPath(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return window.location.pathname.includes("/game/") ? `../${path}` : path;
}

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getSelectedId(key, fallback = 1) {
  const stored = parseInt(localStorage.getItem(key) || String(fallback), 10);
  return Number.isNaN(stored) ? fallback : stored;
}

function setSelectedTheme(theme) {
  localStorage.setItem(SELECTED_KEY, String(theme.id));
  localStorage.setItem(SELECTED_PATH_KEY, theme.src);
}

function setSelectedCardPack(pack) {
  localStorage.setItem(CARD_PACK_SELECTED_KEY, String(pack.id));
  localStorage.setItem(CARD_PACK_SELECTED_PATH_KEY, pack.src);
}

function setCoinBalance(value) {
  if (coinCountEl) coinCountEl.textContent = String(value);
}

function buildCardMarkup(item, options) {
  const { type, isOwned, isSelected, canAfford, compact = false } = options;
  const isPack = type === "card-pack";
  const cardClass = compact ? "theme-card theme-card--compact" : "theme-card";
  const previewClass = compact ? "theme-preview theme-preview--pack" : "theme-preview";
  const statusLabel = isSelected ? "Active" : isOwned ? "Owned" : "Locked";
  const buyLabel = item.price === 0 ? "Free" : "Buy";
  const lockMarkup = !isOwned
    ? `
        <div class="theme-lock" aria-hidden="true">
          <span class="theme-lock__icon"></span>
        </div>
      `
    : "";
  const previewMarkup = isPack
    ? `
        <div class="theme-pack-bundle" style="--theme-pack-image: url('${resolveAssetPath(item.src)}')">
          <span class="theme-pack-card theme-pack-card--left"></span>
          <span class="theme-pack-card theme-pack-card--middle"></span>
          <span class="theme-pack-card theme-pack-card--right"></span>
        </div>
      `
    : `<img src="${resolveAssetPath(item.src)}" alt="${item.name}" loading="lazy">`;

  return `
    <div class="${cardClass} ${!isOwned ? "is-locked" : ""}">
      <div class="${previewClass}">
        ${previewMarkup}
        ${lockMarkup}
      </div>
      <div class="theme-info">
        <div>
          <div class="theme-name">${item.name}</div>
          <div class="theme-status">${statusLabel}</div>
        </div>
        <div class="theme-price">
          <span class="coin-icon" aria-hidden="true"></span>
          <span>${item.price}</span>
        </div>
      </div>
      <div class="theme-actions">
        <button class="theme-btn buy" type="button" data-shop-type="${type}" data-item-id="${item.id}" ${isOwned || !canAfford ? "disabled" : ""}>
          ${buyLabel}
        </button>
        <button class="theme-btn use" type="button" data-shop-type="${type}" data-item-id="${item.id}" ${isOwned ? "" : "disabled"}>
          Use
        </button>
      </div>
    </div>
  `;
}

function renderThemes() {
  if (carouselEl) carouselEl.innerHTML = "";
  if (cardPackCarouselEl) cardPackCarouselEl.innerHTML = "";

  const ownedThemes = loadList(OWNED_KEY);
  const ownedPacks = loadList(CARD_PACK_OWNED_KEY);
  const selectedThemeId = getSelectedId(SELECTED_KEY, 1);
  const selectedPackId = getSelectedId(CARD_PACK_SELECTED_KEY, 0);
  const balance = rewards?.getCoinBalance?.() ?? 0;

  themes.forEach((theme) => {
    if (!carouselEl) return;
    const isOwned = theme.price === 0 || ownedThemes.includes(theme.id);
    const isSelected = selectedThemeId === theme.id;
    const canAfford = balance >= theme.price;
    carouselEl.insertAdjacentHTML(
      "beforeend",
      buildCardMarkup(theme, { type: "theme", isOwned, isSelected, canAfford })
    );
  });

  cardPacks.forEach((pack) => {
    if (!cardPackCarouselEl) return;
    const isOwned = pack.price === 0 || ownedPacks.includes(pack.id);
    const isSelected = selectedPackId === pack.id;
    const canAfford = balance >= pack.price;
    cardPackCarouselEl.insertAdjacentHTML(
      "beforeend",
      buildCardMarkup(pack, {
        type: "card-pack",
        isOwned,
        isSelected,
        canAfford,
        compact: true
      })
    );
  });
}

function handleBuy(itemId, type) {
  const isPack = type === "card-pack";
  const list = isPack ? cardPacks : themes;
  const storageKey = isPack ? CARD_PACK_OWNED_KEY : OWNED_KEY;
  const item = list.find((entry) => entry.id === itemId);
  if (!item) return;

  const owned = loadList(storageKey);
  if (item.price === 0 || owned.includes(item.id)) return;

  const balance = rewards?.getCoinBalance?.() ?? 0;
  if (balance < item.price) return;

  if (rewards?.spendCoins) rewards.spendCoins(item.price);
  else rewards?.setCoinBalance?.(balance - item.price);

  owned.push(item.id);
  saveList(storageKey, owned);
  setCoinBalance(rewards?.getCoinBalance?.() ?? balance - item.price);
  renderThemes();
}

function handleUse(itemId, type) {
  const isPack = type === "card-pack";
  const list = isPack ? cardPacks : themes;
  const storageKey = isPack ? CARD_PACK_OWNED_KEY : OWNED_KEY;
  const item = list.find((entry) => entry.id === itemId);
  if (!item) return;

  const owned = loadList(storageKey);
  if (!(item.price === 0 || owned.includes(item.id))) return;

  if (isPack) setSelectedCardPack(item);
  else setSelectedTheme(item);
  renderThemes();
}

function handleCarouselClick(event) {
  const buyBtn = event.target.closest(".theme-btn.buy");
  if (buyBtn) {
    handleBuy(
      parseInt(buyBtn.dataset.itemId || "0", 10),
      buyBtn.dataset.shopType || "theme"
    );
    return;
  }

  const useBtn = event.target.closest(".theme-btn.use");
  if (useBtn) {
    handleUse(
      parseInt(useBtn.dataset.itemId || "0", 10),
      useBtn.dataset.shopType || "theme"
    );
  }
}

if (carouselEl) {
  carouselEl.addEventListener("click", handleCarouselClick);
}

if (cardPackCarouselEl) {
  cardPackCarouselEl.addEventListener("click", handleCarouselClick);
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
