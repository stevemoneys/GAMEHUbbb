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

function getZoneAnchor(level, drift = 0) {
  const zone = getPuzzleZone(level);
  const zoneOffset = Math.max(0, level - zone.range[0] + drift);
  const step = Math.min(2, Math.floor(zoneOffset / 6));
  const base =
    zone.id === "foundation" ? 8 :
    zone.id === "strategy" ? 16 :
    zone.id === "advanced" ? 32 :
    zone.id === "expert" ? 64 :
    128;

  return base * 2 ** step;
}

function getZoneMoveLimit(zoneId, type, zoneOffset) {
  const base =
    zoneId === "foundation" ? 6 :
    zoneId === "strategy" ? 5 :
    zoneId === "advanced" ? 4 :
    zoneId === "expert" ? 4 :
    3;

  const typeAdjust =
    type === "escape" ? 1 :
    type === "limited" || type === "trick" ? -1 :
    0;

  const tighten = Math.floor(Math.max(0, zoneOffset) / 6);
  return Math.max(3, base + typeAdjust - tighten);
}

const EXAMPLE_LEVELS = Object.freeze([
  {
    level: 1,
    name: "Warm Welcome",
    type: "merge",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 0, 4, 0, 0],
      [8, 0, 0, 8, 0],
      [0, 0, 16, 0, 0]
    ]),
    ammoQueue: [4, 8, 4, 8, 16, 8, 4],
    goal: { kind: "tile", target: 32, text: "Reach tile 32" },
    aiDifficulty: "forgiving",
    feedbackBias: "positive",
    hintThreshold: 3
  },
  {
    level: 2,
    name: "Soft Pair",
    type: "merge",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [0, 4, 0, 4, 0],
      [0, 8, 0, 8, 0],
      [0, 0, 16, 0, 0]
    ]),
    ammoQueue: [4, 8, 8, 4, 16, 8, 4],
    goal: { kind: "tile", target: 32, text: "Create a 32 with clean merges" },
    aiDifficulty: "forgiving",
    feedbackBias: "positive",
    hintThreshold: 3
  },
  {
    level: 3,
    name: "Center Lane",
    type: "positioning",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 0, 8, 0, 4],
      [4, 0, 8, 0, 4],
      [0, 0, 16, 0, 0],
      [0, 8, 0, 8, 0]
    ]),
    ammoQueue: [8, 8, 4, 16, 8, 4, 16],
    goal: { kind: "tile", target: 64, text: "Open the middle and reach 64" },
    aiDifficulty: "forgiving",
    feedbackBias: "coach",
    hintThreshold: 3
  },
  {
    level: 4,
    name: "Careful Steps",
    type: "limited",
    moveLimit: 4,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 8, 0, 8, 4],
      [0, 0, 16, 0, 0],
      [0, 8, 0, 8, 0]
    ]),
    ammoQueue: [8, 16, 8, 16, 4, 8],
    goal: { kind: "tile", target: 64, text: "Solve it in only 4 moves" },
    aiDifficulty: "forgiving",
    feedbackBias: "coach",
    hintThreshold: 2
  },
  {
    level: 5,
    name: "Little Cascade",
    type: "chain",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 4, 8, 0, 0],
      [8, 8, 16, 0, 0],
      [0, 0, 16, 0, 0],
      [0, 8, 0, 8, 0]
    ]),
    ammoQueue: [4, 8, 16, 8, 16, 4, 32],
    goal: { kind: "score", target: 192, text: "Trigger a deeper chain and score 192" },
    aiDifficulty: "forgiving",
    feedbackBias: "celebrate",
    hintThreshold: 3
  },
  {
    level: 6,
    name: "Clean Stack",
    type: "merge",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [0, 4, 0, 4, 0],
      [0, 8, 0, 8, 0],
      [0, 16, 0, 16, 0],
      [0, 0, 32, 0, 0]
    ]),
    ammoQueue: [4, 8, 16, 16, 8, 4, 32],
    goal: { kind: "tile", target: 64, text: "Stack neatly and reach 64" },
    aiDifficulty: "forgiving",
    feedbackBias: "positive",
    hintThreshold: 3
  },
  {
    level: 7,
    name: "Combo Door",
    type: "combo",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 4, 8, 8, 0],
      [16, 0, 16, 0, 0],
      [0, 0, 32, 0, 0]
    ]),
    ammoQueue: [8, 16, 8, 16, 32, 8, 16],
    goal: { kind: "score", target: 256, text: "Chain your moves into a premium combo finish" },
    aiDifficulty: "forgiving",
    feedbackBias: "celebrate",
    hintThreshold: 3
  },
  {
    level: 8,
    name: "Quiet Crossroads",
    type: "positioning",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 0, 4, 0, 4],
      [8, 0, 8, 0, 8],
      [16, 0, 0, 0, 16],
      [0, 16, 0, 16, 0]
    ]),
    ammoQueue: [8, 16, 16, 8, 32, 16, 8],
    goal: { kind: "tile", target: 128, text: "Choose the right lane and build 128" },
    aiDifficulty: "forgiving",
    feedbackBias: "coach",
    hintThreshold: 3
  },
  {
    level: 9,
    name: "Short Fuse",
    type: "limited",
    moveLimit: 4,
    optimalMoves: 4,
    board: boardFromRows([
      [8, 4, 8, 4, 8],
      [0, 16, 0, 16, 0],
      [0, 0, 32, 0, 0],
      [0, 8, 0, 8, 0]
    ]),
    ammoQueue: [8, 16, 32, 8, 16, 4],
    goal: { kind: "tile", target: 128, text: "Perfect lines only. You have 4 moves." },
    aiDifficulty: "balanced",
    feedbackBias: "coach",
    hintThreshold: 2
  },
  {
    level: 10,
    name: "Combo Showcase",
    type: "combo",
    moveLimit: 5,
    optimalMoves: 4,
    board: boardFromRows([
      [4, 4, 8, 8, 16],
      [8, 8, 16, 16, 0],
      [0, 0, 32, 0, 0],
      [0, 16, 0, 16, 0]
    ]),
    ammoQueue: [8, 16, 32, 16, 8, 32, 16],
    goal: { kind: "score", target: 384, text: "Special Level: unleash a big combo" },
    aiDifficulty: "balanced",
    feedbackBias: "celebrate",
    hintThreshold: 3,
    specialTag: "Special Level"
  }
]);

