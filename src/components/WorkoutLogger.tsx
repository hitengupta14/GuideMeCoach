'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PlannedExercise {
  exerciseName: string
  exerciseId: string
  sets: number
  reps: string
  restSeconds?: number
}

interface WorkoutLoggerProps {
  planExercises: PlannedExercise[]
  dayName?: string
  planId?: string
}

type SetEntry = {
  setNumber: number
  isWarmup: boolean
  reps: string
  weight: string
  rpe: string
  notes: string
  saved: boolean
  pending: boolean
  saving: boolean
}

function formatSeconds(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function WorkoutLogger({ planExercises, dayName, planId }: WorkoutLoggerProps) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [sessionStartTime] = useState(new Date())

  const QUEUE_KEY = 'workoutSyncQueue:v1'
  const LOCAL_SUMMARY_KEY_PREFIX = 'workoutLocalSummary:v1:'

  type QueuedRequest = {
    id: string
    url: string
    method: 'POST' | 'PUT'
    body: any
    createdAt: number
  }

  const [isOnline, setIsOnline] = useState(true)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [finishingWorkout, setFinishingWorkout] = useState(false)

  type LocalSummarySet = {
    setNumber: number
    isWarmup: boolean
    completedReps: number
    weight?: number
    rpe?: number
    notes?: string
  }

  type LocalSummaryExercise = {
    exerciseId: string
    exerciseName: string
    plannedSets: number
    plannedReps: string
    sets: LocalSummarySet[]
  }

  type LocalSummary = {
    sessionId: string
    dayName: string
    planId?: string
    duration: number
    completedAt: string
    exercises: LocalSummaryExercise[]
  }

  const [workoutExercises, setWorkoutExercises] = useState<PlannedExercise[]>(planExercises)
  const [swapOpen, setSwapOpen] = useState(false)
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapOptions, setSwapOptions] = useState<
    Array<{
      type: string
      alternativeId: string
      name: string
      slug: string
      difficulty: string
      equipment: string[]
      location: string
    }>
  >([])

  const [exerciseSets, setExerciseSets] = useState<SetEntry[][]>(() =>
    planExercises.map((ex) =>
      Array.from({ length: Math.max(1, ex.sets) }, (_, i) => ({
        setNumber: i + 1,
        isWarmup: false,
        reps: '',
        weight: '',
        rpe: '',
        notes: '',
        saved: false,
        pending: false,
        saving: false,
      }))
    )
  )

  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [restRunning, setRestRunning] = useState(false)

  const [suggestions, setSuggestions] = useState<any | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [workingWeights, setWorkingWeights] = useState<string[]>(() => planExercises.map(() => ''))

  const readQueue = (): QueuedRequest[] => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as QueuedRequest[]) : []
    } catch {
      return []
    }
  }

  const writeQueue = (queue: QueuedRequest[]) => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
      setPendingSyncCount(queue.length)
    } catch {
      // If storage fails, we still allow the workout to continue, but sync may be lost.
    }
  }

  const enqueueRequest = (url: string, method: QueuedRequest['method'], body: any) => {
    const q = readQueue()
    q.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url,
      method,
      body,
      createdAt: Date.now(),
    })
    writeQueue(q)
  }

  const markSetPendingByPayload = (payload: { exerciseId: string; isWarmup?: boolean; setNumber: number }) => {
    setExerciseSets((prev) => {
      const exIdx = workoutExercises.findIndex((e) => e.exerciseId === payload.exerciseId)
      if (exIdx === -1) return prev
      const next = prev.map((arr) => arr.slice())
      const sets = next[exIdx]?.slice() || []
      const idx = sets.findIndex((s) => s.setNumber === payload.setNumber && s.isWarmup === Boolean(payload.isWarmup))
      if (idx === -1) return prev
      sets[idx] = { ...sets[idx], pending: true, saved: false, saving: false }
      next[exIdx] = sets
      return next
    })
  }

  const markSetSyncedByPayload = (payload: { exerciseId: string; isWarmup?: boolean; setNumber: number }) => {
    setExerciseSets((prev) => {
      const exIdx = workoutExercises.findIndex((e) => e.exerciseId === payload.exerciseId)
      if (exIdx === -1) return prev
      const next = prev.map((arr) => arr.slice())
      const sets = next[exIdx]?.slice() || []
      const idx = sets.findIndex((s) => s.setNumber === payload.setNumber && s.isWarmup === Boolean(payload.isWarmup))
      if (idx === -1) return prev
      sets[idx] = { ...sets[idx], pending: false, saved: true, saving: false }
      next[exIdx] = sets
      return next
    })
  }

  const flushQueue = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    const q = readQueue()
    if (q.length === 0) {
      setPendingSyncCount(0)
      return
    }

    const remaining: QueuedRequest[] = []

    for (const item of q) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item.body),
        })
        if (!res.ok) {
          remaining.push(item)
          continue
        }

        // If we successfully synced a set, reflect that in the UI.
        if (item.url === '/api/workouts/sets' && item.method === 'POST') {
          const { exerciseId, isWarmup, setNumber } = item.body || {}
          if (exerciseId && typeof setNumber === 'number') {
            markSetSyncedByPayload({ exerciseId, isWarmup, setNumber })
          }
        }
      } catch {
        remaining.push(item)
      }
    }

    writeQueue(remaining)
  }

  const writeLocalSummary = (summary: LocalSummary) => {
    try {
      localStorage.setItem(
        `${LOCAL_SUMMARY_KEY_PREFIX}${summary.sessionId}`,
        JSON.stringify(summary)
      )
    } catch {
      // Best-effort only; workout should still be usable without offline summary.
    }
  }

  const buildLocalSummary = (duration: number, completedAtIso: string): LocalSummary => {
    const exercises: LocalSummaryExercise[] = workoutExercises.map((ex, idx) => {
      const sets = (exerciseSets[idx] || [])
        .filter((s) => (s.saved || s.pending) && !Number.isNaN(Number(s.reps)))
        .map((s) => {
          const reps = Math.max(0, Math.round(Number(s.reps)))
          const weightRaw = s.weight === '' ? undefined : Number(s.weight)
          const rpeRaw = s.rpe === '' ? undefined : Number(s.rpe)

          return {
            setNumber: s.setNumber,
            isWarmup: s.isWarmup,
            completedReps: reps,
            weight: Number.isFinite(weightRaw) ? Math.round(weightRaw as number) : undefined,
            rpe: Number.isFinite(rpeRaw) ? Math.round(rpeRaw as number) : undefined,
            notes: s.notes ? String(s.notes).slice(0, 2000) : undefined,
          } satisfies LocalSummarySet
        })

      return {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        plannedSets: ex.sets,
        plannedReps: ex.reps,
        sets,
      }
    })

    return {
      sessionId: sessionId || '',
      dayName: dayName || 'Workout',
      planId: planId || undefined,
      duration,
      completedAt: completedAtIso,
      exercises,
    }
  }

  // Re-initialize sets if the plan exercises change (e.g., coming from a different plan day).
  useEffect(() => {
    setWorkoutExercises(planExercises)
    setWorkingWeights(planExercises.map(() => ''))
    setExerciseSets(
      planExercises.map((ex) =>
        Array.from({ length: Math.max(1, ex.sets) }, (_, i) => ({
          setNumber: i + 1,
          isWarmup: false,
          reps: '',
          weight: '',
          rpe: '',
          notes: '',
          saved: false,
          pending: false,
          saving: false,
        }))
      )
    )
    setCurrentExerciseIndex(0)
  }, [planExercises])

  useEffect(() => {
    // Start a new session
    const startSession = async () => {
      const body = {
        dayName: dayName || 'Workout',
        planId: planId || undefined,
      }

      const createOfflineSession = () => {
        const id =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`

        setSessionError(null)
        setSessionId(id)
        enqueueRequest('/api/workouts/sessions', 'POST', { id, ...body })
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        createOfflineSession()
        return
      }

      try {
        const response = await fetch('/api/workouts/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          setSessionError(data?.error || 'Failed to start session')
          return
        }
        setSessionError(null)
        setSessionId(data.id)
      } catch (error) {
        // If we can’t reach the server, allow the workout to proceed and sync later.
        console.warn('Error starting session (falling back to offline mode):', error)
        createOfflineSession()
      }
    }

    startSession()
  }, [dayName, planId])

  // Offline/online tracking + best-effort background sync
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    setPendingSyncCount(readQueue().length)

    const handleOnline = () => {
      setIsOnline(true)
      flushQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Try an initial flush when the user opens the logger.
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rest timer
  useEffect(() => {
    if (!restRunning || restRemaining === null) return
    if (restRemaining <= 0) {
      setRestRunning(false)
      return
    }

    const interval = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev === null) return null
        return prev <= 1 ? 0 : prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [restRunning, restRemaining])

  useEffect(() => {
    if (restRunning && restRemaining === 0) {
      setRestRunning(false)
    }
  }, [restRunning, restRemaining])

  const currentExercise = workoutExercises[currentExerciseIndex]
  const currentSets = exerciseSets[currentExerciseIndex] || []
  const warmupSets = currentSets.filter((s) => s.isWarmup)
  const workingSetsOnly = currentSets.filter((s) => !s.isWarmup)
  const isSetDone = (s: SetEntry) => s.saved || s.pending
  const allWorkingSetsDone = workingSetsOnly.length > 0 && workingSetsOnly.every(isSetDone)
  const restTargetSeconds = currentExercise?.restSeconds ?? 90
  const workingWeight = workingWeights[currentExerciseIndex] || ''

  const warmupSuggestions = useMemo(() => {
    const w = Number(workingWeight)
    if (!Number.isFinite(w) || w <= 0) return []

    const roundTo = (value: number, inc: number) => {
      if (!Number.isFinite(value) || value <= 0) return 0
      return Math.max(0, Math.round(value / inc) * inc)
    }

    const inc = w >= 20 ? 2.5 : 1
    return [
      { setNumber: 1, reps: 8, weight: roundTo(w * 0.4, inc) },
      { setNumber: 2, reps: 5, weight: roundTo(w * 0.6, inc) },
      { setNumber: 3, reps: 3, weight: roundTo(w * 0.8, inc) },
    ].filter((s) => s.weight > 0)
  }, [workingWeight])

  const addWarmupSets = () => {
    if (!warmupSuggestions.length) return
    setExerciseSets((prev) => {
      const next = prev.map((arr) => arr.slice())
      const existing = next[currentExerciseIndex] || []
      const hasExistingWarmups = existing.some((s) => s.isWarmup)
      if (hasExistingWarmups) {
        const ok = confirm('Replace existing warm-up sets for this exercise?')
        if (!ok) return prev
      }

      const working = existing.filter((s) => !s.isWarmup)
      const warmups: SetEntry[] = warmupSuggestions.map((s) => ({
        setNumber: s.setNumber,
        isWarmup: true,
        reps: String(s.reps),
        weight: String(s.weight),
        rpe: '',
        notes: 'Warm-up',
        saved: false,
        pending: false,
        saving: false,
      }))

      next[currentExerciseIndex] = [...warmups, ...working]
      return next
    })
  }

  const updateSet = (
    setIdx: number,
    field: keyof Omit<SetEntry, 'setNumber' | 'isWarmup' | 'saved' | 'pending' | 'saving'>,
    value: string
  ) => {
    setExerciseSets((prev) => {
      const next = prev.map((arr) => arr.slice())
      const exSets = next[currentExerciseIndex]?.slice() || []
      const entry = { ...exSets[setIdx] }
      ;(entry as any)[field] = value
      exSets[setIdx] = entry
      next[currentExerciseIndex] = exSets
      return next
    })
  }

  const markSaving = (setIdx: number, saving: boolean) => {
    setExerciseSets((prev) => {
      const next = prev.map((arr) => arr.slice())
      const exSets = next[currentExerciseIndex]?.slice() || []
      exSets[setIdx] = { ...exSets[setIdx], saving }
      next[currentExerciseIndex] = exSets
      return next
    })
  }

  const markSaved = (setIdx: number) => {
    setExerciseSets((prev) => {
      const next = prev.map((arr) => arr.slice())
      const exSets = next[currentExerciseIndex]?.slice() || []
      exSets[setIdx] = { ...exSets[setIdx], saved: true, pending: false, saving: false }
      next[currentExerciseIndex] = exSets
      return next
    })
  }

  const saveSet = async (setIdx: number) => {
    if (!sessionId) return
    const set = currentSets[setIdx]
    if (!set) return

    const repsNum = Number(set.reps)
    if (!Number.isFinite(repsNum) || repsNum < 0) {
      alert('Enter reps as a number (0 or more).')
      return
    }

    const weightNum = set.weight === '' ? undefined : Number(set.weight)
    if (set.weight !== '' && (!Number.isFinite(weightNum) || (weightNum as number) < 0)) {
      alert('Enter weight as a number (0 or more).')
      return
    }

    const rpeNum = set.rpe === '' ? undefined : Number(set.rpe)
    if (set.rpe !== '' && (!Number.isFinite(rpeNum) || (rpeNum as number) < 1 || (rpeNum as number) > 10)) {
      alert('RPE must be between 1 and 10.')
      return
    }

    const payload = {
      sessionId,
      exerciseId: currentExercise.exerciseId,
      isWarmup: set.isWarmup,
      setNumber: set.setNumber,
      completedReps: repsNum,
      weight: weightNum,
      rpe: rpeNum,
      notes: set.notes || undefined,
    }

    const startRestTimer = () => {
      const restSeconds = set.isWarmup ? Math.min(60, restTargetSeconds) : restTargetSeconds
      setRestRemaining(restSeconds)
      setRestRunning(true)
    }

    const queueAndContinue = () => {
      enqueueRequest('/api/workouts/sets', 'POST', payload)
      markSetPendingByPayload({
        exerciseId: currentExercise.exerciseId,
        isWarmup: set.isWarmup,
        setNumber: set.setNumber,
      })
      startRestTimer()
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueAndContinue()
      return
    }

    try {
      markSaving(setIdx, true)
      const res = await fetch('/api/workouts/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save set')

      markSaved(setIdx)
      startRestTimer()
    } catch (e) {
      console.error('Failed to save set', e)
      // If we lost connectivity mid-set, queue it and keep moving.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queueAndContinue()
        return
      }
      if (e instanceof TypeError) {
        queueAndContinue()
        return
      }

      alert(e instanceof Error ? e.message : 'Failed to save set')
      markSaving(setIdx, false)
    }
  }

  const aggregateAndSaveExerciseLog = async () => {
    if (!sessionId) return

    const savedSets = currentSets.filter((s) => (s.saved || s.pending) && !s.isWarmup)
    if (savedSets.length === 0) return

    const repsList = savedSets
      .map((s) => Number(s.reps))
      .filter((n) => Number.isFinite(n))
      .map((n) => String(Math.round(n)))
      .join(',')

    const weights = savedSets
      .map((s) => Number(s.weight))
      .filter((n) => Number.isFinite(n))

    const rpes = savedSets
      .map((s) => Number(s.rpe))
      .filter((n) => Number.isFinite(n))

    const weight = weights.length > 0 ? Math.round(Math.max(...weights)) : undefined
    const rpe = rpes.length > 0 ? Math.round(rpes.reduce((a, b) => a + b, 0) / rpes.length) : undefined
    const notes = savedSets.map((s) => s.notes).filter(Boolean).join('\n').slice(0, 2000) || undefined

    const payload = {
      sessionId,
      exerciseId: currentExercise.exerciseId,
      plannedSets: currentExercise.sets,
      completedSets: savedSets.length,
      plannedReps: currentExercise.reps,
      completedReps: repsList || undefined,
      weight,
      rpe,
      notes,
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueRequest('/api/workouts/logs', 'POST', payload)
      return
    }

    try {
      const res = await fetch('/api/workouts/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        // We still keep the workout moving — this is an aggregated convenience write.
        enqueueRequest('/api/workouts/logs', 'POST', payload)
      }
    } catch (e) {
      enqueueRequest('/api/workouts/logs', 'POST', payload)
    }
  }

  const finishExercise = async () => {
    if (!sessionId) return
    const anyDone = currentSets.some((s) => (s.saved || s.pending) && !s.isWarmup)
    if (!anyDone) {
      const ok = confirm('You have not saved any sets for this exercise. Skip it?')
      if (!ok) return
    }

    try {
      await aggregateAndSaveExerciseLog()
    } catch (e) {
      console.error('Failed to save exercise log', e)
    }

    setRestRunning(false)
    setRestRemaining(null)
    setSuggestions(null)

    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1)
    } else {
      await finishWorkout()
    }
  }

  const finishWorkout = async () => {
    if (!sessionId) return

    const duration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000)
    const completedAtIso = new Date().toISOString()

    setFinishingWorkout(true)
    writeLocalSummary(buildLocalSummary(duration, completedAtIso))

    const finishUrl = `/api/workouts/sessions/${sessionId}`
    const payload = {
      duration,
      completedAt: completedAtIso,
    }

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueRequest(finishUrl, 'PUT', payload)
        router.push(`/workouts/summary/${sessionId}?offline=1`)
        return
      }

      // Ensure any offline-created session gets created before we attempt to finish it.
      await flushQueue()

      const res = await fetch(finishUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        // If the server rejects this right now (e.g. session not created yet), enqueue for later.
        enqueueRequest(finishUrl, 'PUT', payload)
      }

      await flushQueue()
      const remaining = readQueue().length
      router.push(`/workouts/summary/${sessionId}${remaining > 0 ? '?offline=1' : ''}`)
    } catch (error) {
      console.error('Error finishing workout:', error)
      enqueueRequest(finishUrl, 'PUT', payload)
      router.push(`/workouts/summary/${sessionId}?offline=1`)
    } finally {
      setFinishingWorkout(false)
    }
  }

  const getLastExercises = (): string[] => {
    const start = Math.max(0, currentExerciseIndex - 2)
    return workoutExercises.slice(start, currentExerciseIndex + 1).map((e) => e.exerciseName)
  }

  const openSwap = async () => {
    if (!currentExercise) return
    try {
      setSwapOpen(true)
      setSwapLoading(true)
      setSwapOptions([])

      const res = await fetch(`/api/workouts/swap-options?exerciseId=${encodeURIComponent(currentExercise.exerciseId)}`, {
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load alternatives')

      const options = Array.isArray(data?.options) ? data.options : []
      setSwapOptions(options)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to load alternatives')
      setSwapOpen(false)
    } finally {
      setSwapLoading(false)
    }
  }

  const applySwap = (alt: { alternativeId: string; name: string }) => {
    setWorkoutExercises((prev) => {
      const next = prev.slice()
      const cur = next[currentExerciseIndex]
      if (!cur) return prev
      next[currentExerciseIndex] = {
        ...cur,
        exerciseId: alt.alternativeId,
        exerciseName: alt.name,
      }
      return next
    })

    // Reset sets for the swapped exercise.
    setExerciseSets((prev) => {
      const next = prev.map((arr) => arr.slice())
      const plannedSets = Math.max(1, workoutExercises[currentExerciseIndex]?.sets || 1)
      next[currentExerciseIndex] = Array.from({ length: plannedSets }, (_, i) => ({
        setNumber: i + 1,
        isWarmup: false,
        reps: '',
        weight: '',
        rpe: '',
        notes: '',
        saved: false,
        pending: false,
        saving: false,
      }))
      return next
    })

    setSuggestions(null)
    setSwapOpen(false)
  }

  const fetchNextSuggestions = async () => {
    try {
      setSuggestLoading(true)
      setSuggestions(null)
      const response = await fetch('/api/exercises/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lastExercises: getLastExercises(),
          sessionId,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (err) {
      console.error('Failed to fetch suggestions', err)
    } finally {
      setSuggestLoading(false)
    }
  }

  const progressPct = useMemo(() => {
    if (!workoutExercises.length) return 0
    return Math.round(((currentExerciseIndex + 1) / workoutExercises.length) * 100)
  }, [currentExerciseIndex, workoutExercises.length])

  if (sessionError && !sessionId) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="text-xl font-bold text-gray-900">Couldn’t start your workout</div>
        <div className="text-sm text-red-700 mt-2">{sessionError}</div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Retry
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return <div className="text-center py-8">Starting workout…</div>
  }

  if (!currentExercise) {
    return <div className="text-center py-8">No exercises in this workout.</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {finishingWorkout ? (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <div className="text-sm font-semibold text-indigo-900">Finishing workout…</div>
          <div className="text-xs text-indigo-800 mt-1">Syncing your data before you see the summary.</div>
        </div>
      ) : null}

      {!isOnline || pendingSyncCount > 0 ? (
        <div
          className={`mb-4 rounded-lg border p-3 ${
            !isOnline ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {!isOnline ? 'Offline mode' : 'Pending sync'}
              </div>
              <div className="text-xs text-gray-700 mt-1">
                {!isOnline
                  ? 'You can keep logging. We’ll sync automatically when you’re back online.'
                  : `${pendingSyncCount} item(s) waiting to sync.`}
              </div>
            </div>
            <button
              onClick={() => flushQueue()}
              disabled={!isOnline || pendingSyncCount === 0}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sync now
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Exercise {currentExerciseIndex + 1} of {workoutExercises.length}
          </h2>
          <span className="text-gray-500">
            {Math.round((Date.now() - sessionStartTime.getTime()) / 60000)} min
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Rest Timer */}
      {restRemaining !== null && (
        <div className={`mb-6 rounded-lg border p-4 ${restRunning ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Rest Timer</div>
              <div className="text-2xl font-bold text-indigo-700">{formatSeconds(restRemaining)}</div>
              <div className="text-xs text-gray-600">Target: {restTargetSeconds}s</div>
            </div>
            <div className="flex gap-2">
              {restRunning ? (
                <button
                  onClick={() => setRestRunning(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => setRestRunning(true)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Resume
                </button>
              )}
              <button
                onClick={() => {
                  setRestRunning(false)
                  setRestRemaining(null)
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{currentExercise.exerciseName}</h3>
            <p className="text-sm text-gray-600">
              Target: {currentExercise.sets} sets × {currentExercise.reps} reps • Rest {restTargetSeconds}s
            </p>
          </div>
          <button
            onClick={openSwap}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            Swap
          </button>
        </div>

        {/* Warm-up Suggestions */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Working Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={workingWeight}
                onChange={(e) => {
                  const v = e.target.value
                  setWorkingWeights((prev) => {
                    const next = prev.slice()
                    next[currentExerciseIndex] = v
                    return next
                  })
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional (used to suggest warm-up sets)"
              />
            </div>
            <button
              onClick={addWarmupSets}
              disabled={!warmupSuggestions.length}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Warm-up Sets
            </button>
          </div>
          {warmupSuggestions.length > 0 ? (
            <div className="mt-3 text-xs text-gray-600">
              Suggested warm-up:{' '}
              {warmupSuggestions.map((s) => `${s.reps} reps @ ${s.weight}kg`).join(' • ')}
            </div>
          ) : (
            <div className="mt-3 text-xs text-gray-500">
              Tip: Enter a working weight to generate warm-up sets (keeps joints safer and performance higher).
            </div>
          )}
        </div>

        {/* Warm-up Sets */}
        {warmupSets.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-gray-900">Warm-up</div>
            {warmupSets.map((set, idx) => {
              const setIdx = currentSets.findIndex(
                (s) => s.isWarmup && s.setNumber === set.setNumber
              )
              return (
                <div
                  key={`w-${set.setNumber}`}
                  className="border border-gray-200 rounded-lg p-4 bg-amber-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">Warm-up Set {set.setNumber}</div>
                    {set.pending ? (
                      <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Pending Sync
                      </span>
                    ) : set.saved ? (
                      <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                        Saved
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Reps</label>
                      <input
                        type="number"
                        min="0"
                        value={set.reps}
                        onChange={(e) => updateSet(setIdx, 'reps', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight}
                        onChange={(e) => updateSet(setIdx, 'weight', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">RPE</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={set.rpe}
                        onChange={(e) => updateSet(setIdx, 'rpe', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="optional"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => saveSet(setIdx)}
                        disabled={set.saving}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {set.saving ? 'Saving…' : set.saved || set.pending ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={set.notes}
                      onChange={(e) => updateSet(setIdx, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="optional"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Working Sets */}
        <div className="space-y-3">
          <div className="text-sm font-bold text-gray-900">Working Sets</div>
          {workingSetsOnly.map((set) => {
            const setIdx = currentSets.findIndex(
              (s) => !s.isWarmup && s.setNumber === set.setNumber
            )
            return (
              <div
                key={`s-${set.setNumber}`}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900">Set {set.setNumber}</div>
                  {set.pending ? (
                    <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Pending Sync
                    </span>
                  ) : set.saved ? (
                    <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                      Saved
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Reps</label>
                    <input
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(e) => updateSet(setIdx, 'reps', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight}
                      onChange={(e) => updateSet(setIdx, 'weight', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="optional"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">RPE</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={set.rpe}
                      onChange={(e) => updateSet(setIdx, 'rpe', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="optional"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => saveSet(setIdx)}
                      disabled={set.saving}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {set.saving ? 'Saving…' : set.saved || set.pending ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={set.notes}
                    onChange={(e) => updateSet(setIdx, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="optional"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Smart Suggestions */}
        <div className="space-y-3">
          <button
            onClick={fetchNextSuggestions}
            className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            {suggestLoading ? 'Fetching suggestions…' : 'What should I do next?'}
          </button>

          {suggestions && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              {suggestions.nextSuggestions?.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-bold text-gray-900 mb-2">Next Suggestions</h4>
                  <ul className="space-y-2 text-sm">
                    {suggestions.nextSuggestions.map((s: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600">→</span>
                        <div>
                          <p className="font-medium text-gray-900">{s.exerciseName}</p>
                          <p className="text-gray-700 text-xs">{s.reason}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestions.alternativeExercises?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Equipment-based Alternatives</h4>
                  <ul className="space-y-2 text-sm">
                    {suggestions.alternativeExercises.map((a: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600">↔</span>
                        <div>
                          <p className="font-medium text-gray-900">{a.exerciseName}</p>
                          <p className="text-gray-700 text-xs">
                            Swap for: {a.swapFor} — {a.reason}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={finishExercise}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          {currentExerciseIndex < workoutExercises.length - 1 ? 'Next Exercise' : 'Finish Workout'}
          {!allWorkingSetsDone ? ' (can skip unsaved sets)' : ''}
        </button>
      </div>

      {/* Swap Exercise Modal */}
      {swapOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Swap Exercise</h4>
                <p className="text-sm text-gray-600">Choose an alternative that fits you better today.</p>
              </div>
              <button
                onClick={() => setSwapOpen(false)}
                className="text-2xl leading-none text-gray-600 hover:text-gray-900"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {swapLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : swapOptions.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
                  No alternatives found for this exercise yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {swapOptions.map((alt) => (
                    <button
                      key={alt.alternativeId}
                      onClick={() => applySwap({ alternativeId: alt.alternativeId, name: alt.name })}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-gray-900">{alt.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {alt.type} • {alt.difficulty}
                          </div>
                          {alt.equipment?.length ? (
                            <div className="text-xs text-gray-500 mt-2">
                              Equipment: {alt.equipment.join(', ')}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-indigo-700 font-semibold">Swap →</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
