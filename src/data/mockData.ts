import { Student, Session, AttendanceRecord } from '../types';

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emma Wilson',
    studentId: 'STU001',
    email: 'emma.wilson@school.edu',
    program: 'Computer Science',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '2',
    name: 'James Rodriguez',
    studentId: 'STU002',
    email: 'james.rodriguez@school.edu',
    program: 'Data Science',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '3',
    name: 'Sophia Chen',
    studentId: 'STU003',
    email: 'sophia.chen@school.edu',
    program: 'Web Development',
    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '4',
    name: 'Marcus Johnson',
    studentId: 'STU004',
    email: 'marcus.johnson@school.edu',
    program: 'Cybersecurity',
    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '5',
    name: 'Isabella Martinez',
    studentId: 'STU005',
    email: 'isabella.martinez@school.edu',
    program: 'Computer Science',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '6',
    name: 'David Kim',
    studentId: 'STU006',
    email: 'david.kim@school.edu',
    program: 'Data Science',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];

export const mockSessions: Session[] = [
  {
    id: '1',
    name: 'Advanced JavaScript Concepts',
    instructor: 'Dr. Sarah Mitchell',
    startTime: '09:00',
    endTime: '10:30',
    capacity: 25,
    enrolled: 18,
    status: 'active',
    description: 'Deep dive into ES6+ features, async programming, and modern JavaScript patterns'
  },
  {
    id: '2',
    name: 'Data Structures & Algorithms',
    instructor: 'Prof. Michael Thompson',
    startTime: '11:00',
    endTime: '12:30',
    capacity: 30,
    enrolled: 24,
    status: 'upcoming',
    description: 'Comprehensive study of fundamental data structures and algorithmic problem solving'
  },
  {
    id: '3',
    name: 'React Development Workshop',
    instructor: 'Ms. Jennifer Liu',
    startTime: '14:00',
    endTime: '16:00',
    capacity: 20,
    enrolled: 16,
    status: 'upcoming',
    description: 'Hands-on workshop covering React hooks, state management, and component design patterns'
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    studentId: '1',
    sessionId: '1',
    checkInTime: new Date(Date.now() - 30 * 60 * 1000),
    learningStartTime: new Date(Date.now() - 20 * 60 * 1000),
    status: 'learning'
  },
  {
    id: '2',
    studentId: '2',
    sessionId: '1',
    checkInTime: new Date(Date.now() - 25 * 60 * 1000),
    status: 'checked-in'
  },
  {
    id: '3',
    studentId: '3',
    sessionId: '1',
    checkInTime: new Date(Date.now() - 35 * 60 * 1000),
    learningStartTime: new Date(Date.now() - 30 * 60 * 1000),
    checkOutTime: new Date(Date.now() - 5 * 60 * 1000),
    status: 'completed'
  },
  {
    id: '4',
    studentId: '4',
    sessionId: '1',
    checkInTime: new Date(Date.now() - 15 * 60 * 1000),
    learningStartTime: new Date(Date.now() - 10 * 60 * 1000),
    status: 'learning'
  },
  {
    id: '5',
    studentId: '5',
    sessionId: '1',
    status: 'absent'
  },
  {
    id: '6',
    studentId: '6',
    sessionId: '1',
    checkInTime: new Date(Date.now() - 40 * 60 * 1000),
    learningStartTime: new Date(Date.now() - 35 * 60 * 1000),
    checkOutTime: new Date(Date.now() - 10 * 60 * 1000),
    status: 'completed'
  }
];