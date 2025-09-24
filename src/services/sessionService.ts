import { supabase } from '../lib/supabase';
import { Session } from '../types';
import { Database } from '../lib/database.types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export class SessionService {
  static async getAllSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    return data.map(this.mapSessionFromDB);
  }

  static async getSessionById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return this.mapSessionFromDB(data);
  }

  static async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const sessionInsert: SessionInsert = {
      name: session.name,
      instructor: session.instructor,
      start_time: session.startTime,
      end_time: session.endTime,
      capacity: session.capacity,
      enrolled: session.enrolled,
      status: session.status,
      description: session.description || null
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return this.mapSessionFromDB(data);
  }

  static async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const sessionUpdate: SessionUpdate = {};
    
    if (updates.name) sessionUpdate.name = updates.name;
    if (updates.instructor) sessionUpdate.instructor = updates.instructor;
    if (updates.startTime) sessionUpdate.start_time = updates.startTime;
    if (updates.endTime) sessionUpdate.end_time = updates.endTime;
    if (updates.capacity !== undefined) sessionUpdate.capacity = updates.capacity;
    if (updates.enrolled !== undefined) sessionUpdate.enrolled = updates.enrolled;
    if (updates.status) sessionUpdate.status = updates.status;
    if (updates.description !== undefined) sessionUpdate.description = updates.description || null;

    const { data, error } = await supabase
      .from('sessions')
      .update(sessionUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return this.mapSessionFromDB(data);
  }

  static async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  private static mapSessionFromDB(session: SessionRow): Session {
    return {
      id: session.id,
      name: session.name,
      instructor: session.instructor,
      startTime: session.start_time,
      endTime: session.end_time,
      capacity: session.capacity,
      enrolled: session.enrolled,
      status: session.status,
      description: session.description || undefined
    };
  }
}