/**
 * Centralized Session Management Hook
 * 
 * Replaces duplicate session fetching across 22+ pages
 * Uses React Query for automatic caching and deduplication
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export interface SessionUser {
  id: string
  name: string | null
  email: string
  height: number | null
  weight: number | null
  age: number | null
  gender: string | null
  experienceLevel: string | null
  goals: string[] | null
  medicalConditions: string[] | null
  availableEquipment: string[] | null
  timeAvailability: number | null
  preferredLocation: string | null
  weakAreas: string[] | null
  painAreas: string[] | null
  currentWeight: number | null
  targetWeight: number | null
  isPremium: boolean
  subscriptionEndsAt: Date | null
  isAdmin?: boolean
}

export interface UseSessionReturn {
  user: SessionUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
  refetch: () => void
}

export function useSession(options?: {
  required?: boolean
  redirectTo?: string
}): UseSessionReturn {
  const router = useRouter()
  const redirectTo = options?.redirectTo || '/auth/login'
  const required = options?.required ?? true

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Not authenticated')
      }

      const result = await response.json()
      return result.user as SessionUser
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - balance freshness with performance
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  // Auto-redirect on authentication failure
  useEffect(() => {
    if (required && error && !isLoading) {
      router.push(redirectTo)
    }
  }, [error, isLoading, required, router, redirectTo])

  return {
    user: data || null,
    isLoading,
    isAuthenticated: !!data,
    error: error as Error | null,
    refetch,
  }
}

/**
 * Hook for pages that don't require authentication
 * Won't redirect if user is not logged in
 */
export function useOptionalSession(): UseSessionReturn {
  return useSession({ required: false })
}
