import { getPuzzleTypeForLevel, getPuzzleTypeMeta, getPuzzleZone } from "./puzzleTypes.js";

const ROWS = 8;
const COLS = 5;
const BLOCKER = -1;

function row(values = []) {
  const next = values.slice(0, COLS);
  while (next.length < COLS) {
    next.push(0);
  }
  return next;
}

function boardFromRows(rows) {
  const output = rows.slice(0, ROWS).map((entry) => row(entry));
  while (output.length < ROWS) {
    output.push(row());
  }
  return output;
}

function lockedTile(rowIndex, colIndex, turns = 3) {
  return { row: rowIndex, col: colIndex, turns };
}

const EXAMPLE_LEVELS = Object.freeze([
  {
    level: 1,
    name: "Warm Welcome",
    type: "merge",
    moveLimit: 6,
    optimalMoves: 3,
    board: boardFromRows([
      [2, 0, 2, 0, 0],
      [4, 0, 0, 4, 0]
    ]),
    ammoQueue: [2, 2, 4, 2, 4, 8, 2, 4],
    goal: { kind: "tile", target: 16, text: "Reach tile 16" },
    aiDifficulty: "forgiving",
    feedbackBias: "positive",
    hintThreshold: 2
  },
  {
    level: 2,
    name: "Soft Pair",
    type: "merge",
    moveLimit: 6,
    optimalMoves: 3,
    board: boardFromRows([
      [0, 2, 0, 2, 0],
      [0, 4, 0, 4, 0]
    ]),
    ammoQueue: [2, 4, 2, 4, 8, 2, 4],
    goal: { kind: "tile", target: 16, text: "Create a 16 with easy merges" },
    aiDifficulty: "forgiving",
    feedbackBias: "positive",
    hintThreshold: 2
  },
  {
    level: 3,
    name: "Center Lane",
    type: "positioning",
    moveLimit: 7,
    optimalMoves: 4,
    board: boardFromRows([
      [2, 0, 4, 0, 2],
      [2, 0, 4, 0, 2],
      [0, 0, 8, 0, 0]
    ]),
    ammoQueue: [4, 4, 2, 8, 2, 4, 8, 16],
    goal: { kind: "tile", target: 32, text: "Open the middle and reach 32" },
    aiDifficulty: "forgiving",
    feedbackBias: "coach",
    hintThreshold: 2
  },
  {
    level: 4,
    name: "Careful Steps",
    type: "limited",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [2, 4, 0, 4, 2],
      [0, 0, 8, 0, 0]
    ]),
    ammoQueue: [4, 8, 2, 8, 4, 16, 2],
    goal: { kind: "tile", target: 32, text: "Solve it in only 5 moves" },
    aiDifficulty: "forgiving",
    feedbackBias: "coach",
    hintThreshold: 1
  },
  {
    level: 5,
    name: "Little Cascade",
    type: "chain",
    moveLimit: 6,
    optimalMoves: 4,
    board: boardFromRows([
      [2, 2, 4, 0, 0],
      [4, 4, 8, 0, 0],
      [0, 0, 8, 0, 0]
    ]),
    ammoQueue: [2, 4, 8, 2, 4, 8, 16],
    goal: { kind: "score", target: 64, text: "Trigger a chain and score 64" },
    aiDifficulty: "forgiving",
    feedbackBias: "celebrate",
    hintThreshold: 2
  },
  {
    level: 6,
    name: "Clean Stack",
    type: "merge",
    moveLimit: 6,
    optimalMoves: 4,
    board: boardFromRows([
      [0, 2, 0, 2, 0],
      [0, 4, 0, 4, 0],
      [0, 8, 0, 8, 0]
    ]),
    ammoQueue: [2, 4, 8, 8, 4, 2, 16],
    goal: { kind: "tile", target: 32, text: "Stack neatly and reach 32" },
    aiDifficulty: "forgiving",
    feedbackBias: "positive",
    hintThreshold: 2
  },
  {
    level: 7,
    name: "Combo Door",
    type: "combo",
    moveLimit: 6,
    optimalMoves: 4,
    board: boardFromRows([
      [2, 2, 4, 4, 0],
      [8, 0, 8, 0, 0]
    ]),
    ammoQueue: [4, 8, 2, 8, 4, 16, 2],
    goal: { kind: "score", target: 96, text: "Chain your moves into a combo finish" },
    aiDifficulty: "forgiving",
    feedbackBias: "celebrate",
    hintThreshold: 2
  },
  {
    level: 8,
    name: "Quiet Crossroads",
    type: "positioning",
    moveLimit: 7,
    optimalMoves: 5,
    board: boardFromRows([
      [2, 0, 2, 0, 2],
      [4, 0, 4, 0, 4],
      [8, 0, 0, 0, 8]
    ]),
    ammoQueue: [2, 4, 8, 4, 2, 8, 16],
    goal: { kind: "tile", target: 64, text: "Choose the right lane and build 64" },
    aiDifficulty: "forgiving",
    feedbackBias: "coach",
    hintThreshold: 2
  },
  {
    level: 9,
    name: "Short Fuse",
    type: "limited",
    moveLimit: 4,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 2, 4, 2, 4],
      [0, 8, 0, 8, 0],
      [0, 0, 16, 0, 0]
    ]),
    ammoQueue: [4, 8, 16, 4, 8, 2],
    goal: { kind: "tile", target: 32, text: "Perfect lines only. You have 4 moves." },
    aiDifficulty: "balanced",
    feedbackBias: "coach",
    hintThreshold: 1
  },
  {
    level: 10,
    name: "Combo Showcase",
    type: "combo",
    moveLimit: 7,
    optimalMoves: 5,
    board: boardFromRows([
      [2, 2, 4, 4, 8],
      [4, 4, 8, 8, 0],
      [0, 0, 16, 0, 0]
    ]),
    ammoQueue: [2, 4, 8, 16, 8, 4, 2, 16],
    goal: { kind: "score", target: 160, text: "Special Level: unleash a big combo" },
    aiDifficulty: "balanced",
    feedbackBias: "celebrate",
    hintThreshold: 2,
    specialTag: "Special Level"
  }
]);

