/* Keeps the Home → Campaign entry reachable even if optional presentation code fails. */
(function campaignEntryGuard(global) {
  "use strict";
  const originalOpenCampaign = global.openCampaign;

  function fallbackOpenCampaign() {
    global.TicTacToeSuits?.activate?.("campaign", { intro: false });
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === "campaign"));
    document.getElementById("resultModal")?.classList.remove("active");
    document.getElementById("campaignResult")?.classList.remove("active");
    const gateway = document.getElementById("campaignGateway");
    const map = document.getElementById("campaignMap");
    const intro = document.getElementById("campaignIntro");
    const play = document.getElementById("campaignPlay");
    if (gateway) gateway.hidden = false;
    if (map) map.hidden = true;
    if (intro) intro.hidden = true;
    if (play) play.hidden = true;
  }

  global.openCampaign = function openCampaignFromHome() {
    try {
      if (typeof originalOpenCampaign === "function") {
        originalOpenCampaign();
        return;
      }
    } catch (error) {
      console.error("Campaign entry recovered:", error);
    }
    fallbackOpenCampaign();
  };
}(window));
