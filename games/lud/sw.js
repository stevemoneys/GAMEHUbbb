const CACHE_VERSION = "2026-08-24-v34";
const STATIC_CACHE = `ludo-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ludo-runtime-${CACHE_VERSION}`;

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

  event.respondWith(staleWhileRevalidate(request, event));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
