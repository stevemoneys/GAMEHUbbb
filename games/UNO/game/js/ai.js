/**
 * UNO AI - Multi-level behavior
 * Always plays legal moves from getValidMoves.
 */

import { CARD_COLORS } from './card-engine.js';
import { getValidMoves } from './rules.js';

const PERSONA_PROFILES = {
  1: { name: 'Balanced beginner', base: 1, action: 0.8, defense: 0.6, color: 0.6, future: 0.2, avoidance: 0.2, wild: 0.3, randomness: 0.35 },
  2: { name: 'Slightly aggressive', base: 1, action: 1.4, defense: 0.5, color: 0.4, future: 0.2, avoidance: 0.1, wild: 0.6, randomness: 0.2 },
  3: { name: 'Risky but lucky', base: 1, action: 1.2, defense: 0.4, color: 0.3, future: 0.2, avoidance: 0.1, wild: 1.4, randomness: 0.4, drawBonus: 0.8, wildBonus: 0.8 },
  4: { name: 'Loves trick cards', base: 1, action: 1.6, defense: 0.5, color: 0.4, future: 0.2, avoidance: 0.2, wild: 0.5, randomness: 0.2, skipBonus: 0.8, reverseBonus: 0.8, drawBonus: 0.6 },
  5: { name: 'Logical and strategic', base: 1.1, action: 0.9, defense: 1, color: 1.2, future: 1, avoidance: 0.8, wild: 0.2, randomness: 0.1 },
  6: { name: 'Completely random', base: 0.4, action: 0.4, defense: 0.2, color: 0.2, future: 0, avoidance: 0, wild: 0.4, randomness: 1, randomWild: 1 },
  7: { name: 'Calm and defensive', base: 1, action: 0.6, defense: 1.4, color: 0.8, future: 0.4, avoidance: 0.6, wild: 0.1, randomness: 0.15 },
  8: { name: 'Aggressive player', base: 1, action: 1.8, defense: 0.4, color: 0.4, future: 0.2, avoidance: 0.2, wild: 0.7, randomness: 0.2, drawBonus: 1 },
  9: { name: 'Unpredictable', base: 1, action: 1, defense: 0.4, color: 0.4, future: 0.3, avoidance: 0.2, wild: 0.8, randomness: 0.6, randomWild: 0.5 },
  10: { name: 'Uses skips and reverses', base: 1, action: 1.2, defense: 0.6, color: 0.5, future: 0.3, avoidance: 0.3, wild: 0.3, randomness: 0.2, skipBonus: 1.4, reverseBonus: 1.4 },
  11: { name: 'Strategic color control', base: 1, action: 0.8, defense: 0.8, color: 1.6, future: 0.6, avoidance: 1, wild: 0.2, randomness: 0.1 },
  12: { name: 'Takes risky plays', base: 1, action: 1.3, defense: 0.4, color: 0.4, future: 0.3, avoidance: 0.2, wild: 1.2, randomness: 0.3, drawBonus: 0.8 },
  13: { name: 'Plays smart combos', base: 1.1, action: 0.9, defense: 0.8, color: 1, future: 1.4, avoidance: 0.8, wild: 0.3, randomness: 0.1 },
  14: { name: 'Loves wild cards', base: 1, action: 1.1, defense: 0.4, color: 0.3, future: 0.2, avoidance: 0.1, wild: 1.8, randomness: 0.2, wildBonus: 1.4 },
  15: { name: 'Defensive play', base: 1, action: 0.6, defense: 1.5, color: 0.8, future: 0.5, avoidance: 0.7, wild: 0.1, randomness: 0.1 },
  16: { name: 'Smart long-game', base: 1.1, action: 0.7, defense: 1, color: 1.1, future: 1.5, avoidance: 1.2, wild: -0.1, randomness: 0.05 },
  17: { name: 'Aggressive draw card', base: 1, action: 1.6, defense: 0.5, color: 0.3, future: 0.2, avoidance: 0.2, wild: 0.8, randomness: 0.2, drawBonus: 1.8 },
  18: { name: 'Strategic and patient', base: 1.1, action: 0.8, defense: 1, color: 1.2, future: 1.3, avoidance: 0.9, wild: 0.2, randomness: 0.05 },
  19: { name: 'Color master', base: 1, action: 0.8, defense: 0.9, color: 2, future: 0.9, avoidance: 1.2, wild: 0.4, randomness: 0.05 },
  20: { name: 'Master-level AI', base: 1.2, action: 1.2, defense: 1.4, color: 1.2, future: 1.5, avoidance: 1.3, wild: 0.6, randomness: 0.05, reverseBonus: 0.6 }
};

