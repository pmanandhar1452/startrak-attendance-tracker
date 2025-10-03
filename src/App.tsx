import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./components/Dashboard";
import AttendanceView from "./components/AttendanceView";
import SessionsView from "./components/SessionsView";
import StudentsView from "./components/StudentsView";
import IDManagementView from "./components/IDManagementView";
import QRScannerPage from "./components/QRScannerPage";
import UserManagementView from "./components/UserManagementView";
import AuditLogsView from "./components/AuditLogsView";
import { useStudents } from "./hooks/useStudents";
import { useAttendance } from "./hooks/useAttendance";
import { useSessions } from "./hooks/useSessions";

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  
  const { students } = useStudents();
  const { attendanceRecords, updateAttendanceRecord } = useAttendance();
  const { sessions, addSession, updateSession, deleteSession } = useSessions();

  const handleViewStudentDetails = (studentId: string) => {
    console.log('View student details:', studentId);
    // You can implement student detail view here
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            attendanceRecords={attendanceRecords}
            students={students}
            sessions={sessions}
          />
        );
      case 'students':
        return <StudentsView />;
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
      case 'qr-scanner':
        return <QRScannerPage onBack={() => setActiveView('dashboard')} />;
      case 'id-management':
        return <IDManagementView />;
      case 'users':
        return (
          <UserManagementView
            searchTerm={userSearchTerm}
            currentPage={userCurrentPage}
            pageSize={userPageSize}
            onSearchChange={setUserSearchTerm}
            onPageChange={setUserCurrentPage}
            onPageSizeChange={setUserPageSize}
            onViewStudentDetails={handleViewStudentDetails}
          />
        );
      case 'audit-logs':
        return <AuditLogsView />;
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
        <div className="min-h-screen bg-gray-100">
          <Header activeView={activeView} onViewChange={setActiveView} />
          <main className="p-6">
            {renderActiveView()}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
