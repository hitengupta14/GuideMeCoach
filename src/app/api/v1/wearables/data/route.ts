import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { wearableConnections, wearableData } from '@/db/schema-mobile'
import { and, asc, desc, eq, gte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const VALID_PROVIDERS = ['apple-health', 'fitbit', 'google-fit'] as const
type Provider = (typeof VALID_PROVIDERS)[number]

function parseDays(input: string | null): number {
  const n = Number(input || '7')
  if (!Number.isFinite(n) || n <= 0) return 7
  return Math.max(1, Math.min(90, Math.round(n)))
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : null
}

function dayIso(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function GET(req: NextRequest) {
  try {
    // Hide wearables in production only if explicitly disabled.
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEARABLES === 'false') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const days = parseDays(req.nextUrl.searchParams.get('days'))
    const providerRaw = req.nextUrl.searchParams.get('provider')
    const provider =
      providerRaw && (VALID_PROVIDERS as readonly string[]).includes(providerRaw)
        ? (providerRaw as Provider)
        : undefined

    const start = new Date()
    start.setDate(start.getDate() - days)

    const whereConds = [eq(wearableData.userId, userId), gte(wearableData.recordedAt, start)]
    if (provider) whereConds.push(eq(wearableData.provider, provider))

    const rows = await db
      .select({
        provider: wearableData.provider,
        metricType: wearableData.metricType,
        value: wearableData.value,
        unit: wearableData.unit,
        metadata: wearableData.metadata,
        recordedAt: wearableData.recordedAt,
      })
      .from(wearableData)
      .where(whereConds.length === 1 ? whereConds[0] : and(...whereConds))
      .orderBy(asc(wearableData.recordedAt))

    const byDay = new Map<
      string,
      { steps: number; distance: number; calories: number; heartRates: number[]; sleepMinutes: number }
    >()

    for (const r of rows) {
      const d = new Date(r.recordedAt)
      const key = d.toISOString().slice(0, 10)
      const agg = byDay.get(key) || { steps: 0, distance: 0, calories: 0, heartRates: [], sleepMinutes: 0 }

      const v = asNumber(r.value)
      if (v === null) {
        byDay.set(key, agg)
        continue
      }

      switch (r.metricType) {
        case 'steps':
          agg.steps += v
          break
        case 'distance':
          agg.distance += v
          break
        case 'calories':
        case 'calories_burned':
          agg.calories += v
          break
        case 'heart_rate':
        case 'heart_rate_bpm':
          agg.heartRates.push(v)
          break
        case 'sleep':
        case 'sleep_minutes':
        case 'sleep_duration':
          agg.sleepMinutes += v
          break
      }

      byDay.set(key, agg)
    }

    const dayKeys = Array.from(byDay.keys()).sort()

    const steps = dayKeys
      .map((k) => {
        const a = byDay.get(k)!
        if (a.steps <= 0 && a.distance <= 0) return null
        return {
          timestamp: dayIso(new Date(k)),
          steps: Math.round(a.steps),
          distance: a.distance > 0 ? Math.round(a.distance) : undefined,
        }
      })
      .filter(Boolean)

    const distance = dayKeys
      .map((k) => {
        const a = byDay.get(k)!
        if (a.distance <= 0) return null
        return {
          timestamp: dayIso(new Date(k)),
          distance: Math.round(a.distance),
        }
      })
      .filter(Boolean)

    const calories = dayKeys
      .map((k) => {
        const a = byDay.get(k)!
        if (a.calories <= 0) return null
        return {
          timestamp: dayIso(new Date(k)),
          burned: Math.round(a.calories),
        }
      })
      .filter(Boolean)

    const heartRate = dayKeys
      .map((k) => {
        const a = byDay.get(k)!
        if (a.heartRates.length === 0) return null
        const min = Math.min(...a.heartRates)
        const max = Math.max(...a.heartRates)
        const avg = a.heartRates.reduce((s, n) => s + n, 0) / a.heartRates.length
        return {
          timestamp: dayIso(new Date(k)),
          resting: Math.round(min),
          average: Math.round(avg),
          peak: Math.round(max),
        }
      })
      .filter(Boolean)

    const sleep = dayKeys
      .map((k) => {
        const a = byDay.get(k)!
        if (a.sleepMinutes <= 0) return null
        return {
          timestamp: dayIso(new Date(k)),
          duration: Math.round(a.sleepMinutes),
        }
      })
      .filter(Boolean)

    // Resolve lastSyncedAt from the latest active connection (if any).
    const connWhere = [eq(wearableConnections.userId, userId), eq(wearableConnections.isActive, 'true')]
    if (provider) connWhere.push(eq(wearableConnections.provider, provider))

    const latestConn = await db
      .select({
        lastSyncedAt: wearableConnections.lastSyncedAt,
        connectedAt: wearableConnections.connectedAt,
      })
      .from(wearableConnections)
      .where(connWhere.length === 1 ? connWhere[0] : and(...connWhere))
      .orderBy(desc(wearableConnections.lastSyncedAt), desc(wearableConnections.connectedAt))
      .limit(1)
      .then((r) => r[0])

    const lastSyncedAt =
      latestConn?.lastSyncedAt || latestConn?.connectedAt ? new Date((latestConn.lastSyncedAt || latestConn.connectedAt) as any).toISOString() : null

    return NextResponse.json({
      success: true,
      data: {
        heartRate,
        steps,
        calories,
        sleep,
        distance,
        lastSyncedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching wearable data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wearable data' },
      { status: 500 }
    )
  }
}
