/* Production home lobby: navigation only. Gameplay remains in the established mode controllers. */
(function initialiseHomeLobby(global) {
  "use strict";
  let selectedMode = null;
  const screens = (id) => document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id));
  const safeCall = (name) => typeof global[name] === "function" && global[name]();

  global.openModesLibrary = () => screens("modesLibrary");
  global.closeModesLibrary = () => screens("menu");
  global.openLobbySizeSelect = (mode) => {
    selectedMode = mode === "two" ? "two" : "ai";
    const lead = document.getElementById("lobbySizeLead");
    if (lead) lead.textContent = selectedMode === "ai" ? "Choose an arena, then meet your AI opponent." : "Choose an arena for your local match.";
    screens("lobbySize");
  };
  global.closeLobbySizeSelect = () => screens("menu");
  global.startLobbySizedMatch = (size) => {
    const mode = selectedMode || "ai";
    if (size === 3 && mode === "ai") return safeCall("startVsAI");
    if (size === 3 && mode === "two") return safeCall("startTwoPlayer");
    if (global.TicTacToeBoardSizes?.openWith) return global.TicTacToeBoardSizes.openWith(size, mode);
    safeCall("openBoardSizes");
  };
  global.launchLobbyMode = (mode) => {
    const routes = { wild: "openWildMode", reverse: "openReverseMode", notakto: "openNotaktoMode", ultimate: "openUltimateMode", mutators: "openBoardMutators", campaign: "openCampaign" };
    if (!safeCall(routes[mode])) screens("menu");
  };
}(window));
