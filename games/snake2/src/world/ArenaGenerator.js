export class ArenaGenerator {
  static generate(modeName, viewWidth, viewHeight) {
    const mode = String(modeName || "classic").toLowerCase();
    const multiplierMap = {
      classic: 3.4,
      speed: 3.8,
      survival: 4.2,
      duel: 3.1
    };
    const multiplier = multiplierMap[mode] || multiplierMap.classic;
    const width = Math.round(viewWidth * multiplier);
    const height = Math.round(viewHeight * multiplier);
    const minSide = Math.min(width, height);

    return {
      width,
      height,
      softMargin: Math.round(minSide * 0.11),
      boundaryFade: Math.round(minSide * 0.1),
      spawnInset: Math.round(minSide * 0.16)
    };
  }
}
