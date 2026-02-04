DO $$ BEGIN
 CREATE TYPE "joint" AS ENUM('knee', 'lower_back', 'shoulder', 'elbow', 'wrist', 'hip', 'ankle', 'neck');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "joint_involvement_level" AS ENUM('low', 'medium', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "joint_involvement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"joint" "joint" NOT NULL,
	"involvement_level" "joint_involvement_level" DEFAULT 'medium' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_entries" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soreness_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"areas" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"plan_name" text,
	"amount" integer,
	"currency" text DEFAULT 'INR',
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"cancelled_by" text,
	"razorpay_order_id" text,
	"razorpay_subscription_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_medical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"medical_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"affected_joints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"severity" text DEFAULT 'mild' NOT NULL,
	"exclude_high_impact_activities" boolean DEFAULT false,
	"exclude_heavy_lifting" boolean DEFAULT false,
	"exclude_overhead_movements" boolean DEFAULT false,
	"notes" text,
	"last_updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blocked_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blocked_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "provider" varchar(20) DEFAULT 'razorpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "razorpay_payment_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "razorpay_order_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "joint_involvement" ADD CONSTRAINT "joint_involvement_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soreness_entries" ADD CONSTRAINT "soreness_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_medical_history" ADD CONSTRAINT "user_medical_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id");