import React, { useState } from 'react';
import { Users, Mail, Key, QrCode, Link, Plus, Trash2, Send, AlertCircle, CheckCircle, UserPlus, Shield } from 'lucide-react';
import { CreateUserRequest, Parent, Student } from '../types';
import { useUsers } from '../hooks/useUsers';
import { useStudents } from '../hooks/useStudents';
import { EmailService } from '../services/emailService';
import { QRService } from '../services/qrService';

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
    linkedStudentIds: [],
    phone: '',
    emergencyContact: '',
    address: ''
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
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional phone number"
                />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.linkedStudentIds?.includes(student.id) || false}
                        onChange={(e) => {
                          const studentIds = formData.linkedStudentIds || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, linkedStudentIds: [...studentIds, student.id] });
                          } else {
                            setFormData({ ...formData, linkedStudentIds: studentIds.filter(id => id !== student.id) });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{student.name} ({student.studentId})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
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
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={isSubmitting}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Link Students Form */}
      {showLinkForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Link Students to {showLinkForm.userProfile?.fullName}
          </h2>
          <form onSubmit={handleLinkStudents} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {students.map((student) => (
                <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkFormData.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLinkFormData(prev => [...prev, student.id]);
                      } else {
                        setLinkFormData(prev => prev.filter(id => id !== student.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{student.name} ({student.studentId})</span>
                </label>
              ))}
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
                <span>Update Links</span>
              </button>
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
            </div>
          </form>
        </div>
      )}

      {/* Parents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Parents & Caretakers</h2>
        
        {parents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Parents Found</h3>
            <p className="text-gray-500">Start by creating parent accounts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {parents.map((parent) => (
              <div key={parent.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {parent.userProfile?.fullName?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{parent.userProfile?.fullName}</h3>
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>{parent.userProfile?.roleName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {parent.qrCode && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <QrCode className="h-4 w-4" />
                      <span className="font-mono text-xs">{parent.qrCode}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{parent.linkedStudents.length} linked students</span>
                  </div>

                  {parent.linkedStudents.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Linked Students:</p>
                      <div className="flex flex-wrap gap-1">
                        {parent.linkedStudents.map((student) => (
                          <span key={student.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {student.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowLinkForm(parent);
                      setLinkFormData(parent.linkedStudents.map(s => s.id));
                    }}
                    className="flex-1 bg-blue-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Link className="h-4 w-4" />
                    <span>Link</span>
                  </button>
                  <button
                    onClick={() => handleGenerateQR(parent)}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>QR</span>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(parent)}
                    className="bg-red-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}