import { state } from "./state.js";
import { createDeck } from "./deck.js";
import {
  unlockNextLevel,
  unlockNextTournamentRound,
  unlockNextMultiplayerRound
} from "./screens.js";

const backgroundImages = [
  "images/bg1_result.webp",
  "images/bg2_result.webp",
  "images/bg3_result.webp",
  "images/bg4_result.webp",
  "images/bg5_result.webp",
  "images/bg6_result.webp",
  "images/bg7_result.webp",
  "images/bg8_result.webp",
  "images/bg9_result.webp",
  "images/bg10_result.webp",
  "images/bg11_result.webp",
  "images/bg12_result.webp",
  "images/bg13_result.webp",
  "images/bg14_result.webp",
  "images/bg15_result.webp"
];

const SHAPES = ["\u2B24", "\u25B2", "\u25A0", "\u2716", "\u2605"];
const ANIMATION_SPEED = 850;
const PLAY_FLIGHT_MS = 540;
const DRAW_FLIGHT_MS = 460;
const OPENING_DEAL_FLIGHT_MS = 430;
const OPENING_DEAL_STAGGER_MS = 86;
const TIMED_MODE_EVERY_LEVELS = 5;
const TIMED_MODE_TOTAL_SECONDS = 180;

let currentLevel = 1;
let skipAiTurns = 0;
let skipAllAIs = false;
let skipPlayerTurns = 0;
let playAnimationLocked = false;
let openingDealToken = 0;
let aiTurnTimer = null;
let timedModeActive = false;
let timedSecondsLeft = TIMED_MODE_TOTAL_SECONDS;
let timedModeIntervalId = null;
let lastCardAlertActive = false;
let heartbeatIntervalId = null;
let heartbeatAudioContext = null;
let powerupCounts = {};
let equippedPowerups = [];
let secondChanceTurns = 0;
let shieldActive = false;
let destroyMode = false;
let doubleEffectActive = false;

let bgIndex = 0;
let usingImages = false;

const sounds = {
  play: new Audio("sounds/card.mp3"),
  pick: new Audio("sounds/pick.wav"),
  suspend: new Audio("sounds/suspension.wav"),
  whot: new Audio("sounds/whot.wav"),
  win: new Audio("sounds/win.wav"),
  lose: new Audio("sounds/lose.wav")
};

