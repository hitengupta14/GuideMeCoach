import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiUsageLogs, emailCampaigns } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || '')
  return error?.code === '42P01' && message.toLowerCase().includes(table.toLowerCase())
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageSystem' })
    if (admin instanceof NextResponse) return admin

    // Check database connection
    let databaseStatus: 'healthy' | 'warning' | 'error' = 'healthy'
    let databaseMessage = 'Connected'
    
    try {
      await db.execute(sql`SELECT 1`)
    } catch (error) {
      databaseStatus = 'error'
      databaseMessage = 'Connection failed'
    }

    // Check API server (if we're here, it's running)
    const apiStatus: 'healthy' | 'warning' | 'error' = 'healthy'
    const apiMessage = 'Running normally'

    // Check AI service (env + last-hour error rate)
    let aiStatus: 'healthy' | 'warning' | 'error' = 'healthy'
    let aiMessage = 'Configured'
    if (!process.env.OPENAI_API_KEY) {
      aiStatus = 'warning'
      aiMessage = 'OPENAI_API_KEY not set'
    } else {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const [row] = await db
          .select({
            total: sql<number>`count(*)`,
            failures: sql<number>`coalesce(sum(case when ${aiUsageLogs.success} = false then 1 else 0 end), 0)`,
            successes: sql<number>`coalesce(sum(case when ${aiUsageLogs.success} = true then 1 else 0 end), 0)`,
          })
          .from(aiUsageLogs)
          .where(sql`${aiUsageLogs.createdAt} >= ${oneHourAgo}`)

        const total = Number(row?.total || 0)
        const failures = Number(row?.failures || 0)
        const successes = Number(row?.successes || 0)

        if (total === 0) {
          aiStatus = 'healthy'
          aiMessage = 'No recent requests'
        } else if (successes === 0 && failures > 0) {
          aiStatus = 'error'
          aiMessage = `All recent requests failed (${failures}/${total} in last hour)`
        } else {
          const failureRate = failures / total
          if (failureRate > 0.2) {
            aiStatus = 'warning'
            aiMessage = `Elevated failures (${failures}/${total} in last hour)`
          } else {
            aiStatus = 'healthy'
            aiMessage = `Healthy (${successes}/${total} ok in last hour)`
          }
        }
      } catch (error) {
        aiStatus = 'warning'
        aiMessage = 'Configured (log check unavailable)'
      }
    }

    // Check email service (env + recent failed campaigns)
    let emailStatus: 'healthy' | 'warning' | 'error' = 'healthy'
    let emailMessage = 'Configured'
    if (!process.env.RESEND_API_KEY) {
      emailStatus = 'warning'
      emailMessage = 'RESEND_API_KEY not set (dev mode logs emails)'
    }

    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const [failed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailCampaigns)
        .where(sql`${emailCampaigns.createdAt} >= ${dayAgo} AND ${emailCampaigns.status} = 'failed'`)

      const failedCount = Number(failed?.count || 0)
      if (failedCount > 0) {
        emailStatus = 'warning'
        emailMessage = `${emailMessage} • ${failedCount} failed campaign(s) in last 24h`
      }
    } catch (error) {
      if (!isMissingTableError(error, 'email_campaigns')) {
        emailStatus = emailStatus === 'healthy' ? 'warning' : emailStatus
        emailMessage = `${emailMessage} • campaign check unavailable`
      }
    }

    return NextResponse.json({
      database: { status: databaseStatus, message: databaseMessage },
      api: { status: apiStatus, message: apiMessage },
      ai: { status: aiStatus, message: aiMessage },
      email: { status: emailStatus, message: emailMessage },
    })
  } catch (error) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    )
  }
}
