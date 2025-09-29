import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current values:', { 
    url: supabaseUrl ? 'Set' : 'Missing', 
    key: supabaseAnonKey ? 'Set' : 'Missing' 
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the development server.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type { Database } from './database.types';