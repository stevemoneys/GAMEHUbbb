export class MemoryManager {
  constructor() {
    this.cleanupTasks = new Map();
    this.lastSnapshot = { usedMB: 0, limitMB: 0 };
  }

  registerCleanup(key, fn) {
    if (!key || typeof fn !== "function") return;
    this.cleanupTasks.set(String(key), fn);
  }

  unregisterCleanup(key) {
    this.cleanupTasks.delete(String(key));
  }

  runCleanup() {
    this.cleanupTasks.forEach((fn) => {
      try {
        fn();
      } catch (_error) {
        // Cleanup isolation to avoid crashing the game loop.
      }
    });
  }

  getSnapshot() {
    if (typeof performance === "undefined" || !performance.memory) return this.lastSnapshot;

    const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
    this.lastSnapshot = { usedMB, limitMB };
    return this.lastSnapshot;
  }
}