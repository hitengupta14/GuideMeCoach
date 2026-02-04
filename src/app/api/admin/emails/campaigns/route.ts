import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { adminActivityLogs, emailCampaigns, users, workoutSessions } from '@/db/schema'
import { and, desc, eq, gte, isNull, lt, or, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'

const audienceSchema = z.object({
  segment: z.enum(['all', 'premium', 'inactive', 'new_users']),
  days: z.coerce.number().int().min(1).max(365).optional(),
})

const createCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    subject: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(20_000),
    audience: audienceSchema,
  })
  .strict()

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || '')
  return error?.code === '42P01' && message.toLowerCase().includes(table.toLowerCase())
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCampaignHtml(params: { title: string; content: string }) {
  const safeContent = escapeHtml(params.content).replace(/\n/g, '<br />')
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(params.title)}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6; color: #111827; background: #f9fafb; margin: 0; padding: 24px; }
      .container { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
      .header { padding: 20px 24px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #fff; }
      .content { padding: 24px; }
      .footer { padding: 16px 24px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div style="font-size: 18px; font-weight: 700;">GuideMeCoach</div>
      </div>
      <div class="content">
        <div style="white-space: normal;">${safeContent}</div>
      </div>
      <div class="footer">
        <div>© 2026 GuideMeCoach. All rights reserved.</div>
      </div>
    </div>
  </body>
</html>`
}

async function getRecipients(audience: z.infer<typeof audienceSchema>) {
  const baseWhere = and(eq(users.status, 'active'), eq(users.emailVerified, true))

  if (audience.segment === 'premium') {
    return db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(baseWhere, eq(users.isPremium, true)))
  }

  if (audience.segment === 'new_users') {
    const days = audience.days ?? 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(baseWhere, gte(users.createdAt, since)))
  }

  if (audience.segment === 'inactive') {
    const days = audience.days ?? 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const lastWorkout = db
      .select({
        userId: workoutSessions.userId,
        lastCompletedAt: sql<Date>`max(${workoutSessions.completedAt})`.as('last_completed_at'),
      })
      .from(workoutSessions)
      .groupBy(workoutSessions.userId)
      .as('last_workout')

    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .leftJoin(lastWorkout, eq(lastWorkout.userId, users.id))
      .where(and(baseWhere, or(isNull(lastWorkout.lastCompletedAt), lt(lastWorkout.lastCompletedAt, since))))
  }

  return db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(baseWhere)
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageSystem' })
    if (admin instanceof NextResponse) return admin

    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(100)

    return NextResponse.json({ success: true, campaigns })
  } catch (error) {
    if (isMissingTableError(error, 'email_campaigns')) {
      return NextResponse.json(
        { success: false, error: 'email_campaigns table missing. Run DB migrations.' },
        { status: 503 }
      )
    }

    console.error('Email campaigns GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageSystem' })
    if (admin instanceof NextResponse) return admin

    const body = await request.json().catch(() => null)
    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign payload', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const now = new Date()
    const recipients = await getRecipients(parsed.data.audience)
    const recipientCount = recipients.length

    const [campaign] = await db
      .insert(emailCampaigns)
      .values({
        createdByAdminId: admin.userId,
        name: parsed.data.name,
        subject: parsed.data.subject,
        content: parsed.data.content,
        audience: parsed.data.audience,
        status: 'sending',
        recipientCount,
        sentCount: 0,
        failedCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const html = buildCampaignHtml({ title: parsed.data.subject, content: parsed.data.content })
    const text = parsed.data.content

    const batchSize = 25
    let sentCount = 0
    let failedCount = 0
    let lastError: string | null = null

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (r) => {
          try {
            return await sendEmail({
              to: r.email,
              subject: parsed.data.subject,
              html,
              text,
            })
          } catch (e) {
            lastError = e instanceof Error ? e.message : String(e)
            return false
          }
        })
      )

      for (const ok of results) {
        if (ok) sentCount += 1
        else failedCount += 1
      }
    }

    const status = sentCount > 0 ? 'sent' : 'failed'
    const sentAt = now

    const [updated] = await db
      .update(emailCampaigns)
      .set({
        status,
        sentCount,
        failedCount,
        lastError,
        sentAt,
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, campaign.id))
      .returning()

    await db.insert(adminActivityLogs).values({
      adminId: admin.userId,
      action: 'email_campaign_sent',
      targetType: 'email_campaign',
      targetId: campaign.id,
      metadata: {
        recipientCount,
        sentCount,
        failedCount,
        audience: parsed.data.audience,
      },
    })

    return NextResponse.json({ success: true, campaign: updated ?? campaign })
  } catch (error) {
    if (isMissingTableError(error, 'email_campaigns')) {
      return NextResponse.json(
        { success: false, error: 'email_campaigns table missing. Run DB migrations.' },
        { status: 503 }
      )
    }

    console.error('Email campaigns POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}

