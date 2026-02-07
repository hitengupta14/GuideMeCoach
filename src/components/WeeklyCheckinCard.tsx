'use client'

import { useEffect, useMemo, useState } from 'react'
import { csrfFetch } from '@/lib/csrf-client'

type WeeklyCheckinRow = {
  id: string
  weekStart: string | null
  feltStrongerOrLighter: boolean
  planEasyToFollow: number
  hadPainOrDiscomfort: boolean
  adjustments?: {
    shouldDeload: boolean
    volumeChange: number
    intensityChange: string
    reason: string
  } | null
  performanceData?: {
    averageRPE: number
    averageEnergy: number
    completionRate: number
    missedWorkouts: number
  } | null
}

export default function WeeklyCheckinCard() {
  const [feltStrongerOrLighter, setFeltStrongerOrLighter] = useState(true)
  const [planEasyToFollow, setPlanEasyToFollow] = useState(4)
  const [hadPainOrDiscomfort, setHadPainOrDiscomfort] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<WeeklyCheckinRow[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const weekLabel = useMemo(() => {
    const d = new Date()
    // Display current week range (Mon-Sun)
    const day = d.getDay() // local
    const diffToMon = (day + 6) % 7
    const mon = new Date(d)
    mon.setDate(d.getDate() - diffToMon)
    mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return `${mon.toLocaleDateString()} – ${sun.toLocaleDateString()}`
  }, [])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/feedback/weekly-checkin/history?limit=12', {
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success && Array.isArray(json?.data)) {
        setHistory(json.data)
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    setSubmitting(true)
    setResultMessage(null)
    setError(null)
    try {
      const res = await csrfFetch('/api/feedback/weekly-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feltStrongerOrLighter,
          planEasyToFollow,
          hadPainOrDiscomfort,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Failed to submit check-in')
      setResultMessage(typeof json?.message === 'string' ? json.message : 'Check-in saved.')
      await loadHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit check-in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mb-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Weekly Check-in</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Week of {weekLabel}</p>
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Save check-in'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Felt stronger / lighter?</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setFeltStrongerOrLighter(true)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold border ${
                feltStrongerOrLighter
                  ? 'bg-green-600 text-white border-green-700'
                  : 'bg-white/70 dark:bg-slate-900/40 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setFeltStrongerOrLighter(false)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold border ${
                !feltStrongerOrLighter
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white/70 dark:bg-slate-900/40 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
              }`}
            >
              No
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Plan easy to follow (1–5)</p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={planEasyToFollow}
              onChange={(e) => setPlanEasyToFollow(Number(e.target.value))}
              className="w-full"
            />
            <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">{planEasyToFollow}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">1 = hard, 5 = very easy</p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Pain or discomfort?</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setHadPainOrDiscomfort(true)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold border ${
                hadPainOrDiscomfort
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-white/70 dark:bg-slate-900/40 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setHadPainOrDiscomfort(false)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold border ${
                !hadPainOrDiscomfort
                  ? 'bg-green-600 text-white border-green-700'
                  : 'bg-white/70 dark:bg-slate-900/40 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>

      {(resultMessage || error) && (
        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200'
              : 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200'
          }`}
        >
          {error || resultMessage}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">History</h3>
        {loadingHistory ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No check-ins yet.</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 6).map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/30 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {row.weekStart ? new Date(row.weekStart).toLocaleDateString() : 'Week'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Easy: {row.planEasyToFollow}/5 • Pain: {row.hadPainOrDiscomfort ? 'Yes' : 'No'}
                  </p>
                </div>
                {row.adjustments?.reason && (
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">{row.adjustments.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

