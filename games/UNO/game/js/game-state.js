/**
 * UNO Game State - Phase 3
 * Turn manager, win detection, UNO call mechanic.
 */

import {
  createDeck,
  shuffleDeck,
  drawCards,
  resetCardIds
} from './card-engine.js';
import { isValidMove, getValidMoves } from './rules.js';
import { TurnManager, GAME_PHASE, TURN_DIRECTION } from './turn-manager.js';

const CARDS_PER_PLAYER = 7;

/**
 * Game state manager
 */
class GameState {
  constructor(options = {}) {
    this.playerCount = options.playerCount ?? 2;
    this.allowDrawStacking = options.allowDrawStacking ?? true;
    this.enforceWild4 = options.enforceWild4 ?? false;
    this.allowUnoCall = options.allowUnoCall ?? true;
    this.deck = [];
    this.discardPile = [];
    this.hands = [];
    this.turnManager = new TurnManager(this.playerCount);
    this.topCard = null;
    this.currentWildColor = null;
    this.pendingDraw = 0;
    this.pendingUnoPlayer = null; // Player with 1 card who hasn't called UNO
  }

  get currentPlayerIndex() {
    return this.turnManager.getCurrentPlayerIndex();
  }

  get turnDirection() {
    return this.turnManager.getDirection();
  }

  get phase() {
    return this.turnManager.getPhase();
  }

  init() {
    resetCardIds();
    const deck = createDeck();
    shuffleDeck(deck);
    this.deck = deck;
    this.discardPile = [];
    this.hands = Array.from({ length: this.playerCount }, () => []);
    this.turnManager.reset();
    this.topCard = null;
    this.currentWildColor = null;
    this.pendingDraw = 0;
    this.pendingUnoPlayer = null;

    for (let p = 0; p < this.playerCount; p++) {
      const cards = drawCards(this.deck, CARDS_PER_PLAYER);
      this.hands[p].push(...cards);
    }

    let first = null;
    while (!first || first.type === 'wild') {
      if (this.deck.length === 0) {
        this.init();
        return;
      }
      first = drawCards(this.deck, 1)[0];
    }
    this.discardPile.push(first);
    this.topCard = first;

    if (first.value === 'skip' || (first.value === 'reverse' && this.playerCount === 2)) {
      this.turnManager.advance(1);
    } else if (first.value === 'reverse') {
      this.turnManager.reverse();
    } else if (first.value === 'draw2') {
      this.pendingDraw = 2;
      this.turnManager.advance(0);
    }
  }

  _getRuleContext() {
    return {
      currentWildColor: this.currentWildColor,
      pendingDraw: this.pendingDraw,
      allowDrawStacking: this.allowDrawStacking,
      enforceWild4: this.enforceWild4
    };
  }

  isValidPlay(card) {
    if (this.turnManager.isFinished()) return false;
    const hand = this.getHand(this.currentPlayerIndex);
    return isValidMove(card, this.topCard, { ...this._getRuleContext(), hand });
  }

  getValidMoves(playerIndex) {
    const hand = this.getHand(playerIndex);
    return getValidMoves(hand, this.topCard, this._getRuleContext());
  }

  /**
   * Call UNO when you have 1 card
   * @param {number} playerIndex
   * @returns {{ success: boolean, message?: string }}
   */
  callUno(playerIndex) {
    if (!this.allowUnoCall || this.turnManager.isFinished()) {
      return { success: false, message: 'UNO call not available' };
    }
    if (this.getHand(playerIndex).length !== 1) {
      return { success: false, message: 'Must have 1 card to call UNO' };
    }
    if (this.pendingUnoPlayer === playerIndex) {
      this.pendingUnoPlayer = null;
      return { success: true };
    }
    return { success: false, message: 'No pending UNO call' };
  }

  /**
   * Catch another player who didn't call UNO (they draw 2)
   * @param {number} byPlayerIndex - Player who catches (must be current player)
   * @returns {{ success: boolean, message?: string }}
   */
  catchUno(byPlayerIndex) {
    if (!this.allowUnoCall || !this.pendingUnoPlayer) {
      return { success: false, message: 'No one to catch' };
    }
    if (byPlayerIndex !== this.currentPlayerIndex) {
      return { success: false, message: 'Only current player can catch' };
    }
    if (byPlayerIndex === this.pendingUnoPlayer) {
      return { success: false, message: 'Cannot catch yourself' };
    }
    this.drawForPlayer(this.pendingUnoPlayer, 2);
    this.pendingUnoPlayer = null;
    return { success: true };
  }

