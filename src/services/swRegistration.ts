/**
 * Service Worker Registration for PWA support.
 *
 * Tries the Workbox-generated service worker from vite-plugin-pwa first,
 * then falls back to the manual service-worker.js in /public/.
 */

const SW_PATH = '/service-worker.js';

export function registerSW(): void {
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service workers not supported in this browser.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      // First try: this will match the Workbox-generated SW from VitePWA
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
        updateViaCache: 'none',
      });

      console.info('[PWA] Service worker registered:', registration.scope);

      // Auto-update handling: when a new SW is waiting, show user a prompt
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available - tell user
              console.info('[PWA] New version available. User can refresh to update.');
              // Dispatch custom event that UI can listen to
              window.dispatchEvent(new CustomEvent('sw-update-ready'));
            }
          });
        }
      });
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  });
}
