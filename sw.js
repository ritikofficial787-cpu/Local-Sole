/* ==========================================================================
   Local Sole — service worker
   Network-first for pages and catalogue data, cache-first for static assets.
   Bump CACHE_VERSION whenever the shell changes.
   ========================================================================== */

const CACHE_VERSION = "v2";
const CORE_CACHE = `local-sole-core-${CACHE_VERSION}`;
const RUNTIME_CACHE = `local-sole-runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./products.html",
  "./product.html",
  "./shops.html",
  "./shop.html",
  "./cart.html",
  "./checkout.html",
  "./order-confirmation.html",
  "./wishlist.html",
  "./account.html",
  "./contact.html",
  "./owner.html",
  "./404.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/fonts.css",
  "./css/components.css",
  "./css/pages.css",
  "./css/animations.css",
  "./js/data.js",
  "./js/ui.js",
  "./js/cart.js",
  "./js/search.js",
  "./js/filters.js",
  "./js/product.js",
  "./js/shops.js",
  "./js/home.js",
  "./js/animations.js",
  "./js/app.js",
  "./js/checkout.js",
  "./js/wishlist.js",
  "./js/account.js",
  "./js/contact.js",
  "./js/owner.js",
  "./js/compare.js",
  "./data/products.json",
  "./data/shops.json",
  "./data/seed.js",
  "./assets/fonts/instrument-serif-400.woff2",
  "./assets/fonts/instrument-serif-400-italic.woff2",
  "./assets/fonts/manrope-200800.woff2",
  "./assets/images/icons/favicon.svg",
  "./assets/images/icons/icon-192.png",
  "./assets/images/icons/icon-512.png",
  "./assets/images/icons/apple-touch-icon.png",
  "./assets/images/icons/placeholder.svg",
  "./assets/images/banners/hero-1.jpg",
  "./assets/images/banners/hero-2.jpg",
  "./assets/images/banners/hero-3.jpg",
  "./assets/images/banners/promo-1.jpg",
  "./assets/images/banners/craft.jpg",
  "./assets/images/shops/store-1.jpg",
  "./assets/images/shops/store-2.jpg",
  "./assets/images/shops/store-3.jpg",
  "./assets/images/shops/store-4.jpg",
  "./assets/images/shops/store-5.jpg",
  "./assets/images/shops/store-6.jpg",
  "./assets/images/shoes/triple-white.jpg",
  "./assets/images/shoes/coral-runner.jpg",
  "./assets/images/shoes/red-racer.jpg",
  "./assets/images/shoes/tan-desert-boot.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((error) => {
        // A single missing optional asset should not block the worker.
        console.warn("Local Sole: some shell assets were not cached", error);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CORE_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isCatalogueRequest(url) {
  return url.pathname.includes("/data/");
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    })
    .catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        return (await caches.match("./index.html")) || Response.error();
      }
      return Response.error();
    });
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    });
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;
  if (request.headers.get("range")) return;

  if (request.mode === "navigate" || isCatalogueRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  const destination = request.destination;
  if (["style", "script", "font", "image"].includes(destination)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
