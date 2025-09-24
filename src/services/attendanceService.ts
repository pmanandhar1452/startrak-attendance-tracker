import { supabase } from '../lib/supabase';
import { AttendanceRecord } from '../types';
import { Database } from '../lib/database.types';

type AttendanceRow = Database['public']['Tables']['attendance_records']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendance_records']['Insert'];
type AttendanceUpdate = Database['public']['Tables']['attendance_records']['Update'];

export class AttendanceService {
  static async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch attendance records: ${error.message}`);
    }

    return data.map(this.mapAttendanceFromDB);
  }

  static async getAttendanceBySession(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch attendance records: ${error.message}`);
    }

    return data.map(this.mapAttendanceFromDB);
  }

  static async createAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    const attendanceInsert: AttendanceInsert = {
      student_id: record.studentId,
      session_id: record.sessionId,
      check_in_time: record.checkInTime?.toISOString() || null,
      learning_start_time: record.learningStartTime?.toISOString() || null,
      check_out_time: record.checkOutTime?.toISOString() || null,
      status: record.status,
      notes: record.notes || null
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create attendance record: ${error.message}`);
    }

    return this.mapAttendanceFromDB(data);
  }

  static async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const attendanceUpdate: AttendanceUpdate = {};
    
    if (updates.checkInTime !== undefined) {
      attendanceUpdate.check_in_time = updates.checkInTime?.toISOString() || null;
    }
    if (updates.learningStartTime !== undefined) {
      attendanceUpdate.learning_start_time = updates.learningStartTime?.toISOString() || null;
    }
    if (updates.checkOutTime !== undefined) {
      attendanceUpdate.check_out_time = updates.checkOutTime?.toISOString() || null;
    }
    if (updates.status) attendanceUpdate.status = updates.status;
    if (updates.notes !== undefined) attendanceUpdate.notes = updates.notes || null;

    const { data, error } = await supabase
      .from('attendance_records')
      .update(attendanceUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update attendance record: ${error.message}`);
    }

    return this.mapAttendanceFromDB(data);
  }

  static async deleteAttendanceRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete attendance record: ${error.message}`);
    }
  }

  static async createAttendanceRecordsForSession(sessionId: string, studentIds: string[]): Promise<AttendanceRecord[]> {
    const records = studentIds.map(studentId => ({
      student_id: studentId,
      session_id: sessionId,
      status: 'absent' as const
    }));

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(records)
      .select();

    if (error) {
      throw new Error(`Failed to create attendance records: ${error.message}`);
    }

    return data.map(this.mapAttendanceFromDB);
  }

  private static mapAttendanceFromDB(record: AttendanceRow): AttendanceRecord {
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