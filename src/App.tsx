import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AttendanceView from './components/AttendanceView';
import StudentsView from './components/StudentsView';
import SessionsView from './components/SessionsView';
import ConsolidatedIDManagementView from './components/ConsolidatedIDManagementView';
import UserManagementView from './components/UserManagementView';
import QRScannerPage from './components/QRScannerPage';
import { useStudents } from './hooks/useStudents';
import { useSessions } from './hooks/useSessions';
import { useAttendance } from './hooks/useAttendance';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const { students } = useStudents();
  const { sessions, addSession, updateSession, deleteSession } = useSessions();
  const { attendanceRecords, updateAttendanceRecord } = useAttendance();

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
            onUpdateAttendance={updateAttendanceRecord}
          />
        );
      case 'students':
        return <StudentsView />;
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
        return <UserManagementView />;
      case 'id-management':
        return <ConsolidatedIDManagementView />;
      case 'qr-scanner':
        return <QRScannerPage onBack={() => setActiveView('dashboard')} />;
      default:
        return <Dashboard attendanceRecords={attendanceRecords} students={students} sessions={sessions} />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header activeView={activeView} onViewChange={setActiveView} />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderView()}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;