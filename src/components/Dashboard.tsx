import React from 'react';
import { Users, Clock, CheckCircle, XCircle, TrendingUp, BookOpen } from 'lucide-react';
import { AttendanceStats, AttendanceRecord, Student, Session } from '../types';

interface DashboardProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  sessions: Session[];
}

export default function Dashboard({ attendanceRecords, students, sessions }: DashboardProps) {
  const calculateStats = (): AttendanceStats => {
    const totalStudents = students.length;
    const checkedIn = attendanceRecords.filter(r => r.status === 'checked-in').length;
    const learning = attendanceRecords.filter(r => r.status === 'learning').length;
    const completed = attendanceRecords.filter(r => r.status === 'completed').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;

    return { totalStudents, checkedIn, learning, completed, absent };
  };

  const stats = calculateStats();
  const activeSession = sessions.find(s => s.status === 'active');
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Checked In',
      value: stats.checkedIn,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      title: 'Learning',
      value: stats.learning,
      icon: BookOpen,
      color: 'bg-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  const recentActivity = attendanceRecords
    .filter(record => record.checkInTime || record.learningStartTime || record.checkOutTime)
    .sort((a, b) => {
      const timeA = a.checkOutTime || a.learningStartTime || a.checkInTime || new Date(0);
      const timeB = b.checkOutTime || b.learningStartTime || b.checkInTime || new Date(0);
      return timeB.getTime() - timeA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`${card.bgColor} rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Session */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active Session</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live</span>
            </div>
          </div>

          {activeSession ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeSession.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Instructor:</span>
                    <span className="ml-2 font-medium text-gray-900">{activeSession.instructor}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-2 font-medium text-gray-900">{activeSession.startTime} - {activeSession.endTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Capacity:</span>
                    <span className="ml-2 font-medium text-gray-900">{activeSession.enrolled}/{activeSession.capacity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Attendance:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {(((stats.checkedIn + stats.learning + stats.completed) / stats.totalStudents) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Session Progress</span>
                  <span>{stats.checkedIn + stats.learning + stats.completed}/{stats.totalStudents} students</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((stats.checkedIn + stats.learning + stats.completed) / stats.totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No Active Session</p>
              <p className="text-sm">Sessions will appear here when active</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((record) => {
              const student = students.find(s => s.id === record.studentId);
              const getStatusInfo = (status: string) => {
                switch (status) {
                  case 'checked-in':
                    return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', text: 'Checked In' };
                  case 'learning':
                    return { icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-100', text: 'Learning' };
                  case 'completed':
                    return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', text: 'Completed' };
                  default:
                    return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
                }
              };

              const statusInfo = getStatusInfo(record.status);
              const Icon = statusInfo.icon;

              return (
                <div key={record.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`${statusInfo.bg} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${statusInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student?.name || 'Unknown Student'}
                    </p>
                    <p className="text-xs text-gray-500">{statusInfo.text}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {record.checkOutTime ? record.checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                     record.learningStartTime ? record.learningStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                     record.checkInTime ? record.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                <h3 className="font-semibold text-gray-900 mb-2">{session.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{session.instructor}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{session.startTime} - {session.endTime}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {session.enrolled}/{session.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}