import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'

const JWT_SECRET = getJwtSecretKey()

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let userId: string
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      userId = payload.userId as string
    } catch (error) {
      logger.error('Invalid token', error as Error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      logger.warn('User not found for password change', { userId })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const foundUser = user[0]

    // Verify current password
    if (!foundUser.passwordHash) {
      logger.error('User has no password hash', new Error('Missing password hash'), { userId: foundUser.id })
      return NextResponse.json(
        { error: 'User authentication not configured' },
        { status: 400 }
      )
    }

    const passwordValid = await verifyPassword(currentPassword, foundUser.passwordHash)
    if (!passwordValid) {
      logger.warn('Invalid current password attempt', { userId })
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, foundUser.id))

    logger.info('Password changed successfully', { userId })

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Change password error', error as Error)
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    )
  }
}
