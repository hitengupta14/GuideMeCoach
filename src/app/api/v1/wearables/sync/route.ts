import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { wearableConnections, wearableData } from '@/db/schema-mobile'
import { and, eq, gte, inArray, lt } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { decryptOptional, decryptSecret, encryptOptional, encryptSecret } from '@/lib/secret-crypto'
import { createRateLimiter } from '@/lib/rate-limit'

const wearablesSyncRateLimiter = createRateLimiter(60 * 1000, 10, async (request) => {
  const userId = await verifySession(request as any).catch(() => null)
  return `${userId || request.headers.get('x-forwarded-for') || 'unknown'}:v1.wearables.sync`
})

type Provider = 'apple-health' | 'fitbit' | 'google-fit'

function clampDays(input: unknown): number {
  const n = typeof input === 'number' ? input : typeof input === 'string' ? Number(input) : NaN
  if (!Number.isFinite(n)) return 7
  return Math.max(1, Math.min(30, Math.round(n)))
}

function utcDayStart(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function formatIsoDate(date: Date): string {
  return utcDayStart(date).toISOString().slice(0, 10)
}

function shouldRefresh(expiresAt: Date | null, skewSeconds = 60): boolean {
  if (!expiresAt) return false
  return expiresAt.getTime() <= Date.now() + skewSeconds * 1000
}

async function refreshFitbitToken(refreshToken: string) {
  const clientId = process.env.FITBIT_CLIENT_ID
  const clientSecret = process.env.FITBIT_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('FITBIT_CLIENT_ID/FITBIT_CLIENT_SECRET are not configured')
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fitbit refresh failed (${res.status}): ${text || res.statusText}`)
  }

  const json: any = await res.json()
  return {
    accessToken: json?.access_token as string,
    refreshToken: (json?.refresh_token as string) || refreshToken,
    expiresIn: typeof json?.expires_in === 'number' ? json.expires_in : Number(json?.expires_in),
  }
}

async function refreshGoogleToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are not configured')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google refresh failed (${res.status}): ${text || res.statusText}`)
  }

  const json: any = await res.json()
  return {
    accessToken: json?.access_token as string,
    refreshToken,
    expiresIn: typeof json?.expires_in === 'number' ? json.expires_in : Number(json?.expires_in),
  }
}

type WearableMetricRow = {
  provider: Provider
  metricType: string
  value: number
  unit: string
  recordedAt: Date
  metadata?: Record<string, any>
}

async function fetchFitbitDaily(accessToken: string, dateIso: string) {
  const res = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${dateIso}.json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fitbit activities failed (${res.status}): ${text || res.statusText}`)
  }
  return res.json()
}

async function fetchFitbitHeart(accessToken: string, dateIso: string) {
  const res = await fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${dateIso}/1d.json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    return null
  }
  return res.json().catch(() => null)
}

async function fetchFitbitSleep(accessToken: string, dateIso: string) {
  const res = await fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${dateIso}.json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    return null
  }
  return res.json().catch(() => null)
}

function extractFitbitMetrics(date: Date, activities: any, heart: any, sleep: any): WearableMetricRow[] {
  const rows: WearableMetricRow[] = []
  const recordedAt = utcDayStart(date)

  const summary = activities?.summary || {}
  const steps = typeof summary.steps === 'number' ? summary.steps : Number(summary.steps)
  if (Number.isFinite(steps) && steps >= 0) {
    rows.push({ provider: 'fitbit', metricType: 'steps', value: steps, unit: 'steps', recordedAt })
  }

  const caloriesOut = typeof summary.caloriesOut === 'number' ? summary.caloriesOut : Number(summary.caloriesOut)
  if (Number.isFinite(caloriesOut) && caloriesOut >= 0) {
    rows.push({
      provider: 'fitbit',
      metricType: 'calories_burned',
      value: caloriesOut,
      unit: 'kcal',
      recordedAt,
    })
  }

  const distances: any[] = Array.isArray(summary.distances) ? summary.distances : []
  const totalDistance = distances.find((d) => d?.activity === 'total')?.distance
  const distanceKm = typeof totalDistance === 'number' ? totalDistance : totalDistance ? Number(totalDistance) : NaN
  if (Number.isFinite(distanceKm) && distanceKm >= 0) {
    rows.push({ provider: 'fitbit', metricType: 'distance', value: distanceKm, unit: 'km', recordedAt })
  }

  const resting = heart?.['activities-heart']?.[0]?.value?.restingHeartRate
  const restingBpm = typeof resting === 'number' ? resting : resting ? Number(resting) : NaN
  if (Number.isFinite(restingBpm) && restingBpm > 0) {
    rows.push({
      provider: 'fitbit',
      metricType: 'heart_rate_bpm',
      value: restingBpm,
      unit: 'bpm',
      recordedAt,
      metadata: { kind: 'resting' },
    })
  }

  const minutesAsleep = sleep?.summary?.totalMinutesAsleep
  const sleepMinutes = typeof minutesAsleep === 'number' ? minutesAsleep : minutesAsleep ? Number(minutesAsleep) : NaN
  if (Number.isFinite(sleepMinutes) && sleepMinutes >= 0) {
    rows.push({
      provider: 'fitbit',
      metricType: 'sleep_minutes',
      value: sleepMinutes,
      unit: 'minutes',
      recordedAt,
    })
  }

  return rows
}

async function fetchGoogleAggregate(accessToken: string, startTimeMillis: number, endTimeMillis: number) {
  const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [
        {
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        },
        {
          dataTypeName: 'com.google.heart_rate.bpm',
        },
        {
          dataTypeName: 'com.google.calories.expended',
        },
      ],
      bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
      startTimeMillis,
      endTimeMillis,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google Fit aggregate failed (${res.status}): ${text || res.statusText}`)
  }

  return res.json()
}

