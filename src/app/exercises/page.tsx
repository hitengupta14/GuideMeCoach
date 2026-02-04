import type { Metadata } from 'next'
import ExercisesClientPage from './client'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { asc, eq, sql } from 'drizzle-orm'

export const metadata: Metadata = {
  title: 'Exercise Library | GuideMeCoach',
  description: 'Browse exercises by muscle group, equipment, difficulty, and location. Search our library with detailed instructions and safety guidance.',
}

export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const page = 1
  const limit = 20

  const [items, totalRow] = await Promise.all([
    db
      .select()
      .from(exercises)
      .where(eq(exercises.reviewStatus, 'approved'))
      .orderBy(asc(exercises.name))
      .limit(limit),
    db
      .select({ count: sql<number>`count(*)` })
      .from(exercises)
      .where(eq(exercises.reviewStatus, 'approved'))
      .limit(1)
      .then((rows) => rows[0]),
  ])

  const total = Number(totalRow?.count || 0)

  return (
    <ExercisesClientPage
      initialData={{
        items,
        exercises: items,
        total,
        page,
        limit,
      }}
    />
  )
}
