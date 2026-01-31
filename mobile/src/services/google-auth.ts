import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { apiClient } from './api';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth credentials
const GOOGLE_WEB_CLIENT_ID = '79067976017-jdrll6f7honug0lpi5bv9vv2m6n3kn3e.apps.googleusercontent.com';

// @ts-ignore - expo-auth-session internal type issue
export function useGoogleAuth(): any {
  // In development with Expo Go, use proxy. Otherwise use scheme.
  const redirectUri = makeRedirectUri();

  console.log('🔵 Google Auth Redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['profile', 'email'],
  });

  return { request, response, promptAsync };
}

export async function handleGoogleSignIn(idToken: string) {
  try {
    console.log('🔵 Google Sign-In: Sending token to backend');
    console.log('🔵 ID Token preview:', idToken?.substring(0, 50) + '...');
    
    const response: any = await apiClient.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    console.log('✅ Google Sign-In Backend Response:', response);
    
    // Backend returns { success: true, data: { token, user } }
    const tokenData = response?.data?.token || response?.token;
    const userData = response?.data?.user || response?.user;

    if (tokenData && userData) {
      apiClient.setToken(tokenData);
      console.log('✅ Google Sign-In Success: Token saved');
      return { token: tokenData, user: userData };
    } else {
      console.error('❌ Invalid response structure:', response);
      throw new Error('Invalid response from Google authentication');
    }
  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error);
    console.error('❌ Error Details:', {
      message: error.message,
      status: error.status,
      response: error.response,
    });
    throw error;
  }
}
