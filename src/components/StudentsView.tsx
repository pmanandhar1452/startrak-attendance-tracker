import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Eye, Edit3, Trash2, QrCode, CreditCard, ChevronUp, ChevronDown, Filter, Calendar, Mail, Phone, BookOpen, GraduationCap, MapPin, FileText, Clock, CheckCircle, XCircle, AlertCircle, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Student, IDCardTemplate, AttendanceRecord, Session } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../hooks/useStudents';
import { useIDCards } from '../hooks/useIDCards';
import AttendanceView from './AttendanceView';
import SessionsView from './SessionsView';

interface StudentsViewProps {
  studentId?: string;
  onBackToUserManagement?: () => void;
  attendanceRecords?: AttendanceRecord[];
  students?: Student[];
  sessions?: Session[];
  onUpdateAttendance?: (recordId: string, newStatus: string) => void;
  onAddSession?: (session: Omit<Session, 'id'>) => void;
  onUpdateSession?: (id: string, updates: Partial<Session>) => void;
  onDeleteSession?: (id: string) => void;
}

type SortField = 'name' | 'studentId' | 'level' | 'subject' | 'enrollmentDate' | 'status';
type SortDirection = 'asc' | 'desc';

export default function StudentsView({ 
  studentId, 
  onBackToUserManagement,
  attendanceRecords = [],
  students: propStudents = [],
  sessions = [],
  onUpdateAttendance,
  onAddSession,
  onUpdateSession,
  onDeleteSession
}: StudentsViewProps) {
  const { user } = useAuth();
  const { students: hookStudents, loading, error, addStudent, updateStudent, deleteStudent, fetchStudentById } = useStudents();
  const { qrCodes, generateQRCode, generateIDCard, batchGenerateIDCards, deleteQRCode } = useIDCards();
  // Handle add student form submission
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddStudentErrors({});
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Validate required fields
      const errors: Record<string, string> = {};
      if (!addStudentData.name.trim()) errors.name = 'Name is required';
      if (!addStudentData.studentId.trim()) errors.studentId = 'Student ID is required';
      if (!addStudentData.email.trim()) errors.email = 'Email is required';
      if (!addStudentData.subject.trim()) errors.subject = 'Subject is required';

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (addStudentData.email && !emailRegex.test(addStudentData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (Object.keys(errors).length > 0) {
        setAddStudentErrors(errors);
        return;
      }

      // Create student object
      const newStudent: Omit<Student, 'id'> = {
        name: addStudentData.name.trim(),
        studentId: addStudentData.studentId.trim(),
        email: addStudentData.email.trim(),
        level: addStudentData.level,
        subject: addStudentData.subject.trim(),
        program: addStudentData.program.trim() || undefined,
        contactNumber: addStudentData.contactNumber.trim() || undefined,
        emergencyContact: addStudentData.emergencyContact.trim() || undefined,
        notes: addStudentData.notes.trim() || undefined,
        schedule: addStudentData.schedule,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      await addStudent(newStudent);
      setSuccessMessage(`Student ${addStudentData.name} created successfully!`);
      
      // Reset form
      setAddStudentData({
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
      setShowAddStudentModal(false);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  // Use prop students if provided, otherwise use hook students
  const students = propStudents.length > 0 ? propStudents : hookStudents;
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'list' | 'id-management' | 'attendance' | 'sessions'>('list');
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  
  // Add Student Form Data
  const [addFormData, setAddFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    subject: '',
    program: '',
    contactNumber: '',
    emergencyContact: '',
    notes: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // ID Management state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [generatedCards, setGeneratedCards] = useState<IDCardTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentData, setAddStudentData] = useState({
    name: '',
    studentId: '',
    email: '',
    level: 'Beginner' as const,
    subject: '',
    program: '',
    contactNumber: '',
    emergencyContact: '',
    notes: '',
    schedule: {} as WeeklySchedule
  });
  const [addStudentErrors, setAddStudentErrors] = useState<Record<string, string>>({});
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

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email?.includes('admin');
  const [idError, setIdError] = useState<string | null>(null);

  // Single student view
  useEffect(() => {
    if (studentId) {
      fetchStudentById(studentId).then(student => {
        if (student) {
          setSelectedStudent(student);
        }
      });
    }
  }, [studentId, fetchStudentById]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);
  // Get unique values for filters
  const uniqueLevels = [...new Set(students.map(s => s.level))];
  const uniqueSubjects = [...new Set(students.map(s => s.subject))];

  // Filter and sort students
  let filteredStudents = students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = levelFilter === '' || student.level === levelFilter;
      const matchesSubject = subjectFilter === '' || student.subject === subjectFilter;
      const matchesStatus = statusFilter === '' || student.status === statusFilter;
      
      return matchesSearch && matchesLevel && matchesSubject && matchesStatus;
    });

  // Apply additional filters
  if (statusFilter) {
    filteredStudents = filteredStudents.filter(student => student.status === statusFilter);
  }
  if (levelFilter) {
    filteredStudents = filteredStudents.filter(student => student.level === levelFilter);
  }

  // Sort students
  const filteredAndSortedStudents = [...filteredStudents].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'enrollmentDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
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

  // ID Management functions
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleGenerateSingle = async (student: Student) => {
    setIsGenerating(true);
    setIdError(null);
    setSuccessMessage(null);

    try {
      const template = await generateIDCard(student);
      setGeneratedCards(prev => [...prev.filter(c => c.studentId !== student.id), template]);
      setSuccessMessage(`ID card generated for ${student.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ID card';
      setIdError(`ID Card Generation Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedStudents.length === 0) {
      setIdError('Please select at least one student');
      return;
    }

    setIsGenerating(true);
    setIdError(null);
    setSuccessMessage(null);

    try {
      const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.id));
      const templates = await batchGenerateIDCards(selectedStudentObjects);
      
      const updatedCards = [...generatedCards];
      templates.forEach(template => {
        const existingIndex = updatedCards.findIndex(c => c.studentId === template.studentId);
        if (existingIndex >= 0) {
          updatedCards[existingIndex] = template;
        } else {
          updatedCards.push(template);
        }
      });
      setGeneratedCards(updatedCards);
      
      setSuccessMessage(`Generated ${templates.length} ID cards successfully`);
      setSelectedStudents([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ID cards';
      setIdError(`Batch Generation Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCard = (template: IDCardTemplate) => {
    if (template.cardUrl) {
      const link = document.createElement('a');
      link.href = template.cardUrl;
      link.download = `id-card-${template.studentId}.png`;
      link.click();
    }
  };

  const handlePrintCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = generatedCards.map(card => `
      <div style="page-break-after: always; text-align: center; padding: 20px;">
        <img src="${card.cardUrl}" alt="ID Card for ${card.studentName}" style="max-width: 100%; height: auto;" />
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Student ID Cards</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStudentQRCode = (studentId: string) => {
    return qrCodes.find(qr => qr.studentId === studentId);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, levelFilter]);

  // Validate form data
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!addFormData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!addFormData.studentId.trim()) {
      errors.studentId = 'Student ID is required';
    }

    if (!addFormData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(addFormData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!addFormData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const newStudent: Omit<Student, 'id'> = {
        name: addFormData.name.trim(),
        studentId: addFormData.studentId.trim(),
        email: addFormData.email.trim().toLowerCase(),
        level: addFormData.level,
        subject: addFormData.subject.trim(),
        program: addFormData.program.trim() || undefined,
        contactNumber: addFormData.contactNumber.trim() || undefined,
        emergencyContact: addFormData.emergencyContact.trim() || undefined,
        notes: addFormData.notes.trim() || undefined,
        schedule: {}, // Empty schedule initially
        enrollmentDate: new Date().toISOString().split('T')[0], // Current date
        status: 'active'
      };

      await addStudent(newStudent);
      
      // Reset form
      setAddFormData({
        name: '',
        studentId: '',
        email: '',
        level: 'Beginner',
        subject: '',
        program: '',
        contactNumber: '',
        emergencyContact: '',
        notes: ''
      });
      setFormErrors({});
      setShowAddForm(false);
      setSubmitSuccess(`Student "${newStudent.name}" added successfully!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add student';
      
      // Handle specific error cases
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        if (errorMessage.includes('email')) {
          setSubmitError('A student with this email address already exists.');
        } else if (errorMessage.includes('student_id')) {
          setSubmitError('A student with this Student ID already exists.');
        } else {
          setSubmitError('A student with this information already exists.');
        }
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setAddFormData({
      name: '',
      studentId: '',
      email: '',
      level: 'Beginner',
      subject: '',
      program: '',
      contactNumber: '',
      emergencyContact: '',
      notes: ''
    });
    setFormErrors({});
    setSubmitError(null);
  };
  // If viewing single student
  if (selectedStudent) {
    return (
      <div className="space-y-6">
        {onBackToUserManagement && (
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToUserManagement}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to User Management</span>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Profile</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedStudent.name}</p>
                <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Level:</strong> {selectedStudent.level}</p>
                <p><strong>Subject:</strong> {selectedStudent.subject}</p>
                <p><strong>Status:</strong> {selectedStudent.status}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
              <div className="space-y-2">
                <p><strong>Phone:</strong> {selectedStudent.contactNumber || 'Not provided'}</p>
                <p><strong>Emergency Contact:</strong> {selectedStudent.emergencyContact || 'Not provided'}</p>
                <p><strong>Enrollment Date:</strong> {new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">Manage student records, profiles, and ID cards</p>
        </div>
      </div>

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

      {(error || idError || submitError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error || idError || submitError}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">Success</p>
          </div>
          <p className="text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {idError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{idError}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Students List</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('id-management')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'id-management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>ID Management</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Attendance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>Sessions</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Table Controls */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Students</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Student</span>
                    </button>
                  )}
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Levels</option>
                    {uniqueLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>

                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Subjects</option>
                    {uniqueSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>
                      Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} students
                      {(searchTerm || levelFilter || subjectFilter || statusFilter) && ' (filtered)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Student</span>
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('studentId')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Student ID</span>
                            {getSortIcon('studentId')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('level')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Level</span>
                            {getSortIcon('level')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('subject')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Subject</span>
                            {getSortIcon('subject')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('enrollmentDate')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Enrolled</span>
                            {getSortIcon('enrollmentDate')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedStudents.map((student) => {
                        const scheduleCount = Object.values(student.schedule).reduce((acc, slots) => acc + (slots?.length || 0), 0);
                        const hasQRCode = getStudentQRCode(student.id);
                        
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {student.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono text-gray-900">{student.studentId}</span>
                                {hasQRCode && (
                                  <QrCode className="h-4 w-4 text-green-600" title="Has QR Code" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelBadgeColor(student.level)}`}>
                                {student.level}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {scheduleCount > 0 ? `${scheduleCount} sessions` : 'No schedule'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(student.enrollmentDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadgeColor(student.status)}`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSelectedStudent(student)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingStudent(student)}
                                  className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                                  title="Edit Student"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
                                      deleteStudent(student.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Delete Student"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {paginatedStudents.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                    <p className="text-gray-500">
                      {searchTerm || levelFilter || subjectFilter || statusFilter
                        ? 'Try adjusting your search and filter criteria'
                        : 'Start by adding your first student'}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <span className="px-4 py-2 text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && onUpdateAttendance && (
            <AttendanceView 
              attendanceRecords={attendanceRecords}
              students={students}
              sessions={sessions}
              onUpdateAttendance={onUpdateAttendance}
            />
          )}

          {activeTab === 'sessions' && onAddSession && onUpdateSession && onDeleteSession && (
            <SessionsView 
              sessions={sessions}
              onAddSession={onAddSession}
              onUpdateSession={onUpdateSession}
              onDeleteSession={onDeleteSession}
            />
          )}

          {activeTab === 'id-management' && (
            <div className="space-y-6">
              {/* ID Management Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Student ID Cards</h2>
                  <p className="text-gray-600">Generate ID cards with QR codes for student attendance tracking</p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    {selectedStudents.length === students.length ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                    <span>{selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}</span>
                  </button>

                  <button
                    onClick={handleBatchGenerate}
                    disabled={selectedStudents.length === 0 || isGenerating}
                    className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    <span>Generate Selected ({selectedStudents.length})</span>
                  </button>
                </div>
              </div>

              {/* Generated Cards Summary */}
              {generatedCards.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Generated ID Cards ({generatedCards.length})</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePrintCards}
                        className="bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print All</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {generatedCards.map((card) => (
                      <div key={card.studentId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="text-center mb-3">
                          {card.cardUrl ? (
                            <img
                              src={card.cardUrl}
                              alt={`ID Card for ${card.studentName}`}
                              className="w-full h-auto rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-900 mb-1">{card.studentName}</h4>
                          <p className="text-sm text-gray-500 mb-3">{card.studentIdNumber}</p>
                          
                          <button
                            onClick={() => handleDownloadCard(card)}
                            disabled={!card.cardUrl}
                            className="w-full bg-blue-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Grid for ID Generation */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Students</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {students.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    const hasQRCode = getStudentQRCode(student.id);
                    const hasGeneratedCard = generatedCards.some(c => c.studentId === student.id);

                    return (
                      <div key={student.id} className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleSelectStudent(student.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <CheckSquare className="h-3 w-3 text-white" />}
                            </button>
                            
                            <div className="flex items-center space-x-2">
                              {student.avatar ? (
                                <img
                                  src={student.avatar}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {student.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-1">
                            {hasQRCode && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="Has QR Code" />
                            )}
                            {hasGeneratedCard && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Card Generated" />
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm">{student.name}</h4>
                          <p className="text-xs text-gray-500">{student.studentId}</p>
                          <p className="text-xs text-gray-500">{student.subject}</p>
                        </div>

                        <div className="space-y-2">
                          {hasQRCode && (
                            <div className="flex items-center space-x-2 text-xs text-green-600">
                              <QrCode className="h-3 w-3" />
                              <span>QR Code Active</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleGenerateSingle(student)}
                            disabled={isGenerating}
                            className="w-full bg-amber-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? <Loader className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                            <span>Generate Card</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {students.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h4>
                    <p className="text-gray-500">Add students to generate ID cards</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
                <button
                  onClick={handleCloseAddForm}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddStudent} className="space-y-6">
                {/* Required Fields Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Required Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addFormData.name}
                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter student's full name"
                        disabled={isSubmitting}
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
                        value={addFormData.studentId}
                        onChange={(e) => setAddFormData({ ...addFormData, studentId: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.studentId ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., STU001"
                        disabled={isSubmitting}
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
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="student@example.com"
                        disabled={isSubmitting}
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
                        value={addFormData.level}
                        onChange={(e) => setAddFormData({ ...addFormData, level: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
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
                        value={addFormData.subject}
                        onChange={(e) => setAddFormData({ ...addFormData, subject: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.subject ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Computer Science, Mathematics"
                        disabled={isSubmitting}
                      />
                      {formErrors.subject && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.subject}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <input
                        type="text"
                        value={addFormData.program}
                        onChange={(e) => setAddFormData({ ...addFormData, program: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Full Stack Development"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={addFormData.contactNumber}
                        onChange={(e) => setAddFormData({ ...addFormData, contactNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1-555-0123"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={addFormData.emergencyContact}
                        onChange={(e) => setAddFormData({ ...addFormData, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1-555-0456"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={addFormData.notes}
                        onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any additional notes..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-populated Fields Info */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Automatic Settings</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Status:</strong> Will be set to "Active"</li>
                    <li>• <strong>Enrollment Date:</strong> Will be set to today's date</li>
                    <li>• <strong>Schedule:</strong> Can be configured after creation</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseAddForm}
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
                    <span>{isSubmitting ? 'Adding Student...' : 'Add Student'}</span>
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