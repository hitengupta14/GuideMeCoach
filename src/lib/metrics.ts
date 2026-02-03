import 'server-only'

import { db } from '@/db'
import { metricsCounters } from '@/db/schema'
import { sql } from 'drizzle-orm'

export type MetricTags = Record<string, string | number | boolean | null | undefined>

function serializeTags(tags: MetricTags | undefined) {
  if (!tags) return ''

  const entries = Object.entries(tags)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) return ''
  return entries.map(([k, v]) => `${k}=${v}`).join(',')
}

export function normalizePathname(pathname: string) {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      const lower = seg.toLowerCase()

      // UUID v4-ish
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(lower)) {
        return ':id'
      }

      // Numeric IDs
      if (/^\d+$/.test(seg)) {
        return ':n'
      }

      // Long opaque tokens (keep cardinality under control)
      if (seg.length >= 20 && /^[A-Za-z0-9_-]+$/.test(seg)) {
        return ':token'
      }

      return seg
    })

  return '/' + segments.join('/')
}

export async function incrementMetric(
  name: string,
  tags?: MetricTags,
  delta: number = 1
) {
  const day = new Date().toISOString().slice(0, 10)
  const tagStr = serializeTags(tags)
  const key = tagStr ? `${day}|${name}|${tagStr}` : `${day}|${name}`

  await db
    .insert(metricsCounters)
    .values({
      key,
      count: delta,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: metricsCounters.key,
      set: {
        count: sql`${metricsCounters.count} + ${delta}`,
        updatedAt: sql`now()`,
      },
    })
}

