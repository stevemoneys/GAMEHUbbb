/* Phase 18: derived mode identity. Suits are visual only and are never saved. */
(function createSuitIdentity(global) {
  "use strict";
  const root = document.documentElement;
  const suits = Object.freeze({
    spades: Object.freeze({ id: "spades", symbol: "&#9824;", name: "Spades", phrase: "Precision", className: "suit-spades", palette: { accent: "#8cc8ff", glow: "#28558c", shade: "#101a2d" }, artwork: "assets/suits/spades-identity.webp", fallback: "Angular sapphire light" }),
    hearts: Object.freeze({ id: "hearts", symbol: "&#9829;", name: "Hearts", phrase: "Journey", className: "suit-hearts", palette: { accent: "#ff7b89", glow: "#9c2947", shade: "#341225" }, artwork: "assets/suits/hearts-identity.webp", fallback: "Ruby pulse" }),
    diamonds: Object.freeze({ id: "diamonds", symbol: "&#9830;", name: "Diamonds", phrase: "Mastery", className: "suit-diamonds", palette: { accent: "#ffe09b", glow: "#af8d43", shade: "#29243b" }, artwork: "assets/suits/diamonds-identity.webp", fallback: "Faceted platinum light" }),
    clubs: Object.freeze({ id: "clubs", symbol: "&#9827;", name: "Clubs", phrase: "Variants", className: "suit-clubs", palette: { accent: "#71e5ae", glow: "#21775f", shade: "#102b2b" }, artwork: "assets/suits/clubs-identity.webp", fallback: "Emerald tactical pattern" })
  });
  const modeMap = Object.freeze({
    classic: "spades", sizes: "spades", sizewars: "spades", rivals: "spades",
    campaign: "hearts", gauntlet: "hearts",
    daily: "diamonds", impossible: "diamonds",
    reverse: "clubs", wild: "clubs", notakto: "clubs", ultimate: "clubs", mutators: "clubs"
  });
  const screenModes = Object.freeze({ reverse: "reverse", wild: "wild", notakto: "notakto", ultimate: "ultimate", sizeboards: "sizes", sizewars: "sizewars", mutators: "mutators", rivals: "rivals", campaign: "campaign", gauntlet: "gauntlet" });
  let activeMode = null, artworkToken = 0, introTimer = null;
  const resolve = (mode) => suits[modeMap[mode]] || null;
  const reducedMotion = () => global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  function ensureElements() {
    let indicator = document.getElementById("suitModeIndicator");
    if (!indicator) { indicator = document.createElement("aside"); indicator.id = "suitModeIndicator"; indicator.className = "suit-mode-indicator"; indicator.setAttribute("aria-live", "polite"); document.body.append(indicator); }
    let intro = document.getElementById("suitEntryIntro");
    if (!intro) { intro = document.createElement("div"); intro.id = "suitEntryIntro"; intro.className = "suit-entry-intro"; intro.setAttribute("aria-hidden", "true"); document.body.append(intro); }
    return { indicator, intro };
  }
  function stampModeCards() {
    const cards = [
      ["startVsAI", "classic"], ["startTwoPlayer", "classic"], ["openDailyPuzzleFromHome", "daily"], ["openWildMode", "wild"], ["openReverseMode", "reverse"], ["openGauntletHub", "gauntlet"], ["openNotaktoMode", "notakto"], ["openUltimateMode", "ultimate"], ["openBoardSizes", "sizes"], ["openSizeWars", "sizewars"], ["openBoardMutators", "mutators"], ["openRivals", "rivals"], ["openCampaign", "campaign"]
    ];
    cards.forEach(([handler, mode]) => document.querySelectorAll(`[onclick^="${handler}("]`).forEach((card) => {
      const identity = resolve(mode); if (!identity || card.dataset.suit) return;
      card.dataset.suit = identity.id; card.classList.add(identity.className);
      const emblem = document.createElement("span"); emblem.className = "mode-suit-mark"; emblem.setAttribute("aria-hidden", "true"); emblem.innerHTML = identity.symbol; card.append(emblem);
    }));
  }
  function preload(identity) {
    const token = ++artworkToken, image = new Image();
    image.onload = () => { if (token === artworkToken && activeMode) root.style.setProperty("--suit-identity-art", `url("${identity.artwork}")`); };
    image.onerror = () => { if (token === artworkToken) root.style.removeProperty("--suit-identity-art"); };
    image.src = identity.artwork;
  }
  function showIntro(identity) {
    const { intro } = ensureElements(); clearTimeout(introTimer);
    intro.className = `suit-entry-intro ${identity.className}`;
    intro.innerHTML = `<span class="suit-entry-emblem">${identity.symbol}</span><span><strong>${identity.name}</strong><small>${identity.phrase}</small></span>`;
    if (reducedMotion()) { intro.classList.add("brief"); introTimer = setTimeout(() => intro.classList.remove("brief"), 80); return; }
    intro.classList.add("active"); introTimer = setTimeout(() => intro.classList.remove("active"), 560);
  }
  function activate(mode, options = {}) {
    const identity = resolve(mode); if (!identity) { clear(); return null; }
    const changed = activeMode !== mode;
    activeMode = mode;
    root.dataset.modeSuit = identity.id; document.body.dataset.modeSuit = identity.id;
    const { indicator } = ensureElements(); indicator.className = `suit-mode-indicator active ${identity.className}`;
    indicator.innerHTML = `<span class="suit-indicator-symbol" aria-hidden="true">${identity.symbol}</span><span><strong>${identity.name}</strong><small>${identity.phrase}</small></span>`;
    preload(identity); stampModeCards();
    if (changed && options.intro !== false) showIntro(identity);
    return identity;
  }
  function clear() {
    activeMode = null; artworkToken += 1; root.removeAttribute("data-mode-suit"); document.body.removeAttribute("data-mode-suit"); root.style.removeProperty("--suit-identity-art"); document.getElementById("suitModeIndicator")?.classList.remove("active"); clearTimeout(introTimer); document.getElementById("suitEntryIntro")?.classList.remove("active", "brief");
  }
  function wrap(name, mode) {
    const original = global[name]; if (typeof original !== "function" || original.__suitWrapped) return;
    function wrapped(...args) { activate(mode); return original.apply(this, args); }
    wrapped.__suitWrapped = true; global[name] = wrapped;
  }
  function observeScreens() {
    const observer = new MutationObserver(() => {
      const active = document.querySelector(".screen.active"); if (!active) return;
      if (active.id === "menu") { clear(); return; }
      const mapped = screenModes[active.id]; if (mapped && activeMode !== "impossible") activate(mapped, { intro: false });
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  [
    ["startVsAI", "classic"], ["startTwoPlayer", "classic"], ["openDailyPuzzleFromHome", "daily"], ["learningDaily", "daily"],
    ["openReverseMode", "reverse"], ["openWildMode", "wild"], ["openGauntletHub", "gauntlet"], ["openNotaktoMode", "notakto"], ["openUltimateMode", "ultimate"], ["openBoardSizes", "sizes"], ["openSizeWars", "sizewars"], ["openBoardMutators", "mutators"], ["openRivals", "rivals"], ["openCampaign", "campaign"]
  ].forEach(([name, mode]) => wrap(name, mode));
  stampModeCards(); observeScreens();
  global.TicTacToeSuits = Object.freeze({ resolve: (mode) => { const suit = resolve(mode); return suit ? { id: suit.id, name: suit.name, phrase: suit.phrase } : null; }, activate, clear, registry: () => Object.values(suits).map(({ id, name, phrase, artwork, fallback }) => ({ id, name, phrase, artwork, fallback })), modeMap: () => ({ ...modeMap }) });
}(window));
