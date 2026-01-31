import { MetadataRoute } from 'next'
import { db } from '@/db'
import { exercises, muscleGroups } from '@/db/schema'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://guidemecoach.com'

  let allExercises: Array<{ slug: string }> = []
  let allMuscles: Array<{ id: string }> = []

  try {
    // Fetch all exercises
    allExercises = await db.select({ slug: exercises.slug }).from(exercises)

    // Fetch all muscle groups
    allMuscles = await db.select({ id: muscleGroups.id }).from(muscleGroups)
  } catch {
    // If DB tables aren't available during build, fall back to static pages only.
    allExercises = []
    allMuscles = []
  }

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/exercises`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/body-map`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // Exercise pages
  const exercisePages = allExercises.map((exercise) => ({
    url: `${baseUrl}/exercises/${exercise.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Muscle pages
  const musclePages = allMuscles.map((muscle) => ({
    url: `${baseUrl}/muscles/${muscle.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...exercisePages, ...musclePages]
}
