import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Workout Planner | GuideMeCoach',
  description: 'Create your personalized workout plan using AI or custom selection',
  openGraph: {
    title: 'Workout Planner | GuideMeCoach',
    description: 'Create your personalized workout plan',
  },
}

export default function PlannerPage() {
  // Redirect to the unified planner
  redirect('/planner/unified')
}