const bgMusic = new Audio("sounds/background.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

let rotateLockOverlayElement = null;
const WH_RESUME_KEY = "whot_saved_match_v1";
const WH_THEME_CLASS_KEY = "wh_theme_selected_class";
const WH_THEME_BACK_KEY = "wh_theme_selected_back";
const WH_POWERUP_COUNTS_KEY = "wh_powerup_counts";
const WH_POWERUP_EQUIPPED_KEY = "wh_powerup_equipped";
const WH_POWERUP_LIMIT = 4;
const POWERUP_META = {
  "second-chance": { icon: "\u21BB", name: "Second Chance" },
  "peek-ai": { icon: "\u2315", name: "Peek AI" },
  shield: { icon: "\u26E8", name: "Shield" },
  "magnet-draw": { icon: "\u{1F9F2}", name: "Magnet" },
  "destroy-card": { icon: "\u2736", name: "Destroy" },
  "freeze-ai": { icon: "\u23F8", name: "Freeze" },
  "double-effect": { icon: "\u{1F525}", name: "Double" }
};
const ALL_THEME_CLASSES = [
  "theme-minimal",
  "theme-wood",
  "theme-leather",
  "theme-tribal",
  "theme-gold",
  "theme-royal",
  "theme-neon",
  "theme-magic",
  "theme-glass",
  "theme-fire",
  "theme-galaxy",
  "theme-shadow",
  "theme-diamond",
  "theme-hypnotic",
  "theme-ancient",
  "theme-energy",
  "theme-esports",
  "theme-metal",
  "theme-mythic",
  "theme-god"
];

function saveSettings() {
  localStorage.setItem("whotSettings", JSON.stringify(state.settings));
}

function loadSettings() {
  const saved = localStorage.getItem("whotSettings");
  if (saved) {
    Object.assign(state.settings, JSON.parse(saved));
  }
}

document.addEventListener("click", () => {
  updateBackgroundMusic();
}, { once: true });

function playSound(name) {
  if (!state.settings.sounds) return;
  if (!sounds[name]) return;

  sounds[name].currentTime = 0;
  sounds[name].play().catch(() => {});
}

function updateBackgroundMusic() {
  if (!state.settings.music) {
    bgMusic.pause();
    return;
  }

  bgMusic.play().catch(() => {});
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function isTimedModeLevel() {
  return currentLevel % TIMED_MODE_EVERY_LEVELS === 0;
}

function stopTimedMode() {
  if (!timedModeIntervalId) return;
  clearInterval(timedModeIntervalId);
  timedModeIntervalId = null;
}

function triggerTimedLoss() {
  if (state.gameOver) return;
  stopTimedMode();
  state.gameOver = true;
  clearSavedMatch();
  playSound("lose");
  window.WHRewards?.recordMatchResult?.({ won: false });
  showModal(
    "Time Up",
    `
      <p>Timed Mode ended. You ran out of time.</p>
      <button onclick="goHome()">Home</button>
      <button onclick="playAgain()">Retry</button>
    `
  );
}

function startTimedMode() {
  stopTimedMode();
  timedModeActive = isTimedModeLevel();
  timedSecondsLeft = TIMED_MODE_TOTAL_SECONDS;
  if (!timedModeActive) return;

  timedModeIntervalId = setInterval(() => {
    if (state.gameOver) {
      stopTimedMode();
      return;
    }
    timedSecondsLeft -= 1;
    if (timedSecondsLeft <= 0) {
      timedSecondsLeft = 0;
      render();
      triggerTimedLoss();
      return;
    }
    render();
  }, 1000);
}

function ensureHeartbeatAudioContext() {
  if (heartbeatAudioContext) return heartbeatAudioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  heartbeatAudioContext = new Ctx();
  return heartbeatAudioContext;
}

function playHeartbeat() {
  if (!state.settings.sounds) return;
  const ctx = ensureHeartbeatAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const beat = (start, frequency, gainValue, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  const now = ctx.currentTime;
  beat(now, 52, 0.05, 0.12);
  beat(now + 0.2, 46, 0.04, 0.14);
}

function startLastCardAlert() {
  if (lastCardAlertActive) return;
  lastCardAlertActive = true;
  document.body.classList.add("last-card-alert");
  playHeartbeat();
  heartbeatIntervalId = setInterval(playHeartbeat, 920);
}

function stopLastCardAlert() {
  if (!lastCardAlertActive) return;
  lastCardAlertActive = false;
  document.body.classList.remove("last-card-alert");
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

function anyPlayerAtLastCard() {
  if (state.player.length === 1) return true;
  if (state.mode === "quick") return state.ai.length === 1;
  return state.ais.some((ai) => ai.hand.length === 1);
}

function updateLastCardTension() {
  if (state.gameOver) {
    stopLastCardAlert();
    return;
  }
  if (anyPlayerAtLastCard()) {
    startLastCardAlert();
  } else {
    stopLastCardAlert();
  }
}

function loadPowerupState() {
  try {
    const counts = JSON.parse(localStorage.getItem(WH_POWERUP_COUNTS_KEY) || "{}");
    powerupCounts = counts && typeof counts === "object" ? counts : {};
  } catch {
    powerupCounts = {};
  }
  try {
    const equipped = JSON.parse(localStorage.getItem(WH_POWERUP_EQUIPPED_KEY) || "[]");
    equippedPowerups = Array.isArray(equipped) ? equipped.slice(0, WH_POWERUP_LIMIT) : [];
  } catch {
    equippedPowerups = [];
  }
}

function savePowerupCounts() {
  localStorage.setItem(WH_POWERUP_COUNTS_KEY, JSON.stringify(powerupCounts));
}

function getPowerupCount(id) {
  return Math.max(0, Number(powerupCounts[id] || 0));
}

function consumePowerup(id) {
  const count = getPowerupCount(id);
  if (count < 1) return false;
  powerupCounts[id] = count - 1;
  savePowerupCounts();
  return true;
}

function renderPowerupBar() {
  if (!equippedPowerups.length) return "";
  const usable = equippedPowerups.filter((id) => getPowerupCount(id) > 0);
  if (!usable.length) return "";
  return `
    <div class="powerup-bar powerup-side">
      ${usable.map((id) => {
        const meta = POWERUP_META[id] || { icon: "\u2605", name: id };
        const count = getPowerupCount(id);
        return `<button class="shop-btn powerup-play-btn" data-powerup="${id}" title="${meta.name}">${meta.icon} x${count}</button>`;
      }).join("")}
    </div>
  `;
}

function pickAiHand() {
  if (state.mode === "quick") return state.ai;
  if (state.mode === "tournament") return state.ais[0]?.hand || [];
  return state.ais[0]?.hand || [];
}

function handlePowerupUse(id) {
  if (state.gameOver || state.turn !== "player") return;
  if (!consumePowerup(id)) return;

  if (id === "second-chance") {
    secondChanceTurns += 1;
    showToast("Second Chance ready");
    render();
    return;
  }

  if (id === "peek-ai") {
    const aiHand = pickAiHand();
    const card = aiHand[Math.floor(Math.random() * Math.max(1, aiHand.length))];
    if (card) showToast(`AI card: ${card.shape} ${card.number}`);
    else showToast("No AI card to peek");
    render();
    return;
  }

  if (id === "shield") {
    shieldActive = true;
    showToast("Shield active");
    render();
    return;
  }

  if (id === "magnet-draw") {
    const top = state.discard[state.discard.length - 1];
    const idx = state.market.findIndex((card) => isValid(card, top));
    if (idx >= 0) {
      const [card] = state.market.splice(idx, 1);
      state.player.push(card);
      window.WHRewards?.recordPlayerDraw?.(1);
      showToast("Magnet draw success");
    } else {
      showToast("No valid card found");
    }
    render();
    return;
  }

  if (id === "destroy-card") {
    destroyMode = true;
    showToast("Tap card to destroy");
    render();
    return;
  }

  if (id === "freeze-ai") {
    skipAiTurns += 1;
    showToast("AI frozen");
    render();
    return;
  }

  if (id === "double-effect") {
    doubleEffectActive = true;
    showToast("Double effect armed");
    render();
  }
}

function showModal(title, bodyHTML, options = {}) {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.toggle("side-modal", Boolean(options.side));
  modal.classList.toggle("no-backdrop", Boolean(options.noBackdrop));
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-body").innerHTML = bodyHTML;
  modal.classList.remove("hidden");
}

function hideModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("side-modal", "no-backdrop");
}

function ensureRotateLockOverlay() {
  if (rotateLockOverlayElement) return rotateLockOverlayElement;
  const overlay = document.createElement("div");
  overlay.className = "rotate-lock-overlay";
  overlay.innerHTML = `
    <div class="rotate-lock-card">
      <h2>Rotate Device</h2>
      <p>Use landscape mode for a full WHOT game layout.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  rotateLockOverlayElement = overlay;
  return overlay;
}

function updateRotateLockOverlay() {
  if (!rotateLockOverlayElement) return;
  const inPortrait = window.matchMedia("(orientation: portrait)").matches;
  const activeGameplay = document.body.classList.contains("landscape-game-active");
  rotateLockOverlayElement.classList.toggle("active", activeGameplay && inPortrait);
}

function applySelectedCardTheme() {
  const selectedClass = localStorage.getItem(WH_THEME_CLASS_KEY) || "theme-minimal";
  const selectedBack = localStorage.getItem(WH_THEME_BACK_KEY) || "";
  document.body.classList.remove(...ALL_THEME_CLASSES);
  document.body.classList.add(selectedClass);
  if (selectedBack) {
    document.body.classList.add("has-custom-card-skin");
    document.documentElement.style.setProperty("--wh-card-back-image", `url('${selectedBack}')`);
  } else {
    document.body.classList.remove("has-custom-card-skin");
    document.documentElement.style.removeProperty("--wh-card-back-image");
  }
}

async function requestLandscapeGameplay() {
  document.body.classList.add("landscape-game-active");
  ensureRotateLockOverlay();
  updateRotateLockOverlay();

  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch (_) {}
  }

  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock("landscape");
    } catch (_) {}
  }
}

function releaseLandscapeGameplay() {
  document.body.classList.remove("landscape-game-active");
  updateRotateLockOverlay();

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

window.addEventListener("resize", updateRotateLockOverlay);
window.addEventListener("orientationchange", updateRotateLockOverlay);
document.addEventListener("fullscreenchange", updateRotateLockOverlay);

function clearSavedMatch() {
  localStorage.removeItem(WH_RESUME_KEY);
}

function saveMatchSnapshot() {
  const payload = {
    mode: state.mode,
    currentLevel,
    timedModeActive,
    timedSecondsLeft,
    skipAiTurns,
    skipAllAIs,
    skipPlayerTurns,
    state: JSON.parse(JSON.stringify(state))
  };
  localStorage.setItem(WH_RESUME_KEY, JSON.stringify(payload));
}

function getSavedMatch() {
  try {
    const raw = localStorage.getItem(WH_RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function applySavedMatch(saved) {
  if (!saved || !saved.state || typeof saved.state !== "object") return false;
  loadPowerupState();

  state.mode = saved.mode || "quick";
  currentLevel = Math.max(1, Number(saved.currentLevel) || 1);
  timedModeActive = Boolean(saved.timedModeActive);
  timedSecondsLeft = Math.max(0, Number(saved.timedSecondsLeft) || TIMED_MODE_TOTAL_SECONDS);
  skipAiTurns = Math.max(0, Number(saved.skipAiTurns) || 0);
  skipAllAIs = Boolean(saved.skipAllAIs);
  skipPlayerTurns = Math.max(0, Number(saved.skipPlayerTurns) || 0);

  const savedState = saved.state;
  state.quickLevel = Math.max(1, Number(savedState.quickLevel) || currentLevel);
  state.tournamentLevel = Math.max(1, Number(savedState.tournamentLevel) || currentLevel);
  state.multiplayerLevel = Math.max(1, Number(savedState.multiplayerLevel) || currentLevel);
  state.player = Array.isArray(savedState.player) ? savedState.player : [];
  state.ai = Array.isArray(savedState.ai) ? savedState.ai : [];
  state.ais = Array.isArray(savedState.ais) ? savedState.ais : [];
  state.market = Array.isArray(savedState.market) ? savedState.market : [];
  state.discard = Array.isArray(savedState.discard) ? savedState.discard : [];
  state.turn = savedState.turn === "ai" ? "ai" : "player";
  state.currentAIIndex = Math.max(0, Number(savedState.currentAIIndex) || 0);
  state.chosenShape = savedState.chosenShape || null;
  state.mustContinue = Boolean(savedState.mustContinue);
  state.gameOver = Boolean(savedState.gameOver);

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("levels").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("quickUI")?.classList.add("hidden");
  document.getElementById("hubBackBtn")?.classList.add("hidden");

  hideModal();
  stopTimedMode();
  stopLastCardAlert();
  clearAiTurnSchedule();
  openingDealToken += 1;
  playAnimationLocked = false;
  requestLandscapeGameplay();
  render();
  updateBackgroundMusic();
  if (timedModeActive) {
    timedModeIntervalId = setInterval(() => {
      if (state.gameOver) {
        stopTimedMode();
        return;
      }
      timedSecondsLeft -= 1;
      if (timedSecondsLeft <= 0) {
        timedSecondsLeft = 0;
        render();
        triggerTimedLoss();
        return;
      }
      render();
    }, 1000);
  }

  if (!usingImages) {
    startBackgroundImages();
  }

  if (!state.gameOver && state.turn === "ai") {
    scheduleAiTurn(ANIMATION_SPEED);
  }

  return true;
}

export function hasSavedMatch() {
  return Boolean(getSavedMatch());
}

export function resumeSavedMatch() {
  const saved = getSavedMatch();
  if (!saved) return false;
  return applySavedMatch(saved);
}

export function discardSavedMatch() {
  clearSavedMatch();
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = [
    "position: fixed",
    "bottom: 20px",
    "left: 50%",
    "transform: translateX(-50%)",
    "background: rgba(0,0,0,0.8)",
    "color: white",
    "padding: 10px 18px",
    "border-radius: 20px",
    "z-index: 9999"
  ].join(";");

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1200);
}

function pulseClass(selector, className, duration = 620) {
  const node = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
  setTimeout(() => node.classList.remove(className), duration);
}

function flashWhotScreen() {
  pulseClass(document.body, "whot-flash", 520);
}

function shakeScreen() {
  pulseClass(document.body, "screen-shake", 520);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveElement(ref) {
  if (!ref) return null;
  return typeof ref === "string" ? document.querySelector(ref) : ref;
}

function getRectCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function animateCardFlight({
  fromRef,
  toRef = null,
  toPoint = null,
  card = null,
  isBack = false,
  flightClass = "",
  duration = DRAW_FLIGHT_MS,
  endScale = 0.82,
  endOpacity = 0.12
}) {
  return new Promise((resolve) => {
    const source = resolveElement(fromRef);
    const target = resolveElement(toRef);
    if (!source || (!target && !toPoint)) {
      resolve();
      return;
    }

    const from = source.getBoundingClientRect();
    const fromCenter = getRectCenter(from);
    const toCenter = toPoint || getRectCenter(target.getBoundingClientRect());
    const cardWidth = Math.max(38, Math.min(72, Math.round(from.width || 62)));
    const cardHeight = Math.max(56, Math.min(104, Math.round(from.height || 90)));

    const ghost = document.createElement("div");
    ghost.className = ["card", "flying", flightClass, isBack ? "back" : "", card?.shape === "WHOT" ? "whot" : ""]
      .filter(Boolean)
      .join(" ");
    ghost.style.width = `${cardWidth}px`;
    ghost.style.height = `${cardHeight}px`;
    ghost.style.left = `${fromCenter.x - cardWidth / 2}px`;
    ghost.style.top = `${fromCenter.y - cardHeight / 2}px`;
    ghost.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.78, 0.26, 1), opacity ${duration}ms ease`;
    ghost.style.opacity = "0.98";
    if (!isBack && card) {
      ghost.innerHTML = display(card);
    }
    document.body.appendChild(ghost);

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${endScale})`;
      ghost.style.opacity = String(endOpacity);
    });

    setTimeout(() => {
      ghost.remove();
      resolve();
    }, duration + 34);
  });
}

function getOpeningDealRecipients() {
  if (state.mode === "quick") {
    return [
      { selector: "#ai-stack-0", seat: "top" },
      { selector: "#playerHand", seat: "bottom", player: true }
    ];
  }

  if (state.mode === "tournament") {
    return [
      { selector: "#ai-stack-0", seat: "top" },
      { selector: "#ai-stack-1", seat: "right" },
      { selector: "#playerHand", seat: "bottom", player: true }
    ];
  }

  return [
    { selector: "#ai-stack-0", seat: "top" },
    { selector: "#ai-stack-1", seat: "left" },
    { selector: "#ai-stack-2", seat: "right" },
    { selector: "#playerHand", seat: "bottom", player: true }
  ];
}

function getOpeningDealTargetPoint(recipient, roundIndex) {
  const target = document.querySelector(recipient.selector);
  if (!target) return null;

  if (recipient.player) {
    const handCard = document.querySelector(`#playerHand .card[data-i="${roundIndex}"]`) ||
      document.querySelector("#playerHand .card:last-child");
    if (handCard) {
      return getRectCenter(handCard.getBoundingClientRect());
    }
    const rect = target.getBoundingClientRect();
    return {
      x: rect.left + rect.width * (0.16 + roundIndex * 0.16),
      y: rect.top + rect.height * 0.52
    };
  }

  const rect = target.getBoundingClientRect();
  const drift = (roundIndex - 2) * 4;
  let x = rect.left + rect.width / 2;
  let y = rect.top + rect.height / 2;

  if (recipient.seat === "top") {
    x += drift;
    y -= 10 + roundIndex * 1.2;
  } else if (recipient.seat === "left") {
    x -= 12 + roundIndex * 1.2;
    y += drift;
  } else if (recipient.seat === "right") {
    x += 12 + roundIndex * 1.2;
    y += drift;
  } else {
    x += drift;
    y += 8 + roundIndex;
  }

  return { x, y };
}

async function animateOpeningDeal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const market = document.getElementById("market");
  if (!market) return;

  const recipients = getOpeningDealRecipients();
  if (recipients.length === 0) return;

  const flights = [];
  let launchOrder = 0;

  for (let round = 0; round < 5; round += 1) {
    for (const recipient of recipients) {
      const launchDelay = launchOrder * OPENING_DEAL_STAGGER_MS;
      flights.push((async () => {
        await wait(launchDelay);
        const targetPoint = getOpeningDealTargetPoint(recipient, round);
        if (!targetPoint) return;
        await animateCardFlight({
          fromRef: market,
          toPoint: targetPoint,
          isBack: true,
          flightClass: "deal-flight",
          duration: OPENING_DEAL_FLIGHT_MS,
          endScale: 0.72,
          endOpacity: 0.08
        });
      })());
      launchOrder += 1;
    }
  }

  await Promise.all(flights);
  await wait(80);
}

