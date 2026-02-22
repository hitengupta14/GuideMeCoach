import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { wearableConnections } from '@/db/schema-mobile'
import { and, desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function listConnections(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEARABLES === 'false') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await db
      .select({
        id: wearableConnections.id,
        provider: wearableConnections.provider,
        connectedAt: wearableConnections.connectedAt,
        expiresAt: wearableConnections.expiresAt,
        lastSyncedAt: wearableConnections.lastSyncedAt,
        isActive: wearableConnections.isActive,
      })
      .from(wearableConnections)
      .where(and(eq(wearableConnections.userId, userId), eq(wearableConnections.isActive, 'true')))
      .orderBy(desc(wearableConnections.connectedAt))

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        connectedAt: r.connectedAt ? new Date(r.connectedAt).toISOString() : null,
        expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
        lastSyncedAt: r.lastSyncedAt ? new Date(r.lastSyncedAt).toISOString() : null,
      })),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to list connections' }, { status: 500 })
  }
}

export const GET = withApiTelemetry(listConnections, { name: 'v1.wearables.connections' })

