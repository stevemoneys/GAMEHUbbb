/* Phase 16: bounded, accomplishment-based player identity. No per-match XP. */
(function createProgression(global) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const save = () => global.TicTacToeSave;
  const ranks = Object.freeze([
    { title: "Initiate", threshold: 0, glyph: "◇" }, { title: "Pathfinder", threshold: 3, glyph: "◈" },
    { title: "Contender", threshold: 6, glyph: "✦" }, { title: "Tactician", threshold: 10, glyph: "✧" },
    { title: "Strategist", threshold: 15, glyph: "◉" }, { title: "Vanguard", threshold: 21, glyph: "✹" },
    { title: "Master", threshold: 28, glyph: "✥" }, { title: "Grandmaster", threshold: 36, glyph: "✺" },
    { title: "Impossible", threshold: 45, glyph: "✶" }
  ]);
  const campaignActs = Object.freeze([
    ["campaign-act-1", ["first-mark", "steady-hand"]], ["campaign-act-2", ["pressure-point", "patient-trap", "double-vision"]],
    ["campaign-act-3", ["sealed-route", "cold-calculation"]], ["campaign-act-4", ["open-fire", "safe-passage", "moving-target", "masters-gambit"]],
    ["campaign-act-5", ["the-test", "the-pressure", "impossible-game"]]
  ]);
  const registry = Object.freeze([
    { id: "campaign-act-1", domain: "campaign", label: "First Mark", detail: "Complete Act I" }, { id: "campaign-act-2", domain: "campaign", label: "Mind Game", detail: "Complete Act II" }, { id: "campaign-act-3", domain: "campaign", label: "Changing Board", detail: "Complete Act III" }, { id: "campaign-act-4", domain: "campaign", label: "Rivals", detail: "Complete Act IV" }, { id: "campaign-act-5", domain: "campaign", label: "Final Approach", detail: "Complete Act V" }, { id: "impossible-game", domain: "campaign", label: "Impossible Defeated", detail: "Win the final encounter" },
    { id: "board-3", domain: "boards", label: "Classic Board", detail: "Win a 3×3 board" }, { id: "board-4", domain: "boards", label: "Expanded Board", detail: "Win a 4×4 board" }, { id: "board-5", domain: "boards", label: "Grand Board", detail: "Win a 5×5 · 4-in-row board" }, { id: "size-wars", domain: "boards", label: "Size Wars", detail: "Win a complete Size Wars series" },
    { id: "variant-reverse", domain: "variants", label: "Reverse", detail: "Win Reverse Tic-Tac-Toe" }, { id: "variant-wild", domain: "variants", label: "Wild", detail: "Win Wild Tic-Tac-Toe" }, { id: "variant-notakto", domain: "variants", label: "Notakto", detail: "Win Notakto" }, { id: "variant-ultimate", domain: "variants", label: "Ultimate", detail: "Win Ultimate Tic-Tac-Toe" }, { id: "variant-mutator", domain: "variants", label: "Changing Rules", detail: "Win a Board Mutator match" }, { id: "daily-puzzle", domain: "variants", label: "Daily Precision", detail: "Clear a Daily Puzzle" },
    { id: "rival-challenger", domain: "rivals", label: "Challenger Defeated", detail: "Defeat The Challenger" }, { id: "rival-guardian", domain: "rivals", label: "Guardian Defeated", detail: "Defeat The Guardian" }, { id: "rival-trickster", domain: "rivals", label: "Trickster Defeated", detail: "Defeat The Trickster" }, { id: "rival-master", domain: "rivals", label: "Master Defeated", detail: "Defeat The Master" },
    { id: "gauntlet-run", domain: "gauntlet", label: "Gauntlet Cleared", detail: "Complete an eight-encounter run" }, { id: "streak-3", domain: "gauntlet", label: "Three In Form", detail: "Reach a 3-win streak" }, { id: "streak-5", domain: "gauntlet", label: "Five In Form", detail: "Reach a 5-win streak" }, { id: "streak-10", domain: "gauntlet", label: "Ten In Form", detail: "Reach a 10-win streak" }
  ]);
  const domains = Object.freeze([{ id: "campaign", name: "Campaign", icon: "◇" }, { id: "boards", name: "Boards", icon: "▦" }, { id: "variants", name: "Variants", icon: "✦" }, { id: "rivals", name: "Rivals", icon: "◉" }, { id: "gauntlet", name: "Gauntlet", icon: "✹" }]);
  let overlayTimer = null;
  const identity = (data) => data.progression.identity;
  const complete = (data, id, time = Date.now()) => { const records = identity(data).milestones; if (records[id]) return false; records[id] = { completedAt: time }; return true; };
  const achieved = (data, id) => Boolean(identity(data).milestones[id]);
  const score = (data) => registry.reduce((total, milestone) => total + (achieved(data, milestone.id) ? 1 : 0), 0);
  const rankIndex = (value) => ranks.reduce((best, rank, index) => value >= rank.threshold ? index : best, 0);
  const activeRank = (data) => ranks[rankIndex(score(data))];
  const domainState = (data, id) => { const entries = registry.filter((item) => item.domain === id), count = entries.filter((item) => achieved(data, item.id)).length; return { count, total: entries.length, percent: entries.length ? Math.round(count / entries.length * 100) : 0 }; };
  function reconcile(data) {
    let changed = false; const completed = new Set(data.features.campaign.completed || []);
    campaignActs.forEach(([id, required]) => { if (required.every((entry) => completed.has(entry))) changed = complete(data, id) || changed; });
    if (data.features.campaign.impossibleDefeated || completed.has("impossible-game")) changed = complete(data, "impossible-game") || changed;
    if (completed.size) { if ([...completed].some((id) => ["first-mark", "steady-hand", "pressure-point", "patient-trap"].includes(id))) changed = complete(data, "board-3") || changed; if ([...completed].some((id) => ["double-vision", "sealed-route"].includes(id))) changed = complete(data, "board-4") || changed; if ([...completed].some((id) => ["cold-calculation", "safe-passage", "moving-target", "masters-gambit", "the-test", "the-pressure", "impossible-game"].includes(id))) changed = complete(data, "board-5") || changed; }
    if (data.features.daily.summary?.completed > 0) changed = complete(data, "daily-puzzle") || changed;
    if (data.progression.streaks.best >= 3) changed = complete(data, "streak-3") || changed;
    if (data.progression.streaks.best >= 5) changed = complete(data, "streak-5") || changed;
    if (data.progression.streaks.best >= 10) changed = complete(data, "streak-10") || changed;
    ["challenger", "guardian", "trickster", "master"].forEach((id) => { const personality = { challenger: "aggressive", guardian: "defensive", trickster: "trickster", master: "human" }[id]; if ((data.features.rivals[personality]?.wins || 0) > 0) changed = complete(data, `rival-${id}`) || changed; });
    const rank = rankIndex(score(data)); if (identity(data).rank !== rank) { identity(data).rank = rank; changed = true; } if (changed) identity(data).updatedAt = Date.now(); return changed;
  }
  function update(mutator, announce = false) { let rankUp = null; save()?.update((data) => { const before = identity(data).rank || 0; mutator?.(data); reconcile(data); const after = identity(data).rank; if (announce && after > before && after > identity(data).rankNotified) { identity(data).rankNotified = after; rankUp = after; } }); renderHome(); if (rankUp !== null) showRankUp(ranks[rankUp]); }
  function award(id) { if (!registry.some((item) => item.id === id)) return; update((data) => complete(data, id), true); }
  function eventResult(detail) { if (!detail || detail.outcome !== "win") return; const type = detail.config?.type; if (type === "reverse") award("variant-reverse"); if (type === "wild") award("variant-wild"); const rival = detail.context?.rivalId; if (rival && ["challenger", "guardian", "trickster", "master"].includes(rival)) award(`rival-${rival}`); }
  function featureResult(detail) { if (!detail?.won) return; if (detail.feature === "sizes" && (detail.size !== 5 || detail.target === 4)) award(`board-${detail.size}`); if (detail.feature === "size-wars") award("size-wars"); if (detail.feature === "mutator") award("variant-mutator"); if (detail.feature === "notakto") award("variant-notakto"); if (detail.feature === "ultimate") award("variant-ultimate"); if (detail.feature === "daily") award("daily-puzzle"); if (detail.feature === "gauntlet") award("gauntlet-run"); }
  function next(data) { return registry.find((item) => !achieved(data, item.id)) || null; }
  function renderHome() { const data = save()?.get(); if (!data) return; const rank = activeRank(data), percent = Math.round(score(data) / registry.length * 100); $("rankHomeTitle") && ($("rankHomeTitle").textContent = rank.title); $("rankHomeEmblem") && ($("rankHomeEmblem").textContent = rank.glyph); $("rankHomeProgress") && ($("rankHomeProgress").textContent = `${percent}%`); }
  function render() { const data = save()?.get(); if (!data) return; const rank = activeRank(data), earned = score(data), pct = Math.round(earned / registry.length * 100), nextMilestone = next(data); $("progressionContent").innerHTML = `<header class="rank-hero"><button class="icon-button rank-back" type="button" onclick="closeProgression()" aria-label="Back to home">‹</button><div class="rank-emblem rank-${rankIndex(earned)}" aria-hidden="true">${rank.glyph}</div><p class="eyebrow">Player identity</p><h2>${rank.title}</h2><div class="rank-progress"><span style="--rank-progress:${pct}%"><i></i></span><strong>${pct}% mastery</strong></div></header><section class="rank-domains" aria-label="Mastery domains">${domains.map((domain) => { const state = domainState(data, domain.id); return `<article class="rank-domain ${state.count === state.total ? "mastered" : state.count ? "started" : ""}"><span aria-hidden="true">${domain.icon}</span><div><strong>${domain.name}</strong><small>${state.count} / ${state.total}</small></div><b>${state.percent}%</b></article>`; }).join("")}</section><section class="next-milestone"><span aria-hidden="true">${nextMilestone ? "✦" : "✶"}</span><div><p>Next milestone</p><strong>${nextMilestone?.label || "Every milestone mastered"}</strong><small>${nextMilestone?.detail || "Your journey is complete for this phase."}</small></div></section><section class="milestone-path" aria-label="Milestones">${registry.map((item) => `<span class="milestone-dot ${achieved(data, item.id) ? "done" : ""}" title="${item.label}" aria-label="${item.label}: ${achieved(data, item.id) ? "completed" : "not completed"}">${achieved(data, item.id) ? "✓" : ""}</span>`).join("")}</section><button class="text-button progression-home" type="button" onclick="closeProgression()">‹ Back to home</button>`; }
  function open() { reconcileAndRender(); document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === "progression")); }
  function close() { document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === "menu")); }
  function reconcileAndRender() { update(null, false); render(); }
  function showRankUp(rank) { clearTimeout(overlayTimer); let modal = $("rankUpModal"); if (!modal) { modal = document.createElement("div"); modal.id = "rankUpModal"; modal.className = "rank-up-modal"; modal.setAttribute("role", "status"); document.body.append(modal); } modal.innerHTML = `<div><span class="rank-emblem rank-${ranks.indexOf(rank)}" aria-hidden="true">${rank.glyph}</span><p>Rank Up</p><strong>${rank.title}</strong></div>`; modal.hidden = false; modal.classList.add("active"); overlayTimer = setTimeout(() => { modal.classList.remove("active"); modal.hidden = true; }, 2400); }
  global.addEventListener("tictactoe:match-complete", (event) => eventResult(event.detail));
  global.addEventListener("tictactoe:feature-complete", (event) => featureResult(event.detail));
  global.addEventListener("tictactoe:campaign-progress", () => update(null, true));
  global.openProgression = open; global.closeProgression = close;
  global.TicTacToeProgression = Object.freeze({ refresh: reconcileAndRender, award, snapshot: () => { const data = save()?.get(); return data ? { score: score(data), rank: activeRank(data).title, next: next(data)?.id || null } : null; } });
  reconcileAndRender();
}(window));
