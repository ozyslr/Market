import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
  NotificationType,
} from '@/services/notificationService';
import {
  getPushPermissionStatus,
  registerPushToken,
  unregisterPushToken,
  onForegroundMessage,
  requestPushPermission,
} from '@/services/pushNotificationService';

export interface TypeCounts {
  order: number;
  stock: number;
  price: number;
  system: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  pushSupported: boolean;
  pushGranted: boolean;
  enablePush: () => Promise<void>;
  filterByType: (type: NotificationType) => Notification[];
  typeCounts: TypeCounts;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markRead: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
  pushSupported: false,
  pushGranted: false,
  enablePush: async () => {},
  filterByType: () => [],
  typeCounts: { order: 0, stock: 0, price: 0, system: 0 },
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushGranted, setPushGranted] = useState(false);
  const pushSupported = 'Notification' in window && 'serviceWorker' in navigator;

  // Check push permission status and register token
  useEffect(() => {
    if (!pushSupported) return;
    const status = getPushPermissionStatus();
    setPushGranted(status === 'granted');

    if (status === 'granted' && firebaseUser) {
      registerPushToken(firebaseUser.uid);
    }
  }, [firebaseUser, pushSupported]);

  // Listen for foreground messages
  useEffect(() => {
    if (!pushGranted) return;
    const unsub = onForegroundMessage((payload) => {
      // Show in-app toast via a custom event (Navbar can listen)
      window.dispatchEvent(new CustomEvent('push-received', { detail: payload }));
    });
    return unsub;
  }, [pushGranted]);

  // Cleanup push token on unmount
  useEffect(() => {
    return () => {
      if (firebaseUser) unregisterPushToken(firebaseUser.uid);
    };
  }, []);

  const enablePush = async () => {
    const status = await requestPushPermission();
    setPushGranted(status === 'granted');
    if (status === 'granted' && firebaseUser) {
      await registerPushToken(firebaseUser.uid);
    }
  };
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      setNotifications(await getUserNotifications(user.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  async function markRead(id: string) {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAll() {
    if (!user) return;
    await markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const filterByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const typeCounts = useMemo(() => {
    const counts = { order: 0, stock: 0, price: 0, system: 0 };
    notifications.forEach(n => {
      if (n.type === 'order_status') counts.order++;
      else if (n.type === 'back_in_stock') counts.stock++;
      else if (n.type === 'price_drop') counts.price++;
      else counts.system++;
    });
    return counts;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllAsRead: markAll,
        refresh: load,
        pushSupported,
        pushGranted,
        enablePush,
        filterByType,
        typeCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
