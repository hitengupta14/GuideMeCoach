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
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '0705',
    database: process.env.DB_NAME || 'guidemecoach',
  },
} satisfies Config
