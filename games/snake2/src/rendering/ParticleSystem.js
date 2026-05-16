import { ObjectPool } from "../performance/ObjectPool.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randRange(min, max) {
  return min + (Math.random() * (max - min));
}

export class ParticleSystem {
  constructor(config) {
    this.config = config;
    this.maxParticles = config.vfx.particles.maxParticles;
    this.dragPerSecond = config.vfx.particles.dragPerSecond;
    this.pool = new ObjectPool({
      create: () => this.#createParticle(),
      reset: (particle) => {
        particle.active = false;
        particle.life = 0;
        particle.alpha = 0;
      },
      maxSize: this.maxParticles
    });
    this.active = [];
    this.pool.prewarm(this.maxParticles);
  }

  reconfigureFromConfig() {
    const nextMax = Math.max(1, Math.floor(this.config.vfx.particles.maxParticles || this.maxParticles));
    this.dragPerSecond = this.config.vfx.particles.dragPerSecond;
    if (nextMax === this.maxParticles) return;

    this.maxParticles = nextMax;
    this.pool.setMaxSize(this.maxParticles);
    while (this.active.length > this.maxParticles) {
      const particle = this.active.pop();
      this.pool.release(particle);
    }
    this.pool.prewarm(Math.max(0, this.maxParticles - this.active.length));
  }

  #createParticle() {
    return {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      baseSize: 0,
      life: 0,
      maxLife: 0,
      alpha: 1,
      color: "rgba(255,255,255,1)"
    };
  }

  clear() {
    while (this.active.length > 0) {
      const particle = this.active.pop();
      this.pool.release(particle);
    }
  }

  emitBurst(x, y, options = {}) {
    const count = Math.max(1, Math.floor(options.count ?? this.config.vfx.particles.burstCount));
    const minSpeed = options.minSpeed ?? this.config.vfx.particles.minSpeed;
    const maxSpeed = options.maxSpeed ?? this.config.vfx.particles.maxSpeed;
    const minLife = options.minLife ?? this.config.vfx.particles.minLife;
    const maxLife = options.maxLife ?? this.config.vfx.particles.maxLife;
    const minSize = options.minSize ?? this.config.vfx.particles.minSize;
    const maxSize = options.maxSize ?? this.config.vfx.particles.maxSize;
    const color = options.color ?? "rgba(124,255,220,1)";

    for (let i = 0; i < count; i += 1) {
      const particle = this.pool.acquire();
      if (!particle) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(minSpeed, maxSpeed);
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.baseSize = randRange(minSize, maxSize);
      particle.size = particle.baseSize;
      particle.maxLife = randRange(minLife, maxLife);
      particle.life = particle.maxLife;
      particle.alpha = 1;
      particle.color = color;
      this.active.push(particle);
    }
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const particle = this.active[i];
      particle.life -= dt;

      if (particle.life <= 0) {
        particle.active = false;
        this.active.splice(i, 1);
        this.pool.release(particle);
        continue;
      }

      const t = clamp(particle.life / particle.maxLife, 0, 1);
      const drag = Math.max(0, 1 - (this.dragPerSecond * dt));
      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.size = particle.baseSize * (0.45 + (t * 0.65));
      particle.alpha = t * t;
    }
  }

  getActiveParticles() {
    return this.active;
  }

  getActiveCount() {
    return this.active.length;
  }

  trimToActive(limit) {
    const target = Math.max(0, Math.floor(limit || 0));
    while (this.active.length > target) {
      const particle = this.active.pop();
      this.pool.release(particle);
    }
  }
}