function runOpeningDealAnimation() {
  const token = ++openingDealToken;
  playAnimationLocked = true;
  animateOpeningDeal()
    .catch(() => {})
    .finally(() => {
      if (token !== openingDealToken) return;
      playAnimationLocked = false;
    });
}

function animateDrawCard(targetSelector) {
  return animateCardFlight({
    fromRef: "#market",
    toRef: targetSelector,
    isBack: true,
    flightClass: "draw-flight",
    duration: DRAW_FLIGHT_MS,
    endScale: 0.78,
    endOpacity: 0.1
  });
}

function animatePlayCard(sourceRef, card) {
  return animateCardFlight({
    fromRef: sourceRef,
    toRef: ".pile.discard",
    card,
    isBack: false,
    flightClass: "play-flight",
    duration: PLAY_FLIGHT_MS,
    endScale: 0.9,
    endOpacity: 0.22
  });
}

function clearAiTurnSchedule() {
  if (!aiTurnTimer) return;
  clearTimeout(aiTurnTimer);
  aiTurnTimer = null;
}

function scheduleAiTurn(delay = ANIMATION_SPEED) {
  clearAiTurnSchedule();
  aiTurnTimer = setTimeout(() => {
    aiTurnTimer = null;
    if (state.gameOver || state.turn !== "ai") return;
    if (state.mode === "quick") {
      aiTurn();
      return;
    }
    aiGroupTurn();
  }, delay);
}

