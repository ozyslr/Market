/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the app is closed or in background.
 *
 * Firebase config is loaded from /__/firebase/init.js which is served automatically
 * by Firebase Hosting in production, and by the dev server locally (server.ts).
 * This avoids hardcoding API keys in source control.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

// Background message handler — fires when app is in background
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message:', payload);

  const { title, body, icon, data } = payload.notification || payload.data || {};

  self.registration.showNotification(title || 'Benim Olan', {
    body: body || '',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: data?.url ? [{ action: 'open', title: 'Görüntüle' }] : undefined,
  });
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
