import { supabase } from '../lib/supabase';
import { GeneratedID, IDStatistics, Student } from '../types';
import { Database } from '../lib/database.types';

type GeneratedIDRow = Database['public']['Tables']['generated_ids']['Row'];
type GeneratedIDInsert = Database['public']['Tables']['generated_ids']['Insert'];
type GeneratedIDUpdate = Database['public']['Tables']['generated_ids']['Update'];

export class IDManagementService {
  // Get all generated IDs with student information
  static async getAllGeneratedIDs(
    limit = 1000,
    offset = 0,
    searchTerm = '',
    typeFilter = '',
    statusFilter = ''
  ): Promise<{ data: GeneratedID[]; count: number }> {
    let query = supabase
      .from('generated_ids')
      .select(`
        *,
        students (
          name,
          student_id,
          email,
          subject,
          level
        )
      `, { count: 'exact' })
      .order('generated_at', { ascending: false });

    // Apply filters
    if (searchTerm) {
      query = query.or(`
        id_value.ilike.%${searchTerm}%,
        students.name.ilike.%${searchTerm}%,
        students.student_id.ilike.%${searchTerm}%
      `);
    }

    if (typeFilter) {
      query = query.eq('id_type', typeFilter);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch generated IDs: ${error.message}`);
    }

    const mappedData = (data || []).map(this.mapGeneratedIDFromDB);
    return { data: mappedData, count: count || 0 };
  }

  // Get ID statistics
  static async getIDStatistics(): Promise<IDStatistics> {
    const { data, error } = await supabase
      .from('generated_ids')
      .select(`
        id_type,
        status
      `);

    if (error) {
      throw new Error(`Failed to fetch ID statistics: ${error.message}`);
    }

    const totalIds = data.length;
    const activeIds = data.filter(item => item.status === 'active').length;
    const expiredIds = data.filter(item => item.status === 'expired').length;
    const typeBreakdown = data.reduce((acc: Record<string, number>, item: any) => {
      acc[item.id_type] = (acc[item.id_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalIds,
      activeIds,
      expiredIds,
      typeBreakdown
    };
  }

  // Create a new generated ID record
  static async createGeneratedID(
    studentId: string,
    idType: GeneratedID['idType'],
    idValue: string,
    metadata: GeneratedID['metadata'] = {},
    expiresAt?: string
  ): Promise<GeneratedID> {
    // First, deactivate any existing active IDs of the same type for this student
    await this.deactivateExistingIDs(studentId, idType);

    const insertData: GeneratedIDInsert = {
      student_id: studentId,
      id_type: idType,
      id_value: idValue,
      metadata,
      status: 'active',
      generated_by: (await supabase.auth.getUser()).data.user?.id,
      expires_at: expiresAt || null
    };

    const { data, error } = await supabase
      .from('generated_ids')
      .insert(insertData)
      .select(`
        *,
        students (
          name,
          student_id,
          email,
          subject,
          level
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create generated ID: ${error.message}`);
    }

    return this.mapGeneratedIDFromDB(data);
  }

  // Update generated ID status
  static async updateGeneratedID(
    id: string,
    updates: Partial<Pick<GeneratedID, 'status' | 'metadata' | 'expiresAt' | 'lastUsedAt'>>
  ): Promise<GeneratedID> {
    const updateData: GeneratedIDUpdate = {};

    if (updates.status) updateData.status = updates.status;
    if (updates.metadata) updateData.metadata = updates.metadata;
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt || null;
    if (updates.lastUsedAt !== undefined) updateData.last_used_at = updates.lastUsedAt || null;

    const { data, error } = await supabase
      .from('generated_ids')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        students (
          name,
          student_id,
          email,
          subject,
          level
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update generated ID: ${error.message}`);
    }

    return this.mapGeneratedIDFromDB(data);
  }

  // Delete generated ID
  static async deleteGeneratedID(id: string): Promise<void> {
    const { error } = await supabase
      .from('generated_ids')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete generated ID: ${error.message}`);
    }
  }

  // Cleanup expired IDs
  static async cleanupExpiredIDs(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_expired_ids');

    if (error) {
      throw new Error(`Failed to cleanup expired IDs: ${error.message}`);
    }

    return data || 0;
  }

  // Subscribe to real-time changes
  static subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('generated_ids_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_ids'
        },
        callback
      )
      .subscribe();
  }

  // Get IDs by student
  static async getIDsByStudent(studentId: string): Promise<GeneratedID[]> {
    const { data, error } = await supabase
      .from('generated_ids')
      .select(`
        *,
        students (
          name,
          student_id,
          email,
          subject,
          level
        )
      `)
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch student IDs: ${error.message}`);
    }

    return (data || []).map(this.mapGeneratedIDFromDB);
  }

  // Private helper methods
  private static async deactivateExistingIDs(studentId: string, idType: string): Promise<void> {
    const { error } = await supabase
      .from('generated_ids')
      .update({ status: 'inactive' })
      .eq('student_id', studentId)
      .eq('id_type', idType)
      .eq('status', 'active');

    if (error) {
      console.warn('Failed to deactivate existing IDs:', error.message);
    }
  }

  private static mapGeneratedIDFromDB(row: any): GeneratedID {
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: row.students?.name,
      studentIdNumber: row.students?.student_id,
      idType: row.id_type,
      idValue: row.id_value,
      metadata: row.metadata || {},
      status: row.status,
      generatedBy: row.generated_by,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}