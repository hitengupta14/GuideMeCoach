import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { adminActivityLogs, appSettings } from '@/db/schema'
import { requireAdmin } from '@/lib/admin-auth'
import { appSettingsValueSchema, getGlobalAppSettings } from '@/lib/app-settings'

const settingsUpdateSchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    apiRateLimit: z.coerce.number().int().min(1).max(100_000).optional(),
    maxUploadSize: z.coerce.number().int().min(1).max(2_048).optional(),
    enableRegistration: z.boolean().optional(),
    enableSocialAuth: z.boolean().optional(),
  })
  .strict()

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || '')
  return error?.code === '42P01' && message.toLowerCase().includes(table.toLowerCase())
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageSystem' })
    if (admin instanceof NextResponse) return admin

    const settings = await getGlobalAppSettings({ createIfMissing: true })
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    if (isMissingTableError(error, 'app_settings')) {
      return NextResponse.json(
        { success: false, error: 'app_settings table missing. Run DB migrations.' },
        { status: 503 }
      )
    }

    console.error('Admin settings GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageSystem' })
    if (admin instanceof NextResponse) return admin

    const body = await request.json().catch(() => ({}))
    const parsed = settingsUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const current = await getGlobalAppSettings({ createIfMissing: true })
    const next = appSettingsValueSchema.parse({ ...current, ...parsed.data })
    const now = new Date()

    const [row] = await db
      .insert(appSettings)
      .values({
        key: 'global',
        value: next,
        updatedByAdminId: admin.userId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: next,
          updatedByAdminId: admin.userId,
          updatedAt: now,
        },
      })
      .returning({ value: appSettings.value })

    await db.insert(adminActivityLogs).values({
      adminId: admin.userId,
      action: 'app_settings_updated',
      targetType: 'app_settings',
      targetId: 'global',
      metadata: { updatedKeys: Object.keys(parsed.data) },
    })

    return NextResponse.json({ success: true, settings: row?.value ?? next })
  } catch (error) {
    if (isMissingTableError(error, 'app_settings')) {
      return NextResponse.json(
        { success: false, error: 'app_settings table missing. Run DB migrations.' },
        { status: 503 }
      )
    }

    console.error('Admin settings PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
