import { useState, useEffect } from 'react';
import { StudentQRCode, IDCardTemplate, Student } from '../types';
import { IDCardService } from '../services/idCardService';

export function useIDCards() {
  const [qrCodes, setQRCodes] = useState<StudentQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await IDCardService.getAllStudentQRCodes();
      setQRCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch QR codes');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (studentId: string): Promise<StudentQRCode> => {
    try {
      setError(null);
      const qrCode = await IDCardService.generateStudentQRCode(studentId);
      setQRCodes(prev => prev.filter(qr => qr.studentId !== studentId).concat(qrCode));
      return qrCode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const generateIDCard = async (student: Student): Promise<IDCardTemplate> => {
    try {
      setError(null);
      const template = await IDCardService.generateIDCard(student);
      // Refresh QR codes to show any newly created ones
      await fetchQRCodes();
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ID card';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const batchGenerateIDCards = async (students: Student[]): Promise<IDCardTemplate[]> => {
    try {
      setError(null);
      const templates = await IDCardService.batchGenerateIDCards(students);
      // Refresh QR codes to show any newly created ones
      await fetchQRCodes();
      return templates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch generate ID cards';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteQRCode = async (qrCodeId: string): Promise<void> => {
    try {
      setError(null);
      await IDCardService.deleteStudentQRCode(qrCodeId);
      setQRCodes(prev => prev.filter(qr => qr.id !== qrCodeId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete QR code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  return {
    qrCodes,
    loading,
    error,
    generateQRCode,
    generateIDCard,
    batchGenerateIDCards,
    deleteQRCode,
    refetch: fetchQRCodes
  };
}