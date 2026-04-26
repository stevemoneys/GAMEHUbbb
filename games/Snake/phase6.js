"use strict";

(function (global) {
  const shared = global.SnakeShared;
  if (!shared || !global.SnakeApp || !global.SnakeEngine) return;

  const {
    GRID_COLS,
    GRID_ROWS,
    CELL_SIZE,
    formatMs,
    saveProgress
  } = shared;

  const TUTORIAL_VERSION = 6;
  const TUTORIAL_STORAGE_KEY = "snakeGameTutorialVersion";
  const CLEANUP_STORAGE_KEY = "snakeGameDBLastCleanup";
  const DB_NAME = "SnakeGameDB";
  const DB_VERSION = 1;
  const REPLAY_FALLBACK_PREFIX = "snakeGameReplay:";
  const STATS_HISTORY_FALLBACK_KEY = "snakeGameStatsHistory";
  const MODE_KEYS = ["campaign", "classic", "time_attack", "maze", "zen", "boss_rush"];

  const DEFAULT_SETTINGS = {
    sfx: true,
    soundEnabled: true,
    musicEnabled: true,
    soundVolume: 0.72,
    musicVolume: 0.48,
    hapticsEnabled: true
  };

  const BASE_STATS = {
    playerName: "Guest",
    totalGamesStarted: 0,
    totalGamesFinished: 0,
    totalTimePlayed: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    highestScoreOverall: 0,
    highestCombo: 0,
    longestSnake: 5,
    totalAISnakesEaten: 0,
    totalPowerUpsCollected: 0,
    totalFeverModesActivated: 0,
    highestLevelCompleted: 0,
    totalLevelsCompleted: 0,
    bestScoresByMode: {
      campaign: 0,
      classic: 0,
      time_attack: 0,
      maze: 0,
      zen: 0,
      boss_rush: 0
    },
    longestStreak: 1,
    totalDailyChallengesCompleted: 0,
    skinsUnlocked: 1,
    themesUnlocked: 1,
    upgradesPurchased: 0
  };

  const DEFAULT_REPLAY_META = {
    campaign: null,
    classic: null,
    time_attack: null,
    maze: null,
    zen: null,
    boss_rush: null
  };

  const VIBRATION_PATTERNS = {
    food: [10],
    ai: [30, 50, 30],
    power: [15, 50, 15],
    gameOver: [100],
    levelWin: [30, 50, 30, 50, 30],
    fever: [20, 20, 20, 20, 20],
    button: [5],
    achievement: [15, 30, 15],
    combo: [8, 20, 8],
    challenge: [18, 30, 18],
    purchase: [12, 18, 32],
    replay: [10, 20, 10]
  };

  const TUTORIAL_SLIDES = [
    {
      icon: "\u{1F40D}",
      title: "How To Move",
      desktopText: "Use the arrow keys or WASD to steer the snake. React early and avoid reversing into danger.",
      mobileText: "Swipe anywhere on the arena to steer the snake. Short, confident swipes work best on mobile."
    },
    {
      icon: "\u2728",
      title: "Eat To Grow",
      desktopText: "Golden food pellets increase your length and score. Staying fed also keeps your combo alive.",
      mobileText: "Golden pellets grow your snake and raise your score. Chain food quickly to build huge combos."
    },
    {
      icon: "\u26A0\uFE0F",
      title: "Know The Danger",
      desktopText: "Walls, your own body, and larger enemy snakes will end the run instantly unless a shield saves you.",
      mobileText: "Avoid walls, your own tail, and larger snakes. One mistake can end the run unless you are shielded."
    },
    {
      icon: "\u{1F9B4}",
      title: "Hunt Smaller Snakes",
      desktopText: "If your snake is longer than an AI snake, bite it to absorb its full length and score a huge burst.",
      mobileText: "Outgrow smaller enemy snakes, then bite them to absorb their length and explode your score."
    },
    {
      icon: "\u{1F7E9}",
      title: "Power Cubes",
      desktopText: "Green cubes unlock temporary powers like speed, shield, magnet, and double points. Time them carefully.",
      mobileText: "Collect power cubes for speed, shield, magnet, and double points. They can save a dangerous run."
    },
    {
      icon: "\u{1F525}",
      title: "Combo & Fever",
      desktopText: "Keep eating fast to extend your combo. At high combo counts, Fever Mode kicks in with wild scoring.",
      mobileText: "Keep your feeding pace high to enter Fever Mode. Fever turns the game into a premium score rush."
    },
    {
      icon: "\u{1FA99}",
      title: "Coins, Shop & Progress",
      desktopText: "Every run helps. Earn coins, finish challenges, unlock achievements, and upgrade your collection over time.",
      mobileText: "Coins, challenges, and achievements fuel long-term progress. Come back daily to grow your collection."
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isMobileDevice() {
    return !!(global.matchMedia && global.matchMedia("(pointer: coarse), (max-width: 860px)").matches) || (navigator.maxTouchPoints || 0) > 0;
  }

  function modeKeyFromConfig(config) {
    if (!config) return "classic";
    if (config.mode === "campaign") return "campaign";
    const type = String(config.arcadeModeType || "CLASSIC").toLowerCase();
    if (type === "time_attack") return "time_attack";
    if (type === "maze") return "maze";
    if (type === "zen") return "zen";
    if (type === "boss_rush") return "boss_rush";
    return "classic";
  }

  function modeLabelFromKey(modeKey) {
    const labels = {
      campaign: "Campaign",
      classic: "Classic",
      time_attack: "Time Attack",
      maze: "Maze",
      zen: "Zen",
      boss_rush: "Boss Rush"
    };
    return labels[modeKey] || "Classic";
  }

  function makeStats() {
    return clone(BASE_STATS);
  }

  function mergeSettings(settings) {
    const merged = {
      ...DEFAULT_SETTINGS,
      ...(settings || {})
    };
    merged.soundEnabled = settings?.soundEnabled ?? settings?.sfx ?? DEFAULT_SETTINGS.soundEnabled;
    merged.sfx = merged.soundEnabled;
    merged.musicEnabled = settings?.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled;
    merged.soundVolume = typeof settings?.soundVolume === "number" ? settings.soundVolume : DEFAULT_SETTINGS.soundVolume;
    merged.musicVolume = typeof settings?.musicVolume === "number" ? settings.musicVolume : DEFAULT_SETTINGS.musicVolume;
    merged.hapticsEnabled = settings?.hapticsEnabled ?? DEFAULT_SETTINGS.hapticsEnabled;
    return merged;
  }

  function mergeStats(stats, progress) {
    const merged = {
      ...makeStats(),
      ...(stats || {}),
      bestScoresByMode: {
        ...BASE_STATS.bestScoresByMode,
        ...(stats?.bestScoresByMode || {})
      }
    };

    if (progress) {
      merged.totalCoinsEarned = Math.max(merged.totalCoinsEarned || 0, progress.lifetimeCoinsEarned || 0);
      merged.totalCoinsSpent = Math.max(merged.totalCoinsSpent || 0, progress.totalCoinsSpent || 0);
      merged.highestScoreOverall = Math.max(merged.highestScoreOverall || 0, progress.highScore || 0);
      merged.highestCombo = Math.max(merged.highestCombo || 0, progress.highestCombo || 0);
      merged.totalAISnakesEaten = Math.max(merged.totalAISnakesEaten || 0, progress.totalAISnakesEaten || 0);
      merged.totalPowerUpsCollected = Math.max(merged.totalPowerUpsCollected || 0, progress.totalPowerUpsCollected || 0);
      merged.totalFeverModesActivated = Math.max(merged.totalFeverModesActivated || 0, progress.totalFeverActivations || 0);
      merged.highestLevelCompleted = Math.max(merged.highestLevelCompleted || 0, Math.max(0, ...(progress.completedLevels || [])));
      merged.totalLevelsCompleted = (progress.completedLevels || []).length;
      merged.longestStreak = Math.max(merged.longestStreak || 1, progress.bestStreak || 1);
      merged.totalDailyChallengesCompleted = (progress.completedDailyChallenges || []).length;
      merged.skinsUnlocked = (progress.unlockedSkins || []).length;
      merged.themesUnlocked = (progress.unlockedThemes || []).length;
      merged.upgradesPurchased = Object.values(progress.upgrades || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }

    return merged;
  }

  function mergeReplayMeta(meta) {
    return {
      ...DEFAULT_REPLAY_META,
      ...(meta || {})
    };
  }

  class SnakeDataStore {
    constructor(notify) {
      this.notify = notify;
      this.available = !!global.indexedDB;
      this.dbPromise = null;
    }

    async open() {
      if (!this.available) return null;
      if (this.dbPromise) return this.dbPromise;

      this.dbPromise = new Promise((resolve, reject) => {
        const request = global.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("replays")) {
            db.createObjectStore("replays", { keyPath: "gameMode" });
          }
          if (!db.objectStoreNames.contains("statsHistory")) {
            const store = db.createObjectStore("statsHistory", { keyPath: "id", autoIncrement: true });
            store.createIndex("timestamp", "timestamp");
            store.createIndex("mode", "mode");
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }).catch((error) => {
        this.available = false;
        this.dbPromise = null;
        if (this.notify) this.notify("IndexedDB unavailable. Replays will use local fallback.", { accent: "#ffb86c" });
        console.warn("IndexedDB unavailable", error);
        return null;
      });

      return this.dbPromise;
    }

    async withStore(storeName, mode, callback) {
      const db = await this.open();
      if (!db) return null;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = callback(store);
        if (request) {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } else {
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        }
      }).catch((error) => {
        console.warn(`IndexedDB ${storeName} transaction failed`, error);
        return null;
      });
    }

    async saveReplay(mode, replayData) {
      const payload = {
        ...replayData,
        gameMode: mode
      };
      if (!this.available) {
        localStorage.setItem(`${REPLAY_FALLBACK_PREFIX}${mode}`, JSON.stringify(payload));
        return true;
      }
      return this.withStore("replays", "readwrite", (store) => store.put(payload));
    }

    async loadReplay(mode) {
      if (!this.available) {
        const raw = localStorage.getItem(`${REPLAY_FALLBACK_PREFIX}${mode}`);
        return raw ? JSON.parse(raw) : null;
      }
      return this.withStore("replays", "readonly", (store) => store.get(mode));
    }

    async deleteReplay(mode) {
      if (!this.available) {
        localStorage.removeItem(`${REPLAY_FALLBACK_PREFIX}${mode}`);
        return true;
      }
      return this.withStore("replays", "readwrite", (store) => store.delete(mode));
    }

    async saveStatsHistory(entry) {
      if (!this.available) {
        const history = JSON.parse(localStorage.getItem(STATS_HISTORY_FALLBACK_KEY) || "[]");
        history.unshift(entry);
        localStorage.setItem(STATS_HISTORY_FALLBACK_KEY, JSON.stringify(history.slice(0, 40)));
        return true;
      }
      return this.withStore("statsHistory", "readwrite", (store) => store.add(entry));
    }

    async loadRecentStats(limit = 10) {
      if (!this.available) {
        return JSON.parse(localStorage.getItem(STATS_HISTORY_FALLBACK_KEY) || "[]").slice(0, limit);
      }

      const db = await this.open();
      if (!db) return [];
      return new Promise((resolve) => {
        const tx = db.transaction("statsHistory", "readonly");
        const store = tx.objectStore("statsHistory");
        const index = store.index("timestamp");
        const results = [];
        index.openCursor(null, "prev").onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor || results.length >= limit) {
            resolve(results);
            return;
          }
          results.push(cursor.value);
          cursor.continue();
        };
        tx.onerror = () => resolve(results);
      });
    }

    async clearStatsHistory() {
      if (!this.available) {
        localStorage.removeItem(STATS_HISTORY_FALLBACK_KEY);
        return true;
      }
      return this.withStore("statsHistory", "readwrite", (store) => store.clear());
    }

    async clearReplays() {
      if (!this.available) {
        MODE_KEYS.forEach((mode) => localStorage.removeItem(`${REPLAY_FALLBACK_PREFIX}${mode}`));
        return true;
      }
      return this.withStore("replays", "readwrite", (store) => store.clear());
    }

    async migrateLegacyReplays() {
      const legacyKeys = Object.keys(localStorage).filter((key) => key.startsWith(REPLAY_FALLBACK_PREFIX) || key.startsWith("bestReplay:") || key.startsWith("snakeReplay:"));
      for (const key of legacyKeys) {
        try {
          const replay = JSON.parse(localStorage.getItem(key) || "null");
          if (!replay) continue;
          const mode = replay.gameMode || key.split(":").pop();
          await this.saveReplay(mode, replay);
          localStorage.removeItem(key);
        } catch (error) {
          console.warn("Replay migration skipped", error);
        }
      }
    }

    async weeklyCleanup() {
      const now = Date.now();
      const last = Number(localStorage.getItem(CLEANUP_STORAGE_KEY) || 0);
      if (last && now - last < 7 * 24 * 60 * 60 * 1000) return;
      const cutoff = now - 45 * 24 * 60 * 60 * 1000;
      if (this.available) {
        const db = await this.open();
        if (db) {
          await new Promise((resolve) => {
            const tx = db.transaction("statsHistory", "readwrite");
            const store = tx.objectStore("statsHistory");
            store.openCursor().onsuccess = (event) => {
              const cursor = event.target.result;
              if (!cursor) {
                resolve();
                return;
              }
              if ((cursor.value?.timestamp || 0) < cutoff) cursor.delete();
              cursor.continue();
            };
            tx.onerror = () => resolve();
          });
        }
      }
      if (!this.available) {
        const history = JSON.parse(localStorage.getItem(STATS_HISTORY_FALLBACK_KEY) || "[]");
        localStorage.setItem(STATS_HISTORY_FALLBACK_KEY, JSON.stringify(history.filter((entry) => (entry.timestamp || 0) >= cutoff).slice(0, 40)));
      }
      localStorage.setItem(CLEANUP_STORAGE_KEY, String(now));
    }
  }

  class SoundManager {
    constructor() {
      this.ctx = null;
      this.unlocked = false;
      this.sfxGain = null;
      this.musicGain = null;
      this.musicTimer = 0;
      this.musicState = "none";
      this.musicTrack = "";
      this.musicStep = 0;
      this.settings = mergeSettings();
      this.melodies = {
        default: [
          { freq: 261.63, len: 0.34, type: "triangle" },
          null,
          { freq: 329.63, len: 0.34, type: "triangle" },
          { freq: 392.0, len: 0.52, type: "sine" },
          null,
          { freq: 329.63, len: 0.34, type: "triangle" },
          { freq: 293.66, len: 0.34, type: "triangle" },
          { freq: 261.63, len: 0.52, type: "sine" }
        ],
        fever: [
          { freq: 392.0, len: 0.18, type: "sawtooth" },
          { freq: 440.0, len: 0.18, type: "sawtooth" },
          { freq: 523.25, len: 0.18, type: "square" },
          { freq: 659.25, len: 0.24, type: "square" },
          { freq: 523.25, len: 0.18, type: "sawtooth" },
          { freq: 440.0, len: 0.18, type: "sawtooth" },
          { freq: 659.25, len: 0.18, type: "square" },
          { freq: 783.99, len: 0.24, type: "square" }
        ]
      };
    }

    ensureContext() {
      if (!this.ctx) {
        this.ctx = new (global.AudioContext || global.webkitAudioContext)();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.001;
        this.musicGain.gain.value = 0.001;
        this.sfxGain.connect(this.ctx.destination);
        this.musicGain.connect(this.ctx.destination);
      }
      return this.ctx;
    }

    unlock() {
      try {
        const ctx = this.ensureContext();
        this.unlocked = true;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        this.applySettings(this.settings);
        if (this.musicState !== "none") this.startMusicLoop(this.musicState);
      } catch (error) {
        console.warn("Audio unlock failed", error);
      }
    }

    applySettings(settings) {
      this.settings = mergeSettings(settings);
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.linearRampToValueAtTime(this.settings.soundEnabled ? this.settings.soundVolume * 0.22 : 0.0001, now + 0.1);
      this.musicGain.gain.linearRampToValueAtTime(
        this.settings.musicEnabled && this.unlocked && this.musicState !== "none" ? this.settings.musicVolume * 0.13 : 0.0001,
        now + 0.18
      );
      if (!this.settings.musicEnabled) this.stopMusic();
    }

    spawnOsc(note, startAt, channel = "sfx", volume = 1) {
      if (!note || !note.freq) return;
      const ctx = this.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const out = channel === "music" ? this.musicGain : this.sfxGain;
      osc.type = note.type || "sine";
      osc.frequency.value = note.freq;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(out);
      const peak = Math.max(0.001, (note.peak || 0.28) * volume);
      const dur = note.len || note.duration || 0.12;
      gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.03);
    }

    playSequence(sequence, volume = 1) {
      if (!this.unlocked || !this.settings.soundEnabled) return;
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      sequence.forEach((note, index) => {
        if (!note) return;
        const offset = typeof note.delay === "number" ? note.delay : index * 0.055;
        this.spawnOsc(note, now + offset, "sfx", volume);
      });
    }

    play(name) {
      const patterns = {
        button: [{ freq: 680, len: 0.05, type: "triangle", peak: 0.18 }],
        food: [{ freq: 880, len: 0.08, type: "triangle", peak: 0.2 }],
        ai: [
          { freq: 420, len: 0.08, type: "square", peak: 0.22 },
          { freq: 320, len: 0.14, delay: 0.05, type: "sawtooth", peak: 0.2 }
        ],
        power: [
          { freq: 540, len: 0.07, type: "triangle", peak: 0.2 },
          { freq: 740, len: 0.09, delay: 0.04, type: "triangle", peak: 0.22 },
          { freq: 980, len: 0.12, delay: 0.08, type: "sine", peak: 0.24 }
        ],
        achievement: [
          { freq: 523.25, len: 0.08, type: "triangle", peak: 0.22 },
          { freq: 659.25, len: 0.1, delay: 0.05, type: "triangle", peak: 0.22 },
          { freq: 783.99, len: 0.16, delay: 0.1, type: "sine", peak: 0.24 }
        ],
        purchase: [
          { freq: 740, len: 0.06, type: "triangle", peak: 0.2 },
          { freq: 980, len: 0.1, delay: 0.04, type: "triangle", peak: 0.22 }
        ],
        combo: [
          { freq: 720, len: 0.05, type: "square", peak: 0.18 },
          { freq: 920, len: 0.08, delay: 0.04, type: "square", peak: 0.2 }
        ],
        feverStart: [
          { freq: 660, len: 0.05, type: "sawtooth", peak: 0.2 },
          { freq: 820, len: 0.05, delay: 0.04, type: "sawtooth", peak: 0.22 },
          { freq: 1040, len: 0.14, delay: 0.08, type: "square", peak: 0.24 }
        ],
        feverEnd: [
          { freq: 520, len: 0.08, type: "sine", peak: 0.16 },
          { freq: 380, len: 0.12, delay: 0.05, type: "sine", peak: 0.18 }
        ],
        challenge: [
          { freq: 494, len: 0.08, type: "triangle", peak: 0.2 },
          { freq: 659, len: 0.1, delay: 0.05, type: "triangle", peak: 0.22 },
          { freq: 880, len: 0.14, delay: 0.1, type: "triangle", peak: 0.24 }
        ],
        levelWin: [
          { freq: 523.25, len: 0.08, type: "square", peak: 0.18 },
          { freq: 659.25, len: 0.1, delay: 0.06, type: "square", peak: 0.2 },
          { freq: 783.99, len: 0.12, delay: 0.12, type: "triangle", peak: 0.22 },
          { freq: 1046.5, len: 0.2, delay: 0.2, type: "triangle", peak: 0.24 }
        ],
        gameOver: [
          { freq: 320, len: 0.12, type: "sine", peak: 0.18 },
          { freq: 260, len: 0.16, delay: 0.08, type: "sine", peak: 0.2 },
          { freq: 196, len: 0.22, delay: 0.16, type: "triangle", peak: 0.22 }
        ],
        replay: [
          { freq: 550, len: 0.06, type: "triangle", peak: 0.15 },
          { freq: 620, len: 0.06, delay: 0.05, type: "triangle", peak: 0.15 }
        ]
      };
      if (patterns[name]) this.playSequence(patterns[name], this.settings.soundVolume);
    }

    stopMusic() {
      if (this.musicTimer) clearTimeout(this.musicTimer);
      this.musicTimer = 0;
      this.musicTrack = "";
      if (this.ctx && this.musicGain) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
      }
    }

    setMusicState(state) {
      this.musicState = state;
      if (!this.unlocked || !this.settings.musicEnabled) return;
      this.startMusicLoop(state);
    }

    startMusicLoop(state) {
      if (!this.unlocked) return;
      const track = state === "fever" ? "fever" : state === "none" ? "" : "default";
      if (!track) {
        this.stopMusic();
        return;
      }
      if (this.musicTrack === track && this.musicTimer) return;
      if (this.musicTimer) clearTimeout(this.musicTimer);
      this.musicTrack = track;
      this.musicStep = 0;
      this.scheduleMusicStep();
    }

    scheduleMusicStep() {
      if (!this.unlocked || !this.settings.musicEnabled || !this.musicTrack) return;
      const melody = this.melodies[this.musicTrack];
      const note = melody[this.musicStep % melody.length];
      if (note) {
        const start = this.ensureContext().currentTime + 0.01;
        this.spawnOsc(note, start, "music", this.settings.musicVolume);
      }
      const delay = Math.max(140, Math.round(((note?.len || 0.22) + 0.02) * 1000));
      this.musicStep += 1;
      this.musicTimer = global.setTimeout(() => this.scheduleMusicStep(), delay);
    }
  }

  class ReplayRecorder {
    constructor() {
      this.reset();
    }

    reset() {
      this.active = false;
      this.frames = [];
      this.pendingEvents = [];
      this.startedAt = 0;
      this.config = null;
      this.modeKey = "classic";
      this.lastSnapshot = null;
      this.lastFrameSignature = "";
      this.finalReplay = null;
    }

    start(config) {
      this.reset();
      this.active = true;
      this.config = clone(config || {});
      this.modeKey = modeKeyFromConfig(config);
      this.startedAt = performance.now();
    }

    markEvent(type, payload = {}) {
      if (!this.active) return;
      const compact = Object.keys(payload).length ? `${type}:${Object.entries(payload).map(([key, value]) => `${key}=${value}`).join(",")}` : type;
      this.pendingEvents.push(compact);
    }

    capture(state) {
      if (!this.active || !state?.player?.segments?.length) return;
      const head = state.player.segments[0];
      const time = Math.max(0, Math.round(performance.now() - this.startedAt));
      const frame = {
        time,
        direction: state.player.direction,
        headX: head.x,
        headY: head.y,
        score: state.score,
        length: state.player.targetLength,
        activePower: state.activePower ? state.activePower.id : null,
        fever: !!state.fever,
        events: this.pendingEvents.splice(0)
      };

      const last = this.frames[this.frames.length - 1];
      const signature = `${frame.direction}:${frame.headX}:${frame.headY}:${frame.score}:${frame.length}:${frame.activePower || "none"}:${frame.fever}`;
      if (
        last &&
        signature === this.lastFrameSignature &&
        frame.events.length === 0 &&
        time - last.time < 80
      ) {
        this.lastSnapshot = clone({
          player: {
            direction: state.player.direction,
            targetLength: state.player.targetLength,
            segments: [{ x: head.x, y: head.y }]
          },
          score: state.score,
          activePower: state.activePower ? { id: state.activePower.id } : null,
          fever: !!state.fever
        });
        return;
      }

      this.frames.push(frame);
      this.lastFrameSignature = signature;
      this.lastSnapshot = clone({
        player: {
          direction: state.player.direction,
          targetLength: state.player.targetLength,
          segments: [{ x: head.x, y: head.y }]
        },
        score: state.score,
        activePower: state.activePower ? { id: state.activePower.id } : null,
        fever: !!state.fever
      });
    }

    finish(result) {
      if (!this.active) return this.finalReplay;
      if (this.lastSnapshot) this.capture(this.lastSnapshot);
      const duration = this.frames.length ? this.frames[this.frames.length - 1].time : Math.round(performance.now() - this.startedAt);
      this.finalReplay = {
        version: 1,
        timestamp: Date.now(),
        gameMode: this.modeKey,
        config: {
          mode: this.config?.mode || "arcade",
          arcadeModeType: this.config?.arcadeModeType || "CLASSIC",
          levelId: this.config?.levelId || null,
          targetLength: this.config?.targetLength || null,
          targetTime: this.config?.targetTime || null,
          hasMaze: !!this.config?.mazeLayout
        },
        score: result.score,
        length: result.length,
        duration,
        frames: this.frames.slice()
      };
      this.active = false;
      return this.finalReplay;
    }
  }

  function formatReplayClock(ms) {
    const secs = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function findReplayFrameIndex(frames, timeMs) {
    let low = 0;
    let high = frames.length - 1;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (frames[mid].time <= timeMs) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
  }

  function buildGhostSegments(frames, frameIndex) {
    const frame = frames[frameIndex];
    if (!frame) return [];
    const needed = Math.max(1, frame.length || 1);
    const segments = [];
    for (let i = frameIndex; i >= 0 && segments.length < needed; i -= 1) {
      segments.push({ x: frames[i].headX, y: frames[i].headY });
    }
    while (segments.length < needed) {
      segments.push({ x: frame.headX, y: frame.headY });
    }
    return segments;
  }

  function renderReplayCanvas(canvas, replay, timeMs) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#081220");
    bg.addColorStop(1, "#050812");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x <= width; x += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }

    const frameIndex = findReplayFrameIndex(replay.frames, timeMs);
    const frame = replay.frames[frameIndex];
    const segments = buildGhostSegments(replay.frames, frameIndex);

    ctx.save();
    for (let i = segments.length - 1; i >= 0; i -= 1) {
      const seg = segments[i];
      const alpha = Math.max(0.12, 0.44 - i * 0.01);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(seg.x * CELL_SIZE + 2, seg.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
    ctx.restore();

    if (frame) {
      const headPx = frame.headX * CELL_SIZE + CELL_SIZE / 2;
      const headPy = frame.headY * CELL_SIZE + CELL_SIZE / 2;
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255,255,255,0.7)";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(headPx, headPy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (frame.activePower) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,243,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(headPx, headPy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Orbitron";
      ctx.fillText(`Replay Score: ${frame.score}`, 20, 28);
      ctx.fillText(`Length: ${frame.length}`, 20, 54);
      if (frame.events?.length) {
        ctx.fillStyle = "rgba(255,214,102,0.95)";
        ctx.font = "bold 14px Poppins";
        ctx.fillText(frame.events[frame.events.length - 1].replace(/:/g, " "), 20, 80);
      }
    }
  }

  const engineProto = global.SnakeEngine.prototype;
  engineProto.queueDirection = function (dir) {
    if (!this.running || this.paused || !this.state || this.state.over) return;
    this.ensureAudio();
    if (!this.isReverse(this.state.player.direction, dir)) this.state.player.nextDirection = dir;
  };

  engineProto.bindInput = function () {
    if (this.__phase6InputBound) return;
    this.__phase6InputBound = true;
    window.addEventListener("keydown", (event) => {
      const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right"
      };
      const dir = map[event.key];
      if (!dir) return;
      if (!this.running || this.paused || !this.state || this.state.over) return;
      event.preventDefault();
      this.queueDirection(dir);
    });
  };

  const originalUpdateFever = engineProto.updateFever;
  engineProto.updateFever = function (now) {
    const wasActive = !!this.state?.fever;
    originalUpdateFever.call(this, now);
    if (wasActive && this.state && !this.state.fever) {
      this.emitGameEvent("fever_ended", {});
    }
  };

  const originalTogglePause = engineProto.togglePause;
  engineProto.togglePause = function () {
    const before = this.paused;
    originalTogglePause.call(this);
    if (before !== this.paused) {
      this.emitGameEvent("pause_toggled", { paused: this.paused });
    }
  };

  const app = global.SnakeApp;

  function ensurePhase6State(instance) {
    if (instance.phase6) return instance.phase6;
    instance.phase6 = {
      mobile: isMobileDevice(),
      store: new SnakeDataStore((message, options) => instance.notify?.(message, options)),
      sound: new SoundManager(),
      recorder: new ReplayRecorder(),
      uiBound: false,
      recentHistory: [],
      pendingReplayData: null,
      pendingReplayModeKey: "classic",
      pendingReplayIsBest: false,
      replaySession: {
        data: null,
        modeKey: "classic",
        playing: false,
        timeMs: 0,
        startedAt: 0,
        source: "stats",
        raf: 0
      },
      tutorialIndex: 0,
      tutorialOpen: false,
      booted: false,
      lastFeverState: false
    };
    return instance.phase6;
  }

  app.getModeKey = function (config = this.currentConfig) {
    return modeKeyFromConfig(config);
  };

  app.handleAudioUnlock = function () {
    ensurePhase6State(this).sound.unlock();
  };

  app.phase6Vibrate = function (name) {
    const pattern = VIBRATION_PATTERNS[name];
    if (!pattern) return;
    if (!this.progress.settings?.hapticsEnabled) return;
    if (navigator?.vibrate) navigator.vibrate(pattern);
  };

  app.updateStatsSnapshot = function () {
    this.progress.stats = mergeStats(this.progress.stats, this.progress);
    this.progress.settings = mergeSettings(this.progress.settings);
    this.progress.replayMetaByMode = mergeReplayMeta(this.progress.replayMetaByMode);
    return this.progress.stats;
  };

  app.renderSettingsModal = function () {
    if (!this.dom.musicToggle) return;
    const settings = mergeSettings(this.progress.settings);
    this.dom.musicToggle.checked = !!settings.musicEnabled;
    this.dom.soundToggle.checked = !!settings.soundEnabled;
    this.dom.hapticsToggle.checked = !!settings.hapticsEnabled;
    this.dom.musicVolume.value = String(Math.round(settings.musicVolume * 100));
    this.dom.soundVolume.value = String(Math.round(settings.soundVolume * 100));
    this.dom.musicVolumeValue.textContent = `${Math.round(settings.musicVolume * 100)}%`;
    this.dom.soundVolumeValue.textContent = `${Math.round(settings.soundVolume * 100)}%`;
    if (this.dom.sfxToggle) this.dom.sfxToggle.checked = !!settings.soundEnabled;
    ensurePhase6State(this).sound.applySettings(settings);
  };

  app.applyPhase6Settings = function (changes = {}) {
    this.progress.settings = mergeSettings({
      ...this.progress.settings,
      ...changes
    });
    this.progress.settings.sfx = this.progress.settings.soundEnabled;
    this.renderSettingsModal();
    saveProgress(this.progress);
  };

  app.openSettingsModal = function () {
    this.dom.settingsModal.classList.add("open");
    this.dom.settingsModal.setAttribute("aria-hidden", "false");
    this.renderSettingsModal();
  };

  app.closeSettingsModal = function () {
    this.dom.settingsModal.classList.remove("open");
    this.dom.settingsModal.setAttribute("aria-hidden", "true");
  };

  app.openTutorial = function (index = 0) {
    const phase6 = ensurePhase6State(this);
    phase6.tutorialIndex = Math.max(0, Math.min(TUTORIAL_SLIDES.length - 1, index));
    phase6.tutorialOpen = true;
    this.dom.tutorialModal.classList.add("open");
    this.dom.tutorialModal.setAttribute("aria-hidden", "false");
    this.renderTutorialSlide();
  };

  app.closeTutorial = function (markComplete = true) {
    const phase6 = ensurePhase6State(this);
    phase6.tutorialOpen = false;
    this.dom.tutorialModal.classList.remove("open");
    this.dom.tutorialModal.setAttribute("aria-hidden", "true");
    if (markComplete) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, String(TUTORIAL_VERSION));
      localStorage.setItem("tutorialCompleted", "true");
    }
  };

  app.renderTutorialSlide = function () {
    const phase6 = ensurePhase6State(this);
    const slide = TUTORIAL_SLIDES[phase6.tutorialIndex];
    if (!slide) return;
    this.dom.tutorialIcon.textContent = slide.icon;
    this.dom.tutorialTitle.textContent = slide.title;
    this.dom.tutorialText.textContent = phase6.mobile ? slide.mobileText : slide.desktopText;
    this.dom.tutorialStep.textContent = `Slide ${phase6.tutorialIndex + 1} of ${TUTORIAL_SLIDES.length}`;
    this.dom.tutorialPrevBtn.disabled = phase6.tutorialIndex === 0;
    this.dom.tutorialNextBtn.textContent = phase6.tutorialIndex === TUTORIAL_SLIDES.length - 1 ? "Finish" : "Next";
  };

  app.renderStatsModal = function () {
    if (!this.dom.statsGrid) return;
    const stats = this.updateStatsSnapshot();
    const replayMeta = mergeReplayMeta(this.progress.replayMetaByMode);
    const rows = MODE_KEYS.map((modeKey) => {
      const score = stats.bestScoresByMode[modeKey] || 0;
      const replay = replayMeta[modeKey];
      return `
        <div class="mode-stat-row">
          <div>
            <strong>${modeLabelFromKey(modeKey)}</strong>
            <span>${score.toLocaleString()} pts</span>
          </div>
          <button class="collection-action compact" data-open-replay="${modeKey}" ${replay ? "" : "disabled"}>${replay ? "View Best Replay" : "No Replay Yet"}</button>
        </div>
      `;
    }).join("");

    const recent = ensurePhase6State(this).recentHistory;
    const recentHtml = recent.length
      ? recent.map((entry) => `
          <div class="recent-run-item">
            <div>
              <strong>${modeLabelFromKey(entry.mode)}</strong>
              <span>${entry.win ? "Win" : "Loss"} &bull; ${entry.score.toLocaleString()} pts &bull; ${formatReplayClock(entry.duration)}</span>
            </div>
            <span>+${entry.coins.toLocaleString()} coins</span>
          </div>
        `).join("")
      : `<p class="stats-empty">Recent runs will appear here after a few games.</p>`;

    this.dom.statsGrid.innerHTML = `
      <article class="stats-card glass">
        <p class="feature-kicker">General</p>
        <h3>${stats.playerName}</h3>
        <div class="stats-list">
          <span>Total Games Started <strong>${stats.totalGamesStarted}</strong></span>
          <span>Total Games Finished <strong>${stats.totalGamesFinished}</strong></span>
          <span>Total Time Played <strong>${formatMs(stats.totalTimePlayed)}</strong></span>
          <span>Lifetime Coins Earned <strong>${stats.totalCoinsEarned.toLocaleString()}</strong></span>
          <span>Lifetime Coins Spent <strong>${stats.totalCoinsSpent.toLocaleString()}</strong></span>
        </div>
      </article>
      <article class="stats-card glass">
        <p class="feature-kicker">Performance</p>
        <h3>Peak Performance</h3>
        <div class="stats-list">
          <span>Highest Score <strong>${stats.highestScoreOverall.toLocaleString()}</strong></span>
          <span>Highest Combo <strong>${stats.highestCombo}</strong></span>
          <span>Longest Snake <strong>${stats.longestSnake}</strong></span>
          <span>AI Snakes Eaten <strong>${stats.totalAISnakesEaten}</strong></span>
          <span>Power-Ups Collected <strong>${stats.totalPowerUpsCollected}</strong></span>
          <span>Fever Modes Activated <strong>${stats.totalFeverModesActivated}</strong></span>
        </div>
      </article>
      <article class="stats-card glass">
        <p class="feature-kicker">Campaign & Daily</p>
        <h3>Progress Dashboard</h3>
        <div class="stats-list">
          <span>Highest Level Completed <strong>${stats.highestLevelCompleted}</strong></span>
          <span>Total Levels Completed <strong>${stats.totalLevelsCompleted}</strong></span>
          <span>Longest Streak <strong>${stats.longestStreak}</strong></span>
          <span>Daily Challenges Completed <strong>${stats.totalDailyChallengesCompleted}</strong></span>
        </div>
      </article>
      <article class="stats-card glass">
        <p class="feature-kicker">Collection</p>
        <h3>Unlock Progress</h3>
        <div class="stats-list">
          <span>Skins Unlocked <strong>${stats.skinsUnlocked}</strong></span>
          <span>Themes Unlocked <strong>${stats.themesUnlocked}</strong></span>
          <span>Upgrade Levels Bought <strong>${stats.upgradesPurchased}</strong></span>
        </div>
      </article>
      <article class="stats-card glass stats-card-wide">
        <p class="feature-kicker">Best Replays</p>
        <h3>Mode Records</h3>
        <div class="mode-stat-list">${rows}</div>
      </article>
      <article class="stats-card glass stats-card-wide">
        <p class="feature-kicker">Recent Runs</p>
        <h3>Latest Sessions</h3>
        <div class="recent-run-list">${recentHtml}</div>
      </article>
    `;
  };

  app.openStatsModal = async function () {
    this.dom.statsModal.classList.add("open");
    this.dom.statsModal.setAttribute("aria-hidden", "false");
    await this.refreshStatsHistory();
    this.renderStatsModal();
  };

  app.closeStatsModal = function () {
    this.dom.statsModal.classList.remove("open");
    this.dom.statsModal.setAttribute("aria-hidden", "true");
  };

  app.refreshStatsHistory = async function () {
    ensurePhase6State(this).recentHistory = await ensurePhase6State(this).store.loadRecentStats(10) || [];
  };

  app.openReplayViewer = async function (modeKey, replayData = null, source = "stats") {
    const phase6 = ensurePhase6State(this);
    const replay = replayData || await phase6.store.loadReplay(modeKey);
    if (!replay) {
      this.notify("No replay available for that mode yet.", { accent: "#ffb86c" });
      return;
    }
    phase6.replaySession.data = replay;
    phase6.replaySession.modeKey = modeKey;
    phase6.replaySession.source = source;
    phase6.replaySession.playing = false;
    phase6.replaySession.timeMs = 0;
    phase6.replaySession.startedAt = 0;
    if (phase6.replaySession.raf) cancelAnimationFrame(phase6.replaySession.raf);
    this.dom.replayModal.classList.add("open");
    this.dom.replayModal.setAttribute("aria-hidden", "false");
    this.dom.replayTitle.textContent = `${modeLabelFromKey(modeKey)} Replay`;
    this.dom.replayMeta.textContent = `Best score ${replay.score.toLocaleString()} • Length ${replay.length} • ${formatReplayClock(replay.duration)}`;
    this.dom.replayScrubber.max = String(replay.duration || 1);
    this.dom.replayScrubber.value = "0";
    this.renderReplayFrame(0);
    phase6.sound.play("replay");
    this.phase6Vibrate("replay");
  };

  app.closeReplayViewer = function () {
    const phase6 = ensurePhase6State(this);
    phase6.replaySession.playing = false;
    if (phase6.replaySession.raf) cancelAnimationFrame(phase6.replaySession.raf);
    phase6.replaySession.raf = 0;
    this.dom.replayModal.classList.remove("open");
    this.dom.replayModal.setAttribute("aria-hidden", "true");
  };

  app.renderReplayFrame = function (timeMs) {
    const replay = ensurePhase6State(this).replaySession.data;
    if (!replay) return;
    const clamped = Math.max(0, Math.min(replay.duration, timeMs));
    ensurePhase6State(this).replaySession.timeMs = clamped;
    this.dom.replayScrubber.value = String(clamped);
    this.dom.replayTimeCurrent.textContent = formatReplayClock(clamped);
    this.dom.replayTimeTotal.textContent = formatReplayClock(replay.duration || 0);
    renderReplayCanvas(this.dom.replayCanvas, replay, clamped);
  };

  app.playReplay = function () {
    const phase6 = ensurePhase6State(this);
    const replay = phase6.replaySession.data;
    if (!replay) return;
    phase6.replaySession.playing = true;
    phase6.replaySession.startedAt = performance.now() - phase6.replaySession.timeMs;
    const tick = (ts) => {
      if (!phase6.replaySession.playing) return;
      const next = ts - phase6.replaySession.startedAt;
      this.renderReplayFrame(next);
      if (next >= replay.duration) {
        phase6.replaySession.playing = false;
        this.renderReplayFrame(replay.duration);
        return;
      }
      phase6.replaySession.raf = requestAnimationFrame(tick);
    };
    phase6.replaySession.raf = requestAnimationFrame(tick);
  };

  app.pauseReplay = function () {
    const phase6 = ensurePhase6State(this);
    phase6.replaySession.playing = false;
    if (phase6.replaySession.raf) cancelAnimationFrame(phase6.replaySession.raf);
    phase6.replaySession.raf = 0;
  };

  app.stopReplay = function () {
    this.pauseReplay();
    this.renderReplayFrame(0);
  };

  app.updatePauseOverlay = async function () {
    const paused = !!this.engine?.paused;
    this.dom.pauseMenuOverlay.classList.toggle("show", paused);
    if (!paused) return;
    const modeKey = this.getModeKey(this.currentConfig);
    const hasReplay = !!mergeReplayMeta(this.progress.replayMetaByMode)[modeKey];
    this.dom.pauseReplayBtn.hidden = !hasReplay;
  };

  app.updateEndReplayButton = function (result) {
    const modeKey = modeKeyFromConfig(result.config);
    const hasStoredReplay = !!mergeReplayMeta(this.progress.replayMetaByMode)[modeKey];
    const bestScore = this.progress.stats?.bestScoresByMode?.[modeKey] || 0;
    const isNewBest = result.score > bestScore;
    ensurePhase6State(this).pendingReplayIsBest = isNewBest;
    ensurePhase6State(this).pendingReplayModeKey = modeKey;
    this.dom.watchReplayEndBtn.hidden = !(isNewBest || hasStoredReplay);
    this.dom.watchReplayEndBtn.textContent = isNewBest ? "WATCH YOUR BEST RUN" : "WATCH BEST REPLAY";
  };

  app.recordReplayFrame = function (state) {
    ensurePhase6State(this).recorder.capture(state);
  };

  app.syncPhase6RunStart = function (config) {
    const phase6 = ensurePhase6State(this);
    phase6.pendingReplayData = null;
    phase6.pendingReplayModeKey = modeKeyFromConfig(config);
    phase6.pendingReplayIsBest = false;
    phase6.lastFeverState = false;
    phase6.recorder.start(config);
    this.progress.stats.totalGamesStarted += 1;
    this.updateStatsSnapshot();
    phase6.sound.setMusicState("game");
    saveProgress(this.progress);
  };

  app.buildStatsHistoryEntry = function (result) {
    return {
      timestamp: Date.now(),
      mode: modeKeyFromConfig(result.config),
      score: result.score,
      length: result.length,
      duration: result.playMs || 0,
      coins: Number(String(this.dom.finalCoins.textContent || "0").replace(/,/g, "")) || 0,
      win: !!result.win,
      levelId: result.config.levelId || null
    };
  };

  app.updateStatsFromResult = function (result) {
    const stats = this.updateStatsSnapshot();
    const modeKey = modeKeyFromConfig(result.config);
    const coins = Number(String(this.dom.finalCoins.textContent || "0").replace(/,/g, "")) || 0;
    stats.totalGamesFinished += 1;
    stats.totalTimePlayed += result.playMs || 0;
    stats.totalCoinsEarned = Math.max(stats.totalCoinsEarned, this.progress.lifetimeCoinsEarned || 0);
    stats.highestScoreOverall = Math.max(stats.highestScoreOverall || 0, result.score || 0);
    stats.highestCombo = Math.max(stats.highestCombo || 0, result.maxCombo || 0, this.progress.highestCombo || 0);
    stats.longestSnake = Math.max(stats.longestSnake || 5, result.length || 5);
    stats.totalAISnakesEaten = Math.max(stats.totalAISnakesEaten || 0, this.progress.totalAISnakesEaten || 0);
    stats.totalPowerUpsCollected = Math.max(stats.totalPowerUpsCollected || 0, this.progress.totalPowerUpsCollected || 0);
    stats.totalFeverModesActivated = Math.max(stats.totalFeverModesActivated || 0, this.progress.totalFeverActivations || 0);
    stats.bestScoresByMode[modeKey] = Math.max(stats.bestScoresByMode[modeKey] || 0, result.score || 0);
    stats.longestStreak = Math.max(stats.longestStreak || 1, this.progress.bestStreak || 1);
    stats.totalDailyChallengesCompleted = (this.progress.completedDailyChallenges || []).length;
    stats.skinsUnlocked = (this.progress.unlockedSkins || []).length;
    stats.themesUnlocked = (this.progress.unlockedThemes || []).length;
    stats.upgradesPurchased = Object.values(this.progress.upgrades || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    if (result.config.mode === "campaign" && result.win) {
      stats.highestLevelCompleted = Math.max(stats.highestLevelCompleted || 0, result.config.levelId || 0);
      stats.totalLevelsCompleted = (this.progress.completedLevels || []).length;
    }
    return coins;
  };

  app.resetPhase6Stats = async function () {
    this.progress.totalCoinsSpent = 0;
    this.progress.lifetimeCoinsEarned = 0;
    this.progress.totalPlayMs = 0;
    this.progress.highScore = 0;
    this.progress.gamesPlayed = 0;
    this.progress.totalAISnakesEaten = 0;
    this.progress.totalPowerUpsCollected = 0;
    this.progress.totalFeverActivations = 0;
    this.progress.highestCombo = 0;
    this.progress.mazeGamesCompleted = 0;
    this.progress.bossRushWins = 0;
    this.progress.winsWithoutPowerUps = 0;
    this.progress.shopPurchases = 0;
    this.progress.bestStreak = 1;
    this.progress.completedDailyChallenges = [];
    this.progress.stats = makeStats();
    this.progress.replayMetaByMode = mergeReplayMeta();
    await ensurePhase6State(this).store.clearStatsHistory();
    await ensurePhase6State(this).store.clearReplays();
    ensurePhase6State(this).recentHistory = [];
    this.renderStatsModal();
    saveProgress(this.progress);
    this.notify("Phase 6 stats and replays reset.", { accent: "#ffb86c" });
  };

  const originalInit = app.init;
  app.init = function () {
    ensurePhase6State(this);
    originalInit.call(this);
    if (ensurePhase6State(this).booted) return;
    ensurePhase6State(this).booted = true;
    if (!ensurePhase6State(this).store.available) {
      this.notify("IndexedDB is unavailable. Replays will use local fallback storage.", { accent: "#ffb86c" });
    }
    this.renderSettingsModal();
    ensurePhase6State(this).sound.applySettings(this.progress.settings);
    ensurePhase6State(this).sound.setMusicState("menu");
    ensurePhase6State(this).store.migrateLegacyReplays().catch(() => {});
    ensurePhase6State(this).store.weeklyCleanup().catch(() => {});
    this.refreshStatsHistory().then(() => this.renderStatsModal());
    const tutorialVersion = Number(localStorage.getItem(TUTORIAL_STORAGE_KEY) || 0);
    if (tutorialVersion < TUTORIAL_VERSION) this.openTutorial(0);
  };

  const originalNormalize = app.normalizeProgress;
  app.normalizeProgress = function () {
    originalNormalize.call(this);
    this.progress.settings = mergeSettings(this.progress.settings);
    this.progress.totalCoinsSpent = Number(this.progress.totalCoinsSpent || 0);
    this.progress.replayMetaByMode = mergeReplayMeta(this.progress.replayMetaByMode);
    this.progress.stats = mergeStats(this.progress.stats, this.progress);
  };

  const originalCacheDom = app.cacheDom;
  app.cacheDom = function () {
    originalCacheDom.call(this);
    Object.assign(this.dom, {
      statsBtn: document.getElementById("statsBtn"),
      watchReplayEndBtn: document.getElementById("watchReplayEndBtn"),
      pauseMenuOverlay: document.getElementById("pauseMenuOverlay"),
      pauseResumeBtn: document.getElementById("pauseResumeBtn"),
      pauseRestartBtn: document.getElementById("pauseRestartBtn"),
      pauseQuitBtn: document.getElementById("pauseQuitBtn"),
      pauseSettingsBtn: document.getElementById("pauseSettingsBtn"),
      pauseReplayBtn: document.getElementById("pauseReplayBtn"),
      settingsModal: document.getElementById("settingsModal"),
      settingsBackdrop: document.getElementById("settingsBackdrop"),
      closeSettingsModalBtn: document.getElementById("closeSettingsModalBtn"),
      musicToggle: document.getElementById("musicToggle"),
      soundToggle: document.getElementById("soundToggle"),
      hapticsToggle: document.getElementById("hapticsToggle"),
      musicVolume: document.getElementById("musicVolume"),
      soundVolume: document.getElementById("soundVolume"),
      musicVolumeValue: document.getElementById("musicVolumeValue"),
      soundVolumeValue: document.getElementById("soundVolumeValue"),
      tutorialModal: document.getElementById("tutorialModal"),
      tutorialPrevBtn: document.getElementById("tutorialPrevBtn"),
      tutorialNextBtn: document.getElementById("tutorialNextBtn"),
      tutorialSkipBtn: document.getElementById("tutorialSkipBtn"),
      tutorialCloseBtn: document.getElementById("tutorialCloseBtn"),
      tutorialIcon: document.getElementById("tutorialIcon"),
      tutorialTitle: document.getElementById("tutorialTitle"),
      tutorialText: document.getElementById("tutorialText"),
      tutorialStep: document.getElementById("tutorialStep"),
      statsModal: document.getElementById("statsModal"),
      statsBackdrop: document.getElementById("statsBackdrop"),
      statsCloseBtn: document.getElementById("statsCloseBtn"),
      statsGrid: document.getElementById("statsGrid"),
      statsResetBtn: document.getElementById("statsResetBtn"),
      replayModal: document.getElementById("replayModal"),
      replayBackdrop: document.getElementById("replayBackdrop"),
      replayCloseBtn: document.getElementById("replayCloseBtn"),
      replayTitle: document.getElementById("replayTitle"),
      replayMeta: document.getElementById("replayMeta"),
      replayCanvas: document.getElementById("replayCanvas"),
      replayScrubber: document.getElementById("replayScrubber"),
      replayPlayBtn: document.getElementById("replayPlayBtn"),
      replayPauseBtn: document.getElementById("replayPauseBtn"),
      replayStopBtn: document.getElementById("replayStopBtn"),
      replayTimeCurrent: document.getElementById("replayTimeCurrent"),
      replayTimeTotal: document.getElementById("replayTimeTotal")
    });
  };

  const originalSetupEngine = app.setupEngine;
  app.setupEngine = function () {
    originalSetupEngine.call(this);
    const baseOnPauseChanged = this.engine.ui.onPauseChanged;
    this.engine.ui.onPauseChanged = (paused) => {
      baseOnPauseChanged(paused);
      this.updatePauseOverlay();
      if (paused) this.phase6Vibrate("button");
    };
    const baseOnGameStart = this.engine.ui.onGameStart;
    this.engine.ui.onGameStart = (config) => {
      baseOnGameStart(config);
      this.syncPhase6RunStart(config);
      this.updatePauseOverlay();
    };
    this.engine.ui.sfxEnabled = () => !!this.progress.settings.soundEnabled;
  };

  const originalBindUi = app.bindUi;
  app.bindUi = function () {
    originalBindUi.call(this);
    if (ensurePhase6State(this).uiBound) return;
    ensurePhase6State(this).uiBound = true;

    document.body.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      this.handleAudioUnlock();
      ensurePhase6State(this).sound.play("button");
      this.phase6Vibrate("button");
    }, true);

    this.dom.statsBtn?.addEventListener("click", () => this.openStatsModal());
    this.dom.watchReplayEndBtn?.addEventListener("click", async () => {
      const phase6 = ensurePhase6State(this);
      if (phase6.pendingReplayIsBest && phase6.pendingReplayData) {
        this.openReplayViewer(phase6.pendingReplayModeKey, phase6.pendingReplayData, "end");
        return;
      }
      this.openReplayViewer(phase6.pendingReplayModeKey, null, "end");
    });

    this.dom.pauseResumeBtn?.addEventListener("click", () => this.engine.togglePause());
    this.dom.pauseRestartBtn?.addEventListener("click", () => {
      this.dom.pauseMenuOverlay.classList.remove("show");
      this.engine.restart();
    });
    this.dom.pauseQuitBtn?.addEventListener("click", () => {
      this.engine.stop();
      this.dom.pauseMenuOverlay.classList.remove("show");
      this.returnScreenAfterGame = "home";
      this.returnFromGame();
    });
    this.dom.pauseSettingsBtn?.addEventListener("click", () => this.openSettingsModal());
    this.dom.pauseReplayBtn?.addEventListener("click", () => this.openReplayViewer(this.getModeKey(this.currentConfig), null, "pause"));

    this.dom.settingsBackdrop?.addEventListener("click", () => this.closeSettingsModal());
    this.dom.closeSettingsModalBtn?.addEventListener("click", () => this.closeSettingsModal());
    this.dom.musicToggle?.addEventListener("change", () => this.applyPhase6Settings({ musicEnabled: this.dom.musicToggle.checked }));
    this.dom.soundToggle?.addEventListener("change", () => this.applyPhase6Settings({ soundEnabled: this.dom.soundToggle.checked }));
    this.dom.hapticsToggle?.addEventListener("change", () => this.applyPhase6Settings({ hapticsEnabled: this.dom.hapticsToggle.checked }));
    this.dom.musicVolume?.addEventListener("input", () => this.applyPhase6Settings({ musicVolume: Number(this.dom.musicVolume.value) / 100 }));
    this.dom.soundVolume?.addEventListener("input", () => this.applyPhase6Settings({ soundVolume: Number(this.dom.soundVolume.value) / 100 }));

    this.dom.tutorialPrevBtn?.addEventListener("click", () => {
      ensurePhase6State(this).tutorialIndex = Math.max(0, ensurePhase6State(this).tutorialIndex - 1);
      this.renderTutorialSlide();
    });
    this.dom.tutorialNextBtn?.addEventListener("click", () => {
      const phase6 = ensurePhase6State(this);
      if (phase6.tutorialIndex >= TUTORIAL_SLIDES.length - 1) this.closeTutorial(true);
      else {
        phase6.tutorialIndex += 1;
        this.renderTutorialSlide();
      }
    });
    this.dom.tutorialSkipBtn?.addEventListener("click", () => this.closeTutorial(true));
    this.dom.tutorialCloseBtn?.addEventListener("click", () => this.closeTutorial(true));

    this.dom.statsBackdrop?.addEventListener("click", () => this.closeStatsModal());
    this.dom.statsCloseBtn?.addEventListener("click", () => this.closeStatsModal());
    this.dom.statsGrid?.addEventListener("click", (event) => {
      const replayBtn = event.target.closest("button[data-open-replay]");
      if (replayBtn) this.openReplayViewer(replayBtn.dataset.openReplay, null, "stats");
    });
    this.dom.statsResetBtn?.addEventListener("click", async () => {
      if (!global.confirm("Reset Phase 6 stats, replays, and recent history for testing?")) return;
      await this.resetPhase6Stats();
    });

    this.dom.replayBackdrop?.addEventListener("click", () => this.closeReplayViewer());
    this.dom.replayCloseBtn?.addEventListener("click", () => this.closeReplayViewer());
    this.dom.replayPlayBtn?.addEventListener("click", () => this.playReplay());
    this.dom.replayPauseBtn?.addEventListener("click", () => this.pauseReplay());
    this.dom.replayStopBtn?.addEventListener("click", () => this.stopReplay());
    this.dom.replayScrubber?.addEventListener("input", () => {
      this.pauseReplay();
      this.renderReplayFrame(Number(this.dom.replayScrubber.value));
    });

    const swipeTarget = document.getElementById("gameCanvas");
    if (swipeTarget) {
      let startX = 0;
      let startY = 0;
      swipeTarget.addEventListener("touchstart", (event) => {
        if (!event.touches[0]) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
      }, { passive: true });
      swipeTarget.addEventListener("touchend", (event) => {
        if (!event.changedTouches[0]) return;
        const dx = event.changedTouches[0].clientX - startX;
        const dy = event.changedTouches[0].clientY - startY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        const dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? "right" : "left")
          : (dy > 0 ? "down" : "up");
        this.handleAudioUnlock();
        this.engine.queueDirection(dir);
      }, { passive: true });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (this.dom.replayModal?.classList.contains("open")) {
        event.preventDefault();
        this.closeReplayViewer();
        return;
      }
      if (this.dom.settingsModal?.classList.contains("open")) {
        event.preventDefault();
        this.closeSettingsModal();
        return;
      }
      if (this.dom.tutorialModal?.classList.contains("open")) {
        event.preventDefault();
        this.closeTutorial(true);
        return;
      }
      if (this.screens.game?.classList.contains("active") && this.engine?.running && !this.dom.gameEndOverlay.classList.contains("show")) {
        event.preventDefault();
        this.engine.togglePause();
      }
    });
  };

  const originalSwitchScreen = app.switchScreen;
  app.switchScreen = function (name) {
    if (name === "settings") {
      this.openSettingsModal();
      return;
    }
    originalSwitchScreen.call(this, name);
    ensurePhase6State(this).sound.setMusicState(name === "game" ? "game" : "menu");
  };

  const originalRenderAll = app.renderAll;
  app.renderAll = function () {
    originalRenderAll.call(this);
    this.renderSettingsModal();
    this.renderStatsModal();
  };

  const originalApplySettingsToUi = app.applySettingsToUi;
  app.applySettingsToUi = function () {
    originalApplySettingsToUi.call(this);
    this.renderSettingsModal();
  };

  const originalPersistProgress = app.persistProgress;
  app.persistProgress = function () {
    this.progress.settings = mergeSettings(this.progress.settings);
    this.progress.stats = mergeStats(this.progress.stats, this.progress);
    originalPersistProgress.call(this);
    this.renderSettingsModal();
    this.renderStatsModal();
  };

  const originalReturnFromGame = app.returnFromGame;
  app.returnFromGame = function () {
    originalReturnFromGame.call(this);
    ensurePhase6State(this).sound.setMusicState("menu");
    this.dom.pauseMenuOverlay?.classList.remove("show");
  };

  const originalUpdateGameHud = app.updateGameHud;
  app.updateGameHud = function (state, config) {
    originalUpdateGameHud.call(this, state, config);
    this.recordReplayFrame(state);
    const feverState = !!state.fever;
    if (feverState !== ensurePhase6State(this).lastFeverState) {
      ensurePhase6State(this).lastFeverState = feverState;
      ensurePhase6State(this).sound.setMusicState(feverState ? "fever" : "game");
    }
  };

  const originalHandleGameEvent = app.handleGameEvent;
  app.handleGameEvent = function (event) {
    originalHandleGameEvent.call(this, event);
    const phase6 = ensurePhase6State(this);
    if (phase6.recorder.active) {
      if (event.type === "food_eaten") phase6.recorder.markEvent("eat");
      if (event.type === "ai_eaten") phase6.recorder.markEvent("ai_eaten", { growth: event.growth || 0 });
      if (event.type === "power_up_collected") phase6.recorder.markEvent("power", { type: event.powerId || "cube" });
      if (event.type === "combo_changed") phase6.recorder.markEvent("combo", { combo: event.combo || 0 });
      if (event.type === "fever_activated") phase6.recorder.markEvent("fever_start");
      if (event.type === "fever_ended") phase6.recorder.markEvent("fever_end");
    }

    if (event.type === "food_eaten") {
      ensurePhase6State(this).sound.play("food");
      this.phase6Vibrate("food");
    }
    if (event.type === "ai_eaten") {
      ensurePhase6State(this).sound.play("ai");
      this.phase6Vibrate("ai");
    }
    if (event.type === "power_up_collected") {
      ensurePhase6State(this).sound.play("power");
      this.phase6Vibrate("power");
    }
    if (event.type === "fever_activated") {
      ensurePhase6State(this).sound.play("feverStart");
      this.phase6Vibrate("fever");
    }
    if (event.type === "fever_ended") ensurePhase6State(this).sound.play("feverEnd");
    if (event.type === "combo_changed" && event.combo && event.combo % 5 === 0) {
      ensurePhase6State(this).sound.play("combo");
      this.phase6Vibrate("combo");
    }
  };

  const originalCompleteDailyChallenge = app.completeDailyChallenge;
  app.completeDailyChallenge = function () {
    const before = this.progress.completedDailyChallenges.length;
    originalCompleteDailyChallenge.call(this);
    if (this.progress.completedDailyChallenges.length > before) {
      ensurePhase6State(this).sound.play("challenge");
      this.phase6Vibrate("challenge");
      this.progress.stats.totalDailyChallengesCompleted = this.progress.completedDailyChallenges.length;
      saveProgress(this.progress);
    }
  };

  const originalAnnounceAchievements = app.announceAchievements;
  app.announceAchievements = function (unlocks) {
    if (unlocks?.length) {
      ensurePhase6State(this).sound.play("achievement");
      this.phase6Vibrate("achievement");
    }
    originalAnnounceAchievements.call(this, unlocks);
  };

  const originalShowEndOverlay = app.showEndOverlay;
  app.showEndOverlay = function (result, onReturn) {
    ensurePhase6State(this).pendingReplayData = ensurePhase6State(this).recorder.finish(result);
    this.updateEndReplayButton(result);
    originalShowEndOverlay.call(this, result, onReturn);
  };

  const originalHandleGameEnd = app.handleGameEnd;
  app.handleGameEnd = function (result) {
    const modeKey = modeKeyFromConfig(result.config);
    const beforeBest = this.progress.stats?.bestScoresByMode?.[modeKey] || 0;
    originalHandleGameEnd.call(this, result);
    const coins = this.updateStatsFromResult(result);
    if (result.win) {
      ensurePhase6State(this).sound.play("levelWin");
      this.phase6Vibrate("levelWin");
    } else {
      ensurePhase6State(this).sound.play("gameOver");
      this.phase6Vibrate("gameOver");
    }

    const historyEntry = this.buildStatsHistoryEntry(result);
    ensurePhase6State(this).store.saveStatsHistory(historyEntry).then(() => this.refreshStatsHistory().then(() => this.renderStatsModal()));

    if ((ensurePhase6State(this).pendingReplayData && result.score > beforeBest) || result.score >= (this.progress.stats.bestScoresByMode[modeKey] || 0)) {
      const replay = ensurePhase6State(this).pendingReplayData;
      if (replay) {
        this.progress.replayMetaByMode[modeKey] = {
          score: replay.score,
          length: replay.length,
          duration: replay.duration,
          timestamp: replay.timestamp
        };
        ensurePhase6State(this).store.saveReplay(modeKey, replay).catch(() => {});
      }
    }

    this.progress.stats.bestScoresByMode[modeKey] = Math.max(this.progress.stats.bestScoresByMode[modeKey] || 0, result.score || 0);
    this.progress.stats.totalCoinsEarned = Math.max(this.progress.stats.totalCoinsEarned || 0, this.progress.lifetimeCoinsEarned || 0);
    this.progress.stats.highestScoreOverall = Math.max(this.progress.stats.highestScoreOverall || 0, result.score || 0);
    this.progress.stats.longestSnake = Math.max(this.progress.stats.longestSnake || 5, result.length || 5);
    this.progress.stats.longestStreak = Math.max(this.progress.stats.longestStreak || 1, this.progress.bestStreak || 1);
    this.progress.stats.totalCoinsSpent = Math.max(this.progress.stats.totalCoinsSpent || 0, this.progress.totalCoinsSpent || 0);
    this.progress.stats.totalDailyChallengesCompleted = this.progress.completedDailyChallenges.length;
    this.progress.stats.skinsUnlocked = this.progress.unlockedSkins.length;
    this.progress.stats.themesUnlocked = this.progress.unlockedThemes.length;
    this.progress.stats.upgradesPurchased = Object.values(this.progress.upgrades || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    saveProgress(this.progress);
    this.renderStatsModal();
    this.dom.watchReplayEndBtn.hidden = false;
    this.dom.watchReplayEndBtn.textContent = ensurePhase6State(this).pendingReplayIsBest ? "WATCH YOUR BEST RUN" : "WATCH BEST REPLAY";
    if (coins > 0) this.dom.finalCoins.textContent = coins.toLocaleString();
  };

  function wrapPurchase(methodName) {
    const original = app[methodName];
    app[methodName] = function (...args) {
      const beforeCoins = this.progress.totalCoins || 0;
      const beforePurchases = this.progress.shopPurchases || 0;
      original.apply(this, args);
      const spent = Math.max(0, beforeCoins - (this.progress.totalCoins || 0));
      if (spent > 0 || (this.progress.shopPurchases || 0) > beforePurchases) {
        this.progress.totalCoinsSpent += spent;
        this.progress.stats.totalCoinsSpent = Math.max(this.progress.stats.totalCoinsSpent || 0, this.progress.totalCoinsSpent || 0);
        this.progress.stats.upgradesPurchased = Object.values(this.progress.upgrades || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
        ensurePhase6State(this).sound.play("purchase");
        this.phase6Vibrate("purchase");
        saveProgress(this.progress);
        this.renderStatsModal();
      }
    };
  }

  wrapPurchase("buySkin");
  wrapPurchase("buyTheme");
  wrapPurchase("buyUpgrade");

  global.SnakePhase6 = {
    TUTORIAL_VERSION,
    modeKeyFromConfig,
    modeLabelFromKey
  };
})(window);