function getRoundLabel() {
  if (state.mode === "quick") {
    return `Level ${state.quickLevel}`;
  }

  if (state.mode === "tournament") {
    return `Tournament Round ${state.tournamentLevel}`;
  }

  return `Multiplayer Round ${state.multiplayerLevel}`;
}

function aiCountForMode() {
  if (state.mode === "multiplayer") return 3;
  if (state.mode === "tournament") return 2;
  return 1;
}

export function initGame(level = 1) {
  const rewards = window.WHRewards;
  loadSettings();
  loadPowerupState();

  if (!state.mode) {
    state.mode = "quick";
  }

  currentLevel = level;
  stopTimedMode();
  stopLastCardAlert();
  secondChanceTurns = 0;
  shieldActive = false;
  destroyMode = false;
  doubleEffectActive = false;
  skipAiTurns = 0;
  skipAllAIs = false;
  skipPlayerTurns = 0;

  if (state.mode === "quick") {
    state.quickLevel = level;
  } else if (state.mode === "tournament") {
    state.tournamentLevel = level;
  } else {
    state.multiplayerLevel = level;
  }

  const deck = createDeck();

  state.player = deck.splice(0, 5);
  state.ai = [];
  state.ais = [];

  const aiCount = aiCountForMode();

  if (aiCount === 1) {
    state.ai = deck.splice(0, 5);
  } else {
    state.ais = Array.from({ length: aiCount }, (_, idx) => ({
      id: `ai${idx + 1}`,
      hand: deck.splice(0, 5)
    }));
  }

  state.currentAIIndex = 0;
  state.market = deck;
  state.discard = [state.market.pop()];
  state.turn = "player";
  state.chosenShape = null;
  state.gameOver = false;

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("levels").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("quickUI")?.classList.add("hidden");
  document.getElementById("hubBackBtn")?.classList.add("hidden");

  hideModal();
  clearSavedMatch();
  clearAiTurnSchedule();
  openingDealToken += 1;
  playAnimationLocked = false;
  requestLandscapeGameplay();
  applySelectedCardTheme();
  render();
  runOpeningDealAnimation();
  updateBackgroundMusic();
  startTimedMode();

  if (!usingImages) {
    startBackgroundImages();
  }

  rewards?.startMatch?.();
}

