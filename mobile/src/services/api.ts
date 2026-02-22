import { API_BASE_URL, config } from '../config/api';

type AuthTokens = { accessToken: string; refreshToken: string };
type AuthUpdateHandler = (tokens: AuthTokens | null) => Promise<void> | void;

const API_DEBUG = __DEV__ && (config as any).debug === true;
function debugLog(...args: any[]) {
  if (API_DEBUG) console.log(...args);
}
function debugWarn(...args: any[]) {
  if (API_DEBUG) console.warn(...args);
}

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
          debugWarn(' Session refresh failed', {
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
          debugWarn(' Session refresh returned invalid data');
          this.clearToken();
          await this._authUpdateHandler?.(null);
          return false;
        }

        this.setTokens(accessToken, refreshToken);
        await this._authUpdateHandler?.({ accessToken, refreshToken });
        return true;
      } catch (error) {
        debugWarn(' Session refresh error', error);
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
    debugLog(` API ${options?.method || 'GET'}: ${url} (attempt ${retryCount + 1})`);

    try {
      // Add timeout to request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        debugWarn(`⏱ Request timeout after ${config.timeout}ms for ${endpoint}`);
        controller.abort();
      }, config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: (() => {
          const merged: Record<string, any> = {
            ...(config.headers as any),
            ...(options?.headers as any),
          };

          if (this._accessToken) {
            if (!merged.Authorization) merged.Authorization = `Bearer ${this._accessToken}`;
            if (!merged.Cookie) merged.Cookie = `session=${this._accessToken}`;
          }

          const body: any = (options as any)?.body;
          const isFormData =
            typeof FormData !== 'undefined' && body && typeof body === 'object' && body instanceof FormData;
          if (isFormData) {
            // Let fetch set the correct multipart boundary.
            delete merged['Content-Type'];
          }

          return merged;
        })(),
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
        debugWarn(' API Error:', { endpoint, status: response.status, error: errorMessage, url });
        throw new ApiError(errorMessage, response.status, data);
      }

      debugLog(' API Success:', endpoint);
      return data as T;
    } catch (error: any) {
      const isAborted = error.name === 'AbortError';
      const isApiError = error instanceof ApiError;
      const isNetworkError = !isApiError;
      const shouldRetry = (isAborted || isNetworkError) && retryCount < (config as any).maxRetries;

      debugWarn(' API Error:', {
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
        debugLog(` Retrying ${endpoint} after ${delay}ms...`);
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
  async createVideoUpload(input: {
    exerciseId?: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
  }) {
    const form = new FormData();
    if (input.exerciseId) form.append('exerciseId', input.exerciseId);
    form.append('fileName', input.fileName);
    form.append('fileType', input.fileType);
    if (typeof input.fileSize === 'number' && Number.isFinite(input.fileSize)) {
      form.append('fileSize', String(input.fileSize));
    }
    return this.request('/v1/video/upload', { method: 'POST', body: form });
  },

  async getVideoAnalysis(videoId: string) {
    return this.request(`/v1/video/${videoId}`, { method: 'GET' });
  },

  async analyzeVideo(videoId: string, notes?: string) {
    return this.request(`/v1/video/${videoId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // ===== Wearables (v1) =====
  async getWearableData(days: number, provider?: string) {
    const params = new URLSearchParams({ days: String(days) });
    if (provider) params.append('provider', provider);
    const res: any = await this.request(`/v1/wearables/data?${params.toString()}`, { method: 'GET' });
    return res?.data ?? res;
  },

  async connectWearable(provider: string, authCode?: string, refreshToken?: string, state?: string) {
    return this.request('/v1/wearables/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, authCode, refreshToken, state }),
    });
  },

  async getWearableConnections() {
    return this.request('/v1/wearables/connections', { method: 'GET' });
  },

  async syncWearables(payload: { days?: number; provider?: string } = {}) {
    return this.request('/v1/wearables/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async disconnectWearable(provider: string) {
    return this.request('/v1/wearables/disconnect', {
      method: 'POST',
      body: JSON.stringify({ provider }),
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

  async cancelSubscription() {
    const res: any = await this.request('/v1/subscription/cancel', { method: 'POST' });
    return res?.data ?? res;
  },

  async getSubscriptionHistory(limit: number = 20) {
    const sp = new URLSearchParams({ limit: String(limit) });
    const res: any = await this.request(`/v1/subscription/history?${sp.toString()}`, { method: 'GET' });
    return res?.data ?? res;
  },

  async getSubscriptionPayments(limit: number = 25) {
    const sp = new URLSearchParams({ limit: String(limit) });
    const res: any = await this.request(`/v1/subscription/payments?${sp.toString()}`, { method: 'GET' });
    return res?.data ?? res;
  },

  async resumeSubscription() {
    const res: any = await this.request('/v1/subscription/resume', { method: 'POST' });
    return res?.data ?? res;
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
  async startWorkoutSession(_userId: string, dayName: string, planId?: string) {
    return this.request('/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify({ dayName, planId }),
    });
  },

  async listWorkoutSessions() {
    return this.request('/workouts/sessions', { method: 'GET' });
  },

  async getWorkoutSession(sessionId: string) {
    return this.request(`/workouts/sessions/${encodeURIComponent(sessionId)}`, { method: 'GET' });
  },

  async updateWorkoutSession(
    sessionId: string,
    updates: { duration?: number; completedAt?: string | number | Date }
  ) {
    const completedAt =
      updates.completedAt instanceof Date
        ? updates.completedAt.toISOString()
        : typeof updates.completedAt === 'number'
          ? new Date(updates.completedAt).toISOString()
          : updates.completedAt;

    return this.request(`/workouts/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        duration: typeof updates.duration === 'number' ? updates.duration : undefined,
        completedAt,
      }),
    });
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

  async saveWorkoutSet(payload: {
    sessionId: string;
    exerciseId: string;
    setNumber: number;
    completedReps?: number;
    weight?: number;
    rpe?: number;
    notes?: string;
    isWarmup?: boolean;
  }) {
    return this.request('/workouts/sets', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getWorkoutSets(sessionId: string) {
    return this.request(`/workouts/sets?sessionId=${encodeURIComponent(sessionId)}`, { method: 'GET' });
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

  async getPlan(planId: string) {
    return this.request(`/planner/plans/${encodeURIComponent(planId)}`, { method: 'GET' });
  },

  async updatePlan(
    planId: string,
    updates: { name?: string; description?: string | null; durationWeeks?: number | null; planData?: any; isActive?: boolean }
  ) {
    return this.request(`/planner/plans/${encodeURIComponent(planId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deletePlan(planId: string) {
    return this.request(`/planner/plans/${encodeURIComponent(planId)}`, { method: 'DELETE' });
  },

  // ===== Today =====
  async getToday() {
    return this.request('/today', { method: 'GET' });
  },

  // ===== Admin =====
  async adminSystemHealth() {
    return this.request('/admin/system/health', { method: 'GET' });
  },

  async adminActivityLogs(limit: number = 50) {
    const sp = new URLSearchParams({ limit: String(limit) });
    return this.request(`/admin/activity-logs?${sp.toString()}`, { method: 'GET' });
  },

  async adminAiLogs(limit: number = 50) {
    const sp = new URLSearchParams({ limit: String(limit) });
    return this.request(`/admin/ai-logs?${sp.toString()}`, { method: 'GET' });
  },

  async adminAnalyticsAiRequests() {
    return this.request('/admin/analytics/ai-requests', { method: 'GET' });
  },

  async adminAnalyticsWorkouts() {
    return this.request('/admin/analytics/workouts', { method: 'GET' });
  },

  async adminAnalyticsUserGrowth() {
    return this.request('/admin/analytics/user-growth', { method: 'GET' });
  },

  async adminGetSettings() {
    return this.request('/admin/settings', { method: 'GET' });
  },

  async adminUpdateSettings(payload: {
    maintenanceMode?: boolean;
    apiRateLimit?: number;
    maxUploadSize?: number;
    enableRegistration?: boolean;
    enableSocialAuth?: boolean;
  }) {
    return this.request('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
  },

  async adminListExercises(params: {
    reviewStatus?: 'draft' | 'approved' | 'all';
    limit?: number;
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    difficulty?: string;
  } = {}) {
    const sp = new URLSearchParams();
    if (params.reviewStatus) sp.append('reviewStatus', params.reviewStatus);
    if (params.search) sp.append('search', params.search);
    if (params.category) sp.append('category', params.category);
    if (params.difficulty) sp.append('difficulty', params.difficulty);
    if (typeof params.limit === 'number') sp.append('limit', String(params.limit));
    if (typeof params.page === 'number') sp.append('page', String(params.page));
    if (typeof params.pageSize === 'number') sp.append('pageSize', String(params.pageSize));
    const qs = sp.toString();
    return this.request(`/admin/exercises${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  async adminSetExerciseReviewStatus(exerciseId: string, reviewStatus: 'draft' | 'approved') {
    return this.request(`/admin/exercises/${encodeURIComponent(exerciseId)}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus }),
    });
  },

  async adminGetExercise(exerciseId: string) {
    return this.request(`/exercises/${encodeURIComponent(exerciseId)}`, { method: 'GET' });
  },

  async adminCreateExercise(payload: Record<string, any>) {
    return this.request('/exercises', { method: 'POST', body: JSON.stringify(payload) });
  },

  async adminUpdateExercise(exerciseId: string, payload: Record<string, any>) {
    return this.request(`/exercises/${encodeURIComponent(exerciseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteExercise(exerciseId: string) {
    return this.request(`/exercises/${encodeURIComponent(exerciseId)}`, { method: 'DELETE' });
  },

  async adminDashboardStats() {
    return this.request('/admin/dashboard/stats', { method: 'GET' });
  },

  async adminListUsers(params: {
    search?: string;
    filter?: 'all' | 'premium' | 'admin' | 'unverified' | 'blocked' | 'deleted';
    page?: number;
    pageSize?: number;
  } = {}) {
    const sp = new URLSearchParams();
    if (params.search) sp.append('search', params.search);
    if (params.filter) sp.append('filter', params.filter);
    if (typeof params.page === 'number') sp.append('page', String(params.page));
    if (typeof params.pageSize === 'number') sp.append('pageSize', String(params.pageSize));
    return this.request(`/admin/users?${sp.toString()}`, { method: 'GET' });
  },

  async adminGetUser(userId: string) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}`, { method: 'GET' });
  },

  async adminBlockUser(userId: string, reason?: string) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async adminUnblockUser(userId: string, reason?: string) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}/block`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },

  async adminDeleteUser(userId: string, payload: { reason?: string; type?: 'soft' | 'hard' } = {}) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}/delete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async adminCancelUserSubscription(userId: string, reason?: string) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}/cancel-subscription`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async adminVerifyUserEmail(userId: string, payload: { verified?: boolean; reason?: string } = {}) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}/verify-email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async adminGrantUserSubscription(
    userId: string,
    payload: { planType?: 'premium' | 'premium-yearly'; durationDays?: number; reason?: string } = {}
  ) {
    return this.request(`/admin/users/${encodeURIComponent(userId)}/grant-subscription`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async adminSubscriptions() {
    return this.request('/admin/subscriptions', { method: 'GET' });
  },

  async adminAdminUsers() {
    return this.request('/admin/admin-users', { method: 'GET' });
  },

  async adminAuditLogs(limit: number = 200) {
    const sp = new URLSearchParams({ limit: String(limit) });
    return this.request(`/admin/audit-logs?${sp.toString()}`, { method: 'GET' });
  },

  async adminMetrics(params: { day?: string; metric?: string; q?: string; limit?: number } = {}) {
    const sp = new URLSearchParams();
    if (params.day) sp.append('day', params.day);
    if (params.metric) sp.append('metric', params.metric);
    if (params.q) sp.append('q', params.q);
    if (typeof params.limit === 'number') sp.append('limit', String(params.limit));
    return this.request(`/admin/metrics?${sp.toString()}`, { method: 'GET' });
  },

  async adminAiMonitoringStats() {
    return this.request('/admin/ai-monitoring/stats', { method: 'GET' });
  },

  async adminEmailCampaigns() {
    return this.request('/admin/emails/campaigns', { method: 'GET' });
  },

  async adminSendEmailCampaign(payload: {
    name: string;
    subject: string;
    content: string;
    audience: { segment: 'all' | 'premium' | 'inactive' | 'new_users'; days?: number };
  }) {
    return this.request('/admin/emails/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
