/*
  # Seed Hardcoded Users
  
  1. Purpose
    - Create 3 hardcoded users in auth.users
    - These users will be automatically added to user_profiles via trigger
  
  2. Users to Create
    - admin@startrak.com (role: admin)
    - display@startrak.com (role: display)
    - kiosk@startrak.com (role: checkin_kiosk)
  
  3. Notes
    - Uses crypt() extension for password hashing
    - Password format matches Supabase Auth requirements
    - Users are created directly in auth.users table
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to safely create auth users if they don't exist
CREATE OR REPLACE FUNCTION create_auth_user_if_not_exists(
  user_email text,
  user_password text,
  user_role text
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
  encrypted_pw text;
BEGIN
  -- Check if user already exists
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NOT NULL THEN
    -- Update the user profile role if it exists
    UPDATE user_profiles 
    SET role = user_role 
    WHERE id = user_id;
    
    RETURN user_id;
  END IF;
  
  -- Generate new UUID
  user_id := gen_random_uuid();
  
  -- Hash the password
  encrypted_pw := crypt(user_password, gen_salt('bf'));
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    encrypted_pw,
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', user_role),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
  );
  
  -- The trigger will automatically create the user_profile
  -- But we'll update it to ensure the role is set correctly
  UPDATE user_profiles 
  SET role = user_role 
  WHERE id = user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the 3 hardcoded users
DO $$
DECLARE
  admin_id uuid;
  display_id uuid;
  kiosk_id uuid;
BEGIN
  -- Create admin user
  admin_id := create_auth_user_if_not_exists(
    'admin@startrak.com',
    'StartrakAdmin2025!',
    'admin'
  );
  RAISE NOTICE 'Admin user created/updated: %', admin_id;
  
  -- Create display user
  display_id := create_auth_user_if_not_exists(
    'display@startrak.com',
    'StartrakDisplay2025!',
    'display'
  );
  RAISE NOTICE 'Display user created/updated: %', display_id;
  
  -- Create kiosk user
  kiosk_id := create_auth_user_if_not_exists(
    'kiosk@startrak.com',
    'StartrakKiosk2025!',
    'checkin_kiosk'
  );
  RAISE NOTICE 'Kiosk user created/updated: %', kiosk_id;
END $$;

-- Drop the helper function (we don't need it after seeding)
DROP FUNCTION IF EXISTS create_auth_user_if_not_exists(text, text, text);
