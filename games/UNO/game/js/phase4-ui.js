/**
 * Phase 4 UI: renders game state and connects input to core logic.
 * UI only. Game rules and state live in game-state.js and rules.js.
 */

import { GameState } from './game-state.js';
import { getAIMove } from './ai.js';
import {
  initGameAudio,
  playSfx,
  unlockAudio,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic
} from './audio.js';

const params = new URLSearchParams(window.location.search);
const MODE_CONFIG = {
  tournament: {
    playerCount: 4,
    progressKey: 'gamehub_uno_progress_tournament',
    resumeKey: 'gamehub_uno_resume_tournament'
  },
  'quick-play': {
    playerCount: 2,
    progressKey: 'gamehub_uno_progress_quick_play',
    resumeKey: 'gamehub_uno_resume_quick_play'
  },
  'team-battle': {
    playerCount: 4,
    progressKey: 'gamehub_uno_progress_team_battle',
    resumeKey: 'gamehub_uno_resume_team_battle'
  }
};
const selectedMode = MODE_CONFIG[params.get('mode')] ? params.get('mode') : 'tournament';
const modeConfig = MODE_CONFIG[selectedMode];
const selectedLevel = Math.min(Math.max(parseInt(params.get('level') || '1', 10), 1), 10);
const selectedStage = Math.min(Math.max(parseInt(params.get('stage') || '1', 10), 1), 10);
const progressKey = modeConfig.progressKey;
const resumeKey = modeConfig.resumeKey;
const isQuickPlay = selectedMode === 'quick-play';
const isTeamBattle = selectedMode === 'team-battle';
const shouldRestoreSavedMatch = params.get('resume') === '1';

const game = new GameState({
  playerCount: modeConfig.playerCount,
  allowDrawStacking: true,
  allowUnoCall: true,
  enforceWild4: false
});

const dom = {
  playerTop: document.getElementById('player-top'),
  playerLeft: document.getElementById('player-left'),
  playerRight: document.getElementById('player-right'),
  playerBottom: document.getElementById('player-bottom'),
  labelTop: document.getElementById('label-top'),
  labelLeft: document.getElementById('label-left'),
  labelRight: document.getElementById('label-right'),
  labelBottom: document.getElementById('label-bottom'),
  avatarTop: document.getElementById('avatar-top'),
  avatarLeft: document.getElementById('avatar-left'),
  avatarRight: document.getElementById('avatar-right'),
  avatarBottom: document.getElementById('avatar-bottom'),
  countTop: document.getElementById('count-top'),
  countLeft: document.getElementById('count-left'),
  countRight: document.getElementById('count-right'),
  handCards: document.getElementById('hand-cards'),
  deckCount: document.getElementById('deck-count'),
  drawPile: document.getElementById('draw-pile'),
  discardCard: document.getElementById('discard-card'),
  wildPicker: document.getElementById('wild-picker'),
  btnUno: document.getElementById('btn-uno'),
  btnNewIcon: document.getElementById('btn-new-icon'),
  rotateOverlay: document.getElementById('rotate-overlay'),
  gameShell: document.querySelector('.game-shell'),
  centerZone: document.querySelector('.center-zone'),
  btnBackRoad: document.getElementById('btn-back-road'),
  btnPause: document.getElementById('btn-pause'),
  unoArrow: document.getElementById('uno-arrow'),
  endModal: document.getElementById('end-modal'),
  endModalTitle: document.getElementById('end-modal-title'),
  endModalMessage: document.getElementById('end-modal-message'),
  btnPlayAgain: document.getElementById('btn-play-again'),
  btnNextLevel: document.getElementById('btn-next-level'),
  btnExit: document.getElementById('btn-exit'),
  teamBrief: document.getElementById('team-brief'),
  teamBriefMessage: document.getElementById('team-brief-message'),
  btnTeamBrief: document.getElementById('btn-team-brief'),
  pauseModal: document.getElementById('pause-modal'),
  btnResume: document.getElementById('btn-resume'),
  btnSaveExit: document.getElementById('btn-save-exit'),
  btnRestartMatch: document.getElementById('btn-restart-match'),
  newgameModal: document.getElementById('newgame-modal'),
  btnConfirmNewYes: document.getElementById('btn-confirm-new-yes'),
  btnConfirmNewNo: document.getElementById('btn-confirm-new-no')
};

let selectedWildCard = null;
let selectedWildCardEl = null;
let lastPendingUno = null;
let lastRewardQueueSize = 0;
let isPaused = false;
let aiTurnToken = 0;
let fullscreenWatchdogId = null;
const lastSpeechAt = Array.from({ length: game.playerCount }, () => 0);
const drawAnimationSuppress = Array.from({ length: game.playerCount }, () => 0);
const bubbleStacks = Array.from({ length: game.playerCount }, () => 0);
const aiMemory = {
  colorAvoidance: Array.from({ length: game.playerCount }, () => ({
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0
  }))
};

const playerZoneMap = {
  0: dom.playerBottom,
  1: dom.playerLeft,
  2: dom.playerTop,
  3: dom.playerRight
};

const avatars = window.GameHubAvatars || [];
const AVATAR_KEY = 'gamehub_uno_avatar';
const LANDSCAPE_INTENT_KEY = 'gamehub_uno_landscape_intent';
const PROGRESS_KEYS = [
  'gamehub_uno_progress',
  MODE_CONFIG.tournament.progressKey,
  MODE_CONFIG['quick-play'].progressKey,
  MODE_CONFIG['team-battle'].progressKey
];
const AVATAR_UNLOCK_STAGE_INTERVAL = 5;
const rewards = window.GameHubRewards;
const THEME_PATH_KEY = 'gamehub_uno_theme_path';
const CARD_PACK_PATH_KEY = 'gamehub_uno_card_pack_path';
const SPEECH_SETTING_KEY = 'gamehub_uno_setting_speech';
const REACTIONS_SETTING_KEY = 'gamehub_uno_setting_reactions';
const wildPalette = { red: '#e03b3b', blue: '#2b6df7', green: '#22c55e', yellow: '#f4c430' };
let matchRecorded = false;
let opponentAvatars = [];

function markLandscapeIntent() {
  try {
    sessionStorage.setItem(LANDSCAPE_INTENT_KEY, '1');
  } catch {
    // Ignore storage failures on restricted browser modes.
  }
}

function isPlayerSideWinner(winnerIndex) {
  if (isTeamBattle) return winnerIndex === 0 || winnerIndex === 2;
  return winnerIndex === 0;
}

function isSpeechEnabled() {
  return localStorage.getItem(SPEECH_SETTING_KEY) !== 'off';
}

function areReactionsEnabled() {
  return localStorage.getItem(REACTIONS_SETTING_KEY) !== 'off';
}

function syncRewardQueueSize() {
  lastRewardQueueSize = rewards?.getRewardQueue?.().length || 0;
}

function checkCoinRewardSound() {
  const currentSize = rewards?.getRewardQueue?.().length || 0;
  if (currentSize > lastRewardQueueSize) {
    playSfx('coinReward', 0.85);
  }
  lastRewardQueueSize = currentSize;
}

function recordRewardedAction(callback) {
  syncRewardQueueSize();
  callback?.();
  checkCoinRewardSound();
}

function playCardSound(card) {
  if (!card) return;
  playSfx('cardPlay', 0.72);
  if (card.type === 'action' || card.type === 'wild') {
    playSfx('actionCard', 0.88);
  }
}