function createBaseConfig(level) {
  const zone = getPuzzleZone(level);
  const type = getPuzzleTypeForLevel(level);
  const typeMeta = getPuzzleTypeMeta(type);
  const zoneOffset = level - zone.range[0];
  const intensity = Math.floor(zoneOffset / 4);
  const moveLimit = Math.max(4, 7 - Math.min(3, Math.floor(zoneOffset / 6)) + (type === "escape" ? 1 : 0));
  const optimalMoves = Math.max(3, moveLimit - (type === "combo" ? 1 : 0));
  const tileTarget = Math.min(2048, 16 * 2 ** Math.min(7, Math.floor((level + 3) / 8)));
  const scoreTarget = Math.max(64, 48 + level * 8);

  return {
    level,
    zoneId: zone.id,
    zoneName: zone.name,
    zoneMood: zone.mood,
    type,
    typeLabel: typeMeta.label,
    name: `${zone.name} ${typeMeta.label} ${zoneOffset + 1}`,
    board: boardFromRows([]),
    ammoQueue: [2, 2, 4, 4, 8, 8],
    moveLimit,
    optimalMoves,
    aiDifficulty: level <= 20 ? "forgiving" : level <= 60 ? "balanced" : "sharp",
    feedbackBias: type === "combo" || type === "chain" ? "celebrate" : "coach",
    hintThreshold: level <= 20 ? 2 : level <= 60 ? 3 : 4,
    goal: {
      kind: type === "combo" ? "score" : "tile",
      target: type === "combo" ? scoreTarget : tileTarget,
      text: type === "combo" ? `Score ${scoreTarget}` : `Reach tile ${tileTarget}`
    },
    specialRule: null,
    restrictedColumns: [],
    lockedTiles: [],
    specialTag: ""
  };
}

function createMergeBoard(level, intensity) {
  const lift = Math.min(16, 2 ** (1 + Math.min(3, intensity)));
  return {
    board: boardFromRows([
      [2, 0, 2, 0, 0],
      [4, 0, 4, 0, 0],
      [0, 0, lift, 0, 0]
    ]),
    ammoQueue: [2, 4, lift, 2, 4, lift, lift * 2]
  };
}

function createChainBoard(level, intensity) {
  const base = Math.min(16, 2 ** (1 + Math.min(3, intensity)));
  return {
    board: boardFromRows([
      [base, base, base * 2, 0, 0],
      [base * 2, base * 2, base * 4, 0, 0],
      [0, 0, base * 4, 0, 0]
    ]),
    ammoQueue: [base, base * 2, base * 4, base, base * 2, base * 4, base * 8]
  };
}

function createPositioningBoard(level, intensity) {
  const base = Math.min(32, 2 ** (1 + Math.min(4, intensity + 1)));
  return {
    board: boardFromRows([
      [2, 0, base, 0, 2],
      [2, 0, base, 0, 2],
      [4, 0, base * 2, 0, 4]
    ]),
    ammoQueue: [base, 2, 4, base, base * 2, 4, 8],
    restrictedColumns: intensity >= 3 ? [1] : []
  };
}

function createEscapeBoard(level, intensity) {
  const base = Math.min(32, 2 ** (2 + Math.min(3, intensity)));
  return {
    board: boardFromRows([
      [2, 4, 8, 16, 2],
      [4, 8, 16, 2, 4],
      [8, 16, 0, 4, 8],
      [16, base, 8, 16, 2],
      [2, 4, 16, 8, 4]
    ]),
    ammoQueue: [2, 4, 8, base, 4, 2, 8],
    goal: { kind: "survive", target: 1, text: "Stay alive and open the board" }
  };
}

