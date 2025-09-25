/*
  # Add Student QR Code System

  1. New Tables
    - `student_qr_codes`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `qr_code` (text, unique QR code value)
      - `qr_code_url` (text, URL to QR code image)
      - `is_active` (boolean, for QR code rotation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create storage buckets for QR codes and ID cards
    - Set up proper RLS policies for public access

  3. Security
    - Enable RLS on student_qr_codes table
    - Add policies for authenticated users
*/

-- Create student_qr_codes table
CREATE TABLE IF NOT EXISTS student_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  qr_code text UNIQUE NOT NULL,
  qr_code_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'student_qr_codes_student_id_fkey'
  ) THEN
    ALTER TABLE student_qr_codes 
    ADD CONSTRAINT student_qr_codes_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_student_qr_codes_student_id ON student_qr_codes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_qr_codes_active ON student_qr_codes(is_active);

-- Enable RLS
ALTER TABLE student_qr_codes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Student QR codes are viewable by authenticated users"
  ON student_qr_codes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student QR codes can be managed by authenticated users"
  ON student_qr_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_student_qr_codes_updated_at
  BEFORE UPDATE ON student_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets (these will be created via the service)
-- qr-codes bucket for individual QR code images
-- id-cards bucket for generated ID card templates