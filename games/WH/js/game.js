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

let currentLevel = 1;
let skipAiTurns = 0;
let skipAllAIs = false;
let skipPlayerTurns = 0;

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
  Object.values(sounds).forEach((sound) => sound.play().catch(() => {}));
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

function showModal(title, bodyHTML) {
  const modal = document.getElementById("modal");
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-body").innerHTML = bodyHTML;
  modal.classList.remove("hidden");
}

function hideModal() {
  document.getElementById("modal").classList.add("hidden");
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

  state.mode = saved.mode || "quick";
  currentLevel = Math.max(1, Number(saved.currentLevel) || 1);
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
  requestLandscapeGameplay();
  render();
  updateBackgroundMusic();

  if (!usingImages) {
    startBackgroundImages();
  }

  if (!state.gameOver && state.turn === "ai") {
    if (state.mode === "quick") {
      setTimeout(aiTurn, ANIMATION_SPEED);
    } else {
      setTimeout(aiGroupTurn, ANIMATION_SPEED);
    }
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

function animateDrawCard(targetSelector) {
  const market = document.getElementById("market");
  const target = document.querySelector(targetSelector);
  if (!market || !target) return;

  const m = market.getBoundingClientRect();
  const t = target.getBoundingClientRect();

  const ghost = document.createElement("div");
  ghost.className = "card back flying";
  document.body.appendChild(ghost);

  ghost.style.left = `${m.left}px`;
  ghost.style.top = `${m.top}px`;

  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${t.left - m.left}px, ${t.top - m.top}px) scale(0.8)`;
    ghost.style.opacity = "0";
  });

  setTimeout(() => ghost.remove(), ANIMATION_SPEED);
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
  loadSettings();

  if (!state.mode) {
    state.mode = "quick";
  }

  currentLevel = level;
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
  requestLandscapeGameplay();
  render();
  updateBackgroundMusic();

  if (!usingImages) {
    startBackgroundImages();
  }
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
        <div class="ai-seat ai-seat-bottom">
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
  const game = document.getElementById("game");

  game.innerHTML = `
    <div class="game-controls">
      <button class="back-btn" onclick="goBack()">&larr;</button>
      <button class="restart-btn" onclick="playAgain()">Restart</button>
      <button class="hint-btn" onclick="showHint()">Hint</button>
    </div>

    <div class="game-layout game-layout-${state.mode}">
      <h2 class="round-title">${getRoundLabel()}</h2>
      <div class="table-zone">
        ${renderAiArea()}
        <div class="center-zone">
          <div class="board">
            <div class="pile market" id="market"></div>
            <div class="pile discard">${display(state.discard[state.discard.length - 1])}</div>
          </div>
        </div>
      </div>

      <h3 class="player-title">Your Hand</h3>
      <div class="hand" id="playerHand" style="--hand-count:${Math.max(1, state.player.length)};">
        ${state.player.map((card, i) => `
          <div class="card ${card.shape === "WHOT" ? "whot" : ""}" data-i="${i}">
            ${display(card)}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".card[data-i]").forEach((card) => {
    card.onclick = () => playCard(Number(card.dataset.i), card);
  });

  const market = document.getElementById("market");
  if (market) {
    market.onclick = drawFromMarket;
  }
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
  for (let i = 0; i < count; i += 1) {
    refillMarketIfNeeded();
    const card = state.market.pop();
    if (!card) continue;

    if (target === "player") {
      state.player.push(card);
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
}

function applySpecial(card, target) {
  const isAgainstAi = target === "ai";

  if (card.number === 2 && state.settings.pick2) {
    draw(target, 2);
    if (isAgainstAi) {
      skipAiTurns += 1;
    }
    return;
  }

  if (card.number === 5 && state.settings.pick3) {
    draw(target, 3);
    if (isAgainstAi) {
      skipAiTurns += 1;
    }
    return;
  }

  if (card.number === 14 && state.settings.generalMarket) {
    draw(target, 1);
    if (isAgainstAi) {
      skipAiTurns += 1;
    }
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
        skipAiTurns += 1;
      }
      return;
    }

    skipPlayerTurns += 1;
  }
}

function playCard(index, el) {
  if (state.gameOver || state.turn !== "player") return;

  const card = state.player[index];
  const top = state.discard[state.discard.length - 1];
  if (!isValid(card, top)) return;

  el.classList.add("played");

  setTimeout(() => {
    state.player.splice(index, 1);
    state.discard.push(card);
    playSound("play");
    state.chosenShape = null;

    if (card.shape === "WHOT") {
      playSound("whot");
      showWhotChoice();
      render();
      checkWinLose();
      return;
    }

    applySpecial(card, "ai");
    render();
    if (checkWinLose()) return;

    state.turn = "ai";

    if (state.mode === "quick") {
      setTimeout(aiTurn, ANIMATION_SPEED);
    } else {
      setTimeout(aiGroupTurn, ANIMATION_SPEED);
    }
  }, 350);
}

function drawFromMarket() {
  if (state.gameOver || state.turn !== "player") return;

  refillMarketIfNeeded();
  const card = state.market.pop();

  if (card) {
    animateDrawCard("#playerHand");
    state.player.push(card);
    playSound("pick");
  }

  state.turn = "ai";
  render();
  if (checkWinLose()) return;

  if (state.mode === "quick") {
    setTimeout(aiTurn, ANIMATION_SPEED);
  } else {
    setTimeout(aiGroupTurn, ANIMATION_SPEED);
  }
}

function aiChooseCard(aiHand) {
  const top = state.discard[state.discard.length - 1];
  return aiHand.findIndex((card) => isValid(card, top));
}

function aiTurn() {
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
    const card = state.ai.splice(idx, 1)[0];
    state.discard.push(card);

    if (card.shape === "WHOT") {
      playSound("whot");
      aiWhotChoice();
    } else {
      applySpecial(card, "player");
    }
  } else {
    refillMarketIfNeeded();
    const card = state.market.pop();
    if (card) {
      animateDrawCard("#ai-stack-0");
      state.ai.push(card);
      playSound("pick");
    }
  }

  render();
  if (checkWinLose()) return;

  if (skipPlayerTurns > 0) {
    skipPlayerTurns -= 1;
    state.turn = "ai";
    setTimeout(aiTurn, ANIMATION_SPEED);
    return;
  }

  state.turn = "player";
}

function finishAiRound() {
  state.currentAIIndex = 0;

  if (skipPlayerTurns > 0) {
    skipPlayerTurns -= 1;
    state.turn = "ai";
    setTimeout(aiGroupTurn, ANIMATION_SPEED);
    return;
  }

  state.turn = "player";
  render();
}

function aiGroupTurn() {
  if (state.gameOver || state.turn !== "ai") return;

  if (skipAllAIs) {
    skipAllAIs = false;
    finishAiRound();
    return;
  }

  if (state.currentAIIndex >= state.ais.length) {
    finishAiRound();
    return;
  }

  if (skipAiTurns > 0) {
    skipAiTurns -= 1;
    state.currentAIIndex += 1;
    setTimeout(aiGroupTurn, Math.floor(ANIMATION_SPEED * 0.5));
    return;
  }

  const ai = state.ais[state.currentAIIndex];
  const idx = aiChooseCard(ai.hand);

  if (idx !== -1) {
    const card = ai.hand.splice(idx, 1)[0];
    state.discard.push(card);

    if (card.shape === "WHOT") {
      aiWhotChoice();
    } else {
      applySpecial(card, "player");
    }
  } else {
    refillMarketIfNeeded();
    const card = state.market.pop();
    if (card) {
      animateDrawCard(`#ai-stack-${state.currentAIIndex}`);
      ai.hand.push(card);
      playSound("pick");
    }
  }

  render();
  if (checkWinLose()) return;

  state.currentAIIndex += 1;

  if (state.currentAIIndex >= state.ais.length) {
    finishAiRound();
  } else {
    setTimeout(aiGroupTurn, ANIMATION_SPEED);
  }
}

function checkWinLose() {
  if (state.player.length === 0 && !state.gameOver) {
    clearSavedMatch();
    state.gameOver = true;
    playSound("win");

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
    clearSavedMatch();
    state.gameOver = true;
    playSound("lose");

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
    clearSavedMatch();
    state.gameOver = true;
    playSound("lose");

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

  showModal(
    "AI played WHOT",
    `<p>AI chooses <strong>${getShapeName(choice)}</strong>.</p><button onclick="hideModal()">Continue</button>`
  );
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
  hideModal();
  releaseLandscapeGameplay();
  document.getElementById("game").classList.add("hidden");
  document.getElementById("levels").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("quickUI")?.classList.remove("hidden");
  document.getElementById("hubBackBtn")?.classList.remove("hidden");
};

window.playAgain = function playAgain() {
  hideModal();
  clearSavedMatch();
  initGame(currentLevel);
};

window.nextLevel = function nextLevel() {
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
    SHAPES.map((shape) => `<button onclick="chooseWhot('${shape}')">${shape} ${getShapeName(shape)}</button>`).join("")
  );
};

window.chooseWhot = function chooseWhot(shape) {
  state.chosenShape = shape;
  hideModal();
  state.turn = "ai";
  render();

  if (state.mode === "quick") {
    setTimeout(aiTurn, ANIMATION_SPEED);
  } else {
    setTimeout(aiGroupTurn, ANIMATION_SPEED);
  }
};

window.goBack = function goBack() {
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
