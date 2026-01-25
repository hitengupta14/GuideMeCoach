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
    staleTime: 2 * 60 * 1000, // 2 minutes (was 30 seconds) - reasonable for subscription data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on every tab focus (was true)
    refetchOnMount: true, // Refetch on mount to ensure fresh subscription status
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
