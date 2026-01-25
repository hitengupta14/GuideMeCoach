DO $$ BEGIN
 CREATE TYPE "exercise_source" AS ENUM('manual', 'ai_generated', 'curated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "review_status" AS ENUM('draft', 'approved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"monthly_limit" integer NOT NULL,
	"reset_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"token" text NOT NULL,
	"platform" text NOT NULL,
	"metadata" jsonb,
	"disabled" boolean DEFAULT false,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "base_exercise_id" uuid;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "source" "exercise_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "review_status" "review_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "confidence_score" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercises" ADD CONSTRAINT "exercises_base_exercise_id_exercises_id_fk" FOREIGN KEY ("base_exercise_id") REFERENCES "exercises"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_usage_quotas" ADD CONSTRAINT "ai_usage_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
