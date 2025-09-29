import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit3, Trash2, Calendar, Clock, BookOpen, User, AlertCircle, CheckCircle, X, Mail, Phone, GraduationCap } from 'lucide-react';
import { Student, WeeklySchedule, TimeSlot } from '../types';
import { useStudents } from '../hooks/useStudents';

interface StudentsViewProps {
  studentId?: string;
  onBackToUserManagement?: () => void;
  attendanceRecords?: any[];
  students?: Student[];
  sessions?: any[];
  onUpdateAttendance?: (recordId: string, newStatus: string) => void;
  onAddSession?: (session: any) => void;
  onUpdateSession?: (id: string, session: any) => void;
  onDeleteSession?: (id: string) => void;
}

export default function StudentsView({ 
  studentId, 
  onBackToUserManagement 
}: StudentsViewProps) {
  const { students, loading, error, addStudent, updateStudent, deleteStudent, fetchStudentById } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    subject: '',
    program: '',
    contactNumber: '',
    emergencyContact: '',
    notes: '',
    schedule: {} as WeeklySchedule
  });

  // Schedule editing state
  const [scheduleData, setScheduleData] = useState<WeeklySchedule>({});

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const sessionTypes = ['Theory', 'Practical', 'Lab', 'Workshop', 'Review', 'Project'];

  // Load specific student if studentId is provided
  useEffect(() => {
    if (studentId) {
      const loadStudent = async () => {
        const student = await fetchStudentById(studentId);
        if (student) {
          setSelectedStudent(student);
        }
      };
      loadStudent();
    }
  }, [studentId, fetchStudentById]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Validate form data
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setSubmitError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setSubmitError('Student ID is required');
      return false;
    }
    if (!formData.email.trim()) {
      setSubmitError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setSubmitError('Please enter a valid email address');
      return false;
    }
    if (!formData.subject.trim()) {
      setSubmitError('Subject is required');
      return false;
    }
    return true;
  };

  // Validate schedule conflicts
  const validateSchedule = (schedule: WeeklySchedule): string | null => {
    for (const [day, slots] of Object.entries(schedule)) {
      if (!slots || slots.length === 0) continue;

      // Sort slots by start time for easier conflict detection
      const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const currentSlot = sortedSlots[i];
        const nextSlot = sortedSlots[i + 1];

        // Check if current slot end time overlaps with next slot start time
        if (currentSlot.endTime > nextSlot.startTime) {
          return `Schedule conflict detected on ${day}: ${currentSlot.startTime}-${currentSlot.endTime} overlaps with ${nextSlot.startTime}-${nextSlot.endTime}`;
        }
      }

      // Validate individual time slots
      for (const slot of slots) {
        if (slot.startTime >= slot.endTime) {
          return `Invalid time range on ${day}: Start time must be before end time (${slot.startTime} - ${slot.endTime})`;
        }
      }
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Validate schedule if provided
    const scheduleError = validateSchedule(scheduleData);
    if (scheduleError) {
      setSubmitError(scheduleError);
      setIsSubmitting(false);
      return;
    }

    try {
      const studentData: Omit<Student, 'id'> = {
        name: formData.name.trim(),
        studentId: formData.studentId.trim(),
        email: formData.email.trim(),
        level: formData.level,
        subject: formData.subject.trim(),
        program: formData.program.trim() || undefined,
        contactNumber: formData.contactNumber.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        schedule: scheduleData,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      if (editingStudent) {
        const updatedStudent = await updateStudent(editingStudent.id, studentData);
        setSubmitSuccess(`Student "${updatedStudent.name}" updated successfully!`);
        setEditingStudent(null);
      } else {
        const newStudent = await addStudent(studentData);
        setSubmitSuccess(`Student "${newStudent.name}" added successfully!`);
      }

      // Reset form
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save student';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      email: '',
      level: 'Beginner',
      subject: '',
      program: '',
      contactNumber: '',
      emergencyContact: '',
      notes: '',
      schedule: {}
    });
    setScheduleData({});
    setSubmitError(null);
  };

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      level: student.level,
      subject: student.subject,
      program: student.program || '',
      contactNumber: student.contactNumber || '',
      emergencyContact: student.emergencyContact || '',
      notes: student.notes || '',
      schedule: student.schedule
    });
    setScheduleData(student.schedule || {});
    setShowAddForm(true);
  };

  // Handle delete student
  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteStudent(student.id);
      setSubmitSuccess(`Student "${student.name}" deleted successfully!`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  // Handle schedule changes
  const handleScheduleChange = (day: keyof WeeklySchedule, slots: TimeSlot[]) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: slots
    }));
  };

  // Add time slot to a day
  const addTimeSlot = (day: keyof WeeklySchedule) => {
    const currentSlots = scheduleData[day] || [];
    const newSlot: TimeSlot = {
      startTime: '09:00',
      endTime: '10:00',
      sessionType: 'Theory'
    };
    handleScheduleChange(day, [...currentSlots, newSlot]);
  };

  // Remove time slot from a day
  const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    const currentSlots = scheduleData[day] || [];
    const updatedSlots = currentSlots.filter((_, i) => i !== index);
    handleScheduleChange(day, updatedSlots);
  };

  // Update time slot
  const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: keyof TimeSlot, value: string) => {
    const currentSlots = scheduleData[day] || [];
    const updatedSlots = currentSlots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    handleScheduleChange(day, updatedSlots);
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingStudent(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  // Show individual student details if studentId is provided
  if (studentId && selectedStudent) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        {onBackToUserManagement && (
          <button
            onClick={onBackToUserManagement}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>← Back to User Management</span>
          </button>
        )}

        {/* Student Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            {selectedStudent.avatar ? (
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xl">
                  {selectedStudent.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h1>
              <p className="text-gray-600">{selectedStudent.studentId} • {selectedStudent.subject}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedStudent.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedStudent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedStudent.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Level</label>
                  <p className="text-gray-900">{selectedStudent.level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-gray-900">{selectedStudent.subject}</p>
                </div>
                {selectedStudent.program && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Program</label>
                    <p className="text-gray-900">{selectedStudent.program}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Enrollment Date</label>
                  <p className="text-gray-900">{new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {selectedStudent.contactNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-gray-900">{selectedStudent.contactNumber}</p>
                  </div>
                )}
                {selectedStudent.emergencyContact && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">{selectedStudent.emergencyContact}</p>
                  </div>
                )}
                {selectedStudent.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900">{selectedStudent.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Display */}
          {selectedStudent.schedule && Object.keys(selectedStudent.schedule).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {daysOfWeek.map(day => {
                  const daySlots = selectedStudent.schedule[day];
                  if (!daySlots || daySlots.length === 0) return null;

                  return (
                    <div key={day} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">{day}</h4>
                      <div className="space-y-2">
                        {daySlots.map((slot, index) => (
                          <div key={index} className="bg-white rounded p-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                            </div>
                            {slot.sessionType && (
                              <div className="flex items-center space-x-2 mt-1">
                                <BookOpen className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{slot.sessionType}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">Success</p>
          </div>
          <p className="text-green-700 mt-1">{submitSuccess}</p>
        </div>
      )}

      {(error || submitError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error || submitError}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Management</h1>
            <p className="text-gray-600">Manage student profiles, levels, subjects, and schedules</p>
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
      </div>

      {/* Add/Edit Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button
                  onClick={handleCancelForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter student's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., STU001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="student@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level *
                      </label>
                      <select
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Computer Science, Mathematics"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <input
                        type="text"
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Full Stack Development"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1-555-0123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1-555-0124"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Management */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Schedule</h3>
                  <div className="space-y-4">
                    {daysOfWeek.map(day => (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                          <button
                            type="button"
                            onClick={() => addTimeSlot(day)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            + Add Time Slot
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(scheduleData[day] || []).map((slot, index) => (
                            <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(day, index, 'startTime', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(day, index, 'endTime', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>

                              <select
                                value={slot.sessionType || ''}
                                onChange={(e) => updateTimeSlot(day, index, 'sessionType', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Type</option>
                                {sessionTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => removeTimeSlot(day, index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                          {(!scheduleData[day] || scheduleData[day]?.length === 0) && (
                            <p className="text-gray-500 text-sm italic">No sessions scheduled for this day</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about the student..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    disabled={isSubmitting}
                    className="bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{editingStudent ? 'Update Student' : 'Add Student'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                {student.avatar ? (
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500">{student.studentId}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    student.status === 'active' ? 'bg-green-100 text-green-800' :
                    student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4" />
                  <span>{student.level} • {student.subject}</span>
                </div>
                {student.contactNumber && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{student.contactNumber}</span>
                  </div>
                )}
                {student.program && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span className="truncate">{student.program}</span>
                  </div>
                )}
              </div>

              {/* Schedule Preview */}
              {student.schedule && Object.keys(student.schedule).length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Weekly Schedule</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {daysOfWeek.map(day => {
                      const daySlots = student.schedule[day];
                      if (!daySlots || daySlots.length === 0) return null;
                      return (
                        <span key={day} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {day.slice(0, 3)} ({daySlots.length})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditStudent(student)}
                  className="flex-1 bg-amber-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteStudent(student)}
                  className="flex-1 bg-red-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first student'}
          </p>
        </div>
      )}
    </div>
  );
}