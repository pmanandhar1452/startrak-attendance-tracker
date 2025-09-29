import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

interface CreateUserResponse {
  success: boolean
  user?: any
  parent?: any
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: CreateUserRequest = await req.json()
    
    console.log('Received user creation request:', {
      email: requestData.email,
      fullName: requestData.fullName,
      role: requestData.role,
      hasLinkedStudents: requestData.linkedStudentIds?.length || 0
    })

    // Validate required fields
    if (!requestData.email || !requestData.email.trim()) {
      console.error('Email is missing or empty:', requestData.email)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email address is required and cannot be empty' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!requestData.fullName || !requestData.fullName.trim()) {
      console.error('Full name is missing or empty:', requestData.fullName)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Full name is required and cannot be empty' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!requestData.password || !requestData.password.trim()) {
      console.error('Password is missing or empty:', requestData.password)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Password is required and cannot be empty' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Creating auth user with email:', requestData.email.trim())

    // Step 1: Create auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email.trim(),
      password: requestData.password.trim(),
      email_confirm: true,
      user_metadata: {
        full_name: requestData.fullName.trim()
      }
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create auth user: ${authError.message}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create user - no user data returned' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Step 2: Get or create role
    let roleData
    const { data: existingRole, error: roleError } = await supabase
      .from('roles')
      .select('id, role_name')
      .eq('role_name', requestData.role)
      .single()

    if (roleError && roleError.code === 'PGRST116') {
      // Role doesn't exist, create it
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({ role_name: requestData.role })
        .select('id, role_name')
        .single()
      
      if (createRoleError) {
        console.error('Role creation failed:', createRoleError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to create role: ${createRoleError.message}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }
      roleData = newRole
    } else if (roleError) {
      console.error('Role fetch failed:', roleError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to find role: ${roleError.message}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    } else {
      roleData = existingRole
    }

    console.log('Role resolved:', roleData)

    // Step 3: Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: requestData.fullName,
        role_id: roleData.id
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create user profile: ${profileError.message}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('User profile created successfully')

    let parentData = null

    // Step 4: If creating a parent, create parent record and link to students
    if (roleData.role_name === 'parent') {
      // Generate QR code
      const qrCode = `QR_${Math.random().toString(36).substr(2, 8).toUpperCase()}`

      // Create parent record
      const { data: newParentData, error: parentError } = await supabase
        .from('parents')
        .insert({
          user_id: authData.user.id,
          qr_code: qrCode
        })
        .select()
        .single()

      if (parentError) {
        console.error('Parent creation failed:', parentError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to create parent record: ${parentError.message}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      parentData = newParentData
      console.log('Parent record created successfully')

      // Link to students if provided
      if (requestData.linkedStudentIds && requestData.linkedStudentIds.length > 0) {
        const linkInserts = requestData.linkedStudentIds.map(studentId => ({
          student_id: studentId,
          parent_id: newParentData.id
        }))

        const { error: linkError } = await supabase
          .from('student_parent_link')
          .insert(linkInserts)

        if (linkError) {
          console.error('Student linking failed:', linkError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to link students: ${linkError.message}` 
            }),
            {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
            }
          )
        }

        console.log('Students linked successfully')
      }
    }

    // Step 5: Create audit log
    try {
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'user_profiles',
          record_id: authData.user.id,
          action: 'INSERT',
          old_values: null,
          new_values: {
            full_name: requestData.fullName,
            role_name: roleData.role_name,
            email: requestData.email
          },
          changed_by: null, // System created
          ip_address: null,
          user_agent: req.headers.get('user-agent') || null
        })
    } catch (auditError) {
      console.warn('Audit log creation failed:', auditError)
      // Don't fail the entire operation for audit log issues
    }

    const response: CreateUserResponse = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_metadata: authData.user.user_metadata
      },
      parent: parentData ? {
        id: parentData.id,
        userId: parentData.user_id,
        qrCode: parentData.qr_code,
        createdAt: parentData.created_at,
        updatedAt: parentData.updated_at
      } : undefined
    }

    console.log('User creation completed successfully')

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Unexpected error in user creation:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unexpected error: ${error.message}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})