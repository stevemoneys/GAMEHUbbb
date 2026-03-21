import { initGame } from "./game.js";
import { state } from "./state.js";

export const MAX_LEVELS = 50;
export const MAX_TOURNAMENT_ROUNDS = 30;
export const MAX_MULTIPLAYER_ROUNDS = 30;

export function showLevels() {
  state.mode = "quick";

  const levels = document.getElementById("levels");
  const game = document.getElementById("game");

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("quickUI")?.classList.add("hidden");
  document.getElementById("hubBackBtn")?.classList.add("hidden");

  game.classList.add("hidden");
  levels.classList.remove("hidden");

  const unlocked = Number(localStorage.getItem("whotLevel")) || 1;

  let html = `
    <div class="levels-head">
      <button class="levels-back" onclick="goHome()">Back</button>
      <div>
        <p class="levels-eyebrow">Quick Play</p>
        <h2>Select Level</h2>
        <p class="levels-sub">Unlocked: ${unlocked}/${MAX_LEVELS}</p>
      </div>
    </div>
    <div class="level-grid">
  `;

  for (let i = 1; i <= MAX_LEVELS; i += 1) {
    const locked = i > unlocked;
    html += `
      <button class="level-tile ${locked ? "locked" : ""}" data-level="${i}" ${locked ? "disabled" : ""}>
        <span class="level-id">L${i}</span>
        <span class="level-state">${locked ? "Locked" : "Play"}</span>
      </button>
    `;
  }

  html += `</div>`;
  levels.innerHTML = html;

  document.querySelectorAll("button[data-level]:not(.locked)").forEach((button) => {
    button.onclick = () => {
      levels.classList.add("hidden");
      initGame(Number(button.dataset.level));
    };
  });
}

export function showTournamentLevels() {
  state.mode = "tournament";

  const levels = document.getElementById("levels");
  const game = document.getElementById("game");

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("quickUI")?.classList.add("hidden");
  document.getElementById("hubBackBtn")?.classList.add("hidden");

  game.classList.add("hidden");
  levels.classList.remove("hidden");

  const unlocked = Number(localStorage.getItem("whotTournamentLevel")) || 1;

  let html = `
    <div class="levels-head">
      <button class="levels-back" onclick="goHome()">Back</button>
      <div>
        <p class="levels-eyebrow">Tournament</p>
        <h2>Tournament Rounds</h2>
        <p class="levels-sub">Unlocked: ${unlocked}/${MAX_TOURNAMENT_ROUNDS}</p>
      </div>
    </div>
    <div class="level-grid">
  `;

  for (let i = 1; i <= MAX_TOURNAMENT_ROUNDS; i += 1) {
    const locked = i > unlocked;
    html += `
      <button class="level-tile ${locked ? "locked" : ""}" data-tournament="${i}" ${locked ? "disabled" : ""}>
        <span class="level-id">R${i}</span>
        <span class="level-state">${locked ? "Locked" : "Play"}</span>
      </button>
    `;
  }

  html += `</div>`;
  levels.innerHTML = html;

  document.querySelectorAll("button[data-tournament]:not(.locked)").forEach((button) => {
    button.onclick = () => {
      levels.classList.add("hidden");
      initGame(Number(button.dataset.tournament));
    };
  });
}

export function showMultiplayerLevels() {
  state.mode = "multiplayer";

  const levels = document.getElementById("levels");
  const game = document.getElementById("game");

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("quickUI")?.classList.add("hidden");
  document.getElementById("hubBackBtn")?.classList.add("hidden");

  game.classList.add("hidden");
  levels.classList.remove("hidden");

  const unlocked = Number(localStorage.getItem("whotMultiplayerLevel")) || 1;

  let html = `
    <div class="levels-head">
      <button class="levels-back" onclick="goHome()">Back</button>
      <div>
        <p class="levels-eyebrow">Multiplayer</p>
        <h2>Multiplayer Rounds</h2>
        <p class="levels-sub">Unlocked: ${unlocked}/${MAX_MULTIPLAYER_ROUNDS}</p>
      </div>
    </div>
    <div class="level-grid">
  `;

  for (let i = 1; i <= MAX_MULTIPLAYER_ROUNDS; i += 1) {
    const locked = i > unlocked;
    html += `
      <button class="level-tile ${locked ? "locked" : ""}" data-multiplayer="${i}" ${locked ? "disabled" : ""}>
        <span class="level-id">M${i}</span>
        <span class="level-state">${locked ? "Locked" : "Play"}</span>
      </button>
    `;
  }

  html += `</div>`;
  levels.innerHTML = html;

  document.querySelectorAll("button[data-multiplayer]:not(.locked)").forEach((button) => {
    button.onclick = () => {
      levels.classList.add("hidden");
      initGame(Number(button.dataset.multiplayer));
    };
  });
}

export function unlockNextLevel(current) {
  const unlocked = Number(localStorage.getItem("whotLevel")) || 1;
  if (current >= unlocked) {
    localStorage.setItem("whotLevel", String(current + 1));
  }
}

export function unlockNextTournamentRound(current) {
  const unlocked = Number(localStorage.getItem("whotTournamentLevel")) || 1;
  if (current >= unlocked) {
    localStorage.setItem("whotTournamentLevel", String(current + 1));
  }
}

export function unlockNextMultiplayerRound(current) {
  const unlocked = Number(localStorage.getItem("whotMultiplayerLevel")) || 1;
  if (current >= unlocked) {
    localStorage.setItem("whotMultiplayerLevel", String(current + 1));
  }
}

window.showLevels = showLevels;
window.showTournamentLevels = showTournamentLevels;
window.showMultiplayerLevels = showMultiplayerLevels;
