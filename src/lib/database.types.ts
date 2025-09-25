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
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role_id: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          role_name: string
          created_at: string
        }
        Insert: {
          id?: string
          role_name: string
          created_at?: string
        }
        Update: {
          id?: string
          role_name?: string
          created_at?: string
        }
      }
      parents: {
        Row: {
          id: string
          user_id: string | null
          qr_code: string | null
          qr_code_url: string | null
          emergency_contact: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          qr_code?: string | null
          qr_code_url?: string | null
          emergency_contact?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          qr_code?: string | null
          qr_code_url?: string | null
          emergency_contact?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_parent_link: {
        Row: {
          id: string
          student_id: string | null
          parent_id: string | null
          relationship_type: string | null
          is_primary: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          parent_id?: string | null
          relationship_type?: string | null
          is_primary?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          parent_id?: string | null
          relationship_type?: string | null
          is_primary?: boolean | null
          created_at?: string
        }
      }
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      student_qr_codes: {
        Row: {
          id: string
          student_id: string
          qr_code: string
          qr_code_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          qr_code: string
          qr_code_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          qr_code?: string
          qr_code_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
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