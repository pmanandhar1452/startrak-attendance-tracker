export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  program: string;
  avatar?: string;
}

export interface Session {
  id: string;
  name: string;
  instructor: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  status: 'upcoming' | 'active' | 'completed';
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  checkInTime?: Date;
  learningStartTime?: Date;
  checkOutTime?: Date;
  status: 'absent' | 'checked-in' | 'learning' | 'completed';
  notes?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  checkedIn: number;
  learning: number;
  completed: number;
  absent: number;
}