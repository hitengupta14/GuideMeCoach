'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { csrfFetch } from '@/lib/csrf-client'

type Session = {
  id: string
  dayName: string
  duration: number
  completedAt: string
  planId: string | null
}

type Log = {
  id: string
  exerciseId: string
  exerciseName: string
  plannedSets: number | null
  completedSets: number | null
  plannedReps: string | null
  completedReps: string | null
  weight: number | null
  rpe: number | null
  notes: string | null
}

type SetRow = {
  id?: string
  sessionId: string
  exerciseId: string
  exerciseName: string
  isWarmup: boolean
  setNumber: number
  completedReps: number | null
  weight: number | null
  rpe: number | null
  notes: string | null
  performedAt?: string | null
}

type LocalSummary = {
  sessionId: string
  dayName: string
  planId?: string
  duration: number
  completedAt: string
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    plannedSets: number
    plannedReps: string
    sets: Array<{
      setNumber: number
      isWarmup: boolean
      completedReps: number
      weight?: number
      rpe?: number
      notes?: string
    }>
  }>
}

function sumReps(reps: string | null | undefined): number | null {
  if (!reps) return null
  const cleaned = reps
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (cleaned.length <= 1) return null
  const nums = cleaned.map((s) => Number(s)).filter((n) => Number.isFinite(n))
  if (nums.length !== cleaned.length) return null
  return nums.reduce((a, b) => a + b, 0)
}

function parseRepRange(input: string | null | undefined): { min: number; max: number } | null {
  if (!input) return null
  const s = input.replace(/–/g, '-')
  const nums = s.match(/\d+/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n)) as number[] | undefined
  if (!nums || nums.length === 0) return null
  if (nums.length === 1) return { min: nums[0], max: nums[0] }
  // Prefer first two numbers (e.g. "8-12")
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) }
}

