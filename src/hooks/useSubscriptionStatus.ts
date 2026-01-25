/**
 * React Hook: useSubscriptionStatus
 * Get and manage user's subscription status on frontend
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface SubscriptionStatusData {
  hasAccess: boolean;
  isPremium: boolean;
  planType: 'premium' | 'premium-yearly' | 'none';
  subscriptionEndsAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  message: string;
  pendingPlanType: string | null;
  pendingPlanStartsAt: string | null;
}

export function useSubscriptionStatus(token?: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-status', token],
    queryFn: async () => {
      if (!token) return null;

      const response = await fetch('/api/user/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const result = await response.json();
      return result.data as SubscriptionStatusData;
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds - refresh faster after payment
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const hasAccess = useCallback(() => {
    return data?.hasAccess || false;
  }, [data]);

  const isPremium = useCallback(() => {
    return data?.isPremium || false;
  }, [data]);

  const canUpgrade = useCallback(() => {
    return data?.planType === 'premium' && data?.isPremium;
  }, [data]);

  return {
    subscriptionStatus: data,
    hasAccess: hasAccess(),
    isPremium: isPremium(),
    canUpgrade: canUpgrade(),
    isLoading,
    error,
    refetch,
  };
}
