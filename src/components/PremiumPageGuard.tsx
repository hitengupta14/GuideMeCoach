'use client'

import { useRouter } from 'next/navigation'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { ReactNode } from 'react'

interface PremiumPageGuardProps {
  children: ReactNode
  featureName: string
  fallback?: ReactNode
}

export function PremiumPageGuard({
  children,
  featureName,
  fallback,
}: PremiumPageGuardProps) {
  const router = useRouter()
  const { isPremium, isLoading } = useSubscriptionStatus()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="animate-pulse text-center">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-lg p-8 text-center">
            <div className="text-5xl mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Premium Feature
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {featureName} is only available for Premium members. Upgrade now to unlock AI-powered features and take your training to the next level.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pricing')}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => router.back()}
                className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
