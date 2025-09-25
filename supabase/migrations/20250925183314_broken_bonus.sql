/*
  # ID Management System

  1. New Tables
    - `generated_ids` - Central table for all generated IDs
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `id_type` (text, type of ID: 'student_card', 'qr_code', etc.)
      - `id_value` (text, the actual ID value/code)
      - `metadata` (jsonb, additional data like URLs, settings)
      - `status` (text, active/inactive/expired)
      - `generated_by` (uuid, user who generated it)
      - `generated_at` (timestamptz)
      - `expires_at` (timestamptz, optional expiration)
      - `last_used_at` (timestamptz, optional last usage)

  2. Security
    - Enable RLS on `generated_ids` table
    - Add policies for authenticated admin users only
    - Add indexes for performance

  3. Functions
    - Function to clean up expired IDs
    - Function to get ID statistics
*/

-- Create generated_ids table
CREATE TABLE IF NOT EXISTS generated_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  id_type text NOT NULL CHECK (id_type IN ('student_card', 'qr_code', 'access_card', 'library_card')),
  id_value text NOT NULL,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_ids_student_id ON generated_ids(student_id);
CREATE INDEX IF NOT EXISTS idx_generated_ids_type ON generated_ids(id_type);
CREATE INDEX IF NOT EXISTS idx_generated_ids_status ON generated_ids(status);
CREATE INDEX IF NOT EXISTS idx_generated_ids_generated_at ON generated_ids(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_ids_generated_by ON generated_ids(generated_by);

-- Add unique constraint for active IDs of same type per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_ids_unique_active 
ON generated_ids(student_id, id_type) 
WHERE status = 'active';

-- Enable RLS
ALTER TABLE generated_ids ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin users can view all generated IDs"
  ON generated_ids
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Admin users can manage generated IDs"
  ON generated_ids
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.role_name = 'admin'
    )
  );

-- Function to get ID statistics
CREATE OR REPLACE FUNCTION get_id_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_ids', COUNT(*),
    'active_ids', COUNT(*) FILTER (WHERE status = 'active'),
    'expired_ids', COUNT(*) FILTER (WHERE status = 'expired'),
    'by_type', jsonb_object_agg(id_type, type_count)
  ) INTO stats
  FROM (
    SELECT 
      id_type,
      COUNT(*) as type_count
    FROM generated_ids
    GROUP BY id_type
  ) type_stats,
  generated_ids;
  
  RETURN stats;
END;
$$;

-- Function to cleanup expired IDs
CREATE OR REPLACE FUNCTION cleanup_expired_ids()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE generated_ids 
  SET status = 'expired', updated_at = now()
  WHERE expires_at < now() AND status = 'active';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_generated_ids_updated_at
  BEFORE UPDATE ON generated_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for existing student QR codes
INSERT INTO generated_ids (student_id, id_type, id_value, metadata, generated_by)
SELECT 
  sqr.student_id,
  'qr_code' as id_type,
  sqr.qr_code as id_value,
  jsonb_build_object(
    'qr_code_url', sqr.qr_code_url,
    'is_active', sqr.is_active
  ) as metadata,
  auth.uid() as generated_by
FROM student_qr_codes sqr
WHERE sqr.is_active = true
ON CONFLICT DO NOTHING;