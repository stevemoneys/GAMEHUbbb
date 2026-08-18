export class CameraSmoothing {
  static damp(current, target, smoothness, dt) {
    const factor = 1 - Math.exp(-Math.max(0.001, smoothness) * Math.max(0, dt));
    return current + ((target - current) * factor);
  }
}
