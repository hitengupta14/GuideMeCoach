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

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || response.statusText;
        console.error('❌ API Error:', { endpoint, status: response.status, error: errorMessage, url });
        throw new Error(errorMessage);
      }

      console.log('✅ API Success:', endpoint);
      return data as T;
    } catch (error: any) {
      console.error('❌ API Error:', { endpoint, error: error.message, url });
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
    return this.request('/auth/me', { method: 'GET' });
  },

  // Helper to set auth token in headers (Bearer + Cookie for Next.js endpoints)
  setToken(token: string) {
    (config.headers as any).Authorization = `Bearer ${token}`;
    (config.headers as any).Cookie = `session=${token}`;
  },

  clearToken() {
    delete (config.headers as any).Authorization;
    delete (config.headers as any).Cookie;
  },

  // ===== Video (v1) =====
  async uploadVideo(file: Blob, exerciseId: string) {
    const form = new FormData();
    form.append('video', file as any);
    form.append('exerciseId', exerciseId);
    return this.request('/v1/video/upload', { method: 'POST', body: form });
  },

  async getVideoAnalysis(videoId: string) {
    return this.request(`/v1/video/${videoId}`, { method: 'GET' });
  },

  // ===== Wearables (v1) =====
  async getWearableData(days: number, provider?: string) {
    const params = new URLSearchParams({ days: String(days) });
    if (provider) params.append('provider', provider);
    const res: any = await this.request(`/v1/wearables/data?${params.toString()}`, { method: 'GET' });
    return res?.data ?? res;
  },

  async connectWearable(provider: string, authCode?: string, refreshToken?: string) {
    return this.request('/v1/wearables/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, authCode, refreshToken }),
    });
  },

  // ===== Subscription (v1) =====
  async getSubscriptionStatus() {
    const res: any = await this.request('/v1/subscription/status', { method: 'GET' });
    return res?.data ?? res;
  },

  async createSubscription(planType: string, paymentMethodId?: string) {
    return this.request('/v1/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType, paymentMethodId }),
    });
  },

  // ===== Exercises =====
  async listExercises(params: Record<string, string | number | boolean> = {}) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) sp.append(k, String(v));
    });
    return this.request(`/exercises?${sp.toString()}`);
  },

  async getExercise(id: string) {
    return this.request(`/exercises/${id}`, { method: 'GET' });
  },

  // ===== Workouts =====
  async startWorkoutSession(userId: string, dayName: string, planId?: string) {
    return this.request('/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, dayName, planId }),
    });
  },

  async getWorkoutSessions(userId: string) {
    return this.request(`/workouts/sessions?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
  },

  async logExercise(entry: {
    userId: string;
    sessionId: string;
    exerciseId: string;
    plannedSets?: number;
    completedSets?: number;
    plannedReps?: number;
    completedReps?: number;
    weight?: number;
    duration?: number;
    rpe?: number;
    notes?: string;
  }) {
    return this.request('/workouts/logs', { method: 'POST', body: JSON.stringify(entry) });
  },

  async getSessionLogs(sessionId: string) {
    return this.request(`/workouts/logs?sessionId=${encodeURIComponent(sessionId)}`, { method: 'GET' });
  },

  // ===== Planner =====
  async generatePlan(preferences: any) {
    return this.request('/planner/generate', { method: 'POST', body: JSON.stringify(preferences) });
  },

  async savePlan(payload: { planData: any; name?: string; description?: string; durationWeeks?: number }) {
    return this.request('/planner/plans', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getPlans() {
    return this.request('/planner/plans', { method: 'GET' });
  },

  // ===== Analytics =====
  async getProgress(range: 'week' | 'month' | 'year' = 'month') {
    return this.request(`/analytics/progress?range=${range}`, { method: 'GET' });
  },

  // ===== Nutrition =====
  async getNutritionGuidance() {
    return this.request('/users/nutrition-guidance', { method: 'GET' });
  },

  async updateUserProfile(updates: Record<string, any>) {
    return this.request('/users/profile', { method: 'PUT', body: JSON.stringify(updates) });
  },

  // ===== Badges/Achievements =====
  async getBadges(userId?: string) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request(`/badges/check${qs}`, { method: 'GET' });
  },

  async checkAndAwardBadges(userId: string) {
    return this.request('/badges/check', { method: 'POST', body: JSON.stringify({ userId }) });
  },

  // ===== Chat (Cookie-based session) =====
  async listConversations() {
    return this.request('/chat/conversations', { method: 'GET' });
  },

  async createConversation(payload: { topic: string; title: string; firstMessage?: string }) {
    return this.request('/chat/conversations', { method: 'POST', body: JSON.stringify(payload) });
  },

  async listMessages(conversationId: string) {
    return this.request(`/chat/messages?conversationId=${encodeURIComponent(conversationId)}`, { method: 'GET' });
  },

  async addMessage(conversationId: string, content: string) {
    return this.request('/chat/messages', { method: 'POST', body: JSON.stringify({ conversationId, content }) });
  },
};
