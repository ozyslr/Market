/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 *
 * Handles token registration, permission requests, and foreground messages.
 * Background messages are handled by /public/firebase-messaging-sw.js
 */

import { getMessaging, getToken, onMessage, deleteToken, Messaging } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PushPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

// ─── Permission ─────────────────────────────────────────────────────────────

export function getPushPermissionStatus(): PushPermissionStatus {
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

export async function requestPushPermission(): Promise<PushPermissionStatus> {
  if (!('Notification' in window)) return 'unsupported';

  const permission = await Notification.requestPermission();
  return permission as PushPermissionStatus;
}

// ─── Token Management ──────────────────────────────────────────────────────

/**
 * Get FCM token and save it to Firestore for the current user.
 * Returns null if permission is not granted.
 */
export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    const status = getPushPermissionStatus();
    if (status !== 'granted') return null;

    const messaging = getOrInitMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: 'BCR4x7K8mN9pQ2rS5tU8vW1yA3bD6eF0gH9iJ2kL4mN7oP1qR3sT5uV8wX0yZ',
    });

    if (token) {
      // Save token to Firestore
      await setDoc(doc(db, 'pushTokens', userId), {
        token,
        platform: /Android/i.test(navigator.userAgent) ? 'android' :
                  /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'web',
        userAgent: navigator.userAgent.slice(0, 200),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.info('[FCM] Token registered:', token.slice(0, 20) + '...');
    }

    return token;
  } catch (error) {
    console.error('[FCM] Token registration failed:', error);
    return null;
  }
}

/**
 * Remove push token when user logs out.
 */
export async function unregisterPushToken(userId: string): Promise<void> {
  try {
    const messaging = getOrInitMessaging();
    if (messaging) {
      const token = await getToken(messaging, {
        vapidKey: 'BCR4x7K8mN9pQ2rS5tU8vW1yA3bD6eF0gH9iJ2kL4mN7oP1qR3sT5uV8wX0yZ',
      }).catch(() => null);
      if (token) await deleteToken(messaging);
    }
    await deleteDoc(doc(db, 'pushTokens', userId)).catch(() => {});
  } catch { /* cleanup is non-critical */ }
}

// ─── Foreground Messages ────────────────────────────────────────────────────

export type ForegroundMessageHandler = (payload: PushNotificationPayload) => void;

/**
 * Listen for push notifications while the app is in the foreground.
 * Shows an in-app toast/notification instead of a system notification.
 */
export function onForegroundMessage(handler: ForegroundMessageHandler): () => void {
  const messaging = getOrInitMessaging();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    const { title, body, icon } = payload.notification || {};
    handler({
      title: title || 'Benim Olan',
      body: body || '',
      icon,
      url: payload.data?.url || (payload.fcmOptions as any)?.link,
    });
  });

  return unsubscribe;
}

// ─── Internal ───────────────────────────────────────────────────────────────

let _messaging: Messaging | null = null;

function getOrInitMessaging(): Messaging | null {
  if (_messaging) return _messaging;
  try {
    // firebase/app must already be initialized (handled by lib/firebase.ts)
    const { getApp } = require('firebase/app');
    _messaging = getMessaging(getApp());
    return _messaging;
  } catch {
    return null;
  }
}

// ─── Admin: Send push to specific users ─────────────────────────────────────
// (Called from server.ts via admin SDK, client-accessible via API)

/**
 * Queue a push notification for a user.
 * The actual send happens server-side via the API endpoint.
 */
export async function queuePushNotification(userId: string, title: string, body: string, url?: string): Promise<void> {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url }),
    });
  } catch { /* non-blocking */ }
}
