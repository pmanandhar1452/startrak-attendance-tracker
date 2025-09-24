import React, { useState } from 'react';
import { Clock, BookOpen, CheckCircle, ArrowRight, User, Search } from 'lucide-react';
import { AttendanceRecord, Student, Session } from '../types';

interface AttendanceViewProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  sessions: Session[];
  onUpdateAttendance: (recordId: string, newStatus: string) => void;
}

export default function AttendanceView({ attendanceRecords, students, sessions, onUpdateAttendance }: AttendanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState(sessions.find(s => s.status === 'active')?.id || sessions[0]?.id || '');

  const getNextStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'absent':
        return 'checked-in';
      case 'checked-in':
        return 'learning';
      case 'learning':
        return 'completed';
      default:
        return currentStatus;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'absent':
        return {
          label: 'Absent',
          icon: User,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          buttonColor: 'bg-amber-500 hover:bg-amber-600',
          nextAction: 'Check In'
        };
      case 'checked-in':
        return {
          label: 'Checked In',
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-100',
          buttonColor: 'bg-teal-500 hover:bg-teal-600',
          nextAction: 'Start Learning'
        };
      case 'learning':
        return {
          label: 'Learning',
          icon: BookOpen,
          color: 'text-teal-600',
          bg: 'bg-teal-100',
          buttonColor: 'bg-emerald-500 hover:bg-emerald-600',
          nextAction: 'Check Out'
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle,
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
          buttonColor: 'bg-gray-400',
          nextAction: 'Completed'
        };
      default:
        return {
          label: 'Unknown',
          icon: User,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          buttonColor: 'bg-gray-400',
          nextAction: 'Update'
        };
    }
  };

  const filteredRecords = attendanceRecords
    .filter(record => record.sessionId === selectedSession)
    .filter(record => {
      const student = students.find(s => s.id === record.studentId);
      return student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             student?.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const studentA = students.find(s => s.id === a.studentId)?.name || '';
      const studentB = students.find(s => s.id === b.studentId)?.name || '';
      return studentA.localeCompare(studentB);
    });

  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <div className="space-y-6">
      {/* Session Selector and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Management</h1>
            <p className="text-gray-600">Track and manage student attendance across all sessions</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} ({session.status})
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-64"
              />
            </div>
          </div>
        </div>

        {selectedSessionData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Instructor:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedSessionData.instructor}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedSessionData.startTime} - {selectedSessionData.endTime}</span>
              </div>
              <div>
                <span className="text-gray-600">Enrolled:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedSessionData.enrolled}/{selectedSessionData.capacity}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-medium capitalize px-2 py-1 rounded-full text-xs ${
                  selectedSessionData.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedSessionData.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedSessionData.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecords.map((record) => {
          const student = students.find(s => s.id === record.studentId);
          const statusInfo = getStatusInfo(record.status);
          const Icon = statusInfo.icon;
          const canProgress = record.status !== 'completed';

          return (
            <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    {student?.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {student?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${statusInfo.bg} rounded-full flex items-center justify-center border-2 border-white`}>
                      <Icon className={`h-3 w-3 ${statusInfo.color}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {student?.name || 'Unknown Student'}
                    </h3>
                    <p className="text-xs text-gray-500">{student?.studentId}</p>
                    <p className="text-xs text-gray-500">{student?.program}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`${statusInfo.bg} rounded-lg p-3 text-center`}>
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Time Information */}
                  <div className="text-xs text-gray-500 space-y-1">
                    {record.checkInTime && (
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span className="font-medium">
                          {record.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {record.learningStartTime && (
                      <div className="flex justify-between">
                        <span>Learning:</span>
                        <span className="font-medium">
                          {record.learningStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {record.checkOutTime && (
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span className="font-medium">
                          {record.checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {canProgress && (
                    <button
                      onClick={() => onUpdateAttendance(record.id, getNextStatus(record.status))}
                      className={`w-full ${statusInfo.buttonColor} text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95`}
                    >
                      <span>{statusInfo.nextAction}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No students enrolled in this session'}
          </p>
        </div>
      )}
    </div>
  );
}