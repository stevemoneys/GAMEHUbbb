import { Effects } from "./Effects.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function withAlpha(rgbaLike, alpha) {
  if (typeof rgbaLike !== "string") return `rgba(255,255,255,${alpha})`;
  const match = rgbaLike.match(/rgba?\(([^)]+)\)/i);
  if (!match) return rgbaLike;
  const parts = match[1].split(",").map((part) => part.trim());
  const rgb = parts.slice(0, 3).join(", ");
  return `rgba(${rgb}, ${alpha})`;
}

export class CanvasRenderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.deviceScale = 1;
    this.worldWidth = config.render.worldWidth;
    this.worldHeight = config.render.worldHeight;
    this.cameraViewWidth = config.render.worldWidth;
    this.cameraViewHeight = config.render.worldHeight;
    this.timeSec = 0;
    this.fit = { scale: 1, offsetX: 0, offsetY: 0 };
    this.fitMode = "contain";
    this.performanceProfile = {
      glowScale: 1,
      shadowScale: 1,
      resolutionScale: 1
    };
    this.lowPowerMode = false;
    this.camera = {
      x: this.worldWidth * 0.5,
      y: this.worldHeight * 0.5,
      zoom: 1
    };
    this.cameraShake = { x: 0, y: 0 };
    this.gridCache = {
      key: "",
      canvas: null
    };
    this.worldTexture = {
      image: null,
      loaded: false,
      failed: false,
      path: ""
    };
    this.#loadWorldTexture(config.render.worldTexturePath);
  }

  setWorldSize(width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    this.worldWidth = Math.max(1, width);
    this.worldHeight = Math.max(1, height);
    this.camera.x = this.worldWidth * 0.5;
    this.camera.y = this.worldHeight * 0.5;
    this.#recomputeFit();
  }

  #loadWorldTexture(path) {
    const texturePath = typeof path === "string" ? path.trim() : "";
    this.worldTexture.path = texturePath;
    this.worldTexture.loaded = false;
    this.worldTexture.failed = false;
    this.worldTexture.image = null;
    if (!texturePath) return;

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      this.worldTexture.image = image;
      this.worldTexture.loaded = true;
      this.worldTexture.failed = false;
    };
    image.onerror = () => {
      this.worldTexture.image = null;
      this.worldTexture.loaded = false;
      this.worldTexture.failed = true;
    };
    image.src = texturePath;
  }

  setCameraViewport(width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    this.cameraViewWidth = Math.max(1, width);
    this.cameraViewHeight = Math.max(1, height);
    this.#recomputeFit();
  }

  setFitMode(mode = "contain") {
    const normalized = mode === "cover" ? "cover" : "contain";
    if (this.fitMode === normalized) return;
    this.fitMode = normalized;
    this.#recomputeFit();
  }

  getWorldBounds() {
    return { width: this.worldWidth, height: this.worldHeight };
  }

  getViewportMetrics() {
    return {
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      viewWidth: this.cameraViewWidth,
      viewHeight: this.cameraViewHeight,
      fitScale: this.fit.scale
    };
  }

  setCameraState(state = {}) {
    if (Number.isFinite(state.x)) this.camera.x = state.x;
    if (Number.isFinite(state.y)) this.camera.y = state.y;
    if (Number.isFinite(state.zoom)) this.camera.zoom = Math.max(0.35, Math.min(2.25, state.zoom));
  }

  setCameraShake(offsetX, offsetY) {
    const tx = Number.isFinite(offsetX) ? offsetX : 0;
    const ty = Number.isFinite(offsetY) ? offsetY : 0;
    this.cameraShake.x += (tx - this.cameraShake.x) * 0.34;
    this.cameraShake.y += (ty - this.cameraShake.y) * 0.34;
  }

  setPerformanceProfile(profile = {}) {
    if (Number.isFinite(profile.glowScale)) this.performanceProfile.glowScale = Math.max(0.4, Math.min(1.4, profile.glowScale));
    if (Number.isFinite(profile.shadowScale)) this.performanceProfile.shadowScale = Math.max(0.4, Math.min(1.4, profile.shadowScale));
    if (Number.isFinite(profile.resolutionScale)) this.performanceProfile.resolutionScale = Math.max(0.75, Math.min(1, profile.resolutionScale));
    this.resizeToParent();
  }

  setLowPowerMode(enabled) {
    this.lowPowerMode = Boolean(enabled);
  }

  worldToScreen(x, y) {
    const centeredX = (x - this.camera.x) * this.camera.zoom;
    const centeredY = (y - this.camera.y) * this.camera.zoom;
    return {
      x: this.fit.offsetX + ((centeredX + this.cameraViewWidth * 0.5) * this.fit.scale),
      y: this.fit.offsetY + ((centeredY + this.cameraViewHeight * 0.5) * this.fit.scale)
    };
  }

  resizeToParent() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const resolutionScale = this.performanceProfile.resolutionScale;
    const nextWidth = Math.max(1, Math.floor(rect.width));
    const nextHeight = Math.max(1, Math.floor(rect.height));

    this.canvas.width = Math.floor(nextWidth * dpr * resolutionScale);
    this.canvas.height = Math.floor(nextHeight * dpr * resolutionScale);
    this.canvas.style.width = `${nextWidth}px`;
    this.canvas.style.height = `${nextHeight}px`;

    this.viewportWidth = nextWidth;
    this.viewportHeight = nextHeight;
    this.deviceScale = dpr * resolutionScale;
    this.ctx.setTransform(this.deviceScale, 0, 0, this.deviceScale, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.#recomputeFit();
  }

  #recomputeFit() {
    const scaleX = this.viewportWidth / this.cameraViewWidth;
    const scaleY = this.viewportHeight / this.cameraViewHeight;
    const targetScale = this.fitMode === "cover"
      ? Math.max(scaleX, scaleY)
      : Math.min(scaleX, scaleY);
    const scale = Math.max(0.001, targetScale);
    const drawWidth = this.cameraViewWidth * scale;
    const drawHeight = this.cameraViewHeight * scale;

    this.fit.scale = scale;
    this.fit.offsetX = (this.viewportWidth - drawWidth) * 0.5;
    this.fit.offsetY = (this.viewportHeight - drawHeight) * 0.5;
  }

  #withWorldTransform(drawFn) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.fit.offsetX, this.fit.offsetY);
    ctx.scale(this.fit.scale, this.fit.scale);
    ctx.translate(this.cameraViewWidth * 0.5, this.cameraViewHeight * 0.5);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x + this.cameraShake.x, -this.camera.y + this.cameraShake.y);
    drawFn(ctx);
    ctx.restore();
  }

  drawWorldLayer(drawFn) {
    if (typeof drawFn !== "function") return;
    this.#withWorldTransform(drawFn);
  }

  drawScreenLayer(drawFn) {
    if (typeof drawFn !== "function") return;
    const ctx = this.ctx;
    ctx.save();
    drawFn(ctx, {
      width: this.viewportWidth,
      height: this.viewportHeight,
      fit: { ...this.fit }
    });
    ctx.restore();
  }

  clear(timeSec = 0) {
    this.timeSec = timeSec;
    const ctx = this.ctx;

    // Letterbox background.
    ctx.save();
    ctx.fillStyle = this.config.render.letterboxColor;
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    ctx.restore();

    // Draw world backdrop in centered, aspect-preserving viewport.
    this.#withWorldTransform((worldCtx) => {
      const bg = worldCtx.createLinearGradient(0, 0, 0, this.worldHeight);
      bg.addColorStop(0, this.config.render.worldBackgroundTop);
      bg.addColorStop(1, this.config.render.worldBackgroundBottom);
      worldCtx.fillStyle = bg;
      worldCtx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      if (this.worldTexture.loaded && this.worldTexture.image) {
        const tileWidth = Math.max(64, this.config.render.worldTextureTileWidth || 420);
        const image = this.worldTexture.image;
        const aspect = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 1;
        const tileHeight = Math.max(64, tileWidth * aspect);
        for (let y = 0; y < this.worldHeight; y += tileHeight) {
          for (let x = 0; x < this.worldWidth; x += tileWidth) {
            worldCtx.drawImage(image, x, y, tileWidth, tileHeight);
          }
        }

        worldCtx.fillStyle = "rgba(4, 10, 20, 0.34)";
        worldCtx.fillRect(0, 0, this.worldWidth, this.worldHeight);
      }
    });
  }

  drawGrid(cellSize) {
    if (this.worldTexture.loaded) return;
    const gridCanvas = this.#getGridCanvas(cellSize);
    if (!gridCanvas) return;
    this.#withWorldTransform((ctx) => {
      ctx.drawImage(gridCanvas, 0, 0);
    });
  }

  #getGridCanvas(cellSize) {
    const key = [
      this.worldWidth,
      this.worldHeight,
      cellSize,
      this.config.render.gridMinorAlpha,
      this.config.render.gridMajorAlpha
    ].join("|");

    if (this.gridCache.key === key && this.gridCache.canvas) {
      return this.gridCache.canvas;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(this.worldWidth));
    canvas.height = Math.max(1, Math.floor(this.worldHeight));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    for (let x = 0; x <= this.worldWidth; x += cellSize) {
      const isMajor = x % (cellSize * 4) === 0;
      ctx.strokeStyle = isMajor
        ? `rgba(109, 241, 255, ${this.config.render.gridMajorAlpha})`
        : `rgba(109, 241, 255, ${this.config.render.gridMinorAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= this.worldHeight; y += cellSize) {
      const isMajor = y % (cellSize * 4) === 0;
      ctx.strokeStyle = isMajor
        ? `rgba(109, 241, 255, ${this.config.render.gridMajorAlpha})`
        : `rgba(109, 241, 255, ${this.config.render.gridMinorAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth, y);
      ctx.stroke();
    }

    this.gridCache.key = key;
    this.gridCache.canvas = canvas;
    return canvas;
  }

  drawSnake(segments, segmentSpacingPx, options = {}) {
    if (!segments || segments.length === 0) return;
    const headScale = Number.isFinite(options.headScale) ? options.headScale : 1;
    const speedPxPerSec = Number.isFinite(options.speedPxPerSec) ? options.speedPxPerSec : 0;
    const palette = options.palette || {
      spineStart: "rgba(149, 255, 227, 0.95)",
      spineMid: "rgba(91, 220, 174, 0.82)",
      spineEnd: "rgba(44, 112, 84, 0.7)",
      shadowHead: "rgba(112, 255, 214, 0.9)",
      shadowBody: "rgba(89, 224, 255, 0.5)",
      beadA: "rgba(201, 255, 238, 1)",
      beadB: "rgba(113, 242, 191, 1)",
      beadC: "rgba(34, 102, 74, 1)"
    };

    this.#withWorldTransform((ctx) => {
      const headRadius = Math.max(8, segmentSpacingPx * 0.62) * headScale;
      const bodyRadius = Math.max(6.5, segmentSpacingPx * 0.5);
      const speedFactor = clamp(speedPxPerSec / 360, 0, 1);
      const glowBlur = Effects.pulse(
        this.timeSec,
        1.35,
        this.config.render.snakeGlowMin,
        this.config.render.snakeGlowMax
      ) * (0.85 + speedFactor * 0.25) * this.performanceProfile.glowScale;
      const spineWidth = bodyRadius * 1.96;
      const head = segments[0];
      const tail = segments[segments.length - 1];

      // Connected glossy spine for premium fluidity.
      if (segments.length > 1) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = spineWidth;
        const spineGradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
        spineGradient.addColorStop(0, palette.spineStart);
        spineGradient.addColorStop(0.65, palette.spineMid);
        spineGradient.addColorStop(1, palette.spineEnd);
        ctx.strokeStyle = spineGradient;
        ctx.shadowColor = "rgba(97, 240, 255, 0.42)";
        ctx.shadowBlur = glowBlur * 0.65;
        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        for (let i = 1; i < segments.length; i += 1) {
          ctx.lineTo(segments[i].x, segments[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Segment pass to add glossy beads and bright head.
      for (let i = segments.length - 1; i >= 0; i -= 1) {
        const seg = segments[i];
        const lifeT = i / Math.max(1, segments.length - 1);
        const isHead = i === 0;
        const radius = isHead ? headRadius : bodyRadius * (1 - (lifeT * 0.08));
        const alpha = isHead ? 1 : 0.44 + ((1 - lifeT) * 0.4);

        ctx.save();
        ctx.shadowColor = isHead ? palette.shadowHead : palette.shadowBody;
        ctx.shadowBlur = (isHead ? glowBlur : glowBlur * 0.5) * this.performanceProfile.shadowScale;

        const bead = ctx.createRadialGradient(
          seg.x - radius * 0.3,
          seg.y - radius * 0.32,
          1,
          seg.x,
          seg.y,
          radius
        );
        bead.addColorStop(0, withAlpha(palette.beadA, alpha));
        bead.addColorStop(0.4, withAlpha(palette.beadB, alpha));
        bead.addColorStop(1, withAlpha(palette.beadC, alpha));
        ctx.fillStyle = bead;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  drawSnakeTrail(trailPoints, segmentSpacingPx, style = {}) {
    if (!trailPoints || trailPoints.length < 3) return;
    const maxWidth = Math.max(4, Math.min(this.config.render.trailWidth, segmentSpacingPx * 1.2));
    const maxAlpha = this.config.render.trailAlpha;
    const trailColor = style.color || "rgba(102,234,205,0.34)";
    const glowColor = style.glow || "rgba(88,222,255,0.85)";

    this.#withWorldTransform((ctx) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < trailPoints.length - 1; i += 1) {
        const a = trailPoints[i];
        const b = trailPoints[i + 1];
        const t = i / Math.max(1, trailPoints.length - 2);
        const alpha = maxAlpha * (1 - t) * (1 - t);
        const width = maxWidth * (1 - (t * 0.65));
        ctx.strokeStyle = withAlpha(trailColor, alpha);
        ctx.shadowColor = withAlpha(glowColor, alpha * 0.85);
        ctx.shadowBlur = 10 * (1 - t);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  drawFood(food, options = {}) {
    if (!food) return;
    const list = Array.isArray(food) ? food : [food];
    this.drawFoods(list, options);
  }

  drawFoods(foods, options = {}) {
    if (!foods || foods.length === 0) return;
    const flash = clamp(options.flash ?? 0, 0, 1);
    const foodStyle = options.style || {};
    this.#withWorldTransform((ctx) => {
      for (let i = 0; i < foods.length; i += 1) {
        this.#drawFoodItem(ctx, foods[i], flash, foodStyle);
      }
    });
  }

  #drawFoodItem(ctx, food, flash, foodStyle) {
    const baseRadius = food.radius;
    const pulse = Effects.pulse((this.timeSec + (food.phase || 0)), 0.82, 0.95, 1.1);
    const bob = Effects.floatOffset((this.timeSec + (food.wobbleSeed || 0)), 0.38, baseRadius * 0.2);
    const liveRadius = baseRadius * pulse;
    const foodY = food.y + bob;
    const foodCenter = foodStyle.center || "rgba(255, 247, 179, 1)";
    const foodMiddle = foodStyle.middle || "rgba(255, 126, 175, 0.98)";
    const foodEdge = foodStyle.edge || "rgba(119, 24, 69, 0.95)";
    const foodGlow = foodStyle.glow || "rgba(255, 130, 193, 0.85)";
    const foodSpark = foodStyle.sparkle || "rgba(255, 239, 197, 0.8)";
    const type = food.type || "energy_orb";
    const glowBlur = Effects.pulse(
      this.timeSec,
      1.1,
      this.config.render.foodGlowMin,
      this.config.render.foodGlowMax
    ) * this.performanceProfile.glowScale;

    const palettes = {
      energy_orb: { coreA: foodCenter, coreB: foodMiddle, edge: foodEdge, glow: foodGlow, spark: foodSpark },
      crystal_core: { coreA: "rgba(255, 245, 255, 1)", coreB: "rgba(255, 144, 219, 0.98)", edge: "rgba(114, 32, 102, 0.96)", glow: "rgba(255, 150, 226, 0.92)", spark: "rgba(255, 228, 252, 0.88)" },
      speed_boost: { coreA: "rgba(255, 251, 220, 1)", coreB: "rgba(255, 221, 92, 0.98)", edge: "rgba(94, 112, 255, 0.94)", glow: "rgba(255, 228, 120, 0.95)", spark: "rgba(255,255,255,0.9)" },
      shield_core: { coreA: "rgba(239, 249, 255, 1)", coreB: "rgba(116, 211, 255, 0.98)", edge: "rgba(34, 95, 152, 0.96)", glow: "rgba(128, 218, 255, 0.92)", spark: "rgba(227, 248, 255, 0.85)" },
      magnet_core: { coreA: "rgba(250, 241, 255, 1)", coreB: "rgba(169, 120, 255, 0.98)", edge: "rgba(88, 50, 150, 0.96)", glow: "rgba(180, 121, 255, 0.94)", spark: "rgba(242, 230, 255, 0.86)" },
      frenzy_core: { coreA: "rgba(255, 247, 220, 1)", coreB: "rgba(255, 129, 82, 0.98)", edge: "rgba(140, 33, 16, 0.96)", glow: "rgba(255, 136, 81, 0.95)", spark: "rgba(255, 225, 175, 0.86)" },
      freeze_pulse: { coreA: "rgba(244, 254, 255, 1)", coreB: "rgba(153, 236, 255, 0.98)", edge: "rgba(50, 110, 155, 0.96)", glow: "rgba(155, 239, 255, 0.94)", spark: "rgba(229, 250, 255, 0.87)" },
      corrupted_core: { coreA: "rgba(236, 220, 255, 1)", coreB: "rgba(170, 84, 255, 0.98)", edge: "rgba(42, 20, 59, 0.98)", glow: "rgba(198, 98, 255, 0.96)", spark: "rgba(255, 210, 255, 0.72)" },
      evolution_fragment: { coreA: "rgba(255, 248, 224, 1)", coreB: "rgba(174, 205, 255, 0.98)", edge: "rgba(88, 74, 138, 0.97)", glow: "rgba(255, 219, 145, 0.94)", spark: "rgba(249, 240, 202, 0.86)" }
    };
    const palette = palettes[type] || palettes.energy_orb;

    const orb = ctx.createRadialGradient(
      food.x - liveRadius * 0.25,
      foodY - liveRadius * 0.3,
      1,
      food.x,
      foodY,
      liveRadius
    );
    orb.addColorStop(0, palette.coreA);
    orb.addColorStop(0.42, palette.coreB);
    orb.addColorStop(1, palette.edge);

    ctx.save();
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = (glowBlur + (flash * 14)) * this.performanceProfile.shadowScale;
    ctx.fillStyle = orb;

    if (type === "crystal_core" || type === "freeze_pulse" || type === "evolution_fragment") {
      ctx.translate(food.x, foodY);
      ctx.rotate((food.rotation || 0) + (this.timeSec * 0.4));
      ctx.beginPath();
      ctx.moveTo(0, -liveRadius * 1.18);
      ctx.lineTo(liveRadius * 0.82, 0);
      ctx.lineTo(0, liveRadius * 1.18);
      ctx.lineTo(-liveRadius * 0.82, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
    } else if (type === "shield_core") {
      ctx.translate(food.x, foodY);
      ctx.rotate(food.rotation || 0);
      ctx.beginPath();
      for (let s = 0; s < 6; s += 1) {
        const angle = (Math.PI / 3) * s;
        const px = Math.cos(angle) * liveRadius;
        const py = Math.sin(angle) * liveRadius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
    } else {
      ctx.beginPath();
      ctx.arc(food.x, foodY, liveRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = withAlpha(palette.spark, 0.7);
    ctx.lineWidth = 1.5;
    ctx.translate(food.x, foodY);
    ctx.rotate((food.rotation || 0) + (this.timeSec * 0.7));
    if (type === "speed_boost") {
      ctx.beginPath();
      ctx.moveTo(-liveRadius * 0.28, -liveRadius * 0.95);
      ctx.lineTo(liveRadius * 0.08, -liveRadius * 0.1);
      ctx.lineTo(-liveRadius * 0.14, -liveRadius * 0.1);
      ctx.lineTo(liveRadius * 0.3, liveRadius * 0.95);
      ctx.lineTo(0, liveRadius * 0.16);
      ctx.lineTo(liveRadius * 0.18, liveRadius * 0.16);
      ctx.stroke();
    } else if (type === "magnet_core") {
      ctx.beginPath();
      ctx.arc(0, 0, liveRadius * 1.15, 0.4, Math.PI - 0.4);
      ctx.moveTo(-liveRadius * 0.85, liveRadius * 0.1);
      ctx.lineTo(-liveRadius * 0.85, liveRadius * 0.82);
      ctx.moveTo(liveRadius * 0.85, liveRadius * 0.1);
      ctx.lineTo(liveRadius * 0.85, liveRadius * 0.82);
      ctx.stroke();
    } else if (type === "shield_core") {
      ctx.beginPath();
      ctx.arc(0, 0, liveRadius * 1.24, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === "frenzy_core") {
      ctx.beginPath();
      for (let j = 0; j < 3; j += 1) {
        ctx.moveTo(0, 0);
        const angle = ((Math.PI * 2) / 3) * j;
        ctx.lineTo(Math.cos(angle) * liveRadius * 1.26, Math.sin(angle) * liveRadius * 1.26);
      }
      ctx.stroke();
    } else if (type === "corrupted_core") {
      ctx.beginPath();
      ctx.moveTo(-liveRadius, -liveRadius * 0.2);
      ctx.lineTo(liveRadius * 0.8, -liveRadius * 0.7);
      ctx.moveTo(-liveRadius * 0.7, liveRadius * 0.65);
      ctx.lineTo(liveRadius, liveRadius * 0.1);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, liveRadius * 1.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (flash > 0.01) {
      const flashRadius = liveRadius * (1.6 + flash * 1.2);
      const flashGradient = ctx.createRadialGradient(food.x, foodY, 1, food.x, foodY, flashRadius);
      flashGradient.addColorStop(0, `rgba(255, 248, 220, ${flash * 0.95})`);
      flashGradient.addColorStop(1, "rgba(255, 248, 220, 0)");
      ctx.save();
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(food.x, foodY, flashRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < this.config.render.foodOrbitCount; i += 1) {
      const phase = (food.orbitPhase || 0) + i * (Math.PI * 0.5);
      const sparkleDist = liveRadius * (type === "magnet_core" ? 1.7 : 1.4);
      const sparkleX = food.x + (Math.cos((this.timeSec * 1.7) + phase) * sparkleDist);
      const sparkleY = foodY + (Math.sin((this.timeSec * 1.2) + phase) * sparkleDist * 0.6);
      const alpha = Effects.shimmerAlpha(this.timeSec, 2.3, 0.2, 0.7, phase);

      ctx.save();
      ctx.fillStyle = withAlpha(palette.spark, alpha);
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, liveRadius * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(particles) {
    if (!particles || particles.length === 0) return;

    this.#withWorldTransform((ctx) => {
      for (let i = 0; i < particles.length; i += 1) {
        if (this.lowPowerMode && i % 2 === 1) continue;
        const particle = particles[i];
        if (!particle.active) continue;
        const alpha = clamp(particle.alpha, 0, 1);
        const radius = Math.max(0.5, particle.size);
        const glow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0.5,
          particle.x,
          particle.y,
          radius
        );
        glow.addColorStop(0, particle.color);
        glow.addColorStop(0.55, `rgba(116, 246, 204, ${alpha * 0.85})`);
        glow.addColorStop(1, "rgba(27, 91, 70, 0)");

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = `rgba(114, 255, 224, ${alpha})`;
        ctx.shadowBlur = radius * 2.2 * this.performanceProfile.shadowScale;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  drawObstacles(obstacles) {
    if (!obstacles || obstacles.length === 0) return;

    this.#withWorldTransform((ctx) => {
      for (let i = 0; i < obstacles.length; i += 1) {
        const obstacle = obstacles[i];
        const warningAlpha = obstacle.warningTime > 0 ? Math.min(0.75, obstacle.warningTime) : 0;
        const gradient = ctx.createRadialGradient(
          obstacle.x - obstacle.radius * 0.25,
          obstacle.y - obstacle.radius * 0.25,
          1,
          obstacle.x,
          obstacle.y,
          obstacle.radius
        );
        gradient.addColorStop(0, "rgba(255, 207, 145, 0.95)");
        gradient.addColorStop(0.55, "rgba(255, 119, 130, 0.88)");
        gradient.addColorStop(1, "rgba(106, 36, 45, 0.92)");

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.shadowColor = "rgba(255, 92, 120, 0.55)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (warningAlpha > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 220, 170, ${warningAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, obstacle.radius + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    });
  }

  drawModeTheme(visualProfile) {
    const ctx = this.ctx;
    const w = this.viewportWidth;
    const h = this.viewportHeight;
    ctx.save();
    if (visualProfile === "speed") {
      ctx.fillStyle = "rgba(255, 125, 88, 0.06)";
      ctx.fillRect(0, 0, w, h);
    } else if (visualProfile === "survival") {
      ctx.fillStyle = "rgba(8, 15, 24, 0.24)";
      ctx.fillRect(0, 0, w, h);
    } else if (visualProfile === "duel") {
      const mid = w * 0.5;
      ctx.fillStyle = "rgba(72, 208, 255, 0.06)";
      ctx.fillRect(0, 0, mid, h);
      ctx.fillStyle = "rgba(255, 122, 184, 0.05)";
      ctx.fillRect(mid, 0, mid, h);
    }
    ctx.restore();
  }

  drawArenaPadding(padding) {
    if (!Number.isFinite(padding) || padding <= 0) return;
    this.#withWorldTransform((ctx) => {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.fillRect(0, 0, this.worldWidth, padding);
      ctx.fillRect(0, this.worldHeight - padding, this.worldWidth, padding);
      ctx.fillRect(0, padding, padding, this.worldHeight - padding * 2);
      ctx.fillRect(this.worldWidth - padding, padding, padding, this.worldHeight - padding * 2);
      ctx.strokeStyle = "rgba(255, 180, 140, 0.26)";
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, padding, this.worldWidth - padding * 2, this.worldHeight - padding * 2);
      ctx.restore();
    });
  }

  drawEventWarning(text, timer = 0) {
    if (!text || timer <= 0) return;
    const alpha = Math.min(1, timer);
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "700 18px 'Trebuchet MS', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(255, 233, 187, ${alpha})`;
    ctx.shadowColor = `rgba(255, 160, 115, ${alpha})`;
    ctx.shadowBlur = 8;
    ctx.fillText(text, this.viewportWidth * 0.5, this.fit.offsetY + 12);
    ctx.restore();
  }

  drawScore(score, modeName = "Classic", aiScore = null) {
    const ctx = this.ctx;
    const hudX = this.fit.offsetX + 14;
    const hudY = this.fit.offsetY + 12;

    ctx.save();
    ctx.font = "700 20px 'Trebuchet MS', 'Segoe UI', sans-serif";
    ctx.fillStyle = this.config.render.hudTextColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(58, 201, 255, 0.45)";
    ctx.shadowBlur = 8;
    ctx.fillText(`Score ${score}`, hudX, hudY);
    ctx.fillStyle = "rgba(168, 220, 255, 0.92)";
    ctx.font = "600 13px 'Trebuchet MS', 'Segoe UI', sans-serif";
    ctx.fillText(modeName.toUpperCase(), hudX, hudY + 22);
    if (Number.isFinite(aiScore)) {
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 177, 216, 0.94)";
      ctx.fillText(`AI ${aiScore}`, this.fit.offsetX + (this.cameraViewWidth * this.fit.scale) - 14, hudY);
    }
    ctx.restore();
  }

  drawEffects() {
    // Subtle world vignette to add depth without distracting gameplay.
    this.#withWorldTransform((ctx) => {
      const cx = this.camera.x;
      const cy = this.camera.y;
      const radius = Math.max(this.cameraViewWidth, this.cameraViewHeight) * 0.9;
      if (this.lowPowerMode) return;
      const vignette = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.22)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    });
  }
}
