/**
 * Cleanup Expired Refresh Tokens
 * 
 * Run this script periodically (e.g., daily via cron) to remove expired tokens
 * 
 * Usage:
 *   npx tsx scripts/cleanup-expired-tokens.ts
 */

import { db } from '../src/db'
import { refreshTokens } from '../src/db/schema'
import { lt } from 'drizzle-orm'

async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting cleanup of expired refresh tokens...')

    // Delete tokens expired more than 7 days ago
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    console.log(`Deleting tokens expired before: ${cutoffDate.toISOString()}`)

    const result = await db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, cutoffDate))

    console.log('✅ Cleanup completed')
    console.log(`📊 Deleted tokens expired before ${cutoffDate.toISOString()}`)

    // Get remaining token count
    const remaining = await db
      .select()
      .from(refreshTokens)

    console.log(`📈 Remaining active tokens: ${remaining.length}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

cleanupExpiredTokens()
