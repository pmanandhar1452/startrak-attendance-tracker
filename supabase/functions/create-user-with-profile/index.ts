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

    // ✅ Step 1: Validate input
    if (!requestData.email?.trim() || !requestData.password?.trim() || !requestData.fullName?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and full name are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ✅ Step 2: Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ Step 3: Create Auth user (so it shows in Supabase Dashboard)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email.trim(),
      password: requestData.password.trim(),
      email_confirm: true,
      user_metadata: {
        full_name: requestData.fullName.trim(),
        role_name: requestData.role
      }
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: authError?.message || 'Failed to create auth user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ✅ Step 4: Call stored procedure (handles DB inserts + rollback safety)
    const { data: userResult, error: rpcError } = await supabase.rpc(
      'create_user_with_profile',
      {
        p_user_id: authData.user.id,
        p_full_name: requestData.fullName.trim(),
        p_role_name: requestData.role,
        p_linked_students: requestData.linkedStudentIds || []
      }
    )

    if (rpcError) {
      // Cleanup if DB setup fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ success: false, error: rpcError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ✅ Step 5: Return success
    return new Response(
      JSON.stringify({ success: true, user: authData.user, profile: userResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
