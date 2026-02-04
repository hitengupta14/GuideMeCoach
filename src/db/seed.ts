import 'dotenv/config'
import { db } from '@/db'
import { exercises, muscleGroups, exerciseMuscles } from '@/db/schema'
import { allSeedExercises, SEED_EXERCISE_TOTAL } from '@/db/seed-data'
import { seedMuscleGroups } from '@/db/seed-data/muscle-groups'
import { inArray } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Seeding database...')

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Seeding blocked in production. Set ALLOW_SEED=true to override intentionally.')
  }

  console.log(`📚 Seed catalog contains ${SEED_EXERCISE_TOTAL} exercises`)

  // Seed / upsert muscle groups first
  console.log('Ensuring muscle groups...')
  const muscleGroupsData = seedMuscleGroups

  await db
    .insert(muscleGroups)
    .values(muscleGroupsData)
    .onConflictDoNothing()

  const seededMuscleNames = muscleGroupsData.map((m) => m.name)
  const allMuscles = await db
    .select({ id: muscleGroups.id, name: muscleGroups.name })
    .from(muscleGroups)
    .where(inArray(muscleGroups.name, seededMuscleNames as any))

  const muscleMap = Object.fromEntries(allMuscles.map((m) => [m.name, m.id]))
  console.log(`✅ Muscle groups ready: ${allMuscles.length}`)

  // Combine all exercise data
  const allExercisesData = allSeedExercises

  // Safety: ensure every referenced muscle group exists.
  const referencedMuscles = new Set<string>()
  for (const e of allExercisesData as any[]) {
    for (const mg of (e.muscleGroups || []) as Array<{ muscleGroup: string }>) {
      if (mg?.muscleGroup) referencedMuscles.add(mg.muscleGroup)
    }
  }
  const missingMuscles = Array.from(referencedMuscles).filter((name) => !muscleMap[name])
  if (missingMuscles.length > 0) {
    throw new Error(`Seed data references unknown muscle groups: ${missingMuscles.join(', ')}`)
  }
  const exerciseRows = allExercisesData.map((e: any) => {
    const { muscleGroups: _mg, ...rest } = e
    return rest
  })

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  // Insert exercises (idempotent)
  console.log('Ensuring exercises...')
  let insertedCount = 0
  for (const batch of chunk(exerciseRows, 200)) {
    const inserted = await db
      .insert(exercises)
      .values(batch as any)
      .onConflictDoNothing()
      .returning({ id: exercises.id })
    insertedCount += inserted.length
  }
  console.log(`✅ Inserted ${insertedCount} new exercises (existing kept)`)

  // Fetch exercise ids for all slugs in the seed catalog
  const slugs = allExercisesData.map((e: any) => e.slug).filter(Boolean)
  const slugToId = new Map<string, string>()
  for (const batch of chunk(slugs, 500)) {
    const rows = await db
      .select({ id: exercises.id, slug: exercises.slug })
      .from(exercises)
      .where(inArray(exercises.slug, batch as any))
    for (const r of rows) slugToId.set(r.slug, r.id)
  }

  // Build desired exercise-muscle relationships
  console.log('Ensuring exercise ↔ muscle links...')
  const desiredLinks: Array<{ exerciseId: string; muscleGroupId: string; role: string }> = []
  const seenDesired = new Set<string>()

  for (const e of allExercisesData as any[]) {
    const exId = e?.slug ? slugToId.get(e.slug) : undefined
    if (!exId) continue
    for (const mg of (e.muscleGroups || []) as Array<{ muscleGroup: string; role: string }>) {
      const mgId = muscleMap[mg.muscleGroup]
      if (!mgId) continue
      const key = `${exId}|${mgId}|${mg.role}`
      if (seenDesired.has(key)) continue
      seenDesired.add(key)
      desiredLinks.push({ exerciseId: exId, muscleGroupId: mgId, role: mg.role })
    }
  }

  // Fetch existing links for these exercises, then insert only missing ones.
  const exerciseIds = Array.from(new Set(desiredLinks.map((l) => l.exerciseId)))
  const existingKeys = new Set<string>()
  for (const batch of chunk(exerciseIds, 500)) {
    const rows = await db
      .select({
        exerciseId: exerciseMuscles.exerciseId,
        muscleGroupId: exerciseMuscles.muscleGroupId,
        role: exerciseMuscles.role,
      })
      .from(exerciseMuscles)
      .where(inArray(exerciseMuscles.exerciseId, batch as any))
    for (const r of rows) existingKeys.add(`${r.exerciseId}|${r.muscleGroupId}|${r.role}`)
  }

  const linksToInsert = desiredLinks.filter((l) => !existingKeys.has(`${l.exerciseId}|${l.muscleGroupId}|${l.role}`))
  for (const batch of chunk(linksToInsert, 500)) {
    await db.insert(exerciseMuscles).values(batch as any)
  }
  console.log(`✅ Added ${linksToInsert.length} new exercise-muscle relationships`)

  console.log('✅ Database seeded successfully!')
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
