import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentsView from './components/StudentsView';
import AttendanceView from './components/AttendanceView';
import SessionsView from './components/SessionsView';
import UserManagementView from './components/UserManagementView';
import QRScannerPage from './components/QRScannerPage';
import AuditLogsView from './components/AuditLogsView';
import { useStudents } from './hooks/useStudents';
import { useSessions } from './hooks/useSessions';
import { useAttendance } from './hooks/useAttendance';

function App() {
  const [activeView, setActiveView] = useState<{ name: string; params?: any }>({ name: 'dashboard' });

  // 🔹 DEBUG CODE: runs once on load
  useEffect(() => {
    async function debug() {
      const { data: user, error: userErr } = await supabase.auth.getUser();
      console.log("🔑 Logged in user:", user, "err:", userErr);

      const { data: roles, error: rolesErr } = await supabase.from('roles').select('*').limit(5);
      console.log("📋 Roles test:", rolesErr || roles);

      const { data: students, error: studentsErr } = await supabase.from('students').select('*').limit(5);
      console.log("👩‍🎓 Students test:", studentsErr || students);
    }

    debug();
  }, []);

  const [userManagementState, setUserManagementState] = useState({
    searchTerm: '',
    currentPage: 1,
    pageSize: 10
  });

  const { students } = useStudents();
  const { sessions, addSession, updateSession, deleteSession } = useSessions();
  const { attendanceRecords, updateAttendanceRecord } = useAttendance();

  const handleViewChange = (view: string, params?: any) => {
    setActiveView({ name: view, params });
  };

  const handleViewStudentDetails = (studentId: string) => {
    setActiveView({ name: 'students', params: { studentId } });
  };

  const handleBackToUserManagement = () => {
    setActiveView({ name: 'users' });
  };

  const renderView = () => {
    switch (activeView.name) {
      case 'dashboard':
        return (
          <Dashboard 
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
          />
        );
      case 'students':
        return (
          <StudentsView 
            studentId={activeView.params?.studentId}
            onBackToUserManagement={activeView.params?.studentId ? handleBackToUserManagement : undefined}
          />
        );
      case 'attendance':
        return (
          <AttendanceView 
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
            onUpdateAttendance={updateAttendanceRecord}
          />
        );
      case 'sessions':
        return (
          <SessionsView 
            sessions={sessions}
            onAddSession={addSession}
            onUpdateSession={updateSession}
            onDeleteSession={deleteSession}
          />
        );
      case 'users':
        return (
          <UserManagementView 
            searchTerm={userManagementState.searchTerm}
            currentPage={userManagementState.currentPage}
            pageSize={userManagementState.pageSize}
          />
        );
      default:
        return <Dashboard attendanceRecords={attendanceRecords} students={students} sessions={sessions} />;
    }
  };

  return (
    <AuthProvider>
      <Header onChangeView={handleViewChange} />
      {renderView()}
    </AuthProvider>
  );
}

export default App;