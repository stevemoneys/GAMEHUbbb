export class Effects {
  static pulse(timeSec, hz, minValue, maxValue) {
    const wave = (Math.sin(timeSec * Math.PI * 2 * hz) + 1) * 0.5;
    return minValue + ((maxValue - minValue) * wave);
  }

  static floatOffset(timeSec, hz, amplitude) {
    return Math.sin(timeSec * Math.PI * 2 * hz) * amplitude;
  }

  static shimmerAlpha(timeSec, hz, minAlpha, maxAlpha, phase = 0) {
    const wave = (Math.sin((timeSec * Math.PI * 2 * hz) + phase) + 1) * 0.5;
    return minAlpha + ((maxAlpha - minAlpha) * wave);
  }
}
