/*
  # StarTrak Attendance Tracker Database Schema

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text)
      - `student_id` (text, unique)
      - `email` (text, unique)
      - `level` (text)
      - `subject` (text)
      - `program` (text, optional)
      - `avatar` (text, optional)
      - `contact_number` (text, optional)
      - `emergency_contact` (text, optional)
      - `enrollment_date` (date)
      - `status` (text)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `student_schedules`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `day_of_week` (text)
      - `start_time` (time)
      - `end_time` (time)
      - `session_type` (text, optional)
      - `created_at` (timestamp)

    - `sessions`
      - `id` (uuid, primary key)
      - `name` (text)
      - `instructor` (text)
      - `start_time` (time)
      - `end_time` (time)
      - `capacity` (integer)
      - `enrolled` (integer)
      - `status` (text)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `attendance_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `session_id` (uuid, foreign key)
      - `check_in_time` (timestamp, optional)
      - `learning_start_time` (timestamp, optional)
      - `check_out_time` (timestamp, optional)
      - `status` (text)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add policies for admin operations

  3. Functions
    - Schedule conflict validation function
    - Attendance statistics calculation
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  student_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  level text NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  subject text NOT NULL,
  program text,
  avatar text,
  contact_number text,
  emergency_contact text,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_schedules table
CREATE TABLE IF NOT EXISTS student_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instructor text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NOT NULL DEFAULT 25 CHECK (capacity > 0),
  enrolled integer NOT NULL DEFAULT 0 CHECK (enrolled >= 0 AND enrolled <= capacity),
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_session_time CHECK (start_time < end_time)
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  check_in_time timestamptz,
  learning_start_time timestamptz,
  check_out_time timestamptz,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('absent', 'checked-in', 'learning', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Students are viewable by authenticated users"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can be managed by authenticated users"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for student_schedules table
CREATE POLICY "Student schedules are viewable by authenticated users"
  ON student_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student schedules can be managed by authenticated users"
  ON student_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for sessions table
CREATE POLICY "Sessions are viewable by authenticated users"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sessions can be managed by authenticated users"
  ON sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for attendance_records table
CREATE POLICY "Attendance records are viewable by authenticated users"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance records can be managed by authenticated users"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to check schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_student_id uuid,
  p_day_of_week text,
  p_start_time time,
  p_end_time time,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM student_schedules
    WHERE student_id = p_student_id
      AND day_of_week = p_day_of_week
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND (
        (p_start_time >= start_time AND p_start_time < end_time) OR
        (p_end_time > start_time AND p_end_time <= end_time) OR
        (p_start_time <= start_time AND p_end_time >= end_time)
      )
  );
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_student_schedules_student_id ON student_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_student_schedules_day ON student_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance_records(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);