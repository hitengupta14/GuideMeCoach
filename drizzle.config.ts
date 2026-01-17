import type { Config } from 'drizzle-kit'

// @ts-ignore - drizzle-kit types issue
export default {
  schema: './src/db/schema.ts',
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
