const CACHE_VERSION = "2026-08-28-v46";
const STATIC_CACHE = `ludo-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ludo-runtime-${CACHE_VERSION}`;
const PRELOAD_CACHE = "ludo-preload-assets-v1";
const OWN_CACHE_PREFIX = "ludo-";
const NETWORK_TIMEOUT_MS = 4500;
function getColors() {
  return ["red", "green", "yellow", "blue"];
}

function getDiceFaces() {
  return ["1_result.webp", "2_result.webp", "3_result.webp", "4_result.webp", "5_result.webp", "6_result.webp"];
}

function buildAssetManifest() {
  // Precache the shell and the default gameplay assets only. Active cosmetic
  // skins, extra backgrounds, and sounds are fetched on demand by boot/game
  // and kept in the runtime cache so install time stays short and reliable.
  return [
    "./index.html",
    "./vs-computer.html",
    "./level-select.html",
    "./ludo.html",
    "./design-tokens.css",
    "./dice-shop.html",
    "./token-shop.html",
    "./home.css",
    "./vs-computer.css",
    "./level-select.css",
    "./ludo.css",
    "./dice-shop.css",
    "./token-shop.css",
    "./ai.js",
    "./board.js",
    "./movement.js",
    "./boot.js",
    "./game.js",
    "./backgrounds/bg1_result.webp",
    ...getDiceFaces().map(face => `./dice/${face}`),
    ...getColors().map(color => `./tokens/${color}_result.webp`)
  ];
}

const PRECACHE_ASSETS = buildAssetManifest();

function isSameOriginStaticAsset(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  if (request.mode === "navigate") return true;
  if (url.pathname.endsWith("/")) return true;
  return /\.(?:css|js|mjs|html|webp|png|jpg|jpeg|svg|gif|mp3|wav|ogg)$/i.test(url.pathname);
}

async function addAssetsToCache(cacheName, assets) {
  const cache = await caches.open(cacheName);
  for (const asset of assets) {
    try {
      // Bypass the browser HTTP cache while building a new SW cache. Cache
      // versioning alone is insufficient when filenames stay unchanged.
      const request = new Request(asset, { cache: "reload" });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
    } catch (error) {
      // Continue caching other assets even when one fails.
      console.warn("[sw] precache failed:", asset, error);
    }
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await addAssetsToCache(STATIC_CACHE, PRECACHE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, RUNTIME_CACHE, PRELOAD_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      // Never delete caches owned by another application on this origin.
      if (!key.startsWith(OWN_CACHE_PREFIX) || keep.has(key)) return Promise.resolve();
      return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    // Revalidate mutable files so unchanged filenames still receive deploys.
    const fresh = await fetch(request, { cache: "no-cache", signal: controller.signal });
    if (fresh && fresh.ok) {
      await runtime.put(request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const appShell = await caches.match("./ludo.html");
      if (appShell) return appShell;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (!isSameOriginStaticAsset(request)) return;

  // Every same-origin application resource is mutable in this project:
  // backgrounds, audio, CSS, JS, and HTML retain stable filenames between
  // deployments. Network-first gives updates priority and cached fallback
  // keeps the game usable offline. Optional assets still remain runtime-only.
  event.respondWith(networkFirst(request));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