function extractGoogleMetrics(data: any): WearableMetricRow[] {
  const rows: WearableMetricRow[] = []
  const buckets: any[] = Array.isArray(data?.bucket) ? data.bucket : []

  for (const bucket of buckets) {
    const startMs = Number(bucket?.startTimeMillis)
    if (!Number.isFinite(startMs)) continue
    const recordedAt = utcDayStart(new Date(startMs))

    const datasets: any[] = Array.isArray(bucket?.dataset) ? bucket.dataset : []
    const stepsDs = datasets[0]
    const hrDs = datasets[1]
    const calDs = datasets[2]

    const stepPoints: any[] = Array.isArray(stepsDs?.point) ? stepsDs.point : []
    const steps = stepPoints.reduce((sum, p) => {
      const v = p?.value?.[0]?.intVal
      const n = typeof v === 'number' ? v : v ? Number(v) : 0
      return sum + (Number.isFinite(n) ? n : 0)
    }, 0)
    if (Number.isFinite(steps) && steps >= 0) {
      rows.push({ provider: 'google-fit', metricType: 'steps', value: steps, unit: 'steps', recordedAt })
    }

    const calPoints: any[] = Array.isArray(calDs?.point) ? calDs.point : []
    const calories = calPoints.reduce((sum, p) => {
      const v = p?.value?.[0]?.fpVal ?? p?.value?.[0]?.intVal
      const n = typeof v === 'number' ? v : v ? Number(v) : 0
      return sum + (Number.isFinite(n) ? n : 0)
    }, 0)
    if (Number.isFinite(calories) && calories >= 0) {
      rows.push({
        provider: 'google-fit',
        metricType: 'calories_burned',
        value: calories,
        unit: 'kcal',
        recordedAt,
      })
    }

    const hrPoints: any[] = Array.isArray(hrDs?.point) ? hrDs.point : []
    const hrValues = hrPoints
      .map((p) => {
        const v = p?.value?.[0]?.fpVal ?? p?.value?.[0]?.intVal
        const n = typeof v === 'number' ? v : v ? Number(v) : NaN
        return Number.isFinite(n) ? n : null
      })
      .filter((n): n is number => typeof n === 'number')

    if (hrValues.length > 0) {
      const avg = hrValues.reduce((s, n) => s + n, 0) / hrValues.length
      rows.push({
        provider: 'google-fit',
        metricType: 'heart_rate_bpm',
        value: avg,
        unit: 'bpm',
        recordedAt,
        metadata: { kind: 'average' },
      })
    }
  }

  return rows
}

