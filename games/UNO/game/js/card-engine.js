/**
 * UNO Card Engine - Phase 1
 * Pure logic only. No DOM, no UI.
 * Card structure: { color, value, type }
 * type: 'number' | 'action' | 'wild'
 */

const CARD_COLORS = Object.freeze(['red', 'blue', 'green', 'yellow']);

/** @type {Readonly<Record<string, string>>} */
const CARD_TYPES = Object.freeze({
  NUMBER: 'number',
  ACTION: 'action',
  WILD: 'wild'
});

/**
 * @typedef {Object} Card
 * @property {string} id - Unique identifier (for arrays, future DOM keys)
 * @property {string} color - 'red'|'blue'|'green'|'yellow'|null (null for wilds)
 * @property {string} value - "0"-"9" | "skip" | "reverse" | "draw2" | "wild" | "wild4"
 * @property {string} type - "number" | "action" | "wild"
 */

let cardIdCounter = 0;

/**
 * Create a single card
 * @param {string} type - 'number' | 'action' | 'wild'
 * @param {string|null} color - Card color (null for wild)
 * @param {string} value - Internal value
 * @returns {Card}
 */
function createCard(type, color, value) {
  return {
    id: `card_${++cardIdCounter}`,
    color,
    value,
    type
  };
}

/**
 * Generate full standard UNO deck (108 cards)
 * - 76 number (0×1 + 1-9×2 per color × 4)
 * - 24 action (Skip, Reverse, Draw Two × 2 each per color)
 * - 8 wild (4 Wild, 4 Wild Draw Four)
 * @returns {Card[]}
 */
function createDeck() {
  const deck = [];

  CARD_COLORS.forEach((color) => {
    deck.push(createCard(CARD_TYPES.NUMBER, color, '0'));
    for (let n = 1; n <= 9; n++) {
      deck.push(createCard(CARD_TYPES.NUMBER, color, String(n)));
      deck.push(createCard(CARD_TYPES.NUMBER, color, String(n)));
    }
    [
      ['skip', 'Skip'],
      ['reverse', 'Reverse'],
      ['draw2', '+2']
    ].forEach(([val]) => {
      deck.push(createCard(CARD_TYPES.ACTION, color, val));
      deck.push(createCard(CARD_TYPES.ACTION, color, val));
    });
  });

  for (let i = 0; i < 4; i++) {
    deck.push(createCard(CARD_TYPES.WILD, null, 'wild'));
    deck.push(createCard(CARD_TYPES.WILD, null, 'wild4'));
  }

  return deck;
}

/**
 * Fisher-Yates shuffle - in-place
 * @param {Card[]} deck
 * @returns {Card[]}
 */
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Draw n cards from top of deck
 * @param {Card[]} deck - Mutated
 * @param {number} n
 * @returns {Card[]}
 */
function drawCards(deck, n = 1) {
  return deck.splice(0, n);
}

function resetCardIds() {
  cardIdCounter = 0;
}

function syncCardIds(cards = []) {
  let maxId = 0;
  cards.forEach((card) => {
    const match = String(card?.id || '').match(/card_(\d+)/);
    if (!match) return;
    const numericId = parseInt(match[1], 10);
    if (!Number.isNaN(numericId)) {
      maxId = Math.max(maxId, numericId);
    }
  });
  cardIdCounter = maxId;
}

export {
  CARD_COLORS,
  CARD_TYPES,
  createDeck,
  shuffleDeck,
  drawCards,
  resetCardIds,
  syncCardIds,
  createCard
};