function renderAiFan(count, id, side = "right") {
  const depth = Math.max(1, Math.min(count, 7));
  let cards = "";

  for (let i = 0; i < depth; i += 1) {
    cards += `<div class="fan-card card back" style="--i:${i}; --total:${depth}"></div>`;
  }

  return `
    <div class="ai-fan-stack ${side}" id="${id}">
      ${cards}
      <span class="count">${count}</span>
    </div>
  `;
}

function renderAiArea() {
  if (state.mode === "quick") {
    return `
      <div class="ai-table ai-table-quick">
        <div class="ai-seat ai-seat-top">
          <p class="ai-label">AI 1</p>
          ${renderAiFan(state.ai.length, "ai-stack-0", "right")}
        </div>
      </div>
    `;
  }

  if (state.mode === "tournament") {
    const aiBottom = state.ais[0];
    const aiSide = state.ais[1];
    return `
      <div class="ai-table ai-table-tournament">
        <div class="ai-seat ai-seat-top">
          <p class="ai-label">AI 1</p>
          ${renderAiFan(aiBottom?.hand.length || 0, "ai-stack-0", "right")}
        </div>
        <div class="ai-seat ai-seat-right">
          <p class="ai-label">AI 2</p>
          ${renderAiFan(aiSide?.hand.length || 0, "ai-stack-1", "right")}
        </div>
      </div>
    `;
  }

  return `
    <div class="ai-table ai-table-multiplayer">
      <div class="ai-seat ai-seat-top">
        <p class="ai-label">AI 1</p>
        ${renderAiFan(state.ais[0]?.hand.length || 0, "ai-stack-0", "right")}
      </div>
      <div class="ai-seat ai-seat-left">
        <p class="ai-label">AI 2</p>
        ${renderAiFan(state.ais[1]?.hand.length || 0, "ai-stack-1", "left")}
      </div>
      <div class="ai-seat ai-seat-right">
        <p class="ai-label">AI 3</p>
        ${renderAiFan(state.ais[2]?.hand.length || 0, "ai-stack-2", "right")}
      </div>
    </div>
  `;
}

function render() {
  applySelectedCardTheme();
  const game = document.getElementById("game");
  const topCard = state.discard[state.discard.length - 1];

  game.innerHTML = `
    <div class="game-controls">
      <button class="back-btn" onclick="goBack()">&larr;</button>
      <button class="restart-btn" onclick="playAgain()">Restart</button>
      <button class="hint-btn" onclick="showHint()">Hint</button>
      ${timedModeActive ? `<div class="timed-chip">Timed ${formatTime(timedSecondsLeft)}</div>` : ""}
    </div>
    ${renderPowerupBar()}
    ${anyPlayerAtLastCard() ? `<div class="last-card-banner">LAST CARD!</div>` : ""}

    <div class="game-layout game-layout-${state.mode}">
      <h2 class="round-title">${getRoundLabel()}</h2>
      <div class="table-zone">
        ${renderAiArea()}
        <div class="center-zone">
          <div class="board">
            <div class="pile market" id="market"></div>
            <div class="pile discard">
              <div class="card discard-card-view ${topCard.shape === "WHOT" ? "whot" : ""}">
                ${display(topCard)}
              </div>
              ${state.chosenShape ? `<div class="chosen-shape-tag">${state.chosenShape} ${getShapeName(state.chosenShape)}</div>` : ""}
            </div>
          </div>
        </div>
      </div>

      <h3 class="player-title">Your Hand</h3>
      <div class="hand" id="playerHand" style="--hand-count:${Math.max(1, state.player.length)};">
        ${state.player.map((card, i) => `
          <div class="card ${card.shape === "WHOT" ? "whot" : ""} ${state.turn === "player" && isValid(card, topCard) ? "valid-move" : ""}" data-i="${i}">
            ${display(card)}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".card[data-i]").forEach((card) => {
    card.onclick = () => playCard(Number(card.dataset.i), card);
  });

  document.querySelectorAll(".powerup-play-btn").forEach((button) => {
    button.onclick = () => handlePowerupUse(button.dataset.powerup || "");
  });

  const market = document.getElementById("market");
  if (market) {
    market.onclick = drawFromMarket;
  }

  updateLastCardTension();
}

