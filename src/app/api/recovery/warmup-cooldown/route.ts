import { db } from '@/db'
import { exercises } from '@/db/schema'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { workoutFocus = 'upper_body', type = 'warmup', duration = 10 } = await req.json()

    if (!['warmup', 'cooldown'].includes(type)) {
      return Response.json(
        { error: 'type must be "warmup" or "cooldown"' },
        { status: 400 }
      )
    }

    if (!['upper_body', 'lower_body', 'full_body', 'push', 'pull'].includes(workoutFocus)) {
      return Response.json(
        { error: 'Invalid workout focus' },
        { status: 400 }
      )
    }

    // Get mobility/light cardio exercises
    const mobilityExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.category, 'mobility'))
      .limit(5)

    // Generate routine based on type and focus
    const routine = generateRoutine(workoutFocus, type, duration)

    return Response.json({
      type,
      focus: workoutFocus,
      duration,
      routine,
      tips: type === 'warmup' 
        ? [
            'Gradually increase heart rate',
            'Focus on dynamic stretches',
            'Activate main muscle groups',
            'End 5 minutes before your main workout',
          ]
        : [
            'Bring your heart rate down gradually',
            'Use static stretches',
            'Hold stretches for 20-30 seconds',
            'Focus on muscles you just worked',
          ],
    })
  } catch (error) {
    console.error('Warm-up/cool-down generation error:', error)
    return Response.json(
      { error: 'Failed to generate warm-up/cool-down routine' },
      { status: 500 }
    )
  }
}

