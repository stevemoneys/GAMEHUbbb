import { CameraSmoothing } from "./CameraSmoothing.js";
import { CameraEffects } from "./CameraEffects.js";
import { CinematicCameraEffects } from "./CinematicCameraEffects.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class CameraSystem {
  constructor(config, worldManager) {
    this.config = config;
    this.worldManager = worldManager;
    this.effects = new CameraEffects(config);
    this.cinematic = new CinematicCameraEffects();
    this.baseViewWidth = config.render.worldWidth;
    this.baseViewHeight = config.render.worldHeight;
    this.viewportWidth = this.baseViewWidth;
    this.viewportHeight = this.baseViewHeight;
    this.current = {
      x: this.baseViewWidth * 0.5,
      y: this.baseViewHeight * 0.5,
      zoom: 1,
      shakeX: 0,
      shakeY: 0,
      viewWidthWorld: this.baseViewWidth,
      viewHeightWorld: this.baseViewHeight
    };
    this.previous = { ...this.current };
  }

  setViewportPixels(width, height) {
    if (Number.isFinite(width)) this.viewportWidth = Math.max(1, width);
    if (Number.isFinite(height)) this.viewportHeight = Math.max(1, height);
  }

  jumpTo(x, y, zoom = 1) {
    const next = {
      x,
      y,
      zoom,
      shakeX: 0,
      shakeY: 0,
      viewWidthWorld: this.baseViewWidth / zoom,
      viewHeightWorld: this.baseViewHeight / zoom
    };
    this.current = { ...next };
    this.previous = { ...next };
  }

  update(dt, snapshot = {}) {
    this.previous = { ...this.current };

    const targetX = Number.isFinite(snapshot.x) ? snapshot.x : this.current.x;
    const targetY = Number.isFinite(snapshot.y) ? snapshot.y : this.current.y;
    const direction = snapshot.direction || { x: 1, y: 0 };
    const speedPxPerSec = Number.isFinite(snapshot.speedPxPerSec) ? snapshot.speedPxPerSec : 0;
    const snakeLength = Number.isFinite(snapshot.snakeLength) ? snapshot.snakeLength : 12;
    const timeSec = Number.isFinite(snapshot.timeSec) ? snapshot.timeSec : 0;
    const heat = Number.isFinite(snapshot.heat) ? snapshot.heat : 0;
    const lookAhead = this.effects.getLookAhead(direction, speedPxPerSec);
    const desiredZoom = this.effects.getTargetZoom(speedPxPerSec, snakeLength);
    const externalShake = snapshot.shake || { x: 0, y: 0 };
    const breathing = this.cinematic.getBreathingOffset(timeSec, speedPxPerSec, heat);
    const driftZoom = this.cinematic.getDriftZoom(timeSec, heat);

    const nextZoom = CameraSmoothing.damp(this.current.zoom, desiredZoom * driftZoom, 4.8, dt);
    const halfViewWidth = (this.baseViewWidth / nextZoom) * 0.5;
    const halfViewHeight = (this.baseViewHeight / nextZoom) * 0.5;
    const clamped = this.worldManager.bounds.clampCamera(
      targetX + lookAhead.x + breathing.x,
      targetY + lookAhead.y + breathing.y,
      halfViewWidth,
      halfViewHeight
    );

    this.current.x = CameraSmoothing.damp(this.current.x, clamped.x, 6.5, dt);
    this.current.y = CameraSmoothing.damp(this.current.y, clamped.y, 6.5, dt);
    this.current.zoom = nextZoom;
    this.current.shakeX = CameraSmoothing.damp(this.current.shakeX, externalShake.x || 0, 12, dt);
    this.current.shakeY = CameraSmoothing.damp(this.current.shakeY, externalShake.y || 0, 12, dt);
    this.current.viewWidthWorld = this.baseViewWidth / this.current.zoom;
    this.current.viewHeightWorld = this.baseViewHeight / this.current.zoom;
  }

  getState(alpha = 1) {
    const t = clamp(alpha, 0, 1);
    const zoom = this.previous.zoom + ((this.current.zoom - this.previous.zoom) * t);
    return {
      x: this.previous.x + ((this.current.x - this.previous.x) * t),
      y: this.previous.y + ((this.current.y - this.previous.y) * t),
      zoom,
      shakeX: this.previous.shakeX + ((this.current.shakeX - this.previous.shakeX) * t),
      shakeY: this.previous.shakeY + ((this.current.shakeY - this.previous.shakeY) * t),
      viewWidthWorld: this.baseViewWidth / zoom,
      viewHeightWorld: this.baseViewHeight / zoom
    };
  }
}
