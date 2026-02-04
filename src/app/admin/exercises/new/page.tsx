'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { csrfFetch } from '@/lib/csrf-client'

const CATEGORY_OPTIONS = ['strength', 'mobility', 'rehab', 'cardio'] as const
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const
const LOCATION_OPTIONS = ['home', 'gym', 'both'] as const
const EQUIPMENT_OPTIONS = [
  'none',
  'dumbbell',
  'barbell',
  'resistance_band',
  'machine',
  'cable',
  'kettlebell',
  'pull_up_bar',
  'bench',
] as const

type Category = (typeof CATEGORY_OPTIONS)[number]
type Difficulty = (typeof DIFFICULTY_OPTIONS)[number]
type Location = (typeof LOCATION_OPTIONS)[number]
type Equipment = (typeof EQUIPMENT_OPTIONS)[number]

export default function NewExercisePage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('strength')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [location, setLocation] = useState<Location>('both')
  const [equipment, setEquipment] = useState<Equipment[]>(['none'])
  const [description, setDescription] = useState('')
  const [stepsText, setStepsText] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [demoVideo, setDemoVideo] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = useMemo(
    () =>
      stepsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    [stepsText]
  )

  const toggleEquipment = (value: Equipment) => {
    setEquipment((prev) => {
      const exists = prev.includes(value)
      const next = exists ? prev.filter((e) => e !== value) : [...prev, value]
      return next.length > 0 ? next : ['none']
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    if (steps.length === 0) {
      setError('Add at least one step')
      return
    }

    try {
      setSaving(true)
      const res = await csrfFetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          difficulty,
          location,
          equipment,
          description,
          stepByStep: steps,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          videos: demoVideo.trim() ? { demoVideo: demoVideo.trim() } : undefined,
          source: 'manual',
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create exercise')
      }

      const id = data?.exercise?.id as string | undefined
      router.push(id ? `/admin/exercises/${id}` : '/admin/exercises')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create exercise')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/exercises"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to exercises
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            Add Exercise
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new exercise (saved as <span className="font-mono">draft</span> by default).
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Dumbbell Bench Press"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as Location)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {LOCATION_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Equipment
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={equipment.includes(opt)}
                    onChange={() => toggleEquipment(opt)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="capitalize">{opt.replaceAll('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Short, clear description of the exercise."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Step-by-step (one per line)
            </label>
            <textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={'1) Setup\n2) Perform the movement\n3) Finish safely'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thumbnail URL (optional)
              </label>
              <input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Demo Video URL (optional)
              </label>
              <input
                value={demoVideo}
                onChange={(e) => setDemoVideo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {saving ? 'Creating…' : 'Create Exercise'}
          </button>
          <Link
            href="/admin/exercises"
            className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

