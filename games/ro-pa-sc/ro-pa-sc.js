const TOTAL_LEVELS = 50;
const WIN_SCORE = 5;
const RESUME_KEY = "rps_saved_match_v1";

const screens = {
    home: document.getElementById("home-screen"),
    levels: document.getElementById("level-screen"),
    game: document.getElementById("game-screen")
};

const levelGrid = document.getElementById("level-grid");
const currentLevelText = document.getElementById("current-level");
const playerScoreEl = document.getElementById("player-score");
const computerScoreEl = document.getElementById("computer-score");
const messageEl = document.getElementById("message");
const playerHand = document.getElementById("player-hand");
const computerHand = document.getElementById("computer-hand");
const choiceButtons = Array.from(document.querySelectorAll(".buttons button"));

const levelModal = document.getElementById("level-modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalStars = document.getElementById("modal-stars");
const nextLevelBtn = document.getElementById("next-level");
const hubBackBtn = document.querySelector(".hub-back-btn");

const sounds = {
    win: new Audio("sounds/win.wav"),
    lose: new Audio("sounds/lose.wav"),
    draw: new Audio("sounds/draw.wav")
};

const choices = ["rock", "paper", "scissors"];
const images = {
    player: {
        rock: "images/player-rock_result.webp",
        paper: "images/player-paper_result.webp",
        scissors: "images/player-scissors_result.webp"
    },
    computer: {
        rock: "images/computer-rock_result.webp",
        paper: "images/computer-paper_result.webp",
        scissors: "images/computer-scissors_result.webp"
    }
};

let unlockedLevel = Number(localStorage.getItem("rps_unlocked_level")) || 1;
let currentLevel = 1;
let playerScore = 0;
let computerScore = 0;
let playerHistory = [];
let roundBusy = false;

unlockedLevel = Math.max(1, Math.min(TOTAL_LEVELS, unlockedLevel));

function setScreen(name) {
    Object.values(screens).forEach((screen) => screen.classList.remove("active"));
    screens[name].classList.add("active");
    if (hubBackBtn) {
        hubBackBtn.classList.toggle("hidden", name !== "home");
    }
}

function saveProgress() {
    localStorage.setItem("rps_unlocked_level", String(unlockedLevel));
}

function clearSavedMatch() {
    localStorage.removeItem(RESUME_KEY);
}

function saveMatchSnapshot() {
    const payload = {
        currentLevel,
        playerScore,
        computerScore,
        playerHistory,
        message: messageEl.textContent,
        playerHandSrc: playerHand.querySelector("img")?.getAttribute("src") || images.player.rock,
        computerHandSrc: computerHand.querySelector("img")?.getAttribute("src") || images.computer.rock
    };
    localStorage.setItem(RESUME_KEY, JSON.stringify(payload));
}

function getSavedMatchSnapshot() {
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

function resumeSavedMatch(snapshot) {
    const level = Number(snapshot.currentLevel);
    if (!Number.isFinite(level) || level < 1 || level > unlockedLevel) return false;

    startLevel(level);
    playerScore = Math.max(0, Number(snapshot.playerScore) || 0);
    computerScore = Math.max(0, Number(snapshot.computerScore) || 0);
    playerHistory = Array.isArray(snapshot.playerHistory) ? snapshot.playerHistory.slice(0, 100) : [];

    playerScoreEl.textContent = String(playerScore);
    computerScoreEl.textContent = String(computerScore);

    const message = typeof snapshot.message === "string" ? snapshot.message : "Continue your game";
    setMessage(message);

    const playerHandSrc = typeof snapshot.playerHandSrc === "string" ? snapshot.playerHandSrc : images.player.rock;
    const computerHandSrc = typeof snapshot.computerHandSrc === "string" ? snapshot.computerHandSrc : images.computer.rock;

    playerHand.innerHTML = `<img src="${playerHandSrc}" alt="Player hand">`;
    computerHand.innerHTML = `<img src="${computerHandSrc}" alt="Computer hand">`;
    return true;
}

function renderLevels() {
    levelGrid.innerHTML = "";

    for (let level = 1; level <= TOTAL_LEVELS; level += 1) {
        const button = document.createElement("button");
        button.className = "level-btn";
        button.textContent = String(level);

        if (level <= unlockedLevel) {
            button.classList.add("unlocked");
            button.disabled = false;
            button.addEventListener("click", () => startLevel(level));
        } else {
            button.classList.add("locked");
            button.disabled = true;
        }

        if (level === currentLevel) {
            button.classList.add("current");
        }

        levelGrid.appendChild(button);
    }
}

function setMessage(text, tone = "") {
    messageEl.textContent = text;
    messageEl.className = "message";
    if (tone) {
        messageEl.classList.add(tone);
    }
}

function setRoundBusy(isBusy) {
    roundBusy = isBusy;
    choiceButtons.forEach((button) => {
        button.disabled = isBusy;
    });
}

function resetRound() {
    playerScore = 0;
    computerScore = 0;
    playerHistory = [];

    playerScoreEl.textContent = "0";
    computerScoreEl.textContent = "0";
    playerHand.innerHTML = `<img src="${images.player.rock}" alt="Player hand">`;
    computerHand.innerHTML = `<img src="${images.computer.rock}" alt="Computer hand">`;
    setMessage("Choose your move");
    setRoundBusy(false);
}

function startLevel(level) {
    if (level > unlockedLevel) {
        return;
    }

    currentLevel = level;
    currentLevelText.textContent = String(currentLevel);
    resetRound();
    renderLevels();
    setScreen("game");
}

function randomChoice() {
    return choices[Math.floor(Math.random() * choices.length)];
}

function counterChoice(choice) {
    if (choice === "rock") {
        return "paper";
    }
    if (choice === "paper") {
        return "scissors";
    }
    return "rock";
}

function predictPlayerMove(history) {
    const count = { rock: 0, paper: 0, scissors: 0 };
    history.forEach((move) => {
        count[move] += 1;
    });

    return Object.keys(count).reduce((best, candidate) => {
        return count[candidate] > count[best] ? candidate : best;
    }, "rock");
}

function getComputerChoice(playerChoice) {
    playerHistory.push(playerChoice);

    const memorySize = Math.min(20, currentLevel);
    const recent = playerHistory.slice(-memorySize);
    const intelligence = currentLevel / TOTAL_LEVELS;

    if (recent.length > 0 && Math.random() < intelligence) {
        return counterChoice(predictPlayerMove(recent));
    }

    return randomChoice();
}

function winnerText(playerWon) {
    if (playerWon) {
        return "You win this round";
    }
    return "Computer wins this round";
}

function isPlayerWin(player, computer) {
    return (
        (player === "rock" && computer === "scissors") ||
        (player === "paper" && computer === "rock") ||
        (player === "scissors" && computer === "paper")
    );
}

function calculateStars() {
    if (computerScore === 0) {
        return 3;
    }
    if (computerScore <= 2) {
        return 2;
    }
    return 1;
}

function showLevelResult(playerWon) {
    clearSavedMatch();
    if (playerWon) {
        if (currentLevel === unlockedLevel && unlockedLevel < TOTAL_LEVELS) {
            unlockedLevel += 1;
            saveProgress();
        }

        const stars = calculateStars();
        modalTitle.textContent = "Level Complete";
        modalText.textContent = `You cleared level ${currentLevel}.`;
        modalStars.textContent = "?".repeat(stars);
    } else {
        modalTitle.textContent = "Level Failed";
        modalText.textContent = "Try the level again to unlock the next one.";
        modalStars.textContent = "";
    }

    const hasNextUnlocked = currentLevel < unlockedLevel;
    nextLevelBtn.disabled = !hasNextUnlocked;
    nextLevelBtn.style.opacity = hasNextUnlocked ? "1" : "0.45";

    levelModal.classList.remove("hidden");
}

function evaluateGameState() {
    if (playerScore >= WIN_SCORE) {
        showLevelResult(true);
    }

    if (computerScore >= WIN_SCORE) {
        showLevelResult(false);
    }
}

function playRound(playerChoice) {
    if (roundBusy) {
        return;
    }

    setRoundBusy(true);
    const computerChoice = getComputerChoice(playerChoice);

    playerHand.classList.add("shake");
    computerHand.classList.add("shake");
    setMessage("Rock... Paper... Scissors...");

    window.setTimeout(() => {
        playerHand.classList.remove("shake");
        computerHand.classList.remove("shake");

        playerHand.innerHTML = `<img src="${images.player[playerChoice]}" alt="Player hand">`;
        computerHand.innerHTML = `<img src="${images.computer[computerChoice]}" alt="Computer hand">`;

        if (playerChoice === computerChoice) {
            setMessage("Draw round", "draw");
            sounds.draw.currentTime = 0;
            sounds.draw.play().catch(() => {});
            setRoundBusy(false);
            return;
        }

        const playerWon = isPlayerWin(playerChoice, computerChoice);

        if (playerWon) {
            playerScore += 1;
            playerScoreEl.textContent = String(playerScore);
            setMessage(winnerText(true), "win");
            sounds.win.currentTime = 0;
            sounds.win.play().catch(() => {});
        } else {
            computerScore += 1;
            computerScoreEl.textContent = String(computerScore);
            setMessage(winnerText(false), "lose");
            sounds.lose.currentTime = 0;
            sounds.lose.play().catch(() => {});
        }

        evaluateGameState();
        setRoundBusy(false);
    }, 420);
}

function closeModal() {
    levelModal.classList.add("hidden");
}

function bindEvents() {
    document.getElementById("play-button").addEventListener("click", () => {
        const saved = getSavedMatchSnapshot();
        if (saved) {
            const wantsResume = window.confirm("Continue your saved Rock Paper Scissors game?");
            if (wantsResume && resumeSavedMatch(saved)) {
                return;
            }
            clearSavedMatch();
        }
        renderLevels();
        setScreen("levels");
    });

    document.getElementById("back-home").addEventListener("click", () => {
        setScreen("home");
    });

    document.getElementById("back-levels").addEventListener("click", () => {
        saveMatchSnapshot();
        renderLevels();
        setScreen("levels");
    });

    document.getElementById("restart-round").addEventListener("click", () => {
        clearSavedMatch();
        resetRound();
    });

    choiceButtons.forEach((button) => {
        button.addEventListener("click", () => {
            playRound(button.dataset.choice);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (!screens.game.classList.contains("active") || roundBusy) {
            return;
        }

        const keyMap = {
            r: "rock",
            p: "paper",
            s: "scissors"
        };

        const choice = keyMap[event.key.toLowerCase()];
        if (choice) {
            playRound(choice);
        }
    });

    document.getElementById("play-again").addEventListener("click", () => {
        closeModal();
        clearSavedMatch();
        startLevel(currentLevel);
    });

    nextLevelBtn.addEventListener("click", () => {
        closeModal();
        if (currentLevel < unlockedLevel) {
            clearSavedMatch();
            startLevel(currentLevel + 1);
        }
    });

    document.getElementById("levels-menu").addEventListener("click", () => {
        closeModal();
        renderLevels();
        setScreen("levels");
    });

    levelModal.addEventListener("click", (event) => {
        if (event.target === levelModal) {
            closeModal();
        }
    });
}

function init() {
    bindEvents();
    renderLevels();
    setScreen("home");
}

init();
