import 'server-only'

import type { NextResponse } from 'next/server'
import { users } from '@/db/schema'

export type ProfileCompletionStep = {
  id: string
  title: string
  description: string
  completed: boolean
  fields: string[]
  icon: string
}

type UserProfile = Partial<typeof users.$inferSelect>

export function computeProfileCompletion(user: UserProfile) {
  const steps: ProfileCompletionStep[] = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Your name and contact details',
      completed: Boolean(user.name),
      fields: ['name'],
      icon: '👤',
    },
    {
      id: 'physical_stats',
      title: 'Physical Stats',
      description: 'Height, weight, age, and gender',
      completed: Boolean(user.height && (user.weight || user.currentWeight) && user.age && user.gender),
      fields: ['height', 'weight', 'currentWeight', 'age', 'gender'],
      icon: '📏',
    },
    {
      id: 'experience',
      title: 'Experience Level',
      description: 'Your fitness background',
      completed: Boolean(user.experienceLevel),
      fields: ['experienceLevel'],
      icon: '💪',
    },
    {
      id: 'goals',
      title: 'Fitness Goals',
      description: 'What do you want to achieve?',
      completed: Boolean(user.goals && user.goals.length > 0),
      fields: ['goals'],
      icon: '🎯',
    },
    {
      id: 'targets',
      title: 'Target Weight',
      description: 'Set your fitness target',
      completed: Boolean(user.targetWeight),
      fields: ['targetWeight'],
      icon: '🎲',
    },
  ]

  const completedSteps = steps.filter((step) => step.completed).length
  const totalSteps = steps.length
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const missingFields = Array.from(
    new Set(
      steps
        .filter((step) => !step.completed)
        .flatMap((step) => step.fields)
    )
  )

  return {
    steps,
    completed: completedSteps,
    total: totalSteps,
    percentage,
    isComplete: completedSteps === totalSteps,
    missingFields,
  }
}

export function setProfileCompleteCookie(response: NextResponse, isComplete: boolean) {
  response.cookies.set('profile_complete', isComplete ? '1' : '0', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

export function clearProfileCompleteCookie(response: NextResponse) {
  response.cookies.set('profile_complete', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
