import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { videos } from '@/db/schema-mobile'
import { exercises } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { createRateLimiter } from '@/lib/rate-limit'

const videoAnalyzeRateLimiter = createRateLimiter(60 * 60 * 1000, 30, async (request) => {
  const userId = await verifySession(request as any).catch(() => null)
  return `${userId || request.headers.get('x-forwarded-for') || 'unknown'}:v1.video.analyze`
})

type KeyPoint = {
  timestamp: number
  feedback: string
  severity: 'positive' | 'warning' | 'error'
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function formatIso(date: Date | null): string | undefined {
  if (!date) return undefined
  try {
    return new Date(date).toISOString()
  } catch {
    return undefined
  }
}

function buildAnalysis(options: {
  exerciseName: string
  stepByStep: string[]
  commonMistakes: string[]
  notes?: string
}): { formScore: number; improvements: string[]; keyPoints: KeyPoint[] } {
  const improvements: string[] = []

  const notes = (options.notes || '').trim()
  if (notes) {
    improvements.push(`Based on your note: ${notes.slice(0, 160)}${notes.length > 160 ? '…' : ''}`)
  }

  const mistakeImprovements = (options.commonMistakes || [])
    .filter((m) => typeof m === 'string' && m.trim().length > 0)
    .slice(0, 4)
    .map((m) => `Avoid: ${m.trim()}`)
  improvements.push(...mistakeImprovements)

  if (improvements.length < 4) {
    improvements.push(
      'Brace your core and keep a neutral spine throughout the rep.',
      'Use a controlled tempo: smooth on the way down, powerful on the way up.',
      'Prioritize full range of motion without bouncing or rushing.'
    )
  }

  const keyPointsSource = options.stepByStep?.length ? options.stepByStep : improvements
  const keyPoints: KeyPoint[] = keyPointsSource
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 5)
    .map((s, idx) => ({
      timestamp: idx * 5,
      feedback: s.trim(),
      severity: idx === 0 ? 'positive' : 'warning',
    }))

  // MVP score: until real video frame/pose analysis is integrated, keep a neutral mid-range score.
  const formScore = 7.5

  return {
    formScore,
    improvements: improvements.slice(0, 6),
    keyPoints,
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const rate = await videoAnalyzeRateLimiter(req)
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  const userId = await verifySession(req)
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const videoId = params.id
  const body = (await req.json().catch(() => ({}))) as any
  const notes = typeof body?.notes === 'string' ? body.notes : undefined

  const video = await db
    .select({
      id: videos.id,
      exerciseId: videos.exerciseId,
      status: videos.status,
      aiAnalysis: videos.aiAnalysis,
      formScore: videos.formScore,
      improvements: videos.improvements,
      analyzedAt: videos.analyzedAt,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
    .limit(1)
    .then((rows) => rows[0])

  if (!video) {
    return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 })
  }

  if (video.status === 'completed' && (video.aiAnalysis || video.formScore || video.improvements)) {
    return NextResponse.json({
      success: true,
      data: {
        status: video.status,
        formScore: typeof video.formScore === 'string' ? Number(video.formScore) : undefined,
        keyPoints: (video.aiAnalysis as any)?.keyPoints,
        improvements: (video.improvements as any) || (video.aiAnalysis as any)?.improvements,
        analyzedAt: formatIso(video.analyzedAt),
        createdAt: formatIso(video.createdAt),
        updatedAt: formatIso(video.updatedAt),
      },
    })
  }

  const now = new Date()
  await db
    .update(videos)
    .set({ status: 'processing', updatedAt: now })
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))

  try {
    let exerciseName = video.exerciseId || 'your exercise'
    let stepByStep: string[] = []
    let commonMistakes: string[] = []

    if (video.exerciseId && isUuid(video.exerciseId)) {
      const exercise = await db
        .select({
          name: exercises.name,
          stepByStep: exercises.stepByStep,
          commonMistakes: exercises.commonMistakes,
        })
        .from(exercises)
        .where(eq(exercises.id, video.exerciseId))
        .limit(1)
        .then((rows) => rows[0])

      if (exercise) {
        exerciseName = exercise.name || exerciseName
        stepByStep = Array.isArray(exercise.stepByStep) ? (exercise.stepByStep as any) : []
        commonMistakes = Array.isArray(exercise.commonMistakes) ? (exercise.commonMistakes as any) : []
      }
    }

    const analysis = buildAnalysis({
      exerciseName,
      stepByStep,
      commonMistakes,
      notes,
    })

    const completedAt = new Date()
    await db
      .update(videos)
      .set({
        status: 'completed',
        aiAnalysis: {
          formScore: analysis.formScore,
          keyPoints: analysis.keyPoints,
          improvements: analysis.improvements,
          exerciseName,
        } as any,
        formScore: analysis.formScore.toFixed(1),
        improvements: analysis.improvements,
        analyzedAt: completedAt,
        updatedAt: completedAt,
      })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))

    return NextResponse.json({
      success: true,
      data: {
        status: 'completed',
        formScore: analysis.formScore,
        keyPoints: analysis.keyPoints,
        improvements: analysis.improvements,
        analyzedAt: formatIso(completedAt),
      },
    })
  } catch (error: any) {
    const failedAt = new Date()
    await db
      .update(videos)
      .set({ status: 'failed', updatedAt: failedAt })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))

    return NextResponse.json(
      { success: false, error: error?.message || 'Video analysis failed' },
      { status: 500 }
    )
  }
}
