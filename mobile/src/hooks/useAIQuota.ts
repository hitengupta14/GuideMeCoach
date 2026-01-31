import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export interface AIQuota {
  planner: number;
  chat: number;
  insights: number;
  edits: number;
  resetDate: string;
}

export interface UseAIQuotaResult {
  quotas: AIQuota | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  canAccessFeature: (feature: keyof Omit<AIQuota, 'resetDate'>) => boolean;
  getRemaining: (feature: keyof Omit<AIQuota, 'resetDate'>) => number;
}

/**
 * Hook to manage AI feature quotas
 * 
 * Fetches user's remaining AI feature usage quotas from the API
 * and provides utilities to check feature access
 */
export function useAIQuota(): UseAIQuotaResult {
  const [quotas, setQuotas] = useState<AIQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuotas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await apiClient.request('/api/user/quotas', {
        method: 'GET',
      });

      if (response?.quotas) {
        setQuotas(response.quotas);
      } else {
        // Fallback to free tier if no quotas returned
        setQuotas({
          planner: 0,
          chat: 0,
          insights: 0,
          edits: 0,
          resetDate: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to fetch AI quotas:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch quotas'));
      
      // Set to zero on error to be safe
      setQuotas({
        planner: 0,
        chat: 0,
        insights: 0,
        edits: 0,
        resetDate: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  const canAccessFeature = useCallback(
    (feature: keyof Omit<AIQuota, 'resetDate'>): boolean => {
      if (!quotas) return false;
      return quotas[feature] > 0;
    },
    [quotas]
  );

  const getRemaining = useCallback(
    (feature: keyof Omit<AIQuota, 'resetDate'>): number => {
      if (!quotas) return 0;
      return quotas[feature] || 0;
    },
    [quotas]
  );

  return {
    quotas,
    loading,
    error,
    refetch: fetchQuotas,
    canAccessFeature,
    getRemaining,
  };
}
