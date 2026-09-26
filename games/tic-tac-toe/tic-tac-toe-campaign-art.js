/* Phase 15 artwork gateway. Keep all campaign image paths in this one manifest. */
(function createCampaignArtwork(global) {
  "use strict";

  const roles = Object.freeze({
    CAMPAIGN_GATEWAY: "CAMPAIGN_GATEWAY",
    CAMPAIGN_WORLD: "CAMPAIGN_WORLD",
    ACT_1: "ACT_1",
    ACT_2: "ACT_2",
    ACT_3: "ACT_3",
    ACT_4: "ACT_4",
    ACT_5: "ACT_5",
    IMPOSSIBLE_ARENA: "IMPOSSIBLE_ARENA",
    MASTER_PORTRAIT: "MASTER_PORTRAIT"
  });

  // Put the final artwork in assets/campaign using these exact names. Missing
  // files intentionally fall back to the CSS campaign environments.
  const defaultManifest = Object.freeze({
    [roles.CAMPAIGN_GATEWAY]: "assets/campaign/campaign-gateway.webp",
    [roles.CAMPAIGN_WORLD]: "assets/campaign/campaign-world.webp",
    [roles.ACT_1]: "assets/campaign/act-1-first-mark.webp",
    [roles.ACT_2]: "assets/campaign/act-2-mind-game.webp",
    [roles.ACT_3]: "assets/campaign/act-3-changing-board.webp",
    [roles.ACT_4]: "assets/campaign/act-4-rivals.webp",
    [roles.ACT_5]: "assets/campaign/act-5-impossible-realm.webp",
    [roles.IMPOSSIBLE_ARENA]: "assets/campaign/impossible-game-arena.webp",
    [roles.MASTER_PORTRAIT]: "assets/campaign/master-portrait.webp"
  });
  const supplied = global.TicTacToeCampaignArtworkManifest || {};
  const manifest = Object.freeze(Object.fromEntries(Object.values(roles).map((role) => [role, typeof supplied[role] === "string" ? supplied[role] : defaultManifest[role]])));
  const actRole = Object.freeze({ I: roles.ACT_1, II: roles.ACT_2, III: roles.ACT_3, IV: roles.ACT_4, V: roles.ACT_5 });
  const loaded = new Set();
  const failed = new Set();

  function source(role) { return manifest[role] || null; }
  function setScene(root, role, { rival = "", final = false } = {}) {
    if (!root) return Promise.resolve(false);
    root.dataset.campaignScene = role || "FALLBACK";
    root.dataset.campaignRival = rival;
    root.dataset.campaignFinal = final ? "true" : "false";
    root.classList.remove("campaign-art-ready");
    root.style.removeProperty("--campaign-art");
    const url = source(role);
    if (!url) return Promise.resolve(false);
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        loaded.add(role);
        root.style.setProperty("--campaign-art", `url("${url.replace(/"/g, "\\\"")}")`);
        root.classList.add("campaign-art-ready");
        resolve(true);
      };
      image.onerror = () => { failed.add(role); resolve(false); };
      image.src = url;
    });
  }
  function preload(role) {
    const url = source(role);
    if (!url || loaded.has(role) || failed.has(role)) return;
    const image = new Image();
    image.onload = () => loaded.add(role);
    image.onerror = () => failed.add(role);
    image.src = url;
  }
  function preloadAfterAct(act) {
    const order = ["I", "II", "III", "IV", "V"];
    const next = order[order.indexOf(act) + 1];
    if (next) preload(actRole[next]);
    if (act === "V") { preload(roles.IMPOSSIBLE_ARENA); preload(roles.MASTER_PORTRAIT); }
  }
  function setMasterPortrait(root) {
    if (!root) return Promise.resolve(false);
    root.classList.remove("campaign-master-art-ready");
    root.style.removeProperty("--campaign-master-portrait");
    const url = source(roles.MASTER_PORTRAIT);
    if (!url) return Promise.resolve(false);
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        loaded.add(roles.MASTER_PORTRAIT);
        root.style.setProperty("--campaign-master-portrait", `url("${url.replace(/"/g, "\\\"")}")`);
        root.classList.add("campaign-master-art-ready");
        resolve(true);
      };
      image.onerror = () => { failed.add(roles.MASTER_PORTRAIT); resolve(false); };
      image.src = url;
    });
  }

  global.TicTacToeCampaignArtwork = Object.freeze({
    roles,
    forAct: (act) => actRole[act] || roles.CAMPAIGN_WORLD,
    source,
    setScene,
    setMasterPortrait,
    preload,
    preloadAfterAct,
    status: () => ({ loaded: [...loaded], failed: [...failed], configured: Object.entries(manifest).filter(([, value]) => value).map(([role]) => role) })
  });
}(window));
