/*
  # Fix Edge Function Permissions

  1. Security
    - Grant necessary permissions for Edge Functions to work with user_profiles and parents tables
    - Allow service role to bypass RLS for user creation operations
    - Ensure proper permissions for role management

  2. Changes
    - Grant permissions to service_role for user management operations
    - Add policies that allow service_role operations
    - Fix any permission issues preventing user creation
*/

-- Grant permissions to service_role for user management
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON roles TO service_role;
GRANT ALL ON parents TO service_role;
GRANT ALL ON student_parent_link TO service_role;
GRANT ALL ON audit_logs TO service_role;

-- Allow service_role to bypass RLS
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
ALTER TABLE parents FORCE ROW LEVEL SECURITY;
ALTER TABLE student_parent_link FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Add policies for service_role operations
CREATE POLICY "Service role can manage user_profiles" ON user_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage roles" ON roles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage parents" ON parents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage student_parent_link" ON student_parent_link
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage audit_logs" ON audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);