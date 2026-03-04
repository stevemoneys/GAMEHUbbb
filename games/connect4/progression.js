const Connect4Progression = (() => {
    const LEVEL_COUNT = 10;
    const STAGES_PER_LEVEL = 10;
    const TOTAL_STAGES = LEVEL_COUNT * STAGES_PER_LEVEL;
    const STORAGE_KEY = "connect4_progress_v1";

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function toStageIndex(level, stage) {
        const safeLevel = clamp(Number(level) || 1, 1, LEVEL_COUNT);
        const safeStage = clamp(Number(stage) || 1, 1, STAGES_PER_LEVEL);
        return (safeLevel - 1) * STAGES_PER_LEVEL + safeStage;
    }

    function fromStageIndex(index) {
        const safeIndex = clamp(Number(index) || 1, 1, TOTAL_STAGES);
        const level = Math.floor((safeIndex - 1) / STAGES_PER_LEVEL) + 1;
        const stage = ((safeIndex - 1) % STAGES_PER_LEVEL) + 1;
        return { level, stage };
    }

    function loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return 1;
            }
            const parsed = Number.parseInt(raw, 10);
            if (Number.isNaN(parsed)) {
                return 1;
            }
            return clamp(parsed, 1, TOTAL_STAGES);
        } catch (error) {
            return 1;
        }
    }

    function saveProgress(highestUnlockedStageIndex) {
        const safeValue = clamp(Number(highestUnlockedStageIndex) || 1, 1, TOTAL_STAGES);
        try {
            localStorage.setItem(STORAGE_KEY, String(safeValue));
        } catch (error) {
            return safeValue;
        }
        return safeValue;
    }

    function isUnlocked(level, stage, highestUnlockedStageIndex = loadProgress()) {
        return toStageIndex(level, stage) <= highestUnlockedStageIndex;
    }

    function unlockNext(level, stage) {
        const currentHighest = loadProgress();
        const currentStageIndex = toStageIndex(level, stage);

        if (currentStageIndex !== currentHighest) {
            return currentHighest;
        }

        if (currentHighest >= TOTAL_STAGES) {
            return currentHighest;
        }

        return saveProgress(currentHighest + 1);
    }

    function getLevelUnlockedCount(level, highestUnlockedStageIndex = loadProgress()) {
        const safeLevel = clamp(Number(level) || 1, 1, LEVEL_COUNT);
        const levelStartIndex = (safeLevel - 1) * STAGES_PER_LEVEL + 1;
        const levelEndIndex = levelStartIndex + STAGES_PER_LEVEL - 1;
        const unlockedEnd = Math.min(levelEndIndex, highestUnlockedStageIndex);
        return Math.max(0, unlockedEnd - levelStartIndex + 1);
    }

    return {
        LEVEL_COUNT,
        STAGES_PER_LEVEL,
        TOTAL_STAGES,
        toStageIndex,
        fromStageIndex,
        loadProgress,
        saveProgress,
        isUnlocked,
        unlockNext,
        getLevelUnlockedCount,
    };
})();
