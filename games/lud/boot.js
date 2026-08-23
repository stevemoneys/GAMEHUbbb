const PRELOAD_CACHE_NAME = "ludo-preload-assets-v1";
const PRELOAD_VERSION = "2026-08-21-v32";
const PRELOAD_VERSION_KEY = "ludo_preload_manifest_version";
const PRELOAD_UPDATED_AT_KEY = "ludo_preload_updated_at";
const MAX_CONCURRENCY = 6;

const overlayEl = document.getElementById("boot-overlay");
const progressBarEl = document.getElementById("boot-progress-bar");
const progressTextEl = document.getElementById("boot-progress-text");
const progressValueEl = document.getElementById("boot-progress-value");
const progressDetailEl = document.getElementById("boot-progress-detail");

function getColors() {
  return ["red", "green", "yellow", "blue"];
}

function getDiceFaces() {
  return ["1_result.webp", "2_result.webp", "3_result.webp", "4_result.webp", "5_result.webp", "6_result.webp"];
}

function getDiceSkinIds() {
  return Array.from({ length: 20 }, (_, i) => i + 1);
}

function getTokenSkinIds() {
  return Array.from({ length: 10 }, (_, i) => i + 1);
}

function buildAssetManifest() {
  const assets = new Set([
    "./index.html",
    "./vs-computer.html",
    "./level-select.html",
    "./ludo.html",
    "./dice-shop.html",
    "./token-shop.html",
    "./home.css",
    "./vs-computer.css",
    "./level-select.css",
    "./design-tokens.css",
    "./ludo.css",
    "./dice-shop.css",
    "./token-shop.css",
    "./ai.js",
    "./board.js",
    "./movement.js",
    "./game.js",
    "./sw.js",
    "./sounds/step.wav",
    "./sounds/entry.mp3",
    "./sounds/goal.mp3",
    "./sounds/win.mp3",
    "./sounds/bgm.mp3",
    "./bgm.mp3"
  ]);

  for (let i = 1; i <= 20; i++) {
    assets.add(`./backgrounds/bg${i}_result.webp`);
  }

  getDiceFaces().forEach(face => {
    assets.add(`./dice/${face}`);
  });

  getColors().forEach(color => {
    assets.add(`./tokens/${color}_result.webp`);
  });

  getDiceSkinIds().forEach(skinId => {
    getDiceFaces().forEach(face => {
      assets.add(`./dice/skins/skin${skinId}/${face}`);
    });
  });

  getTokenSkinIds().forEach(skinId => {
    getColors().forEach(color => {
      assets.add(`./tokens/skins/skin${skinId}/${color}_result.webp`);
    });
  });

  return Array.from(assets);
}

function shortAssetLabel(path) {
  return path.replace(/^\.\//, "");
}

function updateProgress(done, total, text, detail) {
  const safeTotal = Math.max(1, total);
  const percent = Math.min(100, Math.round((done / safeTotal) * 100));
  if (progressBarEl) progressBarEl.style.width = `${percent}%`;
  if (progressTextEl && text) progressTextEl.textContent = text;
  if (progressValueEl) progressValueEl.textContent = `${percent}%`;
  if (progressDetailEl && detail) progressDetailEl.textContent = detail;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          installing.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  } catch (error) {
    console.warn("Service worker registration failed.", error);
  }
}

async function openPreloadCache() {
  if (!("caches" in window)) return null;
  try {
    return await caches.open(PRELOAD_CACHE_NAME);
  } catch {
    return null;
  }
}

async function resetPreloadCacheIfVersionChanged() {
  const existing = localStorage.getItem(PRELOAD_VERSION_KEY);
  if (existing === PRELOAD_VERSION) return;
  if (!("caches" in window)) return;
  try {
    await caches.delete(PRELOAD_CACHE_NAME);
  } catch {
    // ignore cache deletion failures
  }
}

async function warmSingleAsset(assetPath, cache) {
  const request = new Request(assetPath, { method: "GET", credentials: "same-origin" });
  if (cache) {
    const cached = await cache.match(request);
    if (cached) return;
  }

  const response = await fetch(request, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${assetPath}`);
  }

  if (cache) {
    try {
      await cache.put(request, response.clone());
    } catch {
      // ignore put failures so boot never hard-fails
    }
  }
}

async function preloadManifest(manifest, cache) {
  let done = 0;
  let failed = 0;
  const total = manifest.length;
  const queue = manifest.slice();

  updateProgress(0, total, "Loading...", "Preparing assets...");

  const workerCount = Math.min(MAX_CONCURRENCY, total);
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const nextAsset = queue.shift();
      if (!nextAsset) break;
      try {
        await warmSingleAsset(nextAsset, cache);
      } catch (error) {
        failed += 1;
        console.warn("Asset preload failed:", nextAsset, error);
      } finally {
        done += 1;
        updateProgress(done, total, "Loading...", `Caching ${shortAssetLabel(nextAsset)} (${done}/${total})`);
      }
    }
  });

  await Promise.all(workers);
  return { done, failed, total };
}

function hideOverlay() {
  if (!overlayEl) return;
  overlayEl.classList.add("boot-hidden");
  setTimeout(() => {
    overlayEl.remove();
  }, 420);
}

async function bootGame() {
  if (!overlayEl) {
    await import("./game.js");
    return;
  }

  const isCachedVersion = localStorage.getItem(PRELOAD_VERSION_KEY) === PRELOAD_VERSION;
  updateProgress(0, 1, "Loading...", isCachedVersion ? "Syncing cached assets..." : "First launch cache setup...");

  void registerServiceWorker();
  await resetPreloadCacheIfVersionChanged();
  const preloadCache = await openPreloadCache();
  const manifest = buildAssetManifest();
  const result = await preloadManifest(manifest, preloadCache);

  localStorage.setItem(PRELOAD_VERSION_KEY, PRELOAD_VERSION);
  localStorage.setItem(PRELOAD_UPDATED_AT_KEY, String(Date.now()));

  if (result.failed > 0) {
    updateProgress(result.total - result.failed, result.total, "Loading...", `Loaded with ${result.failed} recoverable asset misses.`);
  } else {
    updateProgress(result.total, result.total, "Loading...", "All game assets are ready.");
  }

  updateProgress(result.total, result.total, "Starting...", "Launching match...");
  await import("./game.js");
  hideOverlay();
}

bootGame().catch(error => {
  console.error("Boot failed:", error);
  updateProgress(1, 1, "Load failed", "Tap to retry.");
  if (!overlayEl) return;
  overlayEl.addEventListener("click", () => {
    window.location.reload();
  }, { once: true });
});
