import 'server-only'

/**
 * JWT helpers.
 *
 * IMPORTANT:
 * - Do not fall back to hardcoded secrets. If JWT_SECRET is missing, fail closed.
 * - Keep this module server-only so secrets never end up in the client bundle.
 */

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length === 0) {
    throw new Error('Missing required environment variable: JWT_SECRET')
  }
  return secret
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(requireJwtSecret())
}

