import React, { useState, useEffect } from 'react';
import { Users, Mail, Key, QrCode, Link, Plus, Trash2, Send, AlertCircle, CheckCircle, UserPlus, Shield, X, CreditCard as Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreateUserRequest, Parent, Student } from '../types';
import { useUsers } from '../hooks/useUsers';
import { useStudents } from '../hooks/useStudents';

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
  const { 
    parents, roles, totalCount, loading, error, isAdmin,
    createUser, linkParentToStudents, generateQRCode, deleteUser, fetchData, updateUser 
  } = useUsers();

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
    role: 'parent',
    linkedStudentIds: []
  });

  const [linkFormData, setLinkFormData] = useState<string[]>([]);

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    roleId: '',
    linkedStudentIds: [] as string[]
  });

  // Filter and paginate users
  const filteredParents = parents.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return user.userProfile?.fullName?.toLowerCase().includes(searchLower) ||
           user.id.toLowerCase().includes(searchLower) ||
           user.qrCode?.toLowerCase().includes(searchLower) ||
           user.userProfile?.roleName?.toLowerCase().includes(searchLower) ||
           user.linkedStudents.some(student => 
             student.name.toLowerCase().includes(searchLower) ||
             student.studentId.toLowerCase().includes(searchLower)
           );
  });

  const totalPages = Math.ceil(filteredParents.length / pageSize);
  const paginatedUsers = filteredParents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage || submitError) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setSubmitError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, submitError]);

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    if (!formData.email.trim() || !formData.fullName.trim()) {
      setSubmitError('Email and Full Name are required'); 
      setIsSubmitting(false); 
      return;
    }

    if (!formData.role) {
      setSubmitError('Please select a role');
      setIsSubmitting(false);
      return;
    }

    try {
      const password = formData.password || Math.random().toString(36).slice(-8);
      const requestData = { ...formData, password, email: formData.email.trim(), fullName: formData.fullName.trim() };
      await createUser(requestData);
      setSuccessMessage(`User ${requestData.fullName} created successfully`);
      setFormData({ email: '', password: '', fullName: '', role: 'parent', linkedStudentIds: [] });
      setShowCreateForm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create user');
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Edit User
  const openEditModal = (user: Parent) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.userProfile?.fullName || '',
      roleId: user.userProfile?.roleId || '',
      linkedStudentIds: user.linkedStudents.map(s => s.id)
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.userId) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await updateUser(editingUser.userId, editFormData);
      setSuccessMessage(`User ${editFormData.fullName} updated successfully`);
      setEditingUser(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update user');
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // Link Students
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

  // Generate QR Code
  const handleGenerateQR = async (parent: Parent) => {
    try {
      await generateQRCode(parent.id);
      setSuccessMessage(`QR code generated for ${parent.userProfile?.fullName}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  };

  // Delete User
  const handleDeleteUser = async (parent: Parent) => {
    if (!parent.userId) return;
    if (!confirm(`Are you sure you want to delete ${parent.userProfile?.fullName}?`)) return;

    try {
      await deleteUser(parent.userId);
      setSuccessMessage(`User ${parent.userProfile?.fullName} deleted successfully`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'instructor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && parents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>User Management</span>
            </h1>
            <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
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

            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {parent.userProfile?.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {parent.userProfile?.fullName || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {parent.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(parent.userProfile?.roleName)}`}>
                      {parent.userProfile?.roleName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parent.qrCode ? (
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-mono text-gray-600">{parent.qrCode}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No QR Code</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {parent.linkedStudents.length > 0 ? (
                        parent.linkedStudents.map((student) => (
                          <span
                            key={student.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 cursor-pointer hover:bg-teal-200"
                            onClick={() => onViewStudentDetails(student.id)}
                          >
                            {student.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No linked students</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(parent)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowLinkForm(parent);
                          setLinkFormData(parent.linkedStudents.map(s => s.id));
                        }}
                        className="text-teal-600 hover:text-teal-900 p-1 rounded hover:bg-teal-50"
                        title="Link Students"
                      >
                        <Link className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateQR(parent)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Generate QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(parent)}
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

        {paginatedUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first user'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredParents.length)} of {filteredParents.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-4 py-2 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <span>Create New User</span>
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave blank for auto-generated password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.roleName}>
                      {role.roleName.charAt(0).toUpperCase() + role.roleName.slice(1)}
                    </option>
                  ))}
                </select>
                {roles.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Using default roles (admin, parent, instructor)
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{isSubmitting ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  <span>Edit User</span>
                </h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  value={editFormData.roleId}
                  onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.roleName.charAt(0).toUpperCase() + role.roleName.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Students Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Link className="h-5 w-5 text-blue-600" />
                  <span>Link Students</span>
                </h2>
                <button
                  onClick={() => setShowLinkForm(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleLinkStudents} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students for {showLinkForm.userProfile?.fullName}
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={linkFormData.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLinkFormData([...linkFormData, student.id]);
                          } else {
                            setLinkFormData(linkFormData.filter(id => id !== student.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.studentId} - {student.subject}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLinkForm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{isSubmitting ? 'Linking...' : 'Link Students'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}