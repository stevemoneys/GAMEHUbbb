/* GameHub Tic-Tac-Toe — Phase 10 player-data boundary.
   This is the only module that reads or writes browser storage. */
(function createTicTacToeSaveManager(global) {
  "use strict";

  const STORAGE_KEY = "tictactoe_player_save_v1";
  const CURRENT_VERSION = 1;
  const MAX_LEVEL = 20;
  const PERSONALITIES = ["human", "aggressive", "defensive", "trickster"];
  const ACHIEVEMENT_IDS = new Set([
    "first-victory", "getting-started", "halfway-there", "the-long-game", "watch-the-threat", "double-trouble", "fork-breaker", "think-ahead", "pressure-player", "calm-under-pressure", "wall-builder", "no-easy-opening", "draw-master", "read-the-human", "break-the-attack", "hold-the-line", "see-through-the-trick", "winning-habit", "unshaken", "complete-player", "tactical-student", "master-tactician"
  ]);
  const LEGACY_KEYS = {
    meta: "tictactoe_meta_progress_v1",
    audio: "tictactoe_audio_settings_v1",
    scoreX: "scoreX",
    scoreO: "scoreO",
    unlockedLevel: "unlockedLevel",
    savedMatch: "tictactoe_saved_match_v1"
  };
  const DEFAULT_AUDIO = { master: 1, music: 0.3, sfx: 0.65, musicEnabled: true, sfxEnabled: true };
  let currentSave;
  let persistenceAvailable = true;

  const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const finiteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const count = (value) => Math.max(0, Math.floor(finiteNumber(value, 0)));
  const level = (value, fallback = 1) => Math.min(MAX_LEVEL, Math.max(1, Math.floor(finiteNumber(value, fallback))));
  const timestamp = (value, fallback) => {
    const candidate = finiteNumber(value, fallback);
    return candidate > 0 ? candidate : fallback;
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function safeGet(key) {
    try { return global.localStorage?.getItem(key) ?? null; } catch { persistenceAvailable = false; return null; }
  }

  function safeSet(key, value) {
    try { global.localStorage?.setItem(key, value); return true; } catch { persistenceAvailable = false; return false; }
  }

  function safeRemove(key) {
    try { global.localStorage?.removeItem(key); } catch { persistenceAvailable = false; }
  }

  function parse(raw) {
    if (!raw || typeof raw !== "string") return null;
    try { const value = JSON.parse(raw); return isRecord(value) ? value : null; } catch { return null; }
  }

  function defaultPersonalityMastery() {
    return PERSONALITIES.reduce((result, personality) => {
      result[personality] = { victories: 0, highestLevelDefeated: 0, defeated: false };
      return result;
    }, {});
  }

  function createDefaultSave(now = Date.now()) {
    return {
      version: CURRENT_VERSION,
      profile: { createdAt: now, updatedAt: now },
      progression: {
        currentLevel: 1,
        levels: { highestUnlocked: 1, completed: [], highestCompleted: 0 },
        streaks: { current: 0, best: 0 },
        personalityMastery: defaultPersonalityMastery(),
        milestones: {}
      },
      statistics: { matches: 0, wins: 0, losses: 0, draws: 0, aiMatches: 0, twoPlayerMatches: 0, aiWins: 0, aiLosses: 0, aiDraws: 0, totalPersonalityVictories: 0, winsByLevel: {}, completionsByLevel: {} },
      achievements: {},
      settings: { selectedTheme: "default", selectedAIPersonality: "human", preferences: {}, audio: { ...DEFAULT_AUDIO } },
      cosmetics: { unlocked: [], selected: {} },
      scores: { x: 0, o: 0 }
    };
  }

  function normalizeLevelMap(source) {
    if (!isRecord(source)) return {};
    return Object.entries(source).reduce((result, [key, value]) => {
      const keyLevel = finiteNumber(key, 0);
      if (Number.isInteger(keyLevel) && keyLevel >= 1 && keyLevel <= MAX_LEVEL) result[keyLevel] = count(value);
      return result;
    }, {});
  }

  function normalizeAudio(source) {
    const candidate = isRecord(source) ? source : {};
    const volume = (value, fallback) => Math.min(1, Math.max(0, finiteNumber(value, fallback)));
    return {
      master: volume(candidate.master, DEFAULT_AUDIO.master),
      music: volume(candidate.music, DEFAULT_AUDIO.music),
      sfx: volume(candidate.sfx, DEFAULT_AUDIO.sfx),
      musicEnabled: typeof candidate.musicEnabled === "boolean" ? candidate.musicEnabled : DEFAULT_AUDIO.musicEnabled,
      sfxEnabled: typeof candidate.sfxEnabled === "boolean" ? candidate.sfxEnabled : DEFAULT_AUDIO.sfxEnabled
    };
  }

  function normalizeSave(raw) {
    const defaults = createDefaultSave();
    const source = isRecord(raw) ? raw : {};
    const progress = isRecord(source.progression) ? source.progression : {};
    const sourceLevels = isRecord(progress.levels) ? progress.levels : {};
    const completed = [...new Set((Array.isArray(sourceLevels.completed) ? sourceLevels.completed : [])
      .map((entry) => finiteNumber(entry, 0))
      .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= MAX_LEVEL))].sort((a, b) => a - b);
    const personalities = defaultPersonalityMastery();
    PERSONALITIES.forEach((personality) => {
      const sourceMastery = isRecord(progress.personalityMastery?.[personality]) ? progress.personalityMastery[personality] : {};
      const victories = count(sourceMastery.victories);
      personalities[personality] = {
        victories,
        highestLevelDefeated: Math.min(MAX_LEVEL, count(sourceMastery.highestLevelDefeated)),
        defeated: sourceMastery.defeated === true || victories > 0
      };
    });
    const sourceStats = isRecord(source.statistics) ? source.statistics : {};
    const statistics = Object.fromEntries(Object.keys(defaults.statistics).map((key) => [
      key,
      key === "winsByLevel" || key === "completionsByLevel" ? normalizeLevelMap(sourceStats[key]) : count(sourceStats[key])
    ]));
    statistics.matches = Math.max(statistics.matches, statistics.wins + statistics.losses + statistics.draws, statistics.aiMatches + statistics.twoPlayerMatches);
    statistics.aiMatches = Math.max(statistics.aiMatches, statistics.aiWins + statistics.aiLosses + statistics.aiDraws);
    const achievements = Object.entries(isRecord(source.achievements) ? source.achievements : {}).reduce((result, [id, value]) => {
      if (ACHIEVEMENT_IDS.has(id) && finiteNumber(value, 0) > 0) result[id] = finiteNumber(value, 0);
      return result;
    }, {});
    const sourceSettings = isRecord(source.settings) ? source.settings : {};
    const sourceCosmetics = isRecord(source.cosmetics) ? source.cosmetics : {};
    const highestUnlocked = Math.max(completed.length ? Math.max(...completed) : 1, level(sourceLevels.highestUnlocked, 1));
    const currentStreak = count(progress.streaks?.current);
    const now = Date.now();

    return {
      version: CURRENT_VERSION,
      profile: { createdAt: timestamp(source.profile?.createdAt, now), updatedAt: timestamp(source.profile?.updatedAt, now) },
      progression: {
        currentLevel: Math.min(highestUnlocked, level(progress.currentLevel, 1)),
        levels: { highestUnlocked, completed, highestCompleted: completed.length ? Math.max(...completed) : 0 },
        streaks: { current: currentStreak, best: Math.max(currentStreak, count(progress.streaks?.best)) },
        personalityMastery: personalities,
        milestones: isRecord(progress.milestones) ? clone(progress.milestones) : {}
      },
      statistics,
      achievements,
      settings: {
        selectedTheme: sourceSettings.selectedTheme === "default" ? "default" : "default",
        selectedAIPersonality: PERSONALITIES.includes(sourceSettings.selectedAIPersonality) ? sourceSettings.selectedAIPersonality : "human",
        preferences: isRecord(sourceSettings.preferences) ? clone(sourceSettings.preferences) : {},
        audio: normalizeAudio(sourceSettings.audio)
      },
      cosmetics: { unlocked: Array.isArray(sourceCosmetics.unlocked) ? [...new Set(sourceCosmetics.unlocked.filter((entry) => typeof entry === "string"))] : [], selected: isRecord(sourceCosmetics.selected) ? clone(sourceCosmetics.selected) : {} },
      scores: { x: count(source.scores?.x), o: count(source.scores?.o) }
    };
  }

  function readLegacySave() {
    const meta = parse(safeGet(LEGACY_KEYS.meta));
    const audio = parse(safeGet(LEGACY_KEYS.audio));
    const unlocked = level(safeGet(LEGACY_KEYS.unlockedLevel), 1);
    const legacyLevels = isRecord(meta?.levels) ? meta.levels : {};
    return {
      version: CURRENT_VERSION,
      profile: meta?.profile,
      progression: {
        currentLevel: 1,
        levels: {
          highestUnlocked: Math.max(unlocked, level(legacyLevels.highestUnlocked, 1)),
          completed: Array.isArray(legacyLevels.completed) ? legacyLevels.completed : Array.from({ length: Math.max(0, unlocked - 1) }, (_, index) => index + 1),
          highestCompleted: legacyLevels.highestCompleted
        },
        streaks: meta?.streaks,
        personalityMastery: meta?.personalityMastery,
        milestones: meta?.milestones
      },
      statistics: meta?.statistics,
      achievements: meta?.achievements,
      settings: { audio },
      scores: { x: safeGet(LEGACY_KEYS.scoreX), o: safeGet(LEGACY_KEYS.scoreO) }
    };
  }

  // Current production schema is v1. Future migrations belong in this map as
  // functions keyed by the version they migrate *from*.
  const migrations = {};
  function migrate(raw) {
    if (!isRecord(raw)) return null;
    const version = Number(raw.version);
    if (!Number.isInteger(version)) return null;
    if (version > CURRENT_VERSION) return null;
    let migrated = clone(raw);
    let activeVersion = version;
    while (activeVersion < CURRENT_VERSION) {
      const migration = migrations[activeVersion];
      if (typeof migration !== "function") return null;
      migrated = migration(migrated);
      activeVersion += 1;
    }
    return migrated;
  }

  function removeLegacyKeys() {
    Object.values(LEGACY_KEYS).forEach(safeRemove);
  }

  function load() {
    const serialized = safeGet(STORAGE_KEY);
    const persisted = migrate(parse(serialized));
    const usedLegacy = !persisted;
    currentSave = normalizeSave(persisted || readLegacySave());
    const wrote = save();
    if (usedLegacy && wrote) removeLegacyKeys();
    return currentSave;
  }

  function get() { return currentSave || load(); }

  function save() {
    if (!currentSave) currentSave = createDefaultSave();
    currentSave.profile.updatedAt = Date.now();
    return safeSet(STORAGE_KEY, JSON.stringify(currentSave));
  }

  function update(mutator) {
    const draft = get();
    if (typeof mutator === "function") mutator(draft);
    currentSave = normalizeSave(draft);
    save();
    return currentSave;
  }

  function reset() {
    currentSave = createDefaultSave();
    save();
    removeLegacyKeys();
    return currentSave;
  }

  global.TicTacToeSave = Object.freeze({ STORAGE_KEY, CURRENT_VERSION, createDefaultSave, load, get, update, save, reset, normalizeSave, isPersistenceAvailable: () => persistenceAvailable });
}(window));
