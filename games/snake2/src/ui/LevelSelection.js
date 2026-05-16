export class LevelSelection {
  constructor(root) {
    this.root = root;
    this.track = root ? root.querySelector("[data-level-track]") : null;
    this.stageTrack = root ? root.querySelector("[data-stage-track]") : null;
    this.modeLabel = root ? root.querySelector("[data-level-mode-label]") : null;
    this.selected = null;
    this.selectedStage = 1;
    this.unlockedLevel = 1;
    this.currentLevel = 1;
    this.currentStage = 1;
    this.stagesPerLevel = 3;
    this.currentMode = "classic";
    this.selections = {
      classic: { level: 1, stage: 1 },
      speed: { level: 1, stage: 1 },
      survival: { level: 1, stage: 1 },
      duel: { level: 1, stage: 1 }
    };
    this.onSelect = () => {};
  }

  render(snapshot) {
    if (!this.track || !snapshot) return;
    this.currentMode = snapshot.mode || this.currentMode;
    const current = snapshot.stage;
    const unlockedLevel = snapshot.progress.unlockedLevel || snapshot.progress.level;
    const maxLevels = snapshot.meta?.maxLevels || 24;
    this.stagesPerLevel = snapshot.meta?.stagesPerLevel || 3;
    this.unlockedLevel = unlockedLevel;
    this.currentLevel = current.level;
    this.currentStage = current.stage;
    const savedSelection = this.selections[this.currentMode] || { level: current.level, stage: current.stage };
    this.selected = savedSelection.level || current.level;
    this.selectedStage = savedSelection.stage || current.stage;
    if (this.selected > unlockedLevel) {
      this.selected = current.level;
      this.selectedStage = current.stage;
    }
    this.selections[this.currentMode] = {
      level: this.selected,
      stage: this.selectedStage
    };
    if (this.modeLabel) {
      this.modeLabel.textContent = `${this.currentMode.charAt(0).toUpperCase()}${this.currentMode.slice(1)} Levels`;
    }
    const nodes = [];
    for (let i = 1; i <= maxLevels; i += 1) {
      const unlocked = i <= unlockedLevel;
      const active = i === this.selected;
      nodes.push(`
        <button class="level-node ${unlocked ? "unlocked" : "locked"} ${active ? "active" : ""}" data-level="${i}" type="button" ${unlocked ? "" : "disabled"}>
          <span class="level-node-label">L${i}</span>
          <span class="level-node-stars">${active ? "*" : unlocked ? "." : "x"}</span>
        </button>
      `);
    }
    this.track.innerHTML = nodes.join("");
    Array.from(this.track.querySelectorAll(".level-node.unlocked")).forEach((node) => {
      node.addEventListener("click", () => {
        this.selected = Number(node.dataset.level);
        this.selectedStage = 1;
        this.selections[this.currentMode] = {
          level: this.selected,
          stage: this.selectedStage
        };
        this.onSelect({ mode: this.currentMode, level: this.selected, stage: this.selectedStage });
        this.#renderStages();
      });
    });
    this.#renderStages();
  }

  getSelection() {
    return {
      level: this.selected || this.currentLevel || 1,
      stage: this.selectedStage || this.currentStage || 1
    };
  }

  #renderStages() {
    if (!this.stageTrack) return;
    const stageButtons = [];
    const selectedLevel = this.selected || this.currentLevel;
    const unlockedStageInCurrentLevel = selectedLevel < this.unlockedLevel ? this.stagesPerLevel : this.currentStage;
    for (let stage = 1; stage <= this.stagesPerLevel; stage += 1) {
      const unlocked = stage <= unlockedStageInCurrentLevel;
      const active = stage === this.selectedStage;
      stageButtons.push(`
        <button class="stage-node ${unlocked ? "unlocked" : "locked"} ${active ? "active" : ""}" data-stage="${stage}" type="button" ${unlocked ? "" : "disabled"}>
          Stage ${stage}
        </button>
      `);
    }
    this.stageTrack.innerHTML = stageButtons.join("");
    Array.from(this.stageTrack.querySelectorAll(".stage-node.unlocked")).forEach((node) => {
      node.addEventListener("click", () => {
        this.selectedStage = Number(node.dataset.stage);
        this.selections[this.currentMode] = {
          level: selectedLevel,
          stage: this.selectedStage
        };
        this.onSelect({ mode: this.currentMode, level: selectedLevel, stage: this.selectedStage });
        this.#renderStages();
      });
    });
  }
}