function getOrderedTeam(indices) {
  return [...indices].sort((a, b) => game.getHand(a).length - game.getHand(b).length || a - b);
}

function getRewardPlacements() {
  if (!isTeamBattle) return getPlacements();
  const winners = isPlayerSideWinner(game.getWinnerIndex()) ? [0, 2] : [1, 3];
  const losers = winners[0] === 0 ? [1, 3] : [0, 2];
  const placements = Array(game.playerCount).fill(game.playerCount);
  const winnerOrder = getOrderedTeam(winners);
  const loserOrder = getOrderedTeam(losers);
  placements[winnerOrder[0]] = 1;
  placements[winnerOrder[1]] = 2;
  placements[loserOrder[0]] = 3;
  placements[loserOrder[1]] = 4;
  return placements;
}

function getRewardWinnerIndex() {
  if (!isTeamBattle) return game.getWinnerIndex();
  return isPlayerSideWinner(game.getWinnerIndex()) ? 0 : 1;
}

function configureModeUI() {
  document.body.classList.remove('mode-tournament', 'mode-quick-play', 'mode-team-battle');
  document.body.classList.add(`mode-${selectedMode}`);

  dom.playerLeft?.classList.remove('hidden-player');
  dom.playerTop?.classList.remove('hidden-player', 'player-zone--teammate');
  dom.playerRight?.classList.remove('hidden-player');

  if (dom.labelBottom) dom.labelBottom.textContent = 'You';
  if (dom.labelLeft) dom.labelLeft.textContent = isQuickPlay ? 'AI Rival' : isTeamBattle ? 'Opponent 1' : 'AI 1';
  if (dom.labelTop) dom.labelTop.textContent = isTeamBattle ? 'Teammate' : 'AI 2';
  if (dom.labelRight) dom.labelRight.textContent = isTeamBattle ? 'Opponent 2' : 'AI 3';

  if (isQuickPlay) {
    dom.playerTop?.classList.add('hidden-player');
    dom.playerRight?.classList.add('hidden-player');
  }

  if (isTeamBattle) {
    dom.playerTop?.classList.add('player-zone--teammate');
  }
}

function showTeamBrief(onStart) {
  if (!isTeamBattle || !dom.teamBrief) {
    onStart();
    return;
  }
  const teammate = opponentAvatars[1];
  if (dom.teamBriefMessage) {
    const teammateName = teammate?.name || 'your AI partner';
    dom.teamBriefMessage.textContent = `${teammateName} is on your side. If you or your teammate wins, your team takes the match.`;
  }
  dom.teamBrief.classList.remove('hidden');
  const begin = () => {
    dom.teamBrief?.classList.add('hidden');
    dom.btnTeamBrief?.removeEventListener('click', begin);
    onStart();
  };
  dom.btnTeamBrief?.addEventListener('click', begin);
}

function startRoundPresentation() {
  render();
  if (isTeamBattle) {
    showTeamBrief(() => {
      animateGameStart();
      runAITurns();
    });
    return;
  }
  animateGameStart();
  runAITurns();
}

function announceRoundStartSpeech() {
  for (let pid = 0; pid < game.playerCount; pid += 1) {
    const delay = 260 + pid * 320;
    setTimeout(() => {
      maybeShowSpeech(pid, 'gameStart', 'gameStart', 0);
    }, delay);
  }
}

function parseProgressValue(value) {
  const parsed = parseInt(value || '1', 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function getUnlockedAvatarCount() {
  const bestProgress = Math.min(
    Math.max(...PROGRESS_KEYS.map((key) => parseProgressValue(localStorage.getItem(key)))),
    100
  );
  const stagesWon = Math.max(0, bestProgress - 1);
  const unlocked = 1 + Math.floor(stagesWon / AVATAR_UNLOCK_STAGE_INTERVAL);
  const maxAvatars = avatars.length || 20;
  return Math.min(maxAvatars, Math.max(1, unlocked));
}

function getSelectedAvatar() {
  const stored = parseInt(localStorage.getItem(AVATAR_KEY) || '1', 10);
  const unlockedAvatars = avatars.slice(0, getUnlockedAvatarCount());
  const fallbackId = unlockedAvatars[0]?.id || avatars[0]?.id || 1;
  if (Number.isNaN(stored)) {
    localStorage.setItem(AVATAR_KEY, String(fallbackId));
    return fallbackId;
  }
  const isUnlocked = unlockedAvatars.some((avatar) => avatar.id === stored);
  const safeId = isUnlocked ? stored : fallbackId;
  if (safeId !== stored) {
    localStorage.setItem(AVATAR_KEY, String(safeId));
  }
  return safeId;
}

function applyAvatar(el, avatar) {
  if (!el || !avatar) return;
  if (avatar.src) {
    el.textContent = '';
    el.style.backgroundImage = `url(${resolveAssetPath(avatar.src)})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  } else {
    el.textContent = avatar.label;
    el.style.background = `radial-gradient(circle at 30% 30%, #ffffff, ${avatar.color} 65%)`;
  }
}

function resolveAssetPath(path) {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return path;
  return window.location.pathname.includes('/game/') ? `../${path}` : path;
}

function applyThemeFromStorage() {
  const stored = localStorage.getItem(THEME_PATH_KEY);
  if (!stored) return;
  const resolved = resolveAssetPath(stored);
  document.body.style.setProperty('--game-bg-image', `url('${resolved}')`);
}

function applyCardPackFromStorage() {
  const stored = localStorage.getItem(CARD_PACK_PATH_KEY);
  if (!stored) {
    document.body.style.removeProperty('--card-pack-image');
    document.body.classList.remove('has-custom-card-pack');
    return;
  }
  const resolved = resolveAssetPath(stored);
  document.body.style.setProperty('--card-pack-image', `url('${resolved}')`);
  document.body.classList.add('has-custom-card-pack');
}

function clearSavedMatch() {
  localStorage.removeItem(resumeKey);
}

function loadSavedMatch() {
  try {
    const raw = localStorage.getItem(resumeKey);
    const parsed = JSON.parse(raw || 'null');
    if (!parsed || parsed.mode !== selectedMode || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCurrentMatch() {
  if (game.isFinished()) {
    clearSavedMatch();
    return;
  }
  try {
    localStorage.setItem(resumeKey, JSON.stringify({
      version: 1,
      mode: selectedMode,
      level: selectedLevel,
      stage: selectedStage,
      savedAt: Date.now(),
      opponentAvatars,
      matchRecorded,
      state: game.serialize()
    }));
  } catch {
    // Ignore quota/storage failures so gameplay keeps running.
  }
}

async function requestFullscreenMode() {
  const target = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement || !target) return;
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' });
      return;
    }
    if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
    }
  } catch {
    // Some browsers require a fresh user gesture before fullscreen.
  }
}

function startFullscreenWatchdog() {
  if (fullscreenWatchdogId) {
    window.clearInterval(fullscreenWatchdogId);
    fullscreenWatchdogId = null;
  }
  let tries = 0;
  fullscreenWatchdogId = window.setInterval(() => {
    tries += 1;
    activateLandscapeMode();
    const fullscreenReady = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if ((fullscreenReady && !isPortraitOrientation()) || tries >= 28) {
      window.clearInterval(fullscreenWatchdogId);
      fullscreenWatchdogId = null;
    }
  }, 320);
}

function cancelAITurns() {
  aiTurnToken += 1;
}

function setPaused(nextPaused) {
  isPaused = nextPaused;
  if (isPaused) {
    cancelAITurns();
    pauseBackgroundMusic();
  } else {
    resumeBackgroundMusic();
  }
  dom.pauseModal?.classList.toggle('hidden', !isPaused);
  dom.gameShell?.classList.toggle('is-paused', isPaused);
  render();
}

function restoreSavedMatch() {
  const snapshot = loadSavedMatch();
  if (!snapshot) return false;
  try {
    game.restore(snapshot.state);
  } catch {
    clearSavedMatch();
    return false;
  }

  if (game.isFinished()) {
    clearSavedMatch();
    return false;
  }

  selectedWildCard = null;
  selectedWildCardEl = null;
  matchRecorded = Boolean(snapshot.matchRecorded);
  lastPendingUno = game.getPendingUnoPlayer();
  opponentAvatars = Array.isArray(snapshot.opponentAvatars) && snapshot.opponentAvatars.length === 3
    ? snapshot.opponentAvatars
    : pickOpponentAvatars();
  configureModeUI();
  applyThemeFromStorage();
  applyCardPackFromStorage();
  syncRewardQueueSize();
  cancelAITurns();
  render();
  runAITurns();
  return true;
}

function addAnimationClass(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  const onEnd = () => {
    el.classList.remove(className);
    el.removeEventListener('animationend', onEnd);
  };
  el.addEventListener('animationend', onEnd);
}

function getCenterPoint(el) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0 };
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height
  };
}

