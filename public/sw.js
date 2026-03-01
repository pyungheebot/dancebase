const CACHE_NAME = "groop-v2";
const OFFLINE_URL = "/offline";
const NETWORK_TIMEOUT = 3000;
const MAX_CACHE_ENTRIES = 100;

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.svg",
];

// 오래된 캐시 항목을 정리하여 최대 maxEntries개 유지
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

// 네트워크 요청에 타임아웃을 적용하는 헬퍼
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Network timeout")), timeoutMs);
    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener("fetch", (event) => {
  // GET 요청만 처리
  if (event.request.method !== "GET") return;

  // http(s) 이외 요청 제외
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http")) return;

  // Supabase API 요청 제외 (인증 토큰, 세션 데이터)
  if (url.hostname.includes("supabase.co")) return;
  // Next.js API 라우트 제외
  if (url.pathname.startsWith("/api/")) return;

  // 네비게이션 요청: 타임아웃 3초 후 캐시 폴백
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              trimCache(CACHE_NAME, MAX_CACHE_ENTRIES).catch(() => {});
            }).catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 그 외 요청: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 동일 출처의 성공 응답만 캐시
        if (response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
            trimCache(CACHE_NAME, MAX_CACHE_ENTRIES).catch(() => {});
          }).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response("", { status: 503 });
        })
      )
  );
});
