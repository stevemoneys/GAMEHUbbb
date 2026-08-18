export class FoodPhysics {
  static applyMagnetPull(items, target, radius, strength, dt) {
    if (!target || radius <= 0 || strength <= 0) return;
    const radiusSq = radius * radius;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type === "corrupted_core" || item.type === "evolution_fragment") continue;
      const dx = target.x - item.x;
      const dy = target.y - item.y;
      const distSq = (dx * dx) + (dy * dy);
      if (distSq <= 1 || distSq > radiusSq) continue;

      const dist = Math.sqrt(distSq);
      const pull = (1 - (dist / radius)) * strength * 60 * dt;
      const swirl = item.orbitPhase + item.age * 3.2;
      item.x += ((dx / dist) * pull) + (Math.cos(swirl) * 0.85);
      item.y += ((dy / dist) * pull) + (Math.sin(swirl) * 0.85);
    }
  }
}
