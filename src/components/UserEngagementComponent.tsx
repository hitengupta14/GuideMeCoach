'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Award, Dumbbell, Flame, Scale, Trophy, User, Ruler, BarChart3, Target, CheckCircle2 } from 'lucide-react'
import { csrfFetch } from '@/lib/csrf-client'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  criteria: {
    type: string
    value: number
  }
  isEarned: boolean
  progress: number
  earnedAt?: Date
}

interface CompletionStep {
  id: string
  title: string
  description: string
  completed: boolean
  icon: string
}

const getAchievementIcon = (achievement: Achievement) => {
  switch (achievement.criteria.type) {
    case 'weight_loss':
      return Scale
    case 'days_streak':
      return Flame
    case 'workout_count':
      return Dumbbell
    case 'milestone':
      return Trophy
    default:
      return Award
  }
}

const getProfileStepIcon = (stepId: string) => {
  switch (stepId) {
    case 'basic_info':
      return User
    case 'physical_stats':
      return Ruler
    case 'experience':
      return BarChart3
    case 'goals':
      return Target
    case 'targets':
      return Scale
    default:
      return User
  }
}

export default function UserEngagementComponent() {
  const [activeTab, setActiveTab] = useState<'achievements' | 'calendar' | 'profile' | 'reminders'>('achievements')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [profileCompletion, setProfileCompletion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [calendar, setCalendar] = useState<any>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [achievRes, profileRes, calendarRes] = await Promise.all([
        fetch('/api/engagement/achievements'),
        fetch('/api/engagement/profile-completion'),
        fetch(`/api/engagement/calendar?month=${calendarMonth.getMonth()}&year=${calendarMonth.getFullYear()}`),
      ])

      if (achievRes.ok) {
        const data = await achievRes.json()
        setAchievements(data.achievements)
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfileCompletion(data)
      }

      if (calendarRes.ok) {
        const data = await calendarRes.json()
        setCalendar(data)
      }
    } catch (error) {
      console.error('Failed to fetch engagement data:', error)
    } finally {
      setLoading(false)
    }
  }, [calendarMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleProfileUpdate = async (field: string, value: any) => {
    try {
      const res = await csrfFetch('/api/engagement/profile-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading engagement data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Progress & Engagement</h1>
        <p className="text-gray-600 mt-2">Track achievements, complete your profile, and stay motivated</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200">
          {[
            { id: 'achievements', label: ' Achievements' },
            { id: 'profile', label: ' Profile' },
            { id: 'calendar', label: ' Calendar' },
            { id: 'reminders', label: ' Reminders' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-4 text-center font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {achievements && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <div className="grid grid-cols-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {achievements.filter(a => a.isEarned).length}
                      </p>
                      <p className="text-sm text-gray-600">Earned</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{achievements.length}</p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {Math.round(
                          (achievements.filter(a => a.isEarned).length / achievements.length) * 100
                        )}
                        %
                      </p>
                      <p className="text-sm text-gray-600">Progress</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition ${
                      achievement.isEarned
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            {(() => {
                              const Icon = getAchievementIcon(achievement)
                              return <Icon className="w-5 h-5" aria-hidden="true" />
                            })()}
                          </div>
                          <h3 className="font-bold text-gray-900">{achievement.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{achievement.description}</p>

                        {!achievement.isEarned && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${achievement.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{achievement.progress}% progress</p>
                          </div>
                        )}

                        {achievement.isEarned && (
                          <p className="text-xs text-yellow-700 mt-2 font-medium">Achieved!</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && profileCompletion && (
            <div className="space-y-6">
              {/* Completion Progress */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                <h3 className="font-bold text-gray-900 mb-4">Profile Completion</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion.completion.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {profileCompletion.completion.completed} of {profileCompletion.completion.total} sections completed (
                  {profileCompletion.completion.percentage}%)
                </p>
              </div>

              {/* Completion Steps */}
              <div className="space-y-3">
                {profileCompletion.completion.steps.map((step: CompletionStep) => (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border-2 transition ${
                      step.completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                            {(() => {
                              const Icon = getProfileStepIcon(step.id)
                              return <Icon className="w-5 h-5" aria-hidden="true" />
                            })()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{step.title}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      </div>
                      {step.completed && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && calendar && (
            <div className="space-y-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
                  }
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                >
                  ← Prev
                </button>
                <h3 className="text-lg font-bold text-gray-900">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() =>
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
                  }
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                >
                  Next →
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-600 text-sm py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendar.weeks.map((week: any, weekIdx: number) =>
                  week.map((day: any, dayIdx: number) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center transition ${
                        day === null
                          ? 'bg-gray-50 border-gray-100'
                          : day.hasWorkout
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {day !== null && (
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{day.day}</div>
                          {day.hasWorkout && (
                            <div className="text-xs text-indigo-600 font-medium">
                              {day.workouts.length}W
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="text-center text-sm text-gray-600">
                Total workouts this month: <span className="font-bold">{calendar.totalWorkouts}</span>
              </div>
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Coming soon:</strong>Workout reminders will help you stay on track with personalized
                  notifications for your scheduled workouts.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Morning Motivation', time: '7:00 AM', enabled: false },
                  { title: 'Scheduled Workout', time: '6:00 PM', enabled: false },
                  { title: 'Evening Reminder', time: '9:00 PM', enabled: false },
                ].map((reminder, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{reminder.title}</p>
                      <p className="text-sm text-gray-600">{reminder.time}</p>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminder.enabled}
                        className="w-4 h-4 text-indigo-600 rounded"
                        disabled
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
