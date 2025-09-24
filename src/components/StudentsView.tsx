import React, { useState } from 'react';
import { User, Mail, BookOpen, Search, Plus, Edit3, Trash2, Calendar, Phone, AlertCircle, Clock, GraduationCap } from 'lucide-react';
import { Student, WeeklySchedule, TimeSlot } from '../types';

interface StudentsViewProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (id: string, student: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
}

export default function StudentsView({ students, onAddStudent, onUpdateStudent, onDeleteStudent }: StudentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    level: '',
    subject: '',
    program: '',
    avatar: '',
    schedule: {} as WeeklySchedule,
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'active' as const,
    contactNumber: '',
    emergencyContact: '',
    notes: ''
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const subjects = ['Computer Science', 'Data Science', 'Web Development', 'Cybersecurity', 'Software Engineering', 'AI/Machine Learning', 'Mobile Development', 'DevOps'];
  const sessionTypes = ['Theory', 'Practical', 'Lab', 'Workshop', 'Project Work', 'Review', 'Assessment'];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !filterLevel || student.level === filterLevel;
    const matchesSubject = !filterSubject || student.subject === filterSubject;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    
    return matchesSearch && matchesLevel && matchesSubject && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateStudent(editingStudent.id, formData);
      setEditingStudent(null);
    } else {
      onAddStudent(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      email: '',
      level: '',
      subject: '',
      program: '',
      avatar: '',
      schedule: {},
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
      contactNumber: '',
      emergencyContact: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      level: student.level,
      subject: student.subject,
      program: student.program || '',
      avatar: student.avatar || '',
      schedule: student.schedule,
      enrollmentDate: student.enrollmentDate,
      status: student.status,
      contactNumber: student.contactNumber || '',
      emergencyContact: student.emergencyContact || '',
      notes: student.notes || ''
    });
    setShowAddForm(true);
  };

  const addTimeSlot = (day: string) => {
    const newSchedule = { ...formData.schedule };
    if (!newSchedule[day as keyof WeeklySchedule]) {
      newSchedule[day as keyof WeeklySchedule] = [];
    }
    newSchedule[day as keyof WeeklySchedule]!.push({
      startTime: '09:00',
      endTime: '10:00',
      sessionType: 'Theory'
    });
    setFormData({ ...formData, schedule: newSchedule });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const newSchedule = { ...formData.schedule };
    newSchedule[day as keyof WeeklySchedule]!.splice(index, 1);
    if (newSchedule[day as keyof WeeklySchedule]!.length === 0) {
      delete newSchedule[day as keyof WeeklySchedule];
    }
    setFormData({ ...formData, schedule: newSchedule });
  };

  const updateTimeSlot = (day: string, index: number, field: string, value: string) => {
    const newSchedule = { ...formData.schedule };
    newSchedule[day as keyof WeeklySchedule]![index] = {
      ...newSchedule[day as keyof WeeklySchedule]![index],
      [field]: value
    };
    setFormData({ ...formData, schedule: newSchedule });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediate':
        return 'bg-amber-100 text-amber-800';
      case 'Advanced':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSchedule = (schedule: WeeklySchedule) => {
    const scheduledDays = Object.keys(schedule).length;
    const totalSlots = Object.values(schedule).reduce((acc, slots) => acc + (slots?.length || 0), 0);
    return `${scheduledDays} days, ${totalSlots} sessions`;
  };

  if (viewingStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
            <button
              onClick={() => setViewingStudent(null)}
              className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Info */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-100">
                <div className="text-center mb-6">
                  {viewingStudent.avatar ? (
                    <img
                      src={viewingStudent.avatar}
                      alt={viewingStudent.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {viewingStudent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mt-4">{viewingStudent.name}</h2>
                  <p className="text-gray-600">{viewingStudent.studentId}</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border mt-2 ${getStatusColor(viewingStudent.status)}`}>
                    {viewingStudent.status.charAt(0).toUpperCase() + viewingStudent.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{viewingStudent.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(viewingStudent.level)}`}>
                        {viewingStudent.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{viewingStudent.subject}</span>
                  </div>
                  {viewingStudent.program && (
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{viewingStudent.program}</span>
                    </div>
                  )}
                  {viewingStudent.contactNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{viewingStudent.contactNumber}</span>
                    </div>
                  )}
                  {viewingStudent.emergencyContact && (
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{viewingStudent.emergencyContact}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Enrolled: {new Date(viewingStudent.enrollmentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Weekly Schedule</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map((day) => {
                    const daySchedule = viewingStudent.schedule[day as keyof WeeklySchedule];
                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 capitalize">
                          {day}
                        </h4>
                        {daySchedule && daySchedule.length > 0 ? (
                          <div className="space-y-2">
                            {daySchedule.map((slot, index) => (
                              <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-blue-900">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  {slot.sessionType && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {slot.sessionType}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No sessions scheduled</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {viewingStudent.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{viewingStudent.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Management</h1>
            <p className="text-gray-600">Manage student profiles, academic details, and schedules</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
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

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.enrollmentDate}
                    onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Level</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                  <input
                    type="text"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Full Stack Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Weekly Schedule</h3>
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                      <button
                        type="button"
                        onClick={() => addTimeSlot(day)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        Add Session
                      </button>
                    </div>

                    {formData.schedule[day as keyof WeeklySchedule]?.map((slot, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(day, index, 'startTime', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(day, index, 'endTime', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Session Type</label>
                          <select
                            value={slot.sessionType || ''}
                            onChange={(e) => updateTimeSlot(day, index, 'sessionType', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Type</option>
                            {sessionTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(day, index)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about the student..."
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingStudent ? 'Update Student' : 'Add Student'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                {student.avatar ? (
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500">{student.studentId}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(student.level)}`}>
                      {student.level}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span className="truncate">{student.subject}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="truncate">{formatSchedule(student.schedule)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{student.email}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingStudent(student)}
                  className="flex-1 bg-blue-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => startEdit(student)}
                  className="flex-1 bg-amber-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDeleteStudent(student.id)}
                  className="bg-red-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">
            {searchTerm || filterLevel || filterSubject || filterStatus ? 'Try adjusting your search and filter criteria' : 'Start by adding your first student'}
          </p>
        </div>
      )}
    </div>
  );
}