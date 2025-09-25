import { useState, useEffect } from 'react';
import { UserProfile, Role, Parent, CreateUserRequest } from '../types';
import { UserService } from '../services/userService';
import { QRService } from '../services/qrService';

export function useUsers() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [parentsData, rolesData] = await Promise.all([
        UserService.getAllParents(),
        UserService.getAllRoles()
      ]);
      
      setParents(parentsData);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (request: CreateUserRequest) => {
    try {
      setError(null);
      const result = await UserService.createUserWithProfile(request);
      
      // Refresh data to show new user
      await fetchData();
      
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
      await fetchData();
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
      await fetchData();
      
      return qrCode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setError(null);
      await UserService.deleteUser(userId);
      
      // Refresh data to remove deleted user
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    parents,
    roles,
    loading,
    error,
    createUser,
    linkParentToStudents,
    generateQRCode,
    deleteUser,
    refetch: fetchData
  };
}