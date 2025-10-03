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
    const requestData: CreateUserRequest = await req.json()

    // ✅ Validate input
    if (!requestData.email?.trim() || !requestData.password?.trim() || !requestData.fullName?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and full name are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ✅ Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ Call RPC directly (no auth.admin.createUser anymore)
    const { data, error } = await supabase.rpc('create_user_with_profile', {
      email: requestData.email.trim(),
      password: requestData.password.trim(),
      full_name: requestData.fullName.trim(),
      role_name: requestData.role,
      linked_student_ids: requestData.linkedStudentIds || []
    })

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
