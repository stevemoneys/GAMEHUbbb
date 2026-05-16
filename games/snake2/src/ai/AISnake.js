import { SnakeSystem } from "../systems/SnakeSystem.js";

export class AISnake {
  constructor(config) {
    this.config = config;
    this.snake = new SnakeSystem(config);
  }

  reset(bounds, side = "right") {
    this.snake.reset();
    const centerY = bounds.height * 0.5;
    if (side === "right") {
      this.snake.setPose(bounds.width * 0.78, centerY, "left");
    } else {
      this.snake.setPose(bounds.width * 0.22, centerY, "right");
    }
  }

  setPose(x, y, dirName = "left") {
    this.snake.setPose(x, y, dirName);
  }

  update(dt) {
    this.snake.update(dt);
  }

  enqueueDirection(dir) {
    this.snake.enqueueDirection(dir);
  }

  grow(amount = 1) {
    this.snake.grow(amount);
  }

  shrink(amount = 1, minLength) {
    return this.snake.shrink(amount, minLength);
  }

  getHead() {
    return this.snake.getHead();
  }

  getHeadRadius() {
    return this.snake.getHeadRadius();
  }

  getSegments() {
    return this.snake.segments;
  }

  getInterpolatedSegments(alpha) {
    return this.snake.getInterpolatedSegments(alpha);
  }

  getHeadScale(alpha) {
    return this.snake.getInterpolatedHeadScale(alpha);
  }

  getCurrentHeadScale() {
    return this.snake.getHeadScale();
  }

  getSegmentSpacingPx() {
    return this.snake.segmentSpacingPx;
  }

  getCurrentSpeedPxPerSecond() {
    return this.snake.getCurrentSpeedPxPerSecond();
  }

  getCurrentDirectionVector() {
    return this.snake.getCurrentDirectionVector();
  }

  getSegmentCount() {
    return this.snake.getSegmentCount();
  }

  setDifficultyContext(metrics) {
    this.snake.setDifficultyContext(metrics);
  }

  setRuntimeModifiers(modifiers) {
    this.snake.setRuntimeModifiers(modifiers);
  }

  stabilizeInside(bounds, padding = 4) {
    this.snake.stabilizeInside(bounds, padding);
  }
}
