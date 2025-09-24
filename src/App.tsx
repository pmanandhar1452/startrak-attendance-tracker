import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AttendanceView from './components/AttendanceView';
import StudentsView from './components/StudentsView';
import SessionsView from './components/SessionsView';
import { mockStudents, mockSessions, mockAttendanceRecords } from './data/mockData';
import { Student, Session, AttendanceRecord } from './types';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);

  const handleUpdateAttendance = (recordId: string, newStatus: string) => {
    setAttendanceRecords(prev => prev.map(record => {
      if (record.id === recordId) {
        const now = new Date();
        const updates: Partial<AttendanceRecord> = { status: newStatus as any };
        
        if (newStatus === 'checked-in' && !record.checkInTime) {
          updates.checkInTime = now;
        } else if (newStatus === 'learning' && !record.learningStartTime) {
          updates.learningStartTime = now;
        } else if (newStatus === 'completed' && !record.checkOutTime) {
          updates.checkOutTime = now;
        }
        
        return { ...record, ...updates };
      }
      return record;
    }));
  };

  const handleAddStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = {
      ...student,
      id: (students.length + 1).toString()
    };
    setStudents(prev => [...prev, newStudent]);
    
    // Add attendance record for active session
    const activeSession = sessions.find(s => s.status === 'active');
    if (activeSession) {
      const newRecord: AttendanceRecord = {
        id: (attendanceRecords.length + 1).toString(),
        studentId: newStudent.id,
        sessionId: activeSession.id,
        status: 'absent'
      };
      setAttendanceRecords(prev => [...prev, newRecord]);
    }
  };

  const handleUpdateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, ...updates } : student
    ));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(student => student.id !== id));
    setAttendanceRecords(prev => prev.filter(record => record.studentId !== id));
  };

  const handleAddSession = (session: Omit<Session, 'id'>) => {
    const newSession = {
      ...session,
      id: (sessions.length + 1).toString()
    };
    setSessions(prev => [...prev, newSession]);
    
    // Add attendance records for all students
    const newRecords = students.map((student, index) => ({
      id: (attendanceRecords.length + index + 1).toString(),
      studentId: student.id,
      sessionId: newSession.id,
      status: 'absent' as const
    }));
    setAttendanceRecords(prev => [...prev, ...newRecords]);
  };

  const handleUpdateSession = (id: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(session => 
      session.id === id ? { ...session, ...updates } : session
    ));
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(session => session.id !== id));
    setAttendanceRecords(prev => prev.filter(record => record.sessionId !== id));
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
          />
        );
      case 'attendance':
        return (
          <AttendanceView 
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
            onUpdateAttendance={handleUpdateAttendance}
          />
        );
      case 'students':
        return (
          <StudentsView 
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
      case 'sessions':
        return (
          <SessionsView 
            sessions={sessions}
            onAddSession={handleAddSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
          />
        );
      default:
        return <Dashboard attendanceRecords={attendanceRecords} students={students} sessions={sessions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeView={activeView} onViewChange={setActiveView} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App;