function display(card) {
  if (card.shape === "WHOT") {
    return "<span>\u2605</span>";
  }

  return `
    <div class="num top">${card.number}</div>
    <div class="shape">${card.shape}</div>
    <div class="num bottom">${card.number}</div>
  `;
}

function isValid(card, top) {
  if (!card || !top) return false;
  if (card.shape === "WHOT") return true;
  if (state.chosenShape) return card.shape === state.chosenShape;
  return card.shape === top.shape || card.number === top.number;
}

function draw(target, count) {
  const rewards = window.WHRewards;
  let drawnForPlayer = 0;
  for (let i = 0; i < count; i += 1) {
    refillMarketIfNeeded();
    const card = state.market.pop();
    if (!card) continue;

    if (target === "player") {
      state.player.push(card);
      drawnForPlayer += 1;
    } else if (target === "ai") {
      if (state.mode === "quick") {
        state.ai.push(card);
      } else {
        const ai = state.ais[state.currentAIIndex];
        if (ai) ai.hand.push(card);
      }
    }

    playSound("pick");
  }
  if (drawnForPlayer > 0) {
    rewards?.recordPlayerDraw?.(drawnForPlayer);
  }
}

function applySpecial(card, target, source = "player") {
  const isAgainstAi = target === "ai";
  const boosted = source === "player" && doubleEffectActive;
  const drawMultiplier = boosted ? 2 : 1;

  if (target === "player" && shieldActive && (card.number === 2 || card.number === 5 || card.number === 14)) {
    shieldActive = false;
    showToast("Shield blocked effect");
    if (boosted) doubleEffectActive = false;
    return;
  }

  if (card.number === 2 && state.settings.pick2) {
    draw(target, 2 * drawMultiplier);
    if (isAgainstAi) {
      skipAiTurns += drawMultiplier;
    }
    if (boosted) doubleEffectActive = false;
    return;
  }

  if (card.number === 5 && state.settings.pick3) {
    draw(target, 3 * drawMultiplier);
    shakeScreen();
    if (isAgainstAi) {
      skipAiTurns += drawMultiplier;
    }
    if (boosted) doubleEffectActive = false;
    return;
  }

  if (card.number === 14 && state.settings.generalMarket) {
    draw(target, 1 * drawMultiplier);
    if (isAgainstAi) {
      skipAiTurns += drawMultiplier;
    }
    if (boosted) doubleEffectActive = false;
    return;
  }

  if (!state.settings.suspension) {
    return;
  }

  if (card.number === 1 || card.number === 8) {
    playSound("suspend");

    if (isAgainstAi) {
      if (card.number === 1 && state.settings.holdOn) {
        skipAllAIs = true;
      } else {
        skipAiTurns += drawMultiplier;
      }
      if (boosted) doubleEffectActive = false;
      return;
    }

    skipPlayerTurns += drawMultiplier;
    if (boosted) doubleEffectActive = false;
  }
}

function clearChosenShapeIfSatisfied(card) {
  if (!state.chosenShape) return;
  if (!card || card.shape === "WHOT") return;
  if (card.shape === state.chosenShape) {
    state.chosenShape = null;
  }
}

async function playCard(index, el) {
  const rewards = window.WHRewards;
  if (state.gameOver || state.turn !== "player" || playAnimationLocked) return;

  const card = state.player[index];
  const top = state.discard[state.discard.length - 1];
  if (destroyMode) {
    if (state.player.length <= 1) {
      destroyMode = false;
      showToast("Need at least 2 cards");
      render();
      return;
    }
    state.player.splice(index, 1);
    destroyMode = false;
    showToast("Card destroyed");
    render();
    return;
  }
  if (!isValid(card, top)) return;
  const playMeta = rewards?.recordPlayerCardPlayed?.(card) || { comboTriggered: false };
  if (playMeta.comboTriggered) {
    showToast("Combo!");
    shakeScreen();
  }

  playAnimationLocked = true;

  try {
    await animatePlayCard(el, card);

    state.player.splice(index, 1);
    state.discard.push(card);
    pulseClass(".pile.discard", "card-slam", 520);
    playSound("play");
    clearChosenShapeIfSatisfied(card);

    if (card.shape === "WHOT") {
      playSound("whot");
      flashWhotScreen();
      showWhotChoice();
      render();
      checkWinLose();
      return;
    }

    applySpecial(card, "ai", "player");
    render();
    if (checkWinLose()) return;

    if (secondChanceTurns > 0) {
      secondChanceTurns -= 1;
      state.turn = "player";
      showToast("Second Chance turn");
      render();
      return;
    }

    state.turn = "ai";
    scheduleAiTurn(ANIMATION_SPEED);
  } finally {
    playAnimationLocked = false;
  }
}

async function drawFromMarket() {
  const rewards = window.WHRewards;
  if (state.gameOver || state.turn !== "player" || playAnimationLocked) return;

  refillMarketIfNeeded();
  const card = state.market.pop();

  if (card) {
    playAnimationLocked = true;
    try {
      await animateDrawCard("#playerHand");
      state.player.push(card);
      playSound("pick");
      rewards?.recordPlayerDraw?.(1);
    } finally {
      playAnimationLocked = false;
    }
  }

  state.turn = "ai";
  render();
  if (checkWinLose()) return;
  scheduleAiTurn(ANIMATION_SPEED);
}

function aiChooseCard(aiHand) {
  const top = state.discard[state.discard.length - 1];
  return aiHand.findIndex((card) => isValid(card, top));
}

