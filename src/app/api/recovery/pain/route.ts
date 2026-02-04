import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { painEntries, workoutSessions } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function normalizeJoints(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = String(k).trim()
    if (!key) continue
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) continue
    out[key] = Math.max(0, Math.min(10, Math.round(n)))
  }
  return out
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, 50)
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await db
      .select({
        id: painEntries.id,
        sessionId: painEntries.sessionId,
        recordedAt: painEntries.recordedAt,
        joints: painEntries.joints,
        redFlags: painEntries.redFlags,
        notes: painEntries.notes,
        createdAt: painEntries.createdAt,
        updatedAt: painEntries.updatedAt,
      })
      .from(painEntries)
      .where(eq(painEntries.userId, userId))
      .orderBy(desc(painEntries.recordedAt))
      .limit(30)

    return NextResponse.json({ entries: rows })
  } catch (error) {
    console.error('Pain entries GET error:', error)
    return NextResponse.json({ error: 'Failed to load pain entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as any
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined
    const joints = normalizeJoints(body?.joints)
    const redFlags = normalizeStringArray(body?.redFlags)
    const notes = typeof body?.notes === 'string' ? body.notes.slice(0, 2000) : undefined

    if (Object.keys(joints).length === 0 && redFlags.length === 0 && !notes) {
      return NextResponse.json({ error: 'No pain data provided' }, { status: 400 })
    }

    if (sessionId) {
      const owned = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
        .limit(1)
        .then((rows) => rows[0])

      if (!owned) {
        return NextResponse.json({ error: 'Workout session not found' }, { status: 404 })
      }
    }

    const [created] = await db
      .insert(painEntries)
      .values({
        userId,
        sessionId: sessionId || undefined,
        joints,
        redFlags,
        notes,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ entry: created }, { status: 201 })
  } catch (error) {
    console.error('Pain entries POST error:', error)
    return NextResponse.json({ error: 'Failed to save pain entry' }, { status: 500 })
  }
}

