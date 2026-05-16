export const gameConfig = {
  world: {
    cols: 32,
    rows: 18,
    cellSize: 30
  },
  snake: {
    initialLength: 12,
    segmentSpacing: 0.75,
    speedCellsPerSecond: 7.2,
    maxSpeedCellsPerSecond: 14.8,
    speedGainPerScore: 0.024,
    speedGainPerSecond: 0.014,
    accelerationCellsPerSecond: 11.8,
    turnSpeedDegPerSecond: 780,
    headPulseAmplitude: 0.05,
    headPulseFrequencyHz: 2.2,
    maxTurnQueue: 2,
    selfCollisionIgnoreCount: 4
  },
  input: {
    bufferSize: 2
  },
  food: {
    radiusPx: 11,
    spawnPaddingPx: 12,
    maxSpawnAttempts: 400,
    commonTargetCount: 4,
    specialTargetCount: 1,
    fragmentTargetCount: 1,
    rareSpawnInterval: 11,
    fragmentSpawnInterval: 18,
    magnetPullRadiusPx: 220,
    magnetPullStrength: 4.1
  },
  scoring: {
    foodPoints: 10
  },
  modes: {
    defaultMode: "classic",
    difficulty: "normal"
  },
  ai: {
    defaultPersonality: "smart",
    dynamicThinkBoost: 0
  },
  render: {
    quality: "auto",
    worldWidth: 960,
    worldHeight: 540,
    worldTexturePath: "assets/images/gameplay-bg.png",
    worldTextureTileWidth: 420,
    letterboxColor: "#02040b",
    worldBackgroundTop: "rgba(10, 35, 64, 0.95)",
    worldBackgroundBottom: "rgba(2, 9, 19, 0.96)",
    gridMinorAlpha: 0.07,
    gridMajorAlpha: 0.14,
    hudTextColor: "#d9f4ff",
    snakeGlowMin: 12,
    snakeGlowMax: 20,
    foodGlowMin: 14,
    foodGlowMax: 24,
    trailMaxPoints: 72,
    trailStep: 2,
    trailAlpha: 0.34,
    trailWidth: 16,
    foodOrbitCount: 4,
    flashDecayPerSecond: 5.2
  },
  vfx: {
    interpolation: {
      enabled: true
    },
    particles: {
      maxParticles: 130,
      burstCount: 18,
      minSpeed: 90,
      maxSpeed: 265,
      minLife: 0.24,
      maxLife: 0.58,
      minSize: 2.8,
      maxSize: 8.2,
      dragPerSecond: 2.1
    },
    shake: {
      eatIntensity: 3.6,
      crashIntensity: 11.5,
      decayPerSecond: 10.5
    },
    feedback: {
      eatHeadPop: 0.2,
      eatHeadPopDecayPerSecond: 8.8
    }
  }
};
