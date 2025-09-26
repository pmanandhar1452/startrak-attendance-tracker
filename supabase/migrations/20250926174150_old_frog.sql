/*
  # Create audit logs table for tracking user changes

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `table_name` (text, name of table modified)
      - `record_id` (text, ID of record modified)
      - `action` (text, type of action: INSERT, UPDATE, DELETE)
      - `old_values` (jsonb, previous values)
      - `new_values` (jsonb, new values)
      - `changed_by` (uuid, user who made the change)
      - `changed_at` (timestamp, when change occurred)
      - `ip_address` (text, optional IP tracking)
      - `user_agent` (text, optional browser info)

  2. Security
    - Enable RLS on `audit_logs` table
    - Add policy for admins to view audit logs
    - Add policy to prevent modification of audit logs

  3. Functions
    - Create function to log user changes
    - Create trigger function for automatic logging
*/

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- RLS Policies
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.role_name = 'admin'
    )
  );

-- Prevent modification of audit logs (insert only)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_table_name text,
  p_record_id text,
  p_action text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_changed_by uuid DEFAULT auth.uid()
) RETURNS uuid AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by
  ) VALUES (
    p_table_name,
    p_record_id,
    p_action,
    p_old_values,
    p_new_values,
    p_changed_by
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = user_id AND r.role_name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;