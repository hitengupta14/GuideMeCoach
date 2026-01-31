DO $$ BEGIN
 CREATE TYPE "admin_role" AS ENUM('super_admin', 'content_admin', 'support_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"feature" text NOT NULL,
	"model" text NOT NULL,
	"tokens_used" integer,
	"estimated_cost" integer,
	"response_time" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"value" integer,
	"metadata" jsonb,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_role" "admin_role";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
