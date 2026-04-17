const rewards = window.WHRewards;
const skins = window.WHThemeSkins || [];
const powerUps = window.WHPowerUps || [];

const coinCountEl = document.getElementById("coin-count");
const skinGridEl = document.getElementById("skin-grid");
const powerupGridEl = document.getElementById("powerup-grid");

const OWNED_KEY = "wh_theme_owned";
const SELECTED_KEY = "wh_theme_selected";
const PRICES_KEY = "wh_theme_prices";
const POWERUP_COUNTS_KEY = "wh_powerup_counts";
const POWERUP_EQUIPPED_KEY = "wh_powerup_equipped";
const MAX_EQUIPPED_POWERUPS = 4;

const PRICE_MIN = 450;
const PRICE_MAX = 4200;
const PRICE_STEP = 50;

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

function getOwnedSet() {
  const list = loadJSON(OWNED_KEY, ["minimal"]);
  return new Set(Array.isArray(list) ? list : ["minimal"]);
}

function saveOwnedSet(set) {
  saveJSON(OWNED_KEY, Array.from(set));
}

function getSelectedSkinId() {
  const selected = localStorage.getItem(SELECTED_KEY) || "minimal";
  return selected;
}

function setSelectedSkinId(id) {
  localStorage.setItem(SELECTED_KEY, id);
}

function randomPrice() {
  const span = Math.floor((PRICE_MAX - PRICE_MIN) / PRICE_STEP);
  const pick = Math.floor(Math.random() * (span + 1));
  return PRICE_MIN + pick * PRICE_STEP;
}

function ensurePrices() {
  const stored = loadJSON(PRICES_KEY, {});
  const prices = { ...stored };
  skins.forEach((skin, index) => {
    if (typeof prices[skin.id] !== "number") {
      prices[skin.id] = index === 0 ? 0 : randomPrice();
    }
  });
  saveJSON(PRICES_KEY, prices);
  return prices;
}

function resolveAsset(path) {
  return path;
}

function showSkin(previewEl, path) {
  if (!previewEl) return;
  previewEl.style.backgroundImage = `url('${resolveAsset(path)}')`;
}

function animatePreview() {
  const previews = document.querySelectorAll(".card-preview");
  previews.forEach((preview, index) => {
    if (!(preview instanceof HTMLElement)) return;
    if (preview.dataset.animated === "1") return;
    preview.dataset.animated = "1";
    let angle = 40 + ((index % 5) * 3);
    setInterval(() => {
      angle += 0.6;
      const bob = Math.sin(angle / 11) * 6;
      preview.style.transform = `rotateY(${angle}deg) rotateX(10deg) translateY(${bob}px)`;
    }, 50);
  });
}

function updateCoinBalance() {
  if (!coinCountEl || !rewards?.getCoinBalance) return;
  coinCountEl.textContent = String(rewards.getCoinBalance());
}

function buildSkinCard(skin, price, ownedSet, selectedId) {
  const owned = ownedSet.has(skin.id);
  const selected = selectedId === skin.id;
  const locked = !(owned || price === 0);
  return `
    <article class="skin-card ${locked ? "locked" : ""}">
      <div class="skin-preview-container">
        <div class="card-preview" id="cardPreview-${skin.id}" aria-label="${skin.name} preview"></div>
      </div>
      <div class="skin-name">${skin.name}</div>
      <div class="skin-price">${price === 0 ? "Free" : `${price} Coins`}</div>
      <div class="skin-actions">
        <button class="shop-btn buy" type="button" data-action="buy" data-id="${skin.id}" ${owned || price === 0 ? "disabled" : ""}>Buy</button>
        <button class="shop-btn use ${selected ? "active" : ""}" type="button" data-action="use" data-id="${skin.id}" ${owned || price === 0 ? "" : "disabled"}>${selected ? "Using" : "Use"}</button>
      </div>
    </article>
  `;
}

function getPowerupCounts() {
  return loadJSON(POWERUP_COUNTS_KEY, {});
}

function savePowerupCounts(counts) {
  saveJSON(POWERUP_COUNTS_KEY, counts);
}

function getEquippedPowerups() {
  const list = loadJSON(POWERUP_EQUIPPED_KEY, []);
  return Array.isArray(list) ? list.slice(0, MAX_EQUIPPED_POWERUPS) : [];
}

function saveEquippedPowerups(list) {
  saveJSON(POWERUP_EQUIPPED_KEY, list.slice(0, MAX_EQUIPPED_POWERUPS));
}

