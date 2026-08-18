export class SettingsPanel {
  constructor(root) {
    this.root = root;
    this.onChange = () => {};
    this.state = {
      quality: "auto",
      vibration: true,
      audio: true
    };
  }

  init() {
    if (!this.root) return;
    const qualitySelect = this.root.querySelector("select[name='quality']");
    const vibrationToggle = this.root.querySelector("input[name='vibration']");
    const audioToggle = this.root.querySelector("input[name='audio']");
    if (qualitySelect) qualitySelect.value = this.state.quality;
    if (vibrationToggle) vibrationToggle.checked = this.state.vibration;
    if (audioToggle) audioToggle.checked = this.state.audio;

    this.root.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
      if (target.name === "quality") this.state.quality = target.value;
      if (target.name === "vibration") this.state.vibration = target.checked;
      if (target.name === "audio") this.state.audio = target.checked;
      this.onChange({ ...this.state });
    });
  }

  setState(nextState = {}) {
    this.state = {
      ...this.state,
      ...nextState
    };
    this.#syncDom();
  }

  setAudioEnabled(enabled) {
    this.state.audio = Boolean(enabled);
    this.#syncDom();
    this.onChange({ ...this.state });
  }

  #syncDom() {
    if (!this.root) return;
    const qualitySelect = this.root.querySelector("select[name='quality']");
    const vibrationToggle = this.root.querySelector("input[name='vibration']");
    const audioToggle = this.root.querySelector("input[name='audio']");

    if (qualitySelect instanceof HTMLSelectElement) qualitySelect.value = this.state.quality;
    if (vibrationToggle instanceof HTMLInputElement) vibrationToggle.checked = this.state.vibration;
    if (audioToggle instanceof HTMLInputElement) audioToggle.checked = this.state.audio;
  }
}
