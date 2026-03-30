export const PIECES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

export const PIECE_COLORS = {
  I: '#1de9ff',
  O: '#ffd31a',
  T: '#a855f7',
  S: '#2de06e',
  Z: '#ff4d6d',
  J: '#5b8cff',
  L: '#ff9f40',
  G: '#7d8aa3'
};

export function cloneShape(shape) {
  return shape.map((row) => [...row]);
}

export function rotateShapeClockwise(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

export function rotateShapeCounterClockwise(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[cols - 1 - col][row] = shape[row][col];
    }
  }

  return rotated;
}

const JLSTZ_KICKS = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};

const I_KICKS = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

export function getWallKickOffsets(type, fromState, toState) {
  if (type === 'O') {
    return [[0, 0]];
  }

  const key = `${fromState}>${toState}`;
  if (type === 'I') {
    return I_KICKS[key] || [[0, 0]];
  }

  return JLSTZ_KICKS[key] || [[0, 0]];
}

export function createPiece(type, gridWidth = 10) {
  const shape = cloneShape(PIECES[type]);
  const firstFilledRow = shape.findIndex((row) => row.some(Boolean));
  const spawnY = firstFilledRow > 0 ? -firstFilledRow : 0;
  const spawnX = Math.floor((gridWidth - shape[0].length) / 2);

  return {
    type,
    shape,
    rotation: 0,
    x: spawnX,
    y: spawnY
  };
}

export function randomPiece(gridWidth = 10) {
  const keys = Object.keys(PIECES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return createPiece(type, gridWidth);
}
