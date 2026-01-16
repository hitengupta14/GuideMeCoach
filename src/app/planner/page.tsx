import { Metadata } from 'next'
import PlannerPageClient from './client'

export const metadata: Metadata = {
  title: 'Workout Planner | GuideMeCoach',
  description: 'Create your personalized workout plan based on your goals, experience level, and medical conditions',
  openGraph: {
    title: 'Workout Planner | GuideMeCoach',
    description: 'Create your personalized workout plan',
  },
}

export default function PlannerPage() {
  return <PlannerPageClient />
}
