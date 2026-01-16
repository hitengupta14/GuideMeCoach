'use client'

import { useState } from 'react'
import type { WeeklyPlan } from '@/lib/planner/types'

interface PlanDisplayProps {
  plan: WeeklyPlan
  metadata?: {
    totalExercises: number
    durationWeeks: number
    experienceLevel: string
    goals: string[]
    medicalConditions: string[]
  }
}

const getWeekPhase = (weekNumber: number): { label: string; color: string } => {
  if (weekNumber <= 3) return { label: 'Reps Focus', color: 'bg-blue-100 text-blue-800' }
  if (weekNumber <= 6) return { label: 'Volume Phase', color: 'bg-green-100 text-green-800' }
  if (weekNumber <= 9) return { label: 'Heavy Phase', color: 'bg-orange-100 text-orange-800' }
  return { label: 'Deload', color: 'bg-purple-100 text-purple-800' }
}

export default function PlanDisplay({ plan, metadata }: PlanDisplayProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber)
      // Also collapse all days in this week
      plan.weeks.forEach((week) => {
        if (week.weekNumber === weekNumber) {
          week.days.forEach((day) => {
            expandedDays.delete(`${weekNumber}-${day.dayName}`)
          })
        }
      })
    } else {
      newExpanded.add(weekNumber)
    }
    setExpandedWeeks(newExpanded)
  }

  const toggleDay = (weekNumber: number, dayName: string) => {
    const key = `${weekNumber}-${dayName}`
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDays(newExpanded)
  }

  return (
    <div className="space-y-6">
      {metadata && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Your Personalized Plan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-semibold">{metadata.durationWeeks} weeks</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Exercises</p>
              <p className="text-lg font-semibold">{metadata.totalExercises}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-lg font-semibold capitalize">{metadata.experienceLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Goals</p>
              <p className="text-lg font-semibold">{metadata.goals.join(', ')}</p>
            </div>
          </div>
          {metadata.medicalConditions.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800">Medical Considerations:</p>
              <p className="text-sm text-yellow-700">{metadata.medicalConditions.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {plan.weeks.map((week) => {
          const isExpanded = expandedWeeks.has(week.weekNumber)
          const phase = getWeekPhase(week.weekNumber)
          
          return (
            <div key={week.weekNumber} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleWeek(week.weekNumber)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">Week {week.weekNumber}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${phase.color}`}>
                    {phase.label}
                  </span>
                </div>
                <svg
                  className={`w-6 h-6 transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-6 pb-4 space-y-3">
                  {week.days.map((day) => {
                    const dayKey = `${week.weekNumber}-${day.dayName}`
                    const isDayExpanded = expandedDays.has(dayKey)

                    return (
                      <div key={day.dayName} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleDay(week.weekNumber, day.dayName)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{day.dayName}</span>
                            <span className="text-sm text-gray-600">
                              ({day.exercises.length} exercises)
                            </span>
                            {day.focusMuscles && day.focusMuscles.length > 0 && (
                              <span className="text-sm text-blue-600">• {day.focusMuscles.join(', ')}</span>
                            )}
                          </div>
                          <svg
                            className={`w-5 h-5 transform transition-transform ${
                              isDayExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {isDayExpanded && (
                          <div className="p-4 space-y-3">
                            {day.exercises.map((exercise, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                  {idx + 1}
                                </div>
                                <div className="flex-grow">
                                  <h4 className="font-semibold text-gray-900">
                                    {exercise.exerciseName || `Exercise ${idx + 1}`}
                                  </h4>
                                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                    <span>Sets: {exercise.sets}</span>
                                    <span>Reps: {exercise.reps}</span>
                                    <span>Rest: {exercise.restSeconds}s</span>
                                  </div>
                                  {exercise.notes && (
                                    <p className="mt-2 text-sm text-gray-700 italic">
                                      {exercise.notes}
                                    </p>
                                  )}
                                  {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {exercise.targetMuscles.map((muscle: string) => (
                                        <span
                                          key={muscle}
                                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                        >
                                          {muscle}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
