import { FoodSpawnSystem } from "./FoodSpawnSystem.js";
import { FoodAnimationSystem } from "./FoodAnimationSystem.js";
import { Collision } from "../systems/Collision.js";

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return (dx * dx) + (dy * dy);
}

export class FoodManager {
  constructor(config) {
    this.config = config;
    this.spawnSystem = new FoodSpawnSystem();
    this.animationSystem = new FoodAnimationSystem();
    this.items = [];
    this.modeName = "classic";
    this.referencePlayerHead = null;
    this.referenceAIHead = null;
    this.state = {
      rareTimer: 0,
      fragmentTimer: 0
    };
  }

  reset(modeName = "classic") {
    this.items.length = 0;
    this.modeName = modeName;
    this.state.rareTimer = this.config.food.rareSpawnInterval * 0.65;
    this.state.fragmentTimer = this.config.food.fragmentSpawnInterval * 0.45;
  }

  update(dt, context = {}) {
    this.referencePlayerHead = context.playerHead || this.referencePlayerHead;
    this.referenceAIHead = context.aiHead || this.referenceAIHead;
    this.state.rareTimer += dt;
    this.state.fragmentTimer += dt;
    this.animationSystem.update(this.items, dt);

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      if (item.ttl > 0 && item.life <= 0) {
        this.items.splice(i, 1);
      }
    }

    if (context.spawnBounds) {
      this.refill(context);
    }
  }

  refill(context = {}) {
    const occupied = context.occupiedPoints || [];
    const bounds = context.spawnBounds;
    if (!bounds) return;

    const queue = this.spawnSystem.buildSpawnPlan(this, {
      modeName: context.modeName || this.modeName,
      score: context.score || 0,
      rareInterval: this.config.food.rareSpawnInterval,
      fragmentInterval: this.config.food.fragmentSpawnInterval
    });

    for (let i = 0; i < queue.length; i += 1) {
      const type = queue[i];
      const food = this.spawnSystem.spawn(type, occupied, bounds, {
        playerHead: context.playerHead,
        aiHead: context.aiHead,
        modeName: context.modeName || this.modeName,
        score: context.score || 0,
        maxAttempts: this.config.food.maxSpawnAttempts
      });
      this.items.push(food);
      occupied.push({ x: food.x, y: food.y, r: food.radius + 8 });
    }
  }

  collectForSnake(head, headRadius) {
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (!Collision.isFoodCollision(head, headRadius, item)) continue;
      this.items.splice(i, 1);
      return item;
    }
    return null;
  }

  getItems() {
    return this.items;
  }

  getActiveCount() {
    return this.items.length;
  }

  getAITarget(aiHead = this.referenceAIHead, playerHead = this.referencePlayerHead) {
    if (this.items.length === 0) return { x: 0, y: 0, radius: this.config.food.radiusPx };
    const pivot = aiHead || playerHead || this.items[0];
    let best = this.items[0];
    let bestScore = -Infinity;

    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      const distPenalty = distanceSq(item, pivot) * 0.0022;
      const contestedBonus = item.contested && playerHead ? 26 - Math.min(26, Math.sqrt(distanceSq(item, playerHead)) * 0.06) : 0;
      const score = (item.scoreValue * 1.1) + (item.aiPriority * 20) + contestedBonus - distPenalty;
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    return best;
  }

  getPrimaryTarget() {
    if (this.items.length === 0) return { x: 0, y: 0, radius: this.config.food.radiusPx };
    return this.getAITarget();
  }

  get x() {
    return this.getPrimaryTarget().x;
  }

  get y() {
    return this.getPrimaryTarget().y;
  }

  get radius() {
    return this.getPrimaryTarget().radius;
  }
}
