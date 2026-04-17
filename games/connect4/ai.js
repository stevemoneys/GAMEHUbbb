const Connect4AI = (() => {
    const ROWS = 6;
    const COLS = 7;
    const WIN_SCORE = 1000000;
    const CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6];

    const LEVEL_META = [
        {
            level: 1,
            name: "Pure Random",
            summary: "Picks any legal column randomly.",
        },
        {
            level: 2,
            name: "Random + Immediate Win",
            summary: "Wins instantly when possible, otherwise random.",
        },
        {
            level: 3,
            name: "Basic Defender",
            summary: "Wins, blocks immediate losses, then random.",
        },
        {
            level: 4,
            name: "One-Move Lookahead",
            summary: "Avoids obvious traps and prefers center-weighted moves.",
        },
        {
            level: 5,
            name: "Two-Move Lookahead",
            summary: "Simulates AI move + player response and plans setups.",
        },
        {
            level: 6,
            name: "Minimax Depth 3",
            summary: "First full strategic search tier.",
        },
        {
            level: 7,
            name: "Minimax Depth 4",
            summary: "Deeper search with stronger center priority.",
        },
        {
            level: 8,
            name: "Minimax + Alpha-Beta",
            summary: "Faster pruning, practical deeper tactical play.",
        },
        {
            level: 9,
            name: "Advanced Evaluation",
            summary: "Scores forks, threats, open-ended 3s, and doubles.",
        },
        {
            level: 10,
            name: "Tournament AI",
            summary: "High-depth alpha-beta with move ordering and elite eval.",
        },
    ];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function cloneBoard(board) {
        return board.map((row) => row.slice());
    }

    function getLegalMoves(board) {
        const moves = [];
        for (let col = 0; col < COLS; col += 1) {
            if (board[0][col] === 0) {
                moves.push(col);
            }
        }
        return moves;
    }

    function applyMove(board, col, player) {
        for (let row = ROWS - 1; row >= 0; row -= 1) {
            if (board[row][col] === 0) {
                board[row][col] = player;
                return row;
            }
        }
        return -1;
    }

    function undoMove(board, row, col) {
        board[row][col] = 0;
    }

    function isInside(row, col) {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS;
    }

    function countDirection(board, row, col, rowStep, colStep, player) {
        let count = 0;
        let r = row + rowStep;
        let c = col + colStep;

        while (isInside(r, c) && board[r][c] === player) {
            count += 1;
            r += rowStep;
            c += colStep;
        }

        return count;
    }

    function isWinningPlacement(board, row, col, player) {
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1],
        ];

        for (const [rowStep, colStep] of directions) {
            const total =
                1 +
                countDirection(board, row, col, rowStep, colStep, player) +
                countDirection(board, row, col, -rowStep, -colStep, player);
            if (total >= 4) {
                return true;
            }
        }

        return false;
    }

    function getWinningMoves(board, player) {
        const winningMoves = [];
        const legalMoves = getLegalMoves(board);
        for (const col of legalMoves) {
            const row = applyMove(board, col, player);
            if (row >= 0 && isWinningPlacement(board, row, col, player)) {
                winningMoves.push(col);
            }
            if (row >= 0) {
                undoMove(board, row, col);
            }
        }
        return winningMoves;
    }

    function pickRandom(moves) {
        if (moves.length === 0) {
            return -1;
        }
        const index = Math.floor(Math.random() * moves.length);
        return moves[index];
    }

    function centerBias(col) {
        return 4 - Math.abs(3 - col);
    }

    function pickCenterWeighted(moves, randomness = 0.15) {
        if (moves.length === 0) {
            return -1;
        }

        const weighted = moves.map((col) => ({
            col,
            weight: Math.max(1, centerBias(col) + Math.random() * randomness * 2),
        }));

        const total = weighted.reduce((sum, item) => sum + item.weight, 0);
        let roll = Math.random() * total;
        for (const item of weighted) {
            roll -= item.weight;
            if (roll <= 0) {
                return item.col;
            }
        }

        return weighted[weighted.length - 1].col;
    }

    function immediateBestMove(board, aiPlayer, humanPlayer) {
        const aiWinningMoves = getWinningMoves(board, aiPlayer);
        if (aiWinningMoves.length > 0) {
            return aiWinningMoves[0];
        }

        const blockingMoves = getWinningMoves(board, humanPlayer);
        if (blockingMoves.length > 0) {
            return blockingMoves[0];
        }

        return -1;
    }

    function chooseLevel4Move(board, aiPlayer, humanPlayer) {
        const forcedMove = immediateBestMove(board, aiPlayer, humanPlayer);
        if (forcedMove >= 0) {
            return forcedMove;
        }

        const legalMoves = getLegalMoves(board);
        const safeMoves = [];

        for (const col of legalMoves) {
            const row = applyMove(board, col, aiPlayer);
            if (row < 0) {
                continue;
            }

            const opponentWins = getWinningMoves(board, humanPlayer);
            if (opponentWins.length === 0) {
                safeMoves.push(col);
            }

            undoMove(board, row, col);
        }

        if (safeMoves.length > 0) {
            return pickCenterWeighted(safeMoves, 0.2);
        }

        return pickCenterWeighted(legalMoves, 0.3);
    }

    function evaluateWindow(window, aiPlayer, humanPlayer, weights) {
        const aiCount = window.filter((value) => value === aiPlayer).length;
        const humanCount = window.filter((value) => value === humanPlayer).length;
        const emptyCount = window.filter((value) => value === 0).length;

        if (aiCount === 4) {
            return weights.win;
        }
        if (humanCount === 4) {
            return -weights.win;
        }
        if (aiCount === 3 && emptyCount === 1) {
            return weights.three;
        }
        if (aiCount === 2 && emptyCount === 2) {
            return weights.two;
        }
        if (humanCount === 3 && emptyCount === 1) {
            return -weights.blockThree;
        }
        if (humanCount === 2 && emptyCount === 2) {
            return -weights.blockTwo;
        }
        return 0;
    }

    function isPlayableCell(board, row, col) {
        if (row === ROWS - 1) {
            return true;
        }
        return board[row + 1][col] !== 0;
    }

    function countOpenEndedThreats(board, player, opponent) {
        let count = 0;

        function addThreat(lineCoords) {
            const values = lineCoords.map(([r, c]) => board[r][c]);
            const playerCount = values.filter((value) => value === player).length;
            const opponentCount = values.filter((value) => value === opponent).length;
            const emptyCount = values.filter((value) => value === 0).length;

            if (playerCount === 3 && opponentCount === 0 && emptyCount === 1) {
                const emptyIndex = values.findIndex((value) => value === 0);
                const [row, col] = lineCoords[emptyIndex];
                if (isPlayableCell(board, row, col)) {
                    count += 1;
                }
            }
        }

        for (let row = 0; row < ROWS; row += 1) {
            for (let col = 0; col <= COLS - 4; col += 1) {
                addThreat([
                    [row, col],
                    [row, col + 1],
                    [row, col + 2],
                    [row, col + 3],
                ]);
            }
        }

        for (let row = 0; row <= ROWS - 4; row += 1) {
            for (let col = 0; col < COLS; col += 1) {
                addThreat([
                    [row, col],
                    [row + 1, col],
                    [row + 2, col],
                    [row + 3, col],
                ]);
            }
        }

        for (let row = 0; row <= ROWS - 4; row += 1) {
            for (let col = 0; col <= COLS - 4; col += 1) {
                addThreat([
                    [row, col],
                    [row + 1, col + 1],
                    [row + 2, col + 2],
                    [row + 3, col + 3],
                ]);
            }
        }

        for (let row = 0; row <= ROWS - 4; row += 1) {
            for (let col = 3; col < COLS; col += 1) {
                addThreat([
                    [row, col],
                    [row + 1, col - 1],
                    [row + 2, col - 2],
                    [row + 3, col - 3],
                ]);
            }
        }

        return count;
    }

    function countForkMoves(board, player) {
        let forks = 0;
        const legalMoves = getLegalMoves(board);

        for (const col of legalMoves) {
            const row = applyMove(board, col, player);
            if (row < 0) {
                continue;
            }

            const winningReplies = getWinningMoves(board, player);
            if (winningReplies.length >= 2) {
                forks += 1;
            }

            undoMove(board, row, col);
        }

        return forks;
    }

    function evaluateBoard(board, aiPlayer, humanPlayer, profile) {
        let score = 0;
        const centerColumn = 3;
        const centerCount = board.reduce(
            (count, row) => count + (row[centerColumn] === aiPlayer ? 1 : 0),
            0
        );
        score += centerCount * profile.weights.center;

        for (let row = 0; row < ROWS; row += 1) {
            for (let col = 0; col <= COLS - 4; col += 1) {
                const window = [board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]];
                score += evaluateWindow(window, aiPlayer, humanPlayer, profile.weights);
            }
        }

        for (let row = 0; row <= ROWS - 4; row += 1) {
            for (let col = 0; col < COLS; col += 1) {
                const window = [board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]];
                score += evaluateWindow(window, aiPlayer, humanPlayer, profile.weights);
            }
        }

        for (let row = 0; row <= ROWS - 4; row += 1) {
            for (let col = 0; col <= COLS - 4; col += 1) {
                const window = [
                    board[row][col],
                    board[row + 1][col + 1],
                    board[row + 2][col + 2],
                    board[row + 3][col + 3],
                ];
                score += evaluateWindow(window, aiPlayer, humanPlayer, profile.weights);
            }
        }

        for (let row = 0; row <= ROWS - 4; row += 1) {
            for (let col = 3; col < COLS; col += 1) {
                const window = [
                    board[row][col],
                    board[row + 1][col - 1],
                    board[row + 2][col - 2],
                    board[row + 3][col - 3],
                ];
                score += evaluateWindow(window, aiPlayer, humanPlayer, profile.weights);
            }
        }

        if (profile.advancedEval) {
            const aiThreats = countOpenEndedThreats(board, aiPlayer, humanPlayer);
            const humanThreats = countOpenEndedThreats(board, humanPlayer, aiPlayer);
            const aiWinningMoves = getWinningMoves(board, aiPlayer).length;
            const humanWinningMoves = getWinningMoves(board, humanPlayer).length;
            const aiForks = countForkMoves(board, aiPlayer);
            const humanForks = countForkMoves(board, humanPlayer);

            score += aiThreats * profile.weights.openThree;
            score -= humanThreats * profile.weights.openThreeBlock;
            score += aiWinningMoves * profile.weights.immediateThreat;
            score -= humanWinningMoves * profile.weights.immediateThreatBlock;
            score += aiForks * profile.weights.fork;
            score -= humanForks * profile.weights.forkBlock;
        }

        return score;
    }

    function serializeBoard(board, depth, maximizing) {
        const rows = board.map((row) => row.join("")).join("|");
        return `${rows}:${depth}:${maximizing ? "M" : "m"}`;
    }

    function orderMoves(board, legalMoves, aiPlayer, humanPlayer, profile) {
        if (!profile.moveOrdering) {
            const set = new Set(legalMoves);
            return CENTER_ORDER.filter((col) => set.has(col));
        }

        const scored = [];
        for (const col of legalMoves) {
            let score = centerBias(col) * profile.weights.centerMoveOrder;
            const aiRow = applyMove(board, col, aiPlayer);
            if (aiRow >= 0) {
                if (isWinningPlacement(board, aiRow, col, aiPlayer)) {
                    score += 20000;
                }
                const opponentWins = getWinningMoves(board, humanPlayer).length;
                if (opponentWins > 0) {
                    score -= 5000;
                }
                undoMove(board, aiRow, col);
            }
            scored.push({ col, score });
        }

        scored.sort((a, b) => b.score - a.score);
        return scored.map((entry) => entry.col);
    }

    function minimax(board, depth, alpha, beta, maximizingPlayer, aiPlayer, humanPlayer, profile, ply, table) {
        const legalMoves = getLegalMoves(board);
        if (depth === 0 || legalMoves.length === 0) {
            return evaluateBoard(board, aiPlayer, humanPlayer, profile);
        }

        if (profile.useTransposition) {
            const key = serializeBoard(board, depth, maximizingPlayer);
            if (table.has(key)) {
                return table.get(key);
            }
            const result = minimaxCore(
                board,
                depth,
                alpha,
                beta,
                maximizingPlayer,
                aiPlayer,
                humanPlayer,
                profile,
                ply,
                table,
                legalMoves
            );
            table.set(key, result);
            return result;
        }

        return minimaxCore(
            board,
            depth,
            alpha,
            beta,
            maximizingPlayer,
            aiPlayer,
            humanPlayer,
            profile,
            ply,
            table,
            legalMoves
        );
    }

    function minimaxCore(
        board,
        depth,
        alpha,
        beta,
        maximizingPlayer,
        aiPlayer,
        humanPlayer,
        profile,
        ply,
        table,
        legalMoves
    ) {
        if (maximizingPlayer) {
            let bestScore = -Infinity;
            const ordered = orderMoves(board, legalMoves, aiPlayer, humanPlayer, profile);

            for (const col of ordered) {
                const row = applyMove(board, col, aiPlayer);
                if (row < 0) {
                    continue;
                }

                let score;
                if (isWinningPlacement(board, row, col, aiPlayer)) {
                    score = WIN_SCORE - ply;
                } else {
                    score = minimax(
                        board,
                        depth - 1,
                        alpha,
                        beta,
                        false,
                        aiPlayer,
                        humanPlayer,
                        profile,
                        ply + 1,
                        table
                    );
                }

                undoMove(board, row, col);
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);
                if (profile.alphaBeta && alpha >= beta) {
                    break;
                }
            }

            return bestScore;
        }

        let bestScore = Infinity;
        const ordered = orderMoves(board, legalMoves, humanPlayer, aiPlayer, profile);

        for (const col of ordered) {
            const row = applyMove(board, col, humanPlayer);
            if (row < 0) {
                continue;
            }

            let score;
            if (isWinningPlacement(board, row, col, humanPlayer)) {
                score = -WIN_SCORE + ply;
            } else {
                score = minimax(
                    board,
                    depth - 1,
                    alpha,
                    beta,
                    true,
                    aiPlayer,
                    humanPlayer,
                    profile,
                    ply + 1,
                    table
                );
            }

            undoMove(board, row, col);
            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, bestScore);
            if (profile.alphaBeta && alpha >= beta) {
                break;
            }
        }

        return bestScore;
    }

    function chooseTwoMoveLookahead(board, aiPlayer, humanPlayer) {
        const forced = immediateBestMove(board, aiPlayer, humanPlayer);
        if (forced >= 0) {
            return forced;
        }

        const legalMoves = getLegalMoves(board);
        const scoredMoves = [];

        for (const col of legalMoves) {
            const aiRow = applyMove(board, col, aiPlayer);
            if (aiRow < 0) {
                continue;
            }

            let score = centerBias(col) * 30;
            let worstCase = Infinity;
            const humanMoves = getLegalMoves(board);

            if (humanMoves.length === 0) {
                worstCase = 0;
            } else {
                for (const humanCol of humanMoves) {
                    const humanRow = applyMove(board, humanCol, humanPlayer);
                    if (humanRow < 0) {
                        continue;
                    }

                    let responseScore;
                    if (isWinningPlacement(board, humanRow, humanCol, humanPlayer)) {
                        responseScore = -WIN_SCORE / 2;
                    } else {
                        const aiThreats = getWinningMoves(board, aiPlayer).length;
                        const humanThreats = getWinningMoves(board, humanPlayer).length;
                        responseScore = aiThreats * 220 - humanThreats * 240 + centerBias(col) * 20;
                    }

                    undoMove(board, humanRow, humanCol);
                    worstCase = Math.min(worstCase, responseScore);
                }
            }

            score += worstCase;
            undoMove(board, aiRow, col);
            scoredMoves.push({ col, score });
        }

        scoredMoves.sort((a, b) => b.score - a.score);
        if (scoredMoves.length === 0) {
            return -1;
        }

        const topScore = scoredMoves[0].score;
        const topMoves = scoredMoves
            .filter((entry) => entry.score >= topScore - 25)
            .map((entry) => entry.col);
        return pickCenterWeighted(topMoves, 0.18);
    }

    function buildProfile(level, stage) {
        const safeLevel = clamp(Number(level) || 1, 1, 10);
        const safeStage = clamp(Number(stage) || 1, 1, 10);
        const stageFactor = (safeStage - 1) / 9;

        const baseWeights = {
            win: 100000,
            center: 12 + stageFactor * 8,
            two: 6 + stageFactor * 3,
            three: 24 + stageFactor * 10,
            blockTwo: 7 + stageFactor * 3,
            blockThree: 30 + stageFactor * 12,
            openThree: 45 + stageFactor * 10,
            openThreeBlock: 55 + stageFactor * 12,
            immediateThreat: 110 + stageFactor * 30,
            immediateThreatBlock: 140 + stageFactor * 35,
            fork: 160 + stageFactor * 60,
            forkBlock: 220 + stageFactor * 70,
            centerMoveOrder: 20 + stageFactor * 18,
        };

        switch (safeLevel) {
            case 1:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "random",
                };
            case 2:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "win_random",
                };
            case 3:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "win_block_random",
                };
            case 4:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "lookahead_1",
                };
            case 5:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "lookahead_2",
                };
            case 6:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "minimax",
                    depth: safeStage >= 7 ? 4 : 3,
                    alphaBeta: false,
                    moveOrdering: safeStage >= 6,
                    useTransposition: false,
                    advancedEval: false,
                    randomness: 0.08 - stageFactor * 0.04,
                    weights: baseWeights,
                };
            case 7:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "minimax",
                    depth: safeStage >= 7 ? 5 : 4,
                    alphaBeta: false,
                    moveOrdering: true,
                    useTransposition: false,
                    advancedEval: false,
                    randomness: 0.06 - stageFactor * 0.04,
                    weights: {
                        ...baseWeights,
                        center: baseWeights.center + 8,
                    },
                };
            case 8:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "minimax",
                    depth: safeStage >= 8 ? 6 : 5,
                    alphaBeta: true,
                    moveOrdering: true,
                    useTransposition: safeStage >= 5,
                    advancedEval: safeStage >= 6,
                    randomness: 0.05 - stageFactor * 0.035,
                    weights: {
                        ...baseWeights,
                        center: baseWeights.center + 10,
                        three: baseWeights.three + 6,
                    },
                };
            case 9:
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "minimax",
                    depth: safeStage >= 7 ? 6 : 5,
                    alphaBeta: true,
                    moveOrdering: true,
                    useTransposition: true,
                    advancedEval: true,
                    randomness: 0.035 - stageFactor * 0.025,
                    weights: {
                        ...baseWeights,
                        center: baseWeights.center + 12,
                        openThree: baseWeights.openThree + 22,
                        openThreeBlock: baseWeights.openThreeBlock + 24,
                        fork: baseWeights.fork + 45,
                        forkBlock: baseWeights.forkBlock + 50,
                    },
                };
            case 10: {
                const unbeatable = safeStage >= 9;
                return {
                    level: safeLevel,
                    stage: safeStage,
                    strategy: "minimax",
                    depth: unbeatable ? 8 : safeStage >= 7 ? 7 : 6,
                    alphaBeta: true,
                    moveOrdering: true,
                    useTransposition: true,
                    advancedEval: true,
                    randomness: unbeatable ? 0 : 0.025 - stageFactor * 0.018,
                    weights: {
                        ...baseWeights,
                        center: baseWeights.center + 18,
                        two: baseWeights.two + 3,
                        three: baseWeights.three + 14,
                        blockThree: baseWeights.blockThree + 18,
                        openThree: baseWeights.openThree + 35,
                        openThreeBlock: baseWeights.openThreeBlock + 42,
                        immediateThreat: baseWeights.immediateThreat + 55,
                        immediateThreatBlock: baseWeights.immediateThreatBlock + 68,
                        fork: baseWeights.fork + 90,
                        forkBlock: baseWeights.forkBlock + 110,
                    },
                };
            }
            default:
                return {
                    level: 1,
                    stage: 1,
                    strategy: "random",
                };
        }
    }

    function chooseByMinimax(board, aiPlayer, humanPlayer, profile) {
        const legalMoves = getLegalMoves(board);
        if (legalMoves.length === 0) {
            return -1;
        }

        const forced = immediateBestMove(board, aiPlayer, humanPlayer);
        if (forced >= 0) {
            return forced;
        }

        const table = new Map();
        const scoredMoves = [];
        const ordered = orderMoves(board, legalMoves, aiPlayer, humanPlayer, profile);

        for (const col of ordered) {
            const row = applyMove(board, col, aiPlayer);
            if (row < 0) {
                continue;
            }

            let score;
            if (isWinningPlacement(board, row, col, aiPlayer)) {
                score = WIN_SCORE;
            } else {
                score = minimax(
                    board,
                    profile.depth - 1,
                    -Infinity,
                    Infinity,
                    false,
                    aiPlayer,
                    humanPlayer,
                    profile,
                    1,
                    table
                );
            }

            undoMove(board, row, col);
            scoredMoves.push({ col, score });
        }

        scoredMoves.sort((a, b) => b.score - a.score);
        if (scoredMoves.length === 0) {
            return pickCenterWeighted(legalMoves, 0.15);
        }

        const bestScore = scoredMoves[0].score;
        const margin = Math.max(1, Math.round(12 + profile.randomness * 100));
        const topMoves = scoredMoves.filter((entry) => entry.score >= bestScore - margin).map((entry) => entry.col);

        if (topMoves.length === 1 || profile.randomness <= 0) {
            return topMoves[0];
        }

        const roll = Math.random();
        if (roll < profile.randomness) {
            return pickCenterWeighted(topMoves, profile.randomness);
        }

        return topMoves[0];
    }

    function chooseMove(board, aiPlayer, humanPlayer, level, stage) {
        const profile = buildProfile(level, stage);
        const workingBoard = cloneBoard(board);
        const legalMoves = getLegalMoves(workingBoard);

        if (legalMoves.length === 0) {
            return -1;
        }

        switch (profile.strategy) {
            case "random":
                return pickRandom(legalMoves);
            case "win_random": {
                const winMoves = getWinningMoves(workingBoard, aiPlayer);
                if (winMoves.length > 0) {
                    return pickCenterWeighted(winMoves, 0);
                }
                return pickRandom(legalMoves);
            }
            case "win_block_random": {
                const forced = immediateBestMove(workingBoard, aiPlayer, humanPlayer);
                if (forced >= 0) {
                    return forced;
                }
                return pickRandom(legalMoves);
            }
            case "lookahead_1":
                return chooseLevel4Move(workingBoard, aiPlayer, humanPlayer);
            case "lookahead_2":
                return chooseTwoMoveLookahead(workingBoard, aiPlayer, humanPlayer);
            case "minimax":
                return chooseByMinimax(workingBoard, aiPlayer, humanPlayer, profile);
            default:
                return pickRandom(legalMoves);
        }
    }

    function getLevelMeta() {
        return LEVEL_META.slice();
    }

    return {
        chooseMove,
        getLevelMeta,
    };
})();