async function aiTurn() {
  if (state.gameOver || state.turn !== "ai") return;

  if (skipAllAIs) {
    skipAllAIs = false;
    state.turn = "player";
    render();
    return;
  }

  if (skipAiTurns > 0) {
    skipAiTurns -= 1;
    state.turn = "player";
    render();
    return;
  }

  const idx = aiChooseCard(state.ai);

  if (idx !== -1) {
    const card = state.ai[idx];
    await animatePlayCard("#ai-stack-0", card);
    state.ai.splice(idx, 1);
    state.discard.push(card);
    pulseClass(".pile.discard", "card-slam", 520);
    clearChosenShapeIfSatisfied(card);

    if (card.shape === "WHOT") {
      playSound("whot");
      flashWhotScreen();
      aiWhotChoice();
    } else {
      applySpecial(card, "player", "ai");
    }
  } else {
    refillMarketIfNeeded();
    const card = state.market.pop();
    if (card) {
      await animateDrawCard("#ai-stack-0");
      state.ai.push(card);
      playSound("pick");
    }
  }

  render();
  if (checkWinLose()) return;

  if (skipPlayerTurns > 0) {
    skipPlayerTurns -= 1;
    state.turn = "ai";
    scheduleAiTurn(ANIMATION_SPEED);
    return;
  }

  state.turn = "player";
}

function finishAiRound() {
  const total = Math.max(1, state.ais.length);
  state.currentAIIndex = (state.currentAIIndex + 1) % total;

  if (skipPlayerTurns > 0) {
    skipPlayerTurns -= 1;
    state.turn = "ai";
    render();
    scheduleAiTurn(Math.floor(ANIMATION_SPEED * 0.8));
    return;
  }

  state.turn = "player";
  render();
}

async function aiGroupTurn() {
  if (state.gameOver || state.turn !== "ai") return;

  if (skipAllAIs) {
    skipAllAIs = false;
    finishAiRound();
    return;
  }

  if (skipAiTurns > 0) {
    skipAiTurns -= 1;
    finishAiRound();
    return;
  }

  const ai = state.ais[state.currentAIIndex];
  if (!ai) {
    finishAiRound();
    return;
  }
  const idx = aiChooseCard(ai.hand);

  if (idx !== -1) {
    const card = ai.hand[idx];
    await animatePlayCard(`#ai-stack-${state.currentAIIndex}`, card);
    ai.hand.splice(idx, 1);
    state.discard.push(card);
    pulseClass(".pile.discard", "card-slam", 520);
    clearChosenShapeIfSatisfied(card);

    if (card.shape === "WHOT") {
      flashWhotScreen();
      aiWhotChoice();
    } else {
      applySpecial(card, "player", "ai");
    }
  } else {
    refillMarketIfNeeded();
    const card = state.market.pop();
    if (card) {
      await animateDrawCard(`#ai-stack-${state.currentAIIndex}`);
      ai.hand.push(card);
      playSound("pick");
    }
  }

  render();
  if (checkWinLose()) return;
  finishAiRound();
}

function checkWinLose() {
  const rewards = window.WHRewards;
  if (state.player.length === 0 && !state.gameOver) {
    stopTimedMode();
    stopLastCardAlert();
    clearSavedMatch();
    state.gameOver = true;
    playSound("win");

    const rewardResult = rewards?.recordMatchResult?.({ won: true }) || { events: [] };
    if (rewardResult.events?.includes("streak3")) {
      showToast("Win Streak!");
      shakeScreen();
    }

    if (state.mode === "quick") {
      unlockNextLevel(state.quickLevel);
    } else if (state.mode === "tournament") {
      unlockNextTournamentRound(state.tournamentLevel);
    } else {
      unlockNextMultiplayerRound(state.multiplayerLevel);
    }

    showModal(
      "You Win",
      `
        <p>${getRoundLabel()} completed.</p>
        <button onclick="goHome()">Home</button>
        <button onclick="playAgain()">Play Again</button>
        <button onclick="nextLevel()">Next</button>
      `
    );

    return true;
  }

  if (state.mode === "quick" && state.ai.length === 0 && !state.gameOver) {
    stopTimedMode();
    stopLastCardAlert();
    clearSavedMatch();
    state.gameOver = true;
    playSound("lose");

    rewards?.recordMatchResult?.({ won: false });

    showModal(
      "You Lose",
      `
        <p>Try this level again.</p>
        <button onclick="goHome()">Home</button>
        <button onclick="playAgain()">Retry</button>
      `
    );

    return true;
  }

  if (state.mode !== "quick" && state.ais.some((ai) => ai.hand.length === 0) && !state.gameOver) {
    stopTimedMode();
    stopLastCardAlert();
    clearSavedMatch();
    state.gameOver = true;
    playSound("lose");

    rewards?.recordMatchResult?.({ won: false });

    showModal(
      "You Lose",
      `
        <p>An opponent finished all cards.</p>
        <button onclick="goHome()">Home</button>
      `
    );

    return true;
  }

  return false;
}

function getShapeName(shape) {
  switch (shape) {
    case "\u2B24":
      return "Circle";
    case "\u25B2":
      return "Triangle";
    case "\u25A0":
      return "Square";
    case "\u2716":
      return "Cross";
    case "\u2605":
      return "Star";
    default:
      return "Shape";
  }
}

