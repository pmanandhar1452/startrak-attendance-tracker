```sql
-- Re-apply necessary GRANTS and RLS policies for user_profiles and student_schedules

-- Enable Row Level Security (RLS) for user_profiles if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated role for user_profiles
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Drop existing SELECT policies for user_profiles to avoid conflicts and re-create
DROP POLICY IF EXISTS "Allow authenticated read" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated to read user_profiles" ON public.user_profiles;

-- Policy for authenticated users to insert their own profile (during first login)
CREATE POLICY "Allow authenticated to insert their own profile"
ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Policy for authenticated users to update their own profile
CREATE POLICY "Allow authenticated to update their own profile"
ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policy for authenticated users to read their own profile
CREATE POLICY "Allow authenticated to read their own profile"
ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy for public (anon and authenticated) to read user_profiles (e.g., for displaying names)
CREATE POLICY "Allow public to read all user_profiles"
ON public.user_profiles FOR SELECT TO public USING (true);


-- Enable Row Level Security (RLS) for student_schedules if not already enabled
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated role for student_schedules
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_schedules TO authenticated;

-- Drop existing policies for student_schedules to avoid conflicts and re-create
DROP POLICY IF EXISTS "Allow authenticated to manage student_schedules" ON public.student_schedules;
DROP POLICY IF EXISTS "Allow authenticated to read student_schedules" ON public.student_schedules;

-- Policy for authenticated users to manage (CRUD) student_schedules
CREATE POLICY "Allow authenticated to manage student_schedules"
ON public.student_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy for authenticated users to read student_schedules
CREATE POLICY "Allow authenticated to read student_schedules"
ON public.student_schedules FOR SELECT TO authenticated USING (true);

-- Grant SELECT permission to anon role for student_schedules (if needed for public views)
GRANT SELECT ON public.student_schedules TO anon;
CREATE POLICY "Allow anon to read student_schedules"
ON public.student_schedules FOR SELECT TO anon USING (true);
```