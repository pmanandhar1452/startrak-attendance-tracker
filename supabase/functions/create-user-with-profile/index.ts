import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'parent' | 'instructor'
  linkedStudentIds?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: CreateUserRequest = await req.json()

    // Validate
    if (!body.email?.trim() || !body.password?.trim() || !body.fullName?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: corsHeaders, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if user already exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError
    if (users.users.find(u => u.email === body.email.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already exists' }),
        { headers: corsHeaders, status: 409 }
      )
    }

    // Call stored procedure
    const { data, error } = await supabase.rpc('create_user_with_profile', {
      p_email: body.email.trim(),
      p_password: body.password.trim(),
      p_full_name: body.fullName.trim(),
      p_role: body.role,
      p_linked_student_ids: body.linkedStudentIds ?? null
    })

    if (error || !data?.success) {
      return new Response(
        JSON.stringify({ success: false, error: data?.error || error.message }),
        { headers: corsHeaders, status: 400 }
      )
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
