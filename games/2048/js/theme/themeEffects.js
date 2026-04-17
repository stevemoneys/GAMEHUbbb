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
    const duration = Math.round((220 + profile.tier * 140) * profile.speed);
    const boost = profile.intensity * (0.8 + profile.tier);
    const scale = 1 + 0.06 * boost * profile.scale;
    const glowPx = Math.round(8 + 20 * boost);

    tile.style.setProperty("--fx-duration", `${duration}ms`);
    tile.style.setProperty("--fx-scale", scale.toFixed(3));
    tile.style.setProperty("--fx-glow", `${glowPx}px`);
    tile.style.setProperty("--fx-easing", profile.easing);
    tile.classList.toggle("fx-glow-enabled", profile.glow);
    tile.classList.toggle("fx-explosion-enabled", profile.explosion);
    applyTransientClass(tile, "fx-merge", duration + 24);
  }

  function applyMoveEffect(tile, value = 0) {
    if (!tile) {
      return;
    }

    const profile = getProfile(value);
    const duration = Math.round((190 + profile.tier * 80) * profile.speed);

    tile.style.setProperty("--fx-duration", `${duration}ms`);
    tile.style.setProperty("--fx-easing", profile.easing);
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
