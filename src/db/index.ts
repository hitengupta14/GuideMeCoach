import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Configure connection pool to prevent "too many clients" error
// max: maximum number of connections in the pool
// idle_timeout: close idle connections after 20 seconds
// connect_timeout: fail fast if connection can't be established
export const client = postgres(connectionString, { 
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
})
export const db = drizzle(client, { schema })
