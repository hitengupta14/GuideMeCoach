'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AIPlannerForm from '@/components/AIPlannerForm'
import CustomPlannerComponent from '@/components/CustomPlannerComponent'
import UpgradeModal from '@/components/UpgradeModal'
import { useAIQuota } from '@/hooks/useAIQuota'

function UnifiedPlannerContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'ai' | 'custom'>('ai')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { quotas } = useAIQuota()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        const data = await response.json()
        if (!response.ok || !data.user) {
          router.push('/auth/login')
          return
        }

        setUser(data.user)

        // Check if mode was specified in URL
        const modeParam = searchParams?.get('mode')
        if (modeParam === 'custom') {
          setMode('custom')
        } else if (modeParam === 'ai' && !data.user.isPremium) {
          // Show upgrade modal if free user tries to access AI planner
          setShowUpgradeModal(true)
        }
      } catch (err) {
        console.error('Session check failed:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with History Link */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">💪 Workout Planner</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose between AI-generated personalized plans or build your own custom workout routine
            </p>
          </div>
          <Link
            href="/planner/history"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            📋 View History
          </Link>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-lg shadow-lg p-1 mb-8 inline-flex w-full sm:w-auto">
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
              mode === 'ai'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:text-gray-900'
            }`}
          >
            <span className="text-xl mr-2">🤖</span>
            AI Generation
          </button>

          <button
            onClick={() => setMode('custom')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
              mode === 'custom'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:text-gray-900'
            }`}
          >
            <span className="text-xl mr-2">🎯</span>
            Custom Planner
          </button>
        </div>

        {/* Mode Descriptions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'ai'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-1">🤖 AI Generation</h3>
            <p className="text-sm text-gray-600">
              Let our AI create a personalized plan based on your goals, experience level, equipment, and medical conditions.
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'custom'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-1">🎯 Custom Planner</h3>
            <p className="text-sm text-gray-600">
              Hand-pick exercises from our library and build your own plan week by week, set by set.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <UpgradeModal
            isOpen={showUpgradeModal && mode === 'ai'}
            onClose={() => setShowUpgradeModal(false)}
            feature="planner"
          />
          {mode === 'ai' ? (
            <div className="p-8">
              <AIPlannerForm />
            </div>
          ) : (
            <div className="p-8">
              <CustomPlannerComponent />
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Exercise Selection</h3>
            <p className="text-gray-600 text-sm">
              {mode === 'ai'
                ? 'AI automatically selects exercises that match your goals and experience level'
                : 'Browse all available exercises with detailed information and form cues'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Progressive Overload</h3>
            <p className="text-gray-600 text-sm">
              {mode === 'ai'
                ? 'Built-in progression strategy to continuously challenge your muscles'
                : 'Customize sets, reps, and rest periods for progressive training'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">💾</div>
            <h3 className="font-semibold text-gray-900 mb-2">Save & Track</h3>
            <p className="text-gray-600 text-sm">
              Save your plans and track your progress over multiple weeks
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UnifiedPlannerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UnifiedPlannerContent />
    </Suspense>
  )
}
