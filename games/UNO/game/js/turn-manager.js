/**
 * UNO Turn Manager - Phase 3
 * Direction state, current player, game phase.
 */

const GAME_PHASE = Object.freeze({
  IDLE: 'idle',
  PLAYING: 'playing',
  FINISHED: 'finished'
});

const TURN_DIRECTION = Object.freeze({
  CLOCKWISE: 1,
  COUNTER_CLOCKWISE: -1
});

/**
 * Turn manager – encapsulates direction and current player
 */
class TurnManager {
  constructor(playerCount) {
    this.playerCount = playerCount;
    this.currentPlayerIndex = 0;
    this.direction = TURN_DIRECTION.CLOCKWISE;
    this.phase = GAME_PHASE.IDLE;
    this.winnerIndex = null;
  }

  reset() {
    this.currentPlayerIndex = 0;
    this.direction = TURN_DIRECTION.CLOCKWISE;
    this.phase = GAME_PHASE.PLAYING;
    this.winnerIndex = null;
  }

  getCurrentPlayerIndex() {
    return this.currentPlayerIndex;
  }

  getDirection() {
    return this.direction;
  }

  isClockwise() {
    return this.direction === TURN_DIRECTION.CLOCKWISE;
  }

  reverse() {
    this.direction = -this.direction;
  }

  advance(skipCount = 0) {
    const step = this.direction * (1 + skipCount);
    this.currentPlayerIndex =
      (this.currentPlayerIndex + step + this.playerCount * 10) % this.playerCount;
  }

  setFinished(winnerIndex) {
    this.phase = GAME_PHASE.FINISHED;
    this.winnerIndex = winnerIndex;
  }

  getPhase() {
    return this.phase;
  }

  getWinnerIndex() {
    return this.winnerIndex;
  }

  isFinished() {
    return this.phase === GAME_PHASE.FINISHED;
  }

  toJSON() {
    return {
      currentPlayerIndex: this.currentPlayerIndex,
      direction: this.direction,
      phase: this.phase,
      winnerIndex: this.winnerIndex
    };
  }

  restore(snapshot = {}) {
    this.currentPlayerIndex = Number.isInteger(snapshot.currentPlayerIndex)
      ? snapshot.currentPlayerIndex
      : 0;
    this.direction = snapshot.direction === TURN_DIRECTION.COUNTER_CLOCKWISE
      ? TURN_DIRECTION.COUNTER_CLOCKWISE
      : TURN_DIRECTION.CLOCKWISE;
    this.phase = Object.values(GAME_PHASE).includes(snapshot.phase)
      ? snapshot.phase
      : GAME_PHASE.PLAYING;
    this.winnerIndex = Number.isInteger(snapshot.winnerIndex) ? snapshot.winnerIndex : null;
  }
}

export { TurnManager, GAME_PHASE, TURN_DIRECTION };
