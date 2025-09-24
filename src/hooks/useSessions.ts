import { useState, useEffect } from 'react';
import { Session } from '../types';
import { SessionService } from '../services/sessionService';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SessionService.getAllSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const addSession = async (session: Omit<Session, 'id'>) => {
    try {
      setError(null);
      const newSession = await SessionService.createSession(session);
      setSessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateSession = async (id: string, updates: Partial<Session>) => {
    try {
      setError(null);
      const updatedSession = await SessionService.updateSession(id, updates);
      setSessions(prev => prev.map(session => 
        session.id === id ? updatedSession : session
      ));
      return updatedSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      setError(null);
      await SessionService.deleteSession(id);
      setSessions(prev => prev.filter(session => session.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions
  };
}