function loadLocalSummary(sessionId: string): LocalSummary | null {
  try {
    const raw = localStorage.getItem(`workoutLocalSummary:v1:${sessionId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.sessionId !== sessionId) return null
    return parsed as LocalSummary
  } catch {
    return null
  }
}

function deriveFromLocalSummary(summary: LocalSummary): {
  session: Session
  logs: Log[]
  sets: SetRow[]
} {
  const session: Session = {
    id: summary.sessionId,
    dayName: summary.dayName,
    duration: summary.duration,
    completedAt: summary.completedAt,
    planId: summary.planId || null,
  }

  const sets: SetRow[] = summary.exercises.flatMap((ex) =>
    ex.sets.map((s) => ({
      sessionId: summary.sessionId,
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      isWarmup: Boolean(s.isWarmup),
      setNumber: s.setNumber,
      completedReps: typeof s.completedReps === 'number' ? s.completedReps : null,
      weight: typeof s.weight === 'number' ? s.weight : null,
      rpe: typeof s.rpe === 'number' ? s.rpe : null,
      notes: typeof s.notes === 'string' ? s.notes : null,
    }))
  )

  const logs: Log[] = summary.exercises
    .map((ex) => {
      const working = ex.sets.filter((s) => !s.isWarmup && typeof s.completedReps === 'number')
      if (working.length === 0) return null

      const repsList = working.map((s) => String(s.completedReps)).join(',')
      const weights = working.map((s) => (typeof s.weight === 'number' ? s.weight : null)).filter((n): n is number => n !== null)
      const rpes = working.map((s) => (typeof s.rpe === 'number' ? s.rpe : null)).filter((n): n is number => n !== null)
      const notes = working.map((s) => s.notes).filter(Boolean).join('\n').slice(0, 2000) || null

      const weight = weights.length ? Math.max(...weights) : null
      const rpe = rpes.length ? Math.round(rpes.reduce((a, b) => a + b, 0) / rpes.length) : null

      return {
        id: `${summary.sessionId}:${ex.exerciseId}`,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        plannedSets: ex.plannedSets,
        completedSets: working.length,
        plannedReps: ex.plannedReps,
        completedReps: repsList || null,
        weight,
        rpe,
        notes,
      } satisfies Log
    })
    .filter(Boolean) as Log[]

  return { session, logs, sets }
}

export default function WorkoutSummaryPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params?.sessionId as string
  const { isLoading: sessionLoading } = useSession({ required: true })

  const [session, setSession] = useState<Session | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [sets, setSets] = useState<SetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offlineSummary, setOfflineSummary] = useState(false)

  const [pain, setPain] = useState<Record<string, number>>({
    shoulder: 0,
    elbow: 0,
    wrist: 0,
    lower_back: 0,
    hip: 0,
    knee: 0,
    ankle: 0,
    neck: 0,
  })
  const [redFlags, setRedFlags] = useState<Record<string, boolean>>({
    chest_pain: false,
    dizziness: false,
    numbness_tingling: false,
    sharp_radiating_pain: false,
    swelling: false,
    unusual_weakness: false,
  })
  const [painNotes, setPainNotes] = useState('')
  const [painSubmitting, setPainSubmitting] = useState(false)
  const [painSaved, setPainSaved] = useState(false)
  const [painError, setPainError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        setOfflineSummary(false)

        const [sessionRes, logsRes, setsRes] = await Promise.all([
          fetch(`/api/workouts/sessions/${sessionId}`, { credentials: 'include' }),
          fetch(`/api/workouts/logs?sessionId=${encodeURIComponent(sessionId)}`, { credentials: 'include' }),
          fetch(`/api/workouts/sets?sessionId=${encodeURIComponent(sessionId)}`, { credentials: 'include' }),
        ])

        const sessionJson = await sessionRes.json().catch(() => null)
        const logsJson = await logsRes.json().catch(() => null)
        const setsJson = await setsRes.json().catch(() => null)

        if (!sessionRes.ok) throw new Error(sessionJson?.error || 'Failed to load session')
        if (!logsRes.ok) throw new Error(logsJson?.error || 'Failed to load logs')
        if (!setsRes.ok) throw new Error(setsJson?.error || 'Failed to load sets')

        setSession(sessionJson as Session)
        setLogs(Array.isArray(logsJson) ? (logsJson as Log[]) : [])
        setSets(Array.isArray(setsJson) ? (setsJson as SetRow[]) : [])
      } catch (e) {
        const offlineParam = searchParams?.get('offline') === '1'
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
        if (offlineParam || isOffline) {
          const local = loadLocalSummary(sessionId)
          if (local) {
            const derived = deriveFromLocalSummary(local)
            setSession(derived.session)
            setLogs(derived.logs)
            setSets(derived.sets)
            setOfflineSummary(true)
            setError(null)
            return
          }
        }

        setError(e instanceof Error ? e.message : 'Failed to load summary')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const stats = useMemo(() => {
    const exercises = logs.length
    const volumeFromSets =
      sets.length > 0
        ? sets.reduce((sum, s) => {
            if (s.isWarmup) return sum
            if (!s.weight || !s.completedReps) return sum
            return sum + s.weight * s.completedReps
          }, 0)
        : null

    const volume =
      typeof volumeFromSets === 'number'
        ? volumeFromSets
        : logs.reduce((sum, l) => {
            const reps = sumReps(l.completedReps)
            if (!reps || !l.weight) return sum
            return sum + reps * l.weight
          }, 0)

    return { exercises, volume }
  }, [logs, sets])

  const progressionSuggestions = useMemo(() => {
    if (!logs.length || !sets.length) return []

    const byExercise = new Map<string, SetRow[]>()
    for (const s of sets) {
      const list = byExercise.get(s.exerciseId) || []
      list.push(s)
      byExercise.set(s.exerciseId, list)
    }

    const suggestions: Array<{
      exerciseId: string
      exerciseName: string
      title: string
      detail: string
    }> = []

    for (const l of logs) {
      const repRange = parseRepRange(l.plannedReps)
      const exSets = (byExercise.get(l.exerciseId) || [])
        .filter((s) => !s.isWarmup)
        .filter((s) => typeof s.completedReps === 'number' && s.completedReps > 0)

      if (!repRange || exSets.length === 0) continue

      const weights = exSets.map((s) => (typeof s.weight === 'number' ? s.weight : null)).filter((n): n is number => n !== null)
      if (weights.length === 0) continue

      const top = repRange.max
      const bottom = repRange.min
      const avgRpe = (() => {
        const rpes = exSets.map((s) => (typeof s.rpe === 'number' ? s.rpe : null)).filter((n): n is number => n !== null)
        if (!rpes.length) return null
        return rpes.reduce((a, b) => a + b, 0) / rpes.length
      })()

      const workingWeight = Math.max(...weights)
      const inc = workingWeight >= 20 ? 2.5 : 1
      const allAtTop = exSets.every((s) => (s.completedReps || 0) >= top)
      const anyBelowBottom = exSets.some((s) => (s.completedReps || 0) < bottom)

      if (allAtTop && (avgRpe === null || avgRpe <= 8)) {
        suggestions.push({
          exerciseId: l.exerciseId,
          exerciseName: l.exerciseName,
          title: `Add weight next time (+${inc} kg)`,
          detail: `You hit the top of your rep range. Try ${workingWeight + inc} kg and stay in ${bottom}-${top} reps.`,
        })
      } else if (anyBelowBottom && avgRpe !== null && avgRpe >= 9) {
        suggestions.push({
          exerciseId: l.exerciseId,
          exerciseName: l.exerciseName,
          title: 'Back off slightly',
          detail: `You fell below the rep range at high effort. Consider reducing to ${Math.max(0, workingWeight - inc)} kg and aim for ${bottom}-${top} reps.`,
        })
      } else {
        suggestions.push({
          exerciseId: l.exerciseId,
          exerciseName: l.exerciseName,
          title: 'Add reps before adding weight',
          detail: `Keep ${workingWeight} kg and try to add 1 rep across your sets (within ${bottom}-${top}).`,
        })
      }
    }

    return suggestions
  }, [logs, sets])

  const painSummary = useMemo(() => {
    const maxPain = Math.max(...Object.values(pain))
    const selectedFlags = Object.entries(redFlags)
      .filter(([, v]) => v)
      .map(([k]) => k)
    return { maxPain, selectedFlags }
  }, [pain, redFlags])

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary…</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Summary</h1>
          <p className="text-red-700 font-semibold">Couldn’t load this workout.</p>
          <p className="text-red-700 text-sm mt-1">{error || 'Unknown error'}</p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/today"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Back to Today
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {offlineSummary ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-900">
            <div className="font-semibold">Offline summary</div>
            <div className="text-sm mt-1">
              Your workout is saved on this device. It’ll sync when you’re back online.
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-700">Workout Complete</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{session.dayName}</h1>
              <p className="text-gray-600 mt-2">
                {new Date(session.completedAt).toLocaleString()} • {session.duration} min • {stats.exercises} exercises
              </p>
              {stats.volume > 0 ? (
                <p className="text-gray-500 text-sm mt-1">Estimated volume: {Math.round(stats.volume)} kg-reps</p>
              ) : null}
            </div>
            <Link
              href="/today"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Today
            </Link>
          </div>
        </div>

        {progressionSuggestions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Next Time Suggestions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Based on what you actually lifted today (working sets only).
            </p>
            <div className="space-y-3">
              {progressionSuggestions.map((s) => (
                <div key={s.exerciseId} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="font-bold text-gray-900">{s.exerciseName}</div>
                  <div className="text-sm font-semibold text-indigo-700 mt-1">{s.title}</div>
                  <div className="text-sm text-gray-700 mt-1">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What You Logged</h2>
          {logs.length === 0 ? (
            <p className="text-gray-600">No exercise logs were recorded.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{l.exerciseName}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {l.completedSets ?? l.plannedSets ?? '–'} sets •{' '}
                        {l.completedReps ?? l.plannedReps ?? '–'} reps
                        {l.weight ? ` • ${l.weight} kg` : ''}
                        {l.rpe ? ` • RPE ${l.rpe}` : ''}
                      </div>
                      {l.notes ? <div className="text-sm text-gray-600 mt-2 italic">{l.notes}</div> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pain & Red Flag Check-in</h2>
              <p className="text-sm text-gray-600 mt-1">
                Optional, but powerful — helps the app keep you training safely.
              </p>
            </div>
            <Link
              href="/medical-disclaimer"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Medical disclaimer
            </Link>
          </div>

          {painSaved ? (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
              Saved. Thanks — we’ll use this to recommend safer options and recovery guidance.
            </div>
          ) : null}

          {painError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
              {painError}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'shoulder', label: 'Shoulder' },
              { key: 'elbow', label: 'Elbow' },
              { key: 'wrist', label: 'Wrist' },
              { key: 'lower_back', label: 'Lower back' },
              { key: 'hip', label: 'Hip' },
              { key: 'knee', label: 'Knee' },
              { key: 'ankle', label: 'Ankle' },
              { key: 'neck', label: 'Neck' },
            ].map((j) => (
              <div key={j.key} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{j.label}</div>
                  <div className="text-sm font-bold text-indigo-700">{pain[j.key] ?? 0}/10</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={pain[j.key] ?? 0}
                  onChange={(e) =>
                    setPain((prev) => ({ ...prev, [j.key]: Number(e.target.value) }))
                  }
                  className="w-full mt-3"
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="font-semibold text-gray-900">Red flags (check any)</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-800">
              {[
                { key: 'chest_pain', label: 'Chest pain or pressure' },
                { key: 'dizziness', label: 'Dizziness / faintness' },
                { key: 'numbness_tingling', label: 'Numbness / tingling' },
                { key: 'sharp_radiating_pain', label: 'Sharp or radiating pain' },
                { key: 'swelling', label: 'Swelling / sudden inflammation' },
                { key: 'unusual_weakness', label: 'Unusual weakness or loss of strength' },
              ].map((f) => (
                <label key={f.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(redFlags[f.key])}
                    onChange={(e) =>
                      setRedFlags((prev) => ({ ...prev, [f.key]: e.target.checked }))
                    }
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={painNotes}
              onChange={(e) => setPainNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="e.g., right knee felt sharp on squats"
              maxLength={2000}
            />
          </div>

          {painSummary.selectedFlags.length > 0 || painSummary.maxPain >= 7 ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
              <div className="font-semibold">Safety note</div>
              <div className="text-sm mt-1">
                If you’re experiencing red flags or severe pain, stop training and seek professional medical advice.
              </div>
            </div>
          ) : painSummary.maxPain >= 4 ? (
            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
              <div className="font-semibold">Training adjustment</div>
              <div className="text-sm mt-1">
                Consider reducing load, shortening range of motion, or using safer alternatives for any painful joint.
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              onClick={async () => {
                try {
                  setPainSubmitting(true)
                  setPainError(null)
                  setPainSaved(false)

                  if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    setPainError('You’re offline. Reconnect to save this check-in.')
                    return
                  }

                  const selectedFlags = Object.entries(redFlags)
                    .filter(([, v]) => v)
                    .map(([k]) => k)

                  const res = await csrfFetch('/api/recovery/pain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId,
                      joints: pain,
                      redFlags: selectedFlags,
                      notes: painNotes || undefined,
                    }),
                  })
                  const json = await res.json().catch(() => null)
                  if (!res.ok) throw new Error(json?.error || 'Failed to save pain check-in')

                  setPainSaved(true)
                } catch (e) {
                  setPainError(e instanceof Error ? e.message : 'Failed to save pain check-in')
                } finally {
                  setPainSubmitting(false)
                }
              }}
              disabled={painSubmitting || painSaved}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {painSaved ? 'Saved' : painSubmitting ? 'Saving…' : 'Save Check-in'}
            </button>
            <Link
              href="/profile"
              className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold"
            >
              Update Medical Profile
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/recovery"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border border-gray-200"
          >
            <div className="text-lg font-bold text-gray-900">Recovery</div>
            <div className="text-sm text-gray-600 mt-1">Log soreness + see rest guidance.</div>
          </Link>
          <Link
            href="/progress"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border border-gray-200"
          >
            <div className="text-lg font-bold text-gray-900">Progress</div>
            <div className="text-sm text-gray-600 mt-1">Streak, workouts, and trends.</div>
          </Link>
          <Link
            href="/today"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border border-gray-200"
          >
            <div className="text-lg font-bold text-gray-900">Next Workout</div>
            <div className="text-sm text-gray-600 mt-1">Back to Today’s workout.</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
