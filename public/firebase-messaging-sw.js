/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the app is closed or in background.
 */

// Import Firebase from CDN in service worker context
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBp0U-s1M46M1GBeVWkBaNgYHkLxPkBaVQ",
  authDomain: "market-ecommerce-app.firebaseapp.com",
  projectId: "market-ecommerce-app",
  storageBucket: "market-ecommerce-app.firebasestorage.app",
  messagingSenderId: "1096280426288",
  appId: "1:1096280426288:web:3f5e6c7d8b9a0f1e2d3c4b",
});

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
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
