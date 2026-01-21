import { db } from '../src/db'
import { users } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import * as bcrypt from 'bcryptjs'

async function resetPassword() {
  const email = 'hiten@gmail.com'
  const newPassword = 'H@gupta'

  try {
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update the user's password
    const result = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, email))
      .returning()

    if (result.length > 0) {
      console.log('✅ Password reset successful for:', email)
      console.log('New password:', newPassword)
      console.log('User:', result[0])
    } else {
      console.log('❌ User not found:', email)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting password:', error)
    process.exit(1)
  }
}

resetPassword()