function getCenterFromRect(rect) {
  if (!rect) return { x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0 };
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height
  };
}

function buildCardElement(card, { back = false } = {}) {
  const wrapper = document.createElement('div');
  if (back) {
    wrapper.className = 'uno-card uno-card--back';
    return wrapper;
  }
  const color = card?.color || (card?.type === 'wild' ? 'wild' : 'wild');
  const valueClass = getValueClass(card);
  const cornerMarkup = getCornerMarkup(card);
  wrapper.className = `uno-card uno-card--${color} ${valueClass}`;
  wrapper.innerHTML = `
    <div class="uno-card__inner">
      <div class="uno-card__oval">
        ${getCardCenterMarkup(card)}
      </div>
      <span class="uno-card__corner uno-card__corner--tl">${cornerMarkup}</span>
      <span class="uno-card__corner uno-card__corner--br">${cornerMarkup}</span>
    </div>
  `;
  return wrapper;
}

function createFlyingCard({ fromEl, fromRect, toEl, card, back = false, duration = 760, arc = 90 } = {}) {
  const start = fromRect ? getCenterFromRect(fromRect) : getCenterPoint(fromEl);
  const end = getCenterPoint(toEl || dom.centerZone);
  const fly = document.createElement('div');
  fly.className = 'card-fly';
  const cardEl = buildCardElement(card, { back });
  fly.appendChild(cardEl);

  const width = start.width || 70;
  const height = start.height || width * 1.4;
  fly.style.width = `${width}px`;
  fly.style.height = `${height}px`;
  fly.style.left = `${start.x - width / 2}px`;
  fly.style.top = `${start.y - height / 2}px`;

  document.body.appendChild(fly);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const arcHeight = Math.min(120, Math.max(40, Math.abs(dx) * 0.16)) + arc * 0.12;

  fly.animate(
    [
      { transform: 'translate(0px, 0px) scale(1)', opacity: 0.95 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - arcHeight}px) scale(1.05)`, opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(1.02)`, opacity: 1, offset: 0.82 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1 }
    ],
    {
      duration,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'forwards'
    }
  ).onfinish = () => {
    fly.remove();
  };
}

function getOpponentStack(playerIndex) {
  if (playerIndex === 1) return dom.playerLeft?.querySelector('.card-back-stack');
  if (playerIndex === 2) return dom.playerTop?.querySelector('.card-back-stack');
  if (playerIndex === 3) return dom.playerRight?.querySelector('.card-back-stack');
  return null;
}

function getPlayerTarget(playerIndex) {
  if (playerIndex === 0) return dom.handCards;
  return getOpponentStack(playerIndex);
}

function animateDrawToPlayer(playerIndex, count = 1, { wasPenalty = false } = {}) {
  if (wasPenalty && drawAnimationSuppress[playerIndex] >= count) {
    drawAnimationSuppress[playerIndex] -= count;
    return;
  }
  addAnimationClass(dom.drawPile, 'deck-glow');
  const targets = [];
  if (playerIndex === 0 && dom.handCards) {
    const cards = Array.from(dom.handCards.querySelectorAll('.uno-card'));
    for (let i = 0; i < count; i += 1) {
      const target = cards[cards.length - 1 - i];
      if (target) {
        target.style.visibility = 'hidden';
        targets.unshift(target);
      }
    }
  }
  for (let i = 0; i < count; i += 1) {
    const target = targets[i] || getPlayerTarget(playerIndex);
    const delay = i * 120;
    setTimeout(() => {
      createFlyingCard({
        fromEl: dom.drawPile,
        toEl: target,
        back: true,
        duration: 780
      });
      if (target && playerIndex === 0) {
        setTimeout(() => {
          target.style.visibility = 'visible';
          addAnimationClass(target, 'card-land');
        }, 680);
      }
    }, delay);
  }
}

function animatePlayCardFromElement(card, sourceRect = null, sourceEl = null) {
  if (!sourceRect && !sourceEl) return;
  addAnimationClass(dom.centerZone, 'table-shake');
  createFlyingCard({
    fromRect: sourceRect,
    fromEl: sourceEl,
    toEl: dom.discardCard,
    card,
    back: false,
    duration: 640,
    arc: 60
  });
  addAnimationClass(dom.discardCard, 'discard-slam');
}

function animatePlayCardFromPlayer(playerIndex, card) {
  const fromEl = playerIndex === 0 ? dom.handCards : getOpponentStack(playerIndex);
  addAnimationClass(dom.centerZone, 'table-shake');
  createFlyingCard({
    fromEl,
    toEl: dom.discardCard,
    card,
    back: false,
    duration: 660,
    arc: 65
  });
  addAnimationClass(dom.discardCard, 'discard-slam');
}

function pulseAvatar(playerIndex) {
  const avatarEl = playerIndex === 0
    ? dom.avatarBottom
    : playerIndex === 1
      ? dom.avatarLeft
      : playerIndex === 2
        ? dom.avatarTop
        : dom.avatarRight;
  addAnimationClass(avatarEl, 'avatar-pulse');
}

function animatePenaltyAttack(targetIndex, count) {
  drawAnimationSuppress[targetIndex] += count;
  addAnimationClass(dom.drawPile, 'deck-glow');
  if (count >= 4) addAnimationClass(dom.centerZone, 'draw4-flash');
  for (let i = 0; i < count; i += 1) {
    setTimeout(() => {
      createFlyingCard({
        fromEl: dom.drawPile,
        toEl: getPlayerTarget(targetIndex),
        back: true,
        duration: 700,
        arc: 55
      });
    }, i * 140);
  }
  pulseAvatar(targetIndex);
}

