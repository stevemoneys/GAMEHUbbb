export class ArenaGenerator {
  static generate(modeName, viewWidth, viewHeight) {
    const mode = String(modeName || "classic").toLowerCase();
    const multiplierMap = {
      classic: 8.8,
      speed: 9.4,
      survival: 10.2,
      duel: 8.2
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
