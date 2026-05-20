export class WorldPulseSystem {
  getPulse(timeSec, heat = 0) {
    const base = 0.5 + (Math.sin(timeSec * 0.42) * 0.5);
    return 0.12 + (base * 0.08) + (heat * 0.12);
  }
}