function clampLevel(level) {
  const safe = parseInt(level || '1', 10);
  if (Number.isNaN(safe)) return 1;
  return Math.min(Math.max(safe, 1), 10);
}

function getHandInfo(hand) {
  const colorCounts = CARD_COLORS.reduce((acc, color) => {
    acc[color] = 0;
    return acc;
  }, {});
  const valueCounts = {};

  hand.forEach((card) => {
    if (card.color) colorCounts[card.color] += 1;
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  const dominantColor = CARD_COLORS.reduce((best, color) => {
    if (colorCounts[color] > colorCounts[best]) return color;
    return best;
  }, CARD_COLORS[0]);

  return { colorCounts, valueCounts, dominantColor };
}

function getOpponentCounts(gameState, playerIndex) {
  const counts = [];
  for (let i = 0; i < gameState.playerCount; i += 1) {
    if (i !== playerIndex) counts.push({ index: i, count: gameState.getHand(i).length });
  }
  return counts;
}

function getAvoidance(memory, playerIndex) {
  const empty = CARD_COLORS.reduce((acc, color) => {
    acc[color] = 0;
    return acc;
  }, {});
  if (!memory || !memory.colorAvoidance) return empty;
  return memory.colorAvoidance[playerIndex] || empty;
}

function chooseWildColorByHand(handInfo, memory, targetIndex) {
  const avoidance = getAvoidance(memory, targetIndex);
  let bestColor = handInfo.dominantColor;
  let bestScore = -1;
  CARD_COLORS.forEach((color) => {
    const score = (handInfo.colorCounts[color] || 0) + (avoidance[color] || 0) * 0.4;
    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  });
  return bestColor;
}

function pickFirstByType(valid, typeOrder) {
  for (const type of typeOrder) {
    const found = valid.find((card) => card.type === type);
    if (found) return found;
  }
  return valid[0];
}

function scoreBase(card, handInfo) {
  let score = 0;
  if (card.color === handInfo.dominantColor) score += 1.5;
  if (card.type === 'number') {
    const value = parseInt(card.value, 10);
    if (!Number.isNaN(value)) score += value / 10;
  }
  if ((handInfo.valueCounts[card.value] || 0) > 1) score += 2.5;
  return score;
}

function scoreDefensive(card, opponentThreat) {
  if (!opponentThreat) return 0;
  if (card.value === 'draw2') return 4;
  if (card.value === 'wild4') return 5;
  if (card.value === 'skip') return 3;
  if (card.value === 'reverse') return 2;
  return 0;
}

function scoreEndgame(card, handSize) {
  if (handSize > 3) {
    if (card.type === 'action' || card.value === 'wild4') return -1.5;
    return 0;
  }
  if (card.value === 'draw2' || card.value === 'wild4' || card.value === 'skip') return 3;
  if (card.value === 'reverse') return 2;
  return 0;
}

function scoreAvoidance(card, avoidance) {
  if (!card.color || !avoidance) return 0;
  return (avoidance[card.color] || 0) * 0.5;
}

function scoreReverseStrategy(card, gameState, playerIndex) {
  if (card.value !== 'reverse' || gameState.playerCount < 3) return 0;
  const forward = gameState.getNextPlayerIndex(0);
  const reverseDir = gameState.turnDirection * -1;
  const nextReverse =
    (playerIndex + reverseDir + gameState.playerCount * 10) % gameState.playerCount;
  const forwardCount = gameState.getHand(forward).length;
  const reverseCount = gameState.getHand(nextReverse).length;
  if (reverseCount < forwardCount) return 2;
  if (reverseCount > forwardCount) return 0.5;
  return 0;
}

function futureOptionsScore(card, gameState, playerIndex, chosenWildColor) {
  const hand = gameState.getHand(playerIndex);
  const nextHand = hand.filter((c) => c.id !== card.id);
  const context = {
    currentWildColor: card.type === 'wild' ? chosenWildColor : null,
    pendingDraw: 0,
    allowDrawStacking: gameState.allowDrawStacking,
    enforceWild4: gameState.enforceWild4,
    hand: nextHand
  };
  const topCard = card;
  return getValidMoves(nextHand, topCard, context).length;
}

function pickBest(valid, scorer) {
  let best = valid[0];
  let bestScore = -Infinity;
  valid.forEach((card) => {
    const score = scorer(card);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  });
  return best;
}

function getPersonaProfile(personaId) {
  return PERSONA_PROFILES[personaId] || PERSONA_PROFILES[1];
}

function scoreActionCard(card, persona) {
  let score = 0;
  if (card.value === 'draw2') score += 2.6 + (persona.drawBonus || 0);
  if (card.value === 'wild4') score += 3.4 + (persona.drawBonus || 0) + (persona.wildBonus || 0);
  if (card.value === 'skip') score += 2.2 + (persona.skipBonus || 0);
  if (card.value === 'reverse') score += 1.8 + (persona.reverseBonus || 0);
  return score;
}

function scoreColorControl(card, handInfo) {
  if (!card.color) return 0;
  if (card.color === handInfo.dominantColor) return 2;
  return -0.8;
}

function scoreWildBias(card, hasNonWild, opponentThreat, persona) {
  if (card.type !== 'wild') return 0;
  let score = 1.4 + (persona.wildBonus || 0);
  if (card.value === 'wild4') score += 1;
  if (hasNonWild && !opponentThreat) score -= 2.2;
  return score;
}

function chooseWildColorForPersona(handInfo, memory, targetIndex, persona, levelFactor) {
  if (persona.randomWild && Math.random() < persona.randomWild * (1.1 - levelFactor)) {
    return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
  }
  return chooseWildColorByHand(handInfo, memory, targetIndex);
}

function getPersonaMove(gameState, playerIndex, aiConfig) {
  const level = clampLevel(aiConfig.level);
  const levelFactor = level / 10;
  const persona = getPersonaProfile(aiConfig.personaId);
  const memory = aiConfig.memory;
  const valid = gameState.getValidMoves(playerIndex);
  if (valid.length === 0) return { action: 'draw' };

  const hand = gameState.getHand(playerIndex);
  const handInfo = getHandInfo(hand);
  const opponentCounts = getOpponentCounts(gameState, playerIndex);
  const opponentThreat = opponentCounts.some((o) => o.count <= 2);
  const nextIndex = gameState.getNextPlayerIndex(0);
  const avoidance = getAvoidance(memory, nextIndex);
  const hasNonWild = valid.some((card) => card.type !== 'wild');

  if (persona.randomness >= 0.85 && Math.random() < persona.randomness) {
    const card = valid[Math.floor(Math.random() * valid.length)];
    const wildColor = card.type === 'wild'
      ? CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
      : undefined;
    return { action: 'play', card, wildColor };
  }

  if (persona.randomness > 0 && Math.random() < persona.randomness * (1.1 - levelFactor)) {
    const card = valid[Math.floor(Math.random() * valid.length)];
    const wildColor = card.type === 'wild'
      ? chooseWildColorForPersona(handInfo, memory, nextIndex, persona, levelFactor)
      : undefined;
    return { action: 'play', card, wildColor };
  }

  const card = pickBest(valid, (c) => {
    let score = scoreBase(c, handInfo) * (persona.base ?? 1);
    score += scoreActionCard(c, persona) * (persona.action ?? 0);
    score += scoreDefensive(c, opponentThreat) * (persona.defense ?? 0) * levelFactor;
    score += scoreEndgame(c, hand.length) * (persona.endgame ?? 0.6) * levelFactor;
    score += scoreAvoidance(c, avoidance) * (persona.avoidance ?? 0) * levelFactor;
    score += scoreReverseStrategy(c, gameState, playerIndex) * (persona.reverse ?? 0.6) * levelFactor;
    score += scoreColorControl(c, handInfo) * (persona.color ?? 0.4);
    score += scoreWildBias(c, hasNonWild, opponentThreat, persona) * (persona.wild ?? 0);

    const wildColor = c.type === 'wild'
      ? chooseWildColorForPersona(handInfo, memory, nextIndex, persona, levelFactor)
      : null;
    score += futureOptionsScore(c, gameState, playerIndex, wildColor) * (persona.future ?? 0) * levelFactor;
    return score;
  });

  const wildColor = card.type === 'wild'
    ? chooseWildColorForPersona(handInfo, memory, nextIndex, persona, levelFactor)
    : undefined;
  return { action: 'play', card, wildColor };
}

function getAIMove(gameState, playerIndex, aiConfig = {}) {
  const level = clampLevel(aiConfig.level);
  if (aiConfig.personaId) {
    return getPersonaMove(gameState, playerIndex, aiConfig);
  }
  const memory = aiConfig.memory;
  const valid = gameState.getValidMoves(playerIndex);
  if (valid.length === 0) return { action: 'draw' };

  const hand = gameState.getHand(playerIndex);
  const handInfo = getHandInfo(hand);
  const opponentCounts = getOpponentCounts(gameState, playerIndex);
  const opponentThreat = opponentCounts.some((o) => o.count <= 2);
  const nextIndex = gameState.getNextPlayerIndex(0);
  const avoidance = getAvoidance(memory, nextIndex);
  const hasNonWild = valid.some((card) => card.type !== 'wild');

  if (level === 1) {
    const card = valid[0];
    const wildColor = card.type === 'wild'
      ? CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
      : undefined;
    return { action: 'play', card, wildColor };
  }

  if (level === 2) {
    const card = pickFirstByType(valid, ['number', 'action', 'wild']);
    return {
      action: 'play',
      card,
      wildColor: card.type === 'wild' ? handInfo.dominantColor : undefined
    };
  }

  if (level === 3) {
    const card = pickFirstByType(valid, ['action', 'number', 'wild']);
    return {
      action: 'play',
      card,
      wildColor: card.type === 'wild' ? handInfo.dominantColor : undefined
    };
  }

  if (level === 4) {
    const sameColor = valid.filter((card) => card.color === handInfo.dominantColor);
    const card = sameColor.length > 0 ? sameColor[0] : pickFirstByType(valid, ['number', 'action', 'wild']);
    return {
      action: 'play',
      card,
      wildColor: card.type === 'wild' ? handInfo.dominantColor : undefined
    };
  }

  if (level === 5) {
    const card = pickBest(valid, (c) => {
      let score = scoreBase(c, handInfo);
      if (c.color && c.color !== handInfo.dominantColor && handInfo.colorCounts[handInfo.dominantColor] >= 3) {
        score -= 1.5;
      }
      return score;
    });
    return {
      action: 'play',
      card,
      wildColor: card.type === 'wild' ? handInfo.dominantColor : undefined
    };
  }

  if (level === 6) {
    const card = pickBest(valid, (c) => scoreBase(c, handInfo) + scoreDefensive(c, opponentThreat));
    return {
      action: 'play',
      card,
      wildColor: card.type === 'wild' ? handInfo.dominantColor : undefined
    };
  }

  if (level === 7) {
    const playable = hasNonWild ? valid.filter((c) => c.type !== 'wild') : valid;
    const card = pickBest(playable, (c) => scoreBase(c, handInfo) + scoreDefensive(c, opponentThreat));
    const wildColor = card.type === 'wild'
      ? handInfo.dominantColor
      : undefined;
    return { action: 'play', card, wildColor };
  }

  if (level === 8) {
    const card = pickBest(valid, (c) => {
      let score = scoreBase(c, handInfo);
      score += scoreDefensive(c, opponentThreat);
      score += scoreAvoidance(c, avoidance);
      return score;
    });
    const wildColor = card.type === 'wild'
      ? chooseWildColorByHand(handInfo, memory, nextIndex)
      : undefined;
    return { action: 'play', card, wildColor };
  }

  if (level === 9) {
    const card = pickBest(valid, (c) => {
      let score = scoreBase(c, handInfo);
      score += scoreDefensive(c, opponentThreat);
      score += scoreEndgame(c, hand.length);
      return score;
    });
    const wildColor = card.type === 'wild'
      ? chooseWildColorByHand(handInfo, memory, nextIndex)
      : undefined;
    return { action: 'play', card, wildColor };
  }

  const card = pickBest(valid, (c) => {
    let score = scoreBase(c, handInfo);
    score += scoreDefensive(c, opponentThreat);
    score += scoreEndgame(c, hand.length);
    score += scoreAvoidance(c, avoidance);
    score += scoreReverseStrategy(c, gameState, playerIndex);

    if (c.type === 'wild' && hasNonWild) score -= 3;
    if (c.value === 'wild4' && hasNonWild && !opponentThreat) score -= 2;

    const wildColor = c.type === 'wild'
      ? chooseWildColorByHand(handInfo, memory, nextIndex)
      : null;
    score += futureOptionsScore(c, gameState, playerIndex, wildColor) * 0.3;
    return score;
  });

  const wildColor = card.type === 'wild'
    ? chooseWildColorByHand(handInfo, memory, nextIndex)
    : undefined;
  return { action: 'play', card, wildColor };
}

export { getAIMove };
