import { db } from '@/db'
import { aiUsageQuotas, aiUsageLogs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

let aiQuotaTablesAvailable: boolean | null = null

function isMissingAiQuotaTableError(error: any) {
  const message = String(error?.message || '')
  return (
    error?.code === '42P01' ||
    /relation\s+["']?ai_usage_quotas["']?\s+does not exist/i.test(message) ||
    /relation\s+["']?public\.ai_usage_quotas["']?\s+does not exist/i.test(message) ||
    /relation\s+["']?ai_usage_logs["']?\s+does not exist/i.test(message) ||
    /relation\s+["']?public\.ai_usage_logs["']?\s+does not exist/i.test(message)
  )
}

function fallbackQuota(feature: AIFeature, isPremium: boolean) {
  const now = new Date()
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return {
    id: `fallback-${feature}`,
    userId: 'unknown',
    feature,
    usedCount: 0,
    monthlyLimit: isPremium ? AI_FEATURE_LIMITS.paid[feature] : AI_FEATURE_LIMITS.free[feature],
    resetAt: resetDate,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * AI Feature types with their default limits
 * Phase 1: Lock these quotas strictly
 */
export const AI_FEATURE_LIMITS = {
  free: {
    planner: 0, // Free users get NO AI planner
    chat: 0, // Free users get NO AI chat
    insights: 0, // Free users get NO AI insights
    edits: 0, // Free users get NO AI edits
  },
  paid: {
    planner: 2, // 2 AI plans per month
    chat: 25, // 25 chat messages per month
    insights: 4, // 4 AI insights per month (weekly)
    edits: 3, // 3 AI plan edits per month
  },
} as const

export type AIFeature = 'planner' | 'chat' | 'insights' | 'edits'

/**
 * Get or create AI usage quota for a user and feature
 */
export async function getOrCreateQuota(
  userId: string,
  feature: AIFeature,
  isPremium: boolean
) {
  if (aiQuotaTablesAvailable === false) {
    return fallbackQuota(feature, isPremium)
  }

  const now = new Date()
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1) // First day of next month

  try {
    // Try to find existing quota
    const existing = await db.query.aiUsageQuotas.findFirst({
      where: and(
        eq(aiUsageQuotas.userId, userId),
        eq(aiUsageQuotas.feature, feature)
      ),
    })

    if (existing) {
      // Check if we need to reset the quota (new month)
      if (new Date(existing.resetAt) <= now) {
        // Reset the quota
        const [updated] = await db
          .update(aiUsageQuotas)
          .set({
            usedCount: 0,
            monthlyLimit: isPremium
              ? AI_FEATURE_LIMITS.paid[feature]
              : AI_FEATURE_LIMITS.free[feature],
            resetAt: resetDate,
            updatedAt: now,
          })
          .where(eq(aiUsageQuotas.id, existing.id))
          .returning()

        return updated
      }

      return existing
    }

    // Create new quota
    const [newQuota] = await db
      .insert(aiUsageQuotas)
      .values({
        userId,
        feature,
        usedCount: 0,
        monthlyLimit: isPremium
          ? AI_FEATURE_LIMITS.paid[feature]
          : AI_FEATURE_LIMITS.free[feature],
        resetAt: resetDate,
      })
      .returning()

    return newQuota
  } catch (error) {
    if (isMissingAiQuotaTableError(error)) {
      aiQuotaTablesAvailable = false
      return fallbackQuota(feature, isPremium)
    }
    throw error
  }
}

/**
 * Check if user has quota available for a feature
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkQuota(
  userId: string,
  feature: AIFeature,
  isPremium: boolean
) {
  const quota = await getOrCreateQuota(userId, feature, isPremium)

  const remaining = quota.monthlyLimit - quota.usedCount
  const allowed = remaining > 0

  return {
    allowed,
    used: quota.usedCount,
    remaining,
    limit: quota.monthlyLimit,
    resetAt: quota.resetAt,
  }
}

/**
 * Decrement user's AI quota after successful usage
 */
export async function decrementQuota(
  userId: string,
  feature: AIFeature,
  isPremium: boolean
) {
  if (aiQuotaTablesAvailable === false) {
    return fallbackQuota(feature, isPremium)
  }

  const quota = await getOrCreateQuota(userId, feature, isPremium)

  if (quota.usedCount >= quota.monthlyLimit) {
    throw new Error(`AI quota exceeded for feature: ${feature}`)
  }

  try {
    const [updated] = await db
      .update(aiUsageQuotas)
      .set({
        usedCount: quota.usedCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(aiUsageQuotas.id, quota.id))
      .returning()

    return updated
  } catch (error) {
    if (isMissingAiQuotaTableError(error)) {
      aiQuotaTablesAvailable = false
      return fallbackQuota(feature, isPremium)
    }
    throw error
  }
}

/**
 * Log AI usage for monitoring and cost tracking
 */
export async function logAIUsage({
  userId,
  feature,
  model,
  tokensUsed,
  estimatedCost,
  responseTime,
  success = true,
  errorMessage,
}: {
  userId: string
  feature: AIFeature
  model: string
  tokensUsed?: number
  estimatedCost?: number // in cents
  responseTime?: number // ms
  success?: boolean
  errorMessage?: string
}) {
  if (aiQuotaTablesAvailable === false) return
  try {
    await db.insert(aiUsageLogs).values({
      userId,
      feature,
      model,
      tokensUsed,
      estimatedCost,
      responseTime,
      success,
      errorMessage,
    })
  } catch (error) {
    if (isMissingAiQuotaTableError(error)) {
      aiQuotaTablesAvailable = false
      return
    }
    throw error
  }
}

/**
 * Get all quotas for a user (for display in UI)
 */
export async function getUserQuotas(userId: string, isPremium: boolean) {
  const features: AIFeature[] = ['planner', 'chat', 'insights', 'edits']

  const quotas = await Promise.all(
    features.map(async (feature) => {
      const quota = await getOrCreateQuota(userId, feature, isPremium)
      return {
        feature,
        used: quota.usedCount,
        limit: quota.monthlyLimit,
        remaining: quota.monthlyLimit - quota.usedCount,
        resetAt: quota.resetAt,
      }
    })
  )

  return quotas
}
