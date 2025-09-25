/*
  # Fix User Management Relationships and Policies

  1. Foreign Key Constraints
    - Add proper foreign key relationships
    - Fix cascade delete behavior
    
  2. RLS Policies
    - Fix policy queries for nested relationships
    - Ensure proper access control
    
  3. Functions
    - Add helper functions for QR code generation
*/

-- Add missing foreign key constraints
ALTER TABLE student_parent_link 
ADD CONSTRAINT student_parent_link_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Create QR code generation function
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'QR_' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Fix RLS policies for parents table
DROP POLICY IF EXISTS "Admins can manage all parents" ON parents;
DROP POLICY IF EXISTS "Parents can view their own data" ON parents;

CREATE POLICY "Admins can manage all parents"
  ON parents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Parents can view their own data"
  ON parents
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Fix RLS policies for student_parent_link table
DROP POLICY IF EXISTS "Admins can manage all student-parent links" ON student_parent_link;
DROP POLICY IF EXISTS "Parents can view their linked students" ON student_parent_link;

CREATE POLICY "Admins can manage all student-parent links"
  ON student_parent_link
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Parents can view their linked students"
  ON student_parent_link
  FOR SELECT
  TO authenticated
  USING (
    parent_id IN (
      SELECT p.id FROM parents p
      WHERE p.user_id = auth.uid()
    )
  );