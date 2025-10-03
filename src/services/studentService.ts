import { supabase } from '../lib/supabase';
import { Student, WeeklySchedule, TimeSlot } from '../types';
import { Database } from '../lib/database.types';
import { UserService } from './userService';

type StudentRow = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];
type ScheduleRow = Database['public']['Tables']['student_schedules']['Row'];

export class StudentService {
  static async getAllStudents(): Promise<Student[]> {
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('id');

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    const { data: schedulesData, error: schedulesError } = await supabase
      .from('student_schedules')
      .select('*');

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    return studentsData.map(student => this.mapStudentFromDB(student, schedulesData));
  }

  static async getStudentById(id: string): Promise<Student | null> {
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (studentError) {
      if (studentError.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch student: ${studentError.message}`);
    }

    const { data: schedulesData, error: schedulesError } = await supabase
      .from('student_schedules')
      .select('*')
      .eq('student_id', id);

    if (schedulesError) {
      throw new Error(`Failed to fetch student schedule: ${schedulesError.message}`);
    }

    return this.mapStudentFromDB(studentData, schedulesData);
  }

  static async createStudent(student: Omit<Student, 'id'>): Promise<Student> {
    // Check for conflicts in the schedule
    if (student.schedule && Object.keys(student.schedule).length > 0) {
      await this.validateScheduleConflicts(student.schedule);
    }

    const studentInsert: StudentInsert = {
      name: student.name,
      level: student.level as any,
      subjects: [student.subject]
    };

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert(studentInsert)
      .select()
      .single();

    if (studentError) {
      throw new Error(`Failed to create student: ${studentError.message}`);
    }

    // Insert schedule data
    if (student.schedule && Object.keys(student.schedule).length > 0) {
      await this.updateStudentSchedule(studentData.id, student.schedule);
    }

    // Create audit log
    try {
      await UserService.createAuditLog(
        'students',
        studentData.id,
        'INSERT',
        null,
        {
          name: studentData.name,
          level: studentData.level,
          subjects: studentData.subjects
        }
      );
    } catch (auditError) {
      console.warn('Failed to create audit log for student creation:', auditError);
    }
    return await this.getStudentById(studentData.id) as Student;
  }

  static async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    // If schedule is being updated, validate conflicts
    if (updates.schedule) {
      await this.validateScheduleConflicts(updates.schedule, id);
    }

    const studentUpdate: StudentUpdate = {};

    if (updates.name) studentUpdate.name = updates.name;
    if (updates.level) studentUpdate.level = updates.level as any;
    if (updates.subject) studentUpdate.subjects = [updates.subject];

    const { error: studentError } = await supabase
      .from('students')
      .update(studentUpdate)
      .eq('id', id);

    if (studentError) {
      throw new Error(`Failed to update student: ${studentError.message}`);
    }

    // Update schedule if provided
    if (updates.schedule) {
      await this.updateStudentSchedule(id, updates.schedule);
    }

    return await this.getStudentById(id) as Student;
  }

  static async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }

  private static async validateScheduleConflicts(schedule: WeeklySchedule, excludeStudentId?: string): Promise<void> {
    for (const [day, slots] of Object.entries(schedule)) {
      if (!slots || slots.length === 0) continue;

      for (const slot of slots) {
        const { data: hasConflict, error } = await supabase
          .rpc('check_schedule_conflict', {
            p_student_id: excludeStudentId || '00000000-0000-0000-0000-000000000000',
            p_day_of_week: day,
            p_start_time: slot.startTime,
            p_end_time: slot.endTime,
            p_exclude_id: excludeStudentId || null
          });

        if (error) {
          throw new Error(`Failed to validate schedule: ${error.message}`);
        }

        if (hasConflict && !excludeStudentId) {
          throw new Error(`Schedule conflict detected on ${day} from ${slot.startTime} to ${slot.endTime}`);
        }
      }
    }
  }

  private static async updateStudentSchedule(studentId: string, schedule: WeeklySchedule): Promise<void> {
    // Delete existing schedule
    const { error: deleteError } = await supabase
      .from('student_schedules')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      throw new Error(`Failed to update schedule: ${deleteError.message}`);
    }

    // Insert new schedule
    const scheduleInserts = [];
    for (const [day, slots] of Object.entries(schedule)) {
      if (!slots || slots.length === 0) continue;

      for (const slot of slots) {
        scheduleInserts.push({
          student_id: studentId,
          day_of_week: day as any,
          start_time: slot.startTime,
          end_time: slot.endTime,
          session_type: slot.sessionType || null
        });
      }
    }

    if (scheduleInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('student_schedules')
        .insert(scheduleInserts);

      if (insertError) {
        throw new Error(`Failed to insert schedule: ${insertError.message}`);
      }
    }
  }

  private static mapStudentFromDB(student: StudentRow, schedules: ScheduleRow[]): Student {
    const studentSchedules = schedules.filter(s => s.student_id === student.id);
    const schedule: WeeklySchedule = {};

    studentSchedules.forEach(s => {
      if (!schedule[s.day_of_week as keyof WeeklySchedule]) {
        schedule[s.day_of_week as keyof WeeklySchedule] = [];
      }
      schedule[s.day_of_week as keyof WeeklySchedule]!.push({
        startTime: s.start_time,
        endTime: s.end_time,
        sessionType: s.session_type || undefined
      });
    });

    return {
      id: student.id,
      name: student.name,
      studentId: student.id,
      email: '',
      level: student.level,
      subject: student.subjects?.[0] || '',
      schedule,
      enrollmentDate: student.created_at || new Date().toISOString(),
      status: 'active'
    };
  }
}