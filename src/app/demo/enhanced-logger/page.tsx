'use client'

import { useState } from 'react'
import { EnhancedWorkoutLogger } from '@/components/EnhancedWorkoutLogger'

// Demo page to showcase the Enhanced Workout Logger
export default function EnhancedLoggerDemo() {
  const [completed, setCompleted] = useState(false)

  const handleComplete = (sets: any[]) => {
    console.log('Workout completed:', sets)
    setCompleted(true)
  }

  const handleSkip = () => {
    console.log('Exercise skipped')
    alert('Exercise skipped!')
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Workout Logged!</h2>
          <p className="text-gray-600 mb-6">Great job! Your workout has been saved.</p>
          <button
            onClick={() => setCompleted(false)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Log Another Exercise
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Workout Logger Demo</h1>
          <p className="text-gray-600">
            Features: Rest timer, previous workout history, RPE validation, browser notifications
          </p>
        </div>

        <EnhancedWorkoutLogger
          exerciseId="demo-exercise"
          exerciseName="Barbell Bench Press"
          previousSets={[
            { weight: 60, reps: 10, rpe: 7 },
            { weight: 60, reps: 9, rpe: 8 },
            { weight: 60, reps: 8, rpe: 9 },
          ]}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">✨ New Features Implemented:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">⏱️</span>
              <span><strong>Rest Timer:</strong> 60s, 90s, or 120s presets with countdown</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📊</span>
              <span><strong>Previous Workout:</strong> See your last workout stats for comparison</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span><strong>Progressive Sets:</strong> Mark sets as complete, track current set</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span><strong>RPE Validation:</strong> Rate of Perceived Exertion (1-10)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🔔</span>
              <span><strong>Notifications:</strong> Browser notifications when rest time completes</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📈</span>
              <span><strong>Live Stats:</strong> Real-time sets, reps, and average RPE</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-2">🔐 Security Updates:</h3>
          <p className="text-sm text-yellow-800 mb-3">Check out the login/signup pages to see:</p>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• HTTP-only cookies (no more localStorage vulnerabilities)</li>
            <li>• Input validation with helpful error messages</li>
            <li>• Rate limiting protection against brute force</li>
            <li>• Email verification system</li>
            <li>• Password reset flow</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
