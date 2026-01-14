import 'dotenv/config'
import { db, client } from '@/db'
import { exercises, muscleGroups, exerciseMuscles } from '@/db/schema'
import { chestExercises } from '@/db/seed-data/chest'
import { backExercises } from '@/db/seed-data/back'
import { legsExercises } from '@/db/seed-data/legs'
import { shouldersExercises } from '@/db/seed-data/shoulders'
import { armsExercises } from '@/db/seed-data/arms'
import { coreExercises } from '@/db/seed-data/core'

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
    const muscleGroupsData = [
      { name: 'chest', displayName: 'Chest', bodyPart: 'upper', description: 'Pectoralis major and minor' },
      { name: 'upper_chest', displayName: 'Upper Chest', bodyPart: 'upper', description: 'Clavicular head of pectoralis' },
      { name: 'mid_chest', displayName: 'Mid Chest', bodyPart: 'upper', description: 'Sternal fibers of pectoralis major' },
      { name: 'lower_chest', displayName: 'Lower Chest', bodyPart: 'upper', description: 'Inferior sternal fibers of pectoralis major' },
      { name: 'lats', displayName: 'Latissimus Dorsi', bodyPart: 'back', description: 'Large back muscles' },
      { name: 'upper_back', displayName: 'Upper Back', bodyPart: 'back', description: 'Trapezius and rhomboids' },
      { name: 'lower_back', displayName: 'Lower Back', bodyPart: 'back', description: 'Erector spinae' },
      { name: 'front_delts', displayName: 'Front Deltoids', bodyPart: 'shoulders', description: 'Anterior deltoid' },
      { name: 'side_delts', displayName: 'Side Deltoids', bodyPart: 'shoulders', description: 'Lateral deltoid' },
      { name: 'rear_delts', displayName: 'Rear Deltoids', bodyPart: 'shoulders', description: 'Posterior deltoid' },
      { name: 'biceps', displayName: 'Biceps', bodyPart: 'arms', description: 'Biceps brachii' },
      { name: 'triceps', displayName: 'Triceps', bodyPart: 'arms', description: 'Triceps brachii' },
      { name: 'forearms', displayName: 'Forearms', bodyPart: 'arms', description: 'Wrist flexors and extensors' },
      { name: 'abs', displayName: 'Abs', bodyPart: 'core', description: 'Rectus abdominis' },
      { name: 'upper_abs', displayName: 'Upper Abs', bodyPart: 'core', description: 'Upper rectus abdominis' },
      { name: 'lower_abs', displayName: 'Lower Abs', bodyPart: 'core', description: 'Lower rectus abdominis' },
      { name: 'obliques', displayName: 'Obliques', bodyPart: 'core', description: 'Internal and external obliques' },
      { name: 'quads', displayName: 'Quadriceps', bodyPart: 'legs', description: 'Front thigh muscles' },
      { name: 'hamstrings', displayName: 'Hamstrings', bodyPart: 'legs', description: 'Back thigh muscles' },
      { name: 'glutes', displayName: 'Glutes', bodyPart: 'legs', description: 'Gluteus maximus, medius, minimus' },
      { name: 'calves', displayName: 'Calves', bodyPart: 'legs', description: 'Gastrocnemius and soleus' },
      { name: 'gastrocnemius_medial', displayName: 'Gastrocnemius (Medial)', bodyPart: 'legs', description: 'Medial head of gastrocnemius' },
      { name: 'gastrocnemius_lateral', displayName: 'Gastrocnemius (Lateral)', bodyPart: 'legs', description: 'Lateral head of gastrocnemius' },
      { name: 'soleus', displayName: 'Soleus', bodyPart: 'legs', description: 'Deep calf muscle for plantar flexion' },
    ]

    const insertedMuscles = await db.insert(muscleGroups).values(muscleGroupsData).returning()
    console.log(`✅ Added ${insertedMuscles.length} muscle groups`)

    // Create muscle map
    const muscleMap = Object.fromEntries(
      insertedMuscles.map(m => [m.name, m.id])
    )

    // Combine all exercises
    const allExercisesData = [
      ...chestExercises,
      ...backExercises,
      ...legsExercises,
      ...shouldersExercises,
      ...armsExercises,
      ...coreExercises,
    ]

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
