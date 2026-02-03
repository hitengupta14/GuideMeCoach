import { verifySession } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sorenessEntries } from '@/db/schema'
import { and, desc, eq, gte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const daysParam = req.nextUrl.searchParams.get('days') || '30'
    const recentDays = Math.max(1, Math.min(365, parseInt(daysParam)))
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - recentDays)

    const filteredSoreness = await db
      .select({
        date: sorenessEntries.recordedAt,
        areas: sorenessEntries.areas,
        notes: sorenessEntries.notes,
      })
      .from(sorenessEntries)
      .where(and(eq(sorenessEntries.userId, userId), gte(sorenessEntries.recordedAt, cutoffDate)))
      .orderBy(desc(sorenessEntries.recordedAt))
      .limit(200)

    // Calculate average soreness by body part
    const bodyPartAverages: Record<string, number[]> = {}
    filteredSoreness.forEach(entry => {
      Object.entries((entry.areas || {}) as Record<string, number>).forEach(([part, level]) => {
        if (!bodyPartAverages[part]) {
          bodyPartAverages[part] = []
        }
        bodyPartAverages[part].push(level)
      })
    })

    const averageSoreness = Object.entries(bodyPartAverages).reduce(
      (acc, [part, levels]) => {
        const avg = levels.length > 0 ? (levels.reduce((a, b) => a + b, 0) / levels.length) : 0
        acc[part] = avg.toFixed(1)
        return acc
      },
      {} as Record<string, string>
    )

    return NextResponse.json({
      soreness: filteredSoreness.map((e) => ({
        date: (e.date as Date).toISOString(),
        areas: e.areas,
        notes: e.notes || undefined,
      })),
      averageSoreness,
      trend: 'stable', // Could be 'improving', 'worsening'
    })
  } catch (error) {
    console.error('Soreness fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch soreness data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { areas, notes } = await req.json()

    if (!areas || typeof areas !== 'object') {
      return NextResponse.json(
        { error: 'areas object is required (e.g., {chest: 5, shoulders: 3})' },
        { status: 400 }
      )
    }

    // Validate pain levels (1-10)
    for (const [_, level] of Object.entries(areas)) {
      if (typeof level !== 'number' || level < 0 || level > 10) {
        return NextResponse.json(
          { error: 'Pain levels must be between 0-10' },
          { status: 400 }
        )
      }
    }

    const [entry] = await db
      .insert(sorenessEntries)
      .values({
        userId,
        recordedAt: new Date(),
        areas,
        notes: typeof notes === 'string' ? notes : null,
      })
      .returning({
        date: sorenessEntries.recordedAt,
        areas: sorenessEntries.areas,
        notes: sorenessEntries.notes,
      })

    return NextResponse.json({
      success: true,
      message: 'Soreness recorded',
      entry: {
        date: (entry.date as Date).toISOString(),
        areas: entry.areas,
        notes: entry.notes || undefined,
      },
    })
  } catch (error) {
    console.error('Soreness update error:', error)
    return NextResponse.json(
      { error: 'Failed to record soreness' },
      { status: 500 }
    )
  }
}
