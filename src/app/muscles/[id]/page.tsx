import type { Metadata } from 'next'
import { db } from '@/db'
import { muscleGroups } from '@/db/schema'
import { eq } from 'drizzle-orm'
import MuscleClientPage from './client'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const muscle = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.id, params.id),
      columns: {
        displayName: true,
        description: true,
      },
    })

    if (!muscle) {
      return {
        title: 'Muscle Group | GuideMeCoach',
      }
    }

    return {
      title: `${muscle.displayName} Exercises | GuideMeCoach`,
      description: muscle.description || `Browse exercises that target ${muscle.displayName}.`,
    }
  } catch {
    return {
      title: 'Muscle Group | GuideMeCoach',
    }
  }
}

export default function MusclePage() {
  return <MuscleClientPage />
}
