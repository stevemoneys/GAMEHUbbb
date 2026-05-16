const STORAGE_KEY = "snake2_theme_unlocks_v1";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function emptyState() {
  return {
    unlockedIds: [],
    equippedId: null,
    stats: {
      bestScore: 0,
      maxCombo: 0,
      totalSurvival: 0,
      duelWins: 0,
      completedStages: 0,
      highestAiLevel: 1,
      speedRuns: 0,
      matches: 0,
      collectionBonus: 0
    }
  };
}

export class ThemeUnlockSystem {
  constructor() {
    this.state = emptyState();
    this.#load();
  }

  #load() {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = safeParse(raw);
    if (!parsed) return;
    this.state.unlockedIds = Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [];
    this.state.equippedId = parsed.equippedId || null;
    this.state.stats = {
      ...emptyState().stats,
      ...(parsed.stats || {})
    };
  }

  #save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  ensureDefaults(themes) {
    const known = new Set(themes.map((theme) => theme.id));
    this.state.unlockedIds = this.state.unlockedIds.filter((id) => known.has(id));

    for (let i = 0; i < themes.length; i += 1) {
      const theme = themes[i];
      if (theme.defaultUnlocked && !this.state.unlockedIds.includes(theme.id)) {
        this.state.unlockedIds.push(theme.id);
      }
    }

    if (!this.state.equippedId || !this.state.unlockedIds.includes(this.state.equippedId)) {
      this.state.equippedId = this.state.unlockedIds[0] || themes[0]?.id || null;
    }

    this.#save();
  }

  getEquippedId() {
    return this.state.equippedId;
  }

  setEquippedId(themeId) {
    if (!this.isUnlocked(themeId)) return false;
    this.state.equippedId = themeId;
    this.#save();
    return true;
  }

  getUnlockedIds() {
    return [...this.state.unlockedIds];
  }

  isUnlocked(themeId) {
    return this.state.unlockedIds.includes(themeId);
  }

  updateFromProgress(snapshot) {
    if (!snapshot) return;
    this.state.stats.completedStages = Math.max(
      this.state.stats.completedStages,
      snapshot.progress?.completedStages || 0
    );
    this.state.stats.highestAiLevel = Math.max(
      this.state.stats.highestAiLevel,
      snapshot.stage?.aiLevel || 1
    );
    this.#save();
  }

  recordMatch(data = {}) {
    const score = Math.max(0, Math.floor(data.score || 0));
    const combo = Math.max(0, Math.floor(data.maxCombo || 0));
    const survival = Math.max(0, Number(data.survivalTime || 0));

    this.state.stats.matches += 1;
    this.state.stats.bestScore = Math.max(this.state.stats.bestScore, score);
    this.state.stats.maxCombo = Math.max(this.state.stats.maxCombo, combo);
    this.state.stats.totalSurvival += survival;

    if (data.mode === "duel" && data.playerWon) {
      this.state.stats.duelWins += 1;
    }
    if (data.mode === "speed") {
      this.state.stats.speedRuns += 1;
    }

    if (Number.isFinite(data.aiLevel)) {
      this.state.stats.highestAiLevel = Math.max(this.state.stats.highestAiLevel, data.aiLevel);
    }

    this.#save();
  }

  evaluateUnlocks(themes) {
    const unlockedNow = [];
    for (let i = 0; i < themes.length; i += 1) {
      const theme = themes[i];
      if (this.state.unlockedIds.includes(theme.id)) continue;

      if (this.#passesRequirement(theme.unlock, themes.length)) {
        this.state.unlockedIds.push(theme.id);
        unlockedNow.push(theme.id);
      }
    }

    if (unlockedNow.length > 0) this.#save();
    return unlockedNow;
  }

  getStats() {
    return { ...this.state.stats };
  }

  getCompletion(themes) {
    const total = Math.max(1, themes.length);
    const unlocked = this.state.unlockedIds.length;
    return {
      unlocked,
      total,
      ratio: unlocked / total
    };
  }

  #passesRequirement(requirement, themeCount) {
    if (!requirement || requirement.type === "starter") return true;
    const target = Number(requirement.value || 0);
    const stats = this.state.stats;

    if (requirement.type === "score") return stats.bestScore >= target;
    if (requirement.type === "completedStages") return stats.completedStages >= target;
    if (requirement.type === "duelWins") return stats.duelWins >= target;
    if (requirement.type === "survival") return stats.totalSurvival >= target;
    if (requirement.type === "combo") return stats.maxCombo >= target;
    if (requirement.type === "aiLevel") return stats.highestAiLevel >= target;
    if (requirement.type === "speedRuns") return stats.speedRuns >= target;
    if (requirement.type === "collection") {
      const ratio = (this.state.unlockedIds.length / Math.max(1, themeCount)) * 100;
      return ratio >= target;
    }
    if (requirement.type === "secret") {
      return stats.duelWins >= 16 && stats.bestScore >= 400 && stats.maxCombo >= 8;
    }

    return false;
  }
}