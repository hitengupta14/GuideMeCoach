-- Create migration for exercise-muscle mappings
-- This migration ensures the exercise_muscles table is properly set up
-- to store the relationship between exercises and muscle groups with role information

-- The exercise_muscles table should already exist from the schema,
-- but this migration documents the structure and adds any indexes

CREATE INDEX IF NOT EXISTS idx_exercise_muscles_exercise_id ON exercise_muscles(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_muscle_group_id ON exercise_muscles(muscle_group_id);
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_role ON exercise_muscles(role);

-- Composite index for efficient queries by exercise and role
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_exercise_role ON exercise_muscles(exercise_id, role);

-- Composite index for efficient queries by muscle group
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_muscle_role ON exercise_muscles(muscle_group_id, role);
