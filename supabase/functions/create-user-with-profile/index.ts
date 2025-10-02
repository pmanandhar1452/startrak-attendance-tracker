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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Edge Function Start ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    console.log('Parsing request body...')
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
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing required environment variables' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Supabase client initialized')
    console.log('Creating auth user with email:', requestData.email.trim())

    // Step 1a: Check if user already exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(requestData.email.trim())
    
    if (existingUser && !getUserError) {
      console.log('User already exists with email:', requestData.email.trim())
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `A user with email address "${requestData.email.trim()}" already exists. Please use a different email address or contact an administrator if you need to update an existing user.` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // Conflict status code
        }
      )
    }

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
      console.error('Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        code: authError.code
      })
      
      // Handle specific error cases
      if (authError.code === 'email_exists' || authError.message?.includes('already been registered')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `A user with email address "${requestData.email.trim()}" already exists. Please use a different email address.` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // Conflict status code
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create auth user: ${authError.message}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: authError.status || 400,
        }
      )
    }

    if (!authData.user) {
      console.error('No user data returned from auth creation')
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
    console.log('Looking up role:', requestData.role)
    let roleData
    const { data: existingRole, error: roleError } = await supabase
      .from('roles')
      .select('id, role_name')
      .eq('role_name', requestData.role)
      .single()

    if (roleError && roleError.code === 'PGRST116') {
      // Role doesn't exist, create it
      console.log('Role does not exist, creating:', requestData.role)
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({ role_name: requestData.role })
        .select('id, role_name')
        .single()
      
      if (createRoleError) {
        console.error('Role creation failed:', createRoleError)
        console.error('Role creation error details:', {
          message: createRoleError.message,
          code: createRoleError.code,
          details: createRoleError.details
        })
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
      console.error('Role fetch error details:', {
        message: roleError.message,
        code: roleError.code,
        details: roleError.details
      })
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
    console.log('Creating user profile...')
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
      console.error('Profile creation error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      })
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
      console.log('Creating parent record...')
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
        console.error('Parent creation error details:', {
          message: parentError.message,
          code: parentError.code,
          details: parentError.details
        })
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
        console.log('Linking students:', requestData.linkedStudentIds)
        const linkInserts = requestData.linkedStudentIds.map(studentId => ({
          student_id: studentId,
          parent_id: newParentData.id
        }))

        const { error: linkError } = await supabase
          .from('student_parent_link')
          .insert(linkInserts)

        if (linkError) {
          console.error('Student linking failed:', linkError)
          console.error('Student linking error details:', {
            message: linkError.message,
            code: linkError.code,
            details: linkError.details
          })
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
    console.log('Creating audit log...')
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
      console.log('Audit log created successfully')
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
    console.log('=== Edge Function Success ===')

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Unexpected error in user creation:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    })
    console.log('=== Edge Function Error ===')
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