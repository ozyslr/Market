'use client';

/**
 * Service Worker Registration for PWA support.
 *
 * Registers a service worker for offline support and push notifications.
 */

const SW_PATH = '/service-worker.js';

export function registerSW(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service workers not supported in this browser.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
        updateViaCache: 'none',
      });

      console.info('[PWA] Service worker registered:', registration.scope);

      // Auto-update handling
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.info('[PWA] New version available. Reloading...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Reload when a new SW takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  });
}
