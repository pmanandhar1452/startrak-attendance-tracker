/*
  # Create is_admin function

  1. New Functions
    - `is_admin()` - Checks if the current authenticated user has admin role
      - Returns boolean indicating admin status
      - Uses SECURITY DEFINER for elevated permissions
      - Compares user's role_id with admin role_id

  2. Security
    - Grant EXECUTE permission to authenticated users
    - Function runs with definer's privileges for security
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get the current user's role_id from user_profiles
  SELECT role_id INTO user_role_id
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Get the ID of the 'admin' role
  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE role_name = 'admin';

  -- Check if the user's role_id matches the admin_role_id
  RETURN user_role_id = admin_role_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;