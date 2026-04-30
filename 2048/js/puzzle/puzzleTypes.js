export const PUZZLE_ZONES = Object.freeze([
  { id: "foundation", name: "Foundation", range: [1, 20], mood: "Comfortable starts with obvious wins." },
  { id: "strategy", name: "Strategy", range: [21, 40], mood: "Fewer moves, sharper choices." },
  { id: "advanced", name: "Advanced", range: [41, 60], mood: "Tighter boards with real tension." },
  { id: "expert", name: "Expert", range: [61, 80], mood: "Planning matters every turn." },
  { id: "elite", name: "Elite", range: [81, 100], mood: "Late-game twist rooms and wow moments." }
]);

export const PUZZLE_TYPES = Object.freeze({
  merge: {
    id: "merge",
    label: "Merge Puzzle",
    shortGoal: "Build the target tile with clean merges.",
    accent: "#7fd6ff"
  },
  chain: {
    id: "chain",
    label: "Chain Reaction",
    shortGoal: "Trigger a sequence of satisfying merges.",
    accent: "#80f3b8"
  },
  positioning: {
    id: "positioning",
    label: "Positioning Puzzle",
    shortGoal: "Place shots carefully to open the right lane.",
    accent: "#ffd777"
  },
  escape: {
    id: "escape",
    label: "Escape Puzzle",
    shortGoal: "Survive a crowded board and find the gap.",
    accent: "#ff9f88"
  },
  trick: {
    id: "trick",
    label: "Trick Puzzle",
    shortGoal: "Ignore the obvious move and find the smart one.",
    accent: "#f3a6ff"
  },
  limited: {
    id: "limited",
    label: "Limited Moves",
    shortGoal: "Solve it before your short move budget runs out.",
    accent: "#ffe890"
  },
  combo: {
    id: "combo",
    label: "Combo Puzzle",
    shortGoal: "Create a premium combo finish.",
    accent: "#98b6ff"
  }
});

export const ZONE_TYPE_CYCLES = Object.freeze({
  foundation: ["merge", "merge", "positioning", "limited", "chain", "merge", "combo", "positioning", "limited", "combo"],
  strategy: ["positioning", "limited", "chain", "merge", "trick", "limited", "combo", "positioning", "escape", "combo"],
  advanced: ["escape", "chain", "combo", "limited", "positioning", "escape", "chain", "trick", "limited", "combo"],
  expert: ["positioning", "limited", "escape", "chain", "trick", "combo", "positioning", "limited", "escape", "combo"],
  elite: ["trick", "escape", "combo", "limited", "positioning", "chain", "gravity", "trick", "escape", "combo"]
});

export function getPuzzleZone(level) {
  const safeLevel = Math.max(1, Math.min(100, Number(level) || 1));
  return PUZZLE_ZONES.find((zone) => safeLevel >= zone.range[0] && safeLevel <= zone.range[1]) || PUZZLE_ZONES[0];
}

export function getPuzzleTypeForLevel(level) {
  const zone = getPuzzleZone(level);
  const cycle = ZONE_TYPE_CYCLES[zone.id] || ZONE_TYPE_CYCLES.foundation;
  const offset = (Math.max(1, level) - zone.range[0]) % cycle.length;
  return cycle[offset];
}

export function getPuzzleTypeMeta(typeId) {
  if (typeId === "gravity") {
    return {
      id: "gravity",
      label: "Gravity Shift",
      shortGoal: "Solve it while the board wants to flip the flow.",
      accent: "#8ef5ff"
    };
  }

  return PUZZLE_TYPES[typeId] || PUZZLE_TYPES.merge;
}
