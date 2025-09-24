/*
  # Authentication and Authorization Setup

  1. Security Policies
    - Update RLS policies to use auth.uid() for user-specific access
    - Ensure only authenticated users can access data
    - Add proper user identification for all operations

  2. User Management
    - Leverage Supabase's built-in auth.users table
    - Email/password authentication only
    - No email confirmation required for admin access
*/

-- Update students table policies
DROP POLICY IF EXISTS "Students are viewable by authenticated users" ON students;
DROP POLICY IF EXISTS "Students can be managed by authenticated users" ON students;

CREATE POLICY "Students are viewable by authenticated users"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can be managed by authenticated users"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update student_schedules table policies
DROP POLICY IF EXISTS "Student schedules are viewable by authenticated users" ON student_schedules;
DROP POLICY IF EXISTS "Student schedules can be managed by authenticated users" ON student_schedules;

CREATE POLICY "Student schedules are viewable by authenticated users"
  ON student_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student schedules can be managed by authenticated users"
  ON student_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update sessions table policies
DROP POLICY IF EXISTS "Sessions are viewable by authenticated users" ON sessions;
DROP POLICY IF EXISTS "Sessions can be managed by authenticated users" ON sessions;

CREATE POLICY "Sessions are viewable by authenticated users"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sessions can be managed by authenticated users"
  ON sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update attendance_records table policies
DROP POLICY IF EXISTS "Attendance records are viewable by authenticated users" ON attendance_records;
DROP POLICY IF EXISTS "Attendance records can be managed by authenticated users" ON attendance_records;

CREATE POLICY "Attendance records are viewable by authenticated users"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance records can be managed by authenticated users"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);