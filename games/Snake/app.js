"use strict";

(function (global) {
  const {
    LEVEL_COUNT,
    LEVELS,
    MAZE_LAYOUTS,
    DIRS,
    rand,
    randItem,
    clamp,
    formatMs,
    formatSeconds,
    deepClone,
    loadProgress,
    saveProgress
  } = global.SnakeShared;

  const {
    RARITY_META,
    SKIN_LIST,
    THEME_LIST,
    getSkinById,
    getThemeById,
    getSkinPerkTotals,
    describeModifiers,
    formatUnlockCondition,
    drawSkinSegment,
    renderSkinPreview,
    buildThemePreviewStyle
  } = global.SnakeCosmetics;

  const {
    UPGRADE_DEFS,
    WHEEL_SEGMENTS,
    DAILY_CHALLENGES,
    ACHIEVEMENTS,
    getLocalDateString,
    diffCalendarDays,
    getStreakMultiplier,
    getTimeUntilNextDay,
    formatCountdown,
    getSkinShopPrice,
    getThemeShopPrice,
    getUpgradeLevelValue
  } = global.SnakeProgression;

  class MenuBackgroundAnimator {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.snakes = [];
      this.particles = [];
      this.last = 0;
      this.running = false;
      this.init();
    }

    init() {
      this.resize();
      this.snakes = [];
      for (let i = 0; i < 6; i += 1) {
        const segments = [];
        const sx = rand(40, this.canvas.width - 40);
        const sy = rand(40, this.canvas.height - 40);
        for (let s = 0; s < 16; s += 1) segments.push({ x: sx - s * 8, y: sy });
        this.snakes.push({
          segments,
          dir: randItem(["up", "down", "left", "right"]),
          colorHue: rand(0, 360),
          turnTimer: rand(20, 70)
        });
      }
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    start() {
      if (this.running) return;
      this.running = true;
      requestAnimationFrame((t) => this.loop(t));
    }

    loop(ts) {
      if (!this.running) return;
      if (!this.last) this.last = ts;
      const dt = Math.min(0.05, (ts - this.last) / 1000);
      this.last = ts;
      this.update(dt);
      this.draw(ts);
      requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
      for (const snake of this.snakes) {
        snake.turnTimer -= 1;
        if (snake.turnTimer <= 0) {
          snake.dir = randItem(["up", "down", "left", "right"]);
          snake.turnTimer = rand(25, 85);
        }

        const d = DIRS[snake.dir];
        const head = snake.segments[0];
        let nx = head.x + d.x * 80 * dt;
        let ny = head.y + d.y * 80 * dt;

        if (nx < 16 || nx > this.canvas.width - 16) {
          snake.dir = snake.dir === "left" ? "right" : snake.dir === "right" ? "left" : snake.dir;
          nx = clamp(nx, 16, this.canvas.width - 16);
        }
        if (ny < 16 || ny > this.canvas.height - 16) {
          snake.dir = snake.dir === "up" ? "down" : snake.dir === "down" ? "up" : snake.dir;
          ny = clamp(ny, 16, this.canvas.height - 16);
        }

        snake.segments.unshift({ x: nx, y: ny });
        snake.segments.pop();

        if (Math.random() < 0.2) {
          this.particles.push({
            x: nx,
            y: ny,
            vx: rand(-22, 22),
            vy: rand(-22, 22),
            life: 0.55,
            hue: snake.colorHue
          });
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    draw(ts) {
      const ctx = this.ctx;
      ctx.fillStyle = "#090916";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const g = ctx.createRadialGradient(this.canvas.width * 0.5, this.canvas.height * 0.45, 40, this.canvas.width * 0.5, this.canvas.height * 0.45, this.canvas.width * 0.65);
      g.addColorStop(0, "rgba(0,243,255,0.08)");
      g.addColorStop(1, "rgba(255,0,255,0.02)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      for (const snake of this.snakes) {
        for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
          const seg = snake.segments[i];
          const a = Math.max(0.08, 0.35 - i * 0.015);
          ctx.fillStyle = `hsla(${snake.colorHue},95%,62%,${a})`;
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 5 + Math.max(0, 4 - i * 0.2), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const p of this.particles) {
        ctx.fillStyle = `hsla(${p.hue},96%,65%,${Math.max(0, p.life / 0.55)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      const lineAlpha = 0.05 + 0.03 * Math.sin(ts * 0.0015);
      ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
      for (let x = 0; x <= this.canvas.width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= this.canvas.height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width, y);
        ctx.stroke();
      }
    }
  }

  const app = {
    levels: LEVELS,
    progress: loadProgress(),
    selectedLevelId: null,
    currentConfig: null,
    returnScreenAfterGame: "home",
    collectionTab: "skins",
    shopTab: "skins",
    wheelAngle: 0,
    wheelSpinTimer: 0,
    wheelAnimating: false,
    engine: null,
    bg: null,
    toastTimer: null,
    homePreviewRaf: 0,
    clockTimer: 0,
    lastCombo: 0,
    activeRun: null,
    audioCtx: null,

    init() {
      this.normalizeProgress();
      this.cacheDom();
      this.setupBackground();
      this.setupEngine();
      this.bindUi();
      this.applySettingsToUi();
      this.syncDailySystems();
      const startupAchievements = this.checkAchievements("daily_sync");
      this.applyTheme(this.progress.equippedTheme);
      this.renderAll();
      saveProgress(this.progress);
      if (startupAchievements.length) {
        this.persistProgress();
        this.announceAchievements(startupAchievements);
      }
      this.startHomePreviewLoop();
      this.startHomeClockLoop();
      this.switchScreen("home");
      window.addEventListener("beforeunload", () => saveProgress(this.progress));
    },

    normalizeProgress() {
      this.progress.completedLevels = Array.isArray(this.progress.completedLevels) ? this.progress.completedLevels : [];
      this.progress.unlockedSkins = Array.from(new Set(this.progress.unlockedSkins || ["classic_green"]));
      this.progress.unlockedThemes = Array.from(new Set(this.progress.unlockedThemes || ["neon_grid"]));
      this.progress.equippedSkinHistory = Array.from(new Set([...(this.progress.equippedSkinHistory || []), this.progress.equippedSkin || "classic_green"]));
      this.progress.completedDailyChallenges = Array.isArray(this.progress.completedDailyChallenges) ? this.progress.completedDailyChallenges : [];
      this.progress.achievementsEarned = Array.isArray(this.progress.achievementsEarned) ? this.progress.achievementsEarned : [];
      this.progress.streakData = {
        currentStreak: 1,
        lastPlayedDate: null,
        multiplier: 1,
        ...(this.progress.streakData || {})
      };
      this.progress.dailyChallenge = this.progress.dailyChallenge || null;
      this.progress.bonusWheel = {
        lastSpinDate: null,
        ...(this.progress.bonusWheel || {})
      };
      this.progress.upgrades = {
        speedDuration: 0,
        invincibleDuration: 0,
        magnetRadius: 0,
        permanentCoinBonus: 0,
        ...(this.progress.upgrades || {})
      };
      this.progress.settings = {
        sfx: true,
        ...(this.progress.settings || {})
      };
      this.progress.totalCoins = Number(this.progress.totalCoins || 0);
      this.progress.lifetimeCoinsEarned = Number(this.progress.lifetimeCoinsEarned || 0);
      this.progress.shopPurchases = Number(this.progress.shopPurchases || 0);
      this.progress.bestStreak = Number(this.progress.bestStreak || 1);
      if (!this.progress.unlockedSkins.includes(this.progress.equippedSkin)) this.progress.equippedSkin = this.progress.unlockedSkins[0] || "classic_green";
      if (!this.progress.unlockedThemes.includes(this.progress.equippedTheme)) this.progress.equippedTheme = this.progress.unlockedThemes[0] || "neon_grid";
    },

    cacheDom() {
      this.screens = {
        home: document.getElementById("homeScreen"),
        level: document.getElementById("levelScreen"),
        arcade: document.getElementById("arcadeScreen"),
        shop: document.getElementById("shopScreen"),
        profile: document.getElementById("profileScreen"),
        settings: document.getElementById("settingsScreen"),
        game: document.getElementById("gameScreen")
      };

      this.dom = {
        playBtn: document.getElementById("playBtn"),
        arcadeBtn: document.getElementById("arcadeBtn"),
        collectionBtn: document.getElementById("collectionBtn"),
        shopBtn: document.getElementById("shopBtn"),
        achievementsBtn: document.getElementById("achievementsBtn"),
        wheelBtn: document.getElementById("wheelBtn"),
        profileBtn: document.getElementById("profileBtn"),
        settingsBtn: document.getElementById("settingsBtn"),
        closeLevelBtn: document.getElementById("closeLevelBtn"),
        closeArcadeBtn: document.getElementById("closeArcadeBtn"),
        closeShopBtn: document.getElementById("closeShopBtn"),
        closeProfileBtn: document.getElementById("closeProfileBtn"),
        closeSettingsBtn: document.getElementById("closeSettingsBtn"),
        startLevelBtn: document.getElementById("startLevelBtn"),
        levelGrid: document.getElementById("levelGrid"),
        selectedLevelTitle: document.getElementById("selectedLevelTitle"),
        selectedLevelObjective: document.getElementById("selectedLevelObjective"),
        shopItems: document.getElementById("shopItems"),
        footerCoins: document.getElementById("footerCoins"),
        footerLevel: document.getElementById("footerLevel"),
        coinChip: document.getElementById("coinChip"),
        coinBalanceTop: document.getElementById("coinBalanceTop"),
        streakValue: document.getElementById("streakValue"),
        streakMult: document.getElementById("streakMult"),
        streakChip: document.getElementById("streakChip"),
        profileCoins: document.getElementById("profileCoins"),
        profileLevel: document.getElementById("profileLevel"),
        profileCompleted: document.getElementById("profileCompleted"),
        profilePlayTime: document.getElementById("profilePlayTime"),
        sfxToggle: document.getElementById("sfxToggle"),
        pauseBtn: document.getElementById("pauseBtn"),
        restartBtn: document.getElementById("restartBtn"),
        exitBtn: document.getElementById("exitBtn"),
        modeCards: Array.from(document.querySelectorAll(".mode-card")),
        gameEndOverlay: document.getElementById("gameEndOverlay"),
        endTitle: document.getElementById("endTitle"),
        endMessage: document.getElementById("endMessage"),
        finalScore: document.getElementById("finalScore"),
        finalHighScore: document.getElementById("finalHighScore"),
        finalCoins: document.getElementById("finalCoins"),
        returnHubBtn: document.getElementById("returnHubBtn"),
        homeSnakePreview: document.getElementById("homeSnakePreview"),
        homeEquippedSkin: document.getElementById("homeEquippedSkin"),
        homeEquippedPerk: document.getElementById("homeEquippedPerk"),
        homeEquippedTheme: document.getElementById("homeEquippedTheme"),
        homeCollectionCount: document.getElementById("homeCollectionCount"),
        dailyChallengeTitle: document.getElementById("dailyChallengeTitle"),
        dailyChallengeDesc: document.getElementById("dailyChallengeDesc"),
        dailyChallengeFill: document.getElementById("dailyChallengeFill"),
        dailyChallengeProgress: document.getElementById("dailyChallengeProgress"),
        dailyChallengeReward: document.getElementById("dailyChallengeReward"),
        dailyChallengeBadge: document.getElementById("dailyChallengeBadge"),
        dailyChallengeReset: document.getElementById("dailyChallengeReset"),
        wheelStatusTitle: document.getElementById("wheelStatusTitle"),
        wheelStatusCopy: document.getElementById("wheelStatusCopy"),
        wheelCountdown: document.getElementById("wheelCountdown"),
        collectionModal: document.getElementById("collectionModal"),
        collectionBackdrop: document.getElementById("collectionBackdrop"),
        collectionPanel: document.querySelector("#collectionModal .collection-panel"),
        closeCollectionBtn: document.getElementById("closeCollectionBtn"),
        collectionGrid: document.getElementById("collectionGrid"),
        collectionSkinCount: document.getElementById("collectionSkinCount"),
        collectionThemeCount: document.getElementById("collectionThemeCount"),
        collectionBadgeCount: document.getElementById("collectionBadgeCount"),
        collectionEquippedName: document.getElementById("collectionEquippedName"),
        skinsTabBtn: document.getElementById("skinsTabBtn"),
        themesTabBtn: document.getElementById("themesTabBtn"),
        badgesTabBtn: document.getElementById("badgesTabBtn"),
        achievementsTabBtn: document.getElementById("achievementsTabBtn"),
        shopModal: document.getElementById("shopModal"),
        shopBackdrop: document.getElementById("shopBackdrop"),
        shopPanel: document.querySelector("#shopModal .shop-panel"),
        closeShopModalBtn: document.getElementById("closeShopModalBtn"),
        shopGrid: document.getElementById("shopGrid"),
        shopCoinBalance: document.getElementById("shopCoinBalance"),
        shopSkinOwnedCount: document.getElementById("shopSkinOwnedCount"),
        shopThemeOwnedCount: document.getElementById("shopThemeOwnedCount"),
        shopUpgradeCount: document.getElementById("shopUpgradeCount"),
        shopSkinsTabBtn: document.getElementById("shopSkinsTabBtn"),
        shopThemesTabBtn: document.getElementById("shopThemesTabBtn"),
        shopUpgradesTabBtn: document.getElementById("shopUpgradesTabBtn"),
        wheelModal: document.getElementById("wheelModal"),
        wheelBackdrop: document.getElementById("wheelBackdrop"),
        closeWheelBtn: document.getElementById("closeWheelBtn"),
        wheelCanvas: document.getElementById("wheelCanvas"),
        spinWheelBtn: document.getElementById("spinWheelBtn"),
        wheelResultText: document.getElementById("wheelResultText"),
        wheelModalStatus: document.getElementById("wheelModalStatus"),
        wheelModalReset: document.getElementById("wheelModalReset"),
        runCoinInfo: document.getElementById("runCoinInfo"),
        fxLayer: document.getElementById("fxLayer")
      };

      this.gameUi = {
        score: document.getElementById("score"),
        length: document.getElementById("length"),
        highScore: document.getElementById("highScore"),
        comboBox: document.getElementById("comboBox"),
        comboValue: document.getElementById("comboValue"),
        feverFill: document.getElementById("feverFill"),
        feverTime: document.getElementById("feverTime"),
        objectiveText: document.getElementById("objectiveText"),
        powerHud: document.getElementById("powerHud"),
        powerRing: document.getElementById("powerRing"),
        powerIcon: document.getElementById("powerIcon"),
        powerName: document.getElementById("powerName"),
        powerTimer: document.getElementById("powerTimer"),
        powerIncoming: document.getElementById("powerIncoming")
      };
    },

    setupBackground() {
      const bgCanvas = document.getElementById("menuBgCanvas");
      this.bg = new MenuBackgroundAnimator(bgCanvas);
      this.bg.start();
      window.addEventListener("resize", () => this.bg.resize());
    },

    setupEngine() {
      this.engine = new global.SnakeEngine({
        canvas: document.getElementById("gameCanvas"),
        ui: {
          getHighScore: () => this.progress.highScore || 0,
          getEquippedSkin: () => this.getEquippedSkin(),
          getArenaTheme: () => this.getEquippedTheme(),
          getArenaColor: () => this.getEquippedTheme().styles.background,
          sfxEnabled: () => !!this.progress.settings.sfx,
          onPauseChanged: (paused) => {
            this.dom.pauseBtn.textContent = paused ? "RESUME" : "PAUSE";
          },
          onGameStart: (config) => {
            this.dom.gameEndOverlay.classList.remove("show");
            this.dom.pauseBtn.textContent = "PAUSE";
            this.gameUi.objectiveText.textContent = this.getObjectiveText(config, null);
            this.lastCombo = 0;
            this.activeRun = this.createRunTracker(config);
            this.updateRunCoinInfo();
          },
          onGameEvent: (event) => this.handleGameEvent(event),
          updateHUD: (state, config) => this.updateGameHud(state, config),
          showEndOverlay: (result, onReturn) => this.showEndOverlay(result, onReturn),
          isEndOverlayOpen: () => this.dom.gameEndOverlay.classList.contains("show")
        },
        onEnd: (result) => this.handleGameEnd(result),
        onStat: ({ playMs }) => {
          this.progress.totalPlayMs += playMs;
        }
      });
    },

    bindUi() {
      this.dom.playBtn.addEventListener("click", () => {
        this.returnScreenAfterGame = "level";
        this.switchScreen("level");
      });
      this.dom.arcadeBtn.addEventListener("click", () => {
        this.returnScreenAfterGame = "home";
        this.switchScreen("arcade");
      });
      this.dom.collectionBtn.addEventListener("click", () => this.openCollection("skins"));
      this.dom.achievementsBtn.addEventListener("click", () => this.openCollection("achievements"));
      this.dom.shopBtn.addEventListener("click", () => this.openShop("skins"));
      this.dom.wheelBtn.addEventListener("click", () => this.openWheel());
      this.dom.profileBtn.addEventListener("click", () => {
        this.updateProfilePanel();
        this.switchScreen("profile");
      });
      this.dom.settingsBtn.addEventListener("click", () => this.switchScreen("settings"));
      this.dom.closeLevelBtn.addEventListener("click", () => this.switchScreen("home"));
      this.dom.closeArcadeBtn.addEventListener("click", () => this.switchScreen("home"));
      this.dom.closeShopBtn.addEventListener("click", () => this.switchScreen("home"));
      this.dom.closeProfileBtn.addEventListener("click", () => this.switchScreen("home"));
      this.dom.closeSettingsBtn.addEventListener("click", () => this.switchScreen("home"));
      this.dom.startLevelBtn.addEventListener("click", () => this.startSelectedLevel());
      this.dom.modeCards.forEach((card) => card.addEventListener("click", () => this.startArcadeMode(card.dataset.mode)));
      this.dom.pauseBtn.addEventListener("click", () => this.engine.togglePause());
      this.dom.restartBtn.addEventListener("click", () => this.engine.restart());
      this.dom.exitBtn.addEventListener("click", () => {
        this.engine.stop();
        this.persistProgress();
        this.returnFromGame();
      });
      this.dom.sfxToggle.addEventListener("change", () => {
        this.progress.settings.sfx = !!this.dom.sfxToggle.checked;
        this.persistProgress();
      });
      this.dom.levelGrid.addEventListener("click", (event) => this.handleLevelGridClick(event));
      this.dom.collectionBackdrop.addEventListener("click", () => this.closeCollection());
      this.dom.closeCollectionBtn.addEventListener("click", () => this.closeCollection());
      this.dom.skinsTabBtn.addEventListener("click", () => this.setCollectionTab("skins"));
      this.dom.themesTabBtn.addEventListener("click", () => this.setCollectionTab("themes"));
      this.dom.badgesTabBtn.addEventListener("click", () => this.setCollectionTab("badges"));
      this.dom.achievementsTabBtn.addEventListener("click", () => this.setCollectionTab("achievements"));
      this.dom.collectionGrid.addEventListener("click", (event) => this.handleCollectionClick(event));
      this.dom.shopBackdrop.addEventListener("click", () => this.closeShop());
      this.dom.closeShopModalBtn.addEventListener("click", () => this.closeShop());
      this.dom.shopSkinsTabBtn.addEventListener("click", () => this.setShopTab("skins"));
      this.dom.shopThemesTabBtn.addEventListener("click", () => this.setShopTab("themes"));
      this.dom.shopUpgradesTabBtn.addEventListener("click", () => this.setShopTab("upgrades"));
      this.dom.shopGrid.addEventListener("click", (event) => this.handleShopGridClick(event));
      this.dom.wheelBackdrop.addEventListener("click", () => this.closeWheel());
      this.dom.closeWheelBtn.addEventListener("click", () => this.closeWheel());
      this.dom.spinWheelBtn.addEventListener("click", () => this.spinWheel());

      window.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (this.dom.wheelModal.classList.contains("open")) this.closeWheel();
        else if (this.dom.shopModal.classList.contains("open")) this.closeShop();
        else if (this.dom.collectionModal.classList.contains("open")) this.closeCollection();
      });
    },

    applySettingsToUi() {
      this.dom.sfxToggle.checked = !!this.progress.settings.sfx;
    },

    persistProgress() {
      saveProgress(this.progress);
      this.updateHomeStats();
      this.updateProfilePanel();
      this.updateHomeShowcase();
      this.updateStreakUi();
      this.updateDailyChallengeUi();
      this.updateWheelUi();
      this.renderCollection();
      this.renderShop();
    },

    syncDailySystems() {
      const today = getLocalDateString();
      const streak = this.progress.streakData || {};
      const diff = diffCalendarDays(streak.lastPlayedDate, today);

      if (!streak.lastPlayedDate) {
        streak.currentStreak = 1;
        streak.lastPlayedDate = today;
      } else if (diff === 1) {
        streak.currentStreak = Math.min(7, (streak.currentStreak || 1) + 1);
        streak.lastPlayedDate = today;
      } else if (diff !== 0) {
        streak.currentStreak = 1;
        streak.lastPlayedDate = today;
      }

      streak.multiplier = getStreakMultiplier(streak.currentStreak || 1);
      this.progress.streakData = streak;
      this.progress.bestStreak = Math.max(this.progress.bestStreak || 1, streak.currentStreak || 1);

      const currentChallenge = this.progress.dailyChallenge || {};
      if (currentChallenge.date !== today) {
        const pool = DAILY_CHALLENGES.filter((entry) => entry.id !== currentChallenge.id);
        const selected = pool.length ? randItem(pool) : DAILY_CHALLENGES[0];
        this.progress.dailyChallenge = {
          id: selected.id,
          description: selected.description,
          metric: selected.metric,
          target: selected.target,
          rewardCoins: selected.rewardCoins,
          currentProgress: 0,
          completed: false,
          date: today
        };
      }

      if (!Array.isArray(this.progress.completedDailyChallenges)) this.progress.completedDailyChallenges = [];
      if (!Array.isArray(this.progress.achievementsEarned)) this.progress.achievementsEarned = [];
    },

    renderAll() {
      this.applyTheme(this.progress.equippedTheme);
      this.updateHomeStats();
      this.updateProfilePanel();
      this.updateHomeShowcase();
      this.updateStreakUi();
      this.updateDailyChallengeUi();
      this.updateWheelUi();
      this.renderLevelGrid();
      this.renderCollection();
      this.renderShop();
      this.drawWheel();
    },

    updateHomeStats() {
      const coins = Math.round(this.progress.totalCoins || 0);
      this.dom.footerCoins.textContent = String(coins);
      this.dom.coinBalanceTop.textContent = coins.toLocaleString();
      this.dom.footerLevel.textContent = String(this.progress.highestLevelUnlocked || 1);
      this.dom.profileCoins.textContent = coins.toLocaleString();
      this.dom.profileLevel.textContent = String(this.progress.highestLevelUnlocked || 1);
      this.dom.profileCompleted.textContent = String((this.progress.completedLevels || []).length);
      this.dom.profilePlayTime.textContent = formatMs(this.progress.totalPlayMs || 0);
      this.dom.homeCollectionCount.textContent = `${this.progress.unlockedSkins.length}/${SKIN_LIST.length}`;
    },

    updateProfilePanel() {
      this.dom.profileCoins.textContent = Math.round(this.progress.totalCoins || 0).toLocaleString();
      this.dom.profileLevel.textContent = String(this.progress.highestLevelUnlocked || 1);
      this.dom.profileCompleted.textContent = String((this.progress.completedLevels || []).length);
      this.dom.profilePlayTime.textContent = formatMs(this.progress.totalPlayMs || 0);
    },

    updateStreakUi() {
      const streak = this.progress.streakData || { currentStreak: 1, multiplier: 1 };
      this.dom.streakValue.textContent = String(streak.currentStreak || 1);
      this.dom.streakMult.textContent = `x${(streak.multiplier || 1).toFixed(1)}`;
      this.dom.streakChip.classList.toggle("maxed", (streak.currentStreak || 1) >= 7);
    },

    updateDailyChallengeUi() {
      const challenge = this.progress.dailyChallenge;
      if (!challenge) return;
      const progress = Math.min(challenge.target || 1, challenge.currentProgress || 0);
      const pct = challenge.target ? Math.min(100, (progress / challenge.target) * 100) : 0;
      this.dom.dailyChallengeTitle.textContent = challenge.description;
      this.dom.dailyChallengeDesc.textContent = challenge.completed
        ? "Completed for today. Come back after reset for a new mission."
        : "Complete today's rotating mission for bonus coins and a collector badge.";
      this.dom.dailyChallengeFill.style.width = `${pct}%`;
      this.dom.dailyChallengeProgress.textContent = challenge.completed ? "Completed" : `${progress} / ${challenge.target}`;
      this.dom.dailyChallengeReward.textContent = `${challenge.rewardCoins} coins`;
      this.dom.dailyChallengeBadge.textContent = challenge.completed
        ? "Today's badge earned"
        : `Badge unlock: ${this.formatBadgeName(challenge.date)}`;
      this.dom.dailyChallengeReset.textContent = `Resets in ${formatCountdown(getTimeUntilNextDay())}`;
    },

    updateWheelUi() {
      const available = this.isWheelAvailable();
      const countdown = formatCountdown(getTimeUntilNextDay());
      this.dom.wheelStatusTitle.textContent = available ? "Free Spin Available" : "Spin Recharges Daily";
      this.dom.wheelStatusCopy.textContent = available
        ? "A premium reward is ready. Take your daily shot at the jackpot."
        : "Today's free spin is claimed. Come back after reset for the next one.";
      this.dom.wheelCountdown.textContent = available ? "Ready now" : `Next spin in ${countdown}`;
      this.dom.wheelBtn.disabled = !available;
      this.dom.wheelModalStatus.textContent = available ? "Available" : "Claimed today";
      this.dom.wheelModalReset.textContent = countdown;
      this.dom.spinWheelBtn.disabled = !available || this.wheelAnimating;
    },

    startHomeClockLoop() {
      if (this.clockTimer) clearInterval(this.clockTimer);
      this.clockTimer = window.setInterval(() => {
        const today = getLocalDateString();
        if (this.progress.dailyChallenge?.date !== today) {
          this.syncDailySystems();
          this.persistProgress();
        } else {
          this.updateDailyChallengeUi();
          this.updateWheelUi();
        }
      }, 30000);
    },

    switchScreen(name) {
      Object.entries(this.screens).forEach(([key, el]) => {
        if (!el) return;
        if (key === name) el.classList.add("active");
        else el.classList.remove("active");
      });
    },

    isLevelUnlocked(levelId) {
      return levelId <= (this.progress.highestLevelUnlocked || 1);
    },

    isLevelCompleted(levelId) {
      return (this.progress.completedLevels || []).includes(levelId);
    },

    handleLevelGridClick(event) {
      const card = event.target.closest(".level-card");
      if (!card) return;
      const levelId = Number(card.dataset.levelId);
      if (!this.isLevelUnlocked(levelId)) return;
      this.selectLevel(levelId);
    },

    selectLevel(levelId) {
      this.selectedLevelId = levelId;
      this.dom.startLevelBtn.disabled = false;
      const level = this.levels[levelId - 1];
      this.dom.selectedLevelTitle.textContent = level.name;
      this.dom.selectedLevelObjective.textContent = `${level.objective} | Reward: ${level.rewardCoins} coins`;
      this.renderLevelGrid();
    },

    renderLevelGrid() {
      const grid = this.dom.levelGrid;
      grid.innerHTML = "";
      for (const level of this.levels) {
        const unlocked = this.isLevelUnlocked(level.id);
        const completed = this.isLevelCompleted(level.id);
        const selected = level.id === this.selectedLevelId;
        const card = document.createElement("button");
        card.type = "button";
        card.className = `level-card${unlocked ? "" : " locked"}${selected ? " selected" : ""}`;
        card.dataset.levelId = String(level.id);
        card.disabled = !unlocked;
        card.innerHTML = `
          <div class="level-id">${level.id}</div>
          <div class="level-flags">
            <span>${completed ? "&#x2B50;" : ""}</span>
            <span>${unlocked ? "" : "&#x1F512;"}</span>
          </div>
          <div class="level-mini">${level.mazeLayout ? "MAZE" : "OPEN"}</div>
        `;
        grid.appendChild(card);
      }

      if (!this.selectedLevelId || !this.isLevelUnlocked(this.selectedLevelId)) {
        this.selectedLevelId = null;
        this.dom.startLevelBtn.disabled = true;
        this.dom.selectedLevelTitle.textContent = "Select an unlocked level";
        this.dom.selectedLevelObjective.textContent = "Objective appears here.";
      }
    },

    buildAiTier(levelId) {
      if (levelId <= 30) return 1;
      if (levelId <= 80) return 2;
      if (levelId <= 120) return 3;
      return 4;
    },

    buildCampaignConfig(levelId) {
      const level = this.levels[levelId - 1];
      return {
        mode: "campaign",
        levelId: level.id,
        arcadeModeType: null,
        targetLength: level.targetLength,
        targetTime: level.targetTime,
        baseAISpeed: level.baseAISpeed,
        aiCount: level.aiCount,
        minAILength: level.minAILength,
        maxAILength: level.maxAILength,
        powerUpSpawnRate: level.powerUpSpawnRate,
        mazeLayout: level.mazeLayout ? deepClone(MAZE_LAYOUTS[level.mazeLayout]) : null,
        rewardCoins: level.rewardCoins,
        aiTier: this.buildAiTier(level.id),
        aiColors: ["#ff6600", "#aa66ff", "#ff3333", "#ffcc00", "#ff66cc"],
        boosters: this.progress.boosters,
        upgrades: this.getUpgradeProfile(),
        skinPerks: this.getGameplayProfile()
      };
    },

    buildArcadeConfig(mode) {
      const mazeKeys = Object.keys(MAZE_LAYOUTS);
      const highest = this.progress.highestLevelUnlocked || 1;
      const base = {
        mode: "arcade",
        levelId: null,
        arcadeModeType: mode,
        targetLength: null,
        targetTime: null,
        baseAISpeed: 1.0,
        aiCount: 4,
        minAILength: 5,
        maxAILength: 15,
        powerUpSpawnRate: 20000,
        mazeLayout: null,
        rewardCoins: 0,
        aiTier: this.buildAiTier(highest),
        aiColors: ["#ff6600", "#aa66ff", "#ff3333", "#ffcc00", "#ff66cc"],
        boosters: this.progress.boosters,
        upgrades: this.getUpgradeProfile(),
        skinPerks: this.getGameplayProfile()
      };

      if (mode === "TIME_ATTACK") return { ...base, targetTime: 60000, powerUpSpawnRate: 11000 };
      if (mode === "MAZE") return { ...base, mazeLayout: deepClone(MAZE_LAYOUTS[randItem(mazeKeys)]), aiCount: 5, baseAISpeed: 1.08, powerUpSpawnRate: 13000 };
      if (mode === "ZEN") return { ...base, aiCount: 0, minAILength: 0, maxAILength: 0, powerUpSpawnRate: 18000, aiTier: 1 };
      if (mode === "BOSS_RUSH") return { ...base, aiCount: 1, minAILength: 50, maxAILength: 60, baseAISpeed: 1.15, powerUpSpawnRate: 12000, aiTier: 4 };
      return base;
    },

    startSelectedLevel() {
      if (!this.selectedLevelId || !this.isLevelUnlocked(this.selectedLevelId)) return;
      this.startGame(this.buildCampaignConfig(this.selectedLevelId), "level");
    },

    startArcadeMode(mode) {
      this.startGame(this.buildArcadeConfig(mode), "home");
    },

    startGame(config, returnScreen) {
      this.currentConfig = config;
      this.returnScreenAfterGame = returnScreen;
      this.closeCollection(true);
      this.closeShop(true);
      this.closeWheel(true);
      this.switchScreen("game");
      this.engine.start(config);
    },

    returnFromGame() {
      this.activeRun = null;
      this.updateRunCoinInfo();
      this.updateHomeStats();
      this.updateHomeShowcase();
      if (this.returnScreenAfterGame === "level") {
        this.renderLevelGrid();
        this.switchScreen("level");
      } else {
        this.switchScreen("home");
      }
    },

    getObjectiveText(config, state) {
      if (config.mode === "campaign") {
        const current = state ? state.player.targetLength : 5;
        return `OBJECTIVE: Reach length ${config.targetLength} (${current}/${config.targetLength})`;
      }
      if (config.arcadeModeType === "TIME_ATTACK") {
        const remain = state && state.modeTimeLeft !== null ? formatSeconds(state.modeTimeLeft) : "60.0s";
        return `TIME ATTACK: ${remain} remaining`;
      }
      if (config.arcadeModeType === "MAZE") return "MAZE MODE: Navigate walls, collect food, and survive.";
      if (config.arcadeModeType === "ZEN") return "ZEN MODE: Relax, grow, and stay in rhythm.";
      if (config.arcadeModeType === "BOSS_RUSH") return "BOSS RUSH: Outgrow and consume the crowned boss.";
      return "CLASSIC MODE: Survive and build the highest score you can.";
    },

    updateGameHud(state, config) {
      this.gameUi.score.textContent = String(state.score);
      this.gameUi.length.textContent = String(state.player.targetLength);
      this.gameUi.highScore.textContent = String(Math.max(this.progress.highScore || 0, state.score));

      if (state.combo > this.lastCombo) {
        this.gameUi.comboBox.classList.remove("pop");
        void this.gameUi.comboBox.offsetWidth;
        this.gameUi.comboBox.classList.add("pop");
      }
      this.lastCombo = state.combo;

      this.gameUi.comboValue.textContent = `${state.combo}x`;
      this.gameUi.comboBox.classList.toggle("warning", state.comboState === "warning");
      this.gameUi.comboBox.classList.toggle("danger", state.comboState === "danger");
      this.gameUi.objectiveText.textContent = this.getObjectiveText(config, state);

      if (state.fever) {
        const remain = Math.max(0, state.feverEnd - performance.now());
        this.gameUi.feverFill.style.width = `${Math.max(0, Math.min(100, (remain / 8000) * 100)).toFixed(1)}%`;
        this.gameUi.feverTime.textContent = formatSeconds(remain);
      } else {
        this.gameUi.feverFill.style.width = "0%";
        this.gameUi.feverTime.textContent = "0.0s";
      }

      if (state.activePower) {
        const remain = Math.max(0, state.powerEnd - performance.now());
        this.gameUi.powerHud.classList.add("show");
        this.gameUi.powerRing.style.setProperty("--pct", String(Math.max(0, Math.min(1, remain / state.activePower.durationMs))));
        this.gameUi.powerRing.style.setProperty("--ring-color", state.activePower.color);
        this.gameUi.powerIcon.textContent = state.activePower.icon;
        this.gameUi.powerName.textContent = state.activePower.name;
        this.gameUi.powerTimer.textContent = formatSeconds(remain);
      } else {
        this.gameUi.powerHud.classList.remove("show");
      }

      if (state.powerIncoming && !state.powerCube) {
        this.gameUi.powerIncoming.textContent = "Power-up incoming!";
        this.gameUi.powerIncoming.classList.add("show");
      } else {
        this.gameUi.powerIncoming.classList.remove("show");
        this.gameUi.powerIncoming.textContent = "";
      }

      this.trackRunState(state, config);
      this.updateRunCoinInfo();
    },

    createRunTracker(config) {
      return {
        config,
        startedAt: performance.now(),
        maxLength: 5,
        maxScore: 0,
        maxCombo: 0,
        aiEaten: 0,
        foodEaten: 0,
        powerUpsCollected: 0,
        feverActivations: 0,
        uniquePowerUps: new Set(),
        timeAttackSurvivalMs: 0,
        zenSurvivalMs: 0,
        arcadeMaxLength: 0,
        mazeFoodEaten: 0,
        levelsWon: 0,
        campaignWinsWithoutPower: 0,
        bossWins: 0,
        dailyChallengeCompletedThisRun: false
      };
    },

    trackRunState(state, config) {
      if (!this.activeRun) return;
      const elapsed = performance.now() - this.activeRun.startedAt;
      this.activeRun.maxLength = Math.max(this.activeRun.maxLength, state.player.targetLength);
      this.activeRun.maxScore = Math.max(this.activeRun.maxScore, state.score);
      this.activeRun.maxCombo = Math.max(this.activeRun.maxCombo, state.combo);
      if (config.mode === "arcade") this.activeRun.arcadeMaxLength = Math.max(this.activeRun.arcadeMaxLength, state.player.targetLength);
      if (config.arcadeModeType === "TIME_ATTACK") this.activeRun.timeAttackSurvivalMs = Math.max(this.activeRun.timeAttackSurvivalMs, elapsed);
      if (config.arcadeModeType === "ZEN") this.activeRun.zenSurvivalMs = Math.max(this.activeRun.zenSurvivalMs, elapsed);
      if (config.arcadeModeType === "MAZE") this.activeRun.mazeFoodEaten = this.activeRun.foodEaten;
      this.syncChallengeProgress();
    },

    handleGameEvent(event) {
      if (!this.activeRun) return;
      if (event.type === "food_eaten") this.activeRun.foodEaten = event.count;
      if (event.type === "ai_eaten") this.activeRun.aiEaten = event.count;
      if (event.type === "power_up_collected") {
        this.activeRun.powerUpsCollected = event.count;
        this.activeRun.uniquePowerUps.add(event.powerId);
      }
      if (event.type === "fever_activated") this.activeRun.feverActivations = event.total;
      if (event.type === "combo_changed") this.activeRun.maxCombo = Math.max(this.activeRun.maxCombo, event.maxCombo || event.combo || 0);
      this.syncChallengeProgress();
    },

    syncChallengeProgress() {
      const challenge = this.progress.dailyChallenge;
      const run = this.activeRun;
      if (!challenge || !run || challenge.completed) return;

      let progress = 0;
      switch (challenge.metric) {
        case "maxLength": progress = run.maxLength; break;
        case "aiEaten": progress = run.aiEaten; break;
        case "powerUpsCollected": progress = run.powerUpsCollected; break;
        case "maxCombo": progress = run.maxCombo; break;
        case "timeAttackSurvivalMs": progress = run.timeAttackSurvivalMs; break;
        case "campaignWinsWithoutPower": progress = run.campaignWinsWithoutPower; break;
        case "mazeFoodEaten": progress = run.mazeFoodEaten; break;
        case "maxScore": progress = run.maxScore; break;
        case "feverActivations": progress = run.feverActivations; break;
        case "bossWins": progress = run.bossWins; break;
        case "foodEaten": progress = run.foodEaten; break;
        case "arcadeMaxLength": progress = run.arcadeMaxLength; break;
        case "zenSurvivalMs": progress = run.zenSurvivalMs; break;
        case "levelsWon": progress = run.levelsWon; break;
        case "uniquePowerUps": progress = run.uniquePowerUps.size; break;
        default: progress = challenge.currentProgress || 0; break;
      }

      this.progress.dailyChallenge.currentProgress = Math.max(this.progress.dailyChallenge.currentProgress || 0, Math.floor(progress));
      if (progress >= challenge.target) this.completeDailyChallenge();
      this.updateDailyChallengeUi();
    },

    completeDailyChallenge() {
      const challenge = this.progress.dailyChallenge;
      if (!challenge || challenge.completed) return;
      challenge.completed = true;
      challenge.currentProgress = challenge.target;
      if (!this.progress.completedDailyChallenges.includes(challenge.date)) {
        this.progress.completedDailyChallenges.push(challenge.date);
      }
      if (this.activeRun) this.activeRun.dailyChallengeCompletedThisRun = true;
      const awarded = this.grantCoins(challenge.rewardCoins, {
        reason: "Daily Challenge Complete",
        celebrate: true,
        accent: "#ffd166",
        applySkinBonus: false
      });
      this.notify(`DAILY CHALLENGE COMPLETE! +${awarded} coins`, { celebrate: true, accent: "#ffd166" });
      const achievementUnlocks = this.checkAchievements("challenge_complete");
      this.persistProgress();
      this.announceAchievements(achievementUnlocks);
    },

    computeGameCoins(result, isNewHighScore) {
      const skinBonus = this.getGameplayProfile().coinBonus || 0;
      const permanentBonus = this.getUpgradeProfile().permanentCoinBonus || 0;
      let baseCoins = Math.floor((result.score || 0) / 10);
      if (result.win) baseCoins += 50;
      if (!result.powerUpsUsed) baseCoins += 20;
      if (this.activeRun && this.activeRun.dailyChallengeCompletedThisRun) baseCoins += 100;
      if (isNewHighScore) baseCoins += 50;
      let total = Math.round(baseCoins * (1 + skinBonus + permanentBonus));
      total = Math.round(total * (this.progress.streakData?.multiplier || 1));
      return Math.min(10000, total);
    },

    grantCoins(baseAmount, options = {}) {
      const permanentBonus = options.applyPermanentBonus === false ? 0 : (this.getUpgradeProfile().permanentCoinBonus || 0);
      const streakMultiplier = options.applyStreak === false ? 1 : (this.progress.streakData?.multiplier || 1);
      const skinBonus = options.applySkinBonus ? (this.getGameplayProfile().coinBonus || 0) : 0;
      const total = Math.round(baseAmount * (1 + permanentBonus + skinBonus) * streakMultiplier);
      this.progress.totalCoins += total;
      this.progress.lifetimeCoinsEarned += total;
      this.bounceCoinChip();
      this.spawnCoinFloat(`+${total} \u{1FA99}`);
      this.playCoinSound();
      this.updateHomeStats();
      this.updateRunCoinInfo();
      return total;
    },

    handleGameEnd(result) {
      this.progress.gamesPlayed += 1;
      this.progress.totalAISnakesEaten += result.aiSnakesEaten || 0;
      this.progress.totalPowerUpsCollected += result.powerUpsCollected || 0;
      this.progress.totalFeverActivations += result.feverActivations || 0;
      this.progress.highestCombo = Math.max(this.progress.highestCombo || 0, result.maxCombo || 0);

      const previousHigh = this.progress.highScore || 0;
      const isNewHighScore = result.score > previousHigh;
      if (isNewHighScore) this.progress.highScore = result.score;

      if (result.config.arcadeModeType === "MAZE" && result.win) this.progress.mazeGamesCompleted += 1;
      if (result.config.arcadeModeType === "BOSS_RUSH" && result.win) this.progress.bossRushWins += 1;
      if (result.win && !result.powerUpsUsed) this.progress.winsWithoutPowerUps += 1;

      if (result.config.mode === "campaign") {
        const levelId = result.config.levelId;
        if (result.win) {
          if (!this.progress.completedLevels.includes(levelId)) this.progress.completedLevels.push(levelId);
          this.progress.highestLevelUnlocked = Math.max(this.progress.highestLevelUnlocked || 1, Math.min(LEVEL_COUNT, levelId + 1));
          if (this.activeRun) {
            this.activeRun.levelsWon += 1;
            if (!result.powerUpsUsed) this.activeRun.campaignWinsWithoutPower += 1;
          }
        }
      }

      if (result.config.arcadeModeType === "BOSS_RUSH" && result.win && this.activeRun) {
        this.activeRun.bossWins += 1;
      }

      this.syncChallengeProgress();
      const gameCoins = this.computeGameCoins(result, isNewHighScore);
      this.progress.totalCoins += gameCoins;
      this.progress.lifetimeCoinsEarned += gameCoins;
      this.dom.finalCoins.textContent = gameCoins.toLocaleString();
      this.bounceCoinChip();
      this.updateHomeStats();
      this.updateRunCoinInfo();
      this.spawnCoinFloat(`+${gameCoins} \u{1FA99}`);
      this.playCoinSound();

      const cosmeticUnlocks = [...this.checkSkinUnlocks(), ...this.checkThemeUnlocks()];
      const achievementUnlocks = this.checkAchievements("game_end");
      this.persistProgress();
      this.renderLevelGrid();
      this.renderCollection();
      this.renderShop();
      this.queueUnlockNotifications(cosmeticUnlocks);

      this.announceAchievements(achievementUnlocks);

      if (result.config.mode === "campaign") {
        const levelId = result.config.levelId;
        if (result.win) this.notify(`Level ${levelId} complete! +${gameCoins} coins`, { accent: "#7cfc00" });
        else this.notify(`Level ${levelId} failed. +${gameCoins} coins earned`, { accent: "#ffb86c" });
      } else {
        const modeName = result.config.arcadeModeType || "CLASSIC";
        this.notify(`${modeName} finished. +${gameCoins} coins`, { accent: "#60d9ff" });
      }
    },

    showEndOverlay(result, onReturn) {
      this.dom.endTitle.textContent = result.win ? "YOU WIN!" : "GAME OVER";
      this.dom.endMessage.textContent = result.reason;
      this.dom.finalScore.textContent = String(result.score);
      this.dom.finalHighScore.textContent = String(this.progress.highScore || 0);
      this.dom.gameEndOverlay.classList.add("show");

      const handler = () => {
        this.dom.returnHubBtn.removeEventListener("click", handler);
        this.dom.gameEndOverlay.classList.remove("show");
        onReturn();
        this.returnFromGame();
      };
      this.dom.returnHubBtn.addEventListener("click", handler);
    },

    getPlayerStats() {
      return {
        highestLevel: this.progress.highestLevelUnlocked || 1,
        highScore: this.progress.highScore || 0,
        totalCoins: this.progress.totalCoins || 0,
        gamesPlayed: this.progress.gamesPlayed || 0,
        totalAISnakesEaten: this.progress.totalAISnakesEaten || 0
      };
    },

    meetsUnlockCondition(condition) {
      const stats = this.getPlayerStats();
      if (!condition || condition.type === "start") return true;
      if (condition.type === "level") return stats.highestLevel >= condition.value;
      if (condition.type === "score") return stats.highScore >= condition.value;
      if (condition.type === "coins") return stats.totalCoins >= condition.value;
      if (condition.type === "games_played") return stats.gamesPlayed >= condition.value;
      if (condition.type === "ai_eaten") return stats.totalAISnakesEaten >= condition.value;
      return false;
    },

    unlockSkin(id) {
      if (!id || this.progress.unlockedSkins.includes(id)) return false;
      this.progress.unlockedSkins.push(id);
      return true;
    },

    checkSkinUnlocks() {
      const fresh = [];
      for (const skin of SKIN_LIST) {
        if (skin.exclusive) continue;
        if (this.progress.unlockedSkins.includes(skin.id)) continue;
        if (!this.meetsUnlockCondition(skin.unlockCondition)) continue;
        this.progress.unlockedSkins.push(skin.id);
        fresh.push({ type: "skin", item: skin });
      }
      return fresh;
    },

    checkThemeUnlocks() {
      const fresh = [];
      for (const theme of THEME_LIST) {
        if (this.progress.unlockedThemes.includes(theme.id)) continue;
        if (!this.meetsUnlockCondition(theme.unlockCondition)) continue;
        this.progress.unlockedThemes.push(theme.id);
        fresh.push({ type: "theme", item: theme });
      }
      return fresh;
    },

    queueUnlockNotifications(unlocks) {
      unlocks.forEach((entry, index) => {
        window.setTimeout(() => {
          const label = entry.type === "skin" ? `NEW SKIN UNLOCKED: ${entry.item.name}` : `NEW THEME UNLOCKED: ${entry.item.name}`;
          const accent = entry.type === "skin" ? (RARITY_META[entry.item.rarity]?.color || "#ffd166") : entry.item.styles.borderColor;
          this.notify(label, { celebrate: true, accent });
        }, index * 1350);
      });
    },

    gatherAchievementMetrics() {
      return {
        totalAISnakesEaten: this.progress.totalAISnakesEaten || 0,
        highestCombo: this.progress.highestCombo || 0,
        totalPowerUpsCollected: this.progress.totalPowerUpsCollected || 0,
        unlockedSkinCount: this.progress.unlockedSkins.length,
        unlockedThemeCount: this.progress.unlockedThemes.length,
        completedLevelCount: this.progress.completedLevels.length,
        totalFeverActivations: this.progress.totalFeverActivations || 0,
        lifetimeCoinsEarned: this.progress.lifetimeCoinsEarned || 0,
        bestStreak: this.progress.bestStreak || 1,
        mazeGamesCompleted: this.progress.mazeGamesCompleted || 0,
        bossRushWins: this.progress.bossRushWins || 0,
        winsWithoutPowerUps: this.progress.winsWithoutPowerUps || 0,
        shopPurchases: this.progress.shopPurchases || 0,
        maxedUpgradeCount: UPGRADE_DEFS.filter((def) => (this.progress.upgrades?.[def.id] || 0) >= 3).length,
        equippedSkinVariety: this.progress.equippedSkinHistory.length,
        allOtherAchievements: (this.progress.achievementsEarned || []).filter((id) => id !== "true_champion").length
      };
    },

    checkAchievements(trigger) {
      const earned = [];
      let changed = true;
      while (changed) {
        changed = false;
        const metrics = this.gatherAchievementMetrics();
        for (const achievement of ACHIEVEMENTS) {
          if (this.progress.achievementsEarned.includes(achievement.id)) continue;
          if ((metrics[achievement.metric] || 0) < achievement.target) continue;
          this.progress.achievementsEarned.push(achievement.id);
          const totalReward = this.grantCoins(achievement.rewardCoins, { celebrate: true, applySkinBonus: false });
          if (achievement.rewardSkinId) this.unlockSkin(achievement.rewardSkinId);
          earned.push({ ...achievement, totalReward, trigger });
          changed = true;
        }
      }
      return earned;
    },

    announceAchievements(unlocks) {
      unlocks.forEach((entry, index) => {
        window.setTimeout(() => {
          const bonus = entry.rewardSkinId ? " + exclusive skin" : "";
          this.notify(`ACHIEVEMENT UNLOCKED: ${entry.name} +${entry.totalReward} coins${bonus}`, {
            celebrate: true,
            accent: "#ffd166"
          });
        }, index * 1400);
      });
    },

    getEquippedSkin() {
      return getSkinById(this.progress.equippedSkin);
    },

    getEquippedTheme() {
      return getThemeById(this.progress.equippedTheme);
    },

    getGameplayProfile() {
      return getSkinPerkTotals(this.getEquippedSkin());
    },

    getUpgradeProfile() {
      const upgrades = this.progress.upgrades || {};
      return {
        speedDuration: getUpgradeLevelValue(UPGRADE_DEFS[0], upgrades.speedDuration || 0),
        invincibleDuration: getUpgradeLevelValue(UPGRADE_DEFS[1], upgrades.invincibleDuration || 0),
        magnetRadius: getUpgradeLevelValue(UPGRADE_DEFS[2], upgrades.magnetRadius || 0),
        permanentCoinBonus: getUpgradeLevelValue(UPGRADE_DEFS[3], upgrades.permanentCoinBonus || 0)
      };
    },

    updateHomeShowcase() {
      const skin = this.getEquippedSkin();
      const theme = this.getEquippedTheme();
      this.dom.homeEquippedSkin.textContent = skin.name;
      this.dom.homeEquippedPerk.textContent = skin.perkDescription || describeModifiers(skin.modifiers);
      this.dom.homeEquippedTheme.textContent = theme.name;
    },

    startHomePreviewLoop() {
      const render = (ts) => {
        this.renderHomePreview(ts);
        this.homePreviewRaf = requestAnimationFrame(render);
      };
      this.homePreviewRaf = requestAnimationFrame(render);
    },

    renderHomePreview(ts) {
      const canvas = this.dom.homeSnakePreview;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || canvas.width;
      const height = canvas.clientHeight || canvas.height;
      const theme = this.getEquippedTheme();
      const skin = this.getEquippedSkin();

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = theme.styles.background;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      for (let x = 0; x < width; x += 22) ctx.fillRect(x, 0, 1, height);
      for (let y = 0; y < height; y += 22) ctx.fillRect(0, y, width, 1);

      const size = 24;
      const points = [
        { x: 34, y: 52 },
        { x: 58, y: 52 },
        { x: 82, y: 52 },
        { x: 106, y: 52 },
        { x: 130, y: 64 },
        { x: 154, y: 76 }
      ];

      for (let i = points.length - 1; i >= 0; i -= 1) {
        drawSkinSegment(ctx, points[i].x, points[i].y, size, skin, i === 0, i, {
          direction: "right",
          ts
        });
      }
    },

    openCollection(tab = this.collectionTab) {
      this.collectionTab = tab;
      this.dom.collectionModal.classList.add("open");
      this.dom.collectionModal.setAttribute("aria-hidden", "false");
      this.renderCollection();
    },

    closeCollection(silent = false) {
      this.dom.collectionModal.classList.remove("open");
      this.dom.collectionModal.setAttribute("aria-hidden", "true");
      if (!silent) this.updateHomeShowcase();
    },

    setCollectionTab(tab) {
      this.collectionTab = tab;
      this.renderCollection();
    },

    handleCollectionClick(event) {
      const skinBtn = event.target.closest("button[data-equip-skin]");
      if (skinBtn) return this.equipSkin(skinBtn.dataset.equipSkin);
      const themeBtn = event.target.closest("button[data-equip-theme]");
      if (themeBtn) return this.equipTheme(themeBtn.dataset.equipTheme);
    },

    renderCollection() {
      this.dom.skinsTabBtn.classList.toggle("active", this.collectionTab === "skins");
      this.dom.themesTabBtn.classList.toggle("active", this.collectionTab === "themes");
      this.dom.badgesTabBtn.classList.toggle("active", this.collectionTab === "badges");
      this.dom.achievementsTabBtn.classList.toggle("active", this.collectionTab === "achievements");
      this.dom.collectionSkinCount.textContent = `${this.progress.unlockedSkins.length}/${SKIN_LIST.length}`;
      this.dom.collectionThemeCount.textContent = `${this.progress.unlockedThemes.length}/${THEME_LIST.length}`;
      this.dom.collectionBadgeCount.textContent = String((this.progress.completedDailyChallenges || []).length);
      this.dom.collectionEquippedName.textContent = this.collectionTab === "themes" ? this.getEquippedTheme().name : this.getEquippedSkin().name;
      if (this.collectionTab === "skins") this.dom.collectionGrid.innerHTML = this.renderSkinCards();
      else if (this.collectionTab === "themes") this.dom.collectionGrid.innerHTML = this.renderThemeCards();
      else if (this.collectionTab === "badges") this.dom.collectionGrid.innerHTML = this.renderBadgeCards();
      else this.dom.collectionGrid.innerHTML = this.renderAchievementCards();
      this.afterCollectionRender();
    },

    renderSkinCards() {
      return SKIN_LIST.map((skin) => {
        const unlocked = this.progress.unlockedSkins.includes(skin.id);
        const equipped = this.progress.equippedSkin === skin.id;
        const rarity = RARITY_META[skin.rarity] || RARITY_META.Common;
        return `
          <article class="collection-card ${skin.rarity === "Mythic" ? "mythic" : ""} ${unlocked ? "" : "locked"}" data-tilt-card>
            ${equipped ? '<span class="equipped-badge">EQUIPPED</span>' : ""}
            <div class="collection-card-top">
              <canvas width="88" height="88" data-skin-preview="${skin.id}"></canvas>
              <span class="rarity-pill" style="--rarity-color:${rarity.color}; color:${rarity.color};">${skin.rarity}</span>
            </div>
            <h3>${skin.name}</h3>
            <p class="collection-desc">${skin.perkDescription || describeModifiers(skin.modifiers)}</p>
            <p class="collection-meta-line">${describeModifiers(skin.modifiers)}</p>
            <p class="${unlocked ? "collection-meta-line" : "collection-lock"}">${unlocked ? "Unlocked and ready to equip." : `LOCKED: ${formatUnlockCondition(skin.unlockCondition)}`}</p>
            <div class="collection-card-actions">
              <button class="collection-action" data-equip-skin="${skin.id}" ${!unlocked || equipped ? "disabled" : ""}>${equipped ? "Equipped" : unlocked ? "Equip" : "Locked"}</button>
              ${unlocked ? "" : '<span class="lock-chip">&#x1F512;</span>'}
            </div>
          </article>
        `;
      }).join("");
    },

    renderThemeCards() {
      return THEME_LIST.map((theme) => {
        const unlocked = this.progress.unlockedThemes.includes(theme.id);
        const equipped = this.progress.equippedTheme === theme.id;
        const preview = buildThemePreviewStyle(theme);
        return `
          <article class="collection-card ${unlocked ? "" : "locked"}" data-tilt-card>
            ${equipped ? '<span class="equipped-badge">EQUIPPED</span>' : ""}
            <div class="theme-preview" style="background:${preview.background}; border-color:${preview.borderColor}; --preview-grid:${preview.gridColor};"></div>
            <h3>${theme.name}</h3>
            <p class="collection-desc">${theme.type === "image" ? "AI background slot ready. Live fallback palette active now." : "Live CSS arena theme with custom border and grid."}</p>
            <p class="collection-meta-line">Type: ${theme.type === "image" ? "Image Ready" : "CSS Live"}</p>
            <p class="${unlocked ? "collection-meta-line" : "collection-lock"}">${unlocked ? "Unlocked and ready to apply." : `LOCKED: ${formatUnlockCondition(theme.unlockCondition)}`}</p>
            <div class="collection-card-actions">
              <button class="collection-action" data-equip-theme="${theme.id}" ${!unlocked || equipped ? "disabled" : ""}>${equipped ? "Applied" : unlocked ? "Apply" : "Locked"}</button>
              ${unlocked ? "" : '<span class="lock-chip">&#x1F512;</span>'}
            </div>
          </article>
        `;
      }).join("");
    },

    renderBadgeCards() {
      const badges = [...(this.progress.completedDailyChallenges || [])].reverse();
      if (!badges.length) {
        return `<article class="collection-card"><h3>No badges yet</h3><p class="collection-desc">Complete daily challenges to earn date-stamped collector badges.</p></article>`;
      }
      return badges.map((date) => `
        <article class="collection-card" data-tilt-card>
          <div class="collection-card-top">
            <div class="lock-chip">&#x1F3C6;</div>
            <span class="rarity-pill" style="--rarity-color:#ffd166; color:#ffd166;">Daily</span>
          </div>
          <h3>${this.formatBadgeName(date)}</h3>
          <p class="collection-desc">Daily challenge conquered on ${date}.</p>
          <p class="collection-meta-line">Collector badge permanently saved.</p>
        </article>
      `).join("");
    },

    renderAchievementCards() {
      return ACHIEVEMENTS.map((achievement) => {
        const earned = this.progress.achievementsEarned.includes(achievement.id);
        return `
          <article class="collection-card ${earned ? "" : "locked"}" data-tilt-card>
            <div class="collection-card-top">
              <div class="lock-chip">${earned ? "&#x1F3C6;" : "&#x1F512;"}</div>
              <span class="rarity-pill" style="--rarity-color:${earned ? "#ffd166" : "#8c97aa"}; color:${earned ? "#ffd166" : "#8c97aa"};">${earned ? "Earned" : "Locked"}</span>
            </div>
            <h3>${achievement.name}</h3>
            <p class="collection-desc">${achievement.description}</p>
            <p class="collection-meta-line">Reward: ${achievement.rewardCoins.toLocaleString()} coins${achievement.rewardSkinId ? " + exclusive skin" : ""}</p>
          </article>
        `;
      }).join("");
    },

    afterCollectionRender() {
      this.dom.collectionGrid.querySelectorAll("[data-skin-preview]").forEach((canvas) => {
        renderSkinPreview(canvas, getSkinById(canvas.dataset.skinPreview));
      });
      this.bindTiltEffects(this.dom.collectionGrid);
    },

    openShop(tab = this.shopTab) {
      this.shopTab = tab;
      this.dom.shopModal.classList.add("open");
      this.dom.shopModal.setAttribute("aria-hidden", "false");
      this.renderShop();
    },

    closeShop(silent = false) {
      this.dom.shopModal.classList.remove("open");
      this.dom.shopModal.setAttribute("aria-hidden", "true");
      if (!silent) this.updateHomeStats();
    },

    setShopTab(tab) {
      this.shopTab = tab;
      this.renderShop();
    },

    handleShopGridClick(event) {
      const skinBtn = event.target.closest("button[data-buy-skin]");
      if (skinBtn) return this.buySkin(skinBtn.dataset.buySkin);
      const themeBtn = event.target.closest("button[data-buy-theme]");
      if (themeBtn) return this.buyTheme(themeBtn.dataset.buyTheme);
      const upgradeBtn = event.target.closest("button[data-buy-upgrade]");
      if (upgradeBtn) return this.buyUpgrade(upgradeBtn.dataset.buyUpgrade);
    },

    renderShop() {
      this.dom.shopCoinBalance.textContent = Math.round(this.progress.totalCoins || 0).toLocaleString();
      this.dom.shopSkinOwnedCount.textContent = String(this.progress.unlockedSkins.length);
      this.dom.shopThemeOwnedCount.textContent = String(this.progress.unlockedThemes.length);
      const ownedUpgradeLevels = UPGRADE_DEFS.reduce((sum, def) => sum + (this.progress.upgrades?.[def.id] || 0), 0);
      this.dom.shopUpgradeCount.textContent = `${ownedUpgradeLevels}/12`;
      this.dom.shopSkinsTabBtn.classList.toggle("active", this.shopTab === "skins");
      this.dom.shopThemesTabBtn.classList.toggle("active", this.shopTab === "themes");
      this.dom.shopUpgradesTabBtn.classList.toggle("active", this.shopTab === "upgrades");
      if (this.shopTab === "skins") this.dom.shopGrid.innerHTML = this.renderShopSkins();
      else if (this.shopTab === "themes") this.dom.shopGrid.innerHTML = this.renderShopThemes();
      else this.dom.shopGrid.innerHTML = this.renderShopUpgrades();
      this.afterShopRender();
    },

    renderShopSkins() {
      return SKIN_LIST.filter((skin) => !skin.exclusive).map((skin) => {
        const owned = this.progress.unlockedSkins.includes(skin.id);
        const price = getSkinShopPrice(skin);
        const insufficient = (this.progress.totalCoins || 0) < price;
        const disabled = owned || insufficient;
        const tooltip = owned ? "Already owned" : insufficient ? "Not enough coins" : `Buy for ${price} coins`;
        return `
          <article class="collection-card ${skin.rarity === "Mythic" ? "mythic" : ""}" data-tilt-card title="${tooltip}">
            <div class="collection-card-top">
              <canvas width="88" height="88" data-skin-preview="${skin.id}"></canvas>
              <span class="rarity-pill" style="--rarity-color:${RARITY_META[skin.rarity]?.color || "#fff"}; color:${RARITY_META[skin.rarity]?.color || "#fff"};">${skin.rarity}</span>
            </div>
            <h3>${skin.name}</h3>
            <p class="collection-desc">${skin.perkDescription || describeModifiers(skin.modifiers)}</p>
            <p class="collection-meta-line">Price: ${price.toLocaleString()} coins</p>
            <div class="collection-card-actions">
              <button class="collection-action" data-buy-skin="${skin.id}" title="${tooltip}" ${disabled ? "disabled" : ""}>${owned ? "OWNED" : "BUY"}</button>
              ${owned ? '<span class="lock-chip">&#x2714;</span>' : '<span class="lock-chip">&#x1FA99;</span>'}
            </div>
          </article>
        `;
      }).join("");
    },

    renderShopThemes() {
      return THEME_LIST.map((theme) => {
        const owned = this.progress.unlockedThemes.includes(theme.id);
        const price = getThemeShopPrice();
        const preview = buildThemePreviewStyle(theme);
        const insufficient = (this.progress.totalCoins || 0) < price;
        const disabled = owned || insufficient;
        const tooltip = owned ? "Already owned" : insufficient ? "Not enough coins" : `Buy for ${price} coins`;
        return `
          <article class="collection-card" data-tilt-card title="${tooltip}">
            <div class="theme-preview" style="background:${preview.background}; border-color:${preview.borderColor}; --preview-grid:${preview.gridColor};"></div>
            <h3>${theme.name}</h3>
            <p class="collection-desc">${theme.type === "image" ? "AI image slot included. Live palette active today." : "A polished CSS theme for your arena and menus."}</p>
            <p class="collection-meta-line">Price: ${price.toLocaleString()} coins</p>
            <div class="collection-card-actions">
              <button class="collection-action" data-buy-theme="${theme.id}" title="${tooltip}" ${disabled ? "disabled" : ""}>${owned ? "OWNED" : "BUY"}</button>
              ${owned ? '<span class="lock-chip">&#x2714;</span>' : '<span class="lock-chip">&#x1FA99;</span>'}
            </div>
          </article>
        `;
      }).join("");
    },

    renderShopUpgrades() {
      return UPGRADE_DEFS.map((def) => {
        const level = this.progress.upgrades?.[def.id] || 0;
        const next = def.levels[level] || null;
        const insufficient = !!next && (this.progress.totalCoins || 0) < next.cost;
        const disabled = !next || insufficient;
        const tooltip = !next ? "Max level reached" : insufficient ? "Not enough coins" : `Upgrade for ${next.cost} coins`;
        return `
          <article class="collection-card" data-tilt-card title="${tooltip}">
            <div class="collection-card-top">
              <div class="lock-chip">${def.icon}</div>
              <span class="rarity-pill" style="--rarity-color:#60d9ff; color:#60d9ff;">Level ${level}</span>
            </div>
            <h3>${def.name}</h3>
            <p class="collection-desc">${def.description}</p>
            <p class="collection-meta-line">${next ? `Next: ${next.label} for ${next.cost.toLocaleString()} coins` : "MAX LEVEL REACHED"}</p>
            <div class="collection-card-actions">
              <button class="collection-action" data-buy-upgrade="${def.id}" title="${tooltip}" ${disabled ? "disabled" : ""}>${next ? "UPGRADE" : "MAX"}</button>
              <span class="lock-chip">${next ? "L" + (level + 1) : "MAX"}</span>
            </div>
          </article>
        `;
      }).join("");
    },

    afterShopRender() {
      this.dom.shopGrid.querySelectorAll("[data-skin-preview]").forEach((canvas) => {
        renderSkinPreview(canvas, getSkinById(canvas.dataset.skinPreview));
      });
      this.bindTiltEffects(this.dom.shopGrid);
    },

    openWheel() {
      this.dom.wheelModal.classList.add("open");
      this.dom.wheelModal.setAttribute("aria-hidden", "false");
      this.dom.wheelResultText.textContent = this.isWheelAvailable()
        ? "Spin for your daily bonus."
        : "Today's wheel has been claimed. Come back after reset.";
      this.updateWheelUi();
      this.drawWheel();
    },

    closeWheel(silent = false) {
      this.dom.wheelModal.classList.remove("open");
      this.dom.wheelModal.setAttribute("aria-hidden", "true");
      if (!silent) this.updateWheelUi();
    },

    buySkin(id) {
      const skin = getSkinById(id);
      const price = getSkinShopPrice(skin);
      if ((this.progress.totalCoins || 0) < price) return this.notify("Not enough coins.", { accent: "#ff7b86" });
      if (this.progress.unlockedSkins.includes(id)) return;
      this.progress.totalCoins -= price;
      this.progress.shopPurchases += 1;
      this.progress.unlockedSkins.push(id);
      const achievementUnlocks = this.checkAchievements("shop_purchase");
      this.persistProgress();
      this.announceAchievements(achievementUnlocks);
      this.notify(`You unlocked ${skin.name}!`, { celebrate: true, accent: RARITY_META[skin.rarity]?.color });
    },

    buyTheme(id) {
      const theme = getThemeById(id);
      const price = getThemeShopPrice();
      if ((this.progress.totalCoins || 0) < price) return this.notify("Not enough coins.", { accent: "#ff7b86" });
      if (this.progress.unlockedThemes.includes(id)) return;
      this.progress.totalCoins -= price;
      this.progress.shopPurchases += 1;
      this.progress.unlockedThemes.push(id);
      const achievementUnlocks = this.checkAchievements("shop_purchase");
      this.persistProgress();
      this.announceAchievements(achievementUnlocks);
      this.notify(`You unlocked ${theme.name}!`, { celebrate: true, accent: theme.styles.borderColor });
    },

    buyUpgrade(id) {
      const def = UPGRADE_DEFS.find((entry) => entry.id === id);
      if (!def) return;
      const level = this.progress.upgrades?.[id] || 0;
      const next = def.levels[level];
      if (!next) return;
      if ((this.progress.totalCoins || 0) < next.cost) return this.notify("Not enough coins.", { accent: "#ff7b86" });
      this.progress.totalCoins -= next.cost;
      this.progress.shopPurchases += 1;
      this.progress.upgrades[id] = level + 1;
      const achievementUnlocks = this.checkAchievements("upgrade_purchase");
      this.persistProgress();
      this.announceAchievements(achievementUnlocks);
      this.notify(`${def.name} upgraded to Level ${level + 1}!`, { celebrate: true, accent: "#60d9ff" });
    },

    equipSkin(id) {
      if (!this.progress.unlockedSkins.includes(id) || this.progress.equippedSkin === id) return;
      const skin = getSkinById(id);
      this.progress.equippedSkin = id;
      if (!this.progress.equippedSkinHistory.includes(id)) this.progress.equippedSkinHistory.push(id);
      const achievementUnlocks = this.checkAchievements("equip_skin");
      this.playCollectionEquipAnimation();
      this.persistProgress();
      this.announceAchievements(achievementUnlocks);
      this.notify(`${skin.name} equipped.`, { accent: RARITY_META[skin.rarity]?.color });
    },

    equipTheme(id) {
      if (!this.progress.unlockedThemes.includes(id) || this.progress.equippedTheme === id) return;
      const theme = getThemeById(id);
      this.progress.equippedTheme = id;
      this.playCollectionEquipAnimation();
      this.applyTheme(id);
      this.persistProgress();
      this.notify(`${theme.name} applied.`, { accent: theme.styles.borderColor });
    },

    playCollectionEquipAnimation() {
      const panel = this.dom.collectionPanel;
      if (!panel) return;
      panel.classList.remove("equipping");
      void panel.offsetWidth;
      panel.classList.add("equipping");
      window.setTimeout(() => panel.classList.remove("equipping"), 420);
    },

    applyTheme(themeId) {
      const theme = getThemeById(themeId);
      const root = document.documentElement.style;
      document.body.style.backgroundColor = theme.styles.background;
      document.body.style.backgroundImage = theme.type === "image" && theme.imageUrl
        ? `${theme.styles.pageGlow}, url("${theme.imageUrl}"), ${theme.styles.pageGradient}`
        : `${theme.styles.pageGlow}, ${theme.styles.pageGradient}`;
      document.body.style.backgroundSize = theme.type === "image" && theme.imageUrl ? "auto, cover, auto" : "auto";
      document.body.style.backgroundPosition = theme.type === "image" && theme.imageUrl ? "center top, center center, center center" : "center center";
      root.setProperty("--bg", theme.styles.background);
      root.setProperty("--theme-bg", theme.styles.background);
      root.setProperty("--grid-color", theme.styles.gridColor);
      root.setProperty("--border-color", theme.styles.borderColor);
      root.setProperty("--panel-accent", theme.styles.accent);
      root.setProperty("--wall-color", theme.styles.wallColor);
      root.setProperty("--page-gradient", theme.styles.pageGradient);
      root.setProperty("--page-glow", theme.styles.pageGlow);
    },

    isWheelDateCurrent(today = getLocalDateString()) {
      return (this.progress.bonusWheel?.lastSpinDate || null) === today;
    },

    isWheelAvailable() {
      return !this.isWheelDateCurrent();
    },

    drawWheel(angle = this.wheelAngle) {
      const canvas = this.dom.wheelCanvas;
      const ctx = canvas.getContext("2d");
      const size = canvas.width;
      const radius = size * 0.42;
      const center = size / 2;
      const segmentAngle = (Math.PI * 2) / WHEEL_SEGMENTS.length;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle);

      WHEEL_SEGMENTS.forEach((segment, index) => {
        const start = index * segmentAngle;
        const end = start + segmentAngle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(9,14,26,0.55)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.save();
        ctx.rotate(start + segmentAngle / 2);
        ctx.translate(radius * 0.63, 0);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = "#09111a";
        ctx.font = "bold 22px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(segment.label, 0, 0);
        ctx.restore();
      });

      ctx.restore();
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = "#0d1628";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.stroke();
    },

    spinWheel() {
      if (!this.isWheelAvailable() || this.wheelAnimating) return;
      const prizeIndex = rand(0, WHEEL_SEGMENTS.length - 1);
      const segmentAngle = (Math.PI * 2) / WHEEL_SEGMENTS.length;
      const pointerOffset = -Math.PI / 2;
      const targetAngle = (Math.PI * 8) + (Math.PI * 2 - (prizeIndex * segmentAngle + segmentAngle / 2)) + pointerOffset;
      const start = performance.now();
      const startAngle = this.wheelAngle;
      const duration = 4200;
      this.wheelAnimating = true;
      this.updateWheelUi();

      const animate = (ts) => {
        const t = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        this.wheelAngle = startAngle + (targetAngle - startAngle) * eased;
        this.drawWheel();
        if (t < 1) {
          this.wheelSpinTimer = requestAnimationFrame(animate);
          return;
        }

        this.wheelAnimating = false;
        this.progress.bonusWheel.lastSpinDate = getLocalDateString();
        const prize = WHEEL_SEGMENTS[prizeIndex];
        const awarded = this.grantCoins(prize.value, { celebrate: true, accent: prize.color, applySkinBonus: false });
        const achievementUnlocks = this.checkAchievements("wheel_spin");
        this.persistProgress();
        this.dom.wheelResultText.textContent = `You won ${awarded.toLocaleString()} coins!`;
        this.notify(`BONUS WHEEL: +${awarded} coins`, { celebrate: true, accent: prize.color });
        this.announceAchievements(achievementUnlocks);
        this.updateWheelUi();
      };

      this.wheelSpinTimer = requestAnimationFrame(animate);
    },

    bindTiltEffects(root) {
      root.querySelectorAll("[data-tilt-card]").forEach((card) => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = "1";
        card.addEventListener("mousemove", (event) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty("--tilt-y", `${px * 8}deg`);
          card.style.setProperty("--tilt-x", `${py * -8}deg`);
        });
        card.addEventListener("mouseleave", () => {
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--tilt-x", "0deg");
        });
      });
    },

    updateRunCoinInfo() {
      if (!this.activeRun) {
        this.dom.runCoinInfo.textContent = `BALANCE: ${Math.round(this.progress.totalCoins || 0).toLocaleString()}`;
        return;
      }
      this.dom.runCoinInfo.textContent = `BALANCE: ${Math.round(this.progress.totalCoins || 0).toLocaleString()}`;
    },

    formatBadgeName(dateString) {
      const [year, month, day] = String(dateString).split("-").map(Number);
      const date = new Date(year, (month || 1) - 1, day || 1);
      return `${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })} Champion`;
    },

    bounceCoinChip() {
      this.dom.coinChip?.classList?.remove("bounce");
      void this.dom.coinBalanceTop.offsetWidth;
      this.dom.coinChip?.classList?.add("bounce");
      window.setTimeout(() => this.dom.coinChip?.classList?.remove("bounce"), 320);
    },

    spawnCoinFloat(text) {
      const node = document.createElement("div");
      node.className = "coin-float";
      node.textContent = text;
      this.dom.fxLayer.appendChild(node);
      window.setTimeout(() => node.remove(), 1200);
    },

    ensureAudio() {
      if (!this.progress.settings.sfx) return;
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === "suspended") this.audioCtx.resume().catch(() => {});
    },

    playCoinSound() {
      if (!this.progress.settings.sfx) return;
      this.ensureAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      [740, 980].forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        const start = now + index * 0.05;
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    },

    notify(message, options = {}) {
      let toast = document.getElementById("appToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "appToast";
        toast.className = "app-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add("show");
      toast.classList.toggle("celebrate", !!options.celebrate);
      toast.style.borderColor = options.accent ? options.accent : "";
      if (options.celebrate) {
        const rect = toast.getBoundingClientRect();
        this.spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, options.accent);
      }
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.remove("celebrate");
        toast.style.borderColor = "";
      }, options.celebrate ? 2400 : 1800);
    },

    spawnConfetti(x, y, accent) {
      const colors = [accent || "#ffd166", "#00f3ff", "#ff5c8a", "#7cfc00", "#ffffff"];
      for (let i = 0; i < 22; i += 1) {
        const piece = document.createElement("span");
        const angle = (Math.PI * 2 * i) / 22;
        const distance = 60 + Math.random() * 120;
        piece.className = "confetti";
        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
        piece.style.setProperty("--ty", `${Math.sin(angle) * distance + 70}px`);
        piece.style.setProperty("--rot", `${rand(-360, 360)}deg`);
        this.dom.fxLayer.appendChild(piece);
        window.setTimeout(() => piece.remove(), 1250);
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => app.init());
  global.SnakeApp = app;
  global.applyTheme = (themeId) => app.applyTheme(themeId);
  global.checkSkinUnlocks = () => app.checkSkinUnlocks();
})(window);
