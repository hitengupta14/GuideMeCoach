import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './api';
import { getOrGenerateDeviceUUID } from './device-id';

export async function reportClientError(input: {
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string | null;
  screen?: string;
}) {
  try {
    const deviceId = await getOrGenerateDeviceUUID().catch(() => null);
    const appVersion =
      (Constants as any)?.expoConfig?.version ||
      (Constants as any)?.manifest?.version ||
      (Constants as any)?.nativeAppVersion ||
      undefined;

    await apiClient.request('/v1/client-errors', {
      method: 'POST',
      body: JSON.stringify({
        message: input.message,
        name: input.name,
        stack: input.stack,
        componentStack: input.componentStack || undefined,
        screen: input.screen,
        platform: Platform.OS,
        appVersion,
        deviceId,
      }),
    });
  } catch {
    // Never throw from crash reporting; avoid error loops.
  }
}

