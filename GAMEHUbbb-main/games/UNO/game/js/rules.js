/**
 * UNO Rules - Phase 2
 * Pure logic. Rule gatekeeper: isValidMove(card, topCard, context)
 */

/**
 * Check if a card can legally be played on top of the current discard
 * @param {Object} card - Card to play
 * @param {Object|null} topCard - Current top of discard pile
 * @param {Object} context - Optional: { currentWildColor, pendingDraw, allowDrawStacking, enforceWild4, hand }
 * @returns {boolean}
 */
function isValidMove(card, topCard, context = {}) {
  if (!topCard) return true;

  const {
    currentWildColor = null,
    pendingDraw = 0,
    allowDrawStacking = false,
    enforceWild4 = false,
    hand = null
  } = context;

  // Draw penalty active: only allow stacking if enabled, otherwise must draw
  if (pendingDraw > 0) {
    if (!allowDrawStacking) return false;
    const canStackDraw2 = card.value === 'draw2' && topCard.value === 'draw2';
    const canStackDraw4 = card.value === 'wild4' && topCard.value === 'wild4';
    return canStackDraw2 || canStackDraw4;
  }

  // Effective color for matching (wilds set color when played)
  const effectiveColor =
    topCard.type === 'wild' ? currentWildColor : topCard.color;

  // Wild and Wild+4: legal unless optional wild4 restriction blocks it
  if (card.type === 'wild') {
    if (card.value === 'wild4' && enforceWild4 && Array.isArray(hand)) {
      const hasColorMatch = effectiveColor
        ? hand.some((c) => c.color === effectiveColor)
        : false;
      if (hasColorMatch) return false;
    }
    return true;
  }

  // Top is wild but no color declared: only wild can follow
  if (topCard.type === 'wild' && !effectiveColor) return false;

  // Match by color
  if (card.color === effectiveColor) return true;

  // Match by number (both number cards, same value)
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) {
    return true;
  }

  // Match by action (same action type)
  if (card.type === 'action' && topCard.type === 'action' && card.value === topCard.value) {
    return true;
  }

  return false;
}

/**
 * Get all legal moves from a hand
 * @param {Object[]} hand
 * @param {Object|null} topCard
 * @param {Object} context
 * @returns {Object[]}
 */
function getValidMoves(hand, topCard, context = {}) {
  const mergedContext = { ...context, hand };
  return hand.filter((card) => isValidMove(card, topCard, mergedContext));
}

export { isValidMove, getValidMoves };
