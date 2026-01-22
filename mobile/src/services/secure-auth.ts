import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'gm-auth-token';
const USER_KEY = 'gm-auth-user';
const BIOMETRIC_KEY = 'gm-bio-enabled';

export async function saveSession(token: string, user: any) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function setBiometricsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? '1' : '0');
}

export async function isBiometricsEnabled() {
  const flag = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return flag === '1';
}

export async function loadSessionWithBiometrics(): Promise<{ token: string | null; user: any | null }> {
  const enabled = await isBiometricsEnabled();
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userRaw = await SecureStore.getItemAsync(USER_KEY);
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!enabled || !token) {
    return { token, user };
  }

  const supported = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  if (!supported || !enrolled) {
    return { token, user };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock GuideMeCoach',
    fallbackLabel: 'Use device passcode',
  });

  if (result.success) {
    return { token, user };
  }

  return { token: null, user: null };
}
