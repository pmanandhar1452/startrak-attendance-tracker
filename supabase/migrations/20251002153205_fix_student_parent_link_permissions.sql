/*
  # Fix student_parent_link table permissions
  
  This migration adds proper RLS policies for authenticated users to manage student_parent_link records.
  
  1. Changes
    - Add policies for authenticated users to insert, update, and delete student_parent_link records
    - Ensure proper CRUD access for managing parent-student relationships
  
  2. Security
    - Maintains RLS on student_parent_link table
    - Allows authenticated users to manage links
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage student_parent_link" ON public.student_parent_link;

-- Create separate policies for each operation
CREATE POLICY "Allow authenticated to insert student_parent_link"
ON public.student_parent_link FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated to update student_parent_link"
ON public.student_parent_link FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete student_parent_link"
ON public.student_parent_link FOR DELETE TO authenticated USING (true);

-- Ensure grants are in place
GRANT INSERT, UPDATE, DELETE ON public.student_parent_link TO authenticated;
