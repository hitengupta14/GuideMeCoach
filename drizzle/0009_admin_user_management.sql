-- Add status and blocking fields to users table
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "users" ADD COLUMN "blocked_at" timestamp;
ALTER TABLE "users" ADD COLUMN "blocked_reason" text;
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;
ALTER TABLE "users" ADD COLUMN "deleted_reason" text;

-- Create subscription_history table
CREATE TABLE "subscription_history" (
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
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