async function syncWearables(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEARABLES === 'false') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const rate = await wearablesSyncRateLimiter(req)
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

    const body = await req.json().catch(() => ({}))
    const days = clampDays(body?.days)
    const providerFilter = typeof body?.provider === 'string' ? (body.provider as Provider) : null

    const whereConds = [eq(wearableConnections.userId, userId), eq(wearableConnections.isActive, 'true')]
    if (providerFilter) whereConds.push(eq(wearableConnections.provider, providerFilter))

    const connections = await db
      .select({
        id: wearableConnections.id,
        provider: wearableConnections.provider,
        accessToken: wearableConnections.accessToken,
        refreshToken: wearableConnections.refreshToken,
        expiresAt: wearableConnections.expiresAt,
      })
      .from(wearableConnections)
      .where(whereConds.length === 1 ? whereConds[0] : and(...whereConds))

    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        data: { synced: [], itemsInserted: 0, message: 'No connected wearables found' },
      })
    }

    const now = new Date()
    const end = utcDayStart(now)
    const start = addDays(end, -days + 1)
    const metricTypesToManage = ['steps', 'distance', 'calories_burned', 'sleep_minutes', 'heart_rate_bpm']

	    let itemsInserted = 0
	    const synced: Array<{ provider: string; items: number; refreshed: boolean; error?: string }> = []

	    for (const c of connections) {
	      const provider = c.provider as Provider
	      if (provider === 'apple-health') {
	        // Apple Health data is expected to be synced via the mobile app.
	        synced.push({ provider, items: 0, refreshed: false })
	        continue
	      }

	      let accessToken: string
	      let refreshToken: string | null
	      try {
	        accessToken = decryptSecret(c.accessToken)
	        refreshToken = decryptOptional(c.refreshToken)
	      } catch {
	        await db
	          .update(wearableConnections)
	          .set({
	            isActive: 'false',
	            accessToken: encryptSecret('revoked'),
	            refreshToken: null,
	            expiresAt: null,
	            updatedAt: now,
	          })
	          .where(eq(wearableConnections.id, c.id))

	        synced.push({
	          provider,
	          items: 0,
	          refreshed: false,
	          error: 'Connection invalid. Please reconnect your wearable.',
	        })
	        continue
	      }
	      let refreshed = false

	      if (shouldRefresh(c.expiresAt instanceof Date ? c.expiresAt : null) && refreshToken) {
	        const refreshResult =
	          provider === 'fitbit' ? await refreshFitbitToken(refreshToken) : await refreshGoogleToken(refreshToken)
	        accessToken = refreshResult.accessToken
	        refreshToken = refreshResult.refreshToken
	        refreshed = true

        const expiresAt = Number.isFinite(refreshResult.expiresIn)
          ? new Date(Date.now() + Math.max(60, refreshResult.expiresIn) * 1000)
          : null

	        await db
	          .update(wearableConnections)
	          .set({
	            accessToken: encryptSecret(accessToken),
	            refreshToken: encryptOptional(refreshToken),
	            expiresAt,
	            updatedAt: now,
	          })
	          .where(eq(wearableConnections.id, c.id))
	      }

      let rows: WearableMetricRow[] = []

      if (provider === 'fitbit') {
        for (let i = 0; i < days; i++) {
          const d = addDays(start, i)
          const dateIso = formatIsoDate(d)
          const [activities, heart, sleep] = await Promise.all([
            fetchFitbitDaily(accessToken, dateIso),
            fetchFitbitHeart(accessToken, dateIso),
            fetchFitbitSleep(accessToken, dateIso),
          ])
          rows.push(...extractFitbitMetrics(d, activities, heart, sleep))
        }
      } else if (provider === 'google-fit') {
        const startMs = utcDayStart(start).getTime()
        const endMs = addDays(utcDayStart(end), 1).getTime()
        const data = await fetchGoogleAggregate(accessToken, startMs, endMs)
        rows = extractGoogleMetrics(data)
      }

      // Clean existing rows in range for this provider (idempotent).
      await db
        .delete(wearableData)
        .where(
          and(
            eq(wearableData.userId, userId),
            eq(wearableData.provider, provider),
            gte(wearableData.recordedAt, start),
            lt(wearableData.recordedAt, addDays(end, 1)),
            inArray(wearableData.metricType, metricTypesToManage)
          )
        )

      if (rows.length > 0) {
        await db.insert(wearableData).values(
          rows.map((r) => ({
            userId,
            provider: r.provider,
            metricType: r.metricType,
            value: String(r.value),
            unit: r.unit,
            metadata: r.metadata || {},
            recordedAt: r.recordedAt,
            syncedAt: now,
            createdAt: now,
          }))
        )
      }

      await db
        .update(wearableConnections)
        .set({ lastSyncedAt: now, updatedAt: now })
        .where(eq(wearableConnections.id, c.id))

      itemsInserted += rows.length
      synced.push({ provider, items: rows.length, refreshed })
    }

    return NextResponse.json({
      success: true,
      data: {
        synced,
        itemsInserted,
        start: start.toISOString(),
        end: end.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sync wearables' },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(syncWearables, { name: 'v1.wearables.sync' })
