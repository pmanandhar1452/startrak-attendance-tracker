/*
  # Fix Generated IDs RLS Policies

  1. Security Updates
    - Drop existing restrictive policies
    - Add proper INSERT policy for authenticated users
    - Add proper SELECT policy for admin users
    - Add proper UPDATE and DELETE policies

  2. Policy Changes
    - Allow authenticated users to insert generated IDs
    - Allow admin users to view all generated IDs
    - Allow admin users to manage generated IDs
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Admin users can manage generated IDs" ON generated_ids;
DROP POLICY IF EXISTS "Admin users can view all generated IDs" ON generated_ids;

-- Create new policies with proper permissions
CREATE POLICY "Authenticated users can insert generated IDs"
  ON generated_ids
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin users can view all generated IDs"
  ON generated_ids
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Admin users can update generated IDs"
  ON generated_ids
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Admin users can delete generated IDs"
  ON generated_ids
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.role_name = 'admin'
    )
  );