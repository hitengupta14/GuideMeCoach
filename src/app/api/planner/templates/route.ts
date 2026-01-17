import { db } from '@/db'
import { workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// Predefined workout templates
const WORKOUT_TEMPLATES = {
  fullbody_beginner: {
    name: 'Full Body - Beginner',
    description: 'Full body workouts 3x per week - perfect for beginners',
    durationWeeks: 4,
    structure: {
      weeks: [
        {
          weekNumber: 1,
          days: [
            { dayNumber: 1, name: 'Full Body A', focus: ['chest', 'back', 'legs', 'core'] },
            { dayNumber: 3, name: 'Full Body B', focus: ['shoulders', 'arms', 'legs', 'mobility'] },
            { dayNumber: 5, name: 'Full Body C', focus: ['back', 'chest', 'legs', 'cardio'] },
          ],
        },
      ],
    },
  },
  upperlower: {
    name: 'Upper/Lower Split',
    description: '4-day split alternating upper and lower body',
    durationWeeks: 4,
    structure: {
      weeks: [
        {
          weekNumber: 1,
          days: [
            { dayNumber: 1, name: 'Upper Power', focus: ['chest', 'back', 'shoulders'] },
            { dayNumber: 2, name: 'Lower Power', focus: ['quads', 'hamstring', 'glutes'] },
            { dayNumber: 4, name: 'Upper Hypertrophy', focus: ['back', 'shoulders', 'arms'] },
            { dayNumber: 5, name: 'Lower Hypertrophy', focus: ['glutes', 'hamstring', 'quads'] },
          ],
        },
      ],
    },
  },
  pushpulllegs: {
    name: 'Push/Pull/Legs',
    description: '6-day split for advanced lifters',
    durationWeeks: 4,
    structure: {
      weeks: [
        {
          weekNumber: 1,
          days: [
            { dayNumber: 1, name: 'Push A', focus: ['chest', 'shoulders', 'triceps'] },
            { dayNumber: 2, name: 'Pull A', focus: ['back', 'biceps'] },
            { dayNumber: 3, name: 'Legs A', focus: ['quads', 'hamstring', 'glutes'] },
            { dayNumber: 4, name: 'Push B', focus: ['shoulders', 'chest', 'triceps'] },
            { dayNumber: 5, name: 'Pull B', focus: ['back', 'biceps', 'rear delts'] },
            { dayNumber: 6, name: 'Legs B', focus: ['glutes', 'hamstring', 'calves'] },
          ],
        },
      ],
    },
  },
  bodybuilding: {
    name: 'Bodybuilding Split',
    description: '5-day bodybuilding focused on hypertrophy',
    durationWeeks: 4,
    structure: {
      weeks: [
        {
          weekNumber: 1,
          days: [
            { dayNumber: 1, name: 'Chest & Triceps', focus: ['chest', 'triceps'] },
            { dayNumber: 2, name: 'Back & Biceps', focus: ['back', 'biceps'] },
            { dayNumber: 3, name: 'Rest', focus: [] },
            { dayNumber: 4, name: 'Shoulders', focus: ['shoulders'] },
            { dayNumber: 5, name: 'Legs', focus: ['quads', 'hamstring', 'glutes', 'calves'] },
          ],
        },
      ],
    },
  },
  strength_focus: {
    name: 'Strength Focus',
    description: '4-day program focusing on compound lifts and strength',
    durationWeeks: 4,
    structure: {
      weeks: [
        {
          weekNumber: 1,
          days: [
            { dayNumber: 1, name: 'Squat Day', focus: ['quads', 'glutes', 'hamstring'] },
            { dayNumber: 2, name: 'Bench Day', focus: ['chest', 'shoulders', 'triceps'] },
            { dayNumber: 4, name: 'Deadlift Day', focus: ['back', 'hamstring', 'glutes'] },
            { dayNumber: 5, name: 'Overhead Day', focus: ['shoulders', 'chest', 'triceps'] },
          ],
        },
      ],
    },
  },
  home_minimal: {
    name: 'Home - Minimal Equipment',
    description: 'Bodyweight focused routines - perfect for home workouts',
    durationWeeks: 4,
    structure: {
      weeks: [
        {
          weekNumber: 1,
          days: [
            { dayNumber: 1, name: 'Upper Body', focus: ['chest', 'back', 'shoulders', 'arms'] },
            { dayNumber: 3, name: 'Lower Body', focus: ['legs', 'glutes', 'core'] },
            { dayNumber: 5, name: 'Full Body', focus: ['chest', 'back', 'legs', 'core'] },
          ],
        },
      ],
    },
  },
}

// GET - List available templates
export async function GET(req: Request) {
  try {
    const templates = Object.entries(WORKOUT_TEMPLATES).map(([key, value]) => ({
      id: key,
      ...value,
    }))

    return Response.json({ templates })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Apply template to user's plan
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

    const userId = verified.payload.userId as string
    const { templateId, planName } = await req.json()

    if (!templateId || !(templateId in WORKOUT_TEMPLATES)) {
      return Response.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const template = WORKOUT_TEMPLATES[templateId as keyof typeof WORKOUT_TEMPLATES]

    // Create new workout plan
    const newPlan = await db.insert(workoutPlans).values({
      userId,
      name: planName || template.name,
      description: template.description,
      durationWeeks: template.durationWeeks,
      planData: template.structure as any,
      isActive: true,
    }).returning()

    return Response.json({
      success: true,
      plan: newPlan[0],
      message: `Created plan from ${template.name} template`,
    })
  } catch (error) {
    console.error('Template creation error:', error)
    return Response.json(
      { error: 'Failed to create plan from template' },
      { status: 500 }
    )
  }
}
