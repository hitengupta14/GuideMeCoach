import 'dotenv/config'
import { db, client } from '@/db'
import { exercises, muscleGroups, exerciseMuscles } from '@/db/schema'
import { allSeedExercises, SEED_EXERCISE_TOTAL } from '@/db/seed-data'
import { seedMuscleGroups } from '@/db/seed-data/muscle-groups'

const allowDestructive = process.env.ALLOW_DESTRUCTIVE_SEED === 'true'
if (!allowDestructive) {
  console.error('Refusing to run clean-and-seed: set ALLOW_DESTRUCTIVE_SEED=true to proceed (NOT for production).')
  process.exit(1)
}

async function cleanAndSeed() {
  try {
    console.log('🧹 Cleaning database...')
    
    // Delete all data in reverse order of dependencies
    await db.delete(exerciseMuscles)
    console.log('✅ Cleared exercise_muscles')
    
    await db.delete(exercises)
    console.log('✅ Cleared exercises')
    
    await db.delete(muscleGroups)
    console.log('✅ Cleared muscle_groups')
    
    console.log('🌱 Starting fresh seed...')
    
    // Seed muscle groups
    console.log('Adding muscle groups...')
    const muscleGroupsData = seedMuscleGroups

    const insertedMuscles = await db.insert(muscleGroups).values(muscleGroupsData).returning()
    console.log(`✅ Added ${insertedMuscles.length} muscle groups`)

    // Create muscle map
    const muscleMap = Object.fromEntries(
      insertedMuscles.map(m => [m.name, m.id])
    )

    // Combine all exercises
    const allExercisesData = allSeedExercises
    console.log(`📚 Seed catalog contains ${SEED_EXERCISE_TOTAL} exercises`)

    // Process exercises and create muscle links
    console.log('Adding exercises and linking to muscle groups...')
    const muscleLinks = []
    
    for (const exerciseData of allExercisesData) {
      const { muscleGroups: muscleGroupsData, ...exerciseWithoutMuscles } = exerciseData as any
      
      // Insert exercise
      const insertedExercise = await db.insert(exercises).values(exerciseWithoutMuscles).returning()
      
      if (insertedExercise.length > 0 && muscleGroupsData) {
        // Link to muscle groups
        for (const mg of muscleGroupsData) {
          muscleLinks.push({
            exerciseId: insertedExercise[0].id,
            muscleGroupId: muscleMap[mg.muscleGroup],
            role: mg.role
          })
        }
      }
    }

    console.log(`✅ Added ${allExercisesData.length} exercises`)

    // Insert all muscle links
    await db.insert(exerciseMuscles).values(muscleLinks)
    console.log(`✅ Created ${muscleLinks.length} exercise-muscle relationships`)
    
    console.log('✅ Database cleaned and reseeded successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

cleanAndSeed()
