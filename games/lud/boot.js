const PRELOAD_CACHE_NAME = "ludo-preload-assets-v1";
const PRELOAD_VERSION = "2026-09-14-v48";
const PRELOAD_VERSION_KEY = "ludo_preload_manifest_version";
const PRELOAD_UPDATED_AT_KEY = "ludo_preload_updated_at";
const MAX_CONCURRENCY = 6;
const ARRIVAL_TRANSITION_KEY = "ludo_teleport_arrival_v1";

function readStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

let shouldPlayArrivalTransition = false;
try {
  shouldPlayArrivalTransition = sessionStorage.getItem(ARRIVAL_TRANSITION_KEY) === "1";
  if (shouldPlayArrivalTransition) sessionStorage.removeItem(ARRIVAL_TRANSITION_KEY);
} catch {
  shouldPlayArrivalTransition = false;
}

const overlayEl = document.getElementById("boot-overlay");

function getColors() {
  return ["red", "green", "yellow", "blue"];
}

function getDiceFaces() {
  return ["1_result.webp", "2_result.webp", "3_result.webp", "4_result.webp", "5_result.webp", "6_result.webp"];
}

function getGameplayConfig() {
  const params = new URLSearchParams(window.location.search);
  const colors = getColors();
  const requestedHuman = (params.get("human") || "red").toLowerCase();
  const human = colors.includes(requestedHuman) ? requestedHuman : "red";
  const playerCount = Math.min(4, Math.max(2, Number(params.get("players")) || 4));
  const humanIndex = colors.indexOf(human);
  const activeColors = playerCount === 2
    ? [human, colors[(humanIndex + 2) % colors.length]]
    : Array.from({ length: playerCount }, (_, index) => colors[(humanIndex + index) % colors.length]);
  return {
    activeColors,
    background: "./backgrounds/bg1_result.webp"
  };
}

function getSkinTokenAssets(skin, colors) {
  return colors.map(color => skin === "classic"
    ? `./tokens/${color}_result.webp`
    : `./tokens/skins/${skin}/${color}_result.webp`);
}

function buildAssetManifest(config = getGameplayConfig()) {
  // game.js and board.js are loaded by the module graph after this manifest
  // is ready. Keep the blocking set to artwork required for the first usable
  // board; selected cosmetic artwork already has a classic in-game fallback.
  const critical = new Set([
    config.background,
    ...getDiceFaces().map(face => `./dice/${face}`),
    ...getSkinTokenAssets("classic", config.activeColors)
  ]);

  return { critical: Array.from(critical) };
}

function shortAssetLabel(path) {
  return path.replace(/^\.\//, "");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    // Do not allow the browser HTTP cache to hide a newly deployed worker.
    const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
    await registration.update();
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
  const existing = readStoredValue(PRELOAD_VERSION_KEY);
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
  const cached = cache ? await cache.match(request) : null;
  // The manifest version invalidates this dedicated cache on deployments.
  // Reusing a warmed response avoids revalidating every critical image on
  // every match entry while preserving a fresh fetch after a version change.
  if (cached) return;
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to fetch ${assetPath}`);
    if (cache) {
      try { await cache.put(request, response.clone()); } catch { /* best effort */ }
    }
  } catch (error) {
    if (cached) return;
    throw error;
  }
}

async function preloadManifest(manifest, cache) {
  let done = 0;
  let failed = 0;
  const failures = [];
  const total = manifest.length;
  const queue = manifest.slice();

  const workerCount = Math.min(MAX_CONCURRENCY, total);
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const nextAsset = queue.shift();
      if (!nextAsset) break;
      try {
        await warmSingleAsset(nextAsset, cache);
      } catch (error) {
        failed += 1;
        failures.push(nextAsset);
        console.warn("Asset preload failed:", nextAsset, error);
      } finally {
        done += 1;
      }
    }
  });

  await Promise.all(workers);
  return { done, failed, total, failures };
}

function showCriticalFailure(failures = []) {
  if (!overlayEl) return;
  overlayEl.classList.remove("boot-hidden");
  overlayEl.innerHTML = `
    <div class="boot-failure" role="alert">
      <strong>Match assets unavailable</strong>
      <span>Try again to enter the board.</span>
      <button type="button" id="boot-retry-btn">Retry</button>
    </div>
  `;
  overlayEl.querySelector("#boot-retry-btn")?.addEventListener("click", () => window.location.reload(), { once: true });
  console.warn("Critical gameplay assets failed:", failures.map(failure => shortAssetLabel(String(failure))));
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
    if (shouldPlayArrivalTransition) document.body.classList.add("arrival-transition");
    await import("./game.js");
    if (shouldPlayArrivalTransition) {
      window.setTimeout(() => document.body.classList.remove("arrival-transition"), 1700);
    }
    return;
  }

  void registerServiceWorker();
  await resetPreloadCacheIfVersionChanged();
  const preloadCache = await openPreloadCache();
  const manifest = buildAssetManifest(getGameplayConfig());
  const result = await preloadManifest(manifest.critical, preloadCache);

  writeStoredValue(PRELOAD_VERSION_KEY, PRELOAD_VERSION);
  writeStoredValue(PRELOAD_UPDATED_AT_KEY, String(Date.now()));

  if (result.failed > 0) {
    showCriticalFailure(result.failures || []);
    return;
  }

  // The level-select portal has finished before navigation. Start the
  // gameplay arrival only after this session's critical assets are ready so
  // the board/HUD animation cannot be consumed behind the boot overlay.
  if (shouldPlayArrivalTransition) document.body.classList.add("arrival-transition");
  await import("./game.js");
  hideOverlay();
  if (shouldPlayArrivalTransition) {
    window.setTimeout(() => document.body.classList.remove("arrival-transition"), 1700);
  }
}

bootGame().catch(error => {
  console.error("Boot failed:", error);
  showCriticalFailure([error]);
});
