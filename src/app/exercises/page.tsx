import type { Metadata } from 'next'
import ExercisesClientPage from './client'

export const metadata: Metadata = {
  title: 'Exercise Library | GuideMeCoach',
  description: 'Browse exercises by muscle group, equipment, difficulty, and location. Search our library with detailed instructions and safety guidance.',
}

export default function ExercisesPage() {
  return <ExercisesClientPage />
}
