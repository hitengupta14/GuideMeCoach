import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from './api';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth credentials (replace with your actual credentials from Google Cloud Console)
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '841852620652-1q0pb0bbvh2aj9fqv5l5qj1dql58miqh.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '841852620652-1q0pb0bbvh2aj9fqv5l5qj1dql58miqh.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    scopes: ['profile', 'email'],
  });

  return { request, response, promptAsync };
}

export async function handleGoogleSignIn(idToken: string) {
  try {
    console.log('🔵 Google Sign-In: Sending token to backend');
    
    const response: any = await apiClient.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    console.log('✅ Google Sign-In Success:', response);
    
    // Backend returns { success: true, data: { token, user } }
    const { token, user } = response.data || response;

    if (token && user) {
      apiClient.setToken(token);
      return { token, user };
    } else {
      throw new Error('Invalid response from Google authentication');
    }
  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error.message);
    throw error;
  }
}
