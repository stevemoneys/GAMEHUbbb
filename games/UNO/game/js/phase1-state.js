/**
 * Phase 1 state: deck generation, shuffle, draw, hands, turn state.
 * Pure logic, no DOM access.
 */

import {
  createDeck,
  shuffleDeck,
  drawCards,
  resetCardIds
} from './card-engine.js';
import { TurnManager, TURN_DIRECTION } from './turn-manager.js';

class Phase1State {
  constructor(options = {}) {
    this.playerCount = options.playerCount ?? 4;
    this.cardsPerPlayer = options.cardsPerPlayer ?? 7;
    this.deck = [];
    this.hands = [];
    this.turnManager = new TurnManager(this.playerCount);
    this.lastDrawnCard = null;
  }

  init() {
    resetCardIds();
    const deck = createDeck();
    shuffleDeck(deck);
    this.deck = deck;
    this.hands = Array.from({ length: this.playerCount }, () => []);
    this.turnManager.reset();
    this.lastDrawnCard = null;

    for (let p = 0; p < this.playerCount; p++) {
      const cards = drawCards(this.deck, this.cardsPerPlayer);
      this.hands[p].push(...cards);
    }
  }

  getCurrentPlayerIndex() {
    return this.turnManager.getCurrentPlayerIndex();
  }

  getDirection() {
    return this.turnManager.getDirection();
  }

  isClockwise() {
    return this.turnManager.getDirection() === TURN_DIRECTION.CLOCKWISE;
  }

  getDeckLength() {
    return this.deck.length;
  }

  getHand(playerIndex) {
    return this.hands[playerIndex] ?? [];
  }

  getHandsLengths() {
    return this.hands.map((hand) => hand.length);
  }

  getLastDrawnCard() {
    return this.lastDrawnCard;
  }

  drawForPlayer(playerIndex, count = 1) {
    if (this.deck.length === 0) return [];
    const drawn = drawCards(this.deck, Math.min(count, this.deck.length));
    this.hands[playerIndex].push(...drawn);
    this.lastDrawnCard = drawn[drawn.length - 1] ?? this.lastDrawnCard;
    return drawn;
  }

  drawForCurrentPlayer(count = 1) {
    const pid = this.getCurrentPlayerIndex();
    return this.drawForPlayer(pid, count);
  }

  advanceTurn(skipCount = 0) {
    this.turnManager.advance(skipCount);
  }

  getSnapshot() {
    return {
      playerCount: this.playerCount,
      cardsPerPlayer: this.cardsPerPlayer,
      deckLength: this.getDeckLength(),
      handsLengths: this.getHandsLengths(),
      currentPlayerIndex: this.getCurrentPlayerIndex(),
      direction: this.getDirection(),
      lastDrawnCard: this.getLastDrawnCard(),
      currentHand: this.getHand(this.getCurrentPlayerIndex())
    };
  }
}

export { Phase1State };
