const CACHE_NAME = "groop-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(OFFLINE_URL);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip non-http(s) requests
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http")) return;

  // Skip Supabase API requests (auth tokens, session data)
  if (url.hostname.includes("supabase.co")) return;
  // Skip Next.js API routes
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful same-origin responses
        if (response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          }).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache first
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If it's a navigation request, show offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("", { status: 503 });
        });
      })
  );
});
