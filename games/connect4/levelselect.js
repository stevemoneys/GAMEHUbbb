(() => {
    const levelGridElement = document.getElementById("levelGrid");
    const progressBadgeElement = document.getElementById("progressBadge");

    const SHAPES = [
        {
            points: [
                [50, 6],
                [72, 12],
                [88, 28],
                [94, 50],
                [88, 72],
                [72, 88],
                [50, 94],
                [28, 88],
                [12, 72],
                [6, 50],
            ],
        },
        {
            points: [
                [50, 6],
                [76, 12],
                [91, 28],
                [94, 48],
                [91, 70],
                [76, 88],
                [50, 94],
                [24, 88],
                [9, 70],
                [6, 48],
            ],
        },
        {
            points: [
                [50, 6],
                [60, 20],
                [72, 34],
                [84, 49],
                [75, 65],
                [66, 80],
                [50, 94],
                [34, 80],
                [25, 65],
                [16, 49],
            ],
        },
        {
            points: [
                [50, 4],
                [67, 14],
                [82, 28],
                [92, 46],
                [86, 64],
                [72, 82],
                [50, 96],
                [28, 82],
                [14, 64],
                [8, 46],
            ],
        },
        {
            points: [
                [50, 6],
                [66, 12],
                [82, 25],
                [90, 42],
                [87, 62],
                [74, 80],
                [50, 94],
                [26, 80],
                [13, 62],
                [10, 42],
            ],
        },
        {
            points: [
                [50, 6],
                [68, 14],
                [84, 28],
                [90, 46],
                [84, 68],
                [72, 82],
                [50, 94],
                [28, 82],
                [16, 68],
                [10, 46],
            ],
        },
        {
            points: [
                [50, 5],
                [60, 20],
                [80, 20],
                [66, 36],
                [74, 56],
                [50, 46],
                [26, 56],
                [34, 36],
                [20, 20],
                [40, 20],
            ],
        },
        {
            points: [
                [50, 6],
                [68, 10],
                [84, 20],
                [92, 36],
                [90, 56],
                [80, 74],
                [62, 90],
                [38, 90],
                [20, 74],
                [10, 56],
            ],
        },
        {
            points: [
                [50, 6],
                [68, 11],
                [83, 22],
                [91, 38],
                [87, 56],
                [76, 72],
                [62, 87],
                [42, 93],
                [24, 86],
                [12, 70],
            ],
        },
        {
            points: [
                [50, 6],
                [62, 10],
                [76, 16],
                [90, 30],
                [92, 50],
                [86, 68],
                [74, 84],
                [50, 96],
                [26, 84],
                [14, 68],
            ],
        },
    ];

    function pointsToPath(points) {
        const [firstX, firstY] = points[0];
        const lines = points.slice(1).map(([x, y]) => `L ${x} ${y}`).join(" ");
        return `M ${firstX} ${firstY} ${lines} Z`;
    }

    function pointsToPolyline(points) {
        const closed = [...points, points[0]];
        return closed.map(([x, y]) => `${x},${y}`).join(" ");
    }

    function createStageNode(level, stage, highestUnlockedStage) {
        const stageIndex = Connect4Progression.toStageIndex(level, stage);
        const unlocked = stageIndex <= highestUnlockedStage;
        const isCurrent = stageIndex === highestUnlockedStage;
        const node = document.createElement(unlocked ? "a" : "div");
        node.className = "stage-node";
        node.textContent = String(stage);

        if (isCurrent) {
            node.classList.add("stage-node--current");
        } else if (unlocked) {
            node.classList.add("stage-node--unlocked");
        } else {
            node.classList.add("stage-node--locked");
        }

        if (unlocked && node.tagName === "A") {
            node.href = `connectfour.html?mode=one&level=${level}&stage=${stage}`;
            node.setAttribute("aria-label", `Level ${level} Stage ${stage}`);
        } else {
            node.setAttribute("aria-hidden", "true");
        }

        return node;
    }

    function createLevelCard(levelMeta, shape, highestUnlockedStage) {
        const level = levelMeta.level;
        const levelStartIndex = Connect4Progression.toStageIndex(level, 1);
        const levelUnlocked = highestUnlockedStage >= levelStartIndex;
        const unlockedCount = Connect4Progression.getLevelUnlockedCount(level, highestUnlockedStage);

        const card = document.createElement("article");
        card.className = "level-card";
        if (!levelUnlocked) {
            card.classList.add("level-card--locked");
        }

        const head = document.createElement("header");
        head.className = "level-card__head";

        const title = document.createElement("div");
        title.className = "level-card__title";
        title.innerHTML = `Level ${level}: ${levelMeta.name}<small>${levelMeta.summary}</small>`;

        const state = document.createElement("div");
        state.className = "level-card__state";
        state.textContent = `${unlockedCount}/10 Stages`;

        head.appendChild(title);
        head.appendChild(state);
        card.appendChild(head);

        const arena = document.createElement("div");
        arena.className = "shape-arena";

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "shape-path");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("aria-hidden", "true");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pointsToPath(shape.points));
        svg.appendChild(path);

        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline.setAttribute("points", pointsToPolyline(shape.points));
        svg.appendChild(polyline);

        arena.appendChild(svg);

        shape.points.forEach(([x, y], index) => {
            const stage = index + 1;
            const node = createStageNode(level, stage, highestUnlockedStage);
            node.style.setProperty("--x", String(x));
            node.style.setProperty("--y", String(y));
            arena.appendChild(node);
        });

        card.appendChild(arena);
        return card;
    }

    function render() {
        if (!levelGridElement || !progressBadgeElement) {
            return;
        }

        const highestUnlockedStage = Connect4Progression.loadProgress();
        progressBadgeElement.textContent = `${highestUnlockedStage} / ${Connect4Progression.TOTAL_STAGES}`;

        const meta = Connect4AI.getLevelMeta();
        levelGridElement.innerHTML = "";

        for (let i = 0; i < meta.length; i += 1) {
            const card = createLevelCard(meta[i], SHAPES[i], highestUnlockedStage);
            levelGridElement.appendChild(card);
        }
    }

    render();
})();
