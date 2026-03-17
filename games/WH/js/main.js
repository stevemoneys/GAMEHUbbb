import { showLevels, showTournamentLevels, showMultiplayerLevels } from "./screens.js";
import { hasSavedMatch, resumeSavedMatch, discardSavedMatch } from "./game.js";

const WH_RESUME_KEY = "whot_saved_match_v1";
const modeByMenuId = {
  quickPlay: "quick",
  tournamentPlay: "tournament",
  multiplayerPlay: "multiplayer"
};

const resumeModal = document.getElementById("resume-modal");
const resumeTitle = document.getElementById("resume-modal-title");
const resumeBody = document.getElementById("resume-modal-body");
const resumeContinue = document.getElementById("resume-continue");
const resumeNew = document.getElementById("resume-new");

function getSavedMode() {
  try {
    const raw = localStorage.getItem(WH_RESUME_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return "";
    return String(parsed.mode || "").toLowerCase();
  } catch {
    return "";
  }
}

function modeLabel(mode) {
  if (mode === "tournament") return "Tournament";
  if (mode === "multiplayer") return "Multiplayer";
  return "Quick Play";
}

function openResumeModal(mode, onContinue, onNewGame) {
  if (!resumeModal || !resumeContinue || !resumeNew) {
    if (onContinue()) return;
    onNewGame();
    return;
  }

  resumeTitle.textContent = "Resume Saved Match";
  resumeBody.textContent = `A saved ${modeLabel(mode)} game was found. Continue where you left off?`;
  resumeModal.classList.remove("hidden");

  const close = () => resumeModal.classList.add("hidden");
  const handleContinue = () => {
    close();
    if (!onContinue()) {
      onNewGame();
    }
  };
  const handleNew = () => {
    close();
    onNewGame();
  };

  resumeContinue.onclick = handleContinue;
  resumeNew.onclick = handleNew;
}

function goToModeLevels(mode) {
  document.getElementById("menu").classList.add("hidden");
  if (mode === "quick") {
    showLevels();
    return;
  }
  if (mode === "tournament") {
    showTournamentLevels();
    return;
  }
  showMultiplayerLevels();
}

function handleModeClick(mode) {
  const savedMode = getSavedMode();
  const hasSaved = hasSavedMatch();
  if (hasSaved && savedMode === mode) {
    openResumeModal(
      mode,
      () => resumeSavedMatch(),
      () => {
        discardSavedMatch();
        goToModeLevels(mode);
      }
    );
    return;
  }
  goToModeLevels(mode);
}

Object.keys(modeByMenuId).forEach(id => {
  const button = document.getElementById(id);
  if (!button) return;
  button.onclick = () => handleModeClick(modeByMenuId[id]);
});
