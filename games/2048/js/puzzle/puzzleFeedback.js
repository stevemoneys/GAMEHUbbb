export function getPuzzlePraise(progressRatio, merged) {
  if (progressRatio >= 1) {
    return "Brilliant";
  }
  if (merged >= 3 || progressRatio >= 0.72) {
    return "Great";
  }
  if (merged > 0 || progressRatio >= 0.4) {
    return "Nice";
  }
  return "";
}

export function getPuzzleNearMessage(progressRatio) {
  if (progressRatio >= 0.88) {
    return "Almost!";
  }
  if (progressRatio >= 0.7) {
    return "So close!";
  }
  return "";
}

export function getPuzzleFailureMessage(config, movesUsed) {
  const best = Number(config.optimalMoves || config.moveLimit || 0);
  if (movesUsed <= best + 1) {
    return "Almost! One smarter move solves this room.";
  }
  return "Almost! Retry with cleaner setup and timing.";
}

export function formatStars(stars) {
  const safeStars = Math.max(0, Math.min(3, Number(stars) || 0));
  return `${safeStars >= 1 ? "\u2605" : "\u2606"}${safeStars >= 2 ? "\u2605" : "\u2606"}${safeStars >= 3 ? "\u2605" : "\u2606"}`;
}
