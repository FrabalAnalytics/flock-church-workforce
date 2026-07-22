const CACHE_NAME = "flock-shell-v1";
const OFFLINE_PAGE = "/offline.html";
const SHELL_ASSETS = [OFFLINE_PAGE, "/icon.png", "/apple-icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Authenticated pages and API responses are deliberately never cached.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match(OFFLINE_PAGE)) || Response.error(),
      ),
    );
    return;
  }

  // Only immutable application code and public brand assets are cached.
  const cacheable = url.pathname.startsWith("/_next/static/")
    || SHELL_ASSETS.includes(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
