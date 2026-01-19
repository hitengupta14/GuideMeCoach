import { create } from 'zustand';
import { apiClient } from '../services/api';
import { handleGoogleSignIn } from '../services/google-auth';

export interface AuthState {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response: any = await apiClient.login(email, password);

      // Backend returns { success: true, data: { token, user } }
      const { token, user } = response.data || response;

      if (token && user) {
        apiClient.setToken(token);
        set({
          token: token,
          user: user,
          isLoading: false,
        });
      } else {
        set({
          error: 'Login failed',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
    }
  },

  signup: async (email: string, password: string, name?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response: any = await apiClient.signup(email, password, name || '');

      // Backend returns { success: true, data: { token, user } }
      const { token, user } = response.data || response;

      if (token && user) {
        apiClient.setToken(token);
        set({
          token: token,
          user: user,
          isLoading: false,
        });
      } else {
        set({
          error: 'Signup failed',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Signup failed',
        isLoading: false,
      });
    }
  },

  logout: () => {
    apiClient.clearToken();
    set({
      user: null,
      token: null,
      error: null,
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
      const { token, user } = await handleGoogleSignIn(idToken);
      set({
        token: token,
        user: user,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Google sign-in failed',
        isLoading: false,
      });
    }
  },
}));
