'use client'

import { useRouter } from 'next/navigation'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { ReactNode } from 'react'

interface PremiumFeatureGuardProps {
  children: ReactNode
  featureName: string
  showModal?: boolean
}

export function PremiumFeatureGuard({
  children,
  featureName,
  showModal = true,
}: PremiumFeatureGuardProps) {
  const router = useRouter()
  const { isPremium, isLoading } = useSubscriptionStatus(typeof window !== 'undefined' ? localStorage.getItem('token') : null)

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-10" />
  }

  if (!isPremium) {
    if (showModal) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-6">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Premium Feature
          </h3>
          <p className="text-amber-800 dark:text-amber-200 mb-4">
            {featureName} is only available for Premium members. Upgrade now to unlock AI-powered features.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}
