export class GameEngine {
  constructor({ gameState, onUpdate, onRender, onIdleUpdate, fixedStep = 1 / 120 }) {
    this.state = gameState;
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.onIdleUpdate = onIdleUpdate || (() => {});
    this.fixedStep = fixedStep;
    this.maxFrameDelta = 0.1;
    this.maxStepsPerFrame = 8;
    this.accumulator = 0;
    this.lastTick = 0;
    this.rafId = null;
    this.isPaused = false;
  }

  start() {
    this.lastTick = performance.now();
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  setPause(nextPaused) {
    this.isPaused = nextPaused;
  }

  loop(now) {
    const dtRaw = (now - this.lastTick) / 1000;
    this.lastTick = now;
    const frameDt = Math.min(dtRaw, this.maxFrameDelta);
    this.accumulator += frameDt;

    if (this.isPaused || !this.state.isPlaying()) {
      // Prevent backlog jumps when resuming from pause or game-over.
      this.accumulator = 0;
      this.onIdleUpdate(frameDt);
      this.renderFrame();
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < this.maxStepsPerFrame) {
      this.state.time += this.fixedStep;
      this.onUpdate(this.fixedStep);
      this.accumulator -= this.fixedStep;
      steps += 1;
    }

    this.renderFrame();
    this.rafId = requestAnimationFrame(this.loop);
  }

  renderFrame() {
    const alpha = this.fixedStep > 0 ? this.accumulator / this.fixedStep : 0;
    this.onRender(Math.max(0, Math.min(1, alpha)));
  }
}
