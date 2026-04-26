"use strict";

(function (global) {
  const {
    GRID_COLS,
    GRID_ROWS,
    CELL_SIZE,
    POWER_UPS,
    POWER_UP_POOL,
    DIRS,
    OPPOSITE,
    rand,
    randItem,
    keyOf,
    clamp,
    dist,
    hexToRgba,
    drawRoundedRectPath,
    deepClone
  } = global.SnakeShared;
  const {
    drawSkinSegment,
    getSkinById
  } = global.SnakeCosmetics;

  class SnakeEngine {
    constructor(opts) {
      this.canvas = opts.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.ui = opts.ui;
      this.onEnd = opts.onEnd;
      this.onStat = opts.onStat;

      this.running = false;
      this.paused = false;
      this.lastTs = 0;
      this.acc = 0;
      this.stepMs = 150;

      this.audioCtx = null;
      this.config = null;
      this.resultSent = false;
      this.state = null;

      this.bindInput();
    }

    emitGameEvent(type, payload = {}) {
      if (this.ui.onGameEvent) {
        this.ui.onGameEvent({
          type,
          ...payload,
          config: this.config,
          state: this.state
        });
      }
    }

    bindInput() {
      window.addEventListener("keydown", (event) => {
        if (!this.running || this.paused || !this.state || this.state.over) return;
        const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
        const dir = map[event.key];
        if (!dir) return;
        event.preventDefault();
        this.ensureAudio();
        if (!this.isReverse(this.state.player.direction, dir)) this.state.player.nextDirection = dir;
      });
    }

    ensureAudio() {
      if (!this.ui.sfxEnabled()) return;
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === "suspended") this.audioCtx.resume().catch(() => {});
    }

    tone(sequence) {
      if (!this.ui.sfxEnabled()) return;
      this.ensureAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      sequence.forEach((t, i) => {
        const o = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        o.type = t.type || "sine";
        o.frequency.value = t.freq;
        g.gain.value = 0.001;
        const start = now + (t.delay || i * 0.05);
        const dur = t.duration || 0.1;
        const peak = t.peak || 0.08;
        o.connect(g);
        g.connect(this.audioCtx.destination);
        g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.start(start);
        o.stop(start + dur + 0.02);
      });
    }

    sfxFood() { this.tone([{ freq: 920, duration: 0.07, peak: 0.06, type: "triangle" }]); }
    sfxBigEat() { this.tone([{ freq: 260, duration: 0.1, type: "sawtooth" }, { freq: 180, delay: 0.04, duration: 0.12, type: "square" }]); }
    sfxGameOver() { this.tone([{ freq: 450, duration: 0.1 }, { freq: 320, delay: 0.08, duration: 0.1 }, { freq: 200, delay: 0.18, duration: 0.18 }]); }
    sfxPower() { this.tone([{ freq: 420, duration: 0.08 }, { freq: 620, delay: 0.05, duration: 0.1 }, { freq: 900, delay: 0.11, duration: 0.12 }]); }
    sfxFever() { this.tone([{ freq: 280, duration: 0.08, type: "sawtooth" }, { freq: 430, delay: 0.05, duration: 0.08, type: "sawtooth" }, { freq: 620, delay: 0.1, duration: 0.08, type: "sawtooth" }]); }
    sfxComboBreak() { this.tone([{ freq: 420, duration: 0.08, peak: 0.05, type: "square" }, { freq: 270, delay: 0.05, duration: 0.1, peak: 0.055, type: "square" }]); }

    isReverse(a, b) {
      return OPPOSITE[a] === b;
    }

    createWalls(mazeLayout) {
      const walls = new Set();
      if (!mazeLayout) return walls;
      for (let y = 0; y < GRID_ROWS; y += 1) {
        for (let x = 0; x < GRID_COLS; x += 1) {
          if (mazeLayout[y] && mazeLayout[y][x] === 1) walls.add(keyOf(x, y));
        }
      }
      return walls;
    }

    start(config) {
      this.config = deepClone(config);
      const now = performance.now();
      this.resultSent = false;
      const equippedSkin = this.ui.getEquippedSkin ? this.ui.getEquippedSkin() : getSkinById("classic_green");

      const walls = this.createWalls(config.mazeLayout);
      this.state = {
        score: 0,
        highScore: this.ui.getHighScore(),
        player: this.makeSnake({ x: 20, y: 15 }, "right", 5, equippedSkin.baseColor, equippedSkin.patternColor || equippedSkin.accentColor || "#00bb66"),
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
        walls,
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

      this.spawnAISnakes();
      this.spawnFood();

      this.running = true;
      this.paused = false;
      this.lastTs = 0;
      this.acc = 0;
      this.stepMs = this.getStepMs();

      this.ui.onGameStart(config, this.state);
      this.emitGameEvent("game_start", { startedAt: now });
      requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
      this.running = false;
      this.paused = false;
    }

    restart() {
      if (!this.config) return;
      this.start(this.config);
    }

    togglePause() {
      if (!this.running || !this.state || this.state.over) return;
      this.paused = !this.paused;
      this.ui.onPauseChanged(this.paused);
    }

    makeSnake(head, direction, length, color, outline) {
      const segments = [];
      const rev = OPPOSITE[direction];
      const d = DIRS[rev];
      for (let i = 0; i < length; i += 1) {
        segments.push({ x: head.x + d.x * i, y: head.y + d.y * i });
      }
      return {
        segments,
        direction,
        nextDirection: direction,
        targetLength: length,
        color,
        outline,
        speedBurstTicks: 0,
        crown: false
      };
    }

    getSkinPerks() {
      return this.config.skinPerks || {
        coinBonus: 0,
        speedBonus: 0,
        powerDurationBonus: 0,
        comboWindowBonus: 0,
        invincibilityDurationBonus: 0,
        powerCooldownReduction: 0
      };
    }

    getComboWindowMs() {
      return Math.round(3000 * (1 + this.getSkinPerks().comboWindowBonus));
    }

    getComboWarningMs() {
      return Math.round(2000 * (1 + this.getSkinPerks().comboWindowBonus));
    }

    getComboDangerMs() {
      return Math.round(2500 * (1 + this.getSkinPerks().comboWindowBonus));
    }

    getBoosterDurationBonus(powerId) {
      const boosters = this.config.boosters || {};
      if (powerId === "magnet") return boosters.magnetDurationBonus || 0;
      if (powerId === "speed") return boosters.speedDurationBonus || 0;
      if (powerId === "shield") return boosters.shieldDurationBonus || 0;
      if (powerId === "doublePoints") return boosters.doublePointsDurationBonus || 0;
      return 0;
    }

    getUpgradeSeconds(key) {
      const upgrades = this.config.upgrades || {};
      return upgrades[key] || 0;
    }

    getPermanentCoinBonus() {
      const upgrades = this.config.upgrades || {};
      return upgrades.permanentCoinBonus || 0;
    }

    getMagnetRadius() {
      return 150 + this.getUpgradeSeconds("magnetRadius");
    }

    getStepMs() {
      const perks = this.getSkinPerks();
      let step = 150 / (1 + perks.speedBonus);
      if (this.state.activePower && this.state.activePower.id === "speed") step *= 0.5;
      if (this.state.fever) step *= 0.8;
      return Math.max(55, Math.round(step));
    }

    getPowerSpawnInterval(feverActive) {
      const reduction = Math.min(0.45, this.getSkinPerks().powerCooldownReduction || 0);
      const multiplier = 1 - reduction;
      if (feverActive) return Math.round(rand(8000, 12000) * multiplier);
      if (this.config && this.config.powerUpSpawnRate) {
        const base = this.config.powerUpSpawnRate;
        return Math.round(rand(Math.max(6000, base - 3500), Math.max(8000, base + 1500)) * multiplier);
      }
      return Math.round(rand(15000, 25000) * multiplier);
    }

    isBlocked(x, y, occupied = null) {
      if (x < 0 || y < 0 || x >= GRID_COLS || y >= GRID_ROWS) return true;
      if (this.state.walls.has(keyOf(x, y))) return true;
      if (occupied && occupied.has(keyOf(x, y))) return true;
      return false;
    }

    occupiedCells(excludeSnake = null, excludeTail = null) {
      const set = new Set();
      const addSnake = (snake, excludeTailForSnake = false) => {
        const max = snake.segments.length - (excludeTailForSnake ? 1 : 0);
        for (let i = 0; i < max; i += 1) set.add(keyOf(snake.segments[i].x, snake.segments[i].y));
      };

      if (this.state.player && this.state.player !== excludeSnake) addSnake(this.state.player, excludeTail === this.state.player);
      for (const ai of this.state.aiSnakes) if (ai !== excludeSnake) addSnake(ai, excludeTail === ai);
      for (const w of this.state.walls) set.add(w);
      return set;
    }

    getRandomEmptyCell(attempts = 220) {
      const occ = this.occupiedCells();
      for (let i = 0; i < attempts; i += 1) {
        const x = rand(0, GRID_COLS - 1);
        const y = rand(0, GRID_ROWS - 1);
        const k = keyOf(x, y);
        if (occ.has(k)) continue;
        if (this.state.food && this.state.food.x === x && this.state.food.y === y) continue;
        if (this.state.powerCube && this.state.powerCube.x === x && this.state.powerCube.y === y) continue;
        return { x, y };
      }
      return null;
    }

    spawnFood() {
      const cell = this.getRandomEmptyCell();
      if (!cell) {
        this.state.pendingFoodRespawn = 80;
        return;
      }
      this.state.food = {
        x: cell.x,
        y: cell.y,
        px: cell.x * CELL_SIZE + CELL_SIZE / 2,
        py: cell.y * CELL_SIZE + CELL_SIZE / 2
      };
    }

    spawnPowerCube(now) {
      if (this.state.powerCube) return;
      const cell = this.getRandomEmptyCell(140);
      if (!cell) return;
      const type = randItem(POWER_UP_POOL);
      this.state.powerCube = {
        x: cell.x,
        y: cell.y,
        px: cell.x * CELL_SIZE + CELL_SIZE / 2,
        py: cell.y * CELL_SIZE + CELL_SIZE / 2,
        type,
        spawnedAt: now,
        rotation: Math.random() * Math.PI * 2
      };
      this.state.powerIncoming = false;
    }

    spawnAISnakes() {
      this.state.aiSnakes = [];
      const count = this.config.aiCount || 0;
      for (let i = 0; i < count; i += 1) {
        const length = i === 0 && this.config.arcadeModeType === "BOSS_RUSH"
          ? Math.max(50, this.config.maxAILength || 50)
          : rand(this.config.minAILength || 5, this.config.maxAILength || 12);

        const ai = this.spawnAISnake(length);
        if (ai) {
          if (i === 0 && this.config.arcadeModeType === "BOSS_RUSH") {
            ai.color = "#ffd700";
            ai.outline = "#8a6d00";
            ai.crown = true;
          }
          this.state.aiSnakes.push(ai);
        }
      }
    }

    spawnAISnake(length) {
      for (let tries = 0; tries < 260; tries += 1) {
        const head = this.getRandomEmptyCell(100);
        if (!head) return null;
        const dir = randItem(["up", "down", "left", "right"]);
        const test = this.makeSnake(head, dir, length, randItem(this.config.aiColors || ["#ff6600", "#aa66ff", "#ff3333"]), "#191919");

        let valid = true;
        const occ = this.occupiedCells();
        for (const seg of test.segments) {
          if (this.isBlocked(seg.x, seg.y) || occ.has(keyOf(seg.x, seg.y))) {
            valid = false;
            break;
          }
        }
        if (valid) return test;
      }
      return null;
    }

    moveSnake(snake) {
      const desired = snake.nextDirection;
      if (!this.isReverse(snake.direction, desired)) snake.direction = desired;
      const d = DIRS[snake.direction];
      const head = snake.segments[0];
      const next = { x: head.x + d.x, y: head.y + d.y };
      snake.segments.unshift(next);
      while (snake.segments.length > snake.targetLength) snake.segments.pop();
    }

    bfsNextDirection(start, target, blocked) {
      const q = [start];
      const prev = new Map();
      prev.set(keyOf(start.x, start.y), null);

      while (q.length) {
        const cur = q.shift();
        if (cur.x === target.x && cur.y === target.y) break;
        for (const [dirName, d] of Object.entries(DIRS)) {
          const nx = cur.x + d.x;
          const ny = cur.y + d.y;
          const k = keyOf(nx, ny);
          if (blocked.has(k) || prev.has(k)) continue;
          if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue;
          prev.set(k, { from: keyOf(cur.x, cur.y), dir: dirName });
          q.push({ x: nx, y: ny });
        }
      }

      const tKey = keyOf(target.x, target.y);
      if (!prev.has(tKey)) return null;
      let cursor = tKey;
      let step = prev.get(cursor);
      while (step && step.from !== keyOf(start.x, start.y)) {
        cursor = step.from;
        step = prev.get(cursor);
      }
      return step ? step.dir : null;
    }

    chooseAIDirection(ai, index) {
      const tier = this.config.aiTier || 1;
      const options = ["up", "down", "left", "right"].filter((dir) => !this.isReverse(ai.direction, dir));
      const occupied = this.occupiedCells(ai, ai);
      for (let i = 0; i < ai.segments.length - 1; i += 1) occupied.add(keyOf(ai.segments[i].x, ai.segments[i].y));

      const head = ai.segments[0];
      const pHead = this.state.player.segments[0];
      let target = this.state.food ? { x: this.state.food.x, y: this.state.food.y } : { x: pHead.x, y: pHead.y };

      if (tier >= 2) {
        if (ai.targetLength >= this.state.player.targetLength || tier >= 3) {
          const pd = DIRS[this.state.player.direction];
          const ahead = tier >= 3 ? 2 + Math.min(3, tier) : 1;
          target = {
            x: clamp(pHead.x + pd.x * ahead, 1, GRID_COLS - 2),
            y: clamp(pHead.y + pd.y * ahead, 1, GRID_ROWS - 2)
          };
        }
      }

      if (tier >= 4) {
        const offsets = [
          { x: 3, y: 0 },
          { x: -3, y: 0 },
          { x: 0, y: 3 },
          { x: 0, y: -3 },
          { x: 2, y: 2 },
          { x: -2, y: -2 },
          { x: 2, y: -2 }
        ];
        const off = offsets[index % offsets.length];
        target = {
          x: clamp(pHead.x + off.x, 1, GRID_COLS - 2),
          y: clamp(pHead.y + off.y, 1, GRID_ROWS - 2)
        };
        if (Math.random() < 0.025) ai.speedBurstTicks = 12;
      }

      const useBfs = !!this.config.mazeLayout || tier >= 3;
      if (useBfs) {
        const blocked = new Set(occupied);
        blocked.delete(keyOf(target.x, target.y));
        const nextDir = this.bfsNextDirection(head, target, blocked);
        if (nextDir && options.includes(nextDir)) {
          ai.nextDirection = nextDir;
          return;
        }
      }

      let best = ai.direction;
      let bestScore = -Infinity;
      for (const dir of options) {
        const d = DIRS[dir];
        const nx = head.x + d.x;
        const ny = head.y + d.y;
        if (this.isBlocked(nx, ny, occupied)) continue;

        let score = Math.random() * 2;
        const wallPad = Math.min(nx, GRID_COLS - 1 - nx, ny, GRID_ROWS - 1 - ny);
        score += Math.min(4, wallPad) * 0.28;
        const distTarget = Math.abs(nx - target.x) + Math.abs(ny - target.y);
        score += Math.max(0, 18 - distTarget) * (tier >= 2 ? 0.25 : 0.08);

        if (tier >= 3) {
          const playerDist = Math.abs(nx - pHead.x) + Math.abs(ny - pHead.y);
          if (ai.targetLength < this.state.player.targetLength && tier === 3) score += playerDist * 0.08;
        }

        if (score > bestScore) {
          bestScore = score;
          best = dir;
        }
      }
      ai.nextDirection = best;
    }

    moveAIs() {
      for (let i = 0; i < this.state.aiSnakes.length; i += 1) {
        const ai = this.state.aiSnakes[i];
        this.chooseAIDirection(ai, i);

        const base = this.config.baseAISpeed || 1;
        const speed = base + (ai.speedBurstTicks > 0 ? 0.6 : 0);
        const moves = Math.floor(speed);
        const extra = speed - moves;

        for (let m = 0; m < moves; m += 1) this.moveSnake(ai);
        if (Math.random() < extra) this.moveSnake(ai);

        if (ai.speedBurstTicks > 0) ai.speedBurstTicks -= 1;
      }
    }

    updateCombo(now) {
      if (this.state.combo <= 0) {
        this.state.comboState = "none";
        return;
      }

      const elapsed = now - this.state.lastEat;
      if (elapsed >= this.getComboWindowMs()) {
        this.state.combo = 0;
        this.state.comboState = "none";
        this.addFloat(GRID_COLS * CELL_SIZE * 0.5, 80, "Combo reset", "#ff9fa7", 0.7, -26);
        this.sfxComboBreak();
        return;
      }

      if (elapsed >= this.getComboDangerMs()) this.state.comboState = "danger";
      else if (elapsed >= this.getComboWarningMs()) this.state.comboState = "warning";
      else this.state.comboState = "none";
    }

    activateOrRefreshFever(now) {
      if (!this.state.fever) {
        this.state.fever = true;
        this.state.feverBanner = 1000;
        this.state.sessionStats.feverActivations += 1;
        this.sfxFever();
        this.setFlash("#ff66ff", 0.23, 0.22);
        this.addFloat(400, 300, "FEVER!", "#ffffff", 1.0, -28);
        this.emitGameEvent("fever_activated", { total: this.state.sessionStats.feverActivations });
      }
      this.state.feverEnd = now + 8000;
      if (!this.state.powerCube) this.state.nextPowerSpawn = Math.min(this.state.nextPowerSpawn, now + rand(8000, 12000));
    }

    registerEat(basePoints, isFood, x, y) {
      const now = performance.now();
      this.state.combo = Math.min(99, this.state.combo + 1);
      this.state.sessionStats.maxCombo = Math.max(this.state.sessionStats.maxCombo, this.state.combo);
      this.state.lastEat = now;
      this.state.comboState = "none";

      let points = basePoints;
      if (isFood && this.state.activePower && this.state.activePower.id === "doublePoints") points *= 2;
      points *= 1 + this.state.combo / 10;
      if (this.state.fever) points *= 2;
      points = Math.round(points);

      this.state.score += points;
      this.addFloat(x, y - 6, `+${points}`, "#ffe66e", 0.7, -62);
      this.addFloat(x + 24, y + 8, "+1 COMBO", "#ff9f5a", 0.55, -46);

      if (isFood && this.state.activePower && this.state.activePower.id === "doublePoints") {
        this.addFloat(x - 20, y + 4, "x2", "#ffb74d", 0.45, -40);
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
    }

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
          size: 2 + Math.random() * 2.8,
          color,
          hueMode,
          hue: this.state.hue
        });
      }
    }

    addFloat(x, y, text, color, life = 0.55, vy = -54) {
      this.state.floating.push({ x, y, text, color, life, maxLife: life, vy });
    }

    setFlash(color, alpha = 0.3, life = 0.2) {
      this.state.flash = { color, alpha, life, maxLife: life };
    }

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
      const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const hy = head.y * CELL_SIZE + CELL_SIZE / 2;
      this.state.playerFlashMs = 180;
      this.state.playerFlashColor = def.color;
      this.spawnBurst(hx, hy, def.color, 18, 70, 190);
      this.addFloat(hx, hy - 8, def.name, def.color, 0.8, -42);
      this.setFlash(def.color, 0.26, 0.23);
      this.sfxPower();

      if (this.config.arcadeModeType === "TIME_ATTACK" && this.state.modeTimeLeft !== null) {
        this.state.modeTimeLeft = Math.min(180000, this.state.modeTimeLeft + 2000);
        this.addFloat(650, 90, "+2s", "#6ef7ff", 0.6, -30);
      }

      this.emitGameEvent("power_up_collected", {
        powerId: def.id,
        count: this.state.sessionStats.powerUpsCollected,
        uniqueCount: this.state.sessionStats.uniquePowerUps.length
      });

      return true;
    }

    expirePower() {
      if (!this.state.activePower) return;
      this.state.activePower = null;
      this.state.powerEnd = 0;
      this.addFloat(390, 120, "Power-up expired", "#d8e2ff", 0.7, -22);
    }

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

      if (this.state.activePower && this.state.activePower.id === "magnet" && this.state.food) {
        const pHead = this.state.player.segments[0];
        const hx = pHead.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = pHead.y * CELL_SIZE + CELL_SIZE / 2;
        const dx = hx - this.state.food.px;
        const dy = hy - this.state.food.py;
        const d = Math.hypot(dx, dy);
        if (d > 0.001 && d <= this.getMagnetRadius()) {
          const step = Math.min(d, 300 * dtSec);
          this.state.food.px += (dx / d) * step;
          this.state.food.py += (dy / d) * step;
          this.state.food.x = clamp(Math.round((this.state.food.px - CELL_SIZE / 2) / CELL_SIZE), 0, GRID_COLS - 1);
          this.state.food.y = clamp(Math.round((this.state.food.py - CELL_SIZE / 2) / CELL_SIZE), 0, GRID_ROWS - 1);
        }
      }
    }

    updateFever(now) {
      if (this.state.fever && now >= this.state.feverEnd) {
        this.state.fever = false;
        this.state.feverEnd = 0;
        this.addFloat(400, 100, "Fever ended", "#9fc7ff", 0.8, -20);
      }
    }

    checkPlayerFood() {
      if (!this.state.food) return;
      const head = this.state.player.segments[0];
      const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const hy = head.y * CELL_SIZE + CELL_SIZE / 2;
      if (dist(hx, hy, this.state.food.px, this.state.food.py) > 17) return;

      this.state.player.targetLength += 1;
      this.state.sessionStats.foodEaten += 1;
      this.state.playerFlashMs = 120;
      this.state.playerFlashColor = "#ffffff";
      this.sfxFood();
      this.registerEat(10, true, this.state.food.px, this.state.food.py);
      this.spawnBurst(this.state.food.px, this.state.food.py, "#ffe66e", 8, 45, 110);
      this.emitGameEvent("food_eaten", {
        count: this.state.sessionStats.foodEaten,
        length: this.state.player.targetLength,
        score: this.state.score
      });
      this.state.food = null;
      this.spawnFood();
    }

    checkAIFood() {
      if (!this.state.food) return;
      for (const ai of this.state.aiSnakes) {
        const h = ai.segments[0];
        const hx = h.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = h.y * CELL_SIZE + CELL_SIZE / 2;
        if (dist(hx, hy, this.state.food.px, this.state.food.py) <= 15) {
          ai.targetLength += 1;
          this.state.food = null;
          this.spawnFood();
          return;
        }
      }
    }

    checkPowerPickup(now) {
      if (!this.state.powerCube) return;
      const head = this.state.player.segments[0];
      const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const hy = head.y * CELL_SIZE + CELL_SIZE / 2;
      const cube = this.state.powerCube;
      if (dist(hx, hy, cube.px, cube.py) > 18) return;
      if (this.state.activePower) return;
      if (this.applyPowerUp(cube.type, now)) {
        this.state.powerCube = null;
        this.state.nextPowerSpawn = now + this.getPowerSpawnInterval(this.state.fever);
      }
    }

    playerSelfHit() {
      const [head, ...body] = this.state.player.segments;
      return body.some((seg) => seg.x === head.x && seg.y === head.y);
    }

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
    }

    checkPlayerVsAI() {
      const head = this.state.player.segments[0];
      for (const ai of [...this.state.aiSnakes]) {
        for (const seg of ai.segments) {
          if (seg.x !== head.x || seg.y !== head.y) continue;

          const pLen = this.state.player.targetLength;
          const aLen = ai.targetLength;

          if (pLen > aLen) {
            const px = head.x * CELL_SIZE + CELL_SIZE / 2;
            const py = head.y * CELL_SIZE + CELL_SIZE / 2;
            this.state.player.targetLength += aLen;
            this.state.aiSnakesEaten += 1;
            this.state.sessionStats.aiEaten += 1;
            this.state.playerFlashMs = 180;
            this.state.playerFlashColor = "#ffffff";
            this.registerEat(aLen * 10, false, px, py);
            this.addFloat(px + 20, py + 8, `+${aLen} GROWTH`, "#9bffda", 0.75, -46);
            this.spawnBurst(px, py, ai.color, 14, 60, 170);
            this.sfxBigEat();
            this.emitGameEvent("ai_eaten", {
              count: this.state.sessionStats.aiEaten,
              totalAiEaten: this.state.aiSnakesEaten,
              growth: aLen
            });
            this.removeAndRespawnAI(ai);
            return;
          }

          if (this.state.activePower && this.state.activePower.id === "shield") {
            const px = head.x * CELL_SIZE + CELL_SIZE / 2;
            const py = head.y * CELL_SIZE + CELL_SIZE / 2;
            this.spawnBurst(px, py, "#ffd54f", 4, 20, 70);
            return;
          }

          this.endGame(false, "You hit a stronger snake.");
          return;
        }
      }
    }

    cleanAICollisions() {
      for (const ai of [...this.state.aiSnakes]) {
        const head = ai.segments[0];
        let dead = false;
        if (this.isBlocked(head.x, head.y)) dead = true;

        if (!dead) {
          for (let i = 1; i < ai.segments.length; i += 1) {
            if (ai.segments[i].x === head.x && ai.segments[i].y === head.y) {
              dead = true;
              break;
            }
          }
        }

        if (!dead) {
          for (const other of this.state.aiSnakes) {
            for (let i = 0; i < other.segments.length; i += 1) {
              if (other === ai && i === 0) continue;
              if (other.segments[i].x === head.x && other.segments[i].y === head.y) {
                dead = true;
                break;
              }
            }
            if (dead) break;
          }
        }

        if (!dead) {
          for (const seg of this.state.player.segments) {
            if (seg.x === head.x && seg.y === head.y) {
              dead = true;
              break;
            }
          }
        }

        if (dead) this.removeAndRespawnAI(ai);
      }
    }

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
    }

    step(now, dtSec) {
      if (this.state.over) return;

      if (this.state.pendingFoodRespawn > 0) {
        this.state.pendingFoodRespawn -= this.stepMs;
        if (this.state.pendingFoodRespawn <= 0 && !this.state.food) this.spawnFood();
      }

      this.moveSnake(this.state.player);
      this.moveAIs();

      const pHead = this.state.player.segments[0];
      if (this.isBlocked(pHead.x, pHead.y)) {
        this.endGame(false, "You hit a wall.");
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
    }

    calculateCoins(win) {
      let coins = 0;
      if (this.config.mode === "campaign") coins = win ? (this.config.rewardCoins || 0) : 0;
      else if (this.config.arcadeModeType === "BOSS_RUSH") coins = win ? 1200 : Math.floor(this.state.score / 12);
      else {
        const base = Math.floor(this.state.score / 10);
        coins = this.config.arcadeModeType === "TIME_ATTACK" ? base + (win ? 120 : 0) : base;
      }

      return Math.round(coins * (1 + (this.getSkinPerks().coinBonus || 0) + this.getPermanentCoinBonus()));
    }

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
    }
    updateEffects(dtSec, ts) {
      this.state.hue += dtSec * 45;

      this.state.playerFlashMs = Math.max(0, this.state.playerFlashMs - dtSec * 1000);
      this.state.feverBanner = Math.max(0, this.state.feverBanner - dtSec * 1000);

      if (this.state.shakeMs > 0) {
        this.state.shakeMs = Math.max(0, this.state.shakeMs - dtSec * 1000);
        const s = this.state.shakeStrength || 1.5;
        const tx = (Math.random() - 0.5) * s;
        const ty = (Math.random() - 0.5) * s;
        this.canvas.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
      } else {
        this.canvas.style.transform = "";
      }

      if (this.state.fever || (this.state.activePower && this.state.activePower.id === "speed")) {
        const head = this.state.player.segments[0];
        const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = head.y * CELL_SIZE + CELL_SIZE / 2;

        if (this.state.fever) {
          this.state.particles.push({
            x: hx + rand(-4, 4),
            y: hy + rand(-4, 4),
            vx: rand(-26, 26),
            vy: rand(-26, 26),
            life: 0.4,
            maxLife: 0.4,
            size: 2 + Math.random() * 2,
            color: "#fff",
            hueMode: true,
            hue: this.state.hue
          });
        } else {
          this.state.particles.push({
            x: hx + rand(-3, 3),
            y: hy + rand(-3, 3),
            vx: rand(-18, 18),
            vy: rand(-18, 18),
            life: 0.26,
            maxLife: 0.26,
            size: 2,
            color: "#4de7ff",
            hueMode: false,
            hue: 0
          });
        }
      }

      if (this.state.activePower && this.state.activePower.id === "shield") {
        const h = this.state.player.segments[0];
        const hx = h.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = h.y * CELL_SIZE + CELL_SIZE / 2;
        const a = Math.random() * Math.PI * 2;
        this.state.particles.push({
          x: hx + Math.cos(a) * 13,
          y: hy + Math.sin(a) * 13,
          vx: Math.cos(a) * 22,
          vy: Math.sin(a) * 22,
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
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.vx *= 0.975;
        p.vy = p.vy * 0.975 + 18 * dtSec;
        if (p.life <= 0) this.state.particles.splice(i, 1);
      }

      this.ui.updateHUD(this.state, this.config);
    }

    drawBackground(ts) {
      const theme = this.ui.getArenaTheme ? this.ui.getArenaTheme() : null;
      const themeStyles = theme ? theme.styles : null;
      if (this.state.fever) {
        const hue = (ts * 0.03 + this.state.hue) % 360;
        const g = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        g.addColorStop(0, `hsla(${hue},72%,18%,1)`);
        g.addColorStop(0.5, `hsla(${(hue + 90) % 360},78%,15%,1)`);
        g.addColorStop(1, `hsla(${(hue + 180) % 360},72%,18%,1)`);
        this.ctx.fillStyle = g;
      } else {
        this.ctx.fillStyle = themeStyles ? themeStyles.background : this.ui.getArenaColor();
      }
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();
      this.ctx.strokeStyle = this.state.fever
        ? `rgba(255,255,255,0.12)`
        : themeStyles?.gridColor || `rgba(255,255,255,0.08)`;
      this.ctx.lineWidth = 1;
      for (let x = 0; x <= this.canvas.width; x += CELL_SIZE) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + 0.5, 0);
        this.ctx.lineTo(x + 0.5, this.canvas.height);
        this.ctx.stroke();
      }
      for (let y = 0; y <= this.canvas.height; y += CELL_SIZE) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y + 0.5);
        this.ctx.lineTo(this.canvas.width, y + 0.5);
        this.ctx.stroke();
      }
      this.ctx.restore();

      this.ctx.save();
      if (this.state.fever) {
        const hue = (ts * 0.25 + this.state.hue) % 360;
        this.ctx.strokeStyle = `hsla(${hue},98%,62%,0.85)`;
        this.ctx.shadowBlur = 18;
        this.ctx.shadowColor = `hsla(${hue},98%,62%,0.85)`;
        this.ctx.lineWidth = 5;
      } else {
        const pulse = 0.15 + 0.06 * Math.sin(ts * 0.0025);
        this.ctx.strokeStyle = themeStyles?.borderColor ? hexToRgba(themeStyles.borderColor, pulse + 0.2) : `rgba(0,243,255,${pulse})`;
        this.ctx.lineWidth = 4;
      }
      this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
      this.ctx.restore();
    }

    drawWalls() {
      if (!this.state.walls.size) return;
      const wallColor = this.ui.getArenaTheme ? this.ui.getArenaTheme()?.styles?.wallColor : null;
      this.ctx.save();
      this.ctx.fillStyle = wallColor || "#2a3244";
      for (const w of this.state.walls) {
        const [x, y] = w.split(",").map(Number);
        this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
      this.ctx.restore();
    }

    drawFood(ts) {
      if (!this.state.food) return;
      const pulse = 1 + 0.14 * Math.sin(ts * 0.01);
      const r = 8 * pulse;
      this.ctx.save();
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = "rgba(255,255,230,0.95)";
      this.ctx.fillStyle = "#ffcc00";
      this.ctx.beginPath();
      this.ctx.arc(this.state.food.px, this.state.food.py, r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    drawPowerCube(ts) {
      const cube = this.state.powerCube;
      if (!cube) return;
      const def = POWER_UPS[cube.type];
      const pulse = 1 + 0.12 * Math.sin(ts * 0.01);
      const size = 18 * pulse;
      const half = size / 2;
      const rot = cube.rotation + ts * 0.0013;

      this.ctx.save();
      this.ctx.translate(cube.px, cube.py);
      this.ctx.rotate(rot);
      this.ctx.shadowBlur = 18;
      this.ctx.shadowColor = hexToRgba(def.color, 0.95);
      this.ctx.fillStyle = def.color;
      drawRoundedRectPath(this.ctx, -half, -half, size, size, 5);
      this.ctx.fill();

      this.ctx.strokeStyle = "rgba(255,255,255,0.82)";
      this.ctx.lineWidth = 1.3;
      this.ctx.stroke();

      this.ctx.rotate(-rot);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 9px Orbitron";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(def.icon, 0, 0);
      this.ctx.restore();
    }

    drawSnake(snake, isPlayer, ts) {
      if (isPlayer) {
        const head = snake.segments[0];
        const feverGlow = this.state.fever;
        const shieldGlow = this.state.activePower && this.state.activePower.id === "shield";
        const skin = this.state.playerSkin || getSkinById("classic_green");
        const flashStrength = this.state.playerFlashMs > 0 ? this.state.playerFlashMs / 180 : 0;

        this.ctx.save();
        for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
          const seg = snake.segments[i];
          const px = seg.x * CELL_SIZE;
          const py = seg.y * CELL_SIZE;
          const alpha = Math.max(0.05, 0.2 - i * 0.008);
          this.ctx.fillStyle = feverGlow
            ? `hsla(${(ts * 0.35 + i * 12) % 360},95%,62%,${alpha + 0.05})`
            : hexToRgba(skin.baseColor, alpha);
          drawRoundedRectPath(this.ctx, px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
          this.ctx.fill();
        }
        this.ctx.restore();

        for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
          const seg = snake.segments[i];
          this.ctx.save();
          if (feverGlow) {
            const hue = (ts * 0.4 + i * 10) % 360;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = `hsla(${hue},95%,62%,0.9)`;
          } else if (shieldGlow) {
            this.ctx.shadowBlur = 13;
            this.ctx.shadowColor = "rgba(255,213,79,0.95)";
          } else {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = hexToRgba(skin.patternColor || skin.baseColor, 0.55);
          }

          drawSkinSegment(this.ctx, seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, skin, seg === head, i, {
            direction: snake.direction,
            ts,
            flashColor: this.state.playerFlashColor,
            flashStrength,
            outlineColor: shieldGlow ? "#ffd54f" : feverGlow ? "#ffffff" : hexToRgba("#03070f", 0.8)
          });
          this.ctx.restore();
        }

        return;
      }

      const head = snake.segments[0];
      const feverGlow = this.state.fever && isPlayer;
      const shieldGlow = isPlayer && this.state.activePower && this.state.activePower.id === "shield";
      let color = snake.color;
      if (isPlayer && this.state.playerFlashMs > 0) color = this.state.playerFlashColor || "#fff";

      this.ctx.save();
      for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
        const seg = snake.segments[i];
        const px = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const py = seg.y * CELL_SIZE + CELL_SIZE / 2;
        const alpha = Math.max(0.06, 0.24 - i * 0.01);
        let trail = isPlayer ? `rgba(0,255,136,${alpha})` : hexToRgba(snake.color, alpha * 0.9);
        if (feverGlow) {
          const hue = (ts * 0.35 + i * 12) % 360;
          trail = `hsla(${hue},95%,62%,${Math.max(0.07, alpha + 0.05)})`;
        }
        this.ctx.fillStyle = trail;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 13, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();

      for (let i = snake.segments.length - 1; i >= 0; i -= 1) {
        const seg = snake.segments[i];
        const px = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const py = seg.y * CELL_SIZE + CELL_SIZE / 2;
        const isHead = seg === head;
        const radius = isHead ? 11 : 9;

        this.ctx.save();
        if (feverGlow) {
          const hue = (ts * 0.4 + i * 10) % 360;
          this.ctx.shadowBlur = 14;
          this.ctx.shadowColor = `hsla(${hue},95%,62%,0.92)`;
          this.ctx.strokeStyle = `hsla(${(hue + 50) % 360},95%,70%,0.95)`;
        } else if (shieldGlow) {
          this.ctx.shadowBlur = 13;
          this.ctx.shadowColor = "rgba(255,213,79,0.95)";
          this.ctx.strokeStyle = "#ffd54f";
        } else {
          this.ctx.shadowBlur = isPlayer ? 12 : 8;
          this.ctx.shadowColor = isPlayer ? "rgba(0,255,136,0.9)" : hexToRgba(snake.color, 0.9);
          this.ctx.strokeStyle = snake.outline;
        }

        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
      }

      this.drawEyes(snake, isPlayer, ts);
      if (!isPlayer) this.drawAILabel(snake);
      if (snake.crown) this.drawCrown(head);
    }

    drawAILabel(snake) {
      const h = snake.segments[0];
      const x = h.x * CELL_SIZE + CELL_SIZE / 2;
      const y = h.y * CELL_SIZE + CELL_SIZE / 2 - 16;
      this.ctx.save();
      this.ctx.font = "bold 12px Orbitron";
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "#f4f7ff";
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = "rgba(0,0,0,0.8)";
      this.ctx.fillText(String(snake.targetLength), x, y);
      this.ctx.restore();
    }

    drawCrown(head) {
      const x = head.x * CELL_SIZE + CELL_SIZE / 2;
      const y = head.y * CELL_SIZE + CELL_SIZE / 2 - 16;
      this.ctx.save();
      this.ctx.fillStyle = "#ffd700";
      this.ctx.beginPath();
      this.ctx.moveTo(x - 8, y + 5);
      this.ctx.lineTo(x - 5, y - 4);
      this.ctx.lineTo(x - 1, y + 1);
      this.ctx.lineTo(x + 2, y - 6);
      this.ctx.lineTo(x + 5, y + 1);
      this.ctx.lineTo(x + 8, y - 4);
      this.ctx.lineTo(x + 10, y + 5);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }

    drawEyes(snake, isPlayer, ts) {
      const h = snake.segments[0];
      const dir = DIRS[snake.direction];
      const px = h.x * CELL_SIZE + CELL_SIZE / 2;
      const py = h.y * CELL_SIZE + CELL_SIZE / 2;
      const sideX = -dir.y;
      const sideY = dir.x;
      const forward = 3.8;
      const side = 4.4;

      const e1 = { x: px + dir.x * forward + sideX * side, y: py + dir.y * forward + sideY * side };
      const e2 = { x: px + dir.x * forward - sideX * side, y: py + dir.y * forward - sideY * side };

      this.ctx.save();
      if (isPlayer && this.state.fever) {
        const hue = (ts * 0.5) % 360;
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = `hsla(${hue},100%,86%,0.95)`;
      }

      [e1, e2].forEach((e) => {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.beginPath();
        this.ctx.arc(e.x, e.y, 3.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = "#000";
        this.ctx.beginPath();
        this.ctx.arc(e.x + dir.x * 1.2, e.y + dir.y * 1.2, 1.4, 0, Math.PI * 2);
        this.ctx.fill();
      });

      this.ctx.restore();
    }

    drawParticles() {
      this.ctx.save();
      for (const p of this.state.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        this.ctx.fillStyle = p.hueMode ? `hsla(${p.hue},95%,62%,${alpha})` : hexToRgba(p.color, alpha);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    drawFloating() {
      this.ctx.save();
      this.ctx.font = "bold 20px 'Trebuchet MS'";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      for (const f of this.state.floating) {
        const alpha = Math.max(0, f.life / f.maxLife);
        this.ctx.fillStyle = hexToRgba(f.color, alpha);
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = hexToRgba(f.color, alpha);
        this.ctx.fillText(f.text, f.x, f.y);
      }
      this.ctx.restore();
    }

    drawOverlays() {
      if (this.state.feverBanner > 0) {
        const a = Math.max(0, this.state.feverBanner / 1000);
        this.ctx.save();
        this.ctx.fillStyle = `rgba(255,255,255,${0.15 * a})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = "bold 84px Orbitron";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = `rgba(255,255,255,${a})`;
        this.ctx.fillStyle = `rgba(255,255,255,${a})`;
        this.ctx.fillText("FEVER!", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
      }

      if (this.state.flash) {
        const f = this.state.flash;
        const alpha = Math.max(0, (f.life / f.maxLife) * f.alpha);
        this.ctx.save();
        this.ctx.fillStyle = hexToRgba(f.color, alpha);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      }

      if (this.paused && !this.state.over) {
        this.ctx.save();
        this.ctx.fillStyle = "rgba(0,0,0,0.42)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 52px Orbitron";
        this.ctx.textAlign = "center";
        this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
      }
    }

    render(ts) {
      this.drawBackground(ts);
      this.drawWalls();
      this.drawFood(ts);
      this.drawPowerCube(ts);
      for (const ai of this.state.aiSnakes) this.drawSnake(ai, false, ts);
      this.drawSnake(this.state.player, true, ts);
      this.drawParticles();
      this.drawFloating();
      this.drawOverlays();
    }

    loop(ts) {
      if (!this.running && (!this.state || !this.state.over)) return;
      if (!this.lastTs) this.lastTs = ts;
      const frameMs = ts - this.lastTs;
      this.lastTs = ts;
      const dtSec = Math.min(0.05, frameMs / 1000);

      if (this.running && !this.paused && !this.state.over) {
        const now = ts;
        this.updateCombo(now);
        this.updateFever(now);
        this.updatePowerCycle(now, dtSec);
        this.stepMs = this.getStepMs();
        this.acc += frameMs;

        let guard = 0;
        while (guard < 8 && this.acc >= this.stepMs) {
          this.step(now, dtSec);
          this.acc -= this.stepMs;
          guard += 1;
          if (this.state.over) break;
        }

        if (this.onStat) this.onStat({ playing: true, playMs: frameMs });
      }

      this.updateEffects(dtSec, ts);
      this.render(ts);

      if (!this.state.over || this.ui.isEndOverlayOpen()) {
        requestAnimationFrame((t) => this.loop(t));
      }
    }
  }

  global.SnakeEngine = SnakeEngine;
})(window);
