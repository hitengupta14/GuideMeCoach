import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { revokeRefreshToken, revokeAllUserTokens } from '@/lib/refresh-token'
import { verifySession } from '@/lib/auth-helpers'
import { z } from 'zod'

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  allDevices: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Get user ID from session
    const userId = await verifySession(request)
    
    // Parse request body
    let body: z.infer<typeof logoutSchema> = { allDevices: false }
    try {
      body = logoutSchema.parse(await request.json())
    } catch {
      // If no body provided, just logout current session
    }

    // Revoke refresh token(s)
    if (userId) {
      if (body.allDevices) {
        // Logout from all devices
        await revokeAllUserTokens(userId)
        logger.info('User logged out from all devices', { userId })
      } else if (body.refreshToken) {
        // Revoke specific refresh token
        await revokeRefreshToken(body.refreshToken)
        logger.info('User refresh token revoked', { userId })
      }
    }
    
    // Delete the session cookie
    cookieStore.delete('session')
    
    if (userId) {
      logger.info('User logged out', { userId })
    } else {
      logger.info('Session cleared (no user)')
    }
    
    return NextResponse.json({ 
      success: true,
      message: body.allDevices ? 'Logged out from all devices' : 'Logged out successfully'
    })
  } catch (error) {
    logger.error('Logout error', error as Error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
