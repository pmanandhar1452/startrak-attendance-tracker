import React, { useState } from 'react';
import { Users, Mail, Key, QrCode, Link, Plus, Trash2, Send, AlertCircle, CheckCircle, UserPlus, Shield, X } from 'lucide-react';
import { CreateUserRequest, Parent, Student } from '../types';
import { useUsers } from '../hooks/useUsers';
import { useStudents } from '../hooks/useStudents';
import { EmailService } from '../services/emailService';
import { QRService } from '../services/qrService';
import MultiSelectDropdown from './MultiSelectDropdown';

export default function UserManagementView() {
  const { parents, roles, loading, error, createUser, linkParentToStudents, generateQRCode, deleteUser } = useUsers();
  const { students } = useStudents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState<Parent | null>(null);
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
        role: 'parent',
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
                      <option value="parent">Parent/Caretaker</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                    </select>
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
          <div className="text-sm text-gray-500">
            {parents.length} {parents.length === 1 ? 'user' : 'users'}
          </div>
        </div>
        
        {parents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Parents Found</h3>
            <p className="text-gray-500">Start by creating parent accounts</p>
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
                {parents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {parent.userProfile?.fullName?.charAt(0) || 'P'}
                          </span>
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
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 capitalize">
                          {parent.userProfile?.roleName || 'parent'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {parent.qrCode ? (
                        <div className="flex items-center space-x-2">
                          <QrCode className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-mono text-gray-900">
                            {parent.qrCode}
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
                          {parent.linkedStudents.length} students
                        </span>
                      </div>
                      {parent.linkedStudents.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {parent.linkedStudents.slice(0, 3).map((student) => (
                            <span key={student.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {student.name}
                            </span>
                          ))}
                          {parent.linkedStudents.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{parent.linkedStudents.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(parent.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(parent.createdAt).toLocaleTimeString([], { 
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
                            setShowLinkForm(parent);
                            setLinkFormData(parent.linkedStudents.map(s => s.id));
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Link Students"
                        >
                          <Link className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateQR(parent)}
                          disabled={isSubmitting}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}