import { API_BASE_URL, config } from '../config/api';

// Mobile API Client
export const apiClient = {
  baseURL: API_BASE_URL,

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔵 API ${options?.method || 'GET'}: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...config.headers,
          ...options?.headers,
        },
      });

      // Try to parse response body (for both success and error)
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        // Extract error message from response body
        const errorMessage = data?.error || data?.message || response.statusText;
        console.error('❌ API Error:', {
          endpoint,
          status: response.status,
          error: errorMessage,
          url,
        });
        throw new Error(errorMessage);
      }

      console.log('✅ API Success:', endpoint);
      return data;
    } catch (error: any) {
      console.error('❌ API Error:', {
        endpoint,
        error: error.message,
        url,
      });
      throw error;
    }
  },

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(email: string, password: string, name: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async getProfile() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  },

  // Helper to set auth token in headers
  setToken(token: string) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  },

  clearToken() {
    delete (config.headers as any).Authorization;
  },

  // Video endpoints (mock for now)
  async getVideoAnalysis(videoId: string) {
    // TODO: Replace with real API call
    return Promise.resolve({
      id: videoId,
      status: 'completed',
      analysis: { form: 'Good', feedback: 'Keep it up!' },
    });
  },

  // Wearables endpoints (mock for now)
  async getWearableData(days: number) {
    // TODO: Replace with real API call
    return Promise.resolve({
      steps: [8000, 10000, 7500],
      heartRate: [72, 75, 68],
      sleep: [7.5, 8, 6.5],
    });
  },

  async connectWearable(provider: string) {
    // TODO: Replace with real API call
    return Promise.resolve({ success: true, provider });
  },

  // Subscription endpoints (mock for now)
  async getSubscriptionStatus() {
    // TODO: Replace with real API call
    return Promise.resolve({
      plan: 'free',
      status: 'active',
    });
  },

  async createSubscription(planId: string) {
    // TODO: Replace with real API call
    return Promise.resolve({ success: true, planId });
  },
};
