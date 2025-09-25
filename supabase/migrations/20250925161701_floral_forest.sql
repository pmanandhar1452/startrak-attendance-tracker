/*
  # Enhanced Student Management System

  1. New Tables
    - Enhanced `students` table with comprehensive profile fields
    - `student_schedules` table for weekly schedule management
    - Updated `sessions` and `attendance_records` tables

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all data
    - Secure API access for admin operations

  3. Functions
    - Schedule conflict validation function
    - Automatic timestamp updates

  4. Indexes
    - Performance optimization for common queries
    - Student lookup and schedule queries
*/

-- Drop existing tables if they exist to recreate with proper schema
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS student_schedules CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Create students table with comprehensive profile fields
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

-- Create student_schedules table for weekly schedule management
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
  enrolled integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_session_time CHECK (start_time < end_time),
  CONSTRAINT sessions_check CHECK (enrolled >= 0 AND enrolled <= capacity)
);

-- Create attendance_records table for three-stage tracking
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_subject ON students(subject);
CREATE INDEX IF NOT EXISTS idx_student_schedules_student_id ON student_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_student_schedules_day ON student_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance_records(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Students can be managed by authenticated users"
  ON students
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Student schedules can be managed by authenticated users"
  ON student_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Student schedules are viewable by authenticated users"
  ON student_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sessions can be managed by authenticated users"
  ON sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Sessions are viewable by authenticated users"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance records can be managed by authenticated users"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Attendance records are viewable by authenticated users"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Create function to check schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_student_id uuid,
  p_day_of_week text,
  p_start_time time,
  p_end_time time,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO students (name, student_id, email, level, subject, program, avatar, contact_number, emergency_contact, enrollment_date, status, notes) VALUES
('Emma Wilson', 'STU001', 'emma.wilson@school.edu', 'Intermediate', 'Computer Science', 'Full Stack Development', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', '+1-555-0101', '+1-555-0102', '2024-01-15', 'active', 'Excellent progress in programming fundamentals'),
('James Rodriguez', 'STU002', 'james.rodriguez@school.edu', 'Advanced', 'Data Science', 'Machine Learning Specialization', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', '+1-555-0201', NULL, '2024-01-10', 'active', NULL),
('Sophia Chen', 'STU003', 'sophia.chen@school.edu', 'Beginner', 'Web Development', 'Frontend Development', 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', '+1-555-0301', '+1-555-0302', '2024-02-01', 'active', 'New to programming, very motivated'),
('Marcus Johnson', 'STU004', 'marcus.johnson@school.edu', 'Advanced', 'Cybersecurity', 'Ethical Hacking', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', '+1-555-0401', NULL, '2024-01-20', 'active', NULL),
('Isabella Martinez', 'STU005', 'isabella.martinez@school.edu', 'Intermediate', 'Computer Science', 'Software Engineering', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', '+1-555-0501', '+1-555-0502', '2024-01-25', 'active', NULL),
('David Kim', 'STU006', 'david.kim@school.edu', 'Beginner', 'Data Science', 'Data Analytics', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', '+1-555-0601', NULL, '2024-02-05', 'active', NULL);

-- Insert sample schedules
INSERT INTO student_schedules (student_id, day_of_week, start_time, end_time, session_type) VALUES
((SELECT id FROM students WHERE student_id = 'STU001'), 'monday', '09:00', '11:00', 'Theory'),
((SELECT id FROM students WHERE student_id = 'STU001'), 'wednesday', '14:00', '16:00', 'Practical'),
((SELECT id FROM students WHERE student_id = 'STU001'), 'friday', '10:00', '12:00', 'Lab'),
((SELECT id FROM students WHERE student_id = 'STU002'), 'tuesday', '09:00', '12:00', 'Workshop'),
((SELECT id FROM students WHERE student_id = 'STU002'), 'thursday', '13:00', '15:00', 'Theory'),
((SELECT id FROM students WHERE student_id = 'STU002'), 'saturday', '10:00', '13:00', 'Project Work'),
((SELECT id FROM students WHERE student_id = 'STU003'), 'monday', '14:00', '16:00', 'Theory'),
((SELECT id FROM students WHERE student_id = 'STU003'), 'wednesday', '14:00', '17:00', 'Practical'),
((SELECT id FROM students WHERE student_id = 'STU003'), 'friday', '09:00', '11:00', 'Review');

-- Insert sample sessions
INSERT INTO sessions (name, instructor, start_time, end_time, capacity, enrolled, status, description) VALUES
('Advanced JavaScript Concepts', 'Dr. Sarah Mitchell', '09:00', '10:30', 25, 18, 'active', 'Deep dive into ES6+ features, async programming, and modern JavaScript patterns'),
('Data Structures & Algorithms', 'Prof. Michael Thompson', '11:00', '12:30', 30, 24, 'upcoming', 'Comprehensive study of fundamental data structures and algorithmic problem solving'),
('React Development Workshop', 'Ms. Jennifer Liu', '14:00', '16:00', 20, 16, 'upcoming', 'Hands-on workshop covering React hooks, state management, and component design patterns');