/**
 * Refresh Token Management
 * 
 * Handles creation, validation, and rotation of refresh tokens
 * Prevents random logouts by allowing seamless JWT refresh
 */

import { db } from '@/db'
import { refreshTokens, users } from '@/db/schema'
import { eq, and, gt, lt, isNull } from 'drizzle-orm'
import { SignJWT } from 'jose'
import crypto from 'crypto'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
)

// Token lifetimes
const ACCESS_TOKEN_EXPIRY = '1h' // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 30 // Long-lived refresh token

/**
 * Generate a secure random refresh token
 */
function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

/**
 * Generate a new JWT access token
 */
export async function generateAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

/**
 * Create a new refresh token for a user
 */
export async function createRefreshToken(
  userId: string,
  deviceInfo?: {
    userAgent?: string
    platform?: string
    deviceName?: string
    appVersion?: string
  },
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateRefreshToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

  await db.insert(refreshTokens).values({
    userId,
    token,
    expiresAt,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
  })

  return { token, expiresAt }
}

/**
 * Validate and rotate refresh token
 * Returns new access token and refresh token on success
 */
export async function rotateRefreshToken(
  oldToken: string,
  deviceInfo?: {
    userAgent?: string
    platform?: string
    deviceName?: string
    appVersion?: string
  },
  ipAddress?: string
): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: Date
  userId: string
} | null> {
  // Find the refresh token
  const tokenRecord = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.token, oldToken))
    .limit(1)
    .then((res) => res[0])

  if (!tokenRecord) {
    return null
  }

  // Check if token is revoked
  if (tokenRecord.revokedAt) {
    // Token reuse detected - potential security issue
    // Revoke all tokens for this user
    await revokeAllUserTokens(tokenRecord.userId)
    return null
  }

  // Check if token is expired
  if (new Date() > tokenRecord.expiresAt) {
    return null
  }

  // Verify user still exists
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, tokenRecord.userId))
    .limit(1)
    .then((res) => res[0])

  if (!user) {
    return null
  }

  // Create new refresh token
  const newRefreshToken = await createRefreshToken(
    tokenRecord.userId,
    deviceInfo,
    ipAddress
  )

  // Revoke the old token and mark it as replaced
  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      replacedBy: null, // Will be updated if we track the chain
    })
    .where(eq(refreshTokens.id, tokenRecord.id))

  // Generate new access token
  const accessToken = await generateAccessToken(tokenRecord.userId)

  return {
    accessToken,
    refreshToken: newRefreshToken.token,
    expiresAt: newRefreshToken.expiresAt,
    userId: tokenRecord.userId,
  }
}

/**
 * Verify refresh token is valid (not expired, not revoked)
 */
export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string; tokenId: string } | null> {
  const tokenRecord = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, token),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1)
    .then((res) => res[0])

  if (!tokenRecord) {
    return null
  }

  return {
    userId: tokenRecord.userId,
    tokenId: tokenRecord.id,
  }
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const result = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.token, token))

  return true
}

/**
 * Revoke all refresh tokens for a user
 * Useful for logout from all devices or security incidents
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt))
    )
}

/**
 * Clean up expired refresh tokens
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  // Delete tokens expired more than 7 days ago
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)

  const result = await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, cutoffDate))

  return 0 // Drizzle doesn't return affected rows count easily
}

/**
 * Get all active refresh tokens for a user
 * Useful for "active sessions" feature
 */
export async function getUserActiveTokens(userId: string) {
  return await db
    .select({
      id: refreshTokens.id,
      createdAt: refreshTokens.createdAt,
      expiresAt: refreshTokens.expiresAt,
      deviceInfo: refreshTokens.deviceInfo,
      ipAddress: refreshTokens.ipAddress,
    })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .orderBy(refreshTokens.createdAt)
}
