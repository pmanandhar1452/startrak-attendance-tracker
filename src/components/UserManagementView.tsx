import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Mail, Key, QrCode, Link, Plus, Trash2, Send, AlertCircle, CheckCircle, UserPlus, Shield, X, CreditCard as Edit, Search 
} from 'lucide-react';
import { CreateUserRequest, Parent, Student } from '../types';
import { useUsers } from '../hooks/useUsers';
import { useStudents } from '../hooks/useStudents';
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
  const { 
    parents, roles, totalCount, loading, error, 
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
    role: roles.length > 0 ? roles[0].roleName : 'parent',
    linkedStudentIds: []
  });

  const [linkFormData, setLinkFormData] = useState<string[]>([]);

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    roleId: '',
    linkedStudentIds: [] as string[]
  });

  useEffect(() => {
    if (roles.length > 0 && !formData.role) {
      setFormData(prev => ({ ...prev, role: roles[0].roleName as any }));
    }
  }, [roles]);

  const filteredParents = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return parents.filter(user => 
      user.userProfile?.fullName?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower) ||
      user.qrCode?.toLowerCase().includes(searchLower) ||
      user.userProfile?.roleName?.toLowerCase().includes(searchLower) ||
      user.linkedStudents.some(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower)
      )
    );
  }, [parents, searchTerm]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredParents.length / pageSize);
  const paginatedUsers = pageSize === -1 
    ? filteredParents 
    : filteredParents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { fetchData(currentPage, pageSize === -1 ? 0 : pageSize); }, [currentPage, pageSize, fetchData]);
  useEffect(() => { fetchData(1, 10); }, [fetchData]);

  // --- Create User ---
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

    try {
      const password = formData.password || Math.random().toString(36).slice(-8);
      const requestData = { ...formData, password, email: formData.email.trim(), fullName: formData.fullName.trim() };
      await createUser(requestData);
      setSuccessMessage(`User ${requestData.fullName} created successfully`);
      setFormData({ email: '', password: '', fullName: '', role: roles.length > 0 ? roles[0].roleName as any : 'parent', linkedStudentIds: [] });
      setShowCreateForm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create user');
    } finally { setIsSubmitting(false); }
  };

  // --- Edit User ---
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
    if (!editingUser) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await updateUser(editingUser.id, editFormData);
      setSuccessMessage(`User ${editFormData.fullName} updated successfully`);
      setEditingUser(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update user');
    } finally { setIsSubmitting(false); }
  };

  // --- Link Students ---
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
    } finally { setIsSubmitting(false); }
  };

  // --- Delete User ---
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

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800 font-medium">{submitError}</p>
        </div>
      )}

      {/* Table */}
      <table className="w-full table-auto border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Linked Students</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map(parent => (
            <tr key={parent.id} className="hover:bg-gray-100">
              <td className="border px-4 py-2">{parent.userProfile?.fullName}</td>
              <td className="border px-4 py-2">{parent.userProfile?.roleName}</td>
              <td className="border px-4 py-2">
                {parent.linkedStudents.map(s => s.name).join(', ')}
              </td>
              <td className="border px-4 py-2 space-x-2">
                <button onClick={() => setShowLinkForm(parent)} className="text-blue-600 hover:text-blue-800">
                  <Link size={18} />
                </button>
                <button onClick={() => openEditModal(parent)} className="text-yellow-600 hover:text-yellow-800">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDeleteUser(parent)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Create User</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input type="text" placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border p-2 rounded" />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded" />
              <input type="password" placeholder="Password (optional)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border p-2 rounded" />
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border p-2 rounded">
                {roles.map(role => <option key={role.id} value={role.roleName}>{role.roleName}</option>)}
              </select>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isSubmitting}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-3">
              <input type="text" placeholder="Full Name" value={editFormData.fullName} onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} className="w-full border p-2 rounded" />
              <select value={editFormData.roleId} onChange={e => setEditFormData({...editFormData, roleId: e.target.value})} className="w-full border p-2 rounded">
                {roles.map(role => <option key={role.id} value={role.id}>{role.roleName}</option>)}
              </select>
              <MultiSelectDropdown options={students.map(s => ({ value: s.id, label: s.name }))} selected={editFormData.linkedStudentIds} onChange={ids => setEditFormData({...editFormData, linkedStudentIds: ids})} />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded" disabled={isSubmitting}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Students Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Link Students to {showLinkForm.userProfile?.fullName}</h2>
            <form onSubmit={handleLinkStudents} className="space-y-3">
              <MultiSelectDropdown options={students.map(s => ({ value: s.id, label: s.name }))} selected={linkFormData} onChange={setLinkFormData} />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowLinkForm(null)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isSubmitting}>Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
