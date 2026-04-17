export const PATHS = {
  common: [],
  redHome: [],
  greenHome: [],
  yellowHome: [],
  blueHome: []
};

export const ENTRY_CELLS = {};

export const HOME_SLOTS = {
  red: [],
  blue: [],
  yellow: [],
  green: []
};

const CELL_MAP = new Map();

function resetBoardState(boardEl) {
  PATHS.common.length = 0;
  PATHS.redHome.length = 0;
  PATHS.greenHome.length = 0;
  PATHS.yellowHome.length = 0;
  PATHS.blueHome.length = 0;

  Object.keys(ENTRY_CELLS).forEach(k => delete ENTRY_CELLS[k]);

  Object.keys(HOME_SLOTS).forEach(color => {
    HOME_SLOTS[color].length = 0;
  });

  CELL_MAP.clear();
  boardEl.querySelectorAll(".generated").forEach(el => el.remove());
}

export function generatePaths(boardEl) {
  resetBoardState(boardEl);

  function createCell(r, c, ...cls) {
    const d = document.createElement("div");
    d.className = `cell generated ${cls.join(" ")}`.trim();
    d.style.gridRow = r;
    d.style.gridColumn = c;
    boardEl.appendChild(d);
    return d;
  }

  function getCell(r, c, ...cls) {
    const key = `${r},${c}`;
    let el = CELL_MAP.get(key);

    if (!el) {
      el = createCell(r, c, ...cls);
      CELL_MAP.set(key, el);
    } else {
      cls.forEach(cn => el.classList.add(cn));
    }

    return el;
  }

  function homeSlot(color, r, c) {
    const el = document.createElement("div");
    el.className = "token-slot generated";
    el.dataset.color = color;
    el.style.gridRow = r;
    el.style.gridColumn = c;
    boardEl.appendChild(el);

    HOME_SLOTS[color].push({ el, x: 0, y: 0 });
  }

  homeSlot("red", 3, 3);
  homeSlot("red", 3, 5);
  homeSlot("red", 5, 3);
  homeSlot("red", 5, 5);

  homeSlot("green", 3, 11);
  homeSlot("green", 3, 13);
  homeSlot("green", 5, 11);
  homeSlot("green", 5, 13);

  homeSlot("yellow", 11, 11);
  homeSlot("yellow", 11, 13);
  homeSlot("yellow", 13, 11);
  homeSlot("yellow", 13, 13);

  homeSlot("blue", 11, 3);
  homeSlot("blue", 11, 5);
  homeSlot("blue", 13, 3);
  homeSlot("blue", 13, 5);

  const loop = [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6],
    [6, 7], [5, 7], [4, 7], [3, 7], [2, 7], [1, 7],
    [1, 8], [1, 9], [2, 9], [3, 9], [4, 9], [5, 9],
    [6, 9], [7, 10], [7, 11], [7, 12], [7, 13], [7, 14], [7, 15],
    [8, 15], [9, 15], [9, 14], [9, 13], [9, 12], [9, 11], [9, 10],
    [10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], [15, 8],
    [15, 7], [14, 7], [13, 7], [12, 7], [11, 7], [10, 7], [9, 6],
    [9, 5], [9, 4], [9, 3], [9, 2], [9, 1], [8, 1]
  ];

  const commonByCoord = new Map();

  loop.forEach((p, i) => {
    const el = getCell(p[0], p[1], "path");
    const node = { index: i, el, row: p[0], col: p[1] };
    PATHS.common.push(node);
    commonByCoord.set(`${p[0]},${p[1]}`, node);
  });

  [
    [2, 8], [3, 8], [4, 8], [5, 8], [6, 8],
    [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [8, 2], [8, 3], [8, 4], [8, 5], [8, 6],
    [8, 10], [8, 11], [8, 12], [8, 13], [8, 14]
  ].forEach(([r, c]) => getCell(r, c, "path"));

  // final colored squares before center (each connects to its own lane/triangle)
  getCell(8, 2, "red");
  getCell(2, 8, "green");
  getCell(8, 14, "yellow");
  getCell(14, 8, "blue");

  function registerEntry(color, r, c) {
    const pathObj = commonByCoord.get(`${r},${c}`);
    if (!pathObj) {
      throw new Error(`Entry cell (${color}) not found in PATHS.common`);
    }

    pathObj.el.classList.add(color);
    ENTRY_CELLS[color] = pathObj.el;
  }

  // entry squares attached to each big home side
  registerEntry("red", 7, 2);      // down side of red home
  registerEntry("green", 2, 9);    // left side of green home
  registerEntry("yellow", 9, 14);  // top side of yellow home
  registerEntry("blue", 14, 7);    // right side of blue home

  // each color turns into its home lane from these white arrow squares
  getCell(8, 1).classList.add("red-home-turn");
  getCell(1, 8).classList.add("green-home-turn");
  getCell(8, 15).classList.add("yellow-home-turn");
  getCell(15, 8).classList.add("blue-home-turn");

  // classic safe-star squares aligned to the straight mid-lines
  getCell(9, 3).classList.add("safe-star");
  getCell(3, 7).classList.add("safe-star");
  getCell(7, 13).classList.add("safe-star");
  getCell(13, 9).classList.add("safe-star");

  [
    [8, 2], [8, 3], [8, 4], [8, 5], [8, 6]
  ].forEach(([r, c]) => {
    PATHS.redHome.push({ el: getCell(r, c, "path", "red") });
  });

  [
    [2, 8], [3, 8], [4, 8], [5, 8], [6, 8]
  ].forEach(([r, c]) => {
    PATHS.greenHome.push({ el: getCell(r, c, "path", "green") });
  });

  [
    [8, 14], [8, 13], [8, 12], [8, 11], [8, 10]
  ].forEach(([r, c]) => {
    PATHS.yellowHome.push({ el: getCell(r, c, "path", "yellow") });
  });

  [
    [14, 8], [13, 8], [12, 8], [11, 8], [10, 8]
  ].forEach(([r, c]) => {
    PATHS.blueHome.push({ el: getCell(r, c, "path", "blue") });
  });

  requestAnimationFrame(() => {
    const boardRect = boardEl.getBoundingClientRect();

    Object.values(HOME_SLOTS).flat().forEach(slot => {
      const rect = slot.el.getBoundingClientRect();
      slot.x = rect.left - boardRect.left + rect.width / 2;
      slot.y = rect.top - boardRect.top + rect.height / 2;
    });

    PATHS.common.forEach(p => {
      const rect = p.el.getBoundingClientRect();
      p.x = rect.left - boardRect.left + rect.width / 2;
      p.y = rect.top - boardRect.top + rect.height / 2;
    });
  });
}
