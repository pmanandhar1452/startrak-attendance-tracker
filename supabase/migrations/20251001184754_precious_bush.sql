/*
  # Fix roles table permissions

  1. Security
    - Enable RLS on `roles` table
    - Add policy for authenticated users to read roles
    - Add policy for authenticated users to insert roles (for auto-creation)

  2. Changes
    - Ensures all authenticated users can read available roles
    - Allows role creation when needed
*/

-- Enable RLS on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated to read roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated to create roles" ON roles;

-- Allow authenticated users to read all roles
CREATE POLICY "Allow authenticated to read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create roles (for auto-creation)
CREATE POLICY "Allow authenticated to create roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure basic roles exist
INSERT INTO roles (role_name) VALUES ('admin') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles (role_name) VALUES ('parent') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles (role_name) VALUES ('instructor') ON CONFLICT (role_name) DO NOTHING;