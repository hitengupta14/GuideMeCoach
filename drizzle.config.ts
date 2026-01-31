import type { Config } from 'drizzle-kit'

// @ts-ignore - drizzle-kit types issue
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0705@localhost:5432/guidemecoach',
  },
} satisfies Config
