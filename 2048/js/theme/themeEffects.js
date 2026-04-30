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

function applyMergeSlowMo(value) {
  if (value < 128) {
    return;
  }

  document.body.style.transition = "transform 80ms ease";
  document.body.style.transform = "scale(0.98)";

  window.setTimeout(() => {
    document.body.style.transform = "scale(1)";
  }, 80);
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
    applyMicroShake(tile);
    applyMergeSlowMo(value);

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