  playCard(card, wildColor = null) {
    if (this.turnManager.isFinished()) {
      return { success: false, message: 'Game is over' };
    }

    const pid = this.currentPlayerIndex;
    const hand = this.hands[pid];
    const idx = hand.findIndex((c) => c.id === card.id);
    if (idx === -1) return { success: false, message: 'Card not in hand' };
    if (!this.isValidPlay(card)) return { success: false, message: 'Invalid move' };
    if (card.type === 'wild' && !wildColor) {
      return { success: false, message: 'Wild requires color choice' };
    }

    hand.splice(idx, 1);
    this.discardPile.push(card);
    this.topCard = card;
    this.currentWildColor = card.type === 'wild' ? wildColor : null;

    // Win detection: 0 cards left
    if (hand.length === 0) {
      this.turnManager.setFinished(pid);
      return { success: true, winnerIndex: pid };
    }

    // UNO: played down to 1 card – must call before next player plays
    if (hand.length === 1) {
      this.pendingUnoPlayer = pid;
    }

    if (card.value === 'wild4') {
      this.pendingDraw = this.allowDrawStacking ? this.pendingDraw + 4 : 4;
      this.turnManager.advance(0);
    } else if (card.value === 'draw2') {
      this.pendingDraw = this.allowDrawStacking ? this.pendingDraw + 2 : 2;
      this.turnManager.advance(0);
    } else if (card.value === 'skip') {
      this.turnManager.advance(1);
    } else if (card.value === 'reverse') {
      this.turnManager.reverse();
      if (this.playerCount === 2) this.turnManager.advance(1);
    } else {
      this.turnManager.advance(0);
    }

    return { success: true };
  }

  draw() {
    if (this.turnManager.isFinished()) {
      return { success: false, message: 'Game is over' };
    }

    const pid = this.currentPlayerIndex;
    if (this.pendingDraw > 0) {
      const drawn = this.drawForPlayer(pid, this.pendingDraw);
      this.pendingDraw = 0;
      this.turnManager.advance(0);
      return { success: true, drawn, wasPenalty: true };
    }
    const drawn = this.drawForPlayer(pid, 1);
    this.turnManager.advance(0);

    if (this.getHand(pid).length === 1) {
      this.pendingUnoPlayer = pid;
    }

    return { success: true, drawn, wasPenalty: false };
  }

  getCurrentPlayerIndex() {
    return this.turnManager.getCurrentPlayerIndex();
  }

  getCurrentHand() {
    return this.hands[this.currentPlayerIndex] ?? [];
  }

  getHand(playerIndex) {
    return this.hands[playerIndex] ?? [];
  }

  getWinnerIndex() {
    return this.turnManager.getWinnerIndex();
  }

  isFinished() {
    return this.turnManager.isFinished();
  }

  getPendingUnoPlayer() {
    return this.pendingUnoPlayer;
  }

  canCallUno(playerIndex) {
    if (!this.allowUnoCall || this.turnManager.isFinished()) return false;
    return this.pendingUnoPlayer === playerIndex && this.getHand(playerIndex).length === 1;
  }

  canCatchUno(byPlayerIndex) {
    if (!this.allowUnoCall || this.turnManager.isFinished()) return false;
    if (this.pendingUnoPlayer === null) return false;
    if (byPlayerIndex !== this.currentPlayerIndex) return false;
    return byPlayerIndex !== this.pendingUnoPlayer;
  }

  getNextPlayerIndex(skipCount = 0) {
    const direction = this.turnManager.getDirection();
    const step = direction * (1 + skipCount);
    return (this.currentPlayerIndex + step + this.playerCount * 10) % this.playerCount;
  }

  _reshuffleDeckFromDiscard() {
    if (this.discardPile.length <= 1) return;
    const top = this.discardPile.pop();
    this.deck.push(...this.discardPile);
    this.discardPile = [top];
    this.topCard = top;
    shuffleDeck(this.deck);
  }

  drawForPlayer(playerIndex, count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) this._reshuffleDeckFromDiscard();
      const batch = drawCards(this.deck, 1);
      if (batch.length > 0) {
        drawn.push(batch[0]);
        this.hands[playerIndex].push(batch[0]);
      } else break;
    }
    return drawn;
  }

  getDeckLength() {
    return this.deck.length;
  }

  getDiscardLength() {
    return this.discardPile.length;
  }

  getTopCard() {
    return this.topCard;
  }

  getPendingDraw() {
    return this.pendingDraw;
  }

  getCurrentWildColor() {
    return this.currentWildColor;
  }

  toJSON() {
    return {
      playerCount: this.playerCount,
      currentPlayerIndex: this.getCurrentPlayerIndex(),
      turnDirection: this.turnDirection,
      phase: this.phase,
      winnerIndex: this.getWinnerIndex(),
      pendingDraw: this.pendingDraw,
      enforceWild4: this.enforceWild4,
      currentWildColor: this.currentWildColor,
      pendingUnoPlayer: this.pendingUnoPlayer,
      deckLength: this.deck.length,
      discardLength: this.discardPile.length,
      handsLengths: this.hands.map((h) => h.length),
      topCard: this.topCard
    };
  }
}

export { GameState, CARDS_PER_PLAYER, GAME_PHASE, TURN_DIRECTION };
