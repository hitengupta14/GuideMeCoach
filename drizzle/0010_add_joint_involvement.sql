-- Create enums for joint involvement
CREATE TYPE "joint" AS ENUM ('knee', 'lower_back', 'shoulder', 'elbow', 'wrist', 'hip', 'ankle', 'neck');
CREATE TYPE "joint_involvement_level" AS ENUM ('low', 'medium', 'high');

-- Create joint_involvement table
CREATE TABLE IF NOT EXISTS "joint_involvement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"joint" "joint" NOT NULL,
	"involvement_level" "joint_involvement_level" DEFAULT 'medium' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create user_medical_history table
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

-- Add foreign key constraints
ALTER TABLE "joint_involvement" ADD CONSTRAINT "joint_involvement_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE cascade;
ALTER TABLE "user_medical_history" ADD CONSTRAINT "user_medical_history_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

-- Create indexes for performance
CREATE INDEX "joint_involvement_exercise_id_idx" ON "joint_involvement" ("exercise_id");
CREATE INDEX "joint_involvement_joint_idx" ON "joint_involvement" ("joint");
CREATE INDEX "user_medical_history_user_id_idx" ON "user_medical_history" ("user_id");
