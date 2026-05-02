// ZAO OS Service Worker — offline support + caching
const CACHE_NAME = 'zaoos-v2';
const OFFLINE_URL = '/offline';

// Cap on cached page navigations + dynamically-cached assets so the SW
// cache can't grow unboundedly and trip the browser quota. Evicts oldest
// entries (insertion order ≈ LRU) once the limit is exceeded.
const PAGE_CACHE_MAX_ENTRIES = 50;
const ASSET_CACHE_MAX_ENTRIES = 100;

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

// Static assets to pre-cache on install.
// Note: icon-1024.png and logo.png are byte-identical; the OS fetches
// icon-1024.png at PWA install time, so we only precache logo.png here.
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/logo.png',
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, websocket, etc.
  if (!url.protocol.startsWith('http')) return;

  // API routes — network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    // Only cache safe read-only API responses
    const cacheable = ['/api/members', '/api/library', '/api/music', '/api/directory'];
    const shouldCache = cacheable.some((prefix) => url.pathname.startsWith(prefix));

    if (shouldCache) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Clone and cache successful responses
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
      return;
    }
    // Non-cacheable API routes — just fetch, no fallback
    return;
  }

  // Next.js internals — let them through (they have their own caching)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Page navigations — network first, offline fallback
  if (request.mode === 'navigate') {
    // Never cache the miniapp entry — stale HTML here means users get stuck
    // on the native Farcaster splash because ready() lives in the new bundle.
    const isMiniAppEntry = url.pathname === '/miniapp' || url.pathname.startsWith('/miniapp/');

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !isMiniAppEntry) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).then(() =>
                trimCache(CACHE_NAME, PAGE_CACHE_MAX_ENTRIES + ASSET_CACHE_MAX_ENTRIES)
              );
            });
          }
          return response;
        })
        .catch(() => {
          if (isMiniAppEntry) return caches.match(OFFLINE_URL);
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets (images, fonts, css) — cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful static asset responses, then trim oldest if over cap
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone).then(() =>
              trimCache(CACHE_NAME, PAGE_CACHE_MAX_ENTRIES + ASSET_CACHE_MAX_ENTRIES)
            );
          });
        }
        return response;
      });
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'ZAO OS', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'zaoos-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'ZAO OS', options));
});

// Notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
