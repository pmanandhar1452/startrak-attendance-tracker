import React, { useState, useEffect } from 'react';
import { Users, Mail, Key, QrCode, Link, Plus, Trash2, Send, AlertCircle, CheckCircle, UserPlus, Shield, X, CreditCard as Edit, Search } from 'lucide-react';
import { CreateUserRequest, Parent, Student } from '../types';
import { useUsers } from '../hooks/useUsers';
import { useStudents } from '../hooks/useStudents';
import { EmailService } from '../services/emailService';
import { QRService } from '../services/qrService';
import MultiSelectDropdown from './MultiSelectDropdown';

interface UserManagementViewProps {
  searchTerm: string;
  currentPage: number;
  pageSize: number;
  onSearchChange: (searchTerm: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewStudentDetails: (studentId: string) => void;
}

export default function UserManagementView({
  searchTerm,
  currentPage,
  pageSize,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onViewStudentDetails
}: UserManagementViewProps) {
  const { parents, roles, totalCount, loading, error, createUser, linkParentToStudents, generateQRCode, deleteUser, fetchData } = useUsers();
  const { updateUser } = useUsers();
  const { students } = useStudents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState<Parent | null>(null);
  const [editingUser, setEditingUser] = useState<Parent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  

  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    fullName: '',
    role: roles.length > 0 ? roles[0].roleName : 'parent',
    linkedStudentIds: []
  });

  const [linkFormData, setLinkFormData] = useState<string[]>([]);

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    roleId: '',
    linkedStudentIds: [] as string[]
  });

  // Update form data when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !formData.role) {
      setFormData(prev => ({ ...prev, role: roles[0].roleName as any }));
    }
  }, [roles]);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Filter parents based on search term
  const filteredUsers = parents.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.userProfile?.fullName?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower) ||
      user.qrCode?.toLowerCase().includes(searchLower) ||
      user.userProfile?.roleName?.toLowerCase().includes(searchLower) ||
      user.linkedStudents.some(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower)
      )
    );
  });

  // Calculate pagination values
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize);
  const startRecord = pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1;
  const endRecord = pageSize === -1 ? totalCount : Math.min(currentPage * pageSize, totalCount);

  // Load data when pagination changes
  useEffect(() => {
    fetchData(currentPage, pageSize === -1 ? 0 : pageSize);
  }, [currentPage, pageSize]);

  // Initial load
  useEffect(() => {
    fetchData(1, 10);
  }, []);

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange(newPageSize);
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Generate random password if not provided
      const password = formData.password || Math.random().toString(36).slice(-8);
      const requestData = { ...formData, password };

      const result = await createUser(requestData);

      // Generate QR code for parents
      let qrCodeUrl: string | undefined;
      if (result.parent) {
        try {
          qrCodeUrl = await QRService.generateQRCodeImage(result.parent.qrCode || '');
        } catch (qrError) {
          console.warn('Failed to generate QR code image:', qrError);
        }
      }

      // Send credentials via email
      try {
        await EmailService.sendCredentials(
          requestData.email,
          password,
          requestData.fullName,
          qrCodeUrl
        );
        setSuccessMessage(`User created successfully! Credentials sent to ${requestData.email}`);
      } catch (emailError) {
        setSuccessMessage(`User created successfully! (Note: Email sending is simulated in demo mode)`);
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: roles.length > 0 ? roles[0].roleName as any : 'parent',
        linkedStudentIds: []
      });
      setShowCreateForm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLinkForm) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await linkParentToStudents(showLinkForm.id, linkFormData);
      setSuccessMessage(`Successfully linked ${linkFormData.length} students to ${showLinkForm.userProfile?.fullName}`);
      setShowLinkForm(null);
      setLinkFormData([]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to link students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQR = async (parent: Parent) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const qrCode = await generateQRCode(parent.id);
      const qrCodeUrl = await QRService.generateQRCodeImage(qrCode);
      
      // Send QR code via email
      try {
        await EmailService.sendCredentials(
          'demo@example.com',
          'demo-password',
          parent.userProfile?.fullName || 'Parent',
          qrCodeUrl
        );
      } catch (emailError) {
        console.log('Email sending simulated in demo mode');
      }
      
      setSuccessMessage(`New QR code generated and sent to ${parent.userProfile?.fullName}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (parent: Parent) => {
    if (!parent.userId) return;
    
    if (!confirm(`Are you sure you want to delete ${parent.userProfile?.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(parent.userId);
      setSuccessMessage(`User ${parent.userProfile?.fullName} deleted successfully`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user management...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Create accounts, assign roles, and manage parent-student relationships</p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave empty to auto-generate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">If empty, a random password will be generated</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.roleName}>
                          {role.roleName.charAt(0).toUpperCase() + role.roleName.slice(1)}
                        </option>
                      ))}
                    </select>
                    {roles.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Loading roles...</p>
                    )}
                  </div>
                </div>

                {formData.role === 'parent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link to Students</label>
                    <MultiSelectDropdown
                      options={students.map(student => ({
                        id: student.id,
                        label: student.name,
                        sublabel: `${student.studentId} • ${student.subject}`
                      }))}
                      selectedValues={formData.linkedStudentIds || []}
                      onChange={(selectedIds) => setFormData({ ...formData, linkedStudentIds: selectedIds })}
                      placeholder="Select students to link..."
                      searchPlaceholder="Search students..."
                      className="w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
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
                    <span>Create User & Send Credentials</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Link Students Form */}
      {/* Link Students Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Link Students to {showLinkForm.userProfile?.fullName}
                </h2>
                <button
                  onClick={() => {
                    setShowLinkForm(null);
                    setLinkFormData([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleLinkStudents} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Students to Link</label>
                  <MultiSelectDropdown
                    options={students.map(student => ({
                      id: student.id,
                      label: student.name,
                      sublabel: `${student.studentId} • ${student.subject}`
                    }))}
                    selectedValues={linkFormData}
                    onChange={setLinkFormData}
                    placeholder="Select students to link..."
                    searchPlaceholder="Search students..."
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkForm(null);
                      setLinkFormData([]);
                    }}
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
                    <span>Update Links</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Parents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">List of Users</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Show:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
        </div>
        
        {filteredParents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No Users Found' : 'No Parents Found'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by creating parent accounts'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.userProfile?.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.userProfile?.fullName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 capitalize">
                          {user.userProfile?.roleName || 'user'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.qrCode ? (
                        <div className="flex items-center space-x-2">
                          <QrCode className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-mono text-gray-900">
                            {user.qrCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No QR code</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {user.linkedStudents.length} students
                        </span>
                      </div>
                      {user.linkedStudents.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.linkedStudents.slice(0, 3).map((student) => (
                            <button
                              key={student.id}
                              onClick={() => onViewStudentDetails(student.id)}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                              title={`View ${student.name}'s profile`}
                            >
                              {student.name}
                            </button>
                          ))}
                          {user.linkedStudents.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{user.linkedStudents.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditFormData({
                              fullName: user.userProfile?.fullName || '',
                              roleId: user.userProfile?.roleId || '',
                              linkedStudentIds: user.linkedStudents.map(s => s.id)
                            });
                          }}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {/* Only show parent-specific actions for parent role */}
                        {user.userProfile?.roleName === 'parent' && (
                          <>
                            <button
                              onClick={() => {
                                setShowLinkForm(user);
                                setLinkFormData(user.linkedStudents.map(s => s.id));
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Link Students"
                            >
                              <Link className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateQR(user)}
                              disabled={isSubmitting}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                              title="Generate QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete User"
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
        )}
        
        {/* User Count Display */}
        <div className="mt-4 flex justify-end">
          <div className="text-sm text-gray-500">
            {filteredUsers.length} of {totalCount} {totalCount === 1 ? 'user' : 'users'}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>
        
        {/* Pagination Controls */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-700">
              Showing {startRecord} to {endRecord} of {totalCount} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {/* Show page numbers */}
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
                      onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}