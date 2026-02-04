import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/db'
import { muscleGroups, type MuscleGroup } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { Dumbbell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Body Map | GuideMeCoach',
  description: 'Browse exercises by muscle group. Explore muscles and find recommended movements with safety guidance.',
}

export const dynamic = 'force-dynamic'

const BODY_PART_LABELS: Record<string, string> = {
  upper: 'Upper Body',
  chest: 'Chest',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  back: 'Back',
  legs: 'Legs',
}

const BODY_PART_ORDER = ['upper', 'chest', 'shoulders', 'arms', 'core', 'back', 'legs']

function groupByBodyPart(muscles: MuscleGroup[]): Record<string, MuscleGroup[]> {
  return muscles.reduce((acc: Record<string, MuscleGroup[]>, muscle) => {
    const key = muscle.bodyPart || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(muscle)
    return acc
  }, {})
}

export default async function BodyMapPage() {
  const muscles = await db.select().from(muscleGroups).orderBy(asc(muscleGroups.displayName))
  const musclesByPart = groupByBodyPart(muscles)

  const uniqueBodyParts = Array.from(new Set(muscles.map((m) => m.bodyPart || 'other')))
  const orderedBodyParts = [
    ...BODY_PART_ORDER.filter((key) => uniqueBodyParts.includes(key)),
    ...uniqueBodyParts.filter((key) => !BODY_PART_ORDER.includes(key)).sort(),
  ].map((key) => ({ key, label: BODY_PART_LABELS[key] || key }))

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">Body Map</h1>
          <p className="text-primary-100">Click on a muscle group to explore exercises</p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {muscles.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <p className="text-gray-900 dark:text-white font-semibold">No muscle groups found</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Add muscle groups in the database to populate the body map.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {orderedBodyParts.map((part) => {
              const musclesInPart = musclesByPart[part.key] || []
              if (musclesInPart.length === 0) return null

              return (
                <div key={part.key}>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{part.label}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {musclesInPart.map((muscle) => (
                      <Link key={muscle.id} href={`/muscles/${muscle.id}`}>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden h-full">
                          {/* Image placeholder */}
                          <div className="bg-gradient-to-br from-primary-500 to-primary-600 h-40 flex items-center justify-center overflow-hidden relative">
                            {muscle.imageUrl ? (
                              <Image
                                src={muscle.imageUrl}
                                alt={muscle.displayName}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Dumbbell className="h-12 w-12 text-white/90" aria-hidden="true" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                              {muscle.displayName}
                            </h3>
                            {muscle.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{muscle.description}</p>
                            )}
                            <p className="text-primary-600 dark:text-primary-400 text-sm font-semibold">View Exercises →</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
