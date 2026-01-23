/**
 * API Client for GuideMeCoach Mobile App
 * Handles all communication with the backend API
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  isAdmin: boolean;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goals?: string[];
  experienceLevel?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VideoAnalysis {
  status: 'processing' | 'completed' | 'failed';
  formScore?: number;
  keyPoints?: Array<{
    timestamp: number;
    feedback: string;
    severity: 'positive' | 'warning' | 'error';
  }>;
  improvements?: string[];
  videoUrl?: string;
  analyzedAt?: string;
}

export interface WearableData {
  heartRate?: Array<{
    timestamp: string;
    resting: number;
    average: number;
    peak: number;
  }>;
  steps?: Array<{
    timestamp: string;
    steps: number;
    goal: number;
    distance: number;
  }>;
  calories?: Array<{
    timestamp: string;
    burned: number;
    active: number;
    bmr: number;
  }>;
  sleep?: Array<{
    timestamp: string;
    duration: number;
    quality: number;
    deepSleep: number;
    remSleep: number;
    lightSleep: number;
  }>;
  distance?: Array<{
    timestamp: string;
    distance: number;
    elevation: number;
  }>;
  lastSyncedAt: string;
}

export interface Subscription {
  status: string;
  plan: string;
  planName: string;
  price: number;
  currency: string;
  interval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysUntilRenewal: number;
  autoRenew: boolean;
  cancelAt: string | null;
  features: string[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
          code: data.code,
        };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ===== Authentication Endpoints =====

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(
    email: string,
    password: string,
    name?: string
  ): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  // ===== Video Endpoints =====

  async uploadVideo(
    file: Blob,
    exerciseId: string
  ): Promise<ApiResponse<{ videoId: string; uploadUrl: string }>> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('exerciseId', exerciseId);

    return this.request('/video/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  async getVideoAnalysis(videoId: string): Promise<ApiResponse<VideoAnalysis>> {
    return this.request<VideoAnalysis>(`/video/${videoId}`, {
      method: 'GET',
    });
  }

  // ===== Wearables Endpoints =====

  async connectWearable(provider: string, authCode?: string, refreshToken?: string) {
    return this.request('/wearables/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, authCode, refreshToken }),
    });
  }

  async getWearableData(days: number = 7, provider?: string): Promise<ApiResponse<WearableData>> {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (provider) {
      params.append('provider', provider);
    }

    return this.request<WearableData>(`/wearables/data?${params}`, {
      method: 'GET',
    });
  }

  // ===== Subscription Endpoints =====

  async createSubscription(
    planType: string,
    paymentMethodId?: string
  ): Promise<ApiResponse<{ subscriptionId: string; status: string }>> {
    return this.request('/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType, paymentMethodId }),
    });
  }

  async getSubscriptionStatus(): Promise<ApiResponse<Subscription>> {
    return this.request<Subscription>('/subscription/status', {
      method: 'GET',
    });
  }

  // ===== Utility Methods =====

  async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await this.request<T>(endpoint, options);
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data!;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;
