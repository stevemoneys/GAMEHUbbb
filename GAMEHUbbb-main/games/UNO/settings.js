const SETTING_KEYS = {
  music: "gamehub_uno_setting_music",
  sfx: "gamehub_uno_setting_sfx",
  reactions: "gamehub_uno_setting_reactions",
  speech: "gamehub_uno_setting_speech"
};

const backBtn = document.getElementById("btn-back");

function isEnabled(key) {
  return localStorage.getItem(key) !== "off";
}

function setEnabled(key, enabled) {
  localStorage.setItem(key, enabled ? "on" : "off");
}

function renderToggle(button) {
  const setting = button.dataset.setting;
  const key = SETTING_KEYS[setting];
  if (!key) return;
  const enabled = isEnabled(key);
  button.textContent = enabled ? "ON" : "OFF";
  button.classList.toggle("is-on", enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
}

document.querySelectorAll(".setting-toggle").forEach((button) => {
  renderToggle(button);
  button.addEventListener("click", () => {
    const setting = button.dataset.setting;
    const key = SETTING_KEYS[setting];
    if (!key) return;
    const next = !isEnabled(key);
    setEnabled(key, next);
    renderToggle(button);
  });
});

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}
