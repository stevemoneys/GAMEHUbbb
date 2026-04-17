import {
  DEFAULT_THEME_ID,
  THEME_DEFINITIONS,
  THEME_PROGRESS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  THEME_UNLOCK_STORAGE_KEY,
  createDefaultThemeProgress,
  getThemeById,
  isThemeUnlockedByProgress,
  normalizeThemeProgress
} from "./themes.js";

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures.
  }
}

export function createThemeManager({ storage = window.localStorage, documentRef = document } = {}) {
  const listeners = new Set();
  const root = documentRef.documentElement;
  const body = documentRef.body;

  let progress = normalizeThemeProgress(readJson(storage, THEME_PROGRESS_STORAGE_KEY, createDefaultThemeProgress()));
  let unlocked = readJson(storage, THEME_UNLOCK_STORAGE_KEY, [DEFAULT_THEME_ID]);
  let activeTheme = getThemeById(DEFAULT_THEME_ID);

  if (!Array.isArray(unlocked)) {
    unlocked = [DEFAULT_THEME_ID];
  }

  if (!unlocked.includes(DEFAULT_THEME_ID)) {
    unlocked.push(DEFAULT_THEME_ID);
  }

  syncUnlocksFromProgress();
  persistUnlocks();

  function notify(meta = {}) {
    const payload = {
      theme: activeTheme,
      unlocked: getUnlockedThemeIds(),
      progress: getProgress(),
      ...meta
    };

    for (const listener of listeners) {
      listener(payload);
    }
  }

  function persistUnlocks() {
    writeJson(storage, THEME_UNLOCK_STORAGE_KEY, getUnlockedThemeIds());
  }

  function persistProgress() {
    writeJson(storage, THEME_PROGRESS_STORAGE_KEY, progress);
  }

  function getUnlockedThemeIds() {
    return Array.from(new Set(unlocked));
  }

  function syncUnlocksFromProgress() {
    for (const theme of THEME_DEFINITIONS) {
      if (isThemeUnlockedByProgress(theme, progress) && !unlocked.includes(theme.id)) {
        unlocked.push(theme.id);
      }
    }
  }

  function loadTheme() {
    let storedThemeId = DEFAULT_THEME_ID;
    try {
      storedThemeId = storage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
    } catch (error) {
      storedThemeId = DEFAULT_THEME_ID;
    }
    const requested = getThemeById(storedThemeId || DEFAULT_THEME_ID);

    if (!isUnlocked(requested.id)) {
      activeTheme = getThemeById(DEFAULT_THEME_ID);
    } else {
      activeTheme = requested;
    }

    applyTheme(activeTheme);
    notify({ type: "load" });
    return activeTheme;
  }

  function setTheme(themeId) {
    const requested = getThemeById(themeId);
    if (!isUnlocked(requested.id)) {
      return false;
    }

    activeTheme = requested;
    applyTheme(activeTheme);

    try {
      storage.setItem(THEME_STORAGE_KEY, activeTheme.id);
    } catch (error) {
      // Ignore storage write failures.
    }

    notify({ type: "set" });
    return true;
  }

  function getTheme() {
    return activeTheme;
  }

  function applyTheme(theme) {
    const safeTheme = theme || getThemeById(DEFAULT_THEME_ID);
    const colors = safeTheme.colors || {};
    const animation = safeTheme.animationProfile || {};
    const intensity = safeTheme.effectIntensity || {};

    body.classList.add("theme-transitioning");
    window.setTimeout(() => {
      body.classList.remove("theme-transitioning");
    }, 380);

    body.dataset.activeTheme = safeTheme.id;
    root.style.setProperty("--theme-id", safeTheme.id);
    root.style.setProperty("--text-main", colors.textMain || "#f3f6ff");
    root.style.setProperty("--text-soft", colors.textSoft || "#aab5cc");
    root.style.setProperty("--panel-top", colors.panelTop || "rgba(30, 40, 63, 0.96)");
    root.style.setProperty("--panel-bottom", colors.panelBottom || "rgba(18, 24, 38, 0.96)");
    root.style.setProperty("--board-cell-top", colors.boardCellTop || "#151c2d");
    root.style.setProperty("--board-cell-bottom", colors.boardCellBottom || "#090c14");
    root.style.setProperty("--theme-anim-speed", String(animation.speed || 1));
    root.style.setProperty("--theme-anim-scale", String(animation.scale || 1));
    root.style.setProperty("--theme-anim-easing", animation.easing || "cubic-bezier(0.2, 0.9, 0.2, 1)");
    root.style.setProperty("--theme-feedback-multiplier", String(intensity.multiplier || 1));
  }

  function isUnlocked(themeId) {
    return unlocked.includes(themeId);
  }

  function getUnlockedThemes() {
    return THEME_DEFINITIONS.filter((theme) => isUnlocked(theme.id));
  }

  function getProgress() {
    return { ...progress };
  }

  function updateProgress(nextProgress) {
    const previousUnlocked = new Set(getUnlockedThemeIds());
    const safeNext = normalizeThemeProgress({
      gamesPlayed: Math.max(progress.gamesPlayed, Number(nextProgress?.gamesPlayed || 0)),
      bestScore: Math.max(progress.bestScore, Number(nextProgress?.bestScore || 0)),
      maxTile: Math.max(progress.maxTile, Number(nextProgress?.maxTile || 0))
    });

    progress = safeNext;
    persistProgress();
    syncUnlocksFromProgress();
    persistUnlocks();

    const newlyUnlocked = getUnlockedThemeIds().filter((themeId) => !previousUnlocked.has(themeId)).map((themeId) => getThemeById(themeId));
    if (newlyUnlocked.length > 0) {
      notify({ type: "unlock", unlockedNow: newlyUnlocked });
    }

    return newlyUnlocked;
  }

  function incrementGamesPlayed() {
    return updateProgress({ ...progress, gamesPlayed: progress.gamesPlayed + 1 });
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    loadTheme,
    setTheme,
    getTheme,
    applyTheme,
    isUnlocked,
    getUnlockedThemes,
    getUnlockedThemeIds,
    getProgress,
    updateProgress,
    incrementGamesPlayed,
    subscribe
  };
}
