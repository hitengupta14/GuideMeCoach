import type { Metadata } from 'next'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import ExerciseDetailClientPage from './client'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const exercise = await db.query.exercises.findFirst({
      where: and(
        eq(exercises.slug, params.slug),
        eq(exercises.reviewStatus, 'approved')
      ),
      columns: {
        name: true,
        description: true,
      },
    })

    if (!exercise) {
      return {
        title: 'Exercise | GuideMeCoach',
      }
    }

    return {
      title: `${exercise.name} | GuideMeCoach`,
      description: exercise.description,
    }
  } catch {
    return {
      title: 'Exercise | GuideMeCoach',
    }
  }
}

export default function ExerciseDetailPage() {
  return <ExerciseDetailClientPage />
}

