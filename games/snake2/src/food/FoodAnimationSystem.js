export class FoodAnimationSystem {
  update(items, dt) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      item.age += dt;
      if (item.life > 0) item.life = Math.max(0, item.life - dt);
      item.rotation += dt * (0.8 + ((i % 3) * 0.22));
      item.phase += dt * (1.4 + ((i % 4) * 0.15));
      item.orbitPhase += dt * (1.8 + ((i % 2) * 0.24));
    }
  }
}
