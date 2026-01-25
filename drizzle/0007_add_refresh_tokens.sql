-- Migration: Add refresh token table for JWT refresh strategy
-- This prevents users from random logouts, especially on mobile

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"replaced_by" uuid,
	"device_info" jsonb,
	"ip_address" text
);

-- Index for quick token lookup
CREATE INDEX IF NOT EXISTS "refresh_token_token_idx" ON "refresh_tokens" ("token");

-- Index for user lookup (to find all user tokens)
CREATE INDEX IF NOT EXISTS "refresh_token_user_id_idx" ON "refresh_tokens" ("user_id");

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS "refresh_token_expires_at_idx" ON "refresh_tokens" ("expires_at");

-- Foreign key constraint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Foreign key for token rotation (self-referencing)
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_refresh_tokens_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "refresh_tokens"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
