/*
  # Clean Up Existing User System
  
  1. Changes
    - Drop all existing user-related tables and their dependencies
    - Drop triggers and functions related to user management
    - Clean slate for new simplified user system
  
  2. Tables to Drop
    - audit_logs
    - student_parent_link
    - parents
    - user_profiles
    - roles
    - instructors (if exists)
  
  3. Functions and Triggers to Drop
    - handle_new_user() function and trigger
    - Any audit logging functions
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_auth_user_insert ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_qr_code() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS student_parent_link CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS instructors CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
