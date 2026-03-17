const LEVELS = 10;
const STAGES_PER_LEVEL = 10;
const TOTAL_STAGES = LEVELS * STAGES_PER_LEVEL;
const PROGRESS_KEY = "gamehub_uno_progress";

const levelRoad = document.getElementById("level-road");
const backBtn = document.getElementById("btn-back");

function getProgress() {
  const stored = parseInt(localStorage.getItem(PROGRESS_KEY) || "1", 10);
  if (Number.isNaN(stored) || stored < 1) return 1;
  return Math.min(stored, TOTAL_STAGES);
}

function setProgress(value) {
  const clamped = Math.max(1, Math.min(value, TOTAL_STAGES));
  localStorage.setItem(PROGRESS_KEY, String(clamped));
}

function buildLevelMap() {
  if (!levelRoad) return;
  const progress = getProgress();
  levelRoad.innerHTML = '<div class="road-track"></div>';

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
        window.location.href = `game/index.html?level=${level}&stage=${stage}`;
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

if (!localStorage.getItem(PROGRESS_KEY)) {
  setProgress(1);
}

buildLevelMap();
