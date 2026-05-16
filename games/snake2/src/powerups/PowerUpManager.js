import { StatusEffectSystem } from "./StatusEffectSystem.js";
import { BuffManager } from "./BuffManager.js";
import { FoodPhysics } from "../food/FoodPhysics.js";

export class PowerUpManager {
  constructor(config) {
    this.config = config;
    this.statusSystem = new StatusEffectSystem();
    this.runtime = {
      player: BuffManager.buildModifiers([], {}),
      ai: BuffManager.buildModifiers([], {})
    };
  }

  reset() {
    this.statusSystem.reset();
    this.runtime.player = BuffManager.buildModifiers([], {});
    this.runtime.ai = BuffManager.buildModifiers([], {});
  }

  applyFoodEffect(owner, item, context = {}) {
    if (item?.type === "energy_orb") {
      this.statusSystem.add(owner, {
        type: "orb_haste",
        duration: 0.55,
        value: 1
      });
    }

    if (!item?.powerUp) return;
    this.statusSystem.add(owner, item.powerUp);

    if (item.powerUp.type === "freeze_field") {
      const other = owner === "player" ? "ai" : "player";
      if (context.hasOpponent) {
        this.statusSystem.add(other, {
          type: "freeze_slow",
          duration: 5,
          value: 1
        });
      }
    }
  }

  update(dt, context = {}) {
    this.statusSystem.update(dt);

    const playerStatuses = this.statusSystem.get("player");
    const aiStatuses = this.statusSystem.get("ai");
    this.runtime.player = BuffManager.buildModifiers(playerStatuses, {
      time: context.time,
      massRatio: context.playerSnake?.getMassRatio?.() || 0
    });
    this.runtime.ai = BuffManager.buildModifiers(aiStatuses, {
      time: context.time,
      massRatio: context.aiSnake?.getSegmentCount?.() ? Math.max(0, (context.aiSnake.getSegmentCount() - context.config.snake.initialLength) / 28) : 0
    });

    context.playerSnake?.setRuntimeModifiers(this.runtime.player.snake);
    context.aiSnake?.setRuntimeModifiers(this.runtime.ai.snake);
    context.scoreManager?.setMultiplier(this.runtime.player.scoreMultiplier);

    if (this.runtime.player.magnetRadius > 0 && context.foodSystem && context.playerSnake) {
      FoodPhysics.applyMagnetPull(
        context.foodSystem.getItems(),
        context.playerSnake.getHead(),
        this.runtime.player.magnetRadius,
        this.runtime.player.magnetStrength,
        dt
      );
    }
  }

  getScoreMultiplier(owner = "player") {
    return this.runtime[owner]?.scoreMultiplier || 1;
  }

  hasShield(owner = "player") {
    return this.runtime[owner]?.shielded || this.statusSystem.has(owner, "shielded");
  }

  consumeShield(owner = "player") {
    return this.statusSystem.consume(owner, "shielded");
  }

  getRuntime(owner = "player") {
    return this.runtime[owner] || this.runtime.player;
  }
}
