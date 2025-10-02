/*
  # Fix duplicate policy error
  
  This migration ensures policies are properly dropped before recreation to avoid conflicts.
  
  1. Changes
    - Drop all existing policies for student_schedules
    - Drop all existing policies for user_profiles
    - Recreate policies with proper conditions
  
  2. Security
    - Maintains RLS on both tables
    - Ensures authenticated users can manage their data
    - Provides necessary read access
*/

-- Drop all existing policies for student_schedules
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated to manage student_schedules" ON public.student_schedules;
  DROP POLICY IF EXISTS "Allow authenticated to read student_schedules" ON public.student_schedules;
  DROP POLICY IF EXISTS "Allow anon to read student_schedules" ON public.student_schedules;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Drop all existing policies for user_profiles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated read" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated to read user_profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated to insert their own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated to update their own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow authenticated to read their own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow public to read all user_profiles" ON public.user_profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_schedules TO authenticated;
GRANT SELECT ON public.student_schedules TO anon;

-- Recreate user_profiles policies
CREATE POLICY "Allow authenticated to insert their own profile"
ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated to update their own profile"
ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated to read their own profile"
ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow public to read all user_profiles"
ON public.user_profiles FOR SELECT TO public USING (true);

-- Recreate student_schedules policies
CREATE POLICY "Allow authenticated to manage student_schedules"
ON public.student_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated to read student_schedules"
ON public.student_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anon to read student_schedules"
ON public.student_schedules FOR SELECT TO anon USING (true);
