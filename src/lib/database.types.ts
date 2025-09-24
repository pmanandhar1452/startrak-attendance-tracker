export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          name: string
          student_id: string
          email: string
          level: 'Beginner' | 'Intermediate' | 'Advanced'
          subject: string
          program: string | null
          avatar: string | null
          contact_number: string | null
          emergency_contact: string | null
          enrollment_date: string
          status: 'active' | 'inactive' | 'suspended'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          student_id: string
          email: string
          level: 'Beginner' | 'Intermediate' | 'Advanced'
          subject: string
          program?: string | null
          avatar?: string | null
          contact_number?: string | null
          emergency_contact?: string | null
          enrollment_date?: string
          status?: 'active' | 'inactive' | 'suspended'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          student_id?: string
          email?: string
          level?: 'Beginner' | 'Intermediate' | 'Advanced'
          subject?: string
          program?: string | null
          avatar?: string | null
          contact_number?: string | null
          emergency_contact?: string | null
          enrollment_date?: string
          status?: 'active' | 'inactive' | 'suspended'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_schedules: {
        Row: {
          id: string
          student_id: string
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
          start_time: string
          end_time: string
          session_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
          start_time: string
          end_time: string
          session_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
          start_time?: string
          end_time?: string
          session_type?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          name: string
          instructor: string
          start_time: string
          end_time: string
          capacity: number
          enrolled: number
          status: 'upcoming' | 'active' | 'completed'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          instructor: string
          start_time: string
          end_time: string
          capacity?: number
          enrolled?: number
          status?: 'upcoming' | 'active' | 'completed'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          instructor?: string
          start_time?: string
          end_time?: string
          capacity?: number
          enrolled?: number
          status?: 'upcoming' | 'active' | 'completed'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          student_id: string
          session_id: string
          check_in_time: string | null
          learning_start_time: string | null
          check_out_time: string | null
          status: 'absent' | 'checked-in' | 'learning' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          session_id: string
          check_in_time?: string | null
          learning_start_time?: string | null
          check_out_time?: string | null
          status?: 'absent' | 'checked-in' | 'learning' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          session_id?: string
          check_in_time?: string | null
          learning_start_time?: string | null
          check_out_time?: string | null
          status?: 'absent' | 'checked-in' | 'learning' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_schedule_conflict: {
        Args: {
          p_student_id: string
          p_day_of_week: string
          p_start_time: string
          p_end_time: string
          p_exclude_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}