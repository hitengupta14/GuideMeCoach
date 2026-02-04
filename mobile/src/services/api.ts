import { API_BASE_URL, config } from '../config/api';

type AuthTokens = { accessToken: string; refreshToken: string };
type AuthUpdateHandler = (tokens: AuthTokens | null) => Promise<void> | void;

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Mobile API Client
export const apiClient = {
  baseURL: API_BASE_URL,
  _accessToken: null as string | null,
  _refreshToken: null as string | null,
  _refreshInFlight: null as Promise<boolean> | null,
  _authUpdateHandler: null as AuthUpdateHandler | null,

  setAuthUpdateHandler(handler: AuthUpdateHandler | null) {
    this._authUpdateHandler = handler;
  },

  setTokens(accessToken: string, refreshToken?: string | null) {
    this._accessToken = accessToken;
    if (refreshToken !== undefined) {
      this._refreshToken = refreshToken;
    }
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
    (config.headers as any).Cookie = `session=${accessToken}`;
  },

  // Legacy alias
  setToken(token: string) {
    this.setTokens(token);
  },

  clearToken() {
    this._accessToken = null;
    this._refreshToken = null;
    delete (config.headers as any).Authorization;
    delete (config.headers as any).Cookie;
  },

  async refreshSession(): Promise<boolean> {
    if (!this._refreshToken) return false;

    if (this._refreshInFlight) {
      return this._refreshInFlight;
    }

    this._refreshInFlight = (async () => {
      try {
        const url = `${this.baseURL}/auth/refresh`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...config.headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this._refreshToken }),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {}

        if (!response.ok) {
          console.warn('🔒 Session refresh failed', {
            status: response.status,
            error: data?.error || data?.message || response.statusText,
          });
          this.clearToken();
          await this._authUpdateHandler?.(null);
          return false;
        }

        const accessToken = data?.data?.accessToken as string | undefined;
        const refreshToken = data?.data?.refreshToken as string | undefined;
        if (!accessToken || !refreshToken) {
          console.warn('🔒 Session refresh returned invalid data');
          this.clearToken();
          await this._authUpdateHandler?.(null);
          return false;
        }

        this.setTokens(accessToken, refreshToken);
        await this._authUpdateHandler?.({ accessToken, refreshToken });
        return true;
      } catch (error) {
        console.warn('🔒 Session refresh error', error);
        return false;
      } finally {
        this._refreshInFlight = null;
      }
    })();

    return this._refreshInFlight;
  },

  async request<T>(
    endpoint: string,
    options?: RequestInit,
    retryCount: number = 0,
    didRefresh: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔵 API ${options?.method || 'GET'}: ${url} (attempt ${retryCount + 1})`);

    try {
      // Add timeout to request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏱️ Request timeout after ${config.timeout}ms for ${endpoint}`);
        controller.abort();
      }, config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...config.headers,
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      const isRefreshableEndpoint = ![
        '/auth/login',
        '/auth/signup',
        '/auth/refresh',
        '/auth/google',
      ].some((p) => endpoint.startsWith(p));

      if (response.status === 401 && !didRefresh && this._refreshToken && isRefreshableEndpoint) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return (this.request as any)(endpoint, options, retryCount, true) as Promise<T>;
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || response.statusText;
        console.error('❌ API Error:', { endpoint, status: response.status, error: errorMessage, url });
        throw new ApiError(errorMessage, response.status, data);
      }

      console.log('✅ API Success:', endpoint);
      return data as T;
    } catch (error: any) {
      const isAborted = error.name === 'AbortError';
      const isApiError = error instanceof ApiError;
      const isNetworkError = !isApiError;
      const shouldRetry = (isAborted || isNetworkError) && retryCount < (config as any).maxRetries;

      console.error('❌ API Error:', {
        endpoint,
        error: error.message,
        status: isApiError ? error.status : undefined,
        isAborted,
        isNetworkError,
        shouldRetry,
        attempt: retryCount + 1,
        url,
      });

      if (shouldRetry) {
        const delay = (config as any).retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying ${endpoint} after ${delay}ms...`);
        await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
        return (this.request as any)(endpoint, options, retryCount + 1, didRefresh) as Promise<T>;
      }

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
    return this.request('/v1/auth/me', { method: 'GET' });
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
  
  async getAiInsights(weeks: number = 4) {
    return this.request(`/analytics/ai-insights?weeks=${weeks}`, { method: 'GET' });
  },
  
  async getPlateauAnalysis(weeks: number = 8, minSessions: number = 5) {
    return this.request(`/analytics/plateau?weeks=${weeks}&minSessions=${minSessions}`, { method: 'GET' });
  },

  // ===== Nutrition =====
  async getNutritionGuidance() {
    return this.request('/nutrition/guidance', { method: 'GET' });
  },
  
  // ===== Muscles / Body Map =====
  async listMuscleGroups() {
    return this.request('/muscles', { method: 'GET' });
  },
  
  async getMuscleExercises(muscleId: string) {
    return this.request(`/muscles/${muscleId}/exercises`, { method: 'GET' });
  },
  
  // ===== Favorites =====
  async listFavorites(userId: string) {
    return this.request(`/users/${userId}/favorites`, { method: 'GET' });
  },
  
  async addFavorite(userId: string, exerciseId: string) {
    return this.request(`/users/${userId}/favorites`, {
      method: 'POST',
      body: JSON.stringify({ exerciseId }),
    });
  },
  
  async removeFavorite(userId: string, exerciseId: string) {
    return this.request(`/users/${userId}/favorites`, {
      method: 'DELETE',
      body: JSON.stringify({ exerciseId }),
    });
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
  
  // ===== Recovery =====
  async getRecoveryScore() {
    return this.request('/recovery/score', { method: 'GET' });
  },
  
  async getRestDays() {
    return this.request('/recovery/rest-days', { method: 'GET' });
  },
  
  async submitSoreness(areas: Record<string, number>, notes?: string) {
    return this.request('/recovery/soreness', {
      method: 'POST',
      body: JSON.stringify({ areas, notes }),
    });
  },
  
  async generateWarmup(payload: { workoutFocus: string; type: 'warmup' | 'cooldown'; duration?: number }) {
    return this.request('/recovery/warmup-cooldown', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  
  // ===== Form Feedback =====
  async getFormFeedback(payload: { exerciseName: string; description: string; weight?: string; reps?: string }) {
    return this.request('/exercises/form-feedback', { method: 'POST', body: JSON.stringify(payload) });
  },
  
  // ===== Engagement / Progress V2 =====
  async getAchievementsEngagement() {
    return this.request('/engagement/achievements', { method: 'GET' });
  },
  
  async getProfileCompletion() {
    return this.request('/engagement/profile-completion', { method: 'GET' });
  },
  
  async updateProfileCompletion(body: Record<string, any>) {
    return this.request('/engagement/profile-completion', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  
  async getEngagementCalendar(month: number, year: number) {
    return this.request(`/engagement/calendar?month=${month}&year=${year}`, { method: 'GET' });
  },
  
  // ===== Settings =====
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
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
