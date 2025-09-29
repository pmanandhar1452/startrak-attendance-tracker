import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Search, Plus, CreditCard as Edit3, Trash2, Calendar, Phone, AlertCircle, Clock, GraduationCap, QrCode, Users, ChevronUp, ChevronDown, Eye, CreditCard, Download, Printer, CheckSquare, Square, Loader } from 'lucide-react';
import { Student, WeeklySchedule, TimeSlot } from '../types';
import { useStudents } from '../hooks/useStudents';
import { useIDCards } from '../hooks/useIDCards';

interface StudentsViewProps {
  studentId?: string;
  onBackToUserManagement?: () => void;
}

type SortField = 'name' | 'studentId' | 'email' | 'level' | 'subject' | 'enrollmentDate' | 'status';
type SortDirection = 'asc' | 'desc';

export default function StudentsView({ studentId, onBackToUserManagement }: StudentsViewProps) {
  const { students, loading, error, addStudent, updateStudent, deleteStudent, fetchStudentById } = useStudents();
  const { qrCodes, generateIDCard, batchGenerateIDCards, generateQRCode, deleteQRCode } = useIDCards();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'id-management'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // ID Management state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [idManagementError, setIdManagementError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load specific student if studentId is provided
  useEffect(() => {
    if (studentId) {
      const loadStudent = async () => {
        try {
          const student = await fetchStudentById(studentId);
          if (student) {
            setViewingStudent(student);
          }
        } catch (err) {
          console.error('Failed to load student:', err);
        }
      };
      loadStudent();
    }
  }, [studentId, fetchStudentById]);

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

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = !filterLevel || student.level === filterLevel;
      const matchesSubject = !filterSubject || student.subject === filterSubject;
      const matchesStatus = !filterStatus || student.status === filterStatus;
      
      return matchesSearch && matchesLevel && matchesSubject && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === 'enrollmentDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, startIndex + pageSize);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const submitAction = async () => {
      try {
        if (editingStudent) {
          await updateStudent(editingStudent.id, formData);
          setEditingStudent(null);
        } else {
          await addStudent(formData);
        }
        resetForm();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to save student');
      } finally {
        setIsSubmitting(false);
      }
    };

    submitAction();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteStudent(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student');
    }
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
    setIdManagementError(null);
    setSuccessMessage(null);

    try {
      const template = await generateIDCard(student);
      setGeneratedCards(prev => [...prev.filter(c => c.studentId !== student.id), template]);
      setSuccessMessage(`ID card generated for ${student.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ID card';
      setIdManagementError(`ID Card Generation Error: ${errorMessage}`);
      console.error('ID card generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedStudents.length === 0) {
      setIdManagementError('Please select at least one student');
      return;
    }

    setIsGenerating(true);
    setIdManagementError(null);
    setSuccessMessage(null);

    try {
      const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.id));
      const templates = await batchGenerateIDCards(selectedStudentObjects);
      
      // Update generated cards
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
      setIdManagementError(`Batch Generation Error: ${errorMessage}`);
      console.error('Batch generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCard = (template: any) => {
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
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

  if (viewingStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
            <div className="flex space-x-2">
              {onBackToUserManagement && (
                <button
                  onClick={onBackToUserManagement}
                  className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to User Management
                </button>
              )}
              <button
                onClick={() => setViewingStudent(null)}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {onBackToUserManagement ? 'Back to Students List' : 'Back to List'}
              </button>
            </div>
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
      {/* Error Display */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">Success</p>
          </div>
          <p className="text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {(idManagementError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{idManagementError || error}</p>
        </div>
      )}

      {error && !idManagementError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">Manage student profiles, academic details, and schedules</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className={`mr-2 h-5 w-5 ${
                activeTab === 'list' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              <span>Students List</span>
            </button>
            <button
              onClick={() => setActiveTab('id-management')}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'id-management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className={`mr-2 h-5 w-5 ${
                activeTab === 'id-management' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              <span>ID Management</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submit Error Display */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 font-medium">Validation Error</p>
                </div>
                <p className="text-red-700 mt-1">{submitError}</p>
              </div>
            )}

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
                disabled={isSubmitting}
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{editingStudent ? 'Update Student' : 'Add Student'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Controls */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Students List</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-fit"
            >
              <Plus className="h-4 w-4" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} students
            {(searchTerm || filterLevel || filterSubject || filterStatus) && (
              <span className="ml-2 text-blue-600">
                (filtered from {students.length} total)
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
        </div>

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
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('studentId')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Student ID</span>
                    <SortIcon field="studentId" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('level')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Level</span>
                    <SortIcon field="level" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('subject')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Subject</span>
                    <SortIcon field="subject" />
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
                    <SortIcon field="enrollmentDate" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
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
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {student.studentId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(student.level)}`}>
                      {student.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.subject}</div>
                    {student.program && (
                      <div className="text-sm text-gray-500">{student.program}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatSchedule(student.schedule)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(student.enrollmentDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(student.status)}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setViewingStudent(student)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => startEdit(student)}
                        className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                        title="Edit Student"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedStudents.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterLevel || filterSubject || filterStatus ? 'Try adjusting your search and filter criteria' : 'Start by adding your first student'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} results
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* ID Management Tab */}
      {activeTab === 'id-management' && (
        <div className="space-y-6">
          {/* ID Management Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Student ID Cards</h2>
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
          </div>

          {/* Generated Cards Summary */}
          {generatedCards.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                      <p className="text-sm text-gray-500 mb-3">{card.studentId}</p>
                      
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

          {/* Students Grid for ID Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
  );
}