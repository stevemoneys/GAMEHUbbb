const rewards = window.GameHubRewards;
const themes = window.GameHubThemes || [];
const cardPacks = window.GameHubCardPacks || [];
const powerUps = [];

const coinCountEl = document.getElementById("coin-count");
const carouselEl = document.getElementById("theme-carousel");
const cardPackCarouselEl = document.getElementById("card-pack-carousel");
const powerUpCarouselEl = document.getElementById("powerup-carousel");
const backBtn = document.getElementById("btn-back");

const OWNED_KEY = "gamehub_uno_themes_owned";
const SELECTED_KEY = "gamehub_uno_theme";
const SELECTED_PATH_KEY = "gamehub_uno_theme_path";
const CARD_PACK_OWNED_KEY = "gamehub_uno_card_packs_owned";
const CARD_PACK_SELECTED_KEY = "gamehub_uno_card_pack";
const CARD_PACK_SELECTED_PATH_KEY = "gamehub_uno_card_pack_path";
const POWERUP_COUNTS_KEY = "gamehub_uno_powerup_counts";
const POWERUP_EQUIPPED_KEY = "gamehub_uno_powerup_equipped";
const MAX_EQUIPPED_POWERUPS = 4;

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

function loadMap(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

function saveMap(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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

function showSkin(previewEl, src) {
  if (!previewEl) return;
  previewEl.style.backgroundImage = `url('${resolveAssetPath(src)}')`;
}

function animatePreview() {
  const previews = document.querySelectorAll(".card-preview");
  previews.forEach((preview, index) => {
    if (!(preview instanceof HTMLElement)) return;
    if (preview.dataset.animated === "1") return;
    preview.dataset.animated = "1";
    let angle = 40 + ((index % 4) * 4);
    setInterval(() => {
      angle += 0.65;
      const bob = Math.sin(angle / 12) * 6;
      preview.style.transform = `rotateY(${angle}deg) rotateX(10deg) translateY(${bob}px)`;
    }, 50);
  });
}

function getPowerUpCount(id) {
  const counts = loadMap(POWERUP_COUNTS_KEY);
  const stored = parseInt(String(counts[id] ?? 0), 10);
  return Number.isNaN(stored) ? 0 : Math.max(0, stored);
}

function getEquippedPowerUps() {
  return loadList(POWERUP_EQUIPPED_KEY).slice(0, MAX_EQUIPPED_POWERUPS);
}

function buildCardMarkup(item, options) {
  const {
    type,
    isOwned,
    isSelected,
    canAfford,
    compact = false,
    count = 0,
    isEquipped = false
  } = options;
  const isPack = type === "card-pack";
  const isPowerUp = type === "power-up";
  const cardClass = compact ? "theme-card theme-card--compact" : "theme-card";
  const previewClass = compact ? "theme-preview theme-preview--pack" : "theme-preview";
  const lockMarkup = !isPowerUp && !isOwned
    ? `
        <div class="theme-lock" aria-hidden="true">
          <span class="theme-lock__icon"></span>
        </div>
      `
    : "";

  const statusLabel = isPowerUp
    ? (isEquipped ? "Equipped" : count > 0 ? `Owned x${count}` : "Locked")
    : (isSelected ? "Active" : isOwned ? "Owned" : "Locked");
  const buyLabel = isPowerUp ? "Buy +1" : item.price === 0 ? "Free" : "Buy";
  const useLabel = isPowerUp ? (isEquipped ? "Unequip" : "Equip") : "Use";
  const previewMarkup = isPowerUp
      ? `
        <div class="powerup-preview">
          <span class="powerup-icon" aria-hidden="true">${item.icon}</span>
        </div>
      `
      : `
        <div class="skin-preview-container">
          <div class="card-preview" id="cardPreview-${type}-${item.id}"></div>
        </div>
      `;

  return `
    <div class="${cardClass} ${!isOwned && !isPowerUp ? "is-locked" : ""} ${isEquipped ? "is-equipped" : ""}">
      <div class="${isPowerUp ? "" : previewClass}">
        ${previewMarkup}
        ${lockMarkup}
      </div>
      <div class="theme-info">
        <div class="theme-meta">
          <div class="theme-name">${item.name}</div>
          <div class="theme-status">${statusLabel}</div>
        </div>
        <div class="theme-price">
          <span class="coin-icon" aria-hidden="true"></span>
          <span>${item.price}</span>
        </div>
      </div>
      <div class="theme-actions">
        <button class="theme-btn buy" type="button" data-shop-type="${type}" data-item-id="${item.id}" ${(isPowerUp ? false : isOwned) || !canAfford ? "disabled" : ""}>
          ${buyLabel}
        </button>
        <button class="theme-btn use" type="button" data-shop-type="${type}" data-item-id="${item.id}" ${(isPowerUp ? count > 0 : isOwned) ? "" : "disabled"}>
          ${useLabel}
        </button>
      </div>
      ${isPowerUp ? `<p class="theme-status">${item.description}</p>` : ""}
    </div>
  `;
}

function renderThemes() {
  if (carouselEl) carouselEl.innerHTML = "";
  if (cardPackCarouselEl) cardPackCarouselEl.innerHTML = "";
  if (powerUpCarouselEl) powerUpCarouselEl.innerHTML = "";

  const ownedThemes = loadList(OWNED_KEY);
  const ownedPacks = loadList(CARD_PACK_OWNED_KEY);
  const selectedThemeId = getSelectedId(SELECTED_KEY, 1);
  const selectedPackId = getSelectedId(CARD_PACK_SELECTED_KEY, 0);
  const equippedPowerUps = getEquippedPowerUps();
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

  powerUps.forEach((powerUp) => {
    if (!powerUpCarouselEl) return;
    const count = getPowerUpCount(powerUp.id);
    const isEquipped = equippedPowerUps.includes(powerUp.id);
    const canAfford = balance >= powerUp.price;
    powerUpCarouselEl.insertAdjacentHTML(
      "beforeend",
      buildCardMarkup(powerUp, {
        type: "power-up",
        isOwned: count > 0,
        isSelected: false,
        canAfford,
        compact: true,
        count,
        isEquipped
      })
    );
  });

  themes.forEach((theme) => {
    const previewEl = document.getElementById(`cardPreview-theme-${theme.id}`);
    showSkin(previewEl, theme.src);
  });

  cardPacks.forEach((pack) => {
    const previewEl = document.getElementById(`cardPreview-card-pack-${pack.id}`);
    showSkin(previewEl, pack.src);
  });

  animatePreview();
}

function handleBuy(itemId, type) {
  if (type === "power-up") {
    const powerUp = powerUps.find((entry) => entry.id === itemId);
    if (!powerUp) return;

    const balance = rewards?.getCoinBalance?.() ?? 0;
    if (balance < powerUp.price) return;
    if (rewards?.spendCoins) rewards.spendCoins(powerUp.price);
    else rewards?.setCoinBalance?.(balance - powerUp.price);

    const counts = loadMap(POWERUP_COUNTS_KEY);
    counts[itemId] = getPowerUpCount(itemId) + 1;
    saveMap(POWERUP_COUNTS_KEY, counts);
    setCoinBalance(rewards?.getCoinBalance?.() ?? balance - powerUp.price);
    renderThemes();
    return;
  }

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
  if (type === "power-up") {
    const count = getPowerUpCount(itemId);
    if (count < 1) return;
    const equipped = getEquippedPowerUps();
    const idx = equipped.indexOf(itemId);
    if (idx >= 0) {
      equipped.splice(idx, 1);
    } else {
      if (equipped.length >= MAX_EQUIPPED_POWERUPS) equipped.shift();
      equipped.push(itemId);
    }
    saveList(POWERUP_EQUIPPED_KEY, equipped);
    renderThemes();
    return;
  }

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
      buyBtn.dataset.shopType === "power-up"
        ? buyBtn.dataset.itemId || ""
        : parseInt(buyBtn.dataset.itemId || "0", 10),
      buyBtn.dataset.shopType || "theme"
    );
    return;
  }

  const useBtn = event.target.closest(".theme-btn.use");
  if (useBtn) {
    handleUse(
      useBtn.dataset.shopType === "power-up"
        ? useBtn.dataset.itemId || ""
        : parseInt(useBtn.dataset.itemId || "0", 10),
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

if (powerUpCarouselEl) {
  powerUpCarouselEl.addEventListener("click", handleCarouselClick);
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
