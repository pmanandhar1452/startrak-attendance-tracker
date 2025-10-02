/*
  # Fix user_profiles table primary key issue
  
  The user_profiles table has both `id` and `user_id` columns which is causing conflicts.
  The `id` should be the auth user id (not auto-generated), and `user_id` should be removed
  or used differently.
  
  1. Changes
    - Remove the default value from the id column
    - Ensure id is properly constrained to reference auth.users
  
  2. Security
    - Maintains all existing RLS policies
*/

-- Remove the default value from id column since it should match auth.users.id
ALTER TABLE public.user_profiles 
  ALTER COLUMN id DROP DEFAULT;

-- Ensure there's a proper foreign key constraint from id to auth.users.id
DO $$ 
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
