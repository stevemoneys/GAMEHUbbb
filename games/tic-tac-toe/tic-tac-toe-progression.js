/* Bounded player identity sourced only from active, verifiable game systems. */
(function createProgression(global) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const save = () => global.TicTacToeSave;
  const ranks = Object.freeze([
    { title: "Initiate", threshold: 0, glyph: "◇" }, { title: "Pathfinder", threshold: 3, glyph: "◈" },
    { title: "Contender", threshold: 6, glyph: "✦" }, { title: "Tactician", threshold: 9, glyph: "✧" },
    { title: "Strategist", threshold: 12, glyph: "◉" }, { title: "Vanguard", threshold: 15, glyph: "✹" },
    { title: "Master", threshold: 18, glyph: "✥" }, { title: "Grandmaster", threshold: 20, glyph: "✺" },
    { title: "Impossible", threshold: 21, glyph: "✶" }
  ]);
  const campaignActs = Object.freeze([
    ["campaign-act-1", ["first-mark", "steady-hand"]], ["campaign-act-2", ["pressure-point", "patient-trap", "double-vision"]],
    ["campaign-act-3", ["sealed-route", "cold-calculation"]], ["campaign-act-4", ["open-fire", "safe-passage", "moving-target", "masters-gambit"]],
    ["campaign-act-5", ["the-test", "the-pressure", "impossible-game"]]
  ]);
  const registry = Object.freeze([
    { id: "ai-level-5", domain: "challenge", label: "Opening Learner", detail: "Complete AI Challenge Level 5" },
    { id: "ai-level-10", domain: "challenge", label: "Tactical Reader", detail: "Complete AI Challenge Level 10" },
    { id: "ai-level-20", domain: "challenge", label: "Pattern Builder", detail: "Complete AI Challenge Level 20" },
    { id: "ai-level-30", domain: "challenge", label: "Advanced Planner", detail: "Complete AI Challenge Level 30" },
    { id: "ai-level-40", domain: "challenge", label: "Elite Solver", detail: "Complete AI Challenge Level 40" },
    { id: "ai-level-50", domain: "challenge", label: "Final Challenger", detail: "Complete AI Challenge Level 50" },
    { id: "daily-puzzle", domain: "daily", label: "Daily Precision", detail: "Clear a Daily Puzzle" },
    { id: "board-3", domain: "boards", label: "Classic Board", detail: "Win an AI Challenge 3×3 match" },
    { id: "board-4", domain: "boards", label: "Expanded Board", detail: "Win an AI Challenge 4×4 match" },
    { id: "board-5", domain: "boards", label: "Grand Board", detail: "Win an AI Challenge 5×5 match" },
    { id: "variant-reverse", domain: "variants", label: "Reverse", detail: "Win Reverse Tic-Tac-Toe" },
    { id: "variant-wild", domain: "variants", label: "Wild", detail: "Win Wild Tic-Tac-Toe" },
    { id: "variant-notakto", domain: "variants", label: "Notakto", detail: "Win Notakto" },
    { id: "variant-ultimate", domain: "variants", label: "Ultimate", detail: "Win Ultimate Tic-Tac-Toe" },
    { id: "variant-mutator", domain: "variants", label: "Changing Rules", detail: "Win a Board Mutator match" },
    { id: "campaign-act-1", domain: "campaign", label: "First Mark", detail: "Complete Campaign Act I" },
    { id: "campaign-act-2", domain: "campaign", label: "Mind Game", detail: "Complete Campaign Act II" },
    { id: "campaign-act-3", domain: "campaign", label: "Changing Board", detail: "Complete Campaign Act III" },
    { id: "campaign-act-4", domain: "campaign", label: "The Ascent", detail: "Complete Campaign Act IV" },
    { id: "campaign-act-5", domain: "campaign", label: "Final Approach", detail: "Complete Campaign Act V" },
    { id: "impossible-game", domain: "campaign", label: "Impossible Defeated", detail: "Win the final Campaign encounter" }
  ]);
  const domains = Object.freeze([
    { id: "challenge", name: "AI Challenge", icon: "◈" }, { id: "daily", name: "Daily", icon: "✦" },
    { id: "boards", name: "Boards", icon: "▦" }, { id: "variants", name: "Variants", icon: "✧" }, { id: "campaign", name: "Campaign", icon: "◇" }
  ]);
  let overlayTimer = null;
  const identity = (data) => data.progression.identity;
  const complete = (data, id, time = Date.now()) => { const milestones = identity(data).milestones; if (milestones[id]) return false; milestones[id] = { completedAt: time }; return true; };
  const achieved = (data, id) => Boolean(identity(data).milestones[id]);
  const score = (data) => registry.reduce((total, milestone) => total + (achieved(data, milestone.id) ? 1 : 0), 0);
  const rankIndex = (value) => ranks.reduce((best, rank, index) => value >= rank.threshold ? index : best, 0);
  const activeRank = (data) => ranks[rankIndex(score(data))];
  const domainState = (data, id) => { const entries = registry.filter((item) => item.domain === id); const count = entries.filter((item) => achieved(data, item.id)).length; return { count, total: entries.length, percent: Math.round((count / entries.length) * 100) }; };
  function reconcile(data) {
    let changed = false;
    const completedLevels = new Set(data.progression.levels.completed || []);
    [5, 10, 20, 30, 40, 50].forEach((level) => { if (completedLevels.has(level)) changed = complete(data, `ai-level-${level}`) || changed; });
    if (data.features.daily.summary?.completed > 0) changed = complete(data, "daily-puzzle") || changed;
    const campaignCompleted = new Set(data.features.campaign.completed || []);
    campaignActs.forEach(([id, required]) => { if (required.every((entry) => campaignCompleted.has(entry))) changed = complete(data, id) || changed; });
    if (data.features.campaign.impossibleDefeated || campaignCompleted.has("impossible-game")) changed = complete(data, "impossible-game") || changed;
    const rank = rankIndex(score(data));
    if (identity(data).rank !== rank) { identity(data).rank = rank; changed = true; }
    if (changed) identity(data).updatedAt = Date.now();
    return changed;
  }
  function update(mutator, announce = false) {
    let rankUp = null;
    save()?.update((data) => {
      const before = identity(data).rank || 0;
      mutator?.(data);
      reconcile(data);
      const after = identity(data).rank;
      if (announce && after > before && after > identity(data).rankNotified) { identity(data).rankNotified = after; rankUp = after; }
    });
    renderHome();
    if (rankUp !== null) showRankUp(ranks[rankUp]);
  }
  function award(id) { if (registry.some((item) => item.id === id)) update((data) => complete(data, id), true); }
  function eventResult(detail) {
    if (!detail || detail.outcome !== "win") return;
    const type = detail.config?.type;
    if (type === "reverse") award("variant-reverse");
    if (type === "wild") award("variant-wild");
    if (type === "standard" && detail.context?.mode === "ai") {
      const size = Number(detail.config?.rules?.boardSize || 3);
      if ([3, 4, 5].includes(size)) award(`board-${size}`);
    }
  }
  function featureResult(detail) {
    if (!detail?.won) return;
    if (detail.feature === "mutator") award("variant-mutator");
    if (detail.feature === "notakto") award("variant-notakto");
    if (detail.feature === "ultimate") award("variant-ultimate");
    if (detail.feature === "daily") award("daily-puzzle");
  }
  const next = (data) => registry.find((item) => !achieved(data, item.id)) || null;
  function renderHome() {
    const data = save()?.get(); if (!data) return;
    const rank = activeRank(data), percent = Math.round((score(data) / registry.length) * 100);
    if ($("rankHomeTitle")) $("rankHomeTitle").textContent = rank.title;
    if ($("rankHomeEmblem")) $("rankHomeEmblem").textContent = rank.glyph;
    if ($("rankHomeProgress")) $("rankHomeProgress").style.width = `${percent}%`;
    if ($("rankHomePercent")) $("rankHomePercent").textContent = `${percent}%`;
  }
  function render() {
    const data = save()?.get(); if (!data) return;
    const rank = activeRank(data), earned = score(data), pct = Math.round((earned / registry.length) * 100), nextMilestone = next(data);
    $("progressionContent").innerHTML = `<header class="rank-hero"><button class="icon-button rank-back" type="button" onclick="closeProgression()" aria-label="Back to home">‹</button><div class="rank-emblem rank-${rankIndex(earned)}" aria-hidden="true">${rank.glyph}</div><p class="eyebrow">Player identity</p><h2>${rank.title}</h2><div class="rank-progress"><span style="--rank-progress:${pct}%"><i></i></span><strong>${pct}% mastery</strong></div></header><section class="rank-domains" aria-label="Mastery domains">${domains.map((domain) => { const state = domainState(data, domain.id); return `<article class="rank-domain ${state.count === state.total ? "mastered" : state.count ? "started" : ""}"><span aria-hidden="true">${domain.icon}</span><div><strong>${domain.name}</strong><small>${state.count} / ${state.total}</small></div><b>${state.percent}%</b></article>`; }).join("")}</section><section class="next-milestone"><span aria-hidden="true">${nextMilestone ? "✦" : "✶"}</span><div><p>Next milestone</p><strong>${nextMilestone?.label || "Every milestone mastered"}</strong><small>${nextMilestone?.detail || "Your active journey is complete."}</small></div></section><section class="milestone-path" aria-label="Milestones">${registry.map((item) => `<span class="milestone-dot ${achieved(data, item.id) ? "done" : ""}" title="${item.label}" aria-label="${item.label}: ${achieved(data, item.id) ? "completed" : "not completed"}">${achieved(data, item.id) ? "✓" : ""}</span>`).join("")}</section><button class="text-button progression-home" type="button" onclick="closeProgression()">‹ Back to home</button>`;
  }
  function open() { reconcileAndRender(); document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === "progression")); }
  function close() { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === "menu")); }
  function closeRankUp() { clearTimeout(overlayTimer); const modal = $("rankUpModal"); if (modal) { modal.classList.remove("active"); modal.hidden = true; } }
  function reconcileAndRender() { update(null, false); render(); }
  function showRankUp(rank) {
    clearTimeout(overlayTimer);
    let modal = $("rankUpModal");
    if (!modal) { modal = document.createElement("div"); modal.id = "rankUpModal"; modal.className = "rank-up-modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); document.body.append(modal); }
    modal.innerHTML = `<div><span class="rank-emblem rank-${ranks.indexOf(rank)}" aria-hidden="true">${rank.glyph}</span><p>Rank Up</p><strong>${rank.title}</strong><button class="control-button" type="button" onclick="closeRankUp()">Continue</button></div>`;
    modal.hidden = false; modal.classList.add("active");
    overlayTimer = setTimeout(closeRankUp, 4500);
  }
  global.addEventListener("tictactoe:match-complete", (event) => eventResult(event.detail));
  global.addEventListener("tictactoe:feature-complete", (event) => featureResult(event.detail));
  global.addEventListener("tictactoe:campaign-progress", () => update(null, true));
  global.openProgression = open; global.closeProgression = close; global.closeRankUp = closeRankUp;
  global.TicTacToeProgression = Object.freeze({ refresh: reconcileAndRender, award, snapshot: () => { const data = save()?.get(); return data ? { score: score(data), rank: activeRank(data).title, next: next(data)?.id || null } : null; } });
  reconcileAndRender();
}(window));
