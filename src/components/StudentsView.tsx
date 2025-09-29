import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, CreditCard as Edit3, Trash2, Eye, Calendar, Mail, Phone, MapPin, BookOpen, GraduationCap, UserPlus, X, AlertCircle, CheckCircle, Clock, QrCode, CreditCard, Download } from 'lucide-react';
import { Student, AttendanceRecord, Session } from '../types';
import { useStudents } from '../hooks/useStudents';
import { useIDCards } from '../hooks/useIDCards';
import { useAuth } from '../contexts/AuthContext';
import AttendanceView from './AttendanceView';
import SessionsView from './SessionsView';

interface StudentsViewProps {
  studentId?: string;
  onBackToUserManagement?: () => void;
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  sessions: Session[];
  onUpdateAttendance: (recordId: string, newStatus: string) => void;
  onAddSession: (session: Omit<Session, 'id'>) => void;
  onUpdateSession: (id: string, session: Partial<Session>) => void;
  onDeleteSession: (id: string) => void;
}

export default function StudentsView({
  studentId,
  onBackToUserManagement,
  attendanceRecords,
  students,
  sessions,
  onUpdateAttendance,
  onAddSession,
  onUpdateSession,
  onDeleteSession
}: StudentsViewProps) {
  const { addStudent, updateStudent, deleteStudent, fetchStudentById } = useStudents();
  const { generateIDCard, batchGenerateIDCards } = useIDCards();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'sessions' | 'id-cards'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    level: 'Beginner' as const,
    subject: '',
    program: '',
    contactNumber: '',
    emergencyContact: '',
    status: 'active' as const,
    notes: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email?.includes('admin');

  // Load specific student if studentId is provided
  useEffect(() => {
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        setSelectedStudent(student);
        setActiveTab('overview');
      }
    }
  }, [studentId, students]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Validate form data
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.studentId.trim()) {
      errors.studentId = 'Student ID is required';
    } else if (students.some(s => s.studentId === formData.studentId && s.id !== selectedStudent?.id)) {
      errors.studentId = 'Student ID already exists';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (students.some(s => s.email === formData.email && s.id !== selectedStudent?.id)) {
      errors.email = 'Email already exists';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const studentData = {
        ...formData,
        schedule: {} // Empty schedule for now
      };

      if (selectedStudent) {
        await updateStudent(selectedStudent.id, studentData);
        setSuccessMessage('Student updated successfully!');
        setShowEditModal(false);
      } else {
        await addStudent(studentData);
        setSuccessMessage('Student added successfully!');
        setShowAddModal(false);
      }

      // Reset form
      setFormData({
        name: '',
        studentId: '',
        email: '',
        level: 'Beginner',
        subject: '',
        program: '',
        contactNumber: '',
        emergencyContact: '',
        status: 'active',
        notes: '',
        enrollmentDate: new Date().toISOString().split('T')[0]
      });
      setFormErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteStudent(student.id);
      setSuccessMessage(`Student ${student.name} deleted successfully`);
      if (selectedStudent?.id === student.id) {
        setSelectedStudent(null);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete student');
    }
  };

  // Handle ID card generation
  const handleGenerateIDCard = async (student: Student) => {
    setIsGenerating(true);
    try {
      const template = await generateIDCard(student);
      setSuccessMessage(`ID card generated for ${student.name}`);
      
      // Download the ID card
      if (template.cardUrl) {
        const link = document.createElement('a');
        link.href = template.cardUrl;
        link.download = `${student.studentId}-id-card.png`;
        link.click();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to generate ID card');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle batch ID card generation
  const handleBatchGenerateIDCards = async () => {
    setIsGenerating(true);
    try {
      const templates = await batchGenerateIDCards(filteredStudents);
      setSuccessMessage(`Generated ${templates.length} ID cards`);
      
      // Download all ID cards
      templates.forEach((template, index) => {
        if (template.cardUrl) {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = template.cardUrl!;
            link.download = `${template.studentIdNumber}-id-card.png`;
            link.click();
          }, index * 500); // Stagger downloads
        }
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to generate ID cards');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start editing a student
  const startEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      level: student.level,
      subject: student.subject,
      program: student.program || '',
      contactNumber: student.contactNumber || '',
      emergencyContact: student.emergencyContact || '',
      status: student.status,
      notes: student.notes || '',
      enrollmentDate: student.enrollmentDate
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Reset form for new student
  const startAdd = () => {
    setSelectedStudent(null);
    setFormData({
      name: '',
      studentId: '',
      email: '',
      level: 'Beginner',
      subject: '',
      program: '',
      contactNumber: '',
      emergencyContact: '',
      status: 'active',
      notes: '',
      enrollmentDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // If viewing a specific student, show detailed view
  if (studentId && selectedStudent) {
    return (
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">Success</p>
            </div>
            <p className="text-green-700 mt-1">{successMessage}</p>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Error</p>
            </div>
            <p className="text-red-700 mt-1">{submitError}</p>
          </div>
        )}

        {/* Student Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {onBackToUserManagement && (
                <button
                  onClick={onBackToUserManagement}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back to Users
                </button>
              )}
              <div className="flex items-center space-x-4">
                {selectedStudent.avatar ? (
                  <img
                    src={selectedStudent.avatar}
                    alt={selectedStudent.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedStudent.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h1>
                  <p className="text-gray-600">{selectedStudent.studentId} • {selectedStudent.subject}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedStudent.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedStudent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Level: {selectedStudent.level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleGenerateIDCard(selectedStudent)}
                disabled={isGenerating}
                className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                <span>Generate ID Card</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => startEdit(selectedStudent)}
                  className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Student Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{selectedStudent.email}</span>
                </div>
                {selectedStudent.contactNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedStudent.contactNumber}</span>
                  </div>
                )}
                {selectedStudent.emergencyContact && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-gray-900">Emergency: {selectedStudent.emergencyContact}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{selectedStudent.subject}</span>
                </div>
                {selectedStudent.program && (
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedStudent.program}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Enrolled: {new Date(selectedStudent.enrollmentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {selectedStudent.notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                <p className="text-sm text-gray-700">{selectedStudent.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'attendance', label: 'Attendance', icon: Clock },
                { id: 'sessions', label: 'Sessions', icon: BookOpen },
                { id: 'id-cards', label: 'ID Cards', icon: CreditCard }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Student Overview</h3>
                <p className="text-gray-600">Detailed student information and recent activity will be displayed here.</p>
              </div>
            )}

            {activeTab === 'attendance' && (
              <AttendanceView
                attendanceRecords={attendanceRecords.filter(r => r.studentId === selectedStudent.id)}
                students={[selectedStudent]}
                sessions={sessions}
                onUpdateAttendance={onUpdateAttendance}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionsView
                sessions={sessions}
                onAddSession={onAddSession}
                onUpdateSession={onUpdateSession}
                onDeleteSession={onDeleteSession}
              />
            )}

            {activeTab === 'id-cards' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">ID Cards</h3>
                  <button
                    onClick={() => handleGenerateIDCard(selectedStudent)}
                    disabled={isGenerating}
                    className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Generate ID Card</span>
                  </button>
                </div>
                <p className="text-gray-600">Generate and download student ID cards with QR codes for attendance tracking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main students list view
  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">Success</p>
          </div>
          <p className="text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{submitError}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Management</h1>
            <p className="text-gray-600">Manage student profiles, attendance, and academic information</p>
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

            <div className="flex space-x-2">
              <button
                onClick={handleBatchGenerateIDCards}
                disabled={isGenerating || filteredStudents.length === 0}
                className="bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Batch ID Cards</span>
              </button>

              {isAdmin && (
                <button
                  onClick={startAdd}
                  className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Student</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {student.name}
                  </h3>
                  <p className="text-xs text-gray-500">{student.studentId}</p>
                  <p className="text-xs text-gray-500">{student.subject}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Level:</span>
                  <span className="font-medium text-gray-900">{student.level}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    student.status === 'active' ? 'bg-green-100 text-green-800' :
                    student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {student.status}
                  </span>
                </div>
                {student.program && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Program:</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{student.program}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">View</span>
                </button>
                
                <button
                  onClick={() => handleGenerateIDCard(student)}
                  disabled={isGenerating}
                  className="flex-1 bg-purple-100 text-purple-700 font-medium py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  <QrCode className="h-3 w-3" />
                  <span className="text-xs">ID Card</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => startEdit(student)}
                      className="flex-1 bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span className="text-xs">Edit</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="flex-1 bg-red-100 text-red-700 font-medium py-2 px-3 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Delete</span>
                    </button>
                  </>
                )}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Required Information
                  </h3>
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter student's full name"
                      />
                      {formErrors.name && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                      )}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.studentId ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., STU001"
                      />
                      {formErrors.studentId && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.studentId}</p>
                      )}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="student@example.com"
                      />
                      {formErrors.email && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                      )}
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.subject ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Computer Science, Mathematics"
                      />
                      {formErrors.subject && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.subject}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Optional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="+1-555-0456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
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
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
                    <span>Add Student</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Required Information
                  </h3>
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter student's full name"
                      />
                      {formErrors.name && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                      )}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.studentId ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., STU001"
                      />
                      {formErrors.studentId && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.studentId}</p>
                      )}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="student@example.com"
                      />
                      {formErrors.email && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                      )}
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.subject ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Computer Science, Mathematics"
                      />
                      {formErrors.subject && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.subject}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Optional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="+1-555-0456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
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
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
                    <span>Update Student</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}