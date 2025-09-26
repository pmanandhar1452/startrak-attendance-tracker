import { useState, useEffect } from 'react';
import { UserProfile, Role, Parent, CreateUserRequest, EditUserRequest } from '../types';
import { UserService } from '../services/userService';
import { QRService } from '../services/qrService';

export function useUsers() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const [parentsResult, rolesData] = await Promise.all([
        UserService.getAllParents(page, pageSize),
        UserService.getAllRoles(),
        UserService.checkAdminPermission()
      ]);
      
      setParents(parentsResult.data);
      setTotalCount(parentsResult.count);
      setRoles(rolesData);
      setIsAdmin(parentsResult.isAdmin || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  const createUser = async (request: CreateUserRequest) => {
    try {
      setError(null);
      const result = await UserService.createUserWithProfile(request);
      
      // Refresh data to show new user
      await fetchData(1, 10); // Reset to first page after creating user
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const linkParentToStudents = async (parentId: string, studentIds: string[]) => {
    try {
      setError(null);
      await UserService.linkParentToStudents(parentId, studentIds);
      
      // Refresh data to show updated links
      await fetchData(1, 10); // Reset to first page after linking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link students';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const generateQRCode = async (parentId: string): Promise<string> => {
    try {
      setError(null);
      const qrCode = await UserService.generateQRCodeForParent(parentId);
      
      // Generate QR code image and update URL
      const qrCodeUrl = await QRService.generateQRCodeImage(qrCode);
      await QRService.updateParentQRCodeUrl(parentId, qrCodeUrl);
      
      // Refresh data to show updated QR code
      await fetchData(1, 10); // Reset to first page after generating QR
      
      return qrCode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUser = async (userId: string, updates: EditUserRequest) => {
    try {
      setError(null);
      const updatedParent = await UserService.updateUserProfile(userId, updates);
      
      // Update the parent in the local state
      setParents(prev => prev.map(parent => 
        parent.userId === userId ? updatedParent : parent
      ));
      
      return updatedParent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setError(null);
      await UserService.deleteUser(userId);
      
      // Refresh data to remove deleted user
      await fetchData(1, 10); // Reset to first page after deleting
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    parents,
    roles,
    totalCount,
    loading,
    error,
    isAdmin,
    createUser,
    updateUser,
    linkParentToStudents,
    generateQRCode,
    deleteUser,
    fetchData
  };
}