function aiWhotChoice() {
  const choice = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  state.chosenShape = choice;
  showToast(`AI chooses ${getShapeName(choice)}`);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function refillMarketIfNeeded() {
  if (state.market.length > 0) return;

  const top = state.discard.pop();
  state.market = shuffle([...state.discard]);
  state.discard = [top];
}

function startBackgroundImages() {
  const layerA = document.getElementById("bgA");
  const layerB = document.getElementById("bgB");
  if (!layerA || !layerB || !backgroundImages.length) return;

  usingImages = true;

  let active = layerA;
  let inactive = layerB;

  active.style.backgroundImage = `url('${backgroundImages[bgIndex]}')`;
  active.style.opacity = "1";
  inactive.style.opacity = "0";

  setInterval(() => {
    bgIndex = (bgIndex + 1) % backgroundImages.length;
    inactive.style.backgroundImage = `url('${backgroundImages[bgIndex]}')`;
    inactive.style.opacity = "1";
    active.style.opacity = "0";

    const prev = active;
    active = inactive;
    inactive = prev;
  }, 20000);
}

window.hideModal = hideModal;
window.goHome = function goHome() {
  clearAiTurnSchedule();
  stopTimedMode();
  stopLastCardAlert();
  hideModal();
  releaseLandscapeGameplay();
  document.getElementById("game").classList.add("hidden");
  document.getElementById("levels").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("quickUI")?.classList.remove("hidden");
  document.getElementById("hubBackBtn")?.classList.remove("hidden");
};

window.playAgain = function playAgain() {
  clearAiTurnSchedule();
  stopTimedMode();
  stopLastCardAlert();
  hideModal();
  clearSavedMatch();
  initGame(currentLevel);
};

window.nextLevel = function nextLevel() {
  clearAiTurnSchedule();
  stopTimedMode();
  stopLastCardAlert();
  hideModal();
  clearSavedMatch();

  if (state.mode === "quick") {
    unlockNextLevel(state.quickLevel);
    initGame(state.quickLevel + 1);
    return;
  }

  if (state.mode === "tournament") {
    unlockNextTournamentRound(state.tournamentLevel);
    initGame(state.tournamentLevel + 1);
    return;
  }

  unlockNextMultiplayerRound(state.multiplayerLevel);
  initGame(state.multiplayerLevel + 1);
};

window.showWhotChoice = function showWhotChoice() {
  showModal(
    "WHOT - Choose Shape",
    SHAPES.map((shape) => `<button onclick="chooseWhot('${shape}')">${shape} ${getShapeName(shape)}</button>`).join(""),
    { side: true, noBackdrop: true }
  );
};

window.chooseWhot = function chooseWhot(shape) {
  state.chosenShape = shape;
  hideModal();
  state.turn = "ai";
  render();
  scheduleAiTurn(ANIMATION_SPEED);
};

window.goBack = function goBack() {
  clearAiTurnSchedule();
  stopTimedMode();
  stopLastCardAlert();
  hideModal();
  saveMatchSnapshot();
  releaseLandscapeGameplay();
  document.getElementById("game").classList.add("hidden");

  if (state.mode === "quick") {
    window.showLevels();
    return;
  }

  if (state.mode === "tournament") {
    window.showTournamentLevels();
    return;
  }

  window.showMultiplayerLevels();
};

window.showHint = function showHint() {
  if (state.turn !== "player") return;

  const top = state.discard[state.discard.length - 1];
  const idx = state.player.findIndex((card) => isValid(card, top));

  document.querySelectorAll(".card").forEach((card) => card.classList.remove("hint"));

  if (idx === -1) {
    showModal("Hint", "<p>No valid card. Draw from market.</p><button onclick=\"hideModal()\">OK</button>");
    return;
  }

  const cardEl = document.querySelector(`.card[data-i='${idx}']`);
  if (cardEl) cardEl.classList.add("hint");
};

window.openSettings = function openSettings() {
  showModal(
    "Game Settings",
    `
      <div class="setting-row">
        <span>Sounds</span>
        <button class="${state.settings.sounds ? "active" : ""}" onclick="setOption('sounds', true)">ON</button>
        <button class="${!state.settings.sounds ? "active" : ""}" onclick="setOption('sounds', false)">OFF</button>
      </div>
      <div class="setting-row">
        <span>Background Music</span>
        <button class="${state.settings.music ? "active" : ""}" onclick="setOption('music', true)">ON</button>
        <button class="${!state.settings.music ? "active" : ""}" onclick="setOption('music', false)">OFF</button>
      </div>
      <div class="setting-row">
        <span>Pick 2</span>
        <button class="${state.settings.pick2 ? "active" : ""}" onclick="setOption('pick2', true)">ON</button>
        <button class="${!state.settings.pick2 ? "active" : ""}" onclick="setOption('pick2', false)">OFF</button>
      </div>
      <div class="setting-row">
        <span>Pick 3</span>
        <button class="${state.settings.pick3 ? "active" : ""}" onclick="setOption('pick3', true)">ON</button>
        <button class="${!state.settings.pick3 ? "active" : ""}" onclick="setOption('pick3', false)">OFF</button>
      </div>
      <div class="setting-row">
        <span>General Market</span>
        <button class="${state.settings.generalMarket ? "active" : ""}" onclick="setOption('generalMarket', true)">ON</button>
        <button class="${!state.settings.generalMarket ? "active" : ""}" onclick="setOption('generalMarket', false)">OFF</button>
      </div>
      <div class="setting-row">
        <span>Suspension</span>
        <button class="${state.settings.suspension ? "active" : ""}" onclick="setOption('suspension', true)">ON</button>
        <button class="${!state.settings.suspension ? "active" : ""}" onclick="setOption('suspension', false)">OFF</button>
      </div>
      <div class="setting-row">
        <span>Hold On (1)</span>
        <button class="${state.settings.holdOn ? "active" : ""}" onclick="setOption('holdOn', true)">ON</button>
        <button class="${!state.settings.holdOn ? "active" : ""}" onclick="setOption('holdOn', false)">OFF</button>
      </div>
      <button onclick="hideModal()">Close</button>
    `
  );
};

window.setOption = function setOption(key, value) {
  state.settings[key] = value;
  saveSettings();

  if (key === "music") {
    updateBackgroundMusic();
  }

  showToast("Settings saved");
  window.openSettings();
};

window.openRules = function openRules() {
  showModal(
    "WHOT Rules",
    `
      <div class="rules">
        <p>Match cards by number or shape.</p>
        <p>WHOT lets you choose any shape.</p>
        <p>Suspension skips one opponent turn.</p>
        <p>General Market forces a draw.</p>
        <p>First to finish all cards wins.</p>
        <button onclick="hideModal()">Start Playing</button>
      </div>
    `
  );
};

window.refillMarketIfNeeded = refillMarketIfNeeded;

document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settingsBtn");
  const rulesBtn = document.getElementById("rulesBtn");

  if (settingsBtn) settingsBtn.onclick = window.openSettings;
  if (rulesBtn) rulesBtn.onclick = window.openRules;
});

