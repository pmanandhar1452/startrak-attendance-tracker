import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // If login successful, ensure user profile exists
      if (data.user && !error) {
        await ensureUserProfile(data.user);
      }
      
      return { data, error };
    } catch (networkError) {
      console.error('Network error during sign in:', networkError);
      
      // Check if it's a connection error
      if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
        return { 
          error: { 
            message: 'Unable to connect to Supabase. Please check your .env file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.',
            name: 'ConnectionError'
          } as any
        };
      }
      
      return { 
        error: { 
          message: 'An unexpected error occurred during sign in. Please try again.',
          name: 'UnknownError'
        } as any
      };
    }
  };

  const ensureUserProfile = async (user: any) => {
    try {
      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile for:', user.email);
        
        // First, ensure admin role exists
        let adminRole;
        const { data: existingRole, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('role_name', 'admin')
          .single();

        if (roleError && roleError.code === 'PGRST116') {
          // Create admin role
          const { data: newRole, error: createRoleError } = await supabase
            .from('roles')
            .insert({ role_name: 'admin' })
            .select('id')
            .single();
          
          if (createRoleError) {
            console.error('Failed to create admin role:', createRoleError);
            return;
          }
          adminRole = newRole;
        } else if (roleError) {
          console.error('Failed to fetch admin role:', roleError);
          return;
        } else {
          adminRole = existingRole;
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User',
            role_id: adminRole.id
          });

        if (profileError) {
          console.error('Failed to create user profile:', profileError);
        } else {
          console.log('User profile created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}