function showUnoPop(playerIndex) {
  if (!dom.gameShell) return;
  playSfx('unoAlert', 0.9);
  pulseAvatar(playerIndex);
  const anchor = playerIndex === 0
    ? dom.avatarBottom
    : playerIndex === 1
      ? dom.avatarLeft
      : playerIndex === 2
        ? dom.avatarTop
        : dom.avatarRight;
  if (!anchor) return;
  const pop = document.createElement('div');
  pop.className = 'uno-pop';
  pop.textContent = 'UNO';
  dom.gameShell.appendChild(pop);
  const shellRect = dom.gameShell.getBoundingClientRect();
  const rect = anchor.getBoundingClientRect();
  const x = rect.left - shellRect.left + rect.width / 2;
  const y = rect.top - shellRect.top - 16;
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  const width = pop.offsetWidth || 0;
  if (width) {
    pop.style.left = `${x - width / 2}px`;
  }
  pop.addEventListener('animationend', () => pop.remove());
}

function animateVictory() {
  addAnimationClass(dom.centerZone, 'victory-glow');
  const bursts = 8;
  for (let i = 0; i < bursts; i += 1) {
    const burst = document.createElement('div');
    burst.className = 'card-burst';
    const angle = (Math.PI * 2 * i) / bursts;
    const distance = 120 + Math.random() * 60;
    burst.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
    burst.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
    burst.style.setProperty('--burst-rot', `${Math.random() * 90 - 45}deg`);
    burst.appendChild(buildCardElement(null, { back: true }));
    document.body.appendChild(burst);
    const center = getCenterPoint(dom.centerZone);
    burst.style.left = `${center.x - 20}px`;
    burst.style.top = `${center.y - 28}px`;
    burst.addEventListener('animationend', () => burst.remove());
  }
}

function animateGameStart() {
  addAnimationClass(dom.drawPile, 'shuffle-deck');
  const order = Array.from({ length: game.playerCount }, (_, index) => index);
  let delay = 240;
  for (let r = 0; r < 7; r += 1) {
    order.forEach((pid) => {
      setTimeout(() => {
        createFlyingCard({
          fromEl: dom.drawPile,
          toEl: getPlayerTarget(pid),
          back: true,
          duration: 560,
          arc: 40
        });
      }, delay);
      delay += 85;
    });
  }
}

function pickOpponentAvatars() {
  if (avatars.length === 0) return [];
  const selectedId = getSelectedAvatar();
  const pool = avatars.filter((avatar) => avatar.id !== selectedId);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks = [];
  for (let i = 0; i < 3; i += 1) {
    picks.push(pool[i] || avatars[0]);
  }
  return picks;
}

function renderAvatars() {
  if (avatars.length === 0) return;
  const selectedId = getSelectedAvatar();
  const selected = avatars.find((a) => a.id === selectedId) || avatars[0];
  if (opponentAvatars.length !== 3) {
    opponentAvatars = pickOpponentAvatars();
  }
  applyAvatar(dom.avatarBottom, selected);
  applyAvatar(dom.avatarLeft, opponentAvatars[0]);
  applyAvatar(dom.avatarTop, opponentAvatars[1]);
  applyAvatar(dom.avatarRight, opponentAvatars[2]);
}

function getPersonaForPlayer(playerIndex) {
  if (playerIndex === 1) return opponentAvatars[0]?.id ?? null;
  if (playerIndex === 2) return opponentAvatars[1]?.id ?? null;
  if (playerIndex === 3) return opponentAvatars[2]?.id ?? null;
  return null;
}

const reactions = {
  gameStart: '\u{1F642}',
  drawCard: '\u{1F914}',
  playCard: '\u{1F60F}',
  playDraw2: '\u{1F608}',
  playDraw4: '\u{1F525}',
  skipOpponent: '\u{1F61C}',
  callUno: '\u{1F4E3}',
  opponentUno: '\u{1F631}',
  winGame: '\u{1F3C6}',
  loseGame: '\u{1F62D}'
};

const catchphrases = {
  1: {
    gameStart: ["Let's have a good match!", "Good luck everyone!"],
    callUno: ["UNO!"],
    winGame: ["Nice game!"]
  },
  2: { gameStart: ["Game on!", "Let's do this!"], playAttack: ["Level up!"] },
  3: { gameStart: ["Feeling lucky today!", "Cards favor me!"], playAttack: ["Lucky strike!"], winGame: ["Luck wins again!", "Victory unlocked!"] },
  4: { gameStart: ["Let's play..."], skipOpponent: ["Too slow!"], playAttack: ["Didn't see that coming!"], winGame: ["Outplayed."] },
  5: { gameStart: ["Initializing game."], playAttack: ["Strategic move executed."], winGame: ["Victory confirmed."] },
  6: { gameStart: ["Let's cause chaos!"], playAttack: ["Oops!"], winGame: ["Chaos wins!"] },
  7: { gameStart: ["Stay cool."], skipOpponent: ["Chill out."], winGame: ["Cool victory."] },
  8: { gameStart: ["Let the flames rise!"], playAttack: ["Burn!"], winGame: ["Dragon triumph!"] },
  9: { gameStart: ["Greetings, human."], playAttack: ["Alien technology!"], winGame: ["Planet victory."] },
  10: { gameStart: ["Silence..."], skipOpponent: ["Too slow."], winGame: ["Shadow wins."] },
  11: { gameStart: ["Magic begins!"], playAttack: ["Spell cast!"], winGame: ["Wizard victory!"] },
  12: { gameStart: ["Shuffle the deck!"], playAttack: ["Treasure attack!"], winGame: ["Captain wins!"] },
  13: { gameStart: ["Time begins."], playAttack: ["Future predicted."], winGame: ["Time favors me."] },
  14: { gameStart: ["Watch closely."], playAttack: ["Magic trick!"], winGame: ["Ta-da!"] },
  15: { gameStart: ["Justice begins."], playAttack: ["Justice served!"], winGame: ["Hero wins!"] },
  16: { gameStart: ["Launching game."], playAttack: ["Cosmic strike!"], winGame: ["Galaxy victory."] },
  17: { gameStart: ["Fire awakens."], playAttack: ["Burn!"], winGame: ["Ashes remain."] },
  18: { gameStart: ["Wisdom guides me."], playAttack: ["Crystal strike."], winGame: ["Balance restored."] },
  19: { gameStart: ["Colors shine!"], playAttack: ["Rainbow attack!"], winGame: ["Shining victory!"] },
  20: { gameStart: ["Bow before the king."], playAttack: ["Royal command!"], winGame: ["The throne is mine."] }
};

