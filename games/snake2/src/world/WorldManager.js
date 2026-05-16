import { ArenaGenerator } from "./ArenaGenerator.js";
import { WorldBounds } from "./WorldBounds.js";

export class WorldManager {
  constructor(config) {
    this.config = config;
    this.viewWidth = config.render.worldWidth;
    this.viewHeight = config.render.worldHeight;
    this.bounds = new WorldBounds(this.viewWidth, this.viewHeight);
    this.modeName = "classic";
  }

  initialize(modeName = "classic") {
    this.modeName = String(modeName || "classic").toLowerCase();
    const arena = ArenaGenerator.generate(this.modeName, this.viewWidth, this.viewHeight);
    this.bounds = new WorldBounds(arena.width, arena.height, arena);
    return this.bounds;
  }

  applyToRenderer(renderer) {
    renderer?.setWorldSize(this.bounds.width, this.bounds.height);
    renderer?.setCameraViewport(this.viewWidth, this.viewHeight);
  }

  getBounds() {
    return this.bounds.getSize();
  }

  getCollisionBounds() {
    return this.bounds.getCollisionBounds();
  }

  getSpawnBounds() {
    return this.bounds.getSpawnBounds();
  }

  getSoftBoundary() {
    return this.bounds.getSoftBoundary();
  }

  getSpawnPoints(modeName = this.modeName) {
    const bounds = this.bounds.getSize();
    const centerY = bounds.height * 0.5;
    const centerX = bounds.width * 0.5;
    const spawn = this.bounds.getSpawnBounds();
    const player = { x: centerX, y: centerY, dir: "right" };
    const ai = { x: centerX, y: centerY, dir: "left" };

    if (modeName === "duel") {
      player.x = spawn.x + (spawn.width * 0.28);
      ai.x = spawn.x + (spawn.width * 0.72);
    }

    return { player, ai };
  }

  getVisibleBounds(cameraState, padding = 140) {
    const safeState = cameraState || {};
    const width = Number.isFinite(safeState.viewWidthWorld) ? safeState.viewWidthWorld : this.viewWidth;
    const height = Number.isFinite(safeState.viewHeightWorld) ? safeState.viewHeightWorld : this.viewHeight;
    const cx = Number.isFinite(safeState.x) ? safeState.x : (this.bounds.width * 0.5);
    const cy = Number.isFinite(safeState.y) ? safeState.y : (this.bounds.height * 0.5);

    return {
      x: cx - (width * 0.5) - padding,
      y: cy - (height * 0.5) - padding,
      width: width + (padding * 2),
      height: height + (padding * 2)
    };
  }
}
