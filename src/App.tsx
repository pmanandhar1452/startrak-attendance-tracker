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

  // User Management state preservation
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
            onSearchChange={(searchTerm) => setUserManagementState(prev => ({ ...prev, searchTerm }))}
            onPageChange={(page) => setUserManagementState(prev => ({ ...prev, currentPage: page }))}
            onPageSizeChange={(pageSize) => setUserManagementState(prev => ({ ...prev, pageSize }))}
            onViewStudentDetails={handleViewStudentDetails}
          />
        );
      case 'qr-scanner':
        return <QRScannerPage />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'id-management':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0v2m0 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">ID Management</h2>
              <p className="text-gray-600 mb-4">Generate and manage student ID cards, QR codes, and access cards.</p>
              <p className="text-sm text-gray-500">This feature is coming soon.</p>
            </div>
          </div>
        );
      default:
        return (
          <Dashboard
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
          />
        );
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header activeView={activeView.name} onViewChange={handleViewChange} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderView()}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;