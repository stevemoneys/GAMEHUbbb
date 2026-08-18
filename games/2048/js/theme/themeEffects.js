function getProgressiveTier(value) {
  if (value >= 2048) {
    return 1;
  }

  if (value >= 512) {
    return 0.7;
  }

  if (value >= 128) {
    return 0.45;
  }

  return 0.26;
}

function applyTransientClass(element, className, duration) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  window.setTimeout(() => {
    element.classList.remove(className);
  }, duration);
}

function createScorePopup(tileEl, value) {
  const popup = document.createElement("div");
  const rect = tileEl.getBoundingClientRect();
  popup.className = "score-popup";
  popup.textContent = `+${value}`;
  popup.style.left = `${rect.left + rect.width / 2}px`;
  popup.style.top = `${rect.top}px`;
  document.body.append(popup);

  window.requestAnimationFrame(() => {
    popup.classList.add("is-visible");
  });

  window.setTimeout(() => {
    popup.remove();
  }, 620);
}

function applyMicroShake(tileEl) {
  tileEl.animate(
    [
      { transform: "translate3d(0px, 0px, 0px)" },
      { transform: "translate3d(2px, -2px, 0px)" },
      { transform: "translate3d(-2px, 2px, 0px)" },
      { transform: "translate3d(0px, 0px, 0px)" }
    ],
    {
      duration: 120,
      easing: "ease-out"
    }
  );
}

function createMergeBurst(tileEl, value, profile) {
  const rect = tileEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const intensity = Math.max(1, Math.log2(Math.max(2, value))) * profile.intensity;
  const hue = Math.round((34 + Math.log2(Math.max(2, value)) * 9) % 360);
  const haloSize = Math.round(rect.width * (1.15 + Math.min(0.65, intensity * 0.03)));
  const sparkCount = profile.explosion ? 6 : 4;

  const halo = document.createElement("div");
  halo.className = "merge-halo";
  halo.style.left = `${centerX}px`;
  halo.style.top = `${centerY}px`;
  halo.style.width = `${haloSize}px`;
  halo.style.height = `${haloSize}px`;
  halo.style.setProperty("--merge-hue", String(hue));
  halo.style.setProperty("--merge-strength", Math.min(1.5, 0.8 + intensity * 0.035).toFixed(3));
  document.body.append(halo);

  for (let index = 0; index < sparkCount; index += 1) {
    const spark = document.createElement("div");
    const angle = (360 / sparkCount) * index + (profile.trail ? 12 : 0);
    const distance = Math.round(rect.width * (0.68 + intensity * 0.02));
    spark.className = "merge-spark";
    spark.style.left = `${centerX}px`;
    spark.style.top = `${centerY}px`;
    spark.style.setProperty("--spark-angle", `${angle}deg`);
    spark.style.setProperty("--spark-distance", `${-distance}px`);
    spark.style.setProperty("--spark-delay", `${index * 18}ms`);
    spark.style.setProperty("--merge-hue", String((hue + index * 9) % 360));
    document.body.append(spark);

    window.setTimeout(() => {
      spark.remove();
    }, 560 + index * 20);
  }

  window.setTimeout(() => {
    halo.remove();
  }, 620);
}

function applyMergeSlowMo(value, profile) {
  if (value < 128) {
    return;
  }

  const duration = Math.round(Math.max(80, 72 + Math.log2(value) * 4));
  const scale = Math.max(0.975, 0.988 - Math.min(0.012, profile.intensity * 0.004));
  document.body.style.transition = `transform ${duration}ms ease, filter ${duration}ms ease`;
  document.body.style.transform = `scale(${scale})`;
  document.body.style.filter = `saturate(${Math.min(1.16, 1 + profile.intensity * 0.08)})`;

  window.setTimeout(() => {
    document.body.style.transform = "scale(1)";
    document.body.style.filter = "";
  }, duration);
}

