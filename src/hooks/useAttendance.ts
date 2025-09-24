import { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { AttendanceService } from '../services/attendanceService';

export function useAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AttendanceService.getAllAttendanceRecords();
      setAttendanceRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceRecord = async (id: string, newStatus: string) => {
    try {
      setError(null);
      const now = new Date();
      const updates: Partial<AttendanceRecord> = { status: newStatus as any };
      
      if (newStatus === 'checked-in') {
        updates.checkInTime = now;
      } else if (newStatus === 'learning') {
        updates.learningStartTime = now;
      } else if (newStatus === 'completed') {
        updates.checkOutTime = now;
      }

      const updatedRecord = await AttendanceService.updateAttendanceRecord(id, updates);
      setAttendanceRecords(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ));
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update attendance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createAttendanceRecordsForSession = async (sessionId: string, studentIds: string[]) => {
    try {
      setError(null);
      const newRecords = await AttendanceService.createAttendanceRecordsForSession(sessionId, studentIds);
      setAttendanceRecords(prev => [...prev, ...newRecords]);
      return newRecords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create attendance records';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  return {
    attendanceRecords,
    loading,
    error,
    updateAttendanceRecord,
    createAttendanceRecordsForSession,
    refetch: fetchAttendanceRecords
  };
}