import { Vector2 } from "../core/Vector2.js";

const directionVectors = {
  up: new Vector2(0, -1),
  down: new Vector2(0, 1),
  left: new Vector2(-1, 0),
  right: new Vector2(1, 0)
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angleRad) {
  let angle = angleRad;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export class SnakeSystem {
  constructor(config) {
    this.config = config;
    this.cellSizePx = config.world.cellSize;
    this.segmentSpacingPx = config.snake.segmentSpacing * this.cellSizePx;
    this.maxTurnQueue = config.snake.maxTurnQueue;
    this.turnQueue = [];
    this.pendingGrowth = 0;
    this.segments = [];
    this.prevSegments = [];
    this.interpolatedSegments = [];
    this.headPath = [];
    this.trailPointsBuffer = [];

    this.baseSpeedCellsPerSec = config.snake.speedCellsPerSecond;
    this.maxSpeedCellsPerSec = config.snake.maxSpeedCellsPerSecond;
    this.speedGainPerScore = config.snake.speedGainPerScore;
    this.speedGainPerSecond = config.snake.speedGainPerSecond;
    this.accelerationCellsPerSec = config.snake.accelerationCellsPerSecond;
    this.turnSpeedRadPerSec = (config.snake.turnSpeedDegPerSecond * Math.PI) / 180;
    this.headPulseAmplitude = config.snake.headPulseAmplitude;
    this.headPulseFrequencyHz = config.snake.headPulseFrequencyHz;

    this.currentSpeedCellsPerSec = this.baseSpeedCellsPerSec;
    this.targetSpeedCellsPerSec = this.baseSpeedCellsPerSec;
    this.speedPxPerSec = this.currentSpeedCellsPerSec * this.cellSizePx;

    this.targetDirection = directionVectors.right.clone();
    this.movementAngleRad = Math.atan2(this.targetDirection.y, this.targetDirection.x);
    this.targetAngleRad = this.movementAngleRad;

    this.pulseTime = 0;
    this.headScale = 1;
    this.prevHeadScale = 1;
    this.headPopScale = 0;
    this.historySampleStepPx = Math.max(2, this.segmentSpacingPx * 0.35);
    this.eatHeadPopDecay = config.vfx.feedback.eatHeadPopDecayPerSecond;
    this.runtimeModifiers = {
      speedMultiplier: 1,
      accelerationMultiplier: 1,
      turnRateMultiplier: 1,
      growthMultiplier: 1
    };
    this.growthBank = 0;

    this.#spawn();
  }

  setCellSize(nextCellSize) {
    if (!Number.isFinite(nextCellSize) || nextCellSize <= 0) return;
    const scale = nextCellSize / this.cellSizePx;
    this.cellSizePx = nextCellSize;
    this.segmentSpacingPx = this.config.snake.segmentSpacing * this.cellSizePx;
    this.historySampleStepPx = Math.max(2, this.segmentSpacingPx * 0.35);
    this.speedPxPerSec = this.currentSpeedCellsPerSec * this.cellSizePx;

    if (scale === 1) return;
    this.segments.forEach((segment) => {
      segment.x *= scale;
      segment.y *= scale;
    });
    this.prevSegments.forEach((segment) => {
      segment.x *= scale;
      segment.y *= scale;
    });
    this.interpolatedSegments.forEach((segment) => {
      segment.x *= scale;
      segment.y *= scale;
    });
    this.headPath.forEach((point) => {
      point.x *= scale;
      point.y *= scale;
    });
  }

  setDifficultyContext({ score, time }) {
    const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
    const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0;
    const speedFromScore = safeScore * this.speedGainPerScore;
    const speedFromTime = safeTime * this.speedGainPerSecond;
    const nextTarget = this.baseSpeedCellsPerSec + speedFromScore + speedFromTime;
    this.targetSpeedCellsPerSec = clamp(nextTarget, this.baseSpeedCellsPerSec, this.maxSpeedCellsPerSec);
  }

  #spawn() {
    const centerX = (this.config.world.cols * this.cellSizePx) * 0.5;
    const centerY = (this.config.world.rows * this.cellSizePx) * 0.5;
    this.segments = [];
    this.prevSegments = [];
    this.interpolatedSegments = [];

    for (let i = 0; i < this.config.snake.initialLength; i += 1) {
      const point = new Vector2(centerX - (i * this.segmentSpacingPx), centerY);
      this.segments.push(point.clone());
      this.prevSegments.push(point.clone());
      this.interpolatedSegments.push(point.clone());
    }

    this.#buildInitialPath();
  }

  #buildInitialPath() {
    this.headPath = [];
    const head = this.segments[0];
    const spacing = this.historySampleStepPx;
    const requiredLength = (this.segments.length + 4) * this.segmentSpacingPx;
    const reverseDirX = -this.targetDirection.x;
    const reverseDirY = -this.targetDirection.y;
    const steps = Math.ceil(requiredLength / spacing);

    for (let i = 0; i <= steps; i += 1) {
      const distance = i * spacing;
      this.headPath.push(new Vector2(
        head.x + (reverseDirX * distance),
        head.y + (reverseDirY * distance)
      ));
    }
  }

  reset() {
    this.turnQueue.length = 0;
    this.pendingGrowth = 0;
    this.currentSpeedCellsPerSec = this.baseSpeedCellsPerSec;
    this.targetSpeedCellsPerSec = this.baseSpeedCellsPerSec;
    this.speedPxPerSec = this.currentSpeedCellsPerSec * this.cellSizePx;
    this.targetDirection = directionVectors.right.clone();
    this.movementAngleRad = Math.atan2(this.targetDirection.y, this.targetDirection.x);
    this.targetAngleRad = this.movementAngleRad;
    this.pulseTime = 0;
    this.headScale = 1;
    this.prevHeadScale = 1;
    this.headPopScale = 0;
    this.runtimeModifiers.speedMultiplier = 1;
    this.runtimeModifiers.accelerationMultiplier = 1;
    this.runtimeModifiers.turnRateMultiplier = 1;
    this.runtimeModifiers.growthMultiplier = 1;
    this.growthBank = 0;
    this.#spawn();
  }

  enqueueDirection(dirName) {
    const dir = directionVectors[dirName];
    if (!dir) return;

    const lastQueued = this.turnQueue[this.turnQueue.length - 1] || this.targetDirection;
    const isSame = lastQueued.x === dir.x && lastQueued.y === dir.y;
    if (isSame) return;

    const isReverse = (lastQueued.x + dir.x === 0) && (lastQueued.y + dir.y === 0);
    if (isReverse) return;

    if (this.turnQueue.length < this.maxTurnQueue) {
      this.turnQueue.push(dir.clone());
    }
  }

  #applyNextTurnFromQueue() {
    if (this.turnQueue.length === 0) return;
    this.targetDirection = this.turnQueue.shift();
    this.targetAngleRad = Math.atan2(this.targetDirection.y, this.targetDirection.x);
  }

  #updateSpeed(dt) {
    const lengthRatio = clamp(
      (this.segments.length - this.config.snake.initialLength) / 28,
      0,
      1
    );
    const momentumSpeedFactor = 1 - (lengthRatio * 0.06);
    const effectiveTarget = this.targetSpeedCellsPerSec
      * this.runtimeModifiers.speedMultiplier
      * momentumSpeedFactor;
    const delta = effectiveTarget - this.currentSpeedCellsPerSec;
    const maxChange = this.accelerationCellsPerSec * this.runtimeModifiers.accelerationMultiplier * dt;
    this.currentSpeedCellsPerSec += clamp(delta, -maxChange, maxChange);
    this.speedPxPerSec = this.currentSpeedCellsPerSec * this.cellSizePx;
  }

  #updateTurning(dt) {
    const lengthRatio = clamp(
      (this.segments.length - this.config.snake.initialLength) / 26,
      0,
      1
    );
    const momentumTurnFactor = 1 - (lengthRatio * 0.24);
    const maxTurn = this.turnSpeedRadPerSec
      * this.runtimeModifiers.turnRateMultiplier
      * momentumTurnFactor
      * dt;
    const angleDelta = normalizeAngle(this.targetAngleRad - this.movementAngleRad);
    const turnAmount = clamp(angleDelta, -maxTurn, maxTurn);
    this.movementAngleRad = normalizeAngle(this.movementAngleRad + turnAmount);
  }

  #recordHeadTrail(prevHead, nextHead) {
    const dx = nextHead.x - prevHead.x;
    const dy = nextHead.y - prevHead.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / this.historySampleStepPx));

    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      this.headPath.unshift(new Vector2(
        prevHead.x + (dx * t),
        prevHead.y + (dy * t)
      ));
    }

    this.#trimHeadTrail();
  }

  #trimHeadTrail() {
    const maxDistance = (this.segments.length + 4) * this.segmentSpacingPx;
    let traveled = 0;

    for (let i = 0; i < this.headPath.length - 1; i += 1) {
      const a = this.headPath[i];
      const b = this.headPath[i + 1];
      traveled += Math.hypot(a.x - b.x, a.y - b.y);
      if (traveled >= maxDistance) {
        this.headPath.length = i + 2;
        return;
      }
    }
  }

  #sampleTrailAtDistance(targetDistance) {
    if (this.headPath.length === 0) return new Vector2(0, 0);
    if (targetDistance <= 0) return this.headPath[0].clone();

    let traveled = 0;
    for (let i = 0; i < this.headPath.length - 1; i += 1) {
      const a = this.headPath[i];
      const b = this.headPath[i + 1];
      const sectionDist = Math.hypot(a.x - b.x, a.y - b.y);

      if (traveled + sectionDist >= targetDistance && sectionDist > 0) {
        const t = (targetDistance - traveled) / sectionDist;
        return new Vector2(
          a.x + ((b.x - a.x) * t),
          a.y + ((b.y - a.y) * t)
        );
      }

      traveled += sectionDist;
    }

    return this.headPath[this.headPath.length - 1].clone();
  }

  #updateBodyFromTrail() {
    for (let i = 1; i < this.segments.length; i += 1) {
      const targetDistance = i * this.segmentSpacingPx;
      const point = this.#sampleTrailAtDistance(targetDistance);
      this.segments[i].x = point.x;
      this.segments[i].y = point.y;
    }
  }

  #updateHeadPulse(dt) {
    const speedRatio = clamp(
      (this.currentSpeedCellsPerSec - this.baseSpeedCellsPerSec)
        / Math.max(0.001, this.maxSpeedCellsPerSec - this.baseSpeedCellsPerSec),
      0,
      1
    );
    this.pulseTime += dt * (Math.PI * 2) * this.headPulseFrequencyHz;
    const wave = Math.sin(this.pulseTime);
    this.headPopScale = Math.max(0, this.headPopScale - (this.eatHeadPopDecay * dt));
    this.headScale = 1
      + (wave * this.headPulseAmplitude * (0.4 + speedRatio * 0.6))
      + this.headPopScale;
  }

  #copyCurrentToPrevious() {
    while (this.prevSegments.length < this.segments.length) {
      const seg = this.segments[this.prevSegments.length];
      this.prevSegments.push(seg.clone());
      this.interpolatedSegments.push(seg.clone());
    }

    for (let i = 0; i < this.segments.length; i += 1) {
      this.prevSegments[i].x = this.segments[i].x;
      this.prevSegments[i].y = this.segments[i].y;
    }
  }

  update(dt) {
    this.#copyCurrentToPrevious();
    this.prevHeadScale = this.headScale;
    this.#applyNextTurnFromQueue();
    this.#updateSpeed(dt);
    this.#updateTurning(dt);

    const moveDir = new Vector2(Math.cos(this.movementAngleRad), Math.sin(this.movementAngleRad));
    const head = this.segments[0];
    const prevHead = head.clone();
    head.addScaled(moveDir, this.speedPxPerSec * dt);

    this.#recordHeadTrail(prevHead, head);
    this.#updateBodyFromTrail();

    while (this.pendingGrowth > 0) {
      const tail = this.segments[this.segments.length - 1];
      const nextTail = new Vector2(tail.x, tail.y);
      this.segments.push(nextTail);
      this.prevSegments.push(nextTail.clone());
      this.interpolatedSegments.push(nextTail.clone());
      this.pendingGrowth -= 1;
    }

    this.#updateHeadPulse(dt);
  }

  grow(amount = 1) {
    const safeAmount = Math.max(0, Number.isFinite(amount) ? amount : 0);
    this.growthBank += safeAmount * this.runtimeModifiers.growthMultiplier;
    while (this.growthBank >= 1) {
      this.pendingGrowth += 1;
      this.growthBank -= 1;
    }
  }

  triggerEatHeadPop(amount = this.config.vfx.feedback.eatHeadPop) {
    this.headPopScale = Math.max(this.headPopScale, amount);
  }

  getHead() {
    return this.segments[0];
  }

  getHeadRadius() {
    return Math.max(8, this.segmentSpacingPx * 0.58);
  }

  getHeadScale() {
    return this.headScale;
  }

  getInterpolatedHeadScale(alpha) {
    return this.prevHeadScale + ((this.headScale - this.prevHeadScale) * alpha);
  }

  getInterpolatedSegments(alpha) {
    const t = clamp(alpha, 0, 1);
    const maxLen = Math.min(this.segments.length, this.prevSegments.length);
    while (this.interpolatedSegments.length < maxLen) {
      this.interpolatedSegments.push(this.segments[this.interpolatedSegments.length].clone());
    }

    for (let i = 0; i < maxLen; i += 1) {
      const prev = this.prevSegments[i];
      const curr = this.segments[i];
      const out = this.interpolatedSegments[i];
      out.x = prev.x + ((curr.x - prev.x) * t);
      out.y = prev.y + ((curr.y - prev.y) * t);
    }
    this.interpolatedSegments.length = maxLen;
    return this.interpolatedSegments;
  }

  getHeadTrailPoints(maxPoints = 72, step = 2) {
    this.trailPointsBuffer.length = 0;
    const safeStep = Math.max(1, Math.floor(step));
    for (let i = 0; i < this.headPath.length && this.trailPointsBuffer.length < maxPoints; i += safeStep) {
      this.trailPointsBuffer.push(this.headPath[i]);
    }
    return this.trailPointsBuffer;
  }

  getCurrentSpeedPxPerSecond() {
    return this.speedPxPerSec;
  }

  getCurrentDirectionVector() {
    return {
      x: Math.cos(this.movementAngleRad),
      y: Math.sin(this.movementAngleRad)
    };
  }

  getTargetDirectionVector() {
    return {
      x: this.targetDirection.x,
      y: this.targetDirection.y
    };
  }

  getSegmentCount() {
    return this.segments.length;
  }

  shrink(amount = 1, minLength = Math.max(4, Math.floor(this.config.snake.initialLength * 0.5))) {
    const safeAmount = Math.max(0, Math.floor(amount || 0));
    const targetLength = Math.max(minLength, this.segments.length - safeAmount);
    if (targetLength >= this.segments.length) return 0;

    const removed = this.segments.length - targetLength;
    this.segments.length = targetLength;
    this.prevSegments.length = Math.min(this.prevSegments.length, targetLength);
    this.interpolatedSegments.length = Math.min(this.interpolatedSegments.length, targetLength);
    this.#trimHeadTrail();
    return removed;
  }

  getMassRatio() {
    return clamp(
      (this.segments.length - this.config.snake.initialLength) / 28,
      0,
      1
    );
  }

  setRuntimeModifiers(modifiers = {}) {
    if (Number.isFinite(modifiers.speedMultiplier)) {
      this.runtimeModifiers.speedMultiplier = Math.max(0.45, modifiers.speedMultiplier);
    }
    if (Number.isFinite(modifiers.accelerationMultiplier)) {
      this.runtimeModifiers.accelerationMultiplier = Math.max(0.45, modifiers.accelerationMultiplier);
    }
    if (Number.isFinite(modifiers.turnRateMultiplier)) {
      this.runtimeModifiers.turnRateMultiplier = Math.max(0.45, modifiers.turnRateMultiplier);
    }
    if (Number.isFinite(modifiers.growthMultiplier)) {
      this.runtimeModifiers.growthMultiplier = Math.max(0.25, modifiers.growthMultiplier);
    }
  }

  setPose(headX, headY, dirName = "right") {
    const dir = directionVectors[dirName] || directionVectors.right;
    this.turnQueue.length = 0;
    this.targetDirection = dir.clone();
    this.movementAngleRad = Math.atan2(dir.y, dir.x);
    this.targetAngleRad = this.movementAngleRad;

    const segmentCount = this.segments.length || this.config.snake.initialLength;
    const reverseX = -dir.x;
    const reverseY = -dir.y;
    this.segments.length = 0;
    this.prevSegments.length = 0;
    this.interpolatedSegments.length = 0;

    for (let i = 0; i < segmentCount; i += 1) {
      const px = headX + (reverseX * this.segmentSpacingPx * i);
      const py = headY + (reverseY * this.segmentSpacingPx * i);
      const point = new Vector2(px, py);
      this.segments.push(point.clone());
      this.prevSegments.push(point.clone());
      this.interpolatedSegments.push(point.clone());
    }

    this.#buildInitialPath();
  }

  wrapInside(widthPx, heightPx) {
    let wrapped = false;
    const head = this.segments[0];

    if (head.x < 0) {
      head.x += widthPx;
      wrapped = true;
    } else if (head.x >= widthPx) {
      head.x -= widthPx;
      wrapped = true;
    }

    if (head.y < 0) {
      head.y += heightPx;
      wrapped = true;
    } else if (head.y >= heightPx) {
      head.y -= heightPx;
      wrapped = true;
    }

    if (wrapped) {
      this.#buildInitialPath();
      this.#updateBodyFromTrail();
    }
  }

  stabilizeInside(bounds, padding = 4) {
    if (!bounds) return;
    const head = this.segments[0];
    const minX = (bounds.x ?? 0) + padding;
    const minY = (bounds.y ?? 0) + padding;
    const maxX = (bounds.x ?? 0) + bounds.width - padding;
    const maxY = (bounds.y ?? 0) + bounds.height - padding;
    head.x = clamp(head.x, minX, maxX);
    head.y = clamp(head.y, minY, maxY);
    this.#buildInitialPath();
    this.#updateBodyFromTrail();
  }
}
