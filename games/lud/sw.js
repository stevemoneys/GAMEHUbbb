const CACHE_VERSION = "2026-08-24-v37";
const STATIC_CACHE = `ludo-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ludo-runtime-${CACHE_VERSION}`;
// These paths are intentionally runtime-only. They must never delay entering
// a match; stale-while-revalidate makes them available after first use.
const OPTIONAL_ASSET_PREFIXES = [
  "/backgrounds/",
  "/dice/skins/",
  "/tokens/skins/",
  "/sounds/"
];

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

function isOptionalAsset(request) {
  const pathname = new URL(request.url).pathname;
  return OPTIONAL_ASSET_PREFIXES.some(prefix => pathname.includes(prefix));
}

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
      await cache.add(asset);
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
    const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      if (keep.has(key)) return Promise.resolve();
      return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      await runtime.put(request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const appShell = await caches.match("./ludo.html");
    if (appShell) return appShell;
    throw error;
  }
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const networkFetch = fetch(request).then(async fresh => {
    if (fresh && fresh.ok) {
      const runtime = await caches.open(RUNTIME_CACHE);
      await runtime.put(request, fresh.clone());
    }
    return fresh;
  }).catch(() => null);

  if (cached) {
    event.waitUntil(networkFetch);
    return cached;
  }

  const fresh = await networkFetch;
  if (fresh) return fresh;
  return new Response("", { status: 504, statusText: "Offline" });
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (!isSameOriginStaticAsset(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Critical shell assets are already in STATIC_CACHE. Optional skins,
  // backgrounds, and sounds deliberately use the runtime path below.
  if (isOptionalAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, event));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, event));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
