import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/get-current-user'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    let userFromSession = null
    let sessionTokenValid = false
    let tokenPayload = null

    // Try to verify session token
    if (sessionCookie?.value) {
      try {
        const verified = await jwtVerify(sessionCookie.value, JWT_SECRET)
        sessionTokenValid = true
        tokenPayload = verified.payload
        
        const userId = verified.payload.userId as string
        userFromSession = await db.query.users.findFirst({
          where: eq(users.id, userId),
        })
      } catch (error) {
        console.error('[Debug] JWT verification failed:', error)
      }
    }

    // Try to get admin user
    const adminUser = await getCurrentAdminUser()

    // Get auth header token if present
    const authHeader = request.headers.get('authorization')
    let authHeaderValid = false
    let authPayload = null

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const verified = await jwtVerify(token, JWT_SECRET)
        authHeaderValid = true
        authPayload = verified.payload
      } catch (error) {
        console.error('[Debug] Auth header JWT verification failed:', error)
      }
    }

    return NextResponse.json({
      status: 'ok',
      debug: {
        sessionCookie: {
          exists: !!sessionCookie?.value,
          hasValue: !!sessionCookie?.value,
          value: sessionCookie?.value ? '(redacted)' : null,
        },
        sessionToken: {
          valid: sessionTokenValid,
          payload: tokenPayload,
          user: userFromSession ? {
            id: userFromSession.id,
            email: userFromSession.email,
            isAdmin: userFromSession.isAdmin,
            adminRole: userFromSession.adminRole,
          } : null,
        },
        authHeader: {
          exists: !!authHeader,
          valid: authHeaderValid,
          payload: authPayload,
        },
        getCurrentAdminUser: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          isAdmin: adminUser.isAdmin,
          adminRole: adminUser.adminRole,
        } : null,
        allCookies: Array.from(cookieStore.getAll()).map(c => ({ name: c.name, exists: true })),
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
