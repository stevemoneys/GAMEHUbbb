"use strict";

(function (global) {
  const app = global.SnakeApp;
  const SnakeEngine = global.SnakeEngine;
  const phase7 = global.SnakePhase7;
  if (!app || !SnakeEngine || !phase7) return;

  const MOBILE_QUERY = "(pointer: coarse), (max-width: 900px)";

  function isMobileLike() {
    return !!(global.matchMedia && global.matchMedia(MOBILE_QUERY).matches) || (navigator.maxTouchPoints || 0) > 0;
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  }

  function requestFullscreenFor(elem) {
    if (!elem) return Promise.resolve();
    if (elem.requestFullscreen) return elem.requestFullscreen();
    if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
    if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
    return Promise.resolve();
  }

  function exitFullscreenSafe() {
    if (document.exitFullscreen) return document.exitFullscreen().catch(() => {});
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
    return Promise.resolve();
  }

  app.cacheDom = ((original) => function () {
    original.call(this);
    Object.assign(this.dom, {
      gameContainer: document.getElementById("gameContainer"),
      gameCanvas: document.getElementById("gameCanvas"),
      minimapCanvas: document.getElementById("minimapCanvas"),
      touchDragHint: document.getElementById("touchDragHint"),
      orientationWarning: document.getElementById("orientationWarning")
    });
  })(app.cacheDom);

  app.applyImmersiveMode = function (active) {
    document.body.classList.toggle("game-immersive", !!active);
    if (active) global.scrollTo(0, 1);
  };

  app.tryLockLandscape = async function () {
    try {
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch (_) {}
  };

  app.requestGameFullscreen = async function () {
    this.applyImmersiveMode(true);
    if (isMobileLike() && !fullscreenElement()) {
      await requestFullscreenFor(document.documentElement).catch(() => {});
    }
    await this.tryLockLandscape();
    global.scrollTo(0, 1);
  };

  app.syncOrientationState = function () {
    const portrait = global.matchMedia && global.matchMedia("(orientation: portrait)").matches;
    const gameActive = this.screens?.game?.classList.contains("active");
    const shouldWarn = !!(isMobileLike() && gameActive && portrait);
    this.dom.orientationWarning?.classList.toggle("show", shouldWarn);
    this.dom.orientationWarning?.setAttribute("aria-hidden", shouldWarn ? "false" : "true");

    if (shouldWarn) {
      this.applyImmersiveMode(true);
      if (this.engine?.running && !this.engine.paused && !this.dom.gameEndOverlay.classList.contains("show")) {
        this.phase8PausedForOrientation = true;
        this.engine.togglePause();
      }
    } else if (this.phase8PausedForOrientation && this.engine?.paused && gameActive) {
      this.phase8PausedForOrientation = false;
      this.engine.togglePause();
    }

    if (gameActive && this.engine?.setCanvasResolution) {
      this.engine.setCanvasResolution();
      this.engine.render?.(performance.now());
    }
  };

  app.bindUi = ((original) => function () {
    original.call(this);
    if (this.phase8UiBound) return;
    this.phase8UiBound = true;

    const handleOrientation = () => this.syncOrientationState();
    global.addEventListener("resize", handleOrientation);
    global.addEventListener("orientationchange", handleOrientation);
    document.addEventListener("fullscreenchange", handleOrientation);
    document.addEventListener("webkitfullscreenchange", handleOrientation);
    this.syncOrientationState();

    if (this.dom.startLevelBtn) {
      this.dom.startLevelBtn.addEventListener("click", () => {
        this.requestGameFullscreen();
      }, true);
    }
    this.dom.modeCards?.forEach((card) => card.addEventListener("click", () => {
      this.requestGameFullscreen();
    }, true));

    const surface = this.screens?.game;
    const canvas = this.dom.gameCanvas;
    if (surface && canvas) {
      let anchor = null;
      const isInteractiveTarget = (target) => !!target?.closest?.("button, input, label, [role='button']");
      surface.style.touchAction = "none";

      const applyVector = (dx, dy) => {
        if (!this.engine?.queueDirection) return;
        if (Math.hypot(dx, dy) < 6) return;
        const dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? "right" : "left")
          : (dy > 0 ? "down" : "up");
        this.handleAudioUnlock?.();
        this.wakeGameplayHud?.(1400);
        this.engine.queueDirection(dir);
      };

      const steerTowardPoint = (clientX, clientY) => {
        const rect = surface.getBoundingClientRect();
        const dx = clientX - (rect.left + rect.width * 0.5);
        const dy = clientY - (rect.top + rect.height * 0.5);
        applyVector(dx, dy);
      };

      surface.addEventListener("touchstart", (event) => {
        if (!event.touches[0]) return;
        if (isInteractiveTarget(event.target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.wakeGameplayHud?.(1400);
        steerTowardPoint(event.touches[0].clientX, event.touches[0].clientY);
        anchor = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      }, { passive: false, capture: true });

      surface.addEventListener("touchmove", (event) => {
        if (!anchor || !event.touches[0]) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const point = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
        applyVector(point.x - anchor.x, point.y - anchor.y);
        anchor = point;
      }, { passive: false, capture: true });

      surface.addEventListener("touchend", (event) => {
        event.stopImmediatePropagation();
        anchor = null;
      }, { passive: true, capture: true });

      surface.addEventListener("touchcancel", () => {
        anchor = null;
      }, { passive: true, capture: true });

      surface.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        if (isInteractiveTarget(event.target)) return;
        steerTowardPoint(event.clientX, event.clientY);
        anchor = { x: event.clientX, y: event.clientY };
        this.wakeGameplayHud?.(1200);
      });

      surface.addEventListener("pointermove", (event) => {
        if (!anchor || event.pointerType !== "mouse" || event.buttons !== 1) return;
        applyVector(event.clientX - anchor.x, event.clientY - anchor.y);
        anchor = { x: event.clientX, y: event.clientY };
      });

      surface.addEventListener("pointerup", () => {
        anchor = null;
      });

      surface.addEventListener("pointercancel", () => {
        anchor = null;
      });

      surface.addEventListener("pointerleave", () => {
        anchor = null;
      });
    }
  })(app.bindUi);

  app.startGame = ((original) => function (config, returnScreen) {
    this.requestGameFullscreen();
    original.call(this, config, returnScreen);
    this.applyImmersiveMode(true);
    this.syncOrientationState();
  })(app.startGame);

  app.returnFromGame = ((original) => function () {
    original.call(this);
    this.phase8PausedForOrientation = false;
    this.applyImmersiveMode(false);
    exitFullscreenSafe();
  })(app.returnFromGame);

  const proto = SnakeEngine.prototype;

  proto.drawMinimap = function () {
    const canvas = app.dom?.minimapCanvas;
    if (!canvas || !this.state?.player?.segments?.length) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(5, 9, 20, 0.78)";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

    const sx = size / phase7.WORLD_WIDTH;
    const sy = size / phase7.WORLD_HEIGHT;

    ctx.fillStyle = "rgba(140, 200, 255, 0.22)";
    for (const wall of this.state.maze?.walls || []) {
      ctx.fillRect(wall.x * sx, wall.y * sy, Math.max(1, wall.w * sx), Math.max(1, wall.h * sy));
    }

    if (this.state.food) {
      ctx.fillStyle = "#ffe66e";
      ctx.beginPath();
      ctx.arc(this.state.food.x * sx, this.state.food.y * sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.state.powerCube) {
      ctx.fillStyle = "#ff8bd7";
      ctx.fillRect(this.state.powerCube.x * sx - 2, this.state.powerCube.y * sy - 2, 4, 4);
    }

    ctx.fillStyle = "#ff8a4c";
    for (const ai of this.state.aiSnakes || []) {
      const head = ai.segments?.[0];
      if (!head) continue;
      ctx.beginPath();
      ctx.arc(head.x * sx, head.y * sy, ai.crown ? 3.2 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const player = this.state.player.segments[0];
    ctx.fillStyle = "#00f3ff";
    ctx.beginPath();
    ctx.arc(player.x * sx, player.y * sy, 3.6, 0, Math.PI * 2);
    ctx.fill();
  };

  proto.drawOverlays = ((original) => function () {
    original.call(this);
    this.drawMinimap();
  })(proto.drawOverlays);
})(window);
