'use client'

import { useEffect, useState } from 'react'
import { Loader, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { csrfFetch } from '@/lib/csrf-client'

interface WorkoutStat {
  totalWorkouts: number
  avgDuration: number
  avgEnergyLevel: number
  exercisesTracked: number
  topExercises: string[]
}

interface InsightsPeriod {
  weeks: number
  from: string
  to: string
}

export default function ProgressInsightsComponent({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<string | null>(null)
  const [stats, setStats] = useState<WorkoutStat | null>(null)
  const [period, setPeriod] = useState<InsightsPeriod | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weeksBack, setWeeksBack] = useState(4)
  const [showEmailOption, setShowEmailOption] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [plateaus, setPlateaus] = useState<
    Array<{
      exerciseName: string
      sessionsAnalyzed: number
      streak: number
      lastMaxWeight: number
      lastAvgReps: number
      trend: 'flat' | 'decline' | 'improving'
      recommendation: string
    }>
  >([])
  const [plateauPeriod, setPlateauPeriod] = useState<{ from: string; to: string } | null>(null)

  const fetchInsights = async (weeks: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics/ai-insights?weeks=${weeks}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      const normalizedInsights =
        typeof data.insights === 'string'
          ? data.insights
          : data.insights
          ? [
              data.insights.summary,
              ...(data.insights.strengths || []).map((s: string) => `- Strength: ${s}`),
              ...(data.insights.improvements || []).map((s: string) => `- Improvement: ${s}`),
              ...(data.insights.recommendations || []).map((s: string) => `- Recommendation: ${s}`),
              ...(data.insights.trends || []).map((s: string) => `- Trend: ${s}`),
              ...(data.insights.plateauRisks || []).map((s: string) => `- Plateau Risk: ${s}`),
            ]
              .filter(Boolean)
              .join('\n')
          : ''

      setInsights(normalizedInsights || null)
      setStats(data.stats)
      setPeriod(data.period)

      // Fetch plateau analysis in parallel
      const plateauResp = await fetch(`/api/analytics/plateau?weeks=${weeks}`, {
        credentials: 'include',
      })
      if (plateauResp.ok) {
        const plateauData = await plateauResp.json()
        setPlateaus(plateauData.plateaus || [])
        setPlateauPeriod(plateauData.period || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sendEmailSummary = async () => {
    try {
      setEmailSending(true)
      const response = await csrfFetch('/api/analytics/email-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weeksBack }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      alert('Progress summary sent to your email!')
      setShowEmailOption(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setEmailSending(false)
    }
  }

  useEffect(() => {
    fetchInsights(weeksBack)
  }, [weeksBack])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Progress Insights</h2>
          {period && (
            <p className="text-gray-600 mt-1">
              Last {period.weeks} weeks • {new Date(period.from).toLocaleDateString()} to{' '}
              {new Date(period.to).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={weeksBack}
            onChange={(e) => setWeeksBack(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={2}>Last 2 weeks</option>
            <option value={4}>Last 4 weeks</option>
            <option value={8}>Last 8 weeks</option>
            <option value={12}>Last 12 weeks</option>
          </select>

          <button
            onClick={() => setShowEmailOption(!showEmailOption)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            📧 Email Summary
          </button>
        </div>
      </div>

      {/* Email Option */}
      {showEmailOption && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 mb-3">Send this progress summary to your email?</p>
          <div className="flex gap-2">
            <button
              onClick={sendEmailSummary}
              disabled={emailSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {emailSending ? 'Sending...' : 'Send Email'}
            </button>
            <button
              onClick={() => setShowEmailOption(false)}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Workouts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalWorkouts}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Math.round(stats.avgDuration)}m
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Energy Level</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Math.round(stats.avgEnergyLevel)}/10
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Exercises</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.exercisesTracked}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Top Exercise</p>
                <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                  {stats.topExercises[0] || 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Zap className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <h3 className="text-lg font-bold text-gray-900">AI Analysis</h3>
          </div>

          <div className="prose prose-sm max-w-none text-gray-800 space-y-4">
            {insights.split('\n').map((line, idx) => {
              // Check if this is a premium-locked feature line
              const isPremiumLocked = line.includes('🔒 Upgrade to Premium')
              
              if (line.startsWith('#')) {
                return (
                  <h4 key={idx} className="font-bold text-gray-900 mt-4 mb-2">
                    {line.replace(/^#+\s*/, '')}
                  </h4>
                )
              } else if (line.startsWith('-') || line.startsWith('•')) {
                const content = line.replace(/^[-•]\s*/, '')
                return (
                  <div key={idx} className={`flex gap-2 ml-4 ${isPremiumLocked ? 'items-center' : ''}`}>
                    <span className={`font-bold ${isPremiumLocked ? 'text-yellow-600' : 'text-indigo-600'}`}>
                      {isPremiumLocked ? '🔒' : '•'}
                    </span>
                    <p className={isPremiumLocked ? 'font-medium text-gray-900' : ''}>
                      {content}
                    </p>
                  </div>
                )
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={idx} className="font-bold text-gray-900">
                    {line.replace(/\*\*/g, '')}
                  </p>
                )
              } else if (line.trim()) {
                return (
                  <p key={idx} className="text-gray-800">
                    {line}
                  </p>
                )
              }
              return null
            })}
            
            {/* Check if insights contain premium upgrade message */}
            {insights.includes('🔒 Upgrade to Premium') && (
              <div className="mt-6 pt-6 border-t border-indigo-200">
                <a
                  href="/pricing"
                  className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Unlock AI-Powered Insights with Premium
                </a>
                <p className="text-center text-gray-600 text-sm mt-2">
                  Get personalized recommendations, plateau detection, and adaptive workout suggestions
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plateau Warnings */}
      {plateaus && plateaus.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Plateau Warnings</h3>
              {plateauPeriod && (
                <p className="text-gray-700 text-sm">{new Date(plateauPeriod.from).toLocaleDateString()} → {new Date(plateauPeriod.to).toLocaleDateString()}</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {plateaus.slice(0, 5).map((p, idx) => (
              <div key={idx} className="bg-white border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{p.exerciseName}</p>
                    <p className="text-gray-700 text-sm mt-1">Trend: {p.trend} • Sessions: {p.sessionsAnalyzed} • Streak: {p.streak}</p>
                    <p className="text-gray-700 text-sm mt-1">Last: {p.lastMaxWeight}kg • Avg Reps: {p.lastAvgReps}</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-gray-800 text-sm mt-3">{p.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
            <p className="text-red-800 text-sm mt-1">
              Make sure you've logged some workouts to see insights.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
