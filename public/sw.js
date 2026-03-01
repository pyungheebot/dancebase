// ===== 캐시 버킷 정의 =====
const CACHE_VERSION = "v1";
const BUCKETS = {
  static: `static-${CACHE_VERSION}`,   // JS, CSS, 폰트 - cache-first
  images: `images-${CACHE_VERSION}`,   // 이미지 파일 - cache-first
  api:    `api-${CACHE_VERSION}`,      // Supabase API - network-first
  pages:  `pages-${CACHE_VERSION}`,    // HTML 네비게이션 - network-first
};

// 알려진 모든 버킷 이름 (캐시 정리 시 유지 대상)
const KNOWN_BUCKETS = new Set(Object.values(BUCKETS));

// 버킷별 최대 항목 수
const MAX_ENTRIES = {
  static: 300,
  images: 200,
  api:    50,
  pages:  20,
};

// 타임아웃 (ms)
const TIMEOUT = {
  api:   5000,
  pages: 3000,
};

// 오프라인 폴백 / 프리캐시 URL
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.svg",
];

// ===== 개발 환경 감지 =====
function isDev() {
  return self.location.hostname === "localhost" ||
         self.location.hostname === "127.0.0.1";
}

// ===== 유틸: 오래된 항목 FIFO 정리 =====
async function trimCache(bucketName, maxEntries) {
  try {
    const cache = await caches.open(bucketName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(toDelete.map((k) => cache.delete(k)));
    }
  } catch (_) {
    // 캐시 정리 실패는 무시
  }
}

// ===== 유틸: 타임아웃이 있는 fetch =====
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Network timeout")),
      timeoutMs
    );
    fetch(request)
      .then((res) => { clearTimeout(timer); resolve(res); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// ===== 요청 분류 함수 =====
// 반환값: { strategy, bucket } | null (처리 불필요)
function classifyRequest(request) {
  const url = new URL(request.url);

  // GET 요청만 처리
  if (request.method !== "GET") return null;

  // http(s) 이외 제외
  if (!url.protocol.startsWith("http")) return null;

  // Next.js API 라우트 제외 (SSR 동적 처리)
  if (url.pathname.startsWith("/api/")) return null;

  // Supabase API - network-first (인증 토큰 포함 가능)
  if (url.hostname.includes("supabase")) {
    return { strategy: "network-first", bucket: BUCKETS.api };
  }

  // 정적 리소스 (/_next/static/) - cache-first (빌드 해시로 버전 관리됨)
  if (url.pathname.startsWith("/_next/static/")) {
    return { strategy: "cache-first", bucket: BUCKETS.static };
  }

  // 이미지: destination === 'image' 또는 /icons/, .svg, .png, .webp, .jpg
  if (
    request.destination === "image" ||
    url.pathname.startsWith("/icons/") ||
    /\.(svg|png|webp|jpg|jpeg|gif|ico)$/i.test(url.pathname)
  ) {
    return { strategy: "cache-first-ttl", bucket: BUCKETS.images };
  }

  // 네비게이션 (HTML 페이지)
  if (request.mode === "navigate") {
    return { strategy: "network-first-navigate", bucket: BUCKETS.pages };
  }

  // 그 외 동일 출처 요청 - network-first
  if (url.hostname === self.location.hostname) {
    return { strategy: "network-first", bucket: BUCKETS.api };
  }

  return null;
}

// ===== 캐시-First 전략 =====
async function cacheFirst(request, bucket, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.status === 200) {
    const cache = await caches.open(bucket);
    cache.put(request, response.clone()).catch(() => {});
    trimCache(bucket, maxEntries);
  }
  return response;
}

// ===== 캐시-First + TTL (이미지, 1주일) =====
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

async function cacheFirstWithTTL(request, bucket, maxEntries) {
  const cached = await caches.match(request);
  if (cached) {
    const cachedDate = cached.headers.get("sw-cached-at");
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate, 10);
      if (age < IMAGE_TTL_MS) return cached;
      // 만료된 경우 - 캐시 삭제 후 네트워크에서 재요청
      const cache = await caches.open(bucket);
      cache.delete(request).catch(() => {});
    } else {
      // sw-cached-at 헤더가 없는 구형 캐시는 그대로 반환
      return cached;
    }
  }

  const response = await fetch(request);
  if (response.status === 200) {
    // sw-cached-at 헤더를 추가한 새 Response로 저장
    const headers = new Headers(response.headers);
    headers.set("sw-cached-at", String(Date.now()));
    const bodyBlob = await response.clone().blob();
    const timestampedResponse = new Response(bodyBlob, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    const cache = await caches.open(bucket);
    cache.put(request, timestampedResponse).catch(() => {});
    trimCache(bucket, maxEntries);
  }
  return response;
}

// ===== Network-First 전략 (일반) =====
async function networkFirst(request, bucket, maxEntries, timeoutMs) {
  try {
    const response = await (timeoutMs
      ? fetchWithTimeout(request, timeoutMs)
      : fetch(request));

    if (response.status === 200) {
      const cache = await caches.open(bucket);
      cache.put(request, response.clone()).catch(() => {});
      trimCache(bucket, maxEntries);
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("", { status: 503 });
  }
}

// ===== Network-First 전략 (네비게이션 - 오프라인 폴백 포함) =====
async function networkFirstNavigate(request, bucket, maxEntries) {
  try {
    const response = await fetchWithTimeout(request, TIMEOUT.pages);
    if (response.status === 200) {
      const cache = await caches.open(bucket);
      cache.put(request, response.clone()).catch(() => {});
      trimCache(bucket, maxEntries);
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response("Offline", { status: 503 });
  }
}

// ===== Install: 프리캐시 =====
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(BUCKETS.pages)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ===== Activate: 구버전 캐시 삭제 =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_BUCKETS.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

// ===== Fetch: 전략 라우팅 =====
self.addEventListener("fetch", (event) => {
  // 개발 환경에서는 캐시 비활성화
  if (isDev()) return;

  const classified = classifyRequest(event.request);
  if (!classified) return;

  const { strategy, bucket } = classified;

  switch (strategy) {
    case "cache-first":
      event.respondWith(
        cacheFirst(event.request, bucket, MAX_ENTRIES.static)
      );
      break;

    case "cache-first-ttl":
      event.respondWith(
        cacheFirstWithTTL(event.request, bucket, MAX_ENTRIES.images)
      );
      break;

    case "network-first-navigate":
      event.respondWith(
        networkFirstNavigate(event.request, bucket, MAX_ENTRIES.pages)
      );
      break;

    case "network-first":
    default: {
      const timeoutMs = bucket === BUCKETS.api ? TIMEOUT.api : undefined;
      event.respondWith(
        networkFirst(event.request, bucket, MAX_ENTRIES.api, timeoutMs)
      );
      break;
    }
  }
});
