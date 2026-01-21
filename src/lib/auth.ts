import crypto from 'crypto'
import bcrypt from 'bcrypt'

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derived) => {
      if (err) reject(err)
      const hash = derived.toString('hex')
      resolve(`${salt}:${hash}`)
    })
  })
}

/**
 * Verify a password against its hash
 * Supports both bcrypt and PBKDF2 formats
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, passwordHash)
    } catch (error) {
      console.error('Bcrypt verification error:', error)
      return false
    }
  }
  
  // Otherwise, assume it's PBKDF2 format (salt:hash)
  return new Promise((resolve, reject) => {
    const [salt, hash] = passwordHash.split(':')
    if (!salt || !hash) {
      resolve(false)
      return
    }
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derived) => {
      if (err) reject(err)
      resolve(hash === derived.toString('hex'))
    })
  })
}

/**
 * Generate a session token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
