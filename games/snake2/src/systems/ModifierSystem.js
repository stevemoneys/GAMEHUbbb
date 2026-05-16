export class ModifierSystem {
  constructor() {
    this.active = [];
    this.pool = [];
  }

  clear() {
    while (this.active.length > 0) {
      this.pool.push(this.active.pop());
    }
  }

  apply(modifier) {
    const effect = this.pool.pop() || {};
    effect.type = modifier.type;
    effect.duration = Math.max(0.05, modifier.duration);
    effect.remaining = effect.duration;
    effect.value = modifier.value ?? 1;
    effect.stackable = modifier.stackable !== false;
    effect.label = modifier.label || modifier.type;

    if (!effect.stackable) {
      const existingIndex = this.active.findIndex((item) => item.type === effect.type);
      if (existingIndex >= 0) {
        this.active[existingIndex] = effect;
        return;
      }
    }

    this.active.push(effect);
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const effect = this.active[i];
      effect.remaining -= dt;
      if (effect.remaining <= 0) {
        this.pool.push(effect);
        this.active.splice(i, 1);
      }
    }
  }

  isActive(type) {
    return this.active.some((effect) => effect.type === type);
  }

  getCombinedValue(type, fallback = 1, combine = "multiply") {
    const items = this.active.filter((effect) => effect.type === type);
    if (items.length === 0) return fallback;

    if (combine === "add") {
      let value = fallback;
      for (let i = 0; i < items.length; i += 1) value += items[i].value;
      return value;
    }

    let value = fallback;
    for (let i = 0; i < items.length; i += 1) value *= items[i].value;
    return value;
  }

  getActiveEffects() {
    return this.active;
  }
}
