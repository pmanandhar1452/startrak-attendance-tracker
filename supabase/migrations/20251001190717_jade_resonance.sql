/*
  # Fix RLS Permissions for All Tables

  This migration fixes the "permission denied for schema public" errors by ensuring
  all tables have proper RLS policies for authenticated users.

  ## Changes Made
  1. Enable RLS on all tables that need it
  2. Create SELECT policies for authenticated users on all tables
  3. Ensure proper permissions for user management operations

  ## Tables Updated
  - students: Allow authenticated users to read student data
  - user_profiles: Allow authenticated users to read user profiles
  - roles: Allow authenticated users to read roles
  - parents: Allow authenticated users to read parent data
  - student_parent_link: Allow authenticated users to read student-parent links
  - sessions: Allow authenticated users to read session data
  - attendance_records: Allow authenticated users to read attendance data
  - qr_scan_logs: Allow authenticated users to read QR scan logs
  - audit_logs: Allow authenticated users to read audit logs
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parent_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Allow authenticated to read students" ON students;
DROP POLICY IF EXISTS "Allow authenticated to read user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated to read roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated to read parents" ON parents;
DROP POLICY IF EXISTS "Allow authenticated to read student_parent_link" ON student_parent_link;
DROP POLICY IF EXISTS "Allow authenticated to read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated to read attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow authenticated to read qr_scan_logs" ON qr_scan_logs;
DROP POLICY IF EXISTS "Allow authenticated to read audit_logs" ON audit_logs;

-- Create SELECT policies for authenticated users
CREATE POLICY "Allow authenticated to read students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read user_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read parents"
  ON parents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read student_parent_link"
  ON student_parent_link
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read attendance_records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read qr_scan_logs"
  ON qr_scan_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to read audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant USAGE on public schema to authenticated role (if needed)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on all tables to authenticated role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;