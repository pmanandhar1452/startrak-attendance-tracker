import { Student, Session, AttendanceRecord } from '../types';

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emma Wilson',
    studentId: 'STU001',
    email: 'emma.wilson@school.edu',
    level: 'Intermediate',
    subject: 'Computer Science',
    program: 'Full Stack Development',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    schedule: {
      monday: [{ startTime: '09:00', endTime: '11:00', sessionType: 'Theory' }],
      wednesday: [{ startTime: '14:00', endTime: '16:00', sessionType: 'Practical' }],
      friday: [{ startTime: '10:00', endTime: '12:00', sessionType: 'Lab' }]
    },
    enrollmentDate: '2024-01-15',
    status: 'active',
    contactNumber: '+1-555-0101',
    emergencyContact: '+1-555-0102'
  },
  {
    id: '2',
    name: 'James Rodriguez',
    studentId: 'STU002',
    email: 'james.rodriguez@school.edu',
    level: 'Advanced',
    subject: 'Data Science',
    program: 'Machine Learning Specialization',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    schedule: {
      tuesday: [{ startTime: '09:00', endTime: '12:00', sessionType: 'Workshop' }],
      thursday: [{ startTime: '13:00', endTime: '15:00', sessionType: 'Theory' }],
      saturday: [{ startTime: '10:00', endTime: '13:00', sessionType: 'Project Work' }]
    },
    enrollmentDate: '2024-01-10',
    status: 'active',
    contactNumber: '+1-555-0201'
  },
  {
    id: '3',
    name: 'Sophia Chen',
    studentId: 'STU003',
    email: 'sophia.chen@school.edu',
    level: 'Beginner',
    subject: 'Web Development',
    program: 'Frontend Development',
    avatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    schedule: {
      monday: [{ startTime: '14:00', endTime: '16:00', sessionType: 'Theory' }],
      wednesday: [{ startTime: '14:00', endTime: '17:00', sessionType: 'Practical' }],
      friday: [{ startTime: '09:00', endTime: '11:00', sessionType: 'Review' }]
    },
    enrollmentDate: '2024-02-01',
    status: 'active',
    contactNumber: '+1-555-0301',
    emergencyContact: '+1-555-0302'
  },
  {
    id: '4',
    name: 'Marcus Johnson',
    studentId: 'STU004',
    email: 'marcus.johnson@school.edu',
    level: 'Advanced',
    subject: 'Cybersecurity',
    program: 'Ethical Hacking',
    avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    schedule: {
      tuesday: [{ startTime: '10:00', endTime: '13:00', sessionType: 'Lab' }],
      thursday: [{ startTime: '09:00', endTime: '11:00', sessionType: 'Theory' }],
      saturday: [{ startTime: '14:00', endTime: '17:00', sessionType: 'Practical' }]
    },
    enrollmentDate: '2024-01-20',
    status: 'active',
    contactNumber: '+1-555-0401'
  },
  {
    id: '5',
    name: 'Isabella Martinez',
    studentId: 'STU005',
    email: 'isabella.martinez@school.edu',
    level: 'Intermediate',
    subject: 'Computer Science',
    program: 'Software Engineering',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    schedule: {
      monday: [{ startTime: '10:00', endTime: '12:00', sessionType: 'Theory' }],
      wednesday: [{ startTime: '15:00', endTime: '17:00', sessionType: 'Lab' }],
      friday: [{ startTime: '13:00', endTime: '15:00', sessionType: 'Project' }]
    },
    enrollmentDate: '2024-01-25',
    status: 'active',
    contactNumber: '+1-555-0501',
    emergencyContact: '+1-555-0502'
  },
  {
    id: '6',
    name: 'David Kim',
    studentId: 'STU006',
    email: 'david.kim@school.edu',
    level: 'Beginner',
    subject: 'Data Science',
    program: 'Data Analytics',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    schedule: {
      tuesday: [{ startTime: '14:00', endTime: '16:00', sessionType: 'Theory' }],
      thursday: [{ startTime: '10:00', endTime: '13:00', sessionType: 'Practical' }],
      saturday: [{ startTime: '09:00', endTime: '11:00', sessionType: 'Review' }]
    },
    enrollmentDate: '2024-02-05',
    status: 'active',
    contactNumber: '+1-555-0601'
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