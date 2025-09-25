/*
  # Add updated_at column to parents table

  1. Changes
    - Add `updated_at` column to `parents` table with default value
    - Ensure `update_updated_at_column` trigger function exists
    - Create trigger to automatically update `updated_at` on row changes

  2. Security
    - No RLS changes needed
*/

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to parents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parents' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE parents ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace the trigger for parents table
DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;
CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();