const rewards = window.GameHubRewards;
const coinCountEl = document.getElementById("coin-count");
const rewardListEl = document.getElementById("reward-list");
const emptyStateEl = document.getElementById("empty-state");
const coinFxLayer = document.getElementById("coin-fx-layer");
const dailyCardEl = document.getElementById("daily-reward");
const dailySubtitleEl = document.getElementById("daily-subtitle");
const dailyAmountEl = document.getElementById("daily-amount");
const dailyClaimBtn = document.getElementById("daily-claim");
const dailyScheduleEl = document.getElementById("daily-schedule");
const backBtn = document.getElementById("btn-back");

function setCoinBalance(value) {
  if (coinCountEl) coinCountEl.textContent = String(value);
}

function animateCoinCount(fromValue, toValue) {
  if (!coinCountEl) return;
  const duration = 560;
  const start = performance.now();
  const delta = toValue - fromValue;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const current = Math.round(fromValue + delta * progress);
    coinCountEl.textContent = String(current);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function spawnCoinBurst(originEl, amount) {
  if (!coinFxLayer || !originEl || !coinCountEl) return;
  const targetEl = document.querySelector(".balance-card");
  if (!targetEl) return;

  const startRect = originEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const count = Math.max(8, Math.min(22, Math.round(amount / 70)));

  for (let i = 0; i < count; i += 1) {
    const coin = document.createElement("span");
    coin.className = "coin-fx";
    const jitterX = (Math.random() - 0.5) * 32;
    const jitterY = (Math.random() - 0.5) * 32;
    const dx = endX - startX + jitterX;
    const dy = endY - startY + jitterY;

    coin.style.left = `${startX}px`;
    coin.style.top = `${startY}px`;
    coin.style.setProperty("--dx", `${dx}px`);
    coin.style.setProperty("--dy", `${dy}px`);
    coinFxLayer.appendChild(coin);
    coin.addEventListener("animationend", () => coin.remove());
  }
}

function renderDailySchedule(currentDay, canClaim) {
  if (!dailyScheduleEl || !rewards?.getDailySchedule) return;
  const schedule = rewards.getDailySchedule();
  dailyScheduleEl.innerHTML = "";

  schedule.forEach((amount, index) => {
    const day = index + 1;
    const item = document.createElement("div");
    item.className = "streak-item";
    if (day < currentDay || (day === currentDay && !canClaim)) {
      item.classList.add("is-claimed");
    }
    if (day === currentDay && canClaim) {
      item.classList.add("is-today");
    }
    item.innerHTML = `
      <div class="streak-item__day">D${day}</div>
      <div class="streak-item__amount">${amount}</div>
    `;
    dailyScheduleEl.appendChild(item);
  });
}

function updateDailyCard() {
  if (!rewards || !dailyCardEl) return;
  const info = rewards.getDailyInfo();
  if (dailySubtitleEl) {
    dailySubtitleEl.textContent = info.canClaim
      ? `Day ${info.day} streak reward`
      : `Day ${info.day} already claimed today`;
  }
  if (dailyAmountEl) dailyAmountEl.textContent = String(info.amount);
  if (dailyClaimBtn) dailyClaimBtn.disabled = !info.canClaim;
  dailyCardEl.classList.toggle("is-claimed", !info.canClaim);
  renderDailySchedule(info.day, info.canClaim);
}

function renderRewardQueue() {
  if (!rewardListEl || !rewards) return;
  const list = rewards.getRewardQueue();
  rewardListEl.innerHTML = "";

  list.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "reward-card";
    card.innerHTML = `
      <div class="reward-info">
        <div class="reward-title">${entry.title}</div>
        <div class="reward-subtitle">Reward earned</div>
      </div>
      <button class="reward-claim-btn" type="button" data-entry-id="${entry.entryId}">
        <span class="coin-icon" aria-hidden="true"></span>
        <span>${entry.amount}</span>
      </button>
    `;
    rewardListEl.appendChild(card);
  });

  if (emptyStateEl) {
    emptyStateEl.classList.toggle("hidden", list.length > 0);
  }
}

function handleClaim(entryId, originEl) {
  if (!rewards) return;
  const result = rewards.claimReward(entryId);
  if (!result) return;
  spawnCoinBurst(originEl, result.entry.amount);
  animateCoinCount(result.current, result.next);
  renderRewardQueue();
}

if (dailyClaimBtn) {
  dailyClaimBtn.addEventListener("click", (event) => {
    if (!rewards) return;
    const result = rewards.claimDailyReward();
    if (!result) return;
    spawnCoinBurst(event.currentTarget, result.amount);
    animateCoinCount(result.current, result.next);
    updateDailyCard();
  });
}

if (rewardListEl) {
  rewardListEl.addEventListener("click", (event) => {
    const target = event.target.closest(".reward-claim-btn");
    if (!target) return;
    const entryId = target.getAttribute("data-entry-id");
    if (!entryId) return;
    handleClaim(entryId, target);
  });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

if (rewards) {
  setCoinBalance(rewards.getCoinBalance());
  updateDailyCard();
  renderRewardQueue();
}
