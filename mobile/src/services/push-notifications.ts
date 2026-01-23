import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const TOKEN_STORAGE_KEY = 'expoPushToken';

export async function registerForPushNotificationsAsync(userId?: string) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permissions not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  const metadata = {
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceType: Device.deviceType,
    deviceYearClass: Device.deviceYearClass,
    brand: (Device as any).brand,
    appVersion: Constants?.expoConfig?.version || Constants?.appOwnership || 'unknown',
  };

  // Fire-and-forget registration with backend
  try {
    await apiClient.request('/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS, userId, metadata }),
    });
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.log('Push token registration failed', err);
  }

  return token;
}

export function addNotificationResponseListener(handler: (data: Notifications.NotificationResponse) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(handler);
  return () => subscription.remove();
}

export async function getStoredPushToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function unregisterPushTokenAsync(userId?: string) {
  try {
    const token = await getStoredPushToken();
    if (!token) return;
    await apiClient.request('/notifications/unregister', {
      method: 'POST',
      body: JSON.stringify({ token, userId }),
    });
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.log('Push token unregister failed', err);
  }
}
