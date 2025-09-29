import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentsView from './components/StudentsView';
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
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
            onUpdateAttendance={updateAttendanceRecord}
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
            onPageChange={(currentPage) => setUserManagementState(prev => ({ ...prev, currentPage }))}
            onPageSizeChange={(pageSize) => setUserManagementState(prev => ({ ...prev, pageSize, currentPage: 1 }))}
            onViewStudentDetails={handleViewStudentDetails}
          />
        );
      case 'qr-scanner':
        return <QRScannerPage onBack={() => handleViewChange('dashboard')} />;
      case 'audit-logs':
        return <AuditLogsView />;
      default:
        return <Dashboard attendanceRecords={attendanceRecords} students={students} sessions={sessions} />;
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