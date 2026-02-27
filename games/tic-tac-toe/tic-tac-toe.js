const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const timerTextEl = document.getElementById("timerText");
const hubBackBtn = document.querySelector(".hub-back-btn");
const RESUME_KEY = "tictactoe_saved_match_v1";

const tapSound = document.getElementById("tapSound");
const winSound = document.getElementById("winSound");
const drawSound = document.getElementById("drawSound");

let gameMode = "";
let selectedLevel = 1;
let unlockedLevel = Number(localStorage.getItem("unlockedLevel")) || 1;
let selectedAvatar = "human";

let playerSymbol = "X";
let aiSymbol = "O";

let scoreX = Number(localStorage.getItem("scoreX")) || 0;
let scoreO = Number(localStorage.getItem("scoreO")) || 0;

let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;

let turnTimer;
const turnTime = 10;
const maxLevel = 20;
let level = 1;

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

document.getElementById("scoreX").textContent = String(scoreX);
document.getElementById("scoreO").textContent = String(scoreO);

function hideAllScreens() {
  ["menu", "levels", "avatars", "symbolSelect", "game"].forEach((id) => {
    document.getElementById(id).classList.remove("active");
  });
}

function showHomeScreen() {
  hideAllScreens();
  document.getElementById("menu").classList.add("active");
  if (hubBackBtn) hubBackBtn.style.display = "inline-flex";
}

function hideHubBackBtn() {
  if (hubBackBtn) hubBackBtn.style.display = "none";
}

function clearSavedMatch() {
  localStorage.removeItem(RESUME_KEY);
}

function saveMatchSnapshot() {
  const payload = {
    gameMode,
    selectedLevel,
    unlockedLevel,
    selectedAvatar,
    playerSymbol,
    aiSymbol,
    board,
    currentPlayer,
    gameActive,
    scoreX,
    scoreO
  };
  localStorage.setItem(RESUME_KEY, JSON.stringify(payload));
}

function getSavedMatch() {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function restoreSavedMatch(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.board) || snapshot.board.length !== 9) return false;
  gameMode = snapshot.gameMode === "two" ? "two" : "ai";
  selectedLevel = Math.max(1, Math.min(maxLevel, Number(snapshot.selectedLevel) || 1));
  level = selectedLevel;
  unlockedLevel = Math.max(1, Math.min(maxLevel, Number(snapshot.unlockedLevel) || unlockedLevel));
  selectedAvatar = typeof snapshot.selectedAvatar === "string" ? snapshot.selectedAvatar : "human";
  playerSymbol = snapshot.playerSymbol === "O" ? "O" : "X";
  aiSymbol = playerSymbol === "X" ? "O" : "X";
  scoreX = Math.max(0, Number(snapshot.scoreX) || 0);
  scoreO = Math.max(0, Number(snapshot.scoreO) || 0);
  board = snapshot.board.map((cell) => (cell === "X" || cell === "O" ? cell : ""));
  currentPlayer = snapshot.currentPlayer === "O" ? "O" : "X";
  gameActive = Boolean(snapshot.gameActive);

  document.getElementById("scoreX").textContent = String(scoreX);
  document.getElementById("scoreO").textContent = String(scoreO);
  localStorage.setItem("scoreX", String(scoreX));
  localStorage.setItem("scoreO", String(scoreO));
  localStorage.setItem("unlockedLevel", String(unlockedLevel));

  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");
  boardEl.innerHTML = "";

  board.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    if (value) {
      cell.textContent = value;
      cell.classList.add(value);
    }
    cell.addEventListener("click", () => makeMove(index));
    boardEl.appendChild(cell);
  });

  setStatus(gameActive ? `Player ${currentPlayer} Turn` : "Saved match loaded");
  if (gameActive) {
    startTurnTimer();
    if (gameMode === "ai" && currentPlayer === aiSymbol) {
      setTimeout(aiMove, 350);
    }
  } else {
    clearInterval(turnTimer);
    timerTextEl.textContent = `${turnTime}s`;
  }

  return true;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function startTwoPlayer() {
  clearSavedMatch();
  gameMode = "two";
  playerSymbol = "X";
  aiSymbol = "O";
  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");
  resetBoard();
  startTurnTimer();
}

