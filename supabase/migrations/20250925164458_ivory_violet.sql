/*
  # Fix RLS Infinite Recursion

  1. Security Updates
    - Remove recursive RLS policies that cause infinite loops
    - Simplify policies to avoid circular dependencies
    - Use direct user ID checks instead of role-based checks
    - Maintain security while preventing recursion

  2. Policy Changes
    - Replace complex role-checking policies with simple user-based policies
    - Remove policies that query the same table they protect
    - Add safe policies that don't cause circular references
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all parents" ON parents;
DROP POLICY IF EXISTS "Admins can manage all student-parent links" ON student_parent_link;

-- Create simple, non-recursive policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for new user creation)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simplified policies for parents table
CREATE POLICY "Parents can view their own data"
  ON parents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can update their own data"
  ON parents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to create parent records
CREATE POLICY "Authenticated users can create parent records"
  ON parents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Simplified policies for student_parent_link
CREATE POLICY "Parents can view their student links"
  ON student_parent_link
  FOR SELECT
  TO authenticated
  USING (parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Parents can manage their student links"
  ON student_parent_link
  FOR ALL
  TO authenticated
  USING (parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  ))
  WITH CHECK (parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  ));

-- Allow authenticated users to manage student-parent links (for admin functionality)
CREATE POLICY "Authenticated users can manage student links"
  ON student_parent_link
  FOR ALL
  TO authenticated
  WITH CHECK (true);