const LEVELS = 10;
const STAGES_PER_LEVEL = 10;
const TOTAL_STAGES = LEVELS * STAGES_PER_LEVEL;
const params = new URLSearchParams(window.location.search);

const MODE_CONFIG = {
  tournament: {
    title: "Tournament Road",
    subtitle: "Classic 4-player UNO. Unlock levels in order and take on stronger tables.",
    progressKey: "gamehub_uno_progress_tournament"
  },
  "quick-play": {
    title: "Quick Play Road",
    subtitle: "One-on-one against a single AI rival. Faster rounds, separate progression.",
    progressKey: "gamehub_uno_progress_quick_play"
  },
  "team-battle": {
    title: "2v2 Road",
    subtitle: "You and an AI teammate versus two AI opponents. Win together to climb.",
    progressKey: "gamehub_uno_progress_team_battle"
  }
};

const selectedMode = MODE_CONFIG[params.get("mode")] ? params.get("mode") : "tournament";
const activeConfig = MODE_CONFIG[selectedMode];

const levelRoad = document.getElementById("level-road");
const backBtn = document.getElementById("btn-back");
const headingEl = document.querySelector(".levels-header h1");
const subtitleEl = document.querySelector(".levels-header .subtitle");

function getProgress() {
  const fallback = localStorage.getItem("gamehub_uno_progress") || "1";
  const stored = parseInt(localStorage.getItem(activeConfig.progressKey) || fallback, 10);
  if (Number.isNaN(stored) || stored < 1) return 1;
  return Math.min(stored, TOTAL_STAGES);
}

function setProgress(value) {
  const clamped = Math.max(1, Math.min(value, TOTAL_STAGES));
  localStorage.setItem(activeConfig.progressKey, String(clamped));
}

function buildLevelMap() {
  if (!levelRoad) return;
  const progress = getProgress();
  levelRoad.innerHTML = '<div class="road-track"></div>';

  if (headingEl) headingEl.textContent = activeConfig.title;
  if (subtitleEl) subtitleEl.textContent = activeConfig.subtitle;

  const levelColors = [
    "#fbbf24",
    "#f97316",
    "#22c55e",
    "#3b82f6",
    "#ef4444",
    "#a855f7",
    "#06b6d4",
    "#eab308",
    "#10b981",
    "#f43f5e"
  ];

  for (let level = 1; level <= LEVELS; level += 1) {
    const group = document.createElement("div");
    group.className = "level-group";
    group.style.setProperty("--level-color", levelColors[level - 1]);

    const badge = document.createElement("div");
    badge.className = "level-badge";
    badge.textContent = String(level);

    const track = document.createElement("div");
    track.className = "stage-track";

    for (let stage = 1; stage <= STAGES_PER_LEVEL; stage += 1) {
      const index = (level - 1) * STAGES_PER_LEVEL + stage;
      const node = document.createElement("button");
      node.type = "button";
      node.className = "stage-node";
      node.textContent = String(stage);
      node.dataset.level = String(level);
      node.dataset.stage = String(stage);

      if (index < progress) node.classList.add("unlocked");
      if (index === progress) node.classList.add("unlocked", "current");
      if (index > progress) node.classList.add("locked");

      node.addEventListener("click", () => {
        if (index > progress) return;
        window.location.href = `game/index.html?mode=${selectedMode}&level=${level}&stage=${stage}`;
      });

      track.appendChild(node);
    }
    group.appendChild(badge);
    group.appendChild(track);
    levelRoad.appendChild(group);
  }
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

if (!localStorage.getItem(activeConfig.progressKey)) {
  setProgress(1);
}

buildLevelMap();
