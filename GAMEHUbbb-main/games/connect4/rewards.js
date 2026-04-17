(() => {
    const claimBoxButton = document.getElementById("claimBoxBtn");
    const claimTodayValue = document.getElementById("claimTodayValue");
    const claimResult = document.getElementById("claimResult");
    const coinBalance = document.getElementById("coinBalance");
    const streakMeta = document.getElementById("streakMeta");
    const progressMeta = document.getElementById("progressMeta");
    const themeMeta = document.getElementById("themeMeta");

    if (
        !claimBoxButton ||
        !claimTodayValue ||
        !claimResult ||
        !coinBalance ||
        !streakMeta ||
        !progressMeta ||
        !themeMeta ||
        typeof Connect4Economy === "undefined"
    ) {
        return;
    }

    function formatCoins(value) {
        return `${Number(value || 0).toLocaleString()} Coins`;
    }

    function refreshMeta() {
        const coinCount = Connect4Economy.getCoins();
        coinBalance.textContent = formatCoins(coinCount);

        const daily = Connect4Economy.getDailyStatus();
        claimTodayValue.textContent = `+${daily.coinsToday}`;
        streakMeta.textContent = `Streak: Day ${daily.alreadyClaimed ? daily.currentStreak || 1 : daily.streakDay}`;

        claimBoxButton.disabled = daily.alreadyClaimed;
        claimResult.textContent = daily.alreadyClaimed
            ? "Daily claim completed. Come back tomorrow."
            : "Claim now to keep your streak alive.";

        if (typeof Connect4Progression !== "undefined") {
            const highest = Connect4Progression.loadProgress();
            const stage = Connect4Progression.fromStageIndex(highest);
            progressMeta.textContent = `Reached: Level ${stage.level} Stage ${stage.stage}`;

            if (typeof Connect4Themes !== "undefined") {
                const unlocked = Connect4Themes.getUnlockedBackgroundCount(highest);
                const total = Connect4Themes.getBackgroundThemes().length;
                themeMeta.textContent = `Backgrounds: ${unlocked}/${total}`;
            }
        }
    }

    function handleClaim() {
        const result = Connect4Economy.claimDaily();
        if (!result.claimed) {
            refreshMeta();
            return;
        }
        claimResult.textContent = `Claimed +${result.award} coins. Wallet updated.`;
        refreshMeta();
    }

    claimBoxButton.addEventListener("click", handleClaim);
    refreshMeta();
})();
