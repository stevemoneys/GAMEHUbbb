export class StatusEffectSystem {
  constructor() {
    this.map = {
      player: [],
      ai: []
    };
  }

  reset() {
    this.map.player.length = 0;
    this.map.ai.length = 0;
  }

  add(owner, effect) {
    const bucket = this.map[owner];
    if (!bucket) return;
    const next = {
      type: effect.type,
      duration: Math.max(0.1, effect.duration || 0.1),
      remaining: Math.max(0.1, effect.duration || 0.1),
      value: effect.value ?? 1,
      stacks: effect.stacks ?? 1,
      meta: effect.meta || null
    };
    const existing = bucket.find((item) => item.type === next.type);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, next.remaining);
      existing.value = Math.max(existing.value, next.value);
      existing.stacks = Math.max(existing.stacks, next.stacks);
      existing.meta = next.meta || existing.meta;
      return;
    }
    bucket.push(next);
  }

  update(dt) {
    const owners = Object.keys(this.map);
    for (let o = 0; o < owners.length; o += 1) {
      const bucket = this.map[owners[o]];
      for (let i = bucket.length - 1; i >= 0; i -= 1) {
        bucket[i].remaining -= dt;
        if (bucket[i].remaining <= 0) bucket.splice(i, 1);
      }
    }
  }

  has(owner, type) {
    return this.map[owner]?.some((item) => item.type === type) || false;
  }

  consume(owner, type) {
    const bucket = this.map[owner];
    if (!bucket) return null;
    const index = bucket.findIndex((item) => item.type === type);
    if (index < 0) return null;
    return bucket.splice(index, 1)[0];
  }

  get(owner) {
    return this.map[owner] || [];
  }
}