function generateRoutine(
  focus: string,
  type: 'warmup' | 'cooldown',
  duration: number
) {
  const warmupRoutines: Record<string, any[]> = {
    upper_body: [
      {
        name: 'Arm Circles',
        duration: 1,
        sets: 2,
        reps: '10 each direction',
        instructions: 'Small circles for 30 seconds, then large circles for 30 seconds',
      },
      {
        name: 'Shoulder Rolls',
        duration: 1,
        sets: 2,
        reps: '10 each direction',
        instructions: 'Slow and controlled, backward and forward',
      },
      {
        name: 'Cat-Cow Stretch',
        duration: 2,
        sets: 1,
        reps: '10 reps',
        instructions: 'Alternate between cat and cow positions',
      },
      {
        name: 'Band Pull-Aparts',
        duration: 2,
        sets: 2,
        reps: '15 reps',
        instructions: 'Light resistance band, focus on shoulder activation',
      },
      {
        name: 'Scapular Push-ups',
        duration: 2,
        sets: 2,
        reps: '12 reps',
        instructions: 'Light range of motion, focus on shoulder blades',
      },
    ],
    lower_body: [
      {
        name: 'Leg Swings',
        duration: 2,
        sets: 2,
        reps: '10 each leg each direction',
        instructions: 'Forward-back and side-to-side',
      },
      {
        name: 'Bodyweight Squats',
        duration: 2,
        sets: 2,
        reps: '15 reps',
        instructions: 'Light and controlled, focus on form',
      },
      {
        name: 'Walking Lunges',
        duration: 2,
        sets: 1,
        reps: '10 each leg',
        instructions: 'Light range of motion',
      },
      {
        name: 'Hip Circles',
        duration: 1,
        sets: 2,
        reps: '10 each direction',
        instructions: 'Hands on hips, make large circles',
      },
      {
        name: 'Glute Activation',
        duration: 2,
        sets: 2,
        reps: '15 reps',
        instructions: 'Glute bridges or clamshells',
      },
    ],
    full_body: [
      {
        name: 'Light Cardio',
        duration: 3,
        sets: 1,
        reps: 'Continuous',
        instructions: 'Jumping jacks, light jogging in place',
      },
      {
        name: 'Dynamic Stretches',
        duration: 4,
        sets: 1,
        reps: '10 each',
        instructions: 'Arm circles, leg swings, torso twists',
      },
      {
        name: 'Bodyweight Movements',
        duration: 3,
        sets: 2,
        reps: 'Varies',
        instructions: 'Bodyweight squats, push-ups, lunges',
      },
    ],
    push: [
      {
        name: 'Arm Circles',
        duration: 1,
        sets: 2,
        reps: '10 each direction',
        instructions: 'Small to large circles',
      },
      {
        name: 'Band Pull-Aparts',
        duration: 2,
        sets: 2,
        reps: '15 reps',
        instructions: 'Warm up rear delts and shoulder health',
      },
      {
        name: 'Scapular Push-ups',
        duration: 2,
        sets: 2,
        reps: '10 reps',
        instructions: 'Shoulder blade activation',
      },
      {
        name: 'Light Push-ups',
        duration: 2,
        sets: 2,
        reps: '10 reps',
        instructions: 'Get blood flowing to pushing muscles',
      },
      {
        name: 'Wrist Circles',
        duration: 1,
        sets: 1,
        reps: '10 each direction',
        instructions: 'Wrist mobility and activation',
      },
    ],
    pull: [
      {
        name: 'Shoulder Rolls',
        duration: 1,
        sets: 2,
        reps: '10 each direction',
        instructions: 'Backward and forward rotations',
      },
      {
        name: 'Band Pull-Aparts',
        duration: 2,
        sets: 2,
        reps: '15 reps',
        instructions: 'Shoulder health and activation',
      },
      {
        name: 'Cat-Cow',
        duration: 2,
        sets: 1,
        reps: '10 reps',
        instructions: 'Spinal mobility and back engagement',
      },
      {
        name: 'Arm Swings',
        duration: 2,
        sets: 2,
        reps: '10 each way',
        instructions: 'Cross-body and pendulum motions',
      },
      {
        name: 'Dead Hangs (if available)',
        duration: 2,
        sets: 2,
        reps: '15-30 seconds',
        instructions: 'Shoulder decompression',
      },
    ],
  }

  const cooldownRoutines: Record<string, any[]> = {
    upper_body: [
      {
        name: 'Chest Stretch',
        duration: 1,
        reps: 'Hold 30 sec',
        instructions: 'Doorway stretch or cross-body stretch',
      },
      {
        name: 'Shoulder Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Overhead, across body, and rotational',
      },
      {
        name: 'Tricep Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Behind the head stretch',
      },
      {
        name: 'Forearm Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Palms up and down',
      },
      {
        name: 'Neck Mobility',
        duration: 1,
        reps: 'All directions',
        instructions: 'Gentle neck rolls and side stretches',
      },
    ],
    lower_body: [
      {
        name: 'Quad Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Standing or lying position',
      },
      {
        name: 'Hamstring Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Seated or standing forward fold',
      },
      {
        name: 'Hip Flexor Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Lunge position stretch',
      },
      {
        name: 'Pigeon Pose',
        duration: 2,
        reps: 'Hold 60 sec each',
        instructions: 'Deep hip and glute stretch',
      },
      {
        name: 'Calf Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Wall stretch or lunge position',
      },
    ],
    full_body: [
      {
        name: 'Full Body Stretch Sequence',
        duration: 5,
        reps: 'Hold 30 sec each',
        instructions: 'All major muscle groups',
      },
      {
        name: 'Child\'s Pose',
        duration: 2,
        reps: 'Hold 60 sec',
        instructions: 'Deep relaxation stretch',
      },
    ],
    push: [
      {
        name: 'Chest Stretch',
        duration: 1,
        reps: 'Hold 30 sec',
        instructions: 'Doorway or cross-body',
      },
      {
        name: 'Shoulder Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Multiple directions',
      },
      {
        name: 'Tricep Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Behind head',
      },
    ],
    pull: [
      {
        name: 'Lat Stretch',
        duration: 1,
        reps: 'Hold 30 sec each',
        instructions: 'Reach overhead and to the side',
      },
      {
        name: 'Chest Stretch',
        duration: 1,
        reps: 'Hold 30 sec',
        instructions: 'Cross-body stretch',
      },
      {
        name: 'Back Stretch',
        duration: 2,
        reps: 'Hold 60 sec',
        instructions: 'Child\'s pose or cat pose',
      },
    ],
  }

  const routines = type === 'warmup' ? warmupRoutines : cooldownRoutines
  return routines[focus] || routines.full_body
}

// Import eq for the database query
import { eq } from 'drizzle-orm'
