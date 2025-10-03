/*
  # Simplified User System with 3 Fixed Roles
  
  1. New Tables
    - `user_roles` - Simple role table with 3 fixed roles
      - `id` (uuid, primary key)
      - `role_name` (text, unique) - 'admin', 'display', 'checkin_kiosk'
      - `created_at` (timestamp)
    
    - `user_profiles` - Minimal user profile linked to auth
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `role` (text) - stores role name directly
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on user_profiles
    - Simple policies for authenticated users
  
  3. Notes
    - No profile pictures, no complex relationships
    - Users will be hardcoded via seed data
    - Password reset handled via Supabase dashboard
*/

-- Create simple roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert the 3 fixed roles
INSERT INTO user_roles (role_name) VALUES 
  ('admin'),
  ('display'),
  ('checkin_kiosk')
ON CONFLICT (role_name) DO NOTHING;

-- Create simplified user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'display',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - all authenticated users can read everything
CREATE POLICY "Anyone can view roles"
  ON user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create simple trigger function for auto-creating user profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'display')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
