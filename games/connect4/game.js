const Connect4Model = (() => {
    const ROWS = 6;
    const COLS = 7;
    const CONNECT = 4;

    function createEmptyBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function createGameState() {
        return {
            rows: ROWS,
            cols: COLS,
            board: createEmptyBoard(),
            currentPlayer: 1,
            gameOver: false,
            mode: "two",
            level: 1,
            stage: 1,
            humanPlayer: 1,
            aiPlayer: 2,
            aiDelayMs: 260,
        };
    }

    function getLowestOpenRow(board, column) {
        for (let row = ROWS - 1; row >= 0; row -= 1) {
            if (board[row][column] === 0) {
                return row;
            }
        }
        return -1;
    }

    function dropDisc(state, row, col, player) {
        state.board[row][col] = player;
    }

    function clearDisc(state, row, col) {
        state.board[row][col] = 0;
    }

    function togglePlayer(state) {
        state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    }

    function isBoardFull(board) {
        return board[0].every((cell) => cell !== 0);
    }

    function inside(row, col) {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS;
    }

    function collect(board, row, col, rowStep, colStep, player) {
        const line = [];
        let r = row + rowStep;
        let c = col + colStep;

        while (inside(r, c) && board[r][c] === player) {
            line.push([r, c]);
            r += rowStep;
            c += colStep;
        }

        return line;
    }

    function getWinningLine(board, row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [rowStep, colStep] of directions) {
            const backward = collect(board, row, col, -rowStep, -colStep, player).reverse();
            const forward = collect(board, row, col, rowStep, colStep, player);
            const complete = [...backward, [row, col], ...forward];
            if (complete.length >= CONNECT) {
                return complete;
            }
        }

        return null;
    }

    return {
        createGameState,
        getLowestOpenRow,
        dropDisc,
        clearDisc,
        togglePlayer,
        isBoardFull,
        getWinningLine,
    };
})();

const Connect4Music = (() => {
    let audio = null;
    let initialized = false;

    function ensureAudio() {
        if (!audio) {
            audio = new Audio("./assets/audio/bgm.mp3");
            audio.loop = true;
            audio.preload = "auto";
            audio.volume = typeof Connect4Settings === "undefined" ? 0.42 : Connect4Settings.load().musicVolume;
        }
        return audio;
    }

    function refresh() {
        const player = ensureAudio();
        if (typeof Connect4Settings === "undefined") {
            return;
        }
        const settings = Connect4Settings.load();
        player.volume = settings.musicVolume;
        if (!settings.musicEnabled) {
            player.pause();
        } else {
            player.play().catch(() => {});
        }
    }

    function init() {
        if (initialized) {
            refresh();
            return;
        }
        initialized = true;
        ensureAudio();
        refresh();

        const unlock = () => {
            refresh();
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };

        window.addEventListener("pointerdown", unlock, { passive: true });
        window.addEventListener("keydown", unlock);
    }

    return {
        init,
        refresh,
    };
})();

const Connect4Sound = (() => {
    let context = null;

    function sfxEnabled() {
        if (typeof Connect4Settings === "undefined") {
            return true;
        }
        return Connect4Settings.isSfxEnabled();
    }

    function getContext() {
        if (context) {
            return context;
        }
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            return null;
        }
        context = new Ctx();
        return context;
    }

    function unlock() {
        const ctx = getContext();
        if (ctx && ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }
    }

    function tone({ frequency, duration, type = "triangle", gain = 0.045, offset = 0 }) {
        if (!sfxEnabled()) {
            return;
        }
        const ctx = getContext();
        if (!ctx) {
            return;
        }

        const start = ctx.currentTime + offset;
        const end = start + duration;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(end);
    }

    function playDrop() {
        unlock();
        tone({ frequency: 260, duration: 0.04, type: "sine", gain: 0.032, offset: 0 });
        tone({ frequency: 330, duration: 0.05, type: "triangle", gain: 0.04, offset: 0.02 });
        tone({ frequency: 390, duration: 0.06, type: "triangle", gain: 0.043, offset: 0.06 });
    }

    function playWin() {
        unlock();
        tone({ frequency: 392, duration: 0.08, gain: 0.045, offset: 0 });
        tone({ frequency: 523, duration: 0.09, gain: 0.047, offset: 0.09 });
        tone({ frequency: 659, duration: 0.1, gain: 0.05, offset: 0.19 });
        tone({ frequency: 784, duration: 0.16, type: "sine", gain: 0.052, offset: 0.3 });
        tone({ frequency: 988, duration: 0.22, type: "sine", gain: 0.05, offset: 0.41 });
    }

    function playLose() {
        unlock();
        tone({ frequency: 270, duration: 0.08, type: "sine", gain: 0.04, offset: 0 });
        tone({ frequency: 220, duration: 0.1, type: "sine", gain: 0.038, offset: 0.09 });
        tone({ frequency: 170, duration: 0.13, type: "sine", gain: 0.036, offset: 0.2 });
    }

    function playDraw() {
        unlock();
        tone({ frequency: 320, duration: 0.1, type: "sine", gain: 0.038, offset: 0 });
        tone({ frequency: 290, duration: 0.12, type: "sine", gain: 0.036, offset: 0.1 });
        tone({ frequency: 250, duration: 0.14, type: "sine", gain: 0.034, offset: 0.22 });
    }

    function playInvalid() {
        unlock();
        tone({ frequency: 170, duration: 0.06, type: "square", gain: 0.021, offset: 0 });
        tone({ frequency: 130, duration: 0.08, type: "square", gain: 0.019, offset: 0.05 });
    }

    function playRestart() {
        unlock();
        tone({ frequency: 420, duration: 0.06, type: "triangle", gain: 0.036, offset: 0 });
        tone({ frequency: 570, duration: 0.08, type: "triangle", gain: 0.036, offset: 0.07 });
    }

    function playEffect() {
        unlock();
        tone({ frequency: 540, duration: 0.06, type: "sine", gain: 0.037, offset: 0 });
        tone({ frequency: 730, duration: 0.07, type: "triangle", gain: 0.038, offset: 0.07 });
    }

    return {
        unlock,
        playDrop,
        playWin,
        playLose,
        playDraw,
        playInvalid,
        playRestart,
        playEffect,
    };
})();

