import 'server-only'

import { db } from '@/db'
import { appSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const DEFAULT_APP_SETTINGS = {
  maintenanceMode: false,
  apiRateLimit: 1000,
  maxUploadSize: 100,
  enableRegistration: true,
  enableSocialAuth: true,
} as const

const settingsPartialSchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    apiRateLimit: z.coerce.number().int().min(1).max(100_000).optional(),
    maxUploadSize: z.coerce.number().int().min(1).max(2_048).optional(),
    enableRegistration: z.boolean().optional(),
    enableSocialAuth: z.boolean().optional(),
  })
  .passthrough()

export const appSettingsValueSchema = settingsPartialSchema.transform((value) => ({
  ...DEFAULT_APP_SETTINGS,
  ...value,
}))

export type AppSettingsValue = z.output<typeof appSettingsValueSchema>

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || '')
  return error?.code === '42P01' && message.toLowerCase().includes(table.toLowerCase())
}

export async function getGlobalAppSettings(options?: {
  createIfMissing?: boolean
}): Promise<AppSettingsValue> {
  const createIfMissing = options?.createIfMissing ?? false

  try {
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, 'global'))
      .limit(1)

    if (row?.value) {
      return appSettingsValueSchema.parse(row.value)
    }

    if (!createIfMissing) {
      return DEFAULT_APP_SETTINGS
    }

    await db
      .insert(appSettings)
      .values({
        key: 'global',
        value: DEFAULT_APP_SETTINGS,
      })
      .onConflictDoNothing()

    const [created] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, 'global'))
      .limit(1)

    return created?.value ? appSettingsValueSchema.parse(created.value) : DEFAULT_APP_SETTINGS
  } catch (error) {
    if (isMissingTableError(error, 'app_settings')) {
      return DEFAULT_APP_SETTINGS
    }

    return DEFAULT_APP_SETTINGS
  }
}

