import { useCallback, useEffect, useState } from 'react'
import type { AIFeature } from '@/lib/ai-quota'

interface QuotaInfo {
  feature: AIFeature
  used: number
  limit: number
  remaining: number
  resetAt: Date
}

interface UserQuotas {
  isPremium: boolean
  quotas: QuotaInfo[]
}

/**
 * Hook to fetch and manage user quotas/subscription
 * Shows upgrade modal for free users trying to access AI features
 */
export function useAIQuota() {
  const [quotas, setQuotas] = useState<UserQuotas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch quotas on mount
  useEffect(() => {
    async function fetchQuotas() {
      try {
        setLoading(true)
        const response = await fetch('/api/user/quotas', { credentials: 'include' })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to access AI features')
            return
          }
          throw new Error('Failed to fetch quotas')
        }

        const data = await response.json()
        setQuotas(data)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
        setQuotas(null)
      } finally {
        setLoading(false)
      }
    }

    fetchQuotas()
  }, [])

  /**
   * Check if user can access an AI feature
   * Returns { canAccess: boolean, message: string }
   */
  const canAccessFeature = useCallback(
    (feature: AIFeature) => {
      if (!quotas) {
        return {
          canAccess: false,
          message: 'Unable to verify subscription. Please try again.',
        }
      }

      // Free users cannot access any AI features
      if (!quotas.isPremium) {
        return {
          canAccess: false,
          message: 'Upgrade to Premium to access AI features',
        }
      }

      // Find quota for this feature
      const featureQuota = quotas.quotas.find((q) => q.feature === feature)
      if (!featureQuota) {
        return {
          canAccess: false,
          message: 'Feature not available',
        }
      }

      // Check if quota exceeded
      if (featureQuota.remaining <= 0) {
        return {
          canAccess: false,
          message: `${feature} quota exceeded. Resets on ${new Date(featureQuota.resetAt).toLocaleDateString()}`,
        }
      }

      return {
        canAccess: true,
        message: `${featureQuota.remaining} uses remaining this month`,
      }
    },
    [quotas]
  )

  /**
   * Get remaining quota for a feature
   */
  const getRemaining = useCallback(
    (feature: AIFeature): number => {
      if (!quotas) return 0

      const featureQuota = quotas.quotas.find((q) => q.feature === feature)
      return featureQuota?.remaining || 0
    },
    [quotas]
  )

  /**
   * Refresh quotas (call after using an AI feature)
   */
  const refreshQuotas = useCallback(async () => {
    try {
      const response = await fetch('/api/user/quotas', { credentials: 'include' })

      if (response.ok) {
        const data = await response.json()
        setQuotas(data)
      }
    } catch (err) {
      console.error('Failed to refresh quotas:', err)
    }
  }, [])

  return {
    quotas,
    loading,
    error,
    canAccessFeature,
    getRemaining,
    refreshQuotas,
  }
}