function startVsAI() {
  clearSavedMatch();
  gameMode = "ai";
  selectedLevel = unlockedLevel;
  level = unlockedLevel;

  document.getElementById("menu").classList.remove("active");
  hideHubBackBtn();
  showLevels();
}

function showLevels() {
  hideAllScreens();
  hideHubBackBtn();
  const levelBox = document.getElementById("levels");
  const levelButtons = document.getElementById("levelButtons");

  levelButtons.innerHTML = "";

  for (let i = 1; i <= maxLevel; i += 1) {
    const btn = document.createElement("button");
    btn.textContent = `Level ${i}`;

    if (i > unlockedLevel) {
      btn.disabled = true;
      btn.classList.add("locked");
    } else {
      btn.addEventListener("click", () => selectLevel(i));
    }

    levelButtons.appendChild(btn);
  }

  levelBox.classList.add("active");
}

function selectLevel(lvl) {
  clearSavedMatch();
  level = lvl;
  selectedLevel = lvl;

  document.getElementById("levels").classList.remove("active");
  document.getElementById("avatars").classList.add("active");
}

function selectAvatar(avatar) {
  clearSavedMatch();
  selectedAvatar = avatar;
  document.getElementById("avatars").classList.remove("active");
  document.getElementById("symbolSelect").classList.add("active");
}

function chooseSymbol(symbol) {
  clearSavedMatch();
  playerSymbol = symbol;
  aiSymbol = symbol === "X" ? "O" : "X";

  hideAllScreens();
  hideHubBackBtn();
  document.getElementById("game").classList.add("active");

  resetBoard();
  startTurnTimer();

  if (currentPlayer === aiSymbol) {
    setTimeout(aiMove, 350);
  }
}

function backToLevelsFromSymbol() {
  document.getElementById("symbolSelect").classList.remove("active");
  document.getElementById("avatars").classList.add("active");
}

function resetBoard() {
  board = Array(9).fill("");
  gameActive = true;
  currentPlayer = "X";
  boardEl.innerHTML = "";

  setStatus(`Player ${currentPlayer} Turn`);
  timerTextEl.textContent = `${turnTime}s`;

  board.forEach((_, index) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => makeMove(index));
    boardEl.appendChild(cell);
  });
}

function makeMove(index) {
  if (!gameActive) return;
  if (board[index]) return;
  if (gameMode === "ai" && currentPlayer === aiSymbol) return;

  tapSound.currentTime = 0;
  tapSound.play().catch(() => {});

  board[index] = currentPlayer;
  const cell = boardEl.children[index];
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer);

  if (checkWin()) return;

  if (board.every((value) => value !== "")) {
    draw();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setStatus(`Player ${currentPlayer} Turn`);
  startTurnTimer();

  if (gameMode === "ai" && currentPlayer === aiSymbol) {
    setTimeout(aiMove, 350);
  }
}

function startTurnTimer() {
  clearInterval(turnTimer);

  let timeLeft = turnTime;
  timerTextEl.textContent = `${timeLeft}s`;

  turnTimer = setInterval(() => {
    timeLeft -= 1;
    timerTextEl.textContent = `${timeLeft}s`;

    if (timeLeft > 0 || !gameActive) {
      return;
    }

    clearInterval(turnTimer);

    if (gameMode === "ai" && currentPlayer === aiSymbol) {
      aiMove();
      return;
    }

    setStatus(`${currentPlayer} ran out of time`);
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    setStatus(`Player ${currentPlayer} Turn`);
    startTurnTimer();

    if (gameMode === "ai" && currentPlayer === aiSymbol) {
      setTimeout(aiMove, 350);
    }
  }, 1000);
}

