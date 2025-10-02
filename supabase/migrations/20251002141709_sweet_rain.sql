/*
  # Create student_schedules table

  1. New Tables
    - `student_schedules`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `day_of_week` (text, enum for days)
      - `start_time` (time)
      - `end_time` (time)
      - `session_type` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `student_schedules` table
    - Add policy for authenticated users to read schedules
    - Add policy for authenticated users to manage schedules

  3. Constraints
    - Foreign key constraint to students table
    - Check constraint for valid days of week
    - Check constraint for valid time ranges
*/

CREATE TABLE IF NOT EXISTS student_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint
ALTER TABLE student_schedules 
ADD CONSTRAINT student_schedules_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated to read student_schedules"
  ON student_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to manage student_schedules"
  ON student_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_schedules_student_id ON student_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_student_schedules_day ON student_schedules(day_of_week);