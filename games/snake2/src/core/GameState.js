export const GAME_STATES = {
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER"
};

export class GameState {
  constructor() {
    // Game starts in active play and can later switch to GAME_OVER.
    this.current = GAME_STATES.PLAYING;
    this.time = 0;
  }

  setPlaying() {
    this.current = GAME_STATES.PLAYING;
  }

  setGameOver() {
    this.current = GAME_STATES.GAME_OVER;
  }

  isPlaying() {
    return this.current === GAME_STATES.PLAYING;
  }

  isGameOver() {
    return this.current === GAME_STATES.GAME_OVER;
  }

  resetTime() {
    this.time = 0;
  }
}
