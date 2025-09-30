import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://dgnrbjyxunsuxjpvrbjh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbnJianl4dW5zdXhqcHZyYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDAwODYsImV4cCI6MjA3NDMxNjA4Nn0.4emDHcYvWqsmtbhXmZV7eCILTjD4IJZw51L7eL2OZAw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'Password123!'
  })
  if (signInError) return console.error('Login error:', signInError)
  console.log('Logged in id:', signInData?.user?.id)

  const { data: roles, error: rolesErr } = await supabase.from('roles').select('*')
  console.log('roles:', rolesErr || roles)

  const { data: students, error: studentsErr } = await supabase.from('students').select('*')
  console.log('students:', studentsErr || students)
}

main().catch(console.error)