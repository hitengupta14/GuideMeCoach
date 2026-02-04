import { create } from 'zustand';
import { apiClient } from '../services/api';
import { handleGoogleSignIn } from '../services/google-auth';
import {
  saveSession,
  clearSession,
  loadSessionWithBiometrics,
  setBiometricsEnabled,
  isBiometricsEnabled,
} from '../services/secure-auth';

export interface AuthState {
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  biometricsEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ requiresEmailVerification: boolean; email?: string }>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  clearError: () => void;
  bootstrap: () => Promise<void>;
  setBiometrics: (enabled: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  biometricsEnabled: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response: any = await apiClient.login(email, password);

      // Backend returns { success: true, data: { token, user } }
      const tokenData = response?.data?.token || response?.token;
      const refreshTokenData = response?.data?.refreshToken || response?.refreshToken || null;
      const userData = response?.data?.user || response?.user;

      if (tokenData && userData) {
        apiClient.setTokens(tokenData, refreshTokenData);
        await saveSession(tokenData, refreshTokenData, userData);
        await setBiometricsEnabled(true);
        set({
          token: tokenData,
          refreshToken: refreshTokenData,
          user: userData,
          isLoading: false,
          biometricsEnabled: true,
        });
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  signup: async (email: string, password: string, name?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response: any = await apiClient.signup(email, password, name || '');

      // Backend can either:
      // 1) Return { success: true, data: { token, user } } for immediate auth flows, or
      // 2) Return { success: true, data: { user } } when email verification is required.
      const tokenData = response?.data?.token || response?.token;
      const refreshTokenData = response?.data?.refreshToken || response?.refreshToken || null;
      const userData = response?.data?.user || response?.user;

      if (tokenData && userData) {
        apiClient.setTokens(tokenData, refreshTokenData);
        await saveSession(tokenData, refreshTokenData, userData);
        await setBiometricsEnabled(true);
        set({
          token: tokenData,
          refreshToken: refreshTokenData,
          user: userData,
          isLoading: false,
          biometricsEnabled: true,
        });
        return { requiresEmailVerification: false };
      }

      if (userData && !tokenData) {
        // Email verification required (no session until verified).
        set({ isLoading: false });
        return { requiresEmailVerification: true, email: userData.email || email };
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Signup failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    try {
      const { user } = useAuthStore.getState();
      // Fire-and-forget unregister of push token
      import('../services/push-notifications').then(({ unregisterPushTokenAsync }) => {
        unregisterPushTokenAsync(user?.id).catch(() => {});
      });
    } catch {}
    apiClient.clearToken();
    clearSession();
    set({
      user: null,
      token: null,
      refreshToken: null,
      error: null,
      biometricsEnabled: false,
    });
  },

  setToken: (token: string) => {
    apiClient.setToken(token);
    set({ token });
  },

  clearError: () => {
    set({ error: null });
  },

  loginWithGoogle: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });
      const { token, refreshToken, user } = await handleGoogleSignIn(idToken);
      await saveSession(token, refreshToken || null, user);
      await setBiometricsEnabled(true);
      set({
        token: token,
        refreshToken: refreshToken || null,
        user: user,
        isLoading: false,
        biometricsEnabled: true,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Google sign-in failed',
        isLoading: false,
      });
    }
  },

  bootstrap: async () => {
    const enabled = await isBiometricsEnabled();
    set({ biometricsEnabled: enabled });
    const { token, refreshToken, user } = await loadSessionWithBiometrics();
    if (token && user) {
      apiClient.setTokens(token, refreshToken);
      set({ token, refreshToken, user });
    }
  },

  setBiometrics: async (enabled: boolean) => {
    await setBiometricsEnabled(enabled);
    set({ biometricsEnabled: enabled });
  },
}));

// Keep secure storage + zustand state in sync when the API client refreshes tokens.
apiClient.setAuthUpdateHandler(async (tokens) => {
  if (!tokens) {
    try {
      await clearSession();
    } catch {}
    useAuthStore.setState({ user: null, token: null, refreshToken: null, biometricsEnabled: false, error: null });
    return;
  }

  const user = useAuthStore.getState().user;
  try {
    await saveSession(tokens.accessToken, tokens.refreshToken, user);
  } catch {}
  useAuthStore.setState({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
});
