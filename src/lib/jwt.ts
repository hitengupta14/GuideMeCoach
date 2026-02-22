import 'server-only'

/**
 * JWT helpers.
 *
 * IMPORTANT:
 * - Do not fall back to hardcoded secrets. If JWT_SECRET is missing, fail closed.
 * - Keep this module server-only so secrets never end up in the client bundle.
 */

let cachedSecret: string | null = null
let cachedSecretKey: Uint8Array | null = null

export function requireJwtSecret(): string {
  if (cachedSecret) return cachedSecret
  
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length === 0) {
    throw new Error('Missing required environment variable: JWT_SECRET')
  }
  cachedSecret = secret
  return secret
}

export function getJwtSecretKey(): Uint8Array {
  if (cachedSecretKey) return cachedSecretKey
  
  cachedSecretKey = new TextEncoder().encode(requireJwtSecret())
  return cachedSecretKey
}

