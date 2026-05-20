import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Foreground notification handler — show banner even when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission and register for push notifications.
 * Returns the Expo push token, or null if permission denied / emulator.
 */
export async function registerForPushNotifications(
  projectId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Sipariş Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F9423A',
    });
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Fırsatlar ve İndirimler',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 100],
      lightColor: '#10B981',
    });
  }

  // Request permission
  let finalStatus: Notifications.PermissionStatus;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenData.data;
}

/**
 * Subscribe to notification tap events (user opens notification).
 * Returns a subscription that should be cleaned up on unmount.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(handler);
  return subscription;
}

/**
 * Subscribe to foreground notification received events.
 * Returns a subscription that should be cleaned up on unmount.
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return subscription;
}

/**
 * Get the last notification that opened the app (cold start).
 */
export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
