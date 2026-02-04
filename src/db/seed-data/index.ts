// Central export for all seed data.
// Keep existing curated lists, and layer an expanded catalog on top.

import { chestExercises } from './chest'
import { backExercises } from './back'
import { legsExercises } from './legs'
import { shouldersExercises } from './shoulders'
import { armsExercises } from './arms'
import { coreExercises } from './core'
import { expandedExercises } from './expanded'
import { seedMuscleGroups } from './muscle-groups'

export { chestExercises } from './chest'
export { backExercises } from './back'
export { legsExercises } from './legs'
export { shouldersExercises } from './shoulders'
export { armsExercises } from './arms'
export { coreExercises } from './core'
export { expandedExercises } from './expanded'
export { seedMuscleGroups } from './muscle-groups'

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

function normalizeSeedExercises<T extends { name: string; slug?: string }>(items: T[]): T[] {
  const used = new Set<string>()
  return items.map((item) => {
    const base = item.slug?.trim() ? item.slug.trim() : slugify(item.name)
    let slug = base
    let i = 2
    while (used.has(slug)) {
      slug = `${base}-${i}`
      i++
    }
    used.add(slug)
    return { ...item, slug }
  })
}

export const allSeedExercises = normalizeSeedExercises([
  ...chestExercises,
  ...backExercises,
  ...legsExercises,
  ...shouldersExercises,
  ...armsExercises,
  ...coreExercises,
  ...expandedExercises,
])

export const SEED_EXERCISE_TOTAL = allSeedExercises.length
