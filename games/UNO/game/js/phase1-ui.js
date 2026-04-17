/**
 * Phase 1 UI: renders state for deck, hands, and turn system.
 */

import { Phase1State } from './phase1-state.js';

const state = new Phase1State({ playerCount: 4, cardsPerPlayer: 7 });

const dom = {
  deckCount: document.getElementById('deck-count'),
  deckCountBadge: document.getElementById('deck-count-badge'),
  currentTurn: document.getElementById('current-turn'),
  turnDirection: document.getElementById('turn-direction'),
  handCount: document.getElementById('hand-count'),
  handCards: document.getElementById('hand-cards'),
  playersList: document.getElementById('players-list'),
  lastDrawnCard: document.getElementById('last-drawn-card'),
  btnDraw: document.getElementById('btn-draw'),
  btnEndTurn: document.getElementById('btn-end-turn'),
  btnNewGame: document.getElementById('btn-new-game')
};

function getCardDisplay(card) {
  if (!card) return '--';
  const map = { skip: 'Skip', reverse: 'Rev', draw2: '+2', wild: 'W', wild4: '+4' };
  return map[card.value] ?? card.value;
}

function renderDeck(snapshot) {
  const deckLen = snapshot.deckLength;
  if (dom.deckCount) dom.deckCount.textContent = deckLen;
  if (dom.deckCountBadge) dom.deckCountBadge.textContent = deckLen;
}

function renderTurn(snapshot) {
  const player = snapshot.currentPlayerIndex + 1;
  if (dom.currentTurn) dom.currentTurn.textContent = `P${player}`;
  if (dom.turnDirection) {
    dom.turnDirection.textContent = snapshot.direction === 1 ? 'Clockwise' : 'Counter';
  }
}

function renderPlayers(snapshot) {
  if (!dom.playersList) return;
  const active = snapshot.currentPlayerIndex;
  dom.playersList.innerHTML = snapshot.handsLengths
    .map((count, idx) => {
      const isActive = idx === active ? 'active' : '';
      return `
        <div class="player-card ${isActive}">
          <span class="player-label">Player ${idx + 1}</span>
          <span class="player-value">${count} cards</span>
        </div>
      `;
    })
    .join('');
}

function renderHand(snapshot) {
  if (dom.handCount) dom.handCount.textContent = snapshot.currentHand.length;
  if (!dom.handCards) return;
  dom.handCards.innerHTML = snapshot.currentHand
    .map((card) => {
      const color = card.color || 'wild';
      const value = getCardDisplay(card);
      return `
        <div class="card card-hand card--${color}" aria-label="${color} ${value}">
          <div class="card-face">
            <span class="card-value">${value}</span>
            <span class="card-type">${color}</span>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderLastDrawn(snapshot) {
  if (!dom.lastDrawnCard) return;
  const card = snapshot.lastDrawnCard;
  const color = card?.color || 'wild';
  const value = getCardDisplay(card);
  dom.lastDrawnCard.className = `card card-display card--${color}`;
  dom.lastDrawnCard.innerHTML = `
    <div class="card-face">
      <span class="card-value">${value}</span>
      <span class="card-type">${color}</span>
    </div>
  `;
}

function render() {
  const snapshot = state.getSnapshot();
  renderDeck(snapshot);
  renderTurn(snapshot);
  renderPlayers(snapshot);
  renderHand(snapshot);
  renderLastDrawn(snapshot);
  if (dom.btnDraw) dom.btnDraw.disabled = snapshot.deckLength === 0;
}

function handleDraw() {
  state.drawForCurrentPlayer(1);
  render();
}

function handleEndTurn() {
  state.advanceTurn(0);
  render();
}

function handleNewGame() {
  state.init();
  render();
}

function initPhase1UI() {
  state.init();
  render();

  dom.btnDraw?.addEventListener('click', handleDraw);
  dom.btnEndTurn?.addEventListener('click', handleEndTurn);
  dom.btnNewGame?.addEventListener('click', handleNewGame);
}

export { initPhase1UI };