function aiMove() {
  if (!gameActive) return;
  if (currentPlayer !== aiSymbol) return;

  const move = getAIMoveByLevel();
  if (move === null || move === undefined) return;

  playMoveFromAI(move);
}

function playMoveFromAI(index) {
  if (board[index]) {
    const fallback = board.findIndex((v) => v === "");
    if (fallback === -1) return;
    makeMoveFromSymbol(fallback, aiSymbol);
    return;
  }

  makeMoveFromSymbol(index, aiSymbol);
}

function makeMoveFromSymbol(index, symbol) {
  if (!gameActive || board[index]) return;

  board[index] = symbol;
  const cell = boardEl.children[index];
  cell.textContent = symbol;
  cell.classList.add(symbol);

  if (checkWin()) return;

  if (board.every((value) => value !== "")) {
    draw();
    return;
  }

  currentPlayer = symbol === "X" ? "O" : "X";
  setStatus(`Player ${currentPlayer} Turn`);
  startTurnTimer();
}

function findWinningMove(symbol) {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    const values = [board[a], board[b], board[c]];

    if (values.filter((v) => v === symbol).length === 2 && values.includes("")) {
      return pattern[values.indexOf("")];
    }
  }

  return null;
}

function getAIMoveByLevel() {
  const emptyCells = board
    .map((value, index) => (value === "" ? index : null))
    .filter((value) => value !== null);

  if (emptyCells.length === 0) return null;

  const winning = findWinningMove(aiSymbol);
  const blocking = findWinningMove(playerSymbol);

  if (level >= 16) {
    const best = bestMove();
    if (best !== undefined) return best;
  }

  if (winning !== null && level >= 10) return winning;
  if (blocking !== null && level >= 4) return blocking;

  if (level >= 8 && board[4] === "") {
    return 4;
  }

  const corners = [0, 2, 6, 8].filter((idx) => board[idx] === "");

  if (selectedAvatar === "aggressive" && winning !== null) {
    return winning;
  }

  if (selectedAvatar === "defensive" && blocking !== null) {
    return blocking;
  }

  if (selectedAvatar === "trickster" && corners.length > 0 && Math.random() < 0.75) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  if (selectedAvatar === "human" && Math.random() < 0.24) {
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  if (corners.length > 0 && Math.random() < 0.55) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function bestMove() {
  let bestScore = -Infinity;
  let move;

  board.forEach((cell, index) => {
    if (cell !== "") return;

    board[index] = aiSymbol;
    const score = minimax(board, 0, false);
    board[index] = "";

    if (score > bestScore) {
      bestScore = score;
      move = index;
    }
  });

  return move;
}

function minimax(newBoard, depth, isMaximizing) {
  const result = evaluateBoard();
  if (result !== null) return result;

  if (isMaximizing) {
    let best = -Infinity;

    newBoard.forEach((cell, index) => {
      if (cell !== "") return;
      newBoard[index] = aiSymbol;
      best = Math.max(best, minimax(newBoard, depth + 1, false));
      newBoard[index] = "";
    });

    return best;
  }

  let best = Infinity;

  newBoard.forEach((cell, index) => {
    if (cell !== "") return;
    newBoard[index] = playerSymbol;
    best = Math.min(best, minimax(newBoard, depth + 1, true));
    newBoard[index] = "";
  });

  return best;
}

function evaluateBoard() {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      if (board[a] === aiSymbol) return 1;
      if (board[a] === playerSymbol) return -1;
    }
  }

  if (board.includes("")) return null;
  return 0;
}

function checkWin() {
  clearInterval(turnTimer);

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      [a, b, c].forEach((idx) => boardEl.children[idx].classList.add("win"));

      winSound.currentTime = 0;
      winSound.play().catch(() => {});

      setStatus(`Player ${currentPlayer} Wins`);
      updateScore();
      gameActive = false;

      setTimeout(() => {
        const playerWon = gameMode !== "ai" ? true : currentPlayer === playerSymbol;
        showResult(playerWon, false);
      }, 600);

      return true;
    }
  }

  return false;
}

