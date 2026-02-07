import { decidePricing } from '../src/lib/pricing'
import { validateFileBuffer } from '../src/lib/file-validation'
import { hashPassword, verifyPassword } from '../src/lib/auth'
import { decryptSecret, encryptSecret } from '../src/lib/secret-crypto'

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Smoke check failed: ${message}`)
  }
}

async function main() {
  // Pricing invariants (keep UI + backend in sync)
  {
    const indiaMonthly = decidePricing({ planType: 'premium', lockedTier: 'india' })
    assert(indiaMonthly.amountPaise === 29900, 'India monthly amount mismatch')

    const indiaYearly = decidePricing({ planType: 'premium-yearly', lockedTier: 'india' })
    assert(indiaYearly.amountPaise === 249900, 'India yearly amount mismatch')

    const intlMonthly = decidePricing({ planType: 'premium', lockedTier: 'international' })
    assert(intlMonthly.amountPaise === 41500, 'International monthly INR equivalent mismatch')

    const intlYearly = decidePricing({ planType: 'premium-yearly', lockedTier: 'international' })
    assert(intlYearly.amountPaise === 406700, 'International yearly INR equivalent mismatch')
  }

  // File signature validation (video)
  {
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, // box size
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x69, 0x73, 0x6f, 0x6d, // "isom"
      0x00, 0x00, 0x00, 0x00,
    ])
    const ok = await validateFileBuffer(mp4Header, 'video')
    assert(ok.valid, 'MP4 header should be accepted as video')

    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]) // %PDF-
    const notOk = await validateFileBuffer(pdfHeader, 'video')
    assert(!notOk.valid, 'PDF header should be rejected as video')
  }

  // Password hashing verification
  {
    const password = 'smoke-test-password'
    const hash = await hashPassword(password)
    assert(typeof hash === 'string' && hash.includes(':'), 'hashPassword should return PBKDF2 salt:hash')
    assert(await verifyPassword(password, hash), 'verifyPassword should accept correct password')
    assert(!(await verifyPassword('wrong-password', hash)), 'verifyPassword should reject incorrect password')
  }

  // Wearables token encryption at rest
  {
    // Ensure a stable key exists in CI/local smoke runs
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-jwt-secret'

    const token = 'top-secret-token'
    const encrypted = encryptSecret(token)
    assert(encrypted.startsWith('enc_v1:'), 'encryptSecret should produce encrypted output')
    assert(encrypted !== token, 'encryptSecret should change the value')
    assert(decryptSecret(encrypted) === token, 'decryptSecret should roundtrip')
    assert(decryptSecret(token) === token, 'decryptSecret should passthrough plaintext')
  }

  // eslint-disable-next-line no-console
  console.log('✅ Smoke checks passed')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
