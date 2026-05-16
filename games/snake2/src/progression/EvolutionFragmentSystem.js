const STORAGE_KEY = "snake2_evolution_fragments_v1";

function loadState() {
  if (typeof localStorage === "undefined") return { fragments: 0, collected: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      fragments: Math.max(0, parsed.fragments || 0),
      collected: Math.max(0, parsed.collected || 0)
    };
  } catch (_error) {
    return { fragments: 0, collected: 0 };
  }
}

export class EvolutionFragmentSystem {
  constructor() {
    this.state = loadState();
  }

  add(amount = 1) {
    const value = Math.max(0, Math.floor(amount || 0));
    this.state.fragments += value;
    this.state.collected += value;
    this.#save();
    return this.state.fragments;
  }

  getSnapshot() {
    return { ...this.state };
  }

  #save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}
