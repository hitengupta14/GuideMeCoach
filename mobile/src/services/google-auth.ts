import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { config } from '../config/api';
import { apiClient } from './api';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth credentials
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '79067976017-jdrll6f7honug0lpi5bv9vv2m6n3kn3e.apps.googleusercontent.com';

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

const AUTH_DEBUG = __DEV__ && (config as any).debug === true;
function debugLog(...args: any[]) {
  if (AUTH_DEBUG) console.log(...args);
}

// @ts-ignore - expo-auth-session internal type issue
export function useGoogleAuth(): any {
  const isExpoGo = (Constants as any)?.appOwnership === 'expo';
  // In development with Expo Go, use the Expo proxy redirect. In standalone builds, use the app scheme.
  const redirectUriOptions: any = {
    scheme: 'guidemecoach',
    useProxy: isExpoGo,
  };
  const redirectUri = makeRedirectUri(redirectUriOptions);

  debugLog('🔵 Google Auth Redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      scopes: ['profile', 'email'],
    },
    redirectUriOptions
  );

  const prompt = (options?: any) => promptAsync({ useProxy: isExpoGo, ...options });
  return { request, response, promptAsync: prompt };
}

export async function handleGoogleSignIn(idToken: string) {
  try {
    const response: any = await apiClient.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    
    // Backend returns { success: true, data: { token, user } }
    const tokenData = response?.data?.token || response?.token;
    const refreshTokenData = response?.data?.refreshToken || response?.refreshToken || null;
    const userData = response?.data?.user || response?.user;

    if (tokenData && userData) {
      apiClient.setTokens(tokenData, refreshTokenData);
      return { token: tokenData, refreshToken: refreshTokenData, user: userData };
    } else {
      console.error('❌ Invalid response from Google authentication');
      debugLog('❌ Invalid response structure keys:', Object.keys(response || {}));
      throw new Error('Invalid response from Google authentication');
    }
  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error?.message || String(error));
    debugLog('❌ Google Sign-In Debug:', { status: error?.status });
    throw error;
  }
}
