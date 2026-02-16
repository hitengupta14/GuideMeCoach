'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MedicalConditionsSection } from '@/components/MedicalConditionsSection'
import { csrfFetch } from '@/lib/csrf-client'
import { AlertCircle } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  height: number | null
  weight: number | null
  age: number | null
  gender: string | null
  experienceLevel: string | null
  goals: string[] | null
  medicalConditions: string[] | null
  currentWeight: number | null
  targetWeight: number | null
}

interface CompletionStep {
  id: string
  title: string
  description: string
  completed: boolean
}

interface CompletionData {
  steps: CompletionStep[]
  completed: number
  total: number
  percentage: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({})
  const [message, setMessage] = useState('')
  const [completion, setCompletion] = useState<CompletionData | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get('onboarding') === '1'

  const loadCompletion = async () => {
    try {
      const res = await fetch('/api/engagement/profile-completion', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (data?.completion) {
        setCompletion(data.completion)
      }
    } catch (err) {
      console.error('Failed to load profile completion:', err)
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/auth/login')
          return
        }

        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          setFormData(data.user)
          await loadCompletion()
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Session check failed:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : (name === 'height' || name === 'weight' || name === 'age' || name === 'currentWeight' || name === 'targetWeight' ? parseInt(value) : value),
    }))
  }

  const handleGoalsChange = (goal: string) => {
    setFormData((prev) => {
      const currentGoals = prev.goals || []
      const newGoals = currentGoals.includes(goal)
        ? currentGoals.filter(g => g !== goal)
        : [...currentGoals, goal]
      return { ...prev, goals: newGoals }
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(user || {})
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const response = await csrfFetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      const updated = await response.json()
      setUser(updated)
      setFormData(updated)
      await loadCompletion()
      // No need to update localStorage - session cookie handles authentication
      setIsEditing(false)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating profile. Please try again.')
      console.error('Error updating profile:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-2">Manage your fitness profile and personal information</p>
            </div>
            {!isOnboarding ? (
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                ← Back to Dashboard
              </Link>
            ) : null}
          </div>
          {isOnboarding ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Please complete the required basics to unlock the rest of the app:
              name, age, height, weight, gender, experience level, and goals.
            </div>
          ) : null}
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 font-medium text-lg ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        {completion ? (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">Profile checklist</p>
                <p className="text-xs text-gray-500">
                  {completion.percentage}% complete ({completion.completed}/{completion.total})
                </p>
              </div>
              {completion.completed === completion.total ? (
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                  All set
                </span>
              ) : (
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full">
                  Finish setup
                </span>
              )}
            </div>
            {completion.completed === completion.total ? (
              <p className="mt-3 text-sm text-gray-600">
                Your profile is complete. You can update anything anytime.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {completion.steps
                  .filter((step) => !step.completed)
                  .map((step) => (
                    <li key={step.id} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{step.title}</span>
                        <span className="text-gray-500"> · {step.description}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ) : null}

        {/* Edit Mode Toggle Button */}
        {!isEditing && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex justify-between items-center border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <button
              type="button"
              onClick={handleEdit}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-md hover:shadow-lg"
            >
              Edit Profile
            </button>
          </div>
        )}

        {isEditing && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 font-semibold text-lg">Edit Mode Active</p>
            <p className="text-amber-700 text-sm mt-1">Make your changes below and click Save when you're done.</p>
          </div>
        )}

        <form onSubmit={isEditing ? handleSubmit : (e) => e.preventDefault()} className="bg-white rounded-xl shadow-lg p-8 space-y-8 border border-gray-100">
          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-indigo-200">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Physical Measurements */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-indigo-200">Physical Measurements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Weight (kg) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  name="currentWeight"
                  value={formData.currentWeight || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                  placeholder="Required for AI features"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Weight (kg)</label>
                <input
                  type="number"
                  name="targetWeight"
                  value={formData.targetWeight || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Fitness Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-indigo-200">Fitness Information</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 hover:border-indigo-300 transition-colors"
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Fitness Goals */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Fitness Goals <span className="text-red-500 font-bold">*</span>
                <span className="text-gray-500 text-xs font-normal ml-2">(Select at least one)</span>
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {['fat_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'posture', 'rehab', 'general_fitness'].map((goal) => (
                  <label
                    key={goal}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      (formData.goals || []).includes(goal)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                    } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.goals || []).includes(goal)}
                      onChange={() => handleGoalsChange(goal)}
                      disabled={!isEditing}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-semibold text-gray-900 capitalize">
                      {goal.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
              {isEditing && (!formData.goals || formData.goals.length === 0) && (
                <p className="text-red-600 text-sm font-medium mt-3">Please select at least one goal to use AI features</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-md hover:shadow-lg"
              >
                 Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-bold shadow-md hover:shadow-lg"
              >
                 Cancel
              </button>
            </div>
          )}
        </form>

        {/* Medical Conditions Section */}
        {user && (
          <MedicalConditionsSection
            userId={user.id}
            onSave={async (data) => {
              const response = await csrfFetch(`/api/users/${user.id}/medical-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })

              if (!response.ok) {
                throw new Error('Failed to save medical history')
              }

              return response.json()
            }}
          />
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8 border-2 border-red-200 border-l-4 border-l-red-600">
          <h2 className="text-2xl font-bold text-red-600 mb-3">Danger Zone</h2>
          <p className="text-gray-600 mb-6 font-medium">These actions cannot be undone.</p>
          <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold shadow-md hover:shadow-lg">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
