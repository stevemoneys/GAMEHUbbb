import { formatStars } from "./puzzleFeedback.js";

export function getPuzzleGoalLabel(config) {
  return config.goal?.text || "Solve the puzzle room.";
}

export function getPuzzleMovesLabel(remaining, total) {
  return `${Math.max(0, remaining)}/${Math.max(0, total)} moves`;
}

export function getPuzzleHeaderCopy(config, record) {
  return {
    zone: config.zoneName,
    type: config.typeLabel,
    goal: getPuzzleGoalLabel(config),
    stars: formatStars(record?.stars || 0),
    special: config.specialTag || ""
  };
}
