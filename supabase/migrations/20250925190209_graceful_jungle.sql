/*
  # Fix Generated IDs INSERT Policy

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy allowing authenticated users to insert records
    - Maintain admin-only access for SELECT, UPDATE, DELETE operations

  2. Policy Details
    - INSERT: Any authenticated user can create generated IDs
    - SELECT/UPDATE/DELETE: Only admin users can manage existing records
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can insert generated IDs" ON generated_ids;

-- Create a new INSERT policy that allows authenticated users to insert
CREATE POLICY "Allow authenticated users to insert generated IDs"
  ON generated_ids
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure the admin policies exist for other operations
DO $$
BEGIN
  -- Check if admin SELECT policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_ids' 
    AND policyname = 'Admin users can view all generated IDs'
  ) THEN
    CREATE POLICY "Admin users can view all generated IDs"
      ON generated_ids
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid() AND r.role_name = 'admin'
        )
      );
  END IF;

  -- Check if admin UPDATE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_ids' 
    AND policyname = 'Admin users can update generated IDs'
  ) THEN
    CREATE POLICY "Admin users can update generated IDs"
      ON generated_ids
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid() AND r.role_name = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid() AND r.role_name = 'admin'
        )
      );
  END IF;

  -- Check if admin DELETE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_ids' 
    AND policyname = 'Admin users can delete generated IDs'
  ) THEN
    CREATE POLICY "Admin users can delete generated IDs"
      ON generated_ids
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid() AND r.role_name = 'admin'
        )
      );
  END IF;
END $$;