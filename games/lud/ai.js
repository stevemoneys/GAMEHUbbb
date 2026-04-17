export function getAIMove(state, player) {
  // Priority:
  // 1. Capture
  // 2. Bring out token
  // 3. Safe movement

  return {
    tokenIndex: 0,
    steps: state.diceValue
  };
}
