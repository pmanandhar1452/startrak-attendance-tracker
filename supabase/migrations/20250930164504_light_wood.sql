/*
  # Add RLS policies for authenticated users

  1. Security Policies
    - Allow authenticated users to read roles
    - Allow authenticated users to read students  
    - Allow authenticated users to read attendance records
    - Allow authenticated users to read sessions
    - Allow authenticated users to read user profiles

  2. Purpose
    - Fix 403 permission denied errors for authenticated users
    - Enable proper data access after login
    - Maintain security by restricting to authenticated users only
*/

-- Allow authenticated users to read roles
CREATE POLICY "Allow authenticated users to read roles" ON roles
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read students
CREATE POLICY "Allow authenticated users to read students" ON students
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read attendance records
CREATE POLICY "Allow authenticated users to read attendance" ON attendance_records
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read sessions
CREATE POLICY "Allow authenticated users to read sessions" ON sessions
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read user profiles
CREATE POLICY "Allow authenticated users to read user_profiles" ON user_profiles
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read parents
CREATE POLICY "Allow authenticated users to read parents" ON parents
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read student parent links
CREATE POLICY "Allow authenticated users to read student_parent_link" ON student_parent_link
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read student schedules
CREATE POLICY "Allow authenticated users to read student_schedules" ON student_schedules
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read student QR codes
CREATE POLICY "Allow authenticated users to read student_qr_codes" ON student_qr_codes
FOR SELECT TO authenticated USING (true);