const LEVELS = 10;
const STAGES_PER_LEVEL = 10;
const TOTAL_STAGES = LEVELS * STAGES_PER_LEVEL;
const LANDSCAPE_INTENT_KEY = "gamehub_uno_landscape_intent";
const params = new URLSearchParams(window.location.search);

const MODE_CONFIG = {
  tournament: {
    title: "Tournament Road",
    subtitle: "Classic 4-player UNO. Unlock levels in order and take on stronger tables.",
    progressKey: "gamehub_uno_progress_tournament",
    resumeKey: "gamehub_uno_resume_tournament"
  },
  "quick-play": {
    title: "Quick Play Road",
    subtitle: "One-on-one against a single AI rival. Faster rounds, separate progression.",
    progressKey: "gamehub_uno_progress_quick_play",
    resumeKey: "gamehub_uno_resume_quick_play"
  },
  "team-battle": {
    title: "2v2 Road",
    subtitle: "You and an AI teammate versus two AI opponents. Win together to climb.",
    progressKey: "gamehub_uno_progress_team_battle",
    resumeKey: "gamehub_uno_resume_team_battle"
  }
};

const selectedMode = MODE_CONFIG[params.get("mode")] ? params.get("mode") : "tournament";
const activeConfig = MODE_CONFIG[selectedMode];

const levelRoad = document.getElementById("level-road");
const backBtn = document.getElementById("btn-back");
const headingEl = document.querySelector(".levels-header h1");
const subtitleEl = document.querySelector(".levels-header .subtitle");
const resumePanel = document.getElementById("resume-panel");
const resumeMeta = document.getElementById("resume-meta");
const resumeBtn = document.getElementById("btn-resume-match");
const rotateOverlay = document.getElementById("rotate-overlay");
let fullscreenWatchdogId = null;

function markLandscapeIntent() {
  try {
    sessionStorage.setItem(LANDSCAPE_INTENT_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

function isPortraitOrientation() {
  return window.matchMedia("(orientation: portrait)").matches;
}

function updateRotateOverlay() {
  if (!rotateOverlay) return;
  rotateOverlay.classList.toggle("hidden", !isPortraitOrientation());
}

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

function loadResumeSnapshot() {
  try {
    const raw = localStorage.getItem(activeConfig.resumeKey);
    const parsed = JSON.parse(raw || "null");
    if (!parsed || parsed.mode !== selectedMode || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearResumeSnapshot() {
  localStorage.removeItem(activeConfig.resumeKey);
}

async function requestFullscreenMode() {
  const target = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement || !target) return;
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: "hide" });
      return;
    }
    if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
    }
  } catch {
    // Mobile browsers can reject fullscreen without a fresh gesture.
  }
}

async function tryLockOrientation() {
  if (!screen.orientation?.lock) return;
  try {
    await screen.orientation.lock("landscape");
  } catch {
    // Orientation lock can fail on some devices or without user gesture.
  }
}

async function activateLandscapeMode() {
  await requestFullscreenMode();
  await tryLockOrientation();
  updateRotateOverlay();
}

function startFullscreenWatchdog() {
  if (fullscreenWatchdogId) {
    window.clearInterval(fullscreenWatchdogId);
    fullscreenWatchdogId = null;
  }
  let tries = 0;
  fullscreenWatchdogId = window.setInterval(() => {
    tries += 1;
    activateLandscapeMode();
    const fullscreenReady = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    const landscapeReady = !isPortraitOrientation();
    if ((fullscreenReady && landscapeReady) || tries >= 28) {
      window.clearInterval(fullscreenWatchdogId);
      fullscreenWatchdogId = null;
    }
  }, 320);
}

async function goToStage(level, stage, options = {}) {
  const { resume = false } = options;
  markLandscapeIntent();
  await activateLandscapeMode();
  startFullscreenWatchdog();
  if (!resume) clearResumeSnapshot();
  const resumeSuffix = resume ? "&resume=1" : "";
  window.location.href = `game/index.html?mode=${selectedMode}&level=${level}&stage=${stage}${resumeSuffix}`;
}

function renderResumePanel() {
  const snapshot = loadResumeSnapshot();
  if (!resumePanel || !resumeBtn || !resumeMeta || !snapshot) {
    resumePanel?.classList.add("hidden");
    return;
  }

  const stageNumber = Math.max(1, parseInt(snapshot.stage || "1", 10));
  const levelNumber = Math.max(1, parseInt(snapshot.level || "1", 10));
  const savedAt = snapshot.savedAt ? new Date(snapshot.savedAt) : null;
  const timeLabel = savedAt && !Number.isNaN(savedAt.getTime())
    ? savedAt.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "recently";

  resumeMeta.textContent = `Level ${levelNumber} - Stage ${stageNumber} - saved ${timeLabel}`;
  resumePanel.classList.remove("hidden");
  resumeBtn.onclick = () => goToStage(levelNumber, stageNumber, { resume: true });
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
        goToStage(level, stage);
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

markLandscapeIntent();
updateRotateOverlay();
activateLandscapeMode();
startFullscreenWatchdog();
document.body.addEventListener("touchstart", activateLandscapeMode, { once: true, passive: true });
document.body.addEventListener("pointerdown", activateLandscapeMode, { once: true });
window.addEventListener("pageshow", () => {
  activateLandscapeMode();
  startFullscreenWatchdog();
});
window.addEventListener("orientationchange", updateRotateOverlay);
window.addEventListener("resize", updateRotateOverlay);
document.addEventListener("fullscreenchange", updateRotateOverlay);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  activateLandscapeMode();
  startFullscreenWatchdog();
});

buildLevelMap();
renderResumePanel();