function pickCatchphrase(playerIndex, eventKey) {
  const avatar = playerIndex === 0
    ? avatars.find((a) => a.id === getSelectedAvatar())
    : opponentAvatars[playerIndex - 1];
  if (!avatar) return null;
  const phrases = catchphrases[avatar.id]?.[eventKey];
  if (!phrases || phrases.length === 0) return null;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function shouldOpponentSpeak(eventKey, targetIndex) {
  if (eventKey === 'gameStart') return true;
  if (eventKey === 'drawCard' || eventKey === 'playCard') return Math.random() < 0.55;
  if (eventKey === 'callUno') return true;
  if (eventKey === 'winGame' || eventKey === 'loseGame') return true;
  return targetIndex === 0;
}

function maybeShowSpeech(playerIndex, eventKey, phraseKey = eventKey, targetIndex = null) {
  if (playerIndex === 0) {
    showSpeech(playerIndex, eventKey, phraseKey);
    return;
  }
  if (shouldOpponentSpeak(eventKey, targetIndex)) {
    showSpeech(playerIndex, eventKey, phraseKey);
  }
}
function showSpeech(playerIndex, eventKey, phraseKey = eventKey) {
  if (!dom.gameShell) return;
  if (!isSpeechEnabled()) return;
  const now = Date.now();
  if (eventKey !== 'winGame' && eventKey !== 'loseGame') {
    if (now - lastSpeechAt[playerIndex] < 2800) return;
    lastSpeechAt[playerIndex] = now;
  }

  const avatarEl = playerIndex === 0
    ? dom.avatarBottom
    : playerIndex === 1
      ? dom.avatarLeft
      : playerIndex === 2
        ? dom.avatarTop
        : dom.avatarRight;
  if (!avatarEl) return;

  const emoji = areReactionsEnabled() ? reactions[eventKey] || '' : '';
  const phrase = pickCatchphrase(playerIndex, phraseKey);
  if (!emoji && !phrase) return;

  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  bubble.innerHTML = `
    ${emoji ? `<div class="speech-bubble__emoji">${emoji}</div>` : ''}
    ${phrase ? `<div class="speech-bubble__text">${phrase}</div>` : ''}
  `;
  const stackIndex = bubbleStacks[playerIndex];
  bubbleStacks[playerIndex] = Math.min(3, bubbleStacks[playerIndex] + 1);
  dom.gameShell.appendChild(bubble);

  const avatarRect = avatarEl.getBoundingClientRect();
  const shellRect = dom.gameShell.getBoundingClientRect();
  const compactLayout = shellRect.height <= 430 || shellRect.width <= 760;
  if (compactLayout) bubble.classList.add('speech-bubble--compact');
  const startX = avatarRect.left - shellRect.left + avatarRect.width / 2;
  const startY = avatarRect.top - shellRect.top + avatarRect.height / 2;
  const bubbleWidth = bubble.offsetWidth || (compactLayout ? 140 : 160);
  const clampedStartX = Math.min(
    Math.max(startX, bubbleWidth / 2 + 10),
    shellRect.width - bubbleWidth / 2 - 10
  );
  const baseMargin = compactLayout
    ? (playerIndex === 0 ? 96 : playerIndex === 2 ? 136 : 116)
    : (playerIndex === 0 ? 150 : playerIndex === 2 ? 230 : 190);
  const stackOffset = stackIndex * (compactLayout ? 48 : 70);
  const rawTargetY = shellRect.height - baseMargin - stackOffset;
  const minTargetY = compactLayout ? 18 : 28;
  const maxTargetY = shellRect.height - (compactLayout ? 56 : 72);
  const targetY = Math.min(Math.max(rawTargetY, minTargetY), maxTargetY);
  const laneX = playerIndex === 1
    ? shellRect.width * 0.24
    : playerIndex === 3
      ? shellRect.width * 0.76
      : shellRect.width * 0.5;
  const targetX = Math.min(
    Math.max(laneX, bubbleWidth / 2 + 10),
    shellRect.width - bubbleWidth / 2 - 10
  );
  const dx = targetX - clampedStartX;
  const dy = targetY - startY;

  bubble.style.left = `${clampedStartX}px`;
  bubble.style.top = `${startY}px`;
  const cleanup = () => {
    bubble.remove();
    bubbleStacks[playerIndex] = Math.max(0, bubbleStacks[playerIndex] - 1);
  };
  const keyframes = [
    { transform: 'translate(0px, 0px) scale(0.9)', opacity: 0 },
    { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.28 },
    { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.8 },
    { transform: `translate(${dx}px, ${dy + 24}px) scale(0.95)`, opacity: 0, offset: 1 }
  ];

  if (typeof bubble.animate === 'function') {
    bubble.animate(
      keyframes,
      { duration: 7600, easing: 'ease-in-out', fill: 'forwards' }
    ).onfinish = cleanup;
    return;
  }

  bubble.style.opacity = '0';
  bubble.style.transform = 'translate(0px, 0px) scale(0.9)';
  bubble.style.transition = 'transform 540ms ease, opacity 540ms ease';
  window.requestAnimationFrame(() => {
    bubble.style.opacity = '1';
    bubble.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
  });
  window.setTimeout(() => {
    bubble.style.transition = 'transform 620ms ease, opacity 620ms ease';
    bubble.style.opacity = '0';
    bubble.style.transform = `translate(${dx}px, ${dy + 24}px) scale(0.95)`;
  }, 5200);
  window.setTimeout(cleanup, 6000);
}

function getCardDisplay(card) {
  if (!card) return '--';
  const map = { skip: 'SKIP', reverse: 'REV', draw2: '+2', wild: 'WILD', wild4: '+4' };
  return map[card.value] ?? card.value;
}

function getCornerMarkup(card) {
  if (card?.value === 'skip') {
    return `
      <svg class="uno-card__corner-icon" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="12"></circle>
        <line x1="30" y1="70" x2="70" y2="30" stroke="currentColor" stroke-width="12" stroke-linecap="round"></line>
      </svg>
    `;
  }
  if (card?.value === 'reverse') {
    return `
      <svg class="uno-card__corner-icon uno-card__icon--reverse" viewBox="0 0 120 120" aria-hidden="true">
        <path class="rev-arc--shadow-small" d="M28 46 C42 24 78 24 92 46"></path>
        <path class="rev-arc-small" d="M28 46 C42 24 78 24 92 46"></path>
        <polygon class="rev-head--shadow-small" points="92,46 86,28 106,38"></polygon>
        <polygon class="rev-head-small" points="92,46 86,28 106,38"></polygon>
        <path class="rev-arc--shadow-small" d="M92 74 C78 96 42 96 28 74"></path>
        <path class="rev-arc-small" d="M92 74 C78 96 42 96 28 74"></path>
        <polygon class="rev-head--shadow-small" points="28,74 34,92 14,82"></polygon>
        <polygon class="rev-head-small" points="28,74 34,92 14,82"></polygon>
      </svg>
    `;
  }
  if (card?.value === 'wild') {
    return '<span class="uno-card__corner-wheel"></span>';
  }
  return getCardDisplay(card);
}

function getCardCenterMarkup(card) {
  if (!card) return '<span class="uno-card__center">--</span>';
  if (card.value === 'skip') {
    return `
      <svg class="uno-card__icon" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="10"></circle>
        <line x1="30" y1="70" x2="70" y2="30" stroke="currentColor" stroke-width="10" stroke-linecap="round"></line>
      </svg>
    `;
  }
  if (card.value === 'reverse') {
    return `
      <svg class="uno-card__icon uno-card__icon--reverse" viewBox="0 0 120 120" aria-hidden="true">
        <path class="rev-arc--shadow" d="M28 46 C42 24 78 24 92 46"></path>
        <path class="rev-arc" d="M28 46 C42 24 78 24 92 46"></path>
        <polygon class="rev-head--shadow" points="92,46 86,28 106,38"></polygon>
        <polygon class="rev-head" points="92,46 86,28 106,38"></polygon>
        <path class="rev-arc--shadow" d="M92 74 C78 96 42 96 28 74"></path>
        <path class="rev-arc" d="M92 74 C78 96 42 96 28 74"></path>
        <polygon class="rev-head--shadow" points="28,74 34,92 14,82"></polygon>
        <polygon class="rev-head" points="28,74 34,92 14,82"></polygon>
      </svg>
    `;
  }
  if (card.value === 'draw2') {
    return `
      <div class="uno-card__stack" aria-hidden="true">
        <span class="uno-card__stack-card"></span>
        <span class="uno-card__stack-card"></span>
      </div>
    `;
  }
  if (card.value === 'wild4') {
    return `
      <div class="wild4-center" aria-hidden="true">
        <div class="wild4-center__cards">
          <span class="wild4-mini wild4-mini--green"></span>
          <span class="wild4-mini wild4-mini--blue"></span>
          <span class="wild4-mini wild4-mini--red"></span>
          <span class="wild4-mini wild4-mini--yellow"></span>
        </div>
      </div>
    `;
  }
  if (card.value === 'wild') {
    return '<span class="uno-card__wheel" aria-hidden="true"></span>';
  }
  return `<span class="uno-card__center">${getCardDisplay(card)}</span>`;
}

function getEffectiveColor() {
  const top = game.getTopCard();
  if (!top) return null;
  if (top.type === 'wild') return game.getCurrentWildColor();
  return top.color;
}

function recordDraw(playerIndex) {
  const effectiveColor = getEffectiveColor();
  if (!effectiveColor) return;
  const memory = aiMemory.colorAvoidance[playerIndex];
  if (!memory) return;
  memory[effectiveColor] = (memory[effectiveColor] || 0) + 1;
}

function getValueClass(card) {
  if (!card) return '';
  const valueMap = {
    skip: 'value-skip',
    reverse: 'value-reverse',
    draw2: 'value-draw2',
    wild4: 'value-wild4'
  };
  return valueMap[card.value] ?? '';
}

function updateOrientationOverlay() {
  const shouldShow = isPortraitOrientation();
  dom.rotateOverlay?.classList.toggle('hidden', !shouldShow);
}

async function tryLockOrientation() {
  if (!screen.orientation?.lock) return;
  try {
    await screen.orientation.lock('landscape');
  } catch {
    // Orientation lock can fail on some devices or without user gesture.
  }
}

function isPortraitOrientation() {
  return window.matchMedia('(orientation: portrait)').matches;
}

async function activateLandscapeMode() {
  markLandscapeIntent();
  await requestFullscreenMode();
  await tryLockOrientation();
  updateOrientationOverlay();
}

function handleOrientationChange() {
  updateOrientationOverlay();
  if (isPortraitOrientation()) return;
  activateLandscapeMode();
  startFullscreenWatchdog();
}

function setActivePlayer(currentIndex) {
  Object.values(playerZoneMap).forEach((zone) => zone?.classList.remove('active'));
  playerZoneMap[currentIndex]?.classList.add('active');
}

function renderOpponentCounts() {
  if (dom.countLeft) dom.countLeft.textContent = game.getHand(1).length;
  if (dom.countTop) dom.countTop.textContent = game.getHand(2).length;
  if (dom.countRight) dom.countRight.textContent = game.getHand(3).length;
}

function renderDiscard() {
  if (!dom.discardCard) return;
  const top = game.getTopCard();
  const value = getCardDisplay(top);
  const cornerMarkup = getCornerMarkup(top);
  const wildColor = game.getCurrentWildColor();
  const color = top?.color || (top?.type === 'wild' && top?.value !== 'wild4' && wildColor ? wildColor : 'wild');
  const valueClass = getValueClass(top);
  dom.discardCard.className = `uno-card uno-card--${color} ${valueClass}`;
  dom.discardCard.innerHTML = `
    <div class="uno-card__inner">
      <div class="uno-card__oval">
        ${getCardCenterMarkup(top)}
      </div>
      <span class="uno-card__corner uno-card__corner--tl">${cornerMarkup}</span>
      <span class="uno-card__corner uno-card__corner--br">${cornerMarkup}</span>
    </div>
  `;
}

function renderHand() {
  if (!dom.handCards) return;
  const hand = game.getHand(0);
  const validIds = new Set(game.getValidMoves(0).map((c) => c.id));
  dom.handCards.innerHTML = hand
    .map((card) => {
      const value = getCardDisplay(card);
      const cornerMarkup = getCornerMarkup(card);
      const color = card.color || 'wild';
      const valueClass = getValueClass(card);
      const validity = validIds.has(card.id) ? 'valid' : 'invalid';
      return `
        <div class="uno-card uno-card--${color} ${valueClass} ${validity}" data-card-id="${card.id}">
          <div class="uno-card__inner">
            <div class="uno-card__oval">
              ${getCardCenterMarkup(card)}
            </div>
            <span class="uno-card__corner uno-card__corner--tl">${cornerMarkup}</span>
            <span class="uno-card__corner uno-card__corner--br">${cornerMarkup}</span>
          </div>
        </div>
      `;
    })
    .join('');
}

function getPlacements() {
  const standings = Array.from({ length: game.playerCount }, (_, index) => ({
    index,
    cards: game.getHand(index).length
  }));
  standings.sort((a, b) => a.cards - b.cards || a.index - b.index);
  const placements = Array(game.playerCount).fill(game.playerCount);
  standings.forEach((entry, idx) => {
    placements[entry.index] = idx + 1;
  });
  return placements;
}

function unlockNextStageProgress() {
  const index = (selectedLevel - 1) * 10 + selectedStage;
  const next = Math.min(index + 1, 100);
  const current = parseInt(localStorage.getItem(progressKey) || '1', 10);
  if (next > current) localStorage.setItem(progressKey, String(next));
}

function handleMatchEnd() {
  if (!game.isFinished() || matchRecorded) return;
  matchRecorded = true;
  clearSavedMatch();
  const winner = game.getWinnerIndex();
  const playerSideWon = isPlayerSideWinner(winner);
  if (playerSideWon) unlockNextStageProgress();
  for (let i = 0; i < game.playerCount; i += 1) {
    if (i === winner) maybeShowSpeech(i, 'winGame');
    else maybeShowSpeech(i, 'loseGame');
  }
  animateVictory();
  recordRewardedAction(() => {
    rewards?.recordMatchResult?.({
      winnerIndex: getRewardWinnerIndex(),
      placements: getRewardPlacements()
    });
  });
  if (playerSideWon) {
    playSfx('win', 0.95);
  }

  if (dom.endModal && dom.endModalTitle && dom.endModalMessage) {
    dom.endModalTitle.textContent = playerSideWon ? 'You Win!' : 'You Lost';
    dom.endModalMessage.textContent = playerSideWon
      ? 'Great job! Ready for the next challenge?'
      : 'Do not give up. Shuffle again and try once more.';
    if (isTeamBattle && playerSideWon && winner === 2) {
      dom.endModalMessage.textContent = 'Your teammate finished the round. Your side still takes the win.';
    }
    if (dom.btnNextLevel) {
      dom.btnNextLevel.style.display = playerSideWon ? 'inline-flex' : 'none';
    }
    dom.endModal.classList.remove('hidden');
  }
}

function render() {
  if (dom.deckCount) dom.deckCount.textContent = game.getDeckLength();
  renderAvatars();
  renderOpponentCounts();
  renderDiscard();
  renderHand();
  setActivePlayer(game.getCurrentPlayerIndex());

  rewards?.recordHandSnapshot?.(
    0,
    game.getHand(0).length,
    Array.from({ length: game.playerCount - 1 }, (_, index) => game.getHand(index + 1).length)
  );

  const isHumanTurn = game.getCurrentPlayerIndex() === 0 && !game.isFinished();
  const mustDraw = isHumanTurn && (game.getPendingDraw() > 0 || game.getValidMoves(0).length === 0);
  if (dom.drawPile) dom.drawPile.classList.toggle('active', mustDraw);
  const canCallUno = game.canCallUno(0);
  if (dom.btnUno) dom.btnUno.disabled = !canCallUno;
  if (dom.unoArrow) dom.unoArrow.classList.toggle('hidden', !canCallUno);
  if (dom.wildPicker) {
    const showPicker = Boolean(selectedWildCard) && !isPaused;
    dom.wildPicker.classList.toggle('hidden', !showPicker);
    if (showPicker) {
      addAnimationClass(dom.wildPicker, 'glow');
    } else {
      dom.wildPicker.removeAttribute('data-color');
      dom.wildPicker.style.removeProperty('--wild-color');
    }
  }
  if (dom.handCards) dom.handCards.classList.toggle('hand-glow', isHumanTurn);

  const pendingUno = game.getPendingUnoPlayer();
  if (pendingUno !== null && pendingUno !== lastPendingUno) {
    maybeShowSpeech(0, 'opponentUno');
    showUnoPop(pendingUno);
    lastPendingUno = pendingUno;
  }
  if (pendingUno === null && lastPendingUno !== null) lastPendingUno = null;

  saveCurrentMatch();
}

function triggerCardEvents(playerIndex, card, targetIndex = null) {
  if (!card) return;
  if (card.value === 'draw2') {
    maybeShowSpeech(playerIndex, 'playDraw2', 'playAttack', targetIndex);
    if (playerIndex === 0 && targetIndex !== null && targetIndex !== 0) {
      maybeShowSpeech(targetIndex, 'playDraw2', 'playAttack', 0);
    }
    return;
  }
  if (card.value === 'wild4') {
    maybeShowSpeech(playerIndex, 'playDraw4', 'playAttack', targetIndex);
    if (playerIndex === 0 && targetIndex !== null && targetIndex !== 0) {
      maybeShowSpeech(targetIndex, 'playDraw4', 'playAttack', 0);
    }
    return;
  }
  if (card.value === 'skip') {
    maybeShowSpeech(playerIndex, 'skipOpponent', 'skipOpponent', targetIndex);
    if (playerIndex === 0 && targetIndex !== null && targetIndex !== 0) {
      maybeShowSpeech(targetIndex, 'skipOpponent', 'skipOpponent', 0);
    }
    return;
  }
  if (card.type === 'number') {
    maybeShowSpeech(playerIndex, 'playCard', 'playCard', targetIndex);
  }
}

function playCard(card, wildColor = null, sourceEl = null, sourcePlayer = null) {
  if (isPaused) return;
  const projectedTarget = card?.value === 'skip' || card?.value === 'draw2' || card?.value === 'wild4'
    ? game.getNextPlayerIndex(0)
    : null;
  const sourceRect = sourceEl ? sourceEl.getBoundingClientRect() : null;
  const result = game.playCard(card, wildColor);
  if (!result.success) return;
  recordRewardedAction(() => {
    rewards?.recordCardPlayed?.(0, card);
  });
  playCardSound(card);
  triggerCardEvents(0, card, projectedTarget);
  selectedWildCard = null;
  selectedWildCardEl = null;
  render();
  if (sourceRect) animatePlayCardFromElement(card, sourceRect, null);
  else if (sourcePlayer !== null) animatePlayCardFromPlayer(sourcePlayer, card);
  if (card.value === 'reverse') addAnimationClass(dom.discardCard, 'reverse-spin');
  if (card.value === 'skip') {
    addAnimationClass(dom.discardCard, 'skip-flash');
    if (projectedTarget !== null) pulseAvatar(projectedTarget);
  }
  if (card.value === 'draw2') animatePenaltyAttack(game.getCurrentPlayerIndex(), 2);
  if (card.value === 'wild4') animatePenaltyAttack(game.getCurrentPlayerIndex(), 4);
  if (card.type === 'wild') {
    addAnimationClass(dom.discardCard, 'wild-rotate');
    addAnimationClass(dom.discardCard, 'wild-glow');
  }
  handleMatchEnd();
  runAITurns();
}

function handleHandClick(event) {
  const cardEl = event.target.closest('.uno-card[data-card-id]');
  if (!cardEl || isPaused || game.isFinished() || game.getCurrentPlayerIndex() !== 0) return;
  const cardId = cardEl.dataset.cardId;
  const hand = game.getHand(0);
  const card = hand.find((c) => c.id === cardId);
  if (!card || !game.isValidPlay(card)) {
    addAnimationClass(cardEl, 'invalid-shake');
    return;
  }
  if (game.canCallUno(0)) {
    addAnimationClass(dom.btnUno, 'invalid-shake');
    return;
  }
  if (card.type === 'wild') {
    selectedWildCard = card;
    selectedWildCardEl = cardEl;
    render();
    return;
  }
  playCard(card, null, cardEl, 0);
}

function handleWildPick(event) {
  if (isPaused) return;
  const btn = event.target.closest('.wild-swatch');
  if (!btn || !selectedWildCard) return;
  const color = btn.dataset.color;
  if (dom.wildPicker) {
    dom.wildPicker.dataset.color = color;
    dom.wildPicker.style.setProperty('--wild-color', wildPalette[color] || color);
  }
  btn.classList.add('selected');
  setTimeout(() => btn.classList.remove('selected'), 1200);
  playCard(selectedWildCard, color, selectedWildCardEl, 0);
}

function handleDrawPile() {
  if (isPaused || game.isFinished() || game.getCurrentPlayerIndex() !== 0) return;
  const mustDraw = game.getPendingDraw() > 0 || game.getValidMoves(0).length === 0;
  if (!mustDraw) return;
  const wasPenalty = game.getPendingDraw() > 0;
  const result = game.draw();
  if (!wasPenalty) recordDraw(0);
  if (result?.drawn) {
    rewards?.recordDraw?.(0, result.drawn.length, result.wasPenalty);
  }
  playSfx('cardDraw', 0.72);
  maybeShowSpeech(0, 'drawCard');
  selectedWildCard = null;
  selectedWildCardEl = null;
  render();
  if (result?.drawn?.length) {
    animateDrawToPlayer(0, result.drawn.length, { wasPenalty });
  }
  runAITurns();
}

function handleUno() {
  if (isPaused) return;
  const result = game.callUno(0);
  if (result.success) {
    recordRewardedAction(() => {
      rewards?.recordUnoCall?.(0);
    });
    playSfx('unoAlert', 0.95);
    maybeShowSpeech(0, 'callUno');
    render();
  }
}

function openNewGameConfirm() {
  if (game.isFinished()) return;
  isPaused = true;
  cancelAITurns();
  dom.gameShell?.classList.add('is-paused');
  dom.newgameModal?.classList.remove('hidden');
  render();
}

function closeNewGameConfirm(resumeTurns = true) {
  dom.newgameModal?.classList.add('hidden');
  dom.gameShell?.classList.remove('is-paused');
  isPaused = false;
  render();
  if (resumeTurns) runAITurns();
}

function handleNewGame() {
  clearSavedMatch();
  cancelAITurns();
  isPaused = false;
  dom.pauseModal?.classList.add('hidden');
  dom.gameShell?.classList.remove('is-paused');
  game.init();
  selectedWildCard = null;
  selectedWildCardEl = null;
  matchRecorded = false;
  lastPendingUno = null;
  opponentAvatars = pickOpponentAvatars();
  configureModeUI();
  applyThemeFromStorage();
  applyCardPackFromStorage();
  rewards?.startNewMatch?.();
  syncRewardQueueSize();
  announceRoundStartSpeech();
  startRoundPresentation();
  tryLockOrientation();
}

function runAITurns() {
  if (isPaused || game.isFinished()) return;
  const pid = game.getCurrentPlayerIndex();
  if (pid === 0) return;

  const turnToken = ++aiTurnToken;
  setTimeout(() => {
    if (turnToken !== aiTurnToken || isPaused || game.isFinished() || game.getCurrentPlayerIndex() === 0) return;
    const aiPid = game.getCurrentPlayerIndex();

    if (game.canCallUno(aiPid)) {
      game.callUno(aiPid);
      maybeShowSpeech(aiPid, 'callUno');
    }

    const wasPenalty = game.getPendingDraw() > 0;
    const move = getAIMove(game, aiPid, {
      level: selectedLevel,
      memory: aiMemory,
      personaId: getPersonaForPlayer(aiPid)
    });
    if (move.action === 'play') {
      const projectedTarget = move.card?.value === 'skip' || move.card?.value === 'draw2' || move.card?.value === 'wild4'
        ? game.getNextPlayerIndex(aiPid)
        : null;
      game.playCard(move.card, move.wildColor);
      playCardSound(move.card);
      render();
      animatePlayCardFromPlayer(aiPid, move.card);
      if (move.card.value === 'reverse') addAnimationClass(dom.discardCard, 'reverse-spin');
      if (move.card.value === 'skip') {
        addAnimationClass(dom.discardCard, 'skip-flash');
        if (projectedTarget !== null) pulseAvatar(projectedTarget);
      }
      if (move.card.value === 'draw2') animatePenaltyAttack(game.getCurrentPlayerIndex(), 2);
      if (move.card.value === 'wild4') animatePenaltyAttack(game.getCurrentPlayerIndex(), 4);
      if (move.card.type === 'wild') {
        addAnimationClass(dom.discardCard, 'wild-rotate');
        addAnimationClass(dom.discardCard, 'wild-glow');
        if (dom.wildPicker && move.wildColor) {
          dom.wildPicker.dataset.color = move.wildColor;
          dom.wildPicker.style.setProperty('--wild-color', wildPalette[move.wildColor] || move.wildColor);
          dom.wildPicker.classList.remove('hidden');
          addAnimationClass(dom.wildPicker, 'glow');
          setTimeout(() => {
            dom.wildPicker.classList.add('hidden');
            dom.wildPicker.removeAttribute('data-color');
            dom.wildPicker.style.removeProperty('--wild-color');
          }, 1200);
        }
      }
      recordRewardedAction(() => {
        rewards?.recordCardPlayed?.(aiPid, move.card);
      });
      triggerCardEvents(aiPid, move.card, projectedTarget);
      handleMatchEnd();
      runAITurns();
      return;
    } else {
      const result = game.draw();
      if (!wasPenalty) recordDraw(aiPid);
      if (result?.drawn?.length) playSfx('cardDraw', 0.66);
      maybeShowSpeech(aiPid, 'drawCard');
      if (result?.drawn?.length) {
        render();
        animateDrawToPlayer(aiPid, result.drawn.length, { wasPenalty });
        handleMatchEnd();
        runAITurns();
        return;
      }
    }
    render();
    handleMatchEnd();
    runAITurns();
  }, 450);
}

function initPhase4UI() {
  initGameAudio();
  markLandscapeIntent();
  activateLandscapeMode();
  startFullscreenWatchdog();
  syncRewardQueueSize();
  if (!shouldRestoreSavedMatch || !restoreSavedMatch()) {
    game.init();
    matchRecorded = false;
    lastPendingUno = null;
    opponentAvatars = pickOpponentAvatars();
    configureModeUI();
    applyThemeFromStorage();
    applyCardPackFromStorage();
    rewards?.startNewMatch?.();
    announceRoundStartSpeech();
    startRoundPresentation();
  }
  updateOrientationOverlay();
  document.body.addEventListener('click', () => {
    unlockAudio();
    activateLandscapeMode();
  }, { once: true });
  document.body.addEventListener('touchstart', () => {
    unlockAudio();
    activateLandscapeMode();
  }, { once: true, passive: true });
  document.body.addEventListener('pointerdown', () => {
    unlockAudio();
    activateLandscapeMode();
  }, { once: true });
  window.addEventListener('resize', updateOrientationOverlay);
  window.addEventListener('orientationchange', handleOrientationChange);
  document.addEventListener('fullscreenchange', updateOrientationOverlay);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveCurrentMatch();
      return;
    }
    activateLandscapeMode();
    startFullscreenWatchdog();
  });
  window.addEventListener('pageshow', () => {
    activateLandscapeMode();
    startFullscreenWatchdog();
  });
  window.addEventListener('beforeunload', saveCurrentMatch);
  window.addEventListener('pagehide', saveCurrentMatch);

  dom.handCards?.addEventListener('click', handleHandClick);
  dom.wildPicker?.addEventListener('click', handleWildPick);
  dom.drawPile?.addEventListener('click', handleDrawPile);
  dom.btnUno?.addEventListener('click', handleUno);
  dom.btnNewIcon?.addEventListener('click', openNewGameConfirm);
  dom.btnPause?.addEventListener('click', () => {
    if (game.isFinished()) return;
    setPaused(true);
  });
  dom.btnResume?.addEventListener('click', () => {
    setPaused(false);
    runAITurns();
  });
  dom.btnSaveExit?.addEventListener('click', () => {
    saveCurrentMatch();
    stopBackgroundMusic();
    window.location.href = `../levels.html?mode=${selectedMode}`;
  });
  dom.btnRestartMatch?.addEventListener('click', () => {
    setPaused(false);
    handleNewGame();
  });
  dom.btnConfirmNewNo?.addEventListener('click', () => {
    closeNewGameConfirm(true);
  });
  dom.btnConfirmNewYes?.addEventListener('click', () => {
    closeNewGameConfirm(false);
    handleNewGame();
  });
  dom.newgameModal?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('confirm-modal__backdrop')) {
      closeNewGameConfirm(true);
    }
  });
  dom.btnBackRoad?.addEventListener('click', () => {
    saveCurrentMatch();
    stopBackgroundMusic();
    window.location.href = `../levels.html?mode=${selectedMode}`;
  });
  if (dom.btnPlayAgain) dom.btnPlayAgain.addEventListener('click', () => {
    if (dom.endModal) dom.endModal.classList.add('hidden');
    handleNewGame();
  });
  if (dom.btnNextLevel) dom.btnNextLevel.addEventListener('click', () => {
    if (dom.endModal) dom.endModal.classList.add('hidden');
    stopBackgroundMusic();
    clearSavedMatch();
    window.location.href = `../levels.html?mode=${selectedMode}`;
  });
  if (dom.btnExit) dom.btnExit.addEventListener('click', () => {
    stopBackgroundMusic();
    window.location.href = '../index.html';
  });
}

export { initPhase4UI };
