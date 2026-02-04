import 'server-only'

import { z } from 'zod'

const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development')

// NOTE: Keep this schema server-only. Do not import from client components.
const serverEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,

  // Core
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // App URLs
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // AI
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Payments (Razorpay)
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Cron / internal
  CRON_SECRET: z.string().min(1).optional(),

  // Feature flags
  ENABLE_ADMIN_DEBUG: z.string().optional(),
  ENABLE_WEARABLES: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().min(1).optional(),
  DATADOG_API_KEY: z.string().min(1).optional(),
})

type ServerEnv = z.infer<typeof serverEnvSchema>

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ')
}

function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${formatZodError(parsed.error)}`)
  }

  const env = parsed.data

  // Fail closed on missing critical third-party keys in production.
  if (env.NODE_ENV === 'production') {
    const missing: string[] = []
    if (!env.APP_URL && !env.NEXT_PUBLIC_APP_URL) missing.push('APP_URL (or NEXT_PUBLIC_APP_URL)')
    if (!env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
    if (!env.RESEND_FROM_EMAIL) missing.push('RESEND_FROM_EMAIL')
    if (!env.RAZORPAY_KEY_ID) missing.push('RAZORPAY_KEY_ID')
    if (!env.RAZORPAY_KEY_SECRET) missing.push('RAZORPAY_KEY_SECRET')
    if (!env.RAZORPAY_WEBHOOK_SECRET) missing.push('RAZORPAY_WEBHOOK_SECRET')
    if (!env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY')
    if (!env.CRON_SECRET) missing.push('CRON_SECRET')

    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)
    }
  }

  return env
}

// Parse once, cache forever.
export const env: ServerEnv = validateServerEnv()

