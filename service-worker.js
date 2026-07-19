const CACHE_NAME = "super-important-tasks-shell-v12";
const SUPABASE_SDK_URL = "https://unpkg.com/@supabase/supabase-js@2.110.5/dist/umd/supabase.js";
const APP_SHELL = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.webmanifest",
  "./logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL);
        await cache.add(SUPABASE_SDK_URL).catch(() => {});
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isAppAsset = requestUrl.origin === self.location.origin;
  const isSupabaseSdk = requestUrl.href === SUPABASE_SDK_URL;
  if (!isAppAsset && !isSupabaseSdk) return;

  // Cache deployment config and the CDN SDK after a successful online load so
  // the installed app can reopen offline. A fresh network response still wins.
  if (requestUrl.pathname.endsWith("/config.js") || isSupabaseSdk) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(
        (cached) => cached || caches.match("./index.html")
      ))
  );
});
