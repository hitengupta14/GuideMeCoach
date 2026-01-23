import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function makeAdmin(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    await db
      .update(users)
      .set({
        isAdmin: true,
        adminRole: 'super_admin',
      })
      .where(eq(users.id, user.id))

    console.log(`✅ User ${email} is now a super admin!`)
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

makeAdmin(email)
