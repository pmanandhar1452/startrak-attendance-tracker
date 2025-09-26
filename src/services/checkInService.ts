import { supabase } from '../lib/supabase';
import { AttendanceRecord } from '../types';

export interface CheckInResult {
  success: boolean;
  studentName: string;
  studentId: string;
  checkInTime: string;
  status: 'success' | 'error' | 'already-checked-in';
  message: string;
  attendanceRecord?: AttendanceRecord;
}

export class CheckInService {
  // Process QR code check-in
  static async processQRCheckIn(qrCode: string): Promise<CheckInResult> {
    try {
      // Extract student ID from QR code
      const studentId = this.extractStudentIdFromQR(qrCode);
      if (!studentId) {
        return {
          success: false,
          studentName: '',
          studentId: '',
          checkInTime: '',
          status: 'error',
          message: 'Invalid QR code format'
        };
      }

      // Get student information
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, student_id, email, status')
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        return {
          success: false,
          studentName: '',
          studentId: '',
          checkInTime: '',
          status: 'error',
          message: 'Student not found'
        };
      }

      if (studentData.status !== 'active') {
        return {
          success: false,
          studentName: studentData.name,
          studentId: studentData.student_id,
          checkInTime: '',
          status: 'error',
          message: 'Student account is not active'
        };
      }

      // Get current active session
      const { data: activeSession, error: sessionError } = await supabase
        .from('sessions')
        .select('id, name, start_time, end_time')
        .eq('status', 'active')
        .single();

      if (sessionError || !activeSession) {
        return {
          success: false,
          studentName: studentData.name,
          studentId: studentData.student_id,
          checkInTime: '',
          status: 'error',
          message: 'No active session found'
        };
      }

      // Check if student is already checked in for this session
      const { data: existingRecord, error: recordError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('session_id', activeSession.id)
        .single();

      const now = new Date();

      if (existingRecord && !recordError) {
        if (existingRecord.status !== 'absent') {
          return {
            success: false,
            studentName: studentData.name,
            studentId: studentData.student_id,
            checkInTime: existingRecord.check_in_time ? 
              new Date(existingRecord.check_in_time).toLocaleTimeString() : '',
            status: 'already-checked-in',
            message: `Already checked in at ${existingRecord.check_in_time ? 
              new Date(existingRecord.check_in_time).toLocaleTimeString() : 'unknown time'}`
          };
        }

        // Update existing absent record to checked-in
        const { data: updatedRecord, error: updateError } = await supabase
          .from('attendance_records')
          .update({
            check_in_time: now.toISOString(),
            status: 'checked-in'
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (updateError) {
          return {
            success: false,
            studentName: studentData.name,
            studentId: studentData.student_id,
            checkInTime: '',
            status: 'error',
            message: 'Failed to update attendance record'
          };
        }

        return {
          success: true,
          studentName: studentData.name,
          studentId: studentData.student_id,
          checkInTime: now.toLocaleTimeString(),
          status: 'success',
          message: 'Successfully checked in!',
          attendanceRecord: this.mapAttendanceFromDB(updatedRecord)
        };
      }

      // Create new attendance record
      const { data: newRecord, error: createError } = await supabase
        .from('attendance_records')
        .insert({
          student_id: studentId,
          session_id: activeSession.id,
          check_in_time: now.toISOString(),
          status: 'checked-in'
        })
        .select()
        .single();

      if (createError) {
        return {
          success: false,
          studentName: studentData.name,
          studentId: studentData.student_id,
          checkInTime: '',
          status: 'error',
          message: 'Failed to create attendance record'
        };
      }

      return {
        success: true,
        studentName: studentData.name,
        studentId: studentData.student_id,
        checkInTime: now.toLocaleTimeString(),
        status: 'success',
        message: 'Successfully checked in!',
        attendanceRecord: this.mapAttendanceFromDB(newRecord)
      };

    } catch (error) {
      console.error('Check-in error:', error);
      return {
        success: false,
        studentName: '',
        studentId: '',
        checkInTime: '',
        status: 'error',
        message: 'An unexpected error occurred'
      };
    }
  }

  // Validate QR code format and extract student ID
  static extractStudentIdFromQR(qrCode: string): string | null {
    // Expected format: STU_{studentId}_{timestamp}
    const match = qrCode.match(/^STU_([a-f0-9-]+)_\d+$/);
    return match ? match[1] : null;
  }

  // Subscribe to real-time attendance updates
  static subscribeToAttendanceUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('attendance_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        callback
      )
      .subscribe();
  }

  // Get current session info
  static async getCurrentSession() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'active')
      .single();

    if (error) {
      throw new Error(`Failed to get current session: ${error.message}`);
    }

    return data;
  }

  // Map database record to AttendanceRecord type
  private static mapAttendanceFromDB(record: any): AttendanceRecord {
    return {
      id: record.id,
      studentId: record.student_id,
      sessionId: record.session_id,
      checkInTime: record.check_in_time ? new Date(record.check_in_time) : undefined,
      learningStartTime: record.learning_start_time ? new Date(record.learning_start_time) : undefined,
      checkOutTime: record.check_out_time ? new Date(record.check_out_time) : undefined,
      status: record.status,
      notes: record.notes || undefined
    };
  }
}