function buildPowerupCard(powerup, counts, equipped) {
  const count = Number(counts[powerup.id] || 0);
  const isEquipped = equipped.includes(powerup.id);
  return `
    <article class="powerup-card">
      <div class="powerup-icon" aria-hidden="true">${powerup.icon}</div>
      <div class="skin-name">${powerup.name}</div>
      <div class="powerup-desc">${powerup.description}</div>
      <div class="skin-price">${powerup.price} Coins${count > 0 ? ` x${count}` : ""}</div>
      <div class="skin-actions">
        <button class="shop-btn buy" type="button" data-pu-action="buy" data-pu-id="${powerup.id}">Buy</button>
        <button class="shop-btn use ${isEquipped ? "active" : ""}" type="button" data-pu-action="equip" data-pu-id="${powerup.id}" ${count > 0 ? "" : "disabled"}>${isEquipped ? "Equipped" : "Equip"}</button>
      </div>
    </article>
  `;
}

function renderShop() {
  if (!skinGridEl) return;
  const ownedSet = getOwnedSet();
  const selectedId = getSelectedSkinId();
  const prices = ensurePrices();
  skinGridEl.innerHTML = skins
    .map((skin) => buildSkinCard(skin, prices[skin.id] || 0, ownedSet, selectedId))
    .join("");

  skins.forEach((skin) => {
    showSkin(document.getElementById(`cardPreview-${skin.id}`), skin.image);
  });
  animatePreview();

  if (powerupGridEl) {
    const counts = getPowerupCounts();
    const equipped = getEquippedPowerups();
    powerupGridEl.innerHTML = powerUps
      .map((powerup) => buildPowerupCard(powerup, counts, equipped))
      .join("");
  }
}

function buySkin(id) {
  const prices = ensurePrices();
  const skin = skins.find((entry) => entry.id === id);
  if (!skin) return;
  const price = prices[id] || 0;
  const ownedSet = getOwnedSet();
  if (ownedSet.has(id) || price === 0) return;
  if (!rewards?.getCoinBalance || !rewards?.setCoinBalance) return;

  const balance = rewards.getCoinBalance();
  if (balance < price) return;
  if (rewards.spendCoins) rewards.spendCoins(price);
  else rewards.setCoinBalance(balance - price);
  ownedSet.add(id);
  saveOwnedSet(ownedSet);
  updateCoinBalance();
  renderShop();
}

function useSkin(id) {
  const skin = skins.find((entry) => entry.id === id);
  if (!skin) return;
  const ownedSet = getOwnedSet();
  if (!(ownedSet.has(id) || skin.id === "minimal")) return;
  setSelectedSkinId(id);
  localStorage.setItem("wh_theme_selected_class", skin.className);
  localStorage.setItem("wh_theme_selected_back", skin.image);
  renderShop();
}

function buyPowerup(id) {
  const powerup = powerUps.find((entry) => entry.id === id);
  if (!powerup || !rewards?.getCoinBalance) return;
  const balance = rewards.getCoinBalance();
  if (balance < powerup.price) return;
  if (rewards.spendCoins) rewards.spendCoins(powerup.price);
  else rewards.setCoinBalance(balance - powerup.price);

  const counts = getPowerupCounts();
  counts[id] = Number(counts[id] || 0) + 1;
  savePowerupCounts(counts);
  updateCoinBalance();
  renderShop();
}

function equipPowerup(id) {
  const counts = getPowerupCounts();
  if (Number(counts[id] || 0) <= 0) return;
  const equipped = getEquippedPowerups();
  const index = equipped.indexOf(id);
  if (index >= 0) {
    equipped.splice(index, 1);
  } else {
    if (equipped.length >= MAX_EQUIPPED_POWERUPS) equipped.shift();
    equipped.push(id);
  }
  saveEquippedPowerups(equipped);
  renderShop();
}

skinGridEl?.addEventListener("click", (event) => {
  const button = event.target.closest(".shop-btn");
  if (!button) return;
  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");
  if (!id || !action) return;
  if (action === "buy") buySkin(id);
  if (action === "use") useSkin(id);
});

powerupGridEl?.addEventListener("click", (event) => {
  const button = event.target.closest(".shop-btn");
  if (!button) return;
  const action = button.getAttribute("data-pu-action");
  const id = button.getAttribute("data-pu-id");
  if (!id || !action) return;
  if (action === "buy") buyPowerup(id);
  if (action === "equip") equipPowerup(id);
});

updateCoinBalance();
renderShop();