export function createThemeEffects({ getTheme }) {
  function getProfile(value = 0) {
    const theme = getTheme();
    const animation = theme.animationProfile || {};
    const intensity = theme.effectIntensity || {};
    const effects = theme.specialEffects || {};
    const tier = getProgressiveTier(value);

    return {
      speed: Number(animation.speed || 1),
      scale: Number(animation.scale || 1),
      easing: animation.easing || "cubic-bezier(0.2, 0.9, 0.2, 1)",
      intensity: Number(intensity.multiplier || 1),
      tier,
      glow: Boolean(effects.glow),
      trail: Boolean(effects.trail),
      explosion: Boolean(effects.explosion)
    };
  }

  function applyMergeEffect(tile, value) {
    if (!tile) {
      return;
    }

    const profile = getProfile(value);
    const intensity = Math.max(1, Math.log2(Math.max(2, value))) * profile.intensity;
    const outerGlow = Math.min(40, intensity * 5);
    const innerGlow = Math.min(72, intensity * 10);
    const baseShadow = tile.style.boxShadow;

    tile.classList.remove("tile-merge", "tile-glow");
    void tile.offsetWidth;
    tile.classList.add("tile-merge", "tile-glow");
    const glowShadow = `0 0 ${outerGlow}px rgba(255, 200, 0, 0.6), 0 0 ${innerGlow}px rgba(255, 120, 0, 0.4)`;
    tile.style.boxShadow = baseShadow ? `${baseShadow}, ${glowShadow}` : glowShadow;

    createScorePopup(tile, value);
    createMergeBurst(tile, value, profile);
    applyMicroShake(tile);
    applyMergeSlowMo(value, profile);

    tile.classList.toggle("fx-explosion-enabled", profile.explosion);
    applyTransientClass(tile, "fx-merge", 200);

    window.setTimeout(() => {
      tile.classList.remove("tile-merge", "tile-glow");
      tile.style.boxShadow = baseShadow;
    }, 180);
  }

  function applyMoveEffect(tile, value = 0) {
    if (!tile) {
      return;
    }

    const profile = getProfile(value);
    const duration = Math.round((190 + profile.tier * 80) * profile.speed);

    tile.style.setProperty("--fx-duration", `${duration}ms`);
    tile.style.setProperty("--fx-easing", profile.easing);
    tile.style.setProperty("--fx-shift", `${Math.round(12 + profile.tier * 14)}px`);
    tile.classList.toggle("fx-trail-enabled", profile.trail);
    applyTransientClass(tile, "fx-move", duration + 20);
  }

  function applySpawnEffect(tile, value) {
    if (!tile) {
      return;
    }

    const profile = getProfile(value);
    const duration = Math.round((170 + profile.tier * 100) * profile.speed);
    const boost = profile.intensity * (0.7 + profile.tier);
    const scale = 1 + 0.05 * boost * profile.scale;

    tile.style.setProperty("--fx-duration", `${duration}ms`);
    tile.style.setProperty("--fx-scale", scale.toFixed(3));
    tile.style.setProperty("--fx-easing", profile.easing);
    tile.style.setProperty("--fx-glow", `${Math.round(10 + boost * 8)}px`);
    tile.classList.toggle("fx-glow-enabled", profile.glow);
    applyTransientClass(tile, "fx-spawn", duration + 18);
  }

  function applyComboEffect(level, targetElement) {
    if (!targetElement) {
      return;
    }

    const profile = getProfile(level * 256);
    const duration = Math.round((430 + Math.min(4, level) * 120) * profile.speed);
    const boost = profile.intensity * (0.85 + Math.min(4, level) * 0.2);
    const scale = 1 + 0.07 * boost * profile.scale;

    targetElement.style.setProperty("--combo-duration", `${duration}ms`);
    targetElement.style.setProperty("--combo-scale", scale.toFixed(3));
    targetElement.style.setProperty("--combo-glow", `${Math.round(20 + boost * 10)}px`);
    targetElement.classList.toggle("fx-trail-enabled", profile.trail);
    targetElement.classList.toggle("fx-glow-enabled", profile.glow);
    applyTransientClass(targetElement, "fx-combo", duration + 24);
  }

  return {
    applyMergeEffect,
    applyMoveEffect,
    applySpawnEffect,
    applyComboEffect
  };
}
