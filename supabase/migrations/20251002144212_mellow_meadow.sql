/*
  # Fix user_profiles table permissions

  1. Security
    - Grant necessary permissions to anon and authenticated roles
    - Add RLS policies for user profile creation and access
    - Allow users to create and manage their own profiles

  2. Changes
    - Grant INSERT, SELECT, UPDATE permissions to authenticated role
    - Grant SELECT permission to anon role for login flow
    - Add RLS policy for users to manage their own profiles
    - Add RLS policy for profile creation during signup
*/

-- Grant permissions to roles
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Add RLS policy for users to manage their own profiles
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add RLS policy for profile creation during signup/login
CREATE POLICY "Allow profile creation during auth" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add RLS policy for reading profiles (needed for role checks)
CREATE POLICY "Allow reading profiles for auth" ON user_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);