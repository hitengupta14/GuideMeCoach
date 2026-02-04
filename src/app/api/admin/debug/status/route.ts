import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Dev-only diagnostic endpoint. Do not expose in production.
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_ADMIN_DEBUG !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    const authHeader = request.headers.get('authorization')

    return NextResponse.json({
      status: 'ok',
      debug: {
        sessionCookie: {
          exists: Boolean(sessionCookie?.value),
        },
        authHeader: {
          exists: Boolean(authHeader),
        },
        admin: {
          userId: admin.userId,
          role: admin.adminRole,
        },
      }
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: String(error)
      },
      { status: 500 }
    )
  }
}
