/* Mercora PWA Service Worker v1.0.0 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `mercora-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mercora-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `mercora-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ---- INSTALL ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ---- ACTIVATE ----
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ---- HELPERS ----
function shouldHandleRequest(url) {
  // Skip chrome-extension, localhost dev, and browser-sync requests
  if (
    !url.protocol.startsWith('http') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1'
  ) {
    return false;
  }
  return true;
}

function isApiRequest(url) {
  return (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.pathname.startsWith('/api/')
  );
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(url.pathname);
}

function isFontRequest(url) {
  return (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)
  );
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'))
  );
}

// ---- NETWORK FIRST (API & Navigation) ----
async function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone the response because the body can only be consumed once
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request and no cache, show offline page
    if (isNavigationRequest(request)) {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) return offlineResponse;
    }

    // Return a basic offline fallback
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ---- CACHE FIRST (Static assets, Images, Fonts) ----
async function cacheFirstStrategy(request, cacheName = STATIC_CACHE) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // For images, return a transparent pixel fallback
    if (isImageRequest(request.url)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F0F0F5"/><text x="100" y="110" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }

    // For navigation, show offline page
    if (isNavigationRequest(request)) {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) return offlineResponse;
    }

    return new Response('Offline', { status: 503 });
  }
}

// ---- STALE WHILE REVALIDATE (Fonts) ----
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// ---- FETCH ----
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (!shouldHandleRequest(url)) {
    return;
  }

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isFontRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, STATIC_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
  } else {
    // For all other static assets (JS, CSS, etc.), use cache-first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  }
});

// ---- MESSAGE HANDLING (skip waiting on user command) ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
