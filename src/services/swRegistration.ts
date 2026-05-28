/**
 * PWA Service Worker Registration & Offline Support
 *
 * Registers the Workbox-generated service worker from vite-plugin-pwa.
 * Handles update prompts, offline detection, and cache management.
 */

const SW_PATH = '/sw.js';

export function registerSW(): void {
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service workers not supported.');
    return;
  }

  // Track last online timestamp for offline page display
  window.addEventListener('online', () => {
    try { localStorage.setItem('last_online_visit', Date.now().toString()); } catch {}
  });
  try { localStorage.setItem('last_online_visit', Date.now().toString()); } catch {}

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
        updateViaCache: 'none',
      });

      console.info('[PWA] SW registered:', registration.scope);

      // Check for updates periodically (every 60 min)
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);

      // Handle update found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('[PWA] New version ready — refresh to update.');
            window.dispatchEvent(new CustomEvent('sw-update-ready', {
              detail: { version: Date.now() },
            }));
          }
        });
      });

      // Handle controller change (new SW took over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.info('[PWA] New service worker activated.');
      });

      // Handle messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          console.info('[PWA] Cache updated:', event.data.url);
        }
        if (event.data?.type === 'OFFLINE_READY') {
          window.dispatchEvent(new CustomEvent('offline-ready'));
        }
      });
    } catch (error) {
      console.error('[PWA] SW registration failed:', error);
    }
  });
}

/**
 * Skip waiting and reload — called when user accepts update prompt.
 */
export async function updateApp(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

/**
 * Check if the app is currently running from cache (offline).
 */
export function isRunningOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Clear all cached data (emergency reset).
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
}
