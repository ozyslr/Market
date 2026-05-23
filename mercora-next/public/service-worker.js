/**
 * Service Worker (STREAM C)
 * Caching strategy and offline support
 *
 * Cache strategy:
 * - Static assets (js, css): aggressive cache
 * - API responses: network-first with fallback
 * - Images: cache-first with stale-while-revalidate
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `mercora-static-${CACHE_VERSION}`;
const API_CACHE = `mercora-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `mercora-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log('[SW] Some static assets failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: network-first with fallback
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirstStrategy(request, API_CACHE));
  }

  // Images: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
    return event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  }

  // Static assets (js, css): cache-first
  if (url.pathname.match(/\.(js|css)$/i)) {
    return event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  }

  // Default: network-first
  return event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
});

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // No cache, return offline response
    return new Response('Offline - resource not available', { status: 503 });
  }
}

/**
 * Cache-first strategy
 * Use cache, update from network in background
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);

  if (cached) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(cacheName);
          cache.then((c) => c.put(request, response.clone()));
        }
      })
      .catch(() => {
        // Network error, ignore
      });

    return cached;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return new Response('Offline - resource not available', { status: 503 });
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
