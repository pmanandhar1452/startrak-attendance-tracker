/*
  # Add name column to students table

  1. Changes
    - Add `name` column to `students` table
    - Update existing records to have a name based on user_id or a default value
    - Make name column NOT NULL after populating data

  2. Data Migration
    - Populate name field for existing students
    - Use user_id as fallback if no other name is available
*/

-- Add name column as nullable first
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS name text;

-- Update existing records to have a name
-- This uses the user_id as a fallback name for existing records
UPDATE students 
SET name = COALESCE(name, 'Student ' || SUBSTRING(id::text, 1, 8))
WHERE name IS NULL;

-- Now make the column NOT NULL
ALTER TABLE students 
ALTER COLUMN name SET NOT NULL;