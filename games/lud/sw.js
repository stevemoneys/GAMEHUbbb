const CACHE_VERSION = "2026-08-28-v47";
const STATIC_CACHE = `ludo-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ludo-runtime-${CACHE_VERSION}`;
const PRELOAD_CACHE = "ludo-preload-assets-v1";
const OWN_CACHE_PREFIX = "ludo-";
// Keep the safety timeout conservative.  It only bounds the network request;
// cache writes never inherit this signal.
const NETWORK_TIMEOUT_MS = 15000;
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

function unsignaledCacheRequest(request) {
  // Cache.put/Cache.match must never receive the AbortSignal used to bound a
  // network request.  Rebuilding the key also avoids carrying a request that
  // may have been aborted by the browser or a closing client.
  return new Request(request.url, {
    method: "GET",
    headers: request.headers,
    credentials: request.credentials,
    mode: "same-origin",
    redirect: request.redirect
  });
}

async function matchCached(request) {
  try {
    const key = typeof request === "string"
      ? new Request(request, { method: "GET" })
      : unsignaledCacheRequest(request);
    return await caches.match(key);
  } catch (error) {
    console.warn("[sw] cache lookup skipped:", error);
    return undefined;
  }
}

async function updateRuntimeCache(runtime, request, response) {
  // Cache only complete, successful same-origin responses.  In particular,
  // media range requests (206) and opaque/error responses are not valid asset
  // snapshots for the runtime cache.
  if (!runtime || !response || !response.ok || response.status !== 200 || response.type === "opaque") return;
  try {
    await runtime.put(unsignaledCacheRequest(request), response);
  } catch (error) {
    // Cache Storage is optional.  A failed/aborted write must never turn a
    // valid network response into a failed FetchEvent.
    console.warn("[sw] runtime cache update skipped:", request.url, error);
  }
}

async function offlineFallback(request, originalError) {
  const cached = await matchCached(request);
  if (cached) return cached;

  if (request.mode === "navigate") {
    const appShell = await matchCached("./ludo.html");
    if (appShell) return appShell;
  }

  // Keep the FetchEvent resolved even when neither network nor cache is
  // available.  The status remains a clear, graceful failure for the caller.
  const status = request.mode === "navigate" ? 503 : 504;
  const message = request.mode === "navigate"
    ? "The game is unavailable offline."
    : "Resource unavailable offline.";
  if (originalError) console.warn("[sw] network request failed:", request.url, originalError);
  return new Response(message, {
    status,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

async function networkFirst(request, event) {
  // Storage may be unavailable (quota/private mode).  That must not prevent
  // an online resource from being delivered.
  let runtime = null;
  try {
    runtime = await caches.open(RUNTIME_CACHE);
  } catch (error) {
    console.warn("[sw] runtime cache unavailable:", error);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  let fresh;

  try {
    // Revalidate mutable files so unchanged filenames still receive deploys.
    fresh = await fetch(request, { cache: "no-cache", signal: controller.signal });
  } catch (error) {
    clearTimeout(timeout);
    return offlineFallback(request, error);
  }

  // The timer is only for fetch.  Clear it before touching Cache Storage so a
  // late abort can never cancel a cache write.
  clearTimeout(timeout);

  if (fresh && fresh.ok && runtime) {
    try {
      const cacheUpdate = updateRuntimeCache(runtime, request, fresh.clone());
      // Keep cache maintenance independent from the response promise.  Any
      // Cache.put failure is already contained by updateRuntimeCache().
      if (event && typeof event.waitUntil === "function") {
        event.waitUntil(cacheUpdate);
      } else {
        await cacheUpdate;
      }
    } catch (error) {
      // Cloning/setup can also fail (for example if a response was disturbed),
      // and must be isolated from the successful network response.
      console.warn("[sw] runtime cache update skipped:", request.url, error);
    }
  }

  // HTTP errors are returned as-is and are never written to Cache Storage.
  return fresh;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (!isSameOriginStaticAsset(request)) return;

  // Every same-origin application resource is mutable in this project:
  // backgrounds, audio, CSS, JS, and HTML retain stable filenames between
  // deployments. Network-first gives updates priority and cached fallback
  // keeps the game usable offline. Optional assets still remain runtime-only.
  event.respondWith(networkFirst(request, event));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
