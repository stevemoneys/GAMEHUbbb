/* Production home lobby: navigation only. Gameplay remains in the established mode controllers. */
(function initialiseHomeLobby(global) {
  "use strict";
  let selectedMode = null;
  let arenaSelectionForChallenge = false;
  const parentBack = document.querySelector(".hub-back-btn");
  const updateParentBack = () => {
    const home = document.getElementById("menu");
    const onlyHome = Boolean(home?.classList.contains("active")) && ![...document.querySelectorAll(".screen.active")].some((screen) => screen.id !== "menu");
    if (parentBack) parentBack.hidden = !onlyHome;
  };
  const screens = (id) => { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id)); updateParentBack(); };
  global.refreshTicTacToeChrome = updateParentBack;
  const safeCall = (name) => {
    if (typeof global[name] !== "function") return false;
    global[name]();
    return true;
  };

  const modePreview = document.querySelector(".lobby-mini-cards");
  if (modePreview) {
    modePreview.innerHTML = [
      ["wild", "&#215;&#9675;", "Wild"], ["reverse", "&#8645;", "Reverse"], ["notakto", "&#215; &#215; &#215;", "Notakto"],
      ["ultimate", "&#8853;", "Ultimate"], ["mutators", "&#10022;", "Mutators"], ["campaign", "&#9671;", "Campaign"]
    ].map(([identity, symbol, label]) => `<i class="mode-preview ${identity}"><b>${symbol}</b><small>${label}</small></i>`).join("");
  }

  global.openModesLibrary = () => screens("modesLibrary");
  global.closeModesLibrary = () => screens("menu");
  global.openLobbySizeSelect = (mode) => {
    selectedMode = mode === "two" ? "two" : "ai";
    arenaSelectionForChallenge = false;
    if (selectedMode === "ai") return safeCall("startVsAI");
    const lead = document.getElementById("lobbySizeLead");
    if (lead) lead.textContent = "Choose an arena for your local match.";
    screens("lobbySize");
  };
  global.openAIChallengeArenaSelect = (level) => {
    arenaSelectionForChallenge = true;
    selectedMode = "ai";
    const lead = document.getElementById("lobbySizeLead");
    if (lead) lead.textContent = `Level ${level} selected. Choose the board for this challenge.`;
    screens("lobbySize");
  };
  global.closeLobbySizeSelect = () => {
    if (arenaSelectionForChallenge) { arenaSelectionForChallenge = false; return safeCall("showLevels"); }
    screens("menu");
  };
  global.startLobbySizedMatch = (size) => {
    const mode = selectedMode || "ai";
    if (arenaSelectionForChallenge) {
      arenaSelectionForChallenge = false;
      return global.TicTacToeAIChallenge?.startMatchWithSize?.(size);
    }
    // Every AI arena enters the same level and symbol flow.  The old direct
    // 4x4/5x5 launch skipped the Challenge Journey and caused a mismatched UI.
    if (mode === "ai") {
      if (typeof global.startAIChallengeForSize === "function") return global.startAIChallengeForSize(size);
      return safeCall("startVsAI");
    }
    if (size === 3 && mode === "two") return safeCall("startTwoPlayer");
    if (global.TicTacToeBoardSizes?.openWith) return global.TicTacToeBoardSizes.openWith(size, mode);
    safeCall("openBoardSizes");
  };
  global.launchLobbyMode = (mode) => {
    const routes = { wild: "openWildMode", reverse: "openReverseMode", notakto: "openNotaktoMode", ultimate: "openUltimateMode", mutators: "openBoardMutators", campaign: "openCampaign" };
    if (!safeCall(routes[mode])) screens("menu");
  };
  new MutationObserver(updateParentBack).observe(document.querySelector("main.app"), { subtree: true, attributes: true, attributeFilter: ["class"] });
  updateParentBack();
}(window));