function createTrickBoard(level, intensity) {
  const base = Math.min(32, 2 ** (2 + Math.min(3, intensity)));
  return {
    board: boardFromRows([
      [base, 2, base, 2, base],
      [2, 4, 8, 4, 2],
      [0, 0, 16, 0, 0]
    ]),
    ammoQueue: [4, 8, 2, 16, 4, 8, 2],
    restrictedColumns: intensity >= 2 ? [0, 4] : []
  };
}

function createLimitedBoard(level, intensity) {
  const base = Math.min(32, 2 ** (2 + Math.min(3, intensity)));
  return {
    board: boardFromRows([
      [4, 2, 4, 2, 4],
      [0, base, 0, base, 0],
      [0, 0, base * 2, 0, 0]
    ]),
    ammoQueue: [4, base, base * 2, 4, base, 2]
  };
}

function createComboBoard(level, intensity) {
  const base = Math.min(32, 2 ** (2 + Math.min(3, intensity)));
  return {
    board: boardFromRows([
      [2, 2, 4, 4, base],
      [4, 4, 8, 8, 0],
      [0, 0, base * 2, 0, 0]
    ]),
    ammoQueue: [2, 4, 8, base, base * 2, 8, 4, 2]
  };
}

function applySpecialLevelAdjustments(config) {
  const specialIndex = config.level / 10;
  if (!Number.isInteger(specialIndex)) {
    return config;
  }

  const labels = {
    1: "Special Level: Combo Trial",
    2: "Special Level: Survival Room",
    3: "Special Level: Perfect Move",
    4: "Special Level: Chain Lab",
    5: "Special Level: Locked Vault",
    6: "Special Level: Escape Pulse",
    7: "Special Level: Lane Logic",
    8: "Special Level: Expert Cascade",
    9: "Special Level: Gravity Shift",
    10: "Special Level: Elite Finale"
  };

  config.specialTag = "Special Level";
  config.name = labels[specialIndex] || config.name;

  if (specialIndex === 2 || specialIndex === 6) {
    config.type = "escape";
    config.typeLabel = "Escape Puzzle";
    config.goal = { kind: "survive", target: 1, text: "Open space before the board locks" };
  }

  if (specialIndex === 3 || specialIndex === 7) {
    config.moveLimit = Math.max(3, config.moveLimit - 1);
    config.optimalMoves = config.moveLimit;
    config.goal.text = `Perfect room: solve in ${config.moveLimit} moves`;
  }

  if (specialIndex === 5) {
    config.lockedTiles = [lockedTile(0, 2), lockedTile(1, 2), lockedTile(2, 2)];
    config.goal.text = "Unlock the center flow and finish the board";
  }

  if (specialIndex === 9 || specialIndex === 10) {
    config.specialRule = "gravity-shift";
    config.type = "gravity";
    config.typeLabel = "Gravity Shift";
    config.goal.text = "Solve it while gravity keeps shifting";
  }

  return config;
}

function buildGeneratedLevel(level) {
  const config = createBaseConfig(level);
  const intensity = Math.max(0, Math.floor((level - 1) / 8));
  let template;

  switch (config.type) {
    case "chain":
      template = createChainBoard(level, intensity);
      break;
    case "positioning":
      template = createPositioningBoard(level, intensity);
      break;
    case "escape":
      template = createEscapeBoard(level, intensity);
      break;
    case "trick":
      template = createTrickBoard(level, intensity);
      break;
    case "limited":
      template = createLimitedBoard(level, intensity);
      break;
    case "combo":
      template = createComboBoard(level, intensity);
      break;
    default:
      template = createMergeBoard(level, intensity);
      break;
  }

  config.board = template.board;
  config.ammoQueue = template.ammoQueue;
  config.restrictedColumns = template.restrictedColumns || [];
  if (template.goal) {
    config.goal = template.goal;
  }

  if (config.level >= 44) {
    const anchorColumn = config.level % COLS;
    config.lockedTiles = config.lockedTiles.concat([lockedTile(0, anchorColumn)]);
  }

  if (config.level >= 81 && config.type !== "escape") {
    config.board[1][0] = BLOCKER;
    config.board[2][4] = BLOCKER;
  }

  return applySpecialLevelAdjustments(config);
}

function enrichConfig(config) {
  const zone = getPuzzleZone(config.level);
  const typeMeta = getPuzzleTypeMeta(config.type);
  return {
    zoneId: zone.id,
    zoneName: zone.name,
    zoneMood: zone.mood,
    typeLabel: typeMeta.label,
    ...config
  };
}

const generatedLevels = [];
for (let level = 1; level <= 100; level += 1) {
  const example = EXAMPLE_LEVELS.find((entry) => entry.level === level);
  generatedLevels.push(enrichConfig(example ? example : buildGeneratedLevel(level)));
}

export const PUZZLE_LEVELS = Object.freeze(generatedLevels);

export function getPuzzleLevel(level) {
  const safeLevel = Math.max(1, Math.min(100, Number(level) || 1));
  return PUZZLE_LEVELS[safeLevel - 1];
}

export function getPuzzleExamples() {
  return PUZZLE_LEVELS.slice(0, 10);
}
