/*
  # Fix student_schedules table permissions

  1. Security
    - Grant SELECT permission to anon role for student_schedules table
    - Add RLS policy for anon users to read student_schedules
    - Add RLS policy for authenticated users to manage student_schedules

  This resolves the "permission denied for table student_schedules" error
  by allowing the frontend application to read schedule data.
*/

-- Grant SELECT permission to anon role
GRANT SELECT ON TABLE public.student_schedules TO anon;

-- Add policy for anon users to read student schedules
CREATE POLICY "Allow anon to read student_schedules"
  ON student_schedules
  FOR SELECT
  TO anon
  USING (true);

-- Add policy for authenticated users to manage student schedules
CREATE POLICY "Allow authenticated to manage student_schedules"
  ON student_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);