function createBaseConfig(level) {
  const zone = getPuzzleZone(level);
  const type = getPuzzleTypeForLevel(level);
  const typeMeta = getPuzzleTypeMeta(type);
  const zoneOffset = level - zone.range[0];
  const anchor = getZoneAnchor(level);
  const moveLimit = getZoneMoveLimit(zone.id, type, zoneOffset);
  const optimalMoves = Math.max(2, moveLimit - 1);
  const tileTarget = Math.min(8192, anchor * 8);
  const scoreTarget = Math.max(160, tileTarget * 2 + level * 16);
  const side = Math.max(2, anchor / 2);

  return {
    level,
    zoneId: zone.id,
    zoneName: zone.name,
    zoneMood: zone.mood,
    type,
    typeLabel: typeMeta.label,
    name: `${zone.name} ${typeMeta.label} ${zoneOffset + 1}`,
    board: boardFromRows([]),
    ammoQueue: [side, anchor, side, anchor, anchor * 2, side],
    fallbackAmmo: side,
    moveLimit,
    optimalMoves,
    aiDifficulty: level <= 20 ? "forgiving" : level <= 60 ? "balanced" : "sharp",
    feedbackBias: type === "combo" || type === "chain" ? "celebrate" : "coach",
    hintThreshold: level <= 20 ? 3 : level <= 60 ? 4 : 5,
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
  const base = getZoneAnchor(level);
  const side = Math.max(2, base / 2);
  return {
    board: boardFromRows([
      [side, 0, side, 0, 0],
      [base, 0, base, 0, 0],
      [0, 0, base * 2, 0, 0]
    ]),
    ammoQueue: [side, base, side, base, base * 2, side, base * 2]
  };
}

function createChainBoard(level, intensity) {
  const base = getZoneAnchor(level);
  return {
    board: boardFromRows([
      [base, base, base * 2, 0, 0],
      [base * 2, base * 2, base * 4, 0, 0],
      [0, 0, base * 4, 0, 0],
      intensity >= 1 ? [0, base, 0, base, 0] : []
    ]),
    ammoQueue: [base, base * 2, base * 4, base, base * 2, base * 4, base * 8]
  };
}

function createPositioningBoard(level, intensity) {
  const base = getZoneAnchor(level, 1);
  const side = Math.max(2, base / 2);
  return {
    board: boardFromRows([
      [side, 0, base, 0, side],
      [side, 0, base, 0, side],
      [base, 0, base * 2, 0, base],
      intensity >= 2 ? [0, base, 0, base, 0] : []
    ]),
    ammoQueue: [base, side, base, base * 2, side, base, base * 2],
    restrictedColumns: intensity >= 2 ? [level % COLS] : []
  };
}

function createEscapeBoard(level, intensity) {
  const base = getZoneAnchor(level, 1);
  const side = Math.max(2, base / 2);
  return {
    board: boardFromRows([
      [side, base, side, base, side],
      [base, side, base * 2, side, base],
      [side, base * 2, 0, base, side],
      [base, side, base, base * 2, side],
      [side, base, intensity >= 2 ? BLOCKER : 0, side, base]
    ]),
    ammoQueue: [side, base, side, base * 2, base, side, base * 2],
    goal: { kind: "survive", target: 1, text: "Stay alive and open the board" }
  };
}

function createTrickBoard(level, intensity) {
  const base = getZoneAnchor(level, 1);
  const side = Math.max(2, base / 2);
  return {
    board: boardFromRows([
      [base, side, base, side, base],
      [side, side * 2, base * 2, side * 2, side],
      [0, 0, base * 2, 0, 0],
      intensity >= 2 ? [0, BLOCKER, 0, BLOCKER, 0] : []
    ]),
    ammoQueue: [side * 2, base, side, base * 2, side * 2, base, side],
    restrictedColumns: intensity >= 1 ? [0, 4] : []
  };
}

function createLimitedBoard(level, intensity) {
  const base = getZoneAnchor(level, 1);
  const side = Math.max(2, base / 2);
  return {
    board: boardFromRows([
      [side * 2, side, side * 2, side, side * 2],
      [0, base, 0, base, 0],
      [0, 0, base * 2, 0, 0],
      intensity >= 2 ? [0, side, 0, side, 0] : []
    ]),
    ammoQueue: [side * 2, base, base * 2, side * 2, base, side]
  };
}

function createComboBoard(level, intensity) {
  const base = getZoneAnchor(level, 1);
  const side = Math.max(2, base / 2);
  return {
    board: boardFromRows([
      [side, side, base, base, base],
      [base, base, base * 2, base * 2, 0],
      [0, 0, base * 4, 0, 0],
      intensity >= 1 ? [0, side, 0, side, 0] : []
    ]),
    ammoQueue: [side, base, base * 2, base, side, base * 4, base * 2, side]
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

  if (config.level >= 18 && config.type !== "escape") {
    const lane = (config.level + 1) % COLS;
    if (config.board[3][lane] === 0) {
      config.board[3][lane] = Math.max(2, getZoneAnchor(level) / 2);
    }
  }

  if (config.level >= 12 && config.type !== "escape" && config.board[4][2] === 0) {
    config.board[4][2] = Math.max(2, getZoneAnchor(level) / 2);
  }

  if (config.level >= 16 && config.type !== "escape" && config.board[2][1] === 0) {
    config.board[2][1] = BLOCKER;
  }

  if (config.level >= 28 && (config.type === "limited" || config.type === "trick")) {
    config.moveLimit = Math.max(3, config.moveLimit - 1);
    config.optimalMoves = Math.max(2, config.moveLimit - 1);
  }

  if (config.level >= 36 && config.type !== "escape") {
    config.lockedTiles = config.lockedTiles.concat([lockedTile(1, (config.level + 3) % COLS, 4)]);
  }

  if (config.level >= 44) {
    const anchorColumn = config.level % COLS;
    config.lockedTiles = config.lockedTiles.concat([lockedTile(0, anchorColumn)]);
  }

  if (config.level >= 52 && (config.type === "positioning" || config.type === "escape")) {
    config.restrictedColumns = Array.from(new Set(config.restrictedColumns.concat([(config.level + 2) % COLS])));
  }

  if (config.level >= 64 && config.type !== "escape" && config.board[4][2] === 0) {
    config.board[4][2] = BLOCKER;
  }

  if (config.level >= 72 && config.type !== "escape" && config.board[5][1] === 0) {
    config.board[5][1] = BLOCKER;
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
