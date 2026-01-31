import 'dotenv/config'
import postgres from 'postgres'

const allowCleanup = process.env.ALLOW_MIGRATION_CLEANUP === 'true'
if (!allowCleanup) {
  console.error('Refusing to run cleanup-migrations: set ALLOW_MIGRATION_CLEANUP=true to proceed (NOT for production).')
  process.exit(1)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run cleanup-migrations.')
}

async function main() {
  const sql = postgres({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '0705',
    database: process.env.DB_NAME || 'guidemecoach',
  })

  try {
    console.log('Starting cleanup for migration safety...')

    // 1) Preserve users.is_email_verified into users.email_verified if the old column exists
    try {
      const hasOldCol = await sql`
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_email_verified'
      `
      if (hasOldCol.length > 0) {
        console.log('Backfilling users.email_verified from users.is_email_verified...')
        await sql`
          UPDATE users
          SET email_verified = COALESCE(email_verified, is_email_verified)
          WHERE is_email_verified IS NOT NULL
        `
      } else {
        console.log('Old column users.is_email_verified not present; skipping backfill.')
      }
    } catch (e) {
      console.warn('Users email_verified backfill skipped:', e)
    }

    // 2) Delete orphan chat messages (conversation_id without parent)
    try {
      console.log('Deleting orphan chat_messages without matching chat_conversations...')
      const res = await sql`
        WITH orphans AS (
          SELECT m.id
          FROM chat_messages m
          LEFT JOIN chat_conversations c ON c.id = m.conversation_id
          WHERE c.id IS NULL
        )
        DELETE FROM chat_messages m
        USING orphans o
        WHERE m.id = o.id
        RETURNING m.id
      `
      console.log(`Deleted ${res.length} orphan chat_messages.`)
    } catch (e) {
      console.warn('Orphan chat_messages cleanup skipped or failed:', e)
    }

    // 3) Ensure chat_conversations.topic and title are non-null with sensible defaults
    try {
      console.log('Backfilling chat_conversations.topic and title where NULL...')
      const r1 = await sql`
        UPDATE chat_conversations
        SET topic = 'general'
        WHERE topic IS NULL
        RETURNING id
      `
      const r2 = await sql`
        UPDATE chat_conversations
        SET title = COALESCE(title, 'Conversation')
        WHERE title IS NULL OR title = ''
        RETURNING id
      `
      console.log(`Updated topic for ${r1.length}, title for ${r2.length} conversations.`)
    } catch (e) {
      console.warn('chat_conversations backfill skipped or failed:', e)
    }

    // 4) Backfill workout_logs.session_id (NOT NULL) by linking to an existing or new session per user
    try {
      console.log('Backfilling workout_logs.session_id for NULL entries...')
      const orphanUsers = await sql<{ user_id: string }[]>`
        SELECT DISTINCT user_id
        FROM workout_logs
        WHERE session_id IS NULL
      `
      console.log(`Found ${orphanUsers.length} users with orphan workout_logs.`)
      for (const row of orphanUsers) {
        const userId = row.user_id
        // Try to find an existing session
        const existing = await sql<{ id: string }[]>`
          SELECT id FROM workout_sessions WHERE user_id = ${userId} ORDER BY completed_at DESC LIMIT 1
        `
        let sessionId: string
        if (existing.length > 0) {
          sessionId = existing[0].id
        } else {
          const created = await sql<{ id: string }[]>`
            INSERT INTO workout_sessions (id, user_id, day_name, duration, completed_at, created_at)
            VALUES (gen_random_uuid(), ${userId}, 'Unknown', 0, now(), now())
            RETURNING id
          `
          sessionId = created[0].id
        }
        const updated = await sql`
          UPDATE workout_logs
          SET session_id = ${sessionId}
          WHERE user_id = ${userId} AND session_id IS NULL
          RETURNING id
        `
        console.log(`Linked ${updated.length} workout_logs for user ${userId} to session ${sessionId}.`)
      }
    } catch (e) {
      console.warn('workout_logs.session_id backfill skipped or failed:', e)
    }

    console.log('Cleanup completed. You can now run migrations safely.')
  } finally {
    await (sql as any).end?.()
  }
}

main().catch((e) => {
  console.error('Cleanup script failed:', e)
  process.exit(1)
})
