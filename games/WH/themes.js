const rewards = window.WHRewards;
const skins = window.WHThemeSkins || [];

const coinCountEl = document.getElementById("coin-count");
const skinGridEl = document.getElementById("skin-grid");

const OWNED_KEY = "wh_theme_owned";
const SELECTED_KEY = "wh_theme_selected";
const PRICES_KEY = "wh_theme_prices";

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
  return `
    <article class="skin-card">
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

skinGridEl?.addEventListener("click", (event) => {
  const button = event.target.closest(".shop-btn");
  if (!button) return;
  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");
  if (!id || !action) return;
  if (action === "buy") buySkin(id);
  if (action === "use") useSkin(id);
});

updateCoinBalance();
renderShop();
