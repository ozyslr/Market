import messaging from '@react-native-firebase/messaging';

export async function requestPermission(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
}

export function onMessageReceived(callback: (message: any) => void): () => void {
  return messaging().onMessage(callback);
}

export function onNotificationOpened(callback: (message: any) => void): () => void {
  return messaging().onNotificationOpenedApp(callback);
}
