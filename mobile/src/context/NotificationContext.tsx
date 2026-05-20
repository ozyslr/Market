import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  getLastNotificationResponse,
} from '../services/pushNotificationService';
import { navigationRef } from '../navigation/rootNavigation';

const PROJECT_ID = 'market-ecommerce-app';

interface NotificationContextType {
  expoPushToken: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const responseListener = useRef<any>();
  const initialResponseHandled = useRef(false);

  // Register for push notifications on mount
  useEffect(() => {
    registerForPushNotifications(PROJECT_ID).then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });
  }, []);

  // Handle notification taps — navigate to relevant screen
  useEffect(() => {
    responseListener.current = addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (!navigationRef.isReady()) return;

        if (data?.type === 'order' && data?.orderId) {
          navigationRef.navigate('OrderDetail' as never, {
            orderId: data.orderId,
          } as never);
        } else if (data?.type === 'orders') {
          navigationRef.navigate('OrdersTab' as never);
        }
      }
    );

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Handle cold-start notification (app opened from killed state via notification)
  useEffect(() => {
    if (initialResponseHandled.current) return;
    initialResponseHandled.current = true;

    getLastNotificationResponse().then((response) => {
      if (!response || !navigationRef.isReady()) return;
      const data = response.notification.request.content.data;

      if (data?.type === 'order' && data?.orderId) {
        navigationRef.navigate('OrderDetail' as never, {
          orderId: data.orderId,
        } as never);
      } else if (data?.type === 'orders') {
        navigationRef.navigate('OrdersTab' as never);
      }
    });
  }, []);

  // Save push token to user document when user logs in
  useEffect(() => {
    if (user && expoPushToken) {
      const userRef = doc(db, 'users', user.id);
      setDoc(
        userRef,
        {
          pushToken: expoPushToken,
          pushTokenPlatform: Platform.OS,
          pushTokenUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {
        // Silently fail — token will be saved on next login
      });
    }
  }, [user, expoPushToken]);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
