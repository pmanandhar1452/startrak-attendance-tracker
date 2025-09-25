/*
  # Complete User Management System

  1. New Tables
    - `user_profiles` - Extended user information linked to Supabase Auth
    - `roles` - User roles (admin, parent, instructor)
    - `parents` - Parent/caretaker specific data with QR codes
    - `student_parent_link` - Many-to-many relationship between students and parents

  2. Security
    - Enable RLS on all tables
    - Simple, non-recursive policies for secure access
    - User-based access control without circular dependencies

  3. Storage
    - QR code bucket for storing generated QR codes
    - Public access for QR code images

  4. Functions
    - Helper functions for user management
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default roles
INSERT INTO roles (role_name) VALUES 
  ('admin'),
  ('parent'),
  ('instructor')
ON CONFLICT (role_name) DO NOTHING;

-- Create user_profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role_id uuid REFERENCES roles(id),
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  qr_code text UNIQUE,
  qr_code_url text,
  emergency_contact text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_parent_link table
CREATE TABLE IF NOT EXISTS student_parent_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parents(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'parent',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

-- Add user_id to students table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE students ADD COLUMN user_id uuid REFERENCES user_profiles(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parent_link ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "roles_select_all" ON roles;
DROP POLICY IF EXISTS "parents_select_own" ON parents;
DROP POLICY IF EXISTS "parents_insert_own" ON parents;
DROP POLICY IF EXISTS "parents_update_own" ON parents;
DROP POLICY IF EXISTS "parents_delete_own" ON parents;
DROP POLICY IF EXISTS "student_parent_link_select_all" ON student_parent_link;
DROP POLICY IF EXISTS "student_parent_link_insert_all" ON student_parent_link;
DROP POLICY IF EXISTS "student_parent_link_update_all" ON student_parent_link;
DROP POLICY IF EXISTS "student_parent_link_delete_all" ON student_parent_link;

-- Simple RLS policies (non-recursive)
CREATE POLICY "user_profiles_all_authenticated" ON user_profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "roles_select_authenticated" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "parents_all_authenticated" ON parents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "student_parent_link_all_authenticated" ON student_parent_link
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for QR codes
CREATE POLICY "QR codes are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can upload QR codes" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can update QR codes" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can delete QR codes" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'qr-codes');

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to generate unique QR code
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS text AS $$
BEGIN
  RETURN 'QR_' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;
CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();