const Connect4Economy = (() => {
    const STORAGE_KEY = "connect4_economy_v1";
    const DAILY_REWARDS = [50, 75, 100, 150, 200, 250, 400];

    function todayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function previousDayKey(dateKey) {
        const date = new Date(`${dateKey}T00:00:00`);
        date.setDate(date.getDate() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function clampNonNegative(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return 0;
        }
        return Math.floor(parsed);
    }

    function getDefaultData() {
        return {
            coins: 0,
            winStreak: 0,
            daily: {
                lastClaimDate: "",
                streakDay: 0,
            },
            stages: {},
            inventory: {
                pieceSkinIds: ["skin01"],
                effectCounts: {
                    undo: 0,
                    hint: 0,
                    threat_alert: 0,
                    safe_move: 0,
                },
            },
        };
    }

    function normalizeStageStats(raw) {
        const stats = raw && typeof raw === "object" ? raw : {};
        return {
            attempts: clampNonNegative(stats.attempts),
            wins: clampNonNegative(stats.wins),
            bestTimeMs: Number.isFinite(stats.bestTimeMs) ? Math.max(0, Math.floor(stats.bestTimeMs)) : null,
        };
    }

    function normalizeData(raw) {
        const base = getDefaultData();
        const data = raw && typeof raw === "object" ? raw : {};
        const normalizedStages = {};
        const rawStages = data.stages && typeof data.stages === "object" ? data.stages : {};
        Object.keys(rawStages).forEach((key) => {
            normalizedStages[key] = normalizeStageStats(rawStages[key]);
        });
        const rawSkinIds = Array.isArray(data.inventory?.pieceSkinIds) ? data.inventory.pieceSkinIds : ["skin01"];
        const safeSkinIds = rawSkinIds
            .map((id) => String(id || "").trim())
            .filter((id) => id.length > 0);
        if (!safeSkinIds.includes("skin01")) {
            safeSkinIds.unshift("skin01");
        }
        const rawEffectCounts = data.inventory?.effectCounts && typeof data.inventory.effectCounts === "object"
            ? data.inventory.effectCounts
            : {};
        const effectCounts = {
            undo: clampNonNegative(rawEffectCounts.undo),
            hint: clampNonNegative(rawEffectCounts.hint),
            threat_alert: clampNonNegative(rawEffectCounts.threat_alert),
            safe_move: clampNonNegative(rawEffectCounts.safe_move),
        };

        return {
            coins: clampNonNegative(data.coins),
            winStreak: clampNonNegative(data.winStreak),
            daily: {
                lastClaimDate: typeof data.daily?.lastClaimDate === "string" ? data.daily.lastClaimDate : "",
                streakDay: Math.max(0, Math.min(7, clampNonNegative(data.daily?.streakDay))),
            },
            stages: normalizedStages,
            inventory: {
                pieceSkinIds: Array.from(new Set(safeSkinIds)),
                effectCounts,
            },
        };
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return getDefaultData();
            }
            return normalizeData(JSON.parse(raw));
        } catch (error) {
            return getDefaultData();
        }
    }

    function saveData(data) {
        const normalized = normalizeData(data);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch (error) {
            return normalized;
        }
        return normalized;
    }

    function stageKey(level, stage) {
        return `${level}-${stage}`;
    }

    function getStageStats(level, stage) {
        const data = loadData();
        return normalizeStageStats(data.stages[stageKey(level, stage)]);
    }

    function startStageAttempt(level, stage) {
        const data = loadData();
        const key = stageKey(level, stage);
        const stats = normalizeStageStats(data.stages[key]);
        stats.attempts += 1;
        data.stages[key] = stats;
        saveData(data);
        return stats;
    }

    function recordStageFailure() {
        const data = loadData();
        data.winStreak = 0;
        saveData(data);
    }

    function recordStageWin({ level, stage, durationMs, perfectGame, movesUsed }) {
        const data = loadData();
        const key = stageKey(level, stage);
        const stats = normalizeStageStats(data.stages[key]);
        const firstTryClear = stats.wins === 0 && stats.attempts === 1;
        const isReplay = stats.wins > 0;
        const rewardMultiplier = isReplay ? 0.5 : 1;
        const safeDuration = Math.max(0, Math.floor(Number(durationMs) || 0));
        const safeMoves = Math.max(0, Math.floor(Number(movesUsed) || 0));

        stats.wins += 1;
        if (stats.bestTimeMs === null || safeDuration < stats.bestTimeMs) {
            stats.bestTimeMs = safeDuration;
        }
        data.stages[key] = stats;
        data.winStreak += 1;

        const rewards = [];
        const applyReward = (label, baseCoins) => {
            const adjusted = Math.floor(baseCoins * rewardMultiplier);
            rewards.push({ label, coins: adjusted });
        };

        const baseCoins = 20 + level * 15 + stage * 5;
        applyReward("Stage Clear", baseCoins);

        if (firstTryClear) {
            applyReward("First Try Clear", 150);
        }
        if (data.winStreak > 0 && data.winStreak % 3 === 0) {
            applyReward("3 Win Streak", 250);
        }
        if (perfectGame) {
            applyReward("Perfect Game", 200);
        }
        if (safeDuration > 0 && safeDuration <= 45000) {
            applyReward("Fast Win", 100);
        }
        if (safeMoves > 0 && safeMoves < 10) {
            applyReward("Under 10 Moves", 40);
        }
        if (stage === 10) {
            applyReward("Boss Stage", 500);
        }

        const gained = rewards.reduce((sum, item) => sum + item.coins, 0);
        data.coins += gained;
        const saved = saveData(data);

        return {
            gained,
            rewards,
            coins: saved.coins,
            winStreak: saved.winStreak,
            firstTryClear,
            isReplay,
        };
    }

    function getCoins() {
        return loadData().coins;
    }

    function spendCoins(amount) {
        const safeAmount = clampNonNegative(amount);
        const data = loadData();
        if (safeAmount <= 0) {
            return {
                success: false,
                reason: "invalid_amount",
                coins: data.coins,
            };
        }
        if (data.coins < safeAmount) {
            return {
                success: false,
                reason: "insufficient_coins",
                coins: data.coins,
            };
        }
        data.coins -= safeAmount;
        const saved = saveData(data);
        return {
            success: true,
            coins: saved.coins,
            spent: safeAmount,
        };
    }

    function getOwnedPieceSkinIds() {
        const data = loadData();
        return data.inventory.pieceSkinIds.slice();
    }

    function isPieceSkinOwned(pieceSkinId) {
        const id = String(pieceSkinId || "").trim();
        if (!id) {
            return false;
        }
        const data = loadData();
        return data.inventory.pieceSkinIds.includes(id);
    }

    function unlockPieceSkin(pieceSkinId) {
        const id = String(pieceSkinId || "").trim();
        if (!id) {
            return {
                unlocked: false,
                reason: "invalid_skin",
                coins: getCoins(),
            };
        }
        const data = loadData();
        if (data.inventory.pieceSkinIds.includes(id)) {
            return {
                unlocked: false,
                reason: "already_owned",
                coins: data.coins,
            };
        }
        data.inventory.pieceSkinIds.push(id);
        const saved = saveData(data);
        return {
            unlocked: true,
            coins: saved.coins,
            owned: saved.inventory.pieceSkinIds.slice(),
        };
    }

    function purchasePieceSkin(pieceSkinId, price) {
        const id = String(pieceSkinId || "").trim();
        const safePrice = clampNonNegative(price);
        if (!id) {
            return {
                purchased: false,
                reason: "invalid_skin",
                coins: getCoins(),
            };
        }
        if (isPieceSkinOwned(id)) {
            return {
                purchased: false,
                reason: "already_owned",
                coins: getCoins(),
            };
        }
        if (safePrice === 0) {
            const unlocked = unlockPieceSkin(id);
            return {
                purchased: unlocked.unlocked,
                reason: unlocked.unlocked ? "ok" : unlocked.reason,
                coins: unlocked.coins,
            };
        }
        const spend = spendCoins(safePrice);
        if (!spend.success) {
            return {
                purchased: false,
                reason: spend.reason,
                coins: spend.coins,
            };
        }
        const unlocked = unlockPieceSkin(id);
        if (!unlocked.unlocked) {
            const data = loadData();
            data.coins += safePrice;
            const saved = saveData(data);
            return {
                purchased: false,
                reason: unlocked.reason,
                coins: saved.coins,
            };
        }
        return {
            purchased: true,
            reason: "ok",
            coins: unlocked.coins,
        };
    }

    function getEffectCounts() {
        const data = loadData();
        return {
            undo: data.inventory.effectCounts.undo,
            hint: data.inventory.effectCounts.hint,
            threat_alert: data.inventory.effectCounts.threat_alert,
            safe_move: data.inventory.effectCounts.safe_move,
        };
    }

    function getEffectCount(effectId) {
        const key = String(effectId || "").trim();
        const counts = getEffectCounts();
        return clampNonNegative(counts[key]);
    }

    function purchaseEffect(effectId, price, quantity = 1) {
        const key = String(effectId || "").trim();
        if (!["undo", "hint", "threat_alert", "safe_move"].includes(key)) {
            return {
                purchased: false,
                reason: "invalid_effect",
                coins: getCoins(),
            };
        }
        const qty = Math.max(1, clampNonNegative(quantity));
        const cost = clampNonNegative(price) * qty;
        if (cost > 0) {
            const spend = spendCoins(cost);
            if (!spend.success) {
                return {
                    purchased: false,
                    reason: spend.reason,
                    coins: spend.coins,
                };
            }
        }
        const data = loadData();
        data.inventory.effectCounts[key] += qty;
        const saved = saveData(data);
        return {
            purchased: true,
            coins: saved.coins,
            count: saved.inventory.effectCounts[key],
        };
    }

    function consumeEffect(effectId, quantity = 1) {
        const key = String(effectId || "").trim();
        if (!["undo", "hint", "threat_alert", "safe_move"].includes(key)) {
            return {
                consumed: false,
                reason: "invalid_effect",
                count: 0,
            };
        }
        const qty = Math.max(1, clampNonNegative(quantity));
        const data = loadData();
        const current = data.inventory.effectCounts[key];
        if (current < qty) {
            return {
                consumed: false,
                reason: "insufficient_count",
                count: current,
            };
        }
        data.inventory.effectCounts[key] -= qty;
        const saved = saveData(data);
        return {
            consumed: true,
            count: saved.inventory.effectCounts[key],
        };
    }

    function getDailyStatus() {
        const data = loadData();
        const today = todayKey();
        const alreadyClaimed = data.daily.lastClaimDate === today;
        const nextDay = alreadyClaimed
            ? data.daily.streakDay
            : (data.daily.lastClaimDate === previousDayKey(today)
                ? ((data.daily.streakDay % 7) + 1 || 1)
                : 1);

        return {
            alreadyClaimed,
            streakDay: Math.max(1, nextDay),
            coinsToday: DAILY_REWARDS[Math.max(0, Math.min(6, nextDay - 1))],
            currentStreak: data.daily.streakDay,
        };
    }

    function claimDaily() {
        const data = loadData();
        const today = todayKey();
        if (data.daily.lastClaimDate === today) {
            return {
                claimed: false,
                reason: "already_claimed",
                coins: data.coins,
                streakDay: data.daily.streakDay,
                award: 0,
            };
        }

        const wasYesterday = data.daily.lastClaimDate === previousDayKey(today);
        const nextStreak = wasYesterday ? (data.daily.streakDay % 7) + 1 : 1;
        const award = DAILY_REWARDS[nextStreak - 1];
        data.daily.lastClaimDate = today;
        data.daily.streakDay = nextStreak;
        data.coins += award;

        const saved = saveData(data);
        return {
            claimed: true,
            award,
            coins: saved.coins,
            streakDay: saved.daily.streakDay,
        };
    }

    return {
        DAILY_REWARDS,
        getCoins,
        spendCoins,
        getStageStats,
        startStageAttempt,
        recordStageWin,
        recordStageFailure,
        getOwnedPieceSkinIds,
        isPieceSkinOwned,
        unlockPieceSkin,
        purchasePieceSkin,
        getEffectCounts,
        getEffectCount,
        purchaseEffect,
        consumeEffect,
        getDailyStatus,
        claimDaily,
        loadData,
    };
})();
