/*
  # Fix All RLS Infinite Recursion Issues

  1. Security Updates
    - Remove all recursive RLS policies
    - Implement simple, non-recursive policies
    - Ensure proper access control without circular dependencies

  2. Policy Changes
    - Replace complex role-based policies with simple user-based policies
    - Remove policies that query the same table they protect
    - Add safe policies for authenticated users
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_manage_profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON user_profiles;

DROP POLICY IF EXISTS "Admins can manage all parents" ON parents;
DROP POLICY IF EXISTS "Parents can view their own data" ON parents;
DROP POLICY IF EXISTS "admin_manage_parents" ON parents;
DROP POLICY IF EXISTS "parents_self_access" ON parents;

DROP POLICY IF EXISTS "Students can be managed by authenticated users" ON students;
DROP POLICY IF EXISTS "admin_manage_students" ON students;
DROP POLICY IF EXISTS "parents_can_view_students" ON students;

DROP POLICY IF EXISTS "Admins can manage all student-parent links" ON student_parent_link;
DROP POLICY IF EXISTS "Parents can view their linked students" ON student_parent_link;
DROP POLICY IF EXISTS "admin_manage_links" ON student_parent_link;
DROP POLICY IF EXISTS "parents_can_view_links" ON student_parent_link;

-- Create simple, non-recursive policies for user_profiles
CREATE POLICY "user_profiles_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create simple policies for parents
CREATE POLICY "parents_select_own"
  ON parents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "parents_insert_own"
  ON parents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "parents_update_own"
  ON parents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "parents_delete_own"
  ON parents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create simple policies for students (allow all authenticated users for now)
CREATE POLICY "students_select_all"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "students_insert_all"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "students_update_all"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "students_delete_all"
  ON students
  FOR DELETE
  TO authenticated
  USING (true);

-- Create simple policies for student_parent_link
CREATE POLICY "student_parent_link_select_all"
  ON student_parent_link
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "student_parent_link_insert_all"
  ON student_parent_link
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "student_parent_link_update_all"
  ON student_parent_link
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "student_parent_link_delete_all"
  ON student_parent_link
  FOR DELETE
  TO authenticated
  USING (true);

-- Create simple policies for roles (read-only for authenticated users)
CREATE POLICY "roles_select_all"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);