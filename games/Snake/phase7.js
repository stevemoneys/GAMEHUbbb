"use strict";

(function (global) {
  const shared = global.SnakeShared;
  const SnakeEngine = global.SnakeEngine;
  const cosmetics = global.SnakeCosmetics;
  if (!shared || !SnakeEngine || !cosmetics) return;

  const {
    POWER_UPS,
    POWER_UP_POOL,
    DIRS,
    OPPOSITE,
    rand,
    randItem,
    clamp,
    deepClone,
    hexToRgba,
    drawRoundedRectPath
  } = shared;

  const { drawSkinSegment, getSkinById } = cosmetics;

  const WORLD_WIDTH = 2048;
  const WORLD_HEIGHT = 2048;
  const VIEWPORT_SHORT_UNITS = 120;
  const VIEWPORT_LONG_UNITS = 180;
  const WORLD_GRID_SPACING = 32;
  const PLAYER_BASE_SPEED = 62;
  const AI_BASE_SPEED = 50;
  const SEGMENT_SPACING = 12;
  const PLAYER_RADIUS = 7.2;
  const AI_RADIUS = 6.2;
  const FOOD_RADIUS = 4.4;
  const POWER_RADIUS = 7.2;
  const COLLISION_PADDING = 1.5;

  function wrapValue(value, size) {
    return ((value % size) + size) % size;
  }

  function wrapPoint(point) {
    return {
      x: wrapValue(point.x, WORLD_WIDTH),
      y: wrapValue(point.y, WORLD_HEIGHT)
    };
  }

  function shortestDelta(a, b, size) {
    let delta = b - a;
    if (delta > size / 2) delta -= size;
    if (delta < -size / 2) delta += size;
    return delta;
  }

  function toroidalDistance(ax, ay, bx, by) {
    const dx = shortestDelta(ax, bx, WORLD_WIDTH);
    const dy = shortestDelta(ay, by, WORLD_HEIGHT);
    return Math.hypot(dx, dy);
  }

  function circleRectDistance(cx, cy, rect) {
    const nearestX = clamp(cx, rect.x, rect.x + rect.w);
    const nearestY = clamp(cy, rect.y, rect.y + rect.h);
    return Math.hypot(cx - nearestX, cy - nearestY);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function getViewportForSize(width, height) {
    if (width >= height) {
      return { width: VIEWPORT_LONG_UNITS, height: VIEWPORT_SHORT_UNITS };
    }
    return { width: VIEWPORT_SHORT_UNITS, height: VIEWPORT_LONG_UNITS };
  }

  function buildMazeMetadata(mazeLayout) {
    if (!mazeLayout) return { walls: [], bounds: null };
    const cols = mazeLayout[0]?.length || 0;
    const rows = mazeLayout.length;
    const cellSize = Math.min(52, Math.floor(Math.min(WORLD_WIDTH / Math.max(1, cols + 8), WORLD_HEIGHT / Math.max(1, rows + 8))));
    const totalWidth = cols * cellSize;
    const totalHeight = rows * cellSize;
    const offsetX = (WORLD_WIDTH - totalWidth) / 2;
    const offsetY = (WORLD_HEIGHT - totalHeight) / 2;
    const walls = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (mazeLayout[y]?.[x] !== 1) continue;
        walls.push({
          x: offsetX + x * cellSize,
          y: offsetY + y * cellSize,
          w: cellSize,
          h: cellSize
        });
      }
    }
    return {
      walls,
      bounds: {
        x: offsetX,
        y: offsetY,
        w: totalWidth,
        h: totalHeight,
        cellSize
      }
    };
  }

  function normalizeDir(direction) {
    return DIRS[direction] ? direction : "right";
  }

  function getSnakeSpeed(engine, snake, isPlayer) {
    if (isPlayer) {
      const perks = engine.getSkinPerks();
      let speed = PLAYER_BASE_SPEED * (1 + (perks.speedBonus || 0));
      if (engine.state.activePower?.id === "speed") speed *= 1.65;
      if (engine.state.fever) speed *= 1.22;
      return speed;
    }
    const bonus = snake.speedBurstTicks > 0 ? 18 : 0;
    return AI_BASE_SPEED + ((engine.config.baseAISpeed || 1) - 1) * 24 + bonus;
  }

  Object.assign(SnakeEngine.prototype, {
    getWorldSettings() {
      return {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        viewportShort: VIEWPORT_SHORT_UNITS,
        viewportLong: VIEWPORT_LONG_UNITS
      };
    },

    setCanvasResolution() {
      const bounds = this.canvas.getBoundingClientRect();
      const logicalWidth = Math.max(360, Math.round(bounds.width || this.canvas.clientWidth || 800));
      const logicalHeight = Math.max(240, Math.round(bounds.height || this.canvas.clientHeight || 600));
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      if (this.canvas.width !== Math.round(logicalWidth * dpr) || this.canvas.height !== Math.round(logicalHeight * dpr)) {
        this.canvas.width = Math.round(logicalWidth * dpr);
        this.canvas.height = Math.round(logicalHeight * dpr);
      }
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.renderWidth = logicalWidth;
      this.renderHeight = logicalHeight;
      this.dpr = dpr;
      this.viewport = getViewportForSize(logicalWidth, logicalHeight);
      this.pixelsPerUnit = Math.min(logicalWidth / this.viewport.width, logicalHeight / this.viewport.height);
    },

    getCamera() {
      const head = this.state?.player?.segments?.[0] || { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
      return {
        x: head.x,
        y: head.y,
        viewportWidth: this.viewport?.width || VIEWPORT_LONG_UNITS,
        viewportHeight: this.viewport?.height || VIEWPORT_SHORT_UNITS
      };
    },

    worldToScreen(x, y) {
      const camera = this.getCamera();
      const dx = shortestDelta(camera.x, x, WORLD_WIDTH);
      const dy = shortestDelta(camera.y, y, WORLD_HEIGHT);
      return {
        x: this.renderWidth * 0.5 + dx * this.pixelsPerUnit,
        y: this.renderHeight * 0.5 + dy * this.pixelsPerUnit,
        visible: Math.abs(dx) <= camera.viewportWidth * 0.55 && Math.abs(dy) <= camera.viewportHeight * 0.55
      };
    },

    worldRadiusToPixels(radius) {
      return radius * this.pixelsPerUnit;
    },

    forEachWrappedRect(rect, callback) {
      const offsets = [
        { x: 0, y: 0 },
        { x: -WORLD_WIDTH, y: 0 },
        { x: WORLD_WIDTH, y: 0 },
        { x: 0, y: -WORLD_HEIGHT },
        { x: 0, y: WORLD_HEIGHT },
        { x: -WORLD_WIDTH, y: -WORLD_HEIGHT },
        { x: -WORLD_WIDTH, y: WORLD_HEIGHT },
        { x: WORLD_WIDTH, y: -WORLD_HEIGHT },
        { x: WORLD_WIDTH, y: WORLD_HEIGHT }
      ];
      const camera = this.getCamera();
      const left = camera.x - camera.viewportWidth * 0.6;
      const right = camera.x + camera.viewportWidth * 0.6;
      const top = camera.y - camera.viewportHeight * 0.6;
      const bottom = camera.y + camera.viewportHeight * 0.6;
      for (const offset of offsets) {
        const x = rect.x + offset.x;
        const y = rect.y + offset.y;
        if (x + rect.w < left || x > right || y + rect.h < top || y > bottom) continue;
        callback(x, y);
      }
    },

    createWalls(mazeLayout) {
      return buildMazeMetadata(mazeLayout);
    },

    buildSpawnBounds() {
      if (this.state?.maze?.bounds) {
        const b = this.state.maze.bounds;
        return {
          x: b.x + b.cellSize * 1.5,
          y: b.y + b.cellSize * 1.5,
          w: Math.max(b.cellSize * 2, b.w - b.cellSize * 3),
          h: Math.max(b.cellSize * 2, b.h - b.cellSize * 3)
        };
      }
      return { x: 0, y: 0, w: WORLD_WIDTH, h: WORLD_HEIGHT };
    },

    makeSnake(head, direction, length, color, outline, isPlayer = false) {
      const dir = normalizeDir(direction);
      const rev = OPPOSITE[dir];
      const rv = DIRS[rev];
      const trail = [];
      const neededTrail = Math.max(32, length * 6);
      for (let i = 0; i < neededTrail; i += 1) {
        trail.push({
          x: head.x + rv.x * SEGMENT_SPACING * i,
          y: head.y + rv.y * SEGMENT_SPACING * i
        });
      }
      const snake = {
        direction: dir,
        nextDirection: dir,
        targetLength: length,
        color,
        outline,
        speedBurstTicks: 0,
        crown: false,
        radius: isPlayer ? PLAYER_RADIUS : AI_RADIUS,
        trail,
        virtualHead: { x: head.x, y: head.y },
        segments: []
      };
      this.refreshSnakeSegments(snake);
      return snake;
    },

    trimTrail(snake) {
      const keep = Math.max(80, snake.targetLength * 16);
      if (snake.trail.length > keep) snake.trail.length = keep;
    },

    refreshSnakeSegments(snake) {
      const segments = [];
      const desired = Math.max(2, Math.round(snake.targetLength));
      let cursor = 0;
      for (let index = 0; index < desired; index += 1) {
        const wanted = index * SEGMENT_SPACING;
        let walked = 0;
        while (cursor < snake.trail.length - 1) {
          const a = snake.trail[cursor];
          const b = snake.trail[cursor + 1];
          const segmentLength = Math.hypot(a.x - b.x, a.y - b.y);
          if (walked + segmentLength >= wanted) {
            const local = segmentLength > 0.0001 ? (wanted - walked) / segmentLength : 0;
            segments.push(wrapPoint({
              x: lerp(a.x, b.x, local),
              y: lerp(a.y, b.y, local)
            }));
            break;
          }
          walked += segmentLength;
          cursor += 1;
        }
        if (segments.length <= index) {
          segments.push(wrapPoint(snake.trail[Math.min(cursor, snake.trail.length - 1)]));
        }
      }
      snake.segments = segments;
    },

    pointHitsWall(point, radius = 0) {
      const walls = this.state?.maze?.walls || [];
      for (const rect of walls) {
        if (circleRectDistance(point.x, point.y, rect) <= radius) return true;
      }
      return false;
    },

    isSpawnPointSafe(point, radius, excludeSnake = null) {
      if (this.pointHitsWall(point, radius + 2)) return false;
      const snakes = [];
      if (this.state?.player && this.state.player !== excludeSnake) snakes.push(this.state.player);
      for (const ai of this.state?.aiSnakes || []) if (ai !== excludeSnake) snakes.push(ai);
      for (const snake of snakes) {
        for (const seg of snake.segments) {
          if (toroidalDistance(point.x, point.y, seg.x, seg.y) <= radius + snake.radius + 8) return false;
        }
      }
      if (this.state?.food && toroidalDistance(point.x, point.y, this.state.food.x, this.state.food.y) <= radius + FOOD_RADIUS + 10) return false;
      if (this.state?.powerCube && toroidalDistance(point.x, point.y, this.state.powerCube.x, this.state.powerCube.y) <= radius + POWER_RADIUS + 10) return false;
      return true;
    },

    getRandomSpawnPoint(radius = 8, attempts = 160) {
      const bounds = this.buildSpawnBounds();
      for (let i = 0; i < attempts; i += 1) {
        const point = {
          x: bounds.x + Math.random() * bounds.w,
          y: bounds.y + Math.random() * bounds.h
        };
        if (this.isSpawnPointSafe(point, radius)) return point;
      }
      return {
        x: WORLD_WIDTH * 0.5 + rand(-80, 80),
        y: WORLD_HEIGHT * 0.5 + rand(-80, 80)
      };
    }
  });

  Object.assign(SnakeEngine.prototype, {
    start(config) {
      this.config = deepClone(config);
      this.resultSent = false;
      this.running = true;
      this.paused = false;
      this.lastTs = 0;
      this.acc = 0;
      this.setCanvasResolution();

      const now = performance.now();
      const equippedSkin = this.ui.getEquippedSkin ? this.ui.getEquippedSkin() : getSkinById("classic_green");
      const playerSpawn = { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.5 };

      this.state = {
        world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
        score: 0,
        highScore: this.ui.getHighScore(),
        player: this.makeSnake(playerSpawn, "right", 5, equippedSkin.baseColor, equippedSkin.patternColor || equippedSkin.accentColor || "#00bb66", true),
        playerSkin: equippedSkin,
        aiSnakes: [],
        food: null,
        powerCube: null,
        nextPowerSpawn: now + this.getPowerSpawnInterval(false),
        powerIncoming: false,
        activePower: null,
        powerEnd: 0,
        combo: 0,
        comboState: "none",
        lastEat: now,
        fever: false,
        feverEnd: 0,
        feverBanner: 0,
        particles: [],
        floating: [],
        flash: null,
        shakeMs: 0,
        shakeStrength: 0,
        hue: 0,
        playerFlashMs: 0,
        playerFlashColor: "#ffffff",
        pendingFoodRespawn: 0,
        over: false,
        won: false,
        maze: this.createWalls(config.mazeLayout),
        modeTimeLeft: config.targetTime || null,
        playStart: now,
        bossAlive: config.arcadeModeType === "BOSS_RUSH",
        aiSnakesEaten: 0,
        sessionStats: {
          foodEaten: 0,
          powerUpsCollected: 0,
          aiEaten: 0,
          feverActivations: 0,
          maxCombo: 0,
          uniquePowerUps: [],
          usedPowerUps: false
        }
      };

      this.state.player = this.makeSnake(this.getRandomSpawnPoint(PLAYER_RADIUS + 10, 220), "right", 5, equippedSkin.baseColor, equippedSkin.patternColor || equippedSkin.accentColor || "#00bb66", true);
      this.spawnAISnakes();
      this.spawnFood();
      this.stepMs = Math.round(1000 / Math.max(1, getSnakeSpeed(this, this.state.player, true) / SEGMENT_SPACING));

      this.ui.onGameStart(config, this.state);
      this.emitGameEvent("game_start", { startedAt: now });
      requestAnimationFrame((ts) => this.loop(ts));
    },

    spawnFood() {
      const point = this.getRandomSpawnPoint(FOOD_RADIUS + 12, 180);
      this.state.food = point ? { x: point.x, y: point.y, r: FOOD_RADIUS } : null;
    },

    spawnPowerCube(now) {
      if (this.state.powerCube) return;
      const point = this.getRandomSpawnPoint(POWER_RADIUS + 16, 200);
      if (!point) return;
      this.state.powerCube = {
        x: point.x,
        y: point.y,
        r: POWER_RADIUS,
        type: randItem(POWER_UP_POOL),
        spawnedAt: now,
        rotation: Math.random() * Math.PI * 2
      };
      this.state.powerIncoming = false;
    },

    spawnAISnakes() {
      this.state.aiSnakes = [];
      const count = this.config.aiCount || 0;
      for (let i = 0; i < count; i += 1) {
        const length = i === 0 && this.config.arcadeModeType === "BOSS_RUSH"
          ? Math.max(50, this.config.maxAILength || 50)
          : rand(this.config.minAILength || 5, this.config.maxAILength || 12);
        const ai = this.spawnAISnake(length);
        if (!ai) continue;
        if (i === 0 && this.config.arcadeModeType === "BOSS_RUSH") {
          ai.color = "#ffd700";
          ai.outline = "#8a6d00";
          ai.crown = true;
          ai.radius = 7.4;
        }
        this.state.aiSnakes.push(ai);
      }
    },

    spawnAISnake(length) {
      for (let tries = 0; tries < 180; tries += 1) {
        const point = this.getRandomSpawnPoint(AI_RADIUS + 18, 120);
        if (!point) continue;
        const snake = this.makeSnake(point, randItem(["up", "down", "left", "right"]), length, randItem(this.config.aiColors || ["#ff6600", "#aa66ff", "#ff3333"]), "#191919", false);
        if (this.isSpawnPointSafe(snake.segments[0], snake.radius + 8, snake)) return snake;
      }
      return null;
    },

    updateSnakeMovement(snake, dtSec, isPlayer) {
      const desired = normalizeDir(snake.nextDirection);
      if (!this.isReverse(snake.direction, desired)) snake.direction = desired;
      const velocity = DIRS[snake.direction];
      const speed = getSnakeSpeed(this, snake, isPlayer);
      snake.virtualHead = {
        x: snake.virtualHead.x + velocity.x * speed * dtSec,
        y: snake.virtualHead.y + velocity.y * speed * dtSec
      };
      snake.trail.unshift({ x: snake.virtualHead.x, y: snake.virtualHead.y });
      this.trimTrail(snake);
      this.refreshSnakeSegments(snake);
    },

    chooseAIDirection(ai, index) {
      const tier = this.config.aiTier || 1;
      const head = ai.segments[0];
      const playerHead = this.state.player.segments[0];
      const target = this.state.food || playerHead;
      const dx = shortestDelta(head.x, target.x, WORLD_WIDTH);
      const dy = shortestDelta(head.y, target.y, WORLD_HEIGHT);
      const options = ["up", "down", "left", "right"].filter((dir) => !this.isReverse(ai.direction, dir));
      const primary = Math.abs(dx) > Math.abs(dy)
        ? (dx >= 0 ? "right" : "left")
        : (dy >= 0 ? "down" : "up");
      const secondary = primary === "right" || primary === "left"
        ? (dy >= 0 ? "down" : "up")
        : (dx >= 0 ? "right" : "left");

      let best = ai.direction;
      let bestScore = -Infinity;
      const playerThreat = ai.targetLength < this.state.player.targetLength;

      for (const dir of [primary, secondary, ai.direction, ...options]) {
        if (!options.includes(dir)) continue;
        const velocity = DIRS[dir];
        const look = {
          x: wrapValue(head.x + velocity.x * (ai.radius * 2 + 10), WORLD_WIDTH),
          y: wrapValue(head.y + velocity.y * (ai.radius * 2 + 10), WORLD_HEIGHT)
        };
        let score = dir === primary ? 8 : dir === secondary ? 4 : 0;
        if (this.pointHitsWall(look, ai.radius + 2)) score -= 20;
        for (const seg of this.state.player.segments) {
          const d = toroidalDistance(look.x, look.y, seg.x, seg.y);
          if (d < ai.radius + PLAYER_RADIUS + 3) score -= 40;
          if (playerThreat) score += d * 0.04;
        }
        for (const other of this.state.aiSnakes) {
          if (other === ai) continue;
          for (const seg of other.segments) {
            if (toroidalDistance(look.x, look.y, seg.x, seg.y) < ai.radius + other.radius + 3) score -= 30;
          }
        }
        if (!playerThreat || tier >= 3) {
          score -= Math.abs(shortestDelta(look.x, target.x, WORLD_WIDTH)) * 0.03;
          score -= Math.abs(shortestDelta(look.y, target.y, WORLD_HEIGHT)) * 0.03;
        }
        score += Math.random() * 2 + tier * 0.6;
        if (score > bestScore) {
          bestScore = score;
          best = dir;
        }
      }

      ai.nextDirection = best;
      if (tier >= 4 && Math.random() < 0.025) ai.speedBurstTicks = 18;
      if (tier >= 2 && index % 2 === 0 && Math.random() < 0.012) ai.nextDirection = primary;
    },

    moveAIs(dtSec) {
      for (let i = 0; i < this.state.aiSnakes.length; i += 1) {
        const ai = this.state.aiSnakes[i];
        this.chooseAIDirection(ai, i);
        this.updateSnakeMovement(ai, dtSec, false);
        if (ai.speedBurstTicks > 0) ai.speedBurstTicks = Math.max(0, ai.speedBurstTicks - 1);
      }
    },

    updateCombo(now) {
      if (this.state.combo <= 0) {
        this.state.comboState = "none";
        return;
      }
      const elapsed = now - this.state.lastEat;
      if (elapsed >= this.getComboWindowMs()) {
        this.state.combo = 0;
        this.state.comboState = "none";
        this.addFloat(this.state.player.segments[0].x, this.state.player.segments[0].y - 22, "Combo reset", "#ff9fa7", 0.7, -18, "world");
        this.sfxComboBreak();
        return;
      }
      if (elapsed >= this.getComboDangerMs()) this.state.comboState = "danger";
      else if (elapsed >= this.getComboWarningMs()) this.state.comboState = "warning";
      else this.state.comboState = "none";
    }
  });

  Object.assign(SnakeEngine.prototype, {
    activateOrRefreshFever(now) {
      if (!this.state.fever) {
        this.state.fever = true;
        this.state.feverBanner = 1000;
        this.state.sessionStats.feverActivations += 1;
        this.sfxFever();
        this.setFlash("#ff66ff", 0.23, 0.22);
        this.addFloat(this.renderWidth * 0.5, this.renderHeight * 0.5, "FEVER!", "#ffffff", 1, -28, "screen");
        this.emitGameEvent("fever_activated", { total: this.state.sessionStats.feverActivations });
      }
      this.state.feverEnd = now + 8000;
      if (!this.state.powerCube) this.state.nextPowerSpawn = Math.min(this.state.nextPowerSpawn, now + rand(8000, 12000));
    },

    registerEat(basePoints, isFood, x, y) {
      const now = performance.now();
      this.state.combo = Math.min(99, this.state.combo + 1);
      this.state.sessionStats.maxCombo = Math.max(this.state.sessionStats.maxCombo, this.state.combo);
      this.state.lastEat = now;
      this.state.comboState = "none";

      let points = basePoints;
      if (isFood && this.state.activePower?.id === "doublePoints") points *= 2;
      points *= 1 + this.state.combo / 10;
      if (this.state.fever) points *= 2;
      points = Math.round(points);

      this.state.score += points;
      this.addFloat(x, y - 8, `+${points}`, "#ffe66e", 0.7, -26, "world");
      this.addFloat(x + 14, y + 6, "+1 COMBO", "#ff9f5a", 0.55, -20, "world");
      if (isFood && this.state.activePower?.id === "doublePoints") {
        this.addFloat(x - 12, y + 4, "x2", "#ffb74d", 0.45, -18, "world");
      }
      if (this.state.combo >= 10) this.activateOrRefreshFever(now);
      if (this.state.fever) {
        this.state.shakeMs = 100;
        this.state.shakeStrength = 1.8;
      }

      this.emitGameEvent("combo_changed", {
        combo: this.state.combo,
        maxCombo: this.state.sessionStats.maxCombo,
        score: this.state.score
      });
    },

    spawnBurst(x, y, color, count = 10, speedMin = 40, speedMax = 120, hueMode = false) {
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        this.state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          size: 1.5 + Math.random() * 2.2,
          color,
          hueMode,
          hue: this.state.hue
        });
      }
    },

    addFloat(x, y, text, color, life = 0.55, vy = -24, space = "world") {
      this.state.floating.push({ x, y, text, color, life, maxLife: life, vy, space });
    },

    applyPowerUp(typeId, now) {
      const raw = POWER_UPS[typeId];
      if (!raw || this.state.activePower) return false;
      const def = { ...raw };
      const perks = this.getSkinPerks();
      const bonus = perks.powerDurationBonus + this.getBoosterDurationBonus(def.id) + (def.id === "shield" ? perks.invincibilityDurationBonus : 0);
      def.durationMs = Math.round(def.durationMs * (1 + bonus));
      if (def.id === "speed") def.durationMs += this.getUpgradeSeconds("speedDuration") * 1000;
      if (def.id === "shield") def.durationMs += this.getUpgradeSeconds("invincibleDuration") * 1000;

      this.state.activePower = def;
      this.state.powerEnd = now + def.durationMs;
      this.state.sessionStats.powerUpsCollected += 1;
      this.state.sessionStats.usedPowerUps = true;
      if (!this.state.sessionStats.uniquePowerUps.includes(def.id)) {
        this.state.sessionStats.uniquePowerUps.push(def.id);
      }

      const head = this.state.player.segments[0];
      this.state.playerFlashMs = 180;
      this.state.playerFlashColor = def.color;
      this.spawnBurst(head.x, head.y, def.color, 18, 32, 96);
      this.addFloat(head.x, head.y - 12, def.name, def.color, 0.8, -18, "world");
      this.setFlash(def.color, 0.26, 0.23);
      this.sfxPower();

      if (this.config.arcadeModeType === "TIME_ATTACK" && this.state.modeTimeLeft !== null) {
        this.state.modeTimeLeft = Math.min(180000, this.state.modeTimeLeft + 2000);
        this.addFloat(this.renderWidth - 120, 90, "+2s", "#6ef7ff", 0.6, -18, "screen");
      }

      this.emitGameEvent("power_up_collected", {
        powerId: def.id,
        count: this.state.sessionStats.powerUpsCollected,
        uniqueCount: this.state.sessionStats.uniquePowerUps.length
      });
      return true;
    },

    expirePower() {
      if (!this.state.activePower) return;
      this.state.activePower = null;
      this.state.powerEnd = 0;
      this.addFloat(this.renderWidth * 0.5, 120, "Power-up expired", "#d8e2ff", 0.7, -16, "screen");
    },

    updatePowerCycle(now, dtSec) {
      if (this.state.powerCube && now - this.state.powerCube.spawnedAt > 12000) {
        this.state.powerCube = null;
        this.state.nextPowerSpawn = now + this.getPowerSpawnInterval(this.state.fever);
      }

      if (!this.state.powerCube && now >= this.state.nextPowerSpawn - 2000 && now < this.state.nextPowerSpawn) {
        this.state.powerIncoming = true;
      } else if (now < this.state.nextPowerSpawn - 2000) {
        this.state.powerIncoming = false;
      }

      if (!this.state.powerCube && now >= this.state.nextPowerSpawn) {
        this.spawnPowerCube(now);
        this.state.nextPowerSpawn = now + this.getPowerSpawnInterval(this.state.fever);
      }

      if (this.state.activePower && now >= this.state.powerEnd) this.expirePower();

      if (this.state.activePower?.id === "magnet" && this.state.food) {
        const head = this.state.player.segments[0];
        const dx = shortestDelta(this.state.food.x, head.x, WORLD_WIDTH);
        const dy = shortestDelta(this.state.food.y, head.y, WORLD_HEIGHT);
        const d = Math.hypot(dx, dy);
        if (d > 0.001 && d <= this.getMagnetRadius()) {
          const step = Math.min(d, 180 * dtSec);
          this.state.food.x = wrapValue(this.state.food.x + (dx / d) * step, WORLD_WIDTH);
          this.state.food.y = wrapValue(this.state.food.y + (dy / d) * step, WORLD_HEIGHT);
        }
      }
    },

    updateFever(now) {
      if (this.state.fever && now >= this.state.feverEnd) {
        this.state.fever = false;
        this.state.feverEnd = 0;
        this.addFloat(this.renderWidth * 0.5, 100, "Fever ended", "#9fc7ff", 0.8, -16, "screen");
        this.emitGameEvent("fever_ended");
      }
    },

    checkPlayerFood() {
      if (!this.state.food) return;
      const head = this.state.player.segments[0];
      if (toroidalDistance(head.x, head.y, this.state.food.x, this.state.food.y) > this.state.player.radius + FOOD_RADIUS + COLLISION_PADDING) return;
      this.state.player.targetLength += 1;
      this.state.sessionStats.foodEaten += 1;
      this.state.playerFlashMs = 120;
      this.state.playerFlashColor = "#ffffff";
      this.sfxFood();
      this.registerEat(10, true, this.state.food.x, this.state.food.y);
      this.spawnBurst(this.state.food.x, this.state.food.y, "#ffe66e", 8, 18, 54);
      this.emitGameEvent("food_eaten", {
        count: this.state.sessionStats.foodEaten,
        length: this.state.player.targetLength,
        score: this.state.score
      });
      this.state.food = null;
      this.spawnFood();
    },

    checkAIFood() {
      if (!this.state.food) return;
      for (const ai of this.state.aiSnakes) {
        const head = ai.segments[0];
        if (toroidalDistance(head.x, head.y, this.state.food.x, this.state.food.y) <= ai.radius + FOOD_RADIUS) {
          ai.targetLength += 1;
          this.state.food = null;
          this.spawnFood();
          return;
        }
      }
    },

    checkPowerPickup(now) {
      if (!this.state.powerCube) return;
      const head = this.state.player.segments[0];
      if (toroidalDistance(head.x, head.y, this.state.powerCube.x, this.state.powerCube.y) > this.state.player.radius + POWER_RADIUS + 2) return;
      if (this.state.activePower) return;
      if (this.applyPowerUp(this.state.powerCube.type, now)) {
        this.state.powerCube = null;
        this.state.nextPowerSpawn = now + this.getPowerSpawnInterval(this.state.fever);
      }
    },

    playerSelfHit() {
      const head = this.state.player.segments[0];
      for (let i = 7; i < this.state.player.segments.length; i += 1) {
        if (toroidalDistance(head.x, head.y, this.state.player.segments[i].x, this.state.player.segments[i].y) <= this.state.player.radius * 1.18) return true;
      }
      return false;
    }
  });

  Object.assign(SnakeEngine.prototype, {
    removeAndRespawnAI(aiToReplace) {
      const idx = this.state.aiSnakes.indexOf(aiToReplace);
      if (idx >= 0) this.state.aiSnakes.splice(idx, 1);
      if (this.config.arcadeModeType === "BOSS_RUSH") {
        this.state.bossAlive = false;
        return;
      }
      const len = rand(this.config.minAILength || 5, this.config.maxAILength || 12);
      const ai = this.spawnAISnake(len);
      if (ai) this.state.aiSnakes.push(ai);
    },

    checkPlayerVsAI() {
      const head = this.state.player.segments[0];
      for (const ai of [...this.state.aiSnakes]) {
        for (const seg of ai.segments) {
          if (toroidalDistance(head.x, head.y, seg.x, seg.y) > this.state.player.radius + ai.radius - 1) continue;
          const playerLength = this.state.player.targetLength;
          const aiLength = ai.targetLength;
          if (playerLength > aiLength) {
            this.state.player.targetLength += aiLength;
            this.state.aiSnakesEaten += 1;
            this.state.sessionStats.aiEaten += 1;
            this.state.playerFlashMs = 180;
            this.state.playerFlashColor = "#ffffff";
            this.registerEat(aiLength * 10, false, head.x, head.y);
            this.addFloat(head.x + 18, head.y + 8, `+${aiLength} GROWTH`, "#9bffda", 0.75, -22, "world");
            this.spawnBurst(head.x, head.y, ai.color, 14, 22, 82);
            this.sfxBigEat();
            this.emitGameEvent("ai_eaten", {
              count: this.state.sessionStats.aiEaten,
              totalAiEaten: this.state.aiSnakesEaten,
              growth: aiLength
            });
            this.removeAndRespawnAI(ai);
            return;
          }
          if (this.state.activePower?.id === "shield") {
            this.spawnBurst(head.x, head.y, "#ffd54f", 4, 18, 42);
            return;
          }
          this.endGame(false, "You hit a stronger snake.");
          return;
        }
      }
    },

    cleanAICollisions() {
      for (const ai of [...this.state.aiSnakes]) {
        const head = ai.segments[0];
        let dead = this.pointHitsWall(head, ai.radius + 1);
        if (!dead) {
          for (let i = 6; i < ai.segments.length; i += 1) {
            if (toroidalDistance(head.x, head.y, ai.segments[i].x, ai.segments[i].y) <= ai.radius * 1.05) {
              dead = true;
              break;
            }
          }
        }
        if (!dead) {
          for (const other of this.state.aiSnakes) {
            for (let i = other === ai ? 6 : 0; i < other.segments.length; i += 1) {
              if (other === ai && i < 6) continue;
              if (toroidalDistance(head.x, head.y, other.segments[i].x, other.segments[i].y) <= ai.radius + other.radius - 1) {
                dead = true;
                break;
              }
            }
            if (dead) break;
          }
        }
        if (!dead) {
          for (const seg of this.state.player.segments) {
            if (toroidalDistance(head.x, head.y, seg.x, seg.y) <= ai.radius + this.state.player.radius - 1) {
              dead = true;
              break;
            }
          }
        }
        if (dead) this.removeAndRespawnAI(ai);
      }
    },

    checkObjectives(dtSec) {
      if (this.state.modeTimeLeft !== null) {
        this.state.modeTimeLeft -= dtSec * 1000;
        if (this.state.modeTimeLeft <= 0) {
          this.state.modeTimeLeft = 0;
          if (this.config.arcadeModeType === "TIME_ATTACK") {
            this.endGame(true, "Time Attack complete!");
            return;
          }
        }
      }

      if (this.config.mode === "campaign") {
        if (this.config.targetLength && this.state.player.targetLength >= this.config.targetLength) {
          this.endGame(true, `Objective complete: reached length ${this.config.targetLength}!`);
          return;
        }
        if (this.config.targetTime && this.state.modeTimeLeft !== null && this.state.modeTimeLeft <= 0) {
          this.endGame(true, "Objective complete: survived the timer.");
          return;
        }
      }

      if (this.config.arcadeModeType === "BOSS_RUSH" && !this.state.bossAlive) {
        this.endGame(true, "Boss defeated!");
      }
    },

    step(now, dtSec) {
      if (this.state.over) return;
      if (this.state.pendingFoodRespawn > 0) {
        this.state.pendingFoodRespawn -= dtSec * 1000;
        if (this.state.pendingFoodRespawn <= 0 && !this.state.food) this.spawnFood();
      }

      this.updateSnakeMovement(this.state.player, dtSec, true);
      this.moveAIs(dtSec);

      const head = this.state.player.segments[0];
      if (this.pointHitsWall(head, this.state.player.radius)) {
        this.endGame(false, "You crashed into the maze wall.");
        return;
      }
      if (this.playerSelfHit()) {
        this.endGame(false, "You hit your own tail.");
        return;
      }

      this.checkPowerPickup(now);
      this.checkPlayerFood();
      this.checkPlayerVsAI();
      if (this.state.over) return;
      this.checkAIFood();
      this.cleanAICollisions();
      this.checkObjectives(dtSec);
    },

    calculateCoins(win) {
      let coins = 0;
      if (this.config.mode === "campaign") coins = win ? (this.config.rewardCoins || 0) : 0;
      else if (this.config.arcadeModeType === "BOSS_RUSH") coins = win ? 1200 : Math.floor(this.state.score / 12);
      else {
        const base = Math.floor(this.state.score / 10);
        coins = this.config.arcadeModeType === "TIME_ATTACK" ? base + (win ? 120 : 0) : base;
      }
      return Math.round(coins * (1 + (this.getSkinPerks().coinBonus || 0) + this.getPermanentCoinBonus()));
    },

    endGame(win, reason) {
      if (this.state.over) return;
      this.state.over = true;
      this.state.won = win;
      this.running = false;
      if (!win) this.sfxGameOver();

      const result = {
        win,
        reason,
        score: this.state.score,
        length: this.state.player.targetLength,
        coinsEarned: this.calculateCoins(win),
        playMs: performance.now() - this.state.playStart,
        aiSnakesEaten: this.state.aiSnakesEaten,
        powerUpsUsed: this.state.sessionStats.usedPowerUps,
        powerUpsCollected: this.state.sessionStats.powerUpsCollected,
        feverActivations: this.state.sessionStats.feverActivations,
        maxCombo: this.state.sessionStats.maxCombo,
        foodEaten: this.state.sessionStats.foodEaten,
        uniquePowerUps: this.state.sessionStats.uniquePowerUps.length,
        bossDefeated: this.config.arcadeModeType === "BOSS_RUSH" && !this.state.bossAlive,
        config: this.config
      };

      this.ui.showEndOverlay(result, () => {
        if (!this.resultSent) {
          this.resultSent = true;
          this.onEnd(result);
        }
      });
    },

    updateEffects(dtSec, ts) {
      this.state.hue += dtSec * 45;
      this.state.playerFlashMs = Math.max(0, this.state.playerFlashMs - dtSec * 1000);
      this.state.feverBanner = Math.max(0, this.state.feverBanner - dtSec * 1000);

      if (this.state.shakeMs > 0) {
        this.state.shakeMs = Math.max(0, this.state.shakeMs - dtSec * 1000);
        const strength = this.state.shakeStrength || 1.5;
        const tx = (Math.random() - 0.5) * strength;
        const ty = (Math.random() - 0.5) * strength;
        this.canvas.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      } else {
        this.canvas.style.transform = "";
      }

      if (this.state.fever || this.state.activePower?.id === "speed") {
        const head = this.state.player.segments[0];
        this.state.particles.push({
          x: wrapValue(head.x + rand(-4, 4), WORLD_WIDTH),
          y: wrapValue(head.y + rand(-4, 4), WORLD_HEIGHT),
          vx: rand(-26, 26),
          vy: rand(-26, 26),
          life: this.state.fever ? 0.4 : 0.26,
          maxLife: this.state.fever ? 0.4 : 0.26,
          size: this.state.fever ? 2 + Math.random() * 2 : 2,
          color: this.state.fever ? "#fff" : "#4de7ff",
          hueMode: this.state.fever,
          hue: this.state.hue
        });
      }

      if (this.state.activePower?.id === "shield") {
        const head = this.state.player.segments[0];
        const angle = Math.random() * Math.PI * 2;
        this.state.particles.push({
          x: wrapValue(head.x + Math.cos(angle) * 14, WORLD_WIDTH),
          y: wrapValue(head.y + Math.sin(angle) * 14, WORLD_HEIGHT),
          vx: Math.cos(angle) * 22,
          vy: Math.sin(angle) * 22,
          life: 0.3,
          maxLife: 0.3,
          size: 1.8,
          color: "#ffd54f",
          hueMode: false,
          hue: 0
        });
      }

      if (this.state.flash) {
        this.state.flash.life -= dtSec;
        if (this.state.flash.life <= 0) this.state.flash = null;
      }

      for (let i = this.state.floating.length - 1; i >= 0; i -= 1) {
        const f = this.state.floating[i];
        f.life -= dtSec;
        f.y += f.vy * dtSec;
        if (f.life <= 0) this.state.floating.splice(i, 1);
      }

      for (let i = this.state.particles.length - 1; i >= 0; i -= 1) {
        const p = this.state.particles[i];
        p.life -= dtSec;
        p.x = wrapValue(p.x + p.vx * dtSec, WORLD_WIDTH);
        p.y = wrapValue(p.y + p.vy * dtSec, WORLD_HEIGHT);
        p.vx *= 0.975;
        p.vy = p.vy * 0.975 + 18 * dtSec;
        if (p.life <= 0) this.state.particles.splice(i, 1);
      }

      this.stepMs = Math.round(1000 / Math.max(1, getSnakeSpeed(this, this.state.player, true) / SEGMENT_SPACING));
      this.ui.updateHUD(this.state, this.config);
    }
  });

  Object.assign(SnakeEngine.prototype, {
    drawBackground(ts) {
      const theme = this.ui.getArenaTheme ? this.ui.getArenaTheme() : null;
      const themeStyles = theme ? theme.styles : null;
      if (this.state.fever) {
        const hue = (ts * 0.03 + this.state.hue) % 360;
        const gradient = this.ctx.createLinearGradient(0, 0, this.renderWidth, this.renderHeight);
        gradient.addColorStop(0, `hsla(${hue},72%,18%,1)`);
        gradient.addColorStop(0.5, `hsla(${(hue + 90) % 360},78%,15%,1)`);
        gradient.addColorStop(1, `hsla(${(hue + 180) % 360},72%,18%,1)`);
        this.ctx.fillStyle = gradient;
      } else {
        this.ctx.fillStyle = themeStyles?.background || this.ui.getArenaColor();
      }
      this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);

      const camera = this.getCamera();
      const left = camera.x - camera.viewportWidth * 0.5;
      const right = camera.x + camera.viewportWidth * 0.5;
      const top = camera.y - camera.viewportHeight * 0.5;
      const bottom = camera.y + camera.viewportHeight * 0.5;

      this.ctx.save();
      const orbSpacing = 30;
      const startY = Math.floor(top / orbSpacing) * orbSpacing - orbSpacing;
      const endY = Math.ceil(bottom / orbSpacing) * orbSpacing + orbSpacing;
      const startX = Math.floor(left / orbSpacing) * orbSpacing - orbSpacing;
      const endX = Math.ceil(right / orbSpacing) * orbSpacing + orbSpacing;
      const orbRadius = Math.max(2.5, this.pixelsPerUnit * 2.2);

      for (let y = startY; y <= endY; y += orbSpacing) {
        const rowShift = Math.floor(y / orbSpacing) % 2 === 0 ? 0 : orbSpacing * 0.5;
        for (let x = startX; x <= endX; x += orbSpacing) {
          const point = this.worldToScreen(wrapValue(x + rowShift, WORLD_WIDTH), wrapValue(y, WORLD_HEIGHT));
          const orb = this.ctx.createRadialGradient(point.x, point.y, orbRadius * 0.15, point.x, point.y, orbRadius * 1.8);
          orb.addColorStop(0, this.state.fever ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.085)");
          orb.addColorStop(0.55, this.state.fever ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)");
          orb.addColorStop(1, "rgba(255,255,255,0)");
          this.ctx.fillStyle = orb;
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, orbRadius * 1.8, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      const streaks = 8;
      this.ctx.strokeStyle = this.state.fever ? "rgba(255,255,255,0.055)" : "rgba(120, 180, 255, 0.035)";
      this.ctx.lineWidth = 1;
      for (let i = 0; i < streaks; i += 1) {
        const sx = ((i * 173) + (ts * 0.018)) % (this.renderWidth + 220) - 110;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, -40);
        this.ctx.quadraticCurveTo(sx + 90, this.renderHeight * 0.32, sx - 40, this.renderHeight + 40);
        this.ctx.stroke();
      }

      const vignette = this.ctx.createRadialGradient(
        this.renderWidth * 0.5,
        this.renderHeight * 0.48,
        this.renderWidth * 0.12,
        this.renderWidth * 0.5,
        this.renderHeight * 0.48,
        this.renderWidth * 0.72
      );
      vignette.addColorStop(0, "rgba(255,255,255,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.34)");
      this.ctx.fillStyle = vignette;
      this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);
      this.ctx.restore();
    },

    drawWalls() {
      const walls = this.state.maze?.walls || [];
      if (!walls.length) return;
      this.ctx.save();
      this.ctx.fillStyle = "rgba(46, 65, 116, 0.85)";
      this.ctx.strokeStyle = "rgba(160, 220, 255, 0.18)";
      for (const rect of walls) {
        this.forEachWrappedRect(rect, (x, y) => {
          const topLeft = this.worldToScreen(x, y);
          const w = rect.w * this.pixelsPerUnit;
          const h = rect.h * this.pixelsPerUnit;
          drawRoundedRectPath(this.ctx, topLeft.x, topLeft.y, w, h, Math.max(6, 0.14 * Math.min(w, h)));
          this.ctx.fill();
          this.ctx.stroke();
        });
      }
      this.ctx.restore();
    },

    drawFood(ts) {
      if (!this.state.food) return;
      const screen = this.worldToScreen(this.state.food.x, this.state.food.y);
      const radius = this.worldRadiusToPixels(FOOD_RADIUS) * (1 + Math.sin(ts * 0.01) * 0.08);
      if (screen.x < -radius || screen.x > this.renderWidth + radius || screen.y < -radius || screen.y > this.renderHeight + radius) return;
      this.ctx.save();
      const glow = this.ctx.createRadialGradient(screen.x, screen.y, radius * 0.2, screen.x, screen.y, radius * 2.2);
      glow.addColorStop(0, "rgba(255,255,255,0.95)");
      glow.addColorStop(0.32, "rgba(255,226,110,0.95)");
      glow.addColorStop(1, "rgba(255,226,110,0)");
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#ffe66e";
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    },

    drawPowerCube(ts) {
      const cube = this.state.powerCube;
      if (!cube) return;
      const def = POWER_UPS[cube.type];
      const screen = this.worldToScreen(cube.x, cube.y);
      const size = this.worldRadiusToPixels(POWER_RADIUS) * 2.1;
      if (screen.x < -size || screen.x > this.renderWidth + size || screen.y < -size || screen.y > this.renderHeight + size) return;
      this.ctx.save();
      this.ctx.translate(screen.x, screen.y);
      this.ctx.rotate((cube.rotation || 0) + ts * 0.0013);
      drawRoundedRectPath(this.ctx, -size / 2, -size / 2, size, size, Math.max(5, size * 0.2));
      this.ctx.fillStyle = hexToRgba(def.color, 0.88);
      this.ctx.shadowBlur = 18;
      this.ctx.shadowColor = def.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "rgba(255,255,255,0.6)";
      this.ctx.stroke();
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = `${Math.max(9, size * 0.28)}px Orbitron, sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(def.icon, 0, 1);
      this.ctx.restore();
    },

    drawSnake(snake, isPlayer, ts) {
      if (!snake?.segments?.length) return;
      const head = snake.segments[0];
      const sizePx = this.worldRadiusToPixels(snake.radius) * 2;
      const skin = isPlayer ? this.state.playerSkin : null;

      this.ctx.save();
      for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
        const seg = snake.segments[i];
        const point = this.worldToScreen(seg.x, seg.y);
        const visiblePad = sizePx * 1.8;
        if (point.x < -visiblePad || point.x > this.renderWidth + visiblePad || point.y < -visiblePad || point.y > this.renderHeight + visiblePad) continue;
        const alpha = Math.max(0.1, 0.46 - i * 0.012);
        this.ctx.fillStyle = isPlayer ? `rgba(0,255,136,${alpha})` : hexToRgba(snake.color, alpha * 0.9);
        if (isPlayer && this.state.fever) {
          const hue = (this.state.hue + i * 9 + ts * 0.04) % 360;
          this.ctx.fillStyle = `hsla(${hue},95%,62%,${Math.max(0.08, alpha + 0.05)})`;
        }
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, Math.max(2, sizePx * 0.44), 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();

      for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
        const seg = snake.segments[i];
        const point = this.worldToScreen(seg.x, seg.y);
        if (point.x < -sizePx || point.x > this.renderWidth + sizePx || point.y < -sizePx || point.y > this.renderHeight + sizePx) continue;
        const left = point.x - sizePx * 0.5;
        const top = point.y - sizePx * 0.5;
        if (isPlayer && skin) {
          drawSkinSegment(this.ctx, left, top, sizePx, skin, i === 0, i, { direction: snake.direction, ts });
        } else {
          const gradient = this.ctx.createLinearGradient(left, top, left + sizePx, top + sizePx);
          gradient.addColorStop(0, hexToRgba(snake.color, 0.95));
          gradient.addColorStop(1, hexToRgba(snake.outline || "#111111", 0.9));
          drawRoundedRectPath(this.ctx, left, top, sizePx, sizePx, Math.max(4, sizePx * 0.26));
          this.ctx.fillStyle = gradient;
          this.ctx.fill();
          this.ctx.lineWidth = Math.max(1, sizePx * 0.06);
          this.ctx.strokeStyle = "rgba(0,0,0,0.45)";
          this.ctx.stroke();
        }
      }

      const headPoint = this.worldToScreen(head.x, head.y);
      const eyeOffset = sizePx * 0.18;
      const eyeRadius = Math.max(1.8, sizePx * 0.1);
      const dx = snake.direction === "left" ? -eyeOffset : snake.direction === "right" ? eyeOffset : 0;
      const dy = snake.direction === "up" ? -eyeOffset : snake.direction === "down" ? eyeOffset : 0;
      this.ctx.save();
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(headPoint.x - eyeOffset * 0.6 + dx * 0.3, headPoint.y - eyeOffset * 0.6 + dy * 0.3, eyeRadius, 0, Math.PI * 2);
      this.ctx.arc(headPoint.x + eyeOffset * 0.6 + dx * 0.3, headPoint.y - eyeOffset * 0.6 + dy * 0.3, eyeRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#111111";
      this.ctx.beginPath();
      this.ctx.arc(headPoint.x - eyeOffset * 0.55 + dx * 0.45, headPoint.y - eyeOffset * 0.55 + dy * 0.45, eyeRadius * 0.46, 0, Math.PI * 2);
      this.ctx.arc(headPoint.x + eyeOffset * 0.65 + dx * 0.45, headPoint.y - eyeOffset * 0.55 + dy * 0.45, eyeRadius * 0.46, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (!isPlayer) {
        this.ctx.save();
        this.ctx.fillStyle = "rgba(255,255,255,0.72)";
        this.ctx.font = "11px Orbitron, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(snake.crown ? "BOSS" : "AI", headPoint.x, headPoint.y - sizePx * 0.9);
        this.ctx.restore();
      }
    }
  });

  Object.assign(SnakeEngine.prototype, {
    drawParticles() {
      for (const particle of this.state.particles) {
        const point = this.worldToScreen(particle.x, particle.y);
        const alpha = Math.max(0, particle.life / particle.maxLife);
        this.ctx.fillStyle = particle.hueMode
          ? `hsla(${(particle.hue + alpha * 120) % 360},95%,62%,${alpha})`
          : hexToRgba(particle.color, alpha);
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, Math.max(1, particle.size * this.pixelsPerUnit * 0.18), 0, Math.PI * 2);
        this.ctx.fill();
      }
    },

    drawFloating() {
      this.ctx.save();
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      for (const f of this.state.floating) {
        const alpha = Math.max(0, f.life / f.maxLife);
        const pos = f.space === "screen" ? { x: f.x, y: f.y } : this.worldToScreen(f.x, f.y);
        this.ctx.fillStyle = hexToRgba(f.color, alpha);
        this.ctx.font = `${Math.max(12, f.space === "screen" ? 22 : 14)}px Orbitron, sans-serif`;
        this.ctx.fillText(f.text, pos.x, pos.y);
      }
      this.ctx.restore();
    },

    drawOverlays() {
      if (this.state.flash) {
        const alpha = this.state.flash.alpha * (this.state.flash.life / this.state.flash.maxLife);
        this.ctx.fillStyle = hexToRgba(this.state.flash.color, alpha);
        this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);
      }

      if (this.state.feverBanner > 0) {
        const alpha = Math.min(1, this.state.feverBanner / 1000);
        this.ctx.save();
        this.ctx.fillStyle = `rgba(255,255,255,${alpha * 0.12})`;
        this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);
        this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        this.ctx.font = "700 42px Orbitron, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("FEVER!", this.renderWidth * 0.5, this.renderHeight * 0.5);
        this.ctx.restore();
      }

      const camera = this.getCamera();
      this.ctx.save();
      this.ctx.fillStyle = "rgba(255,255,255,0.42)";
      this.ctx.font = "11px Orbitron, sans-serif";
      this.ctx.textAlign = "left";
      this.ctx.fillText(`WORLD ${WORLD_WIDTH} x ${WORLD_HEIGHT}`, 14, this.renderHeight - 18);
      this.ctx.textAlign = "right";
      this.ctx.fillText(`VIEW ${Math.round(camera.viewportWidth)} x ${Math.round(camera.viewportHeight)}`, this.renderWidth - 14, this.renderHeight - 18);
      this.ctx.restore();
    },

    render(ts) {
      this.setCanvasResolution();
      this.drawBackground(ts);
      this.drawWalls();
      this.drawFood(ts);
      this.drawPowerCube(ts);
      for (const ai of this.state.aiSnakes) this.drawSnake(ai, false, ts);
      this.drawSnake(this.state.player, true, ts);
      this.drawParticles();
      this.drawFloating();
      this.drawOverlays();
    },

    loop(ts) {
      if (!this.state) return;
      if (!this.lastTs) this.lastTs = ts;
      const dtSec = Math.min(0.033, Math.max(0.001, (ts - this.lastTs) / 1000));
      this.lastTs = ts;

      if (!this.paused && this.running && !this.state.over) {
        this.updateCombo(ts);
        this.updatePowerCycle(ts, dtSec);
        this.updateFever(ts);
        this.step(ts, dtSec);
        this.updateEffects(dtSec, ts);
      } else if (this.state.over) {
        this.updateEffects(dtSec, ts);
      }

      this.render(ts);
      if (this.running || this.paused || this.state.over) {
        requestAnimationFrame((nextTs) => this.loop(nextTs));
      }
    }
  });

  if (global.SnakeApp) {
    const app = global.SnakeApp;
    app.renderReplayFrame = function (timeMs) {
      const replay = this.phase6?.replaySession?.data;
      const canvas = this.dom?.replayCanvas;
      if (!replay || !canvas) return;

      const ctx = canvas.getContext("2d");
      const duration = replay.duration || 0;
      const clamped = Math.max(0, Math.min(duration, timeMs));
      this.phase6.replaySession.timeMs = clamped;
      this.dom.replayScrubber.value = String(clamped);
      this.dom.replayTimeCurrent.textContent = `${Math.floor(clamped / 60000)}:${String(Math.floor((clamped % 60000) / 1000)).padStart(2, "0")}`;
      this.dom.replayTimeTotal.textContent = `${Math.floor(duration / 60000)}:${String(Math.floor((duration % 60000) / 1000)).padStart(2, "0")}`;

      const dpr = Math.min(2, global.devicePixelRatio || 1);
      const logicalWidth = canvas.clientWidth || 820;
      const logicalHeight = canvas.clientHeight || 520;
      if (canvas.width !== Math.round(logicalWidth * dpr) || canvas.height !== Math.round(logicalHeight * dpr)) {
        canvas.width = Math.round(logicalWidth * dpr);
        canvas.height = Math.round(logicalHeight * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const viewport = getViewportForSize(logicalWidth, logicalHeight);
      const ppu = Math.min(logicalWidth / viewport.width, logicalHeight / viewport.height);
      const frames = replay.frames || [];
      if (!frames.length) return;

      let index = 0;
      let low = 0;
      let high = frames.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (frames[mid].time <= clamped) {
          index = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const frame = frames[index];
      const center = { x: frame.headX, y: frame.headY };
      const toScreen = (x, y) => {
        const dx = shortestDelta(center.x, x, WORLD_WIDTH);
        const dy = shortestDelta(center.y, y, WORLD_HEIGHT);
        return {
          x: logicalWidth * 0.5 + dx * ppu,
          y: logicalHeight * 0.5 + dy * ppu
        };
      };

      const bg = ctx.createLinearGradient(0, 0, logicalWidth, logicalHeight);
      bg.addColorStop(0, "#081220");
      bg.addColorStop(1, "#04070f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      for (let x = 0; x <= logicalWidth; x += WORLD_GRID_SPACING * ppu * 0.5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= logicalHeight; y += WORLD_GRID_SPACING * ppu * 0.5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
        ctx.stroke();
      }

      const needed = Math.max(1, frame.length || 1);
      const ghost = [];
      for (let i = index; i >= 0 && ghost.length < needed; i -= 1) ghost.push({ x: frames[i].headX, y: frames[i].headY });
      while (ghost.length < needed) ghost.push({ x: frame.headX, y: frame.headY });

      for (let i = ghost.length - 1; i >= 0; i -= 1) {
        const seg = ghost[i];
        const point = toScreen(seg.x, seg.y);
        const alpha = Math.max(0.1, 0.48 - i * 0.01);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(3, PLAYER_RADIUS * ppu * 0.72), 0, Math.PI * 2);
        ctx.fill();
      }

      const headPoint = toScreen(frame.headX, frame.headY);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(headPoint.x, headPoint.y, Math.max(4, PLAYER_RADIUS * ppu * 0.84), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(headPoint.x - 3, headPoint.y - 3, 1.5, 0, Math.PI * 2);
      ctx.arc(headPoint.x + 3, headPoint.y - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.font = "12px Orbitron, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score ${frame.score.toLocaleString()}`, 14, 24);
      ctx.fillText(`Length ${frame.length}`, 14, 42);
    };
  }

  global.SnakePhase7 = {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    VIEWPORT_SHORT_UNITS,
    VIEWPORT_LONG_UNITS,
    toroidalDistance
  };
})(window);
