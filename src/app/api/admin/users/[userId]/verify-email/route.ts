import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { adminActivityLogs, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function verifyEmail(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageUsers' })
    if (admin instanceof NextResponse) return admin
    const { userId: adminId, email: adminEmail } = admin

    let body: { verified?: boolean; reason?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const verified = typeof body.verified === 'boolean' ? body.verified : true
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined

    const [user] = await db
      .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()

    await db
      .update(users)
      .set({
        emailVerified: verified,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        updatedAt: now,
      })
      .where(eq(users.id, params.userId))

    await db.insert(adminActivityLogs).values({
      adminId,
      action: verified ? 'email_verified' : 'email_unverified',
      targetType: 'user',
      targetId: params.userId,
      metadata: {
        userEmail: user.email,
        reason,
        adminEmail,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: verified ? 'Email marked as verified' : 'Email marked as unverified',
        user: {
          id: user.id,
          email: user.email,
          emailVerified: verified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
  }
}

export const POST = withApiTelemetry(verifyEmail, { name: 'admin.users.verify-email' })
