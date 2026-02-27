export const state = {
  mode: "quick",
  quickLevel: 1,
  tournamentLevel: 1,
  multiplayerLevel: 1,

  player: [],
  ai: [],
  ais: [],
  market: [],
  discard: [],

  turn: "player",
  currentAIIndex: 0,
  chosenShape: null,
  mustContinue: false,
  gameOver: false,

  settings: {
    sounds: true,
    pick2: true,
    pick3: true,
    music: true,
    generalMarket: true,
    suspension: true,
    holdOn: true
  }
};