const Connect4View = (() => {
    const boardElement = document.getElementById("board");
    const hintsElement = document.getElementById("columnHints");
    const redPlayerElement = document.getElementById("playerRed");
    const yellowPlayerElement = document.getElementById("playerYellow");
    const restartButtonElement = document.getElementById("restartBtn");
    const statusElement = document.getElementById("statusMessage");
    const turnTimerElement = document.getElementById("turnTimer");
    const turnTimerValueElement = document.getElementById("turnTimerValue");
    const rewardToastElement = document.getElementById("rewardToast");
    const resultModalElement = document.getElementById("resultModal");
    const resultTitleElement = document.getElementById("resultTitle");
    const resultBodyElement = document.getElementById("resultBody");
    const resultNextButton = document.getElementById("resultNextBtn");
    const resultPlayAgainButton = document.getElementById("resultPlayAgainBtn");
    const resultCancelButton = document.getElementById("resultCancelBtn");

    const effectUndoButton = document.getElementById("effectUndoBtn");
    const effectHintButton = document.getElementById("effectHintBtn");
    const effectThreatButton = document.getElementById("effectThreatBtn");
    const effectSafeButton = document.getElementById("effectSafeBtn");
    const effectUndoCount = document.getElementById("effectUndoCount");
    const effectHintCount = document.getElementById("effectHintCount");
    const effectThreatCount = document.getElementById("effectThreatCount");
    const effectSafeCount = document.getElementById("effectSafeCount");

    let toastTimeoutId = 0;
    let clearMarkTimeoutId = 0;

    function createHint(col) {
        const hint = document.createElement("div");
        hint.className = "column-hint";
        hint.dataset.col = String(col);

        for (let i = 0; i < 3; i += 1) {
            const arrow = document.createElement("span");
            arrow.textContent = "\u25BC";
            hint.appendChild(arrow);
        }

        return hint;
    }

    function createCell(row, col, handlers) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.setAttribute("aria-label", `Column ${col + 1}, Row ${row + 1}`);

        cell.addEventListener("click", () => handlers.onSelect(col));
        cell.addEventListener("pointerenter", () => handlers.onPreview(col));
        cell.addEventListener("pointerdown", () => handlers.onPreview(col));
        cell.addEventListener("focus", () => handlers.onPreview(col));
        cell.addEventListener("touchstart", () => handlers.onPreview(col), { passive: true });

        return cell;
    }

    function buildBoard(rows, cols, handlers) {
        boardElement.innerHTML = "";
        hintsElement.innerHTML = "";

        const hintFragment = document.createDocumentFragment();
        for (let col = 0; col < cols; col += 1) {
            hintFragment.appendChild(createHint(col));
        }

        const cellFragment = document.createDocumentFragment();
        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                cellFragment.appendChild(createCell(row, col, handlers));
            }
        }

        hintsElement.appendChild(hintFragment);
        boardElement.appendChild(cellFragment);
        boardElement.addEventListener("pointerleave", () => handlers.onPreviewClear());
        boardElement.addEventListener("focusout", (event) => {
            if (!boardElement.contains(event.relatedTarget)) {
                handlers.onPreviewClear();
            }
        });
    }

    function clearMarks() {
        const cells = boardElement.querySelectorAll(".cell");
        cells.forEach((cell) => {
            cell.classList.remove("cell--threat", "cell--safe", "cell--hint");
        });

        if (clearMarkTimeoutId) {
            window.clearTimeout(clearMarkTimeoutId);
            clearMarkTimeoutId = 0;
        }
    }

    function clearEffects() {
        boardElement.classList.remove("board--win-red", "board--win-yellow");
        const line = boardElement.querySelector(".win-line");
        if (line) {
            line.remove();
        }
        clearMarks();

        const cells = boardElement.querySelectorAll(".cell");
        cells.forEach((cell) => {
            cell.classList.remove("cell--preview-red", "cell--preview-yellow", "cell--win");
            cell.style.removeProperty("--win-delay");
        });
    }

    function renderBoard(board) {
        const cells = boardElement.querySelectorAll(".cell");
        cells.forEach((cell) => {
            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);
            const value = board[row][col];

            cell.classList.remove(
                "red",
                "yellow",
                "cell--preview-red",
                "cell--preview-yellow",
                "cell--win",
                "cell--threat",
                "cell--safe",
                "cell--hint"
            );

            if (value === 1) {
                cell.classList.add("red");
            } else if (value === 2) {
                cell.classList.add("yellow");
            }
        });
    }

    function lockBoard(locked) {
        boardElement.classList.toggle("board--locked", locked);
        const cells = boardElement.querySelectorAll(".cell");
        cells.forEach((cell) => {
            cell.disabled = locked;
        });
    }

    function clearHints() {
        const hints = hintsElement.querySelectorAll(".column-hint");
        hints.forEach((hint) => {
            hint.classList.remove("column-hint--active", "column-hint--full");
        });
    }

    function showPreview(column, landingRow, player, isColumnFull) {
        clearHints();
        clearMarks();

        if (column < 0) {
            return;
        }

        const hint = hintsElement.querySelector(`.column-hint[data-col="${column}"]`);
        if (hint) {
            hint.classList.add("column-hint--active");
            if (isColumnFull) {
                hint.classList.add("column-hint--full");
            }
        }

        if (landingRow >= 0) {
            const landingCell = boardElement.querySelector(`.cell[data-row="${landingRow}"][data-col="${column}"]`);
            if (landingCell) {
                landingCell.classList.add(player === 1 ? "cell--preview-red" : "cell--preview-yellow");
            }
        }
    }

    function clearPreview() {
        clearHints();
        const cells = boardElement.querySelectorAll(".cell");
        cells.forEach((cell) => {
            cell.classList.remove("cell--preview-red", "cell--preview-yellow");
        });
    }

    function setTurnGlow(player) {
        const redActive = player === 1;
        redPlayerElement.classList.toggle("player-chip--active", redActive);
        yellowPlayerElement.classList.toggle("player-chip--active", !redActive);
    }

    function setPlayerLabels(mode, humanPlayer) {
        if (!redPlayerElement || !yellowPlayerElement) {
            return;
        }

        if (mode === "one") {
            redPlayerElement.textContent = humanPlayer === 1 ? "YOU" : "AI";
            yellowPlayerElement.textContent = humanPlayer === 2 ? "YOU" : "AI";
            return;
        }

        redPlayerElement.textContent = "P1";
        yellowPlayerElement.textContent = "P2";
    }

    function setDrawGlow() {
        redPlayerElement.classList.add("player-chip--active");
        yellowPlayerElement.classList.add("player-chip--active");
    }

    function drawWinLine(cells) {
        const first = cells[0];
        const last = cells[cells.length - 1];
        const firstCell = boardElement.querySelector(`.cell[data-row="${first[0]}"][data-col="${first[1]}"]`);
        const lastCell = boardElement.querySelector(`.cell[data-row="${last[0]}"][data-col="${last[1]}"]`);
        if (!firstCell || !lastCell) {
            return;
        }

        const x1 = firstCell.offsetLeft + firstCell.clientWidth / 2;
        const y1 = firstCell.offsetTop + firstCell.clientHeight / 2;
        const x2 = lastCell.offsetLeft + lastCell.clientWidth / 2;
        const y2 = lastCell.offsetTop + lastCell.clientHeight / 2;
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        const line = document.createElement("div");
        line.className = "win-line";
        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        boardElement.appendChild(line);
    }

    function highlightWin(cells, player) {
        boardElement.classList.add(player === 1 ? "board--win-red" : "board--win-yellow");
        drawWinLine(cells);
        cells.forEach(([row, col], index) => {
            const cell = boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.style.setProperty("--win-delay", `${index * 70}ms`);
                cell.classList.add("cell--win");
            }
        });
    }

    function celebrateWin(player) {
        const burstCount = 36;
        const particleLayer = document.createElement("div");
        particleLayer.className = "particle-layer";

        for (let i = 0; i < burstCount; i += 1) {
            const particle = document.createElement("span");
            particle.className = `particle ${player === 1 ? "particle--red" : "particle--yellow"}`;
            particle.style.setProperty("--x", `${Math.random() * 100}%`);
            particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 120}px`);
            particle.style.setProperty("--delay", `${Math.random() * 140}ms`);
            particle.style.setProperty("--dur", `${780 + Math.random() * 760}ms`);
            particle.style.setProperty("--size", `${5 + Math.random() * 7}px`);
            particleLayer.appendChild(particle);
        }

        boardElement.appendChild(particleLayer);
        window.setTimeout(() => {
            particleLayer.remove();
        }, 1800);
    }

    function markLandingCells(landingCells, className, durationMs = 2200) {
        clearMarks();
        landingCells.forEach(([row, col]) => {
            const cell = boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add(className);
            }
        });

        if (landingCells.length > 0) {
            clearMarkTimeoutId = window.setTimeout(() => {
                clearMarks();
            }, durationMs);
        }
    }

    function setStatus(message) {
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    function setTurnTimer(secondsLeft, active) {
        if (!turnTimerElement || !turnTimerValueElement) {
            return;
        }
        turnTimerValueElement.textContent = String(Math.max(0, Math.ceil(secondsLeft)));
        turnTimerElement.classList.toggle("turn-timer--active", active);
        turnTimerElement.classList.toggle("turn-timer--danger", active && secondsLeft <= 3);
    }

    function hideTurnTimer() {
        if (!turnTimerElement) {
            return;
        }
        turnTimerElement.classList.remove("turn-timer--active", "turn-timer--danger");
    }

    function showRewardToast(message) {
        if (!rewardToastElement) {
            return;
        }
        rewardToastElement.textContent = message;
        rewardToastElement.classList.add("reward-toast--show");
        if (toastTimeoutId) {
            window.clearTimeout(toastTimeoutId);
        }
        toastTimeoutId = window.setTimeout(() => {
            rewardToastElement.classList.remove("reward-toast--show");
        }, 2200);
    }

    function setEffectCounts(counts) {
        if (!effectUndoCount || !effectHintCount || !effectThreatCount || !effectSafeCount) {
            return;
        }

        effectUndoCount.textContent = String(counts.undo || 0);
        effectHintCount.textContent = String(counts.hint || 0);
        effectThreatCount.textContent = String(counts.threat_alert || 0);
        effectSafeCount.textContent = String(counts.safe_move || 0);

        effectUndoButton.disabled = (counts.undo || 0) <= 0;
        effectHintButton.disabled = (counts.hint || 0) <= 0;
        effectThreatButton.disabled = (counts.threat_alert || 0) <= 0;
        effectSafeButton.disabled = (counts.safe_move || 0) <= 0;
    }

    function bindEffectButtons(handlers) {
        if (!effectUndoButton || !effectHintButton || !effectThreatButton || !effectSafeButton) {
            return;
        }
        effectUndoButton.addEventListener("click", handlers.onUndo);
        effectHintButton.addEventListener("click", handlers.onHint);
        effectThreatButton.addEventListener("click", handlers.onThreatAlert);
        effectSafeButton.addEventListener("click", handlers.onSafeMove);
    }

    function showResultModal({ title, body, showNext, onNext, onPlayAgain, onCancel }) {
        if (!resultModalElement || !resultTitleElement || !resultBodyElement) {
            return;
        }

        resultTitleElement.textContent = title;
        resultBodyElement.textContent = body;
        resultModalElement.classList.add("result-modal--open");
        resultModalElement.setAttribute("aria-hidden", "false");

        if (resultNextButton) {
            resultNextButton.style.display = showNext ? "block" : "none";
            resultNextButton.onclick = showNext ? onNext : null;
        }

        if (resultPlayAgainButton) {
            resultPlayAgainButton.onclick = onPlayAgain;
        }

        if (resultCancelButton) {
            resultCancelButton.onclick = onCancel;
        }
    }

    function hideResultModal() {
        if (!resultModalElement) {
            return;
        }
        resultModalElement.classList.remove("result-modal--open");
        resultModalElement.setAttribute("aria-hidden", "true");
    }

    function bindRestart(handler) {
        restartButtonElement.addEventListener("click", handler);
    }

    function animateDrop(column, targetRow, player) {
        const targetCell = boardElement.querySelector(`.cell[data-row="${targetRow}"][data-col="${column}"]`);
        if (!targetCell) {
            return Promise.resolve();
        }

        const token = document.createElement("div");
        token.className = `drop-token ${player === 1 ? "red" : "yellow"}`;

        const tokenSize = targetCell.clientWidth;
        const top = -(tokenSize + 10);
        const left = targetCell.offsetLeft;
        const distance = targetCell.offsetTop - top;

        token.style.width = `${tokenSize}px`;
        token.style.height = `${tokenSize}px`;
        token.style.left = `${left}px`;
        token.style.top = `${top}px`;
        boardElement.appendChild(token);

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduceMotion ? 0 : 180 + targetRow * 92;

        return new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done) {
                    return;
                }
                done = true;
                token.remove();
                resolve();
            };

            if (duration === 0) {
                finish();
                return;
            }

            token.style.transitionDuration = `${duration}ms`;
            token.getBoundingClientRect();
            requestAnimationFrame(() => {
                token.style.transform = `translateY(${distance}px)`;
            });
            token.addEventListener("transitionend", finish, { once: true });
            window.setTimeout(finish, duration + 180);
        });
    }

    return {
        buildBoard,
        renderBoard,
        clearEffects,
        clearMarks,
        lockBoard,
        showPreview,
        clearPreview,
        setTurnGlow,
        setPlayerLabels,
        setDrawGlow,
        highlightWin,
        celebrateWin,
        markLandingCells,
        setStatus,
        setTurnTimer,
        hideTurnTimer,
        showRewardToast,
        setEffectCounts,
        bindEffectButtons,
        showResultModal,
        hideResultModal,
        bindRestart,
        animateDrop,
    };
})();

const Connect4Controller = (() => {
    let state;
    let animating = false;
    let modalOpen = false;
    let activeColumn = -1;
    let moveHistory = [];

    let activeThemeSelection = {
        colorThemeId: "classic",
        humanPlayer: 1,
        backgroundId: "bg01",
        boardTextureId: "board01",
        pieceSkinId: "skin01",
    };

    let stageStartTime = 0;
    let turnDeadline = 0;
    let turnTimerIntervalId = 0;
    let timeoutInProgress = false;
    let stageAttemptTracked = false;
    let playerMistakes = 0;
    let aiThreatSeen = false;
    let humanMovesThisGame = 0;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function parseIntInRange(value, min, max, fallback) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return fallback;
        }
        return clamp(parsed, min, max);
    }

    function isOnePlayerMode() { return state.mode === "one"; }
    function isAITurn() { return isOnePlayerMode() && state.currentPlayer === state.aiPlayer; }
    function isTimedStage() { return isOnePlayerMode() && [2, 4, 6, 8, 10].includes(state.level); }
    function getOpponent(player) { return player === 1 ? 2 : 1; }

    function getLegalMoves(board) {
        const moves = [];
        for (let col = 0; col < state.cols; col += 1) {
            if (board[0][col] === 0) {
                moves.push(col);
            }
        }
        return moves;
    }

    function cloneBoard(board) { return board.map((row) => row.slice()); }

    function hasImmediateWinningMove(board, player) {
        for (let col = 0; col < state.cols; col += 1) {
            const row = Connect4Model.getLowestOpenRow(board, col);
            if (row < 0) {
                continue;
            }
            const copy = cloneBoard(board);
            copy[row][col] = player;
            if (Connect4Model.getWinningLine(copy, row, col, player)) {
                return true;
            }
        }
        return false;
    }

    function getImmediateWinningLandingCells(board, player) {
        const cells = [];
        for (let col = 0; col < state.cols; col += 1) {
            const row = Connect4Model.getLowestOpenRow(board, col);
            if (row < 0) {
                continue;
            }
            const copy = cloneBoard(board);
            copy[row][col] = player;
            if (Connect4Model.getWinningLine(copy, row, col, player)) {
                cells.push([row, col]);
            }
        }
        return cells;
    }

    function getSafeLandingCells(board, player) {
        const safe = [];
        const opponent = getOpponent(player);
        for (let col = 0; col < state.cols; col += 1) {
            const row = Connect4Model.getLowestOpenRow(board, col);
            if (row < 0) {
                continue;
            }
            const copy = cloneBoard(board);
            copy[row][col] = player;
            if (!hasImmediateWinningMove(copy, opponent)) {
                safe.push([row, col]);
            }
        }
        return safe;
    }

    function clearTurnTimer() {
        if (turnTimerIntervalId) {
            window.clearInterval(turnTimerIntervalId);
            turnTimerIntervalId = 0;
        }
        turnDeadline = 0;
        Connect4View.hideTurnTimer();
    }

    function applyStoredTheme() {
        if (typeof Connect4Themes === "undefined") {
            return;
        }
        activeThemeSelection = Connect4Themes.loadSelection();
        Connect4Themes.applySelection(activeThemeSelection);
    }

    function startStageAttemptIfNeeded() {
        if (!isOnePlayerMode() || stageAttemptTracked) {
            return;
        }
        if (typeof Connect4Economy !== "undefined") {
            Connect4Economy.startStageAttempt(state.level, state.stage);
        }
        stageAttemptTracked = true;
    }

    function loadEffectCounts() {
        if (typeof Connect4Economy === "undefined") {
            Connect4View.setEffectCounts({ undo: 0, hint: 0, threat_alert: 0, safe_move: 0 });
            return;
        }
        Connect4View.setEffectCounts(Connect4Economy.getEffectCounts());
    }

    function consumeEffect(effectId) {
        if (typeof Connect4Economy === "undefined") {
            return false;
        }
        const result = Connect4Economy.consumeEffect(effectId, 1);
        loadEffectCounts();
        return result.consumed;
    }

    function refreshTurnTimer() {
        clearTurnTimer();
        if (state.gameOver || modalOpen || !isTimedStage() || state.currentPlayer !== state.humanPlayer) {
            return;
        }

        if (hasImmediateWinningMove(state.board, state.aiPlayer)) {
            aiThreatSeen = true;
        }

        turnDeadline = Date.now() + 10000;
        Connect4View.setTurnTimer(10, true);
        turnTimerIntervalId = window.setInterval(() => {
            const msLeft = turnDeadline - Date.now();
            const secondsLeft = msLeft / 1000;
            Connect4View.setTurnTimer(secondsLeft, true);
            if (msLeft <= 0) {
                void handleTurnTimeout();
            }
        }, 120);
    }

    function applyPreview(column) {
        if (animating || state.gameOver || modalOpen || isAITurn()) {
            return;
        }
        activeColumn = column;
        const landingRow = Connect4Model.getLowestOpenRow(state.board, column);
        Connect4View.showPreview(column, landingRow, state.currentPlayer, landingRow === -1);
    }

    function clearPreview() {
        activeColumn = -1;
        Connect4View.clearPreview();
    }

    function pushMove(row, col, player) { moveHistory.push({ row, col, player }); }
    function popMove() { return moveHistory.pop() || null; }

    function applyUndo() {
        if (animating || moveHistory.length === 0) {
            return;
        }
        if (!consumeEffect("undo")) {
            Connect4View.showRewardToast("No Undo effect left.");
            return;
        }

        Connect4Sound.playEffect();
        Connect4View.hideResultModal();
        modalOpen = false;
        state.gameOver = false;
        Connect4View.clearEffects();
        Connect4View.clearPreview();
        clearTurnTimer();

        const removed = [];
        if (
            isOnePlayerMode() &&
            moveHistory.length >= 2 &&
            moveHistory[moveHistory.length - 1].player === state.aiPlayer &&
            moveHistory[moveHistory.length - 2].player === state.humanPlayer
        ) {
            removed.push(popMove());
            removed.push(popMove());
        } else {
            removed.push(popMove());
        }

        removed.forEach((entry) => {
            if (!entry) {
                return;
            }
            Connect4Model.clearDisc(state, entry.row, entry.col);
            state.currentPlayer = entry.player;
        });

        Connect4View.renderBoard(state.board);
        Connect4View.setTurnGlow(state.currentPlayer);
        Connect4View.lockBoard(false);
        refreshTurnTimer();
    }

    function applyHint() {
        if (animating || state.gameOver || modalOpen) {
            return;
        }
        if (!consumeEffect("hint")) {
            Connect4View.showRewardToast("No Hint effect left.");
            return;
        }
        Connect4Sound.playEffect();

        const opponent = getOpponent(state.currentPlayer);
        let move = -1;
        if (typeof Connect4AI !== "undefined") {
            move = Connect4AI.chooseMove(state.board, state.currentPlayer, opponent, clamp(state.level, 1, 10), clamp(state.stage, 1, 10));
        }

        if (!Number.isInteger(move) || move < 0 || move >= state.cols) {
            const legal = getLegalMoves(state.board);
            move = legal.length > 0 ? legal[0] : -1;
        }
        if (move < 0) {
            Connect4View.showRewardToast("No move available.");
            return;
        }

        const row = Connect4Model.getLowestOpenRow(state.board, move);
        if (row < 0) {
            Connect4View.showRewardToast("No move available.");
            return;
        }

        Connect4View.markLandingCells([[row, move]], "cell--hint", 2600);
    }

    function applyThreatAlert() {
        if (animating || state.gameOver || modalOpen) {
            return;
        }
        if (!consumeEffect("threat_alert")) {
            Connect4View.showRewardToast("No Threat Alert effect left.");
            return;
        }
        Connect4Sound.playEffect();

        const opponent = getOpponent(state.currentPlayer);
        const cells = getImmediateWinningLandingCells(state.board, opponent);
        if (cells.length === 0) {
            Connect4View.showRewardToast("No immediate threat.");
            return;
        }
        Connect4View.markLandingCells(cells, "cell--threat", 2400);
    }

    function applySafeMove() {
        if (animating || state.gameOver || modalOpen) {
            return;
        }
        if (!consumeEffect("safe_move")) {
            Connect4View.showRewardToast("No Safe Move effect left.");
            return;
        }
        Connect4Sound.playEffect();

        const cells = getSafeLandingCells(state.board, state.currentPlayer);
        if (cells.length === 0) {
            Connect4View.showRewardToast("No safe move found.");
            return;
        }

        Connect4View.markLandingCells(cells, "cell--safe", 2400);
    }

    function openResultModal({ title, body, showNext }) {
        modalOpen = true;
        Connect4View.lockBoard(true);
        Connect4View.showResultModal({
            title,
            body,
            showNext,
            onNext: () => {
                Connect4Sound.playEffect();
                if (!isOnePlayerMode() || typeof Connect4Progression === "undefined") {
                    window.location.href = "index.html";
                    return;
                }
                const currentIndex = Connect4Progression.toStageIndex(state.level, state.stage);
                const nextIndex = Math.min(Connect4Progression.TOTAL_STAGES, currentIndex + 1);
                const next = Connect4Progression.fromStageIndex(nextIndex);
                window.location.href = `connectfour.html?mode=one&level=${next.level}&stage=${next.stage}`;
            },
            onPlayAgain: () => {
                Connect4Sound.playEffect();
                Connect4View.hideResultModal();
                modalOpen = false;
                restart();
            },
            onCancel: () => {
                Connect4Sound.playEffect();
                window.location.href = "index.html";
            },
        });
    }

    async function handleTurnTimeout() {
        if (timeoutInProgress || state.gameOver || modalOpen || animating) {
            return;
        }
        if (!isTimedStage() || state.currentPlayer !== state.humanPlayer) {
            return;
        }

        timeoutInProgress = true;
        clearTurnTimer();
        playerMistakes += 1;
        Connect4View.showRewardToast("Turn missed. Timeout.");
        Connect4View.clearPreview();

        try {
            animating = true;
            Connect4View.lockBoard(true);
            Connect4Model.togglePlayer(state);
            Connect4View.setTurnGlow(state.currentPlayer);
            await runAIIfNeeded();
        } finally {
            animating = false;
            timeoutInProgress = false;
            Connect4View.lockBoard(state.gameOver || isAITurn() || modalOpen);
            refreshTurnTimer();
        }
    }

    async function playTurn(column, fromAI = false) {
        let landingRow = Connect4Model.getLowestOpenRow(state.board, column);

        if (landingRow === -1) {
            if (fromAI) {
                const legalMoves = getLegalMoves(state.board);
                if (legalMoves.length === 0) {
                    return false;
                }
                column = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                landingRow = Connect4Model.getLowestOpenRow(state.board, column);
                if (landingRow === -1) {
                    return false;
                }
            } else {
                Connect4View.setStatus("Column full. Choose another.");
                Connect4Sound.playInvalid();
                if (isOnePlayerMode() && state.currentPlayer === state.humanPlayer) {
                    playerMistakes += 1;
                }
                applyPreview(column);
                return false;
            }
        }

        const player = state.currentPlayer;
        clearTurnTimer();
        Connect4View.clearPreview();
        await Connect4View.animateDrop(column, landingRow, player);
        Connect4Sound.playDrop();

        if (isOnePlayerMode() && player === state.humanPlayer) {
            humanMovesThisGame += 1;
        }

        Connect4Model.dropDisc(state, landingRow, column, player);
        pushMove(landingRow, column, player);
        Connect4View.renderBoard(state.board);

        const winLine = Connect4Model.getWinningLine(state.board, landingRow, column, player);
        if (winLine) {
            state.gameOver = true;
            Connect4View.highlightWin(winLine, player);
            const playerWonInOneMode = isOnePlayerMode() ? player === state.humanPlayer : true;
            if (playerWonInOneMode) {
                Connect4View.celebrateWin(player);
            }
            Connect4View.setTurnGlow(player);

            if (isOnePlayerMode() && player === state.humanPlayer && typeof Connect4Progression !== "undefined") {
                Connect4Progression.unlockNext(state.level, state.stage);
            }

            if (isOnePlayerMode() && player === state.humanPlayer && typeof Connect4Economy !== "undefined") {
                const durationMs = Math.max(0, Date.now() - stageStartTime);
                const perfectGame = playerMistakes === 0 && !aiThreatSeen;
                const reward = Connect4Economy.recordStageWin({
                    level: state.level,
                    stage: state.stage,
                    durationMs,
                    perfectGame,
                    movesUsed: humanMovesThisGame,
                });
                Connect4View.showRewardToast(`+${reward.gained} Coins${reward.isReplay ? " (Replay x0.5)" : ""}`);
            }

            if (isOnePlayerMode() && player === state.aiPlayer && typeof Connect4Economy !== "undefined") {
                Connect4Economy.recordStageFailure();
            }

            if (isOnePlayerMode()) {
                if (player === state.humanPlayer) {
                    openResultModal({ title: "Victory", body: `Level ${state.level} Stage ${state.stage} cleared.`, showNext: true });
                    Connect4Sound.playWin();
                } else {
                    openResultModal({ title: "Defeat", body: "You lost this stage. Try again.", showNext: false });
                    Connect4Sound.playLose();
                }
            } else {
                openResultModal({ title: player === 1 ? "Player 1 Wins" : "Player 2 Wins", body: "Match complete.", showNext: false });
                Connect4Sound.playWin();
            }

            return true;
        }

        if (Connect4Model.isBoardFull(state.board)) {
            state.gameOver = true;
            Connect4View.setDrawGlow();
            Connect4View.setStatus("Draw game.");
            Connect4Sound.playDraw();
            if (isOnePlayerMode() && typeof Connect4Economy !== "undefined") {
                Connect4Economy.recordStageFailure();
            }
            openResultModal({ title: "Draw", body: "No winner this round.", showNext: false });
            return true;
        }

        Connect4Model.togglePlayer(state);
        Connect4View.setTurnGlow(state.currentPlayer);
        Connect4View.setStatus("Tap or hover a column, then drop.");
        refreshTurnTimer();
        return true;
    }

    function chooseAIMove() {
        if (typeof Connect4AI !== "undefined") {
            const move = Connect4AI.chooseMove(
                state.board,
                state.aiPlayer,
                state.humanPlayer,
                state.level,
                state.stage
            );
            if (Number.isInteger(move) && move >= 0 && move < state.cols) {
                return move;
            }
        }

        const legalMoves = getLegalMoves(state.board);
        if (legalMoves.length === 0) {
            return -1;
        }
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    async function runAIIfNeeded() {
        if (!isAITurn() || state.gameOver || modalOpen) {
            return;
        }

        const ownsAnimationLock = !animating;
        if (ownsAnimationLock) {
            animating = true;
            Connect4View.lockBoard(true);
        }

        try {
            await new Promise((resolve) => window.setTimeout(resolve, state.aiDelayMs));

            if (state.gameOver || modalOpen || !isAITurn()) {
                return;
            }

            const aiMove = chooseAIMove();
            if (aiMove < 0) {
                return;
            }

            await playTurn(aiMove, true);
        } finally {
            if (ownsAnimationLock) {
                animating = false;
                Connect4View.lockBoard(state.gameOver || modalOpen);
                if (!state.gameOver && !isAITurn() && activeColumn >= 0) {
                    applyPreview(activeColumn);
                }
            }
        }
    }

    async function handleSelect(column) {
        if (animating || state.gameOver || modalOpen || isAITurn()) {
            return;
        }

        Connect4Sound.unlock();
        Connect4Music.refresh();

        try {
            animating = true;
            Connect4View.lockBoard(true);
            const moved = await playTurn(column, false);

            if (moved && !state.gameOver) {
                await runAIIfNeeded();
            }
        } finally {
            animating = false;
            Connect4View.lockBoard(state.gameOver || modalOpen);
            if (!state.gameOver && !isAITurn() && activeColumn >= 0) {
                applyPreview(activeColumn);
            }
        }
    }

    function restart() {
        if (animating) {
            return;
        }

        Connect4Sound.unlock();
        Connect4Sound.playRestart();
        Connect4Music.refresh();

        clearTurnTimer();
        Connect4View.hideResultModal();
        modalOpen = false;

        const mode = state.mode;
        const level = state.level;
        const stage = state.stage;
        const humanPlayer = state.humanPlayer;
        const aiPlayer = state.aiPlayer;

        state = Connect4Model.createGameState();
        state.mode = mode;
        state.level = level;
        state.stage = stage;
        state.humanPlayer = humanPlayer;
        state.aiPlayer = aiPlayer;

        animating = false;
        activeColumn = -1;
        timeoutInProgress = false;
        stageAttemptTracked = false;
        playerMistakes = 0;
        aiThreatSeen = false;
        humanMovesThisGame = 0;
        stageStartTime = Date.now();
        moveHistory = [];
        startStageAttemptIfNeeded();

        Connect4View.lockBoard(false);
        Connect4View.renderBoard(state.board);
        Connect4View.clearEffects();
        Connect4View.clearPreview();
        Connect4View.setPlayerLabels(state.mode, state.humanPlayer);
        Connect4View.setTurnGlow(state.currentPlayer);
        loadEffectCounts();

        if (isAITurn() && !state.gameOver) {
            void runAIIfNeeded();
        } else {
            refreshTurnTimer();
        }
    }

    function setupModeFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        state.mode = mode === "one" ? "one" : "two";

        if (state.mode === "one") {
            const selectedSide = activeThemeSelection.humanPlayer === 2 ? 2 : 1;
            state.humanPlayer = selectedSide;
            state.aiPlayer = selectedSide === 1 ? 2 : 1;
        } else {
            state.humanPlayer = 1;
            state.aiPlayer = 2;
        }

        if (state.mode !== "one") {
            return;
        }

        let level = parseIntInRange(params.get("level"), 1, 10, 1);
        let stage = parseIntInRange(params.get("stage"), 1, 10, 1);
        if (typeof Connect4Progression !== "undefined") {
            const highestUnlocked = Connect4Progression.loadProgress();
            const hasExplicitStage = params.has("level") && params.has("stage");
            const requestedIndex = hasExplicitStage
                ? Connect4Progression.toStageIndex(level, stage)
                : highestUnlocked;
            const playableIndex = Math.min(requestedIndex, highestUnlocked);
            const playable = Connect4Progression.fromStageIndex(playableIndex);
            level = playable.level;
            stage = playable.stage;
        }

        state.level = level;
        state.stage = stage;

        const targetQuery = `?mode=one&level=${level}&stage=${stage}`;
        if (window.location.search !== targetQuery) {
            window.history.replaceState(null, "", `connectfour.html${targetQuery}`);
        }
    }

    function bindEffects() {
        Connect4View.bindEffectButtons({
            onUndo: applyUndo,
            onHint: applyHint,
            onThreatAlert: applyThreatAlert,
            onSafeMove: applySafeMove,
        });
    }

    function init() {
        state = Connect4Model.createGameState();
        applyStoredTheme();
        setupModeFromQuery();
        stageStartTime = Date.now();
        stageAttemptTracked = false;
        playerMistakes = 0;
        aiThreatSeen = false;
        humanMovesThisGame = 0;
        timeoutInProgress = false;
        moveHistory = [];
        startStageAttemptIfNeeded();

        Connect4Music.init();

        Connect4View.buildBoard(state.rows, state.cols, {
            onSelect: handleSelect,
            onPreview: applyPreview,
            onPreviewClear: clearPreview,
        });

        Connect4View.bindRestart(restart);
        bindEffects();
        Connect4View.renderBoard(state.board);
        Connect4View.setPlayerLabels(state.mode, state.humanPlayer);
        Connect4View.setTurnGlow(state.currentPlayer);
        loadEffectCounts();

        if (isAITurn() && !state.gameOver) {
            void runAIIfNeeded();
        } else {
            refreshTurnTimer();
        }
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", Connect4Controller.init);