function draw() {
  clearInterval(turnTimer);
  gameActive = false;

  drawSound.currentTime = 0;
  drawSound.play().catch(() => {});

  setStatus("Draw");
  setTimeout(() => showResult(false, true), 500);
}

function updateScore() {
  if (currentPlayer === "X") {
    scoreX += 1;
  } else {
    scoreO += 1;
  }

  document.getElementById("scoreX").textContent = String(scoreX);
  document.getElementById("scoreO").textContent = String(scoreO);

  localStorage.setItem("scoreX", String(scoreX));
  localStorage.setItem("scoreO", String(scoreO));

  if (gameMode === "ai" && currentPlayer === playerSymbol) {
    if (level >= unlockedLevel && unlockedLevel < maxLevel) {
      unlockedLevel += 1;
      localStorage.setItem("unlockedLevel", String(unlockedLevel));
    }
  }
}

function resetScores() {
  scoreX = 0;
  scoreO = 0;

  localStorage.setItem("scoreX", "0");
  localStorage.setItem("scoreO", "0");

  document.getElementById("scoreX").textContent = "0";
  document.getElementById("scoreO").textContent = "0";
}

function restartGame() {
  clearSavedMatch();
  document.getElementById("resultModal").classList.remove("active");
  resetBoard();
  startTurnTimer();

  if (gameMode === "ai" && currentPlayer === aiSymbol) {
    setTimeout(aiMove, 350);
  }
}

function backToMenu() {
  clearInterval(turnTimer);
  if (document.getElementById("game").classList.contains("active")) {
    saveMatchSnapshot();
  }
  document.getElementById("resultModal").classList.remove("active");
  showHomeScreen();
}

function showResult(won, isDraw = false) {
  const modal = document.getElementById("resultModal");
  const title = document.getElementById("resultTitle");
  const nextBtn = document.getElementById("nextBtn");

  modal.classList.add("active");

  if (isDraw) {
    title.textContent = "Draw game";
    nextBtn.style.display = "none";
    return;
  }

  if (gameMode === "two") {
    title.textContent = `Player ${currentPlayer} Wins`;
    nextBtn.style.display = "none";
    return;
  }

  if (won) {
    title.textContent = "You Win";
    nextBtn.style.display = level < maxLevel ? "inline-block" : "none";
  } else {
    title.textContent = "You Lost";
    nextBtn.style.display = "none";
  }
}

function nextLevel() {
  document.getElementById("resultModal").classList.remove("active");
  clearSavedMatch();
  if (level < maxLevel) {
    level += 1;
    selectedLevel = level;
  }
  resetBoard();
  startTurnTimer();

  if (currentPlayer === aiSymbol) {
    setTimeout(aiMove, 350);
  }
}

function goHome() {
  document.getElementById("resultModal").classList.remove("active");
  clearSavedMatch();
  backToMenu();
}

function backToHome() {
  showHomeScreen();
}

window.startVsAI = startVsAI;
window.startTwoPlayer = startTwoPlayer;
window.showLevels = showLevels;
window.selectLevel = selectLevel;
window.selectAvatar = selectAvatar;
window.chooseSymbol = chooseSymbol;
window.backToLevelsFromSymbol = backToLevelsFromSymbol;
window.resetScores = resetScores;
window.restartGame = restartGame;
window.backToMenu = backToMenu;
window.nextLevel = nextLevel;
window.goHome = goHome;
window.backToHome = backToHome;

showHomeScreen();
const savedMatch = getSavedMatch();
if (savedMatch) {
  const wantsResume = window.confirm("Continue your saved Tic Tac Toe game?");
  if (wantsResume && !restoreSavedMatch(savedMatch)) {
    clearSavedMatch();
  }
  if (!wantsResume) {
    clearSavedMatch();
  }
}
