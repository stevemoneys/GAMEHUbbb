export class ObjectPool {
  constructor(options = {}) {
    this.create = options.create || (() => ({}));
    this.reset = options.reset || (() => {});
    this.maxSize = Number.isFinite(options.maxSize) ? Math.max(1, Math.floor(options.maxSize)) : 128;
    this.pool = [];
  }

  prewarm(count) {
    const target = Math.min(this.maxSize, Math.max(0, Math.floor(count || 0)));
    for (let i = this.pool.length; i < target; i += 1) {
      this.pool.push(this.create());
    }
  }

  acquire() {
    return this.pool.pop() || this.create();
  }

  release(item) {
    if (!item) return;
    this.reset(item);
    if (this.pool.length >= this.maxSize) return;
    this.pool.push(item);
  }

  releaseMany(items) {
    if (!Array.isArray(items)) return;
    for (let i = 0; i < items.length; i += 1) {
      this.release(items[i]);
    }
  }

  size() {
    return this.pool.length;
  }

  setMaxSize(nextMax) {
    if (!Number.isFinite(nextMax)) return;
    this.maxSize = Math.max(1, Math.floor(nextMax));
    if (this.pool.length > this.maxSize) {
      this.pool.length = this.maxSize;
    }
  }
}