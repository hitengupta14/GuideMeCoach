import crypto from 'crypto'

const PREFIX = 'enc_v1:'

function deriveKey(input: string): Buffer {
  return crypto.createHash('sha256').update(input, 'utf8').digest()
}

function uniqBuffers(list: Array<Buffer | null | undefined>): Buffer[] {
  const out: Buffer[] = []
  const seen = new Set<string>()
  for (const buf of list) {
    if (!buf) continue
    const key = buf.toString('hex')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(buf)
  }
  return out
}

function getPrimaryKeyMaterial(): string | null {
  return process.env.WEARABLE_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || null
}

function getDecryptionKeyMaterials(): string[] {
  const primary = getPrimaryKeyMaterial()
  const old = process.env.WEARABLE_TOKEN_ENCRYPTION_KEY_OLD || null
  const jwt = process.env.JWT_SECRET || null
  return [primary, old, jwt].filter((v): v is string => typeof v === 'string' && v.length > 0)
}

function getEncryptionKey(): Buffer | null {
  const material = getPrimaryKeyMaterial()
  if (!material) return null
  return deriveKey(material)
}

function getDecryptionKeys(): Buffer[] {
  return uniqBuffers(getDecryptionKeyMaterials().map((m) => deriveKey(m)))
}

function encodePart(buf: Buffer): string {
  return buf.toString('base64')
}

function decodePart(part: string): Buffer | null {
  try {
    return Buffer.from(part, 'base64')
  } catch {
    return null
  }
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext
  if (plaintext.startsWith(PREFIX)) return plaintext

  const key = getEncryptionKey()
  if (!key) return plaintext

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${PREFIX}${encodePart(iv)}.${encodePart(tag)}.${encodePart(ciphertext)}`
}

export function decryptSecret(value: string): string {
  if (!value) return value
  if (!value.startsWith(PREFIX)) return value

  const payload = value.slice(PREFIX.length)
  const [ivB64, tagB64, cipherB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error('Invalid encrypted secret format')
  }

  const iv = decodePart(ivB64)
  const tag = decodePart(tagB64)
  const ciphertext = decodePart(cipherB64)
  if (!iv || !tag || !ciphertext) {
    throw new Error('Invalid encrypted secret encoding')
  }

  const keys = getDecryptionKeys()
  if (keys.length === 0) {
    throw new Error('Missing WEARABLE_TOKEN_ENCRYPTION_KEY/JWT_SECRET for decryption')
  }

  for (const key of keys) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(tag)
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
      return plaintext
    } catch {
      // try next key
    }
  }

  throw new Error('Failed to decrypt secret (key mismatch)')
}

export function encryptOptional(value?: string | null): string | null {
  if (value == null) return null
  return encryptSecret(value)
}

export function decryptOptional(value?: string | null): string | null {
  if (value == null) return null
  return decryptSecret(value)
}
