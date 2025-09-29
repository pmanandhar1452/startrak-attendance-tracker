import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in development mode and missing credentials
const isDevelopment = import.meta.env.DEV;
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-ref.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current values:', { 
    url: supabaseUrl ? 'Set' : 'Missing', 
    key: supabaseAnonKey ? 'Set' : 'Missing' 
  });
  
  if (!isDevelopment) {
    throw new Error('Missing Supabase environment variables. Please check your .env file and restart the development server.');
  }
}

if (!hasValidCredentials && isDevelopment) {
  console.warn('⚠️  SETUP REQUIRED: Using placeholder Supabase credentials.');
  console.warn('📝 Instructions:');
  console.warn('1. 🔗 Go to https://supabase.com/dashboard');
  console.warn('2. 📁 Select your project (or create one)');
  console.warn('3. ⚙️  Go to Settings → API');
  console.warn('4. 📋 Copy your Project URL and anon/public key');
  console.warn('5. 📝 Update .env file with your real credentials');
  console.warn('6. 👤 Create your first admin user in Authentication → Users');
  console.warn('7. 🔄 Restart the dev server');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type { Database } from './database.types';