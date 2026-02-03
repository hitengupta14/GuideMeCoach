import { db } from '../src/db'
import { exercises, jointInvolvement } from '../src/db/schema'

const exerciseJointMappings: Record<string, Array<{ joint: string; level: 'low' | 'medium' | 'high' }>> = {
  'push-ups': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'wrist', level: 'low' },
  ],
  'squats': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'lower_back', level: 'medium' },
  ],
  'deadlifts': [
    { joint: 'lower_back', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'knee', level: 'medium' },
  ],
  'running': [
    { joint: 'knee', level: 'high' },
    { joint: 'ankle', level: 'high' },
    { joint: 'hip', level: 'medium' },
  ],
  'pull-ups': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'high' },
    { joint: 'wrist', level: 'low' },
  ],
  'overhead-press': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'lower_back', level: 'medium' },
  ],
  'bench-press': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'wrist', level: 'low' },
  ],
  'leg-press': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'lower_back', level: 'low' },
  ],
  'rows': [
    { joint: 'shoulder', level: 'medium' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'lower_back', level: 'low' },
  ],
  'bicep-curls': [
    { joint: 'elbow', level: 'high' },
    { joint: 'wrist', level: 'medium' },
  ],
  'tricep-extensions': [
    { joint: 'elbow', level: 'high' },
    { joint: 'shoulder', level: 'medium' },
  ],
  'planks': [
    { joint: 'lower_back', level: 'low' },
    { joint: 'shoulder', level: 'medium' },
    { joint: 'wrist', level: 'low' },
  ],
  'lunges': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'lower_back', level: 'medium' },
  ],
  'jumping-jacks': [
    { joint: 'ankle', level: 'high' },
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'medium' },
  ],
  'cycling': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'medium' },
    { joint: 'ankle', level: 'low' },
  ],
}

export async function seedJointInvolvement() {
  console.log('Starting joint involvement seeding...')

  try {
    // Get all exercises
    const allExercises = await db.select().from(exercises)

    let seededCount = 0

    // For each exercise, try to match with known joint data
    for (const exercise of allExercises) {
      const exerciseName = exercise.name.toLowerCase()
      const exerciseSlug = exercise.slug.toLowerCase()

      // Find matching joint data
      let jointData = null

      for (const [key, joints] of Object.entries(exerciseJointMappings)) {
        if (exerciseName.includes(key) || exerciseSlug.includes(key)) {
          jointData = joints
          break
        }
      }

      // Default categorization based on category and difficulty
      if (!jointData) {
        switch (exercise.category) {
          case 'strength':
            jointData = [
              { joint: 'shoulder', level: 'medium' },
              { joint: 'elbow', level: 'low' },
            ]
            break
          case 'cardio':
            jointData = [
              { joint: 'knee', level: 'high' },
              { joint: 'ankle', level: 'high' },
            ]
            break
          case 'mobility':
            jointData = [{ joint: 'hip', level: 'low' }]
            break
          case 'rehab':
            jointData = [{ joint: 'lower_back', level: 'low' }]
            break
        }
      }

      // Insert joint involvement data
      if (jointData) {
        for (const joint of jointData) {
          await db.insert(jointInvolvement).values({
            exerciseId: exercise.id,
            joint: joint.joint as 'knee' | 'lower_back' | 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'ankle' | 'neck',
            involvementLevel: joint.level as 'low' | 'medium' | 'high',
          })
          seededCount++
        }
      }
    }

    console.log(`✅ Successfully seeded ${seededCount} joint involvement records`)
  } catch (error) {
    console.error('❌ Error seeding joint involvement:', error)
    throw error
  }
}

// Run seeding
seedJointInvolvement().catch(console.error)
