import type { Config } from 'drizzle-kit'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required for drizzle-kit. Set it in your environment before running migrations.')
}

// @ts-ignore - drizzle-kit types issue
export default {
  // Include both core and mobile/payment schemas so migrations cover everything.
  schema: ['./src/db/schema.ts', './src/db/schema-mobile.ts'],
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0705@localhost:5432/guidemecoach',
  },
} satisfies Config
