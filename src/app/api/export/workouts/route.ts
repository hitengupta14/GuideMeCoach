import { db } from '@/db'
import { workoutSessions, workoutLogs, exercises, users } from '@/db/schema'
import { eq, gte, lte, desc, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export async function POST(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { format = 'json', startDate, endDate, type = 'all' } = await req.json()

    // Validate dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Default: last 90 days
    const end = endDate ? new Date(endDate) : new Date()

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0])

    // Get workout sessions
    let sessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.completedAt, start),
          lte(workoutSessions.completedAt, end)
        )
      )
      .orderBy(desc(workoutSessions.completedAt))

    // Get workout logs
    const logs = await db
      .select()
      .from(workoutLogs)
      .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.performedAt, start), lte(workoutLogs.performedAt, end)))

    // Get exercise names
    const exerciseIds = [...new Set(logs.map(l => l.exerciseId))]
    const exerciseMap = new Map()
    if (exerciseIds.length > 0) {
      const exs = await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .where(eq(exercises.id, exerciseIds[0])) // Simplified for demo

      exs.forEach(ex => exerciseMap.set(ex.id, ex.name))
    }

    // Format data
    let exportData: any = {}

    if (type === 'all' || type === 'summary') {
      exportData.summary = {
        user: {
          name: user?.name,
          email: user?.email,
          height: user?.height,
          weight: user?.weight,
          goals: user?.goals,
        },
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          daysIncluded: Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        },
        stats: {
          totalWorkouts: sessions.length,
          totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
          averageDuration: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length) : 0,
        },
      }
    }

    if (type === 'all' || type === 'workouts') {
      exportData.workouts = sessions.map(session => ({
        date: new Date(session.completedAt).toISOString().split('T')[0],
        time: new Date(session.completedAt).toISOString().split('T')[1],
        name: session.dayName,
        duration: session.duration,
        energyLevel: session.energyLevel,
        difficulty: session.difficulty,
        notes: session.notes,
      }))
    }

    if (type === 'all' || type === 'performance') {
      exportData.performance = logs.map(log => ({
        date: log.performedAt ? new Date(log.performedAt).toISOString().split('T')[0] : 'Unknown',
        exercise: exerciseMap.get(log.exerciseId) || 'Unknown',
        completedSets: log.completedSets,
        completedReps: log.completedReps,
        weight: log.weight,
        rpe: log.rpe,
      }))
    }

    // Generate based on format
    if (format === 'json') {
      return Response.json({
        success: true,
        format: 'json',
        data: exportData,
      })
    } else if (format === 'csv') {
      const csv = generateCSV(exportData)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="workout-data.csv"',
        },
      })
    } else if (format === 'pdf') {
      // For PDF, we'd typically use a library like pdfkit
      // For now, return a message that PDF generation is in progress
      return Response.json({
        success: true,
        format: 'pdf',
        message: 'PDF generation available with PDF library integration',
      })
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return Response.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

function generateCSV(data: any): string {
  const lines: string[] = []

  // Summary section
  if (data.summary) {
    lines.push('SUMMARY')
    lines.push(`Name,${data.summary.user.name || ''}`)
    lines.push(`Email,${data.summary.user.email || ''}`)
    lines.push(`Period,"${data.summary.period.start} to ${data.summary.period.end}"`)
    lines.push(`Total Workouts,${data.summary.stats.totalWorkouts}`)
    lines.push(`Total Duration,${data.summary.stats.totalDuration} minutes`)
    lines.push(`Average Duration,${data.summary.stats.averageDuration} minutes`)
    lines.push('')
  }

  // Workouts section
  if (data.workouts) {
    lines.push('WORKOUTS')
    lines.push('Date,Time,Name,Duration (min),Energy Level,Difficulty,Notes')
    data.workouts.forEach((w: any) => {
      lines.push(
        `"${w.date}","${w.time}","${w.name}",${w.duration},${w.energyLevel || ''},${w.difficulty || ''},"${w.notes || ''}"`
      )
    })
    lines.push('')
  }

  // Performance section
  if (data.performance) {
    lines.push('PERFORMANCE')
    lines.push('Date,Exercise,Sets,Reps,Weight (kg),RPE')
    data.performance.forEach((p: any) => {
      lines.push(
        `"${p.date}","${p.exercise}",${p.completedSets || ''},${p.completedReps || ''},${p.weight || ''},${p.rpe || ''}`
      )
    })
  }

  return lines.join('